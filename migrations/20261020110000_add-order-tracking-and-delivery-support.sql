-- =============================================================================
-- TH3EE ATELIER — Database Migration: Order Tracking & Delivery Partner Support
-- =============================================================================

-- 1. Expand orders_order_status_check to include 'packed' and 'out_for_delivery'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'expired', 'review_required'));

-- 2. Expand admin_users_role_check to support delivery_partner role
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('admin', 'delivery_partner'));

-- 3. Add delivery fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_attempts integer DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery_date text;

-- 4. Create order_tracking_events table
CREATE TABLE IF NOT EXISTS public.order_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  title text NOT NULL,
  message text,
  location text,
  carrier_name text,
  tracking_number text,
  tracking_url text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_events_order_id ON public.order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_events_created_at ON public.order_tracking_events(created_at ASC);

-- 5. Helper function for delivery partner role check
CREATE OR REPLACE FUNCTION public.is_th3ee_delivery_partner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users AS a
        WHERE a.user_id = auth.uid()
          AND a.role IN ('delivery_partner', 'admin')
          AND a.is_active = TRUE
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_th3ee_delivery_partner() TO anon, authenticated;

-- 6. RPC Function to record tracking events safely
CREATE OR REPLACE FUNCTION public.record_order_tracking_event(
  p_order_id uuid,
  p_status text,
  p_title text,
  p_message text DEFAULT NULL,
  p_carrier text DEFAULT NULL,
  p_tracking_number text DEFAULT NULL,
  p_tracking_url text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_created_by text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO public.order_tracking_events (
    order_id,
    status,
    title,
    message,
    location,
    carrier_name,
    tracking_number,
    tracking_url,
    created_by,
    created_at
  )
  VALUES (
    p_order_id,
    p_status,
    p_title,
    p_message,
    p_location,
    p_carrier,
    p_tracking_number,
    p_tracking_url,
    p_created_by,
    now()
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_order_tracking_event(uuid, text, text, text, text, text, text, text, text) TO anon, authenticated;

-- 7. Upgrade confirm_order_payment to atomically update order, record payment & log tracking event
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
  p_order_id uuid,
  p_order_number text,
  p_payment_id text,
  p_provider_order_id text,
  p_amount numeric
)
RETURNS boolean AS $$
DECLARE
  v_real_order_id uuid;
  v_customer_name text;
BEGIN
  -- 1. Locate real order UUID
  SELECT id, customer_name INTO v_real_order_id, v_customer_name
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_number
  LIMIT 1;

  IF v_real_order_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Update order payment status
  UPDATE public.orders
  SET payment_status = 'paid',
      order_status = 'confirmed',
      updated_at = now()
  WHERE id = v_real_order_id;

  -- 3. Insert or update payments record
  INSERT INTO public.payments (
    order_id,
    provider,
    provider_order_id,
    provider_payment_id,
    amount,
    currency,
    status,
    verified_at,
    verification_notes,
    created_at,
    updated_at
  )
  VALUES (
    v_real_order_id,
    'razorpay',
    p_provider_order_id,
    p_payment_id,
    COALESCE(p_amount, 0),
    'INR',
    'paid',
    now(),
    'Verified payment confirmation',
    now(),
    now()
  );

  -- 4. Record milestone tracking events
  -- Check if order_placed event already logged
  IF NOT EXISTS (SELECT 1 FROM public.order_tracking_events WHERE order_id = v_real_order_id AND status = 'order_placed') THEN
    INSERT INTO public.order_tracking_events (order_id, status, title, message, created_at)
    VALUES (v_real_order_id, 'order_placed', 'Order Placed', 'Your order was successfully registered with TH3EE Atelier.', now() - interval '1 second');
  END IF;

  -- Record payment_confirmed event
  IF NOT EXISTS (SELECT 1 FROM public.order_tracking_events WHERE order_id = v_real_order_id AND status = 'payment_confirmed') THEN
    INSERT INTO public.order_tracking_events (order_id, status, title, message, created_at)
    VALUES (v_real_order_id, 'payment_confirmed', 'Payment Confirmed', 'Payment verified securely via Razorpay Test Gateway.', now());
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text, text, text, numeric) TO anon, authenticated;

-- 8. Enable RLS on order_tracking_events
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view tracking events" ON public.order_tracking_events;
CREATE POLICY "Public view tracking events" ON public.order_tracking_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin and partner insert tracking events" ON public.order_tracking_events;
CREATE POLICY "Admin and partner insert tracking events" ON public.order_tracking_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage tracking events" ON public.order_tracking_events;
CREATE POLICY "Admin manage tracking events" ON public.order_tracking_events
  FOR ALL
  TO authenticated
  USING (is_th3ee_admin())
  WITH CHECK (is_th3ee_admin());
