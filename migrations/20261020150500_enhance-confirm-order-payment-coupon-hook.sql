-- =============================================================================
-- TH3EE ATELIER — Database Migration: Integrate Coupon Commit in confirm_order_payment
-- Migration: 20261020150500_enhance-confirm-order-payment-coupon-hook.sql
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
  v_order record;
BEGIN
  -- 1. Locate real order UUID
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_number
  LIMIT 1;

  IF v_order IS NULL THEN
    RETURN false;
  END IF;

  v_real_order_id := v_order.id;

  -- 2. Update order payment status (using 'confirmed' to satisfy orders_order_status_check)
  UPDATE public.orders
  SET payment_status = 'paid',
      order_status = 'confirmed',
      delivery_status = 'Order confirmed',
      razorpay_order_id = COALESCE(p_provider_order_id, razorpay_order_id),
      razorpay_payment_id = COALESCE(p_payment_id, razorpay_payment_id),
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
  IF NOT EXISTS (SELECT 1 FROM public.order_tracking_events WHERE order_id = v_real_order_id AND status = 'order_placed') THEN
    INSERT INTO public.order_tracking_events (order_id, status, title, message, created_at)
    VALUES (v_real_order_id, 'order_placed', 'Order Placed', 'Your order was successfully registered with TH3EE Atelier.', now() - interval '1 second');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.order_tracking_events WHERE order_id = v_real_order_id AND status = 'payment_confirmed') THEN
    INSERT INTO public.order_tracking_events (order_id, status, title, message, created_at)
    VALUES (v_real_order_id, 'payment_confirmed', 'Payment Confirmed', 'Payment verified securely via Razorpay Test Gateway.', now());
  END IF;

  -- 5. ATOMIC COUPON REDEMPTION COMMIT: If order used a coupon, commit redemption now!
  IF v_order.coupon_code IS NOT NULL AND trim(v_order.coupon_code) != '' THEN
    PERFORM public.commit_coupon_redemption(
      v_real_order_id,
      v_order.order_number,
      v_order.coupon_code,
      v_order.customer_id,
      v_order.customer_email,
      COALESCE(v_order.discount_amount, 0)
    );
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.confirm_order_payment(uuid, text, text, text, numeric) TO anon, authenticated;
