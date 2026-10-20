-- =============================================================================
-- TH3EE ATELIER — Database Migration: Server-Side Confirm Order Payment RPC
-- =============================================================================

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
BEGIN
  -- 1. Locate real order UUID
  SELECT id INTO v_real_order_id
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_number
  LIMIT 1;

  IF v_real_order_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Update order payment status (using 'confirmed' to satisfy orders_order_status_check)
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
    'captured',
    now(),
    'Verified payment confirmation',
    now(),
    now()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text, text, text, numeric) TO anon, authenticated;
