-- =============================================================================
-- TH3EE ATELIER — Database Migration: Enhance Order Management & Admin Integration
-- =============================================================================

-- 1. Add delivery_status and payment reference fields to public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'Order confirmed';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

-- 2. Add image_url to public.order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Backfill delivery_status for existing orders
UPDATE public.orders
SET delivery_status = CASE
  WHEN order_status = 'delivered' THEN 'Delivered'
  WHEN order_status = 'out_for_delivery' THEN 'Out for delivery'
  WHEN order_status = 'shipped' THEN 'Shipped'
  WHEN order_status = 'packed' THEN 'Packed'
  WHEN order_status = 'processing' THEN 'Processing'
  WHEN order_status = 'cancelled' THEN 'Cancelled'
  ELSE 'Order confirmed'
END
WHERE delivery_status IS NULL;

-- 4. Update confirm_order_payment RPC to populate payment reference & delivery status idempotently
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
  v_existing_status text;
BEGIN
  -- 1. Locate real order UUID
  SELECT id, customer_name, payment_status INTO v_real_order_id, v_customer_name, v_existing_status
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_number
  LIMIT 1;

  IF v_real_order_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Idempotency check: if already paid, ensure payment references exist and return true
  IF v_existing_status = 'paid' THEN
    UPDATE public.orders
    SET razorpay_order_id = COALESCE(razorpay_order_id, p_provider_order_id),
        razorpay_payment_id = COALESCE(razorpay_payment_id, p_payment_id),
        updated_at = now()
    WHERE id = v_real_order_id;
    RETURN true;
  END IF;

  -- 3. Update order payment status (independent of delivery status)
  UPDATE public.orders
  SET payment_status = 'paid',
      order_status = 'confirmed',
      delivery_status = COALESCE(delivery_status, 'Order confirmed'),
      razorpay_order_id = p_provider_order_id,
      razorpay_payment_id = p_payment_id,
      updated_at = now()
  WHERE id = v_real_order_id;

  -- 4. Insert or update payments record
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

  -- 5. Record milestone tracking events
  IF NOT EXISTS (SELECT 1 FROM public.order_tracking_events WHERE order_id = v_real_order_id AND status = 'order_placed') THEN
    INSERT INTO public.order_tracking_events (order_id, status, title, message, created_at)
    VALUES (v_real_order_id, 'order_placed', 'Order Placed', 'Your order was successfully registered with TH3EE Atelier.', now() - interval '1 second');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.order_tracking_events WHERE order_id = v_real_order_id AND status = 'payment_confirmed') THEN
    INSERT INTO public.order_tracking_events (order_id, status, title, message, created_at)
    VALUES (v_real_order_id, 'payment_confirmed', 'Payment Confirmed', 'Payment verified securely via Razorpay Test Gateway.', now());
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text, text, text, numeric) TO anon, authenticated;

-- 5. Update RLS policies to allow admins and delivery partners appropriate order access
DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;
CREATE POLICY "Customers read own orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR lower(customer_email) = lower(auth.jwt()->>'email')
        OR is_th3ee_admin()
        OR (is_th3ee_delivery_partner() AND (delivery_partner_id = auth.uid() OR delivery_partner_id IS NULL))
    );

DROP POLICY IF EXISTS "Customers read own order items" ON public.order_items;
CREATE POLICY "Customers read own order items" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        is_th3ee_admin()
        OR EXISTS (
            SELECT 1 FROM public.orders AS o
            WHERE o.id = order_items.order_id
              AND (
                  o.customer_id = auth.uid()
                  OR lower(o.customer_email) = lower(auth.jwt()->>'email')
                  OR (is_th3ee_delivery_partner() AND (o.delivery_partner_id = auth.uid() OR o.delivery_partner_id IS NULL))
              )
        )
    );

-- 6. Update get_order_by_identifier RPC to return full order, items, and payment info
CREATE OR REPLACE FUNCTION public.get_order_by_identifier(p_identifier text)
RETURNS jsonb AS $$
DECLARE
  v_res jsonb;
BEGIN
  SELECT to_jsonb(o.*) || jsonb_build_object(
    'order_items', COALESCE((
      SELECT jsonb_agg(to_jsonb(oi.*))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::jsonb),
    'payments', COALESCE((
      SELECT jsonb_agg(to_jsonb(p.*))
      FROM public.payments p
      WHERE p.order_id = o.id
    ), '[]'::jsonb)
  ) INTO v_res
  FROM public.orders o
  WHERE o.order_number = p_identifier
     OR (p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND o.id = p_identifier::uuid)
  LIMIT 1;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_order_by_identifier(text) TO anon, authenticated;
