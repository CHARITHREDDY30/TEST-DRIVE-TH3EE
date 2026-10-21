-- =============================================================================
-- TH3EE ATELIER — Database Migration: Strictly Enforce Lifetime Single-Use Coupon Per Account
-- Migration: 20261021094000_strictly-enforce-lifetime-single-coupon-per-account.sql
-- =============================================================================

-- 1. Backfill any historical orders that used coupons into coupon_redemptions
INSERT INTO public.coupon_redemptions (
  coupon_id,
  coupon_code,
  customer_id,
  customer_email,
  order_id,
  order_number,
  discount_amount,
  status,
  redeemed_at,
  created_at,
  updated_at
)
SELECT 
  c.id AS coupon_id,
  upper(trim(o.coupon_code)) AS coupon_code,
  o.customer_id,
  lower(trim(COALESCE(o.customer_email, ''))),
  o.id AS order_id,
  o.order_number,
  COALESCE(o.discount_amount, 0),
  'completed' AS status,
  COALESCE(o.created_at, now()) AS redeemed_at,
  COALESCE(o.created_at, now()) AS created_at,
  now() AS updated_at
FROM public.orders o
JOIN public.coupons c ON upper(trim(c.code)) = upper(trim(o.coupon_code))
WHERE o.coupon_code IS NOT NULL 
  AND trim(o.coupon_code) != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.coupon_redemptions r
    WHERE r.order_id = o.id AND r.coupon_id = c.id
  )
ON CONFLICT DO NOTHING;

-- 2. Enhanced validate_coupon_for_customer with strict cross-table lifetime checks
CREATE OR REPLACE FUNCTION public.validate_coupon_for_customer(
  p_coupon_code text,
  p_subtotal numeric,
  p_customer_id uuid DEFAULT NULL,
  p_customer_email text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_coupon record;
  v_clean_code text;
  v_clean_email text;
  v_resolved_email text := '';
  v_resolved_customer_id uuid := p_customer_id;
  v_discount numeric := 0;
  v_already_redeemed boolean := false;
BEGIN
  v_clean_code := upper(trim(p_coupon_code));
  v_clean_email := lower(trim(COALESCE(p_customer_email, '')));

  -- 1. Fetch coupon definition
  SELECT * INTO v_coupon 
  FROM public.coupons 
  WHERE upper(code) = v_clean_code AND is_active = true 
  LIMIT 1;

  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'code', v_clean_code,
      'error', 'Invalid or inactive promotional code.'
    );
  END IF;

  -- 2. Resolve additional identifiers if available
  IF v_clean_email != '' THEN
    v_resolved_email := v_clean_email;
  END IF;

  IF v_resolved_customer_id IS NOT NULL AND v_resolved_email = '' THEN
    SELECT lower(trim(email)) INTO v_resolved_email
    FROM public.customers
    WHERE id = v_resolved_customer_id OR auth_user_id = v_resolved_customer_id
    LIMIT 1;
  END IF;

  IF v_resolved_email IS NOT NULL AND v_resolved_email != '' AND v_resolved_customer_id IS NULL THEN
    SELECT id INTO v_resolved_customer_id
    FROM public.customers
    WHERE lower(trim(email)) = v_resolved_email
    LIMIT 1;
  END IF;

  -- 3. Strict Lifetime Single-Use Check
  -- Check 3a: coupon_redemptions ledger
  IF v_resolved_customer_id IS NOT NULL OR (v_resolved_email IS NOT NULL AND v_resolved_email != '') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.coupon_redemptions
      WHERE coupon_id = v_coupon.id 
        AND (
          (v_resolved_customer_id IS NOT NULL AND customer_id = v_resolved_customer_id)
          OR (v_resolved_email IS NOT NULL AND v_resolved_email != '' AND lower(trim(customer_email)) = v_resolved_email)
        )
    ) INTO v_already_redeemed;

    -- Check 3b: Any previous orders placed with this coupon by this account (lifetime safeguard)
    IF NOT v_already_redeemed THEN
      SELECT EXISTS (
        SELECT 1 FROM public.orders
        WHERE upper(trim(COALESCE(coupon_code, ''))) = v_clean_code
          AND (
            (v_resolved_customer_id IS NOT NULL AND customer_id = v_resolved_customer_id)
            OR (v_resolved_email IS NOT NULL AND v_resolved_email != '' AND lower(trim(COALESCE(customer_email, ''))) = v_resolved_email)
          )
      ) INTO v_already_redeemed;
    END IF;

    IF v_already_redeemed THEN
      RETURN jsonb_build_object(
        'valid', false,
        'code', v_clean_code,
        'already_redeemed', true,
        'error', 'You''ve already used this coupon on your account.'
      );
    END IF;
  END IF;

  -- 4. Check minimum order amount requirement
  IF v_coupon.minimum_order_amount IS NOT NULL AND p_subtotal < v_coupon.minimum_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'code', v_clean_code,
      'error', 'Minimum cart value of ₹' || v_coupon.minimum_order_amount::text || ' required for this coupon.'
    );
  END IF;

  -- 5. Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := round((p_subtotal * v_coupon.discount_value / 100.0), 2);
    IF v_coupon.maximum_discount IS NOT NULL AND v_discount > v_coupon.maximum_discount THEN
      v_discount := v_coupon.maximum_discount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  IF v_discount > p_subtotal THEN
    v_discount := p_subtotal;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_clean_code,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'description', v_coupon.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_coupon_for_customer(text, numeric, uuid, text) TO anon, authenticated;
