-- =============================================================================
-- TH3EE ATELIER — PRODUCTION COUPON REDEMPTION & LOYALTY CLUB LEDGER
-- Migration: 20261020150000_coupon_security_and_loyalty_club.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. COUPON REDEMPTIONS LEDGER
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  coupon_code text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'completed', -- 'completed', 'reversed'
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  reversal_ref text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate redemptions for same customer + coupon
CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_cust_coupon_uniq 
ON public.coupon_redemptions(customer_id, coupon_id) 
WHERE status = 'completed' AND customer_id IS NOT NULL;

-- Unique index for customer email + coupon
CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_email_coupon_uniq 
ON public.coupon_redemptions(lower(customer_email), coupon_id) 
WHERE status = 'completed';

-- Enable RLS
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own coupon redemptions" ON public.coupon_redemptions;
CREATE POLICY "Customers read own coupon redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid() 
    OR lower(customer_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Public service role coupon redemptions" ON public.coupon_redemptions;
CREATE POLICY "Public service role coupon redemptions" ON public.coupon_redemptions
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2. LOYALTY PROGRAMME LEDGERS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.loyalty_reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_code text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  reward_title text NOT NULL DEFAULT 'Free TH3EE Cult T-Shirt',
  reward_type text NOT NULL DEFAULT 'free_tshirt',
  selected_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  selected_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  selected_product_name text,
  selected_size text,
  selected_color text,
  shipping_address jsonb,
  stamps_consumed integer NOT NULL DEFAULT 7,
  status text NOT NULL DEFAULT 'claimed', -- 'claimed', 'processing', 'fulfilled', 'cancelled'
  fulfilled_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  admin_notes text,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  fulfilled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  order_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL, -- exactly 12 calendar months from earned_at
  status text NOT NULL DEFAULT 'active', -- 'active', 'consumed', 'expired', 'reversed'
  reward_claim_id uuid REFERENCES public.loyalty_reward_claims(id) ON DELETE SET NULL,
  reversal_ref text,
  notes text,
  celebration_acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_value text,
  new_value text,
  reason text NOT NULL,
  performed_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast loyalty balance queries
CREATE INDEX IF NOT EXISTS loyalty_stamps_cust_status_idx 
ON public.loyalty_stamps(customer_id, status, expires_at);

CREATE INDEX IF NOT EXISTS loyalty_stamps_email_status_idx 
ON public.loyalty_stamps(lower(customer_email), status, expires_at);

-- Enable RLS
ALTER TABLE public.loyalty_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own loyalty stamps" ON public.loyalty_stamps;
CREATE POLICY "Customers read own loyalty stamps" ON public.loyalty_stamps
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid() 
    OR lower(customer_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Public service role loyalty stamps" ON public.loyalty_stamps;
CREATE POLICY "Public service role loyalty stamps" ON public.loyalty_stamps
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers read own reward claims" ON public.loyalty_reward_claims;
CREATE POLICY "Customers read own reward claims" ON public.loyalty_reward_claims
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid() 
    OR lower(customer_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Public service role loyalty claims" ON public.loyalty_reward_claims;
CREATE POLICY "Public service role loyalty claims" ON public.loyalty_reward_claims
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public service role loyalty audit" ON public.loyalty_audit_logs;
CREATE POLICY "Public service role loyalty audit" ON public.loyalty_audit_logs
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3. COUPON VALIDATION & COMMIT RPC FUNCTIONS
-- -----------------------------------------------------------------------------

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
  v_discount numeric := 0;
  v_already_redeemed boolean := false;
  v_clean_email text;
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

  -- 2. Check if customer has already successfully redeemed this coupon
  IF p_customer_id IS NOT NULL OR v_clean_email != '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.coupon_redemptions
      WHERE coupon_id = v_coupon.id 
        AND status = 'completed'
        AND (
          (p_customer_id IS NOT NULL AND customer_id = p_customer_id)
          OR (v_clean_email != '' AND lower(customer_email) = v_clean_email)
        )
    ) INTO v_already_redeemed;

    IF v_already_redeemed THEN
      RETURN jsonb_build_object(
        'valid', false,
        'code', v_clean_code,
        'already_redeemed', true,
        'error', 'You''ve already used this coupon on your account.'
      );
    END IF;
  END IF;

  -- 3. Check minimum order amount requirement
  IF v_coupon.minimum_order_amount IS NOT NULL AND p_subtotal < v_coupon.minimum_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'code', v_clean_code,
      'error', 'Minimum cart value of ₹' || v_coupon.minimum_order_amount::text || ' required for this coupon.'
    );
  END IF;

  -- 4. Calculate discount
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

-- Atomically commit coupon redemption upon verified payment
CREATE OR REPLACE FUNCTION public.commit_coupon_redemption(
  p_order_id uuid,
  p_order_number text,
  p_coupon_code text,
  p_customer_id uuid,
  p_customer_email text,
  p_discount_amount numeric
)
RETURNS jsonb AS $$
DECLARE
  v_coupon record;
  v_clean_code text;
  v_clean_email text;
  v_existing_id uuid;
BEGIN
  v_clean_code := upper(trim(p_coupon_code));
  v_clean_email := lower(trim(COALESCE(p_customer_email, '')));

  IF v_clean_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No coupon code provided');
  END IF;

  -- Fetch coupon
  SELECT * INTO v_coupon FROM public.coupons WHERE upper(code) = v_clean_code LIMIT 1;
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  -- Check if already recorded (idempotency)
  SELECT id INTO v_existing_id 
  FROM public.coupon_redemptions 
  WHERE order_id = p_order_id AND coupon_id = v_coupon.id;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_committed', true, 'redemption_id', v_existing_id);
  END IF;

  -- Insert redemption
  INSERT INTO public.coupon_redemptions (
    coupon_id,
    coupon_code,
    customer_id,
    customer_email,
    order_id,
    order_number,
    discount_amount,
    status,
    redeemed_at
  )
  VALUES (
    v_coupon.id,
    v_clean_code,
    p_customer_id,
    v_clean_email,
    p_order_id,
    p_order_number,
    COALESCE(p_discount_amount, 0),
    'completed',
    now()
  );

  -- Increment coupon usage count
  UPDATE public.coupons 
  SET usage_count = COALESCE(usage_count, 0) + 1, updated_at = now()
  WHERE id = v_coupon.id;

  RETURN jsonb_build_object('success', true, 'committed', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'You''ve already used this coupon on your account.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.commit_coupon_redemption(uuid, text, text, uuid, text, numeric) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. LOYALTY CLUB STAMP & CLAIM RPC FUNCTIONS
-- -----------------------------------------------------------------------------

-- Awards 1 stamp strictly when an order is verified and reaching Delivered status
CREATE OR REPLACE FUNCTION public.award_order_delivery_stamp(
  p_order_id uuid,
  p_actor text DEFAULT 'System'
)
RETURNS jsonb AS $$
DECLARE
  v_order record;
  v_real_customer_id uuid;
  v_customer record;
  v_existing_stamp_id uuid;
  v_new_stamp_id uuid;
  v_earned_at timestamp with time zone := now();
  v_expires_at timestamp with time zone;
BEGIN
  -- 1. Fetch order
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id LIMIT 1;
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- 2. Verify eligibility: must be paid
  IF v_order.payment_status != 'paid' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Order is not paid');
  END IF;

  -- 3. Verify status: must be delivered
  IF lower(v_order.order_status) != 'delivered' AND lower(COALESCE(v_order.delivery_status, '')) != 'delivered' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Order is not delivered');
  END IF;

  -- 4. Check if order has already earned a stamp (Idempotency)
  SELECT id INTO v_existing_stamp_id FROM public.loyalty_stamps WHERE order_id = p_order_id;
  IF v_existing_stamp_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_awarded', true, 'stamp_id', v_existing_stamp_id);
  END IF;

  -- 5. Resolve customer ID (auto-heal or link if needed)
  v_real_customer_id := v_order.customer_id;
  IF v_real_customer_id IS NULL AND v_order.customer_email IS NOT NULL AND v_order.customer_email != '' THEN
    SELECT id INTO v_real_customer_id FROM public.customers WHERE lower(email) = lower(v_order.customer_email) LIMIT 1;
    IF v_real_customer_id IS NULL THEN
      INSERT INTO public.customers (email, full_name, phone)
      VALUES (v_order.customer_email, v_order.customer_name, v_order.customer_phone)
      RETURNING id INTO v_real_customer_id;
    END IF;
  END IF;

  IF v_real_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Could not resolve customer record for order');
  END IF;

  -- 6. Calculate exactly 12 calendar months expiration date
  v_expires_at := v_earned_at + interval '12 months';

  -- 7. Insert Stamp
  INSERT INTO public.loyalty_stamps (
    customer_id,
    customer_email,
    order_id,
    order_number,
    order_amount,
    earned_at,
    expires_at,
    status,
    celebration_acknowledged,
    notes
  )
  VALUES (
    v_real_customer_id,
    v_order.customer_email,
    p_order_id,
    v_order.order_number,
    COALESCE(v_order.total_amount, 0),
    v_earned_at,
    v_expires_at,
    'active',
    false,
    'Awarded upon confirmed delivery by ' || COALESCE(p_actor, 'System')
  )
  RETURNING id INTO v_new_stamp_id;

  -- 8. Log in audit table
  INSERT INTO public.loyalty_audit_logs (
    customer_id,
    action,
    new_value,
    reason,
    performed_by
  )
  VALUES (
    v_real_customer_id,
    'stamp_awarded',
    '1 stamp (Order #' || v_order.order_number || ')',
    'Order delivered successfully',
    COALESCE(p_actor, 'System')
  );

  RETURN jsonb_build_object(
    'success', true,
    'awarded', true,
    'stamp_id', v_new_stamp_id,
    'earned_at', v_earned_at,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.award_order_delivery_stamp(uuid, text) TO anon, authenticated;

-- Customer Loyalty Summary RPC
CREATE OR REPLACE FUNCTION public.get_customer_loyalty_summary(
  p_customer_id uuid DEFAULT NULL,
  p_customer_email text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_clean_email text;
  v_resolved_cust_id uuid := p_customer_id;
  v_active_stamps jsonb;
  v_consumed_stamps jsonb;
  v_expired_stamps jsonb;
  v_active_count integer := 0;
  v_claims jsonb;
  v_unacknowledged_stamp record;
  v_new_stamp_celebration jsonb := NULL;
  v_can_claim boolean := false;
  v_unlocked_rewards_count integer := 0;
BEGIN
  v_clean_email := lower(trim(COALESCE(p_customer_email, '')));

  IF v_resolved_cust_id IS NULL AND v_clean_email != '' THEN
    SELECT id INTO v_resolved_cust_id FROM public.customers WHERE lower(email) = v_clean_email LIMIT 1;
  END IF;

  IF v_resolved_cust_id IS NULL THEN
    RETURN jsonb_build_object(
      'configured', true,
      'authenticated', false,
      'active_stamps_count', 0,
      'stamps_needed_for_reward', 7,
      'can_claim_reward', false,
      'active_stamps', '[]'::jsonb,
      'reward_claims', '[]'::jsonb
    );
  END IF;

  -- Lazily expire stamps that passed their 12 calendar month threshold
  UPDATE public.loyalty_stamps
  SET status = 'expired', updated_at = now()
  WHERE customer_id = v_resolved_cust_id 
    AND status = 'active' 
    AND expires_at < now();

  -- Active unexpired stamps
  SELECT count(*), COALESCE(json_agg(s ORDER BY s.earned_at ASC)::jsonb, '[]'::jsonb)
  INTO v_active_count, v_active_stamps
  FROM (
    SELECT id, order_id, order_number, order_amount, earned_at, expires_at, status, celebration_acknowledged
    FROM public.loyalty_stamps
    WHERE customer_id = v_resolved_cust_id AND status = 'active' AND expires_at >= now()
  ) s;

  -- Check for any newly earned stamp that hasn't been celebrated yet
  SELECT id, order_number, earned_at INTO v_unacknowledged_stamp
  FROM public.loyalty_stamps
  WHERE customer_id = v_resolved_cust_id AND celebration_acknowledged = false AND status = 'active'
  ORDER BY earned_at DESC
  LIMIT 1;

  IF v_unacknowledged_stamp.id IS NOT NULL THEN
    v_new_stamp_celebration := jsonb_build_object(
      'stamp_id', v_unacknowledged_stamp.id,
      'order_number', v_unacknowledged_stamp.order_number,
      'earned_at', v_unacknowledged_stamp.earned_at
    );
  END IF;

  -- Claims history
  SELECT COALESCE(json_agg(c ORDER BY c.claimed_at DESC)::jsonb, '[]'::jsonb)
  INTO v_claims
  FROM (
    SELECT id, claim_code, reward_title, reward_type, selected_product_name, selected_size, selected_color,
           status, claimed_at, fulfilled_at, admin_notes
    FROM public.loyalty_reward_claims
    WHERE customer_id = v_resolved_cust_id
  ) c;

  v_unlocked_rewards_count := v_active_count / 7;
  v_can_claim := (v_active_count >= 7);

  RETURN jsonb_build_object(
    'configured', true,
    'authenticated', true,
    'customer_id', v_resolved_cust_id,
    'active_stamps_count', v_active_count,
    'stamps_needed_for_reward', 7,
    'can_claim_reward', v_can_claim,
    'unlocked_rewards_count', v_unlocked_rewards_count,
    'active_stamps', v_active_stamps,
    'new_stamp_celebration', v_new_stamp_celebration,
    'reward_claims', v_claims
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_customer_loyalty_summary(uuid, text) TO anon, authenticated;

-- Acknowledge celebration animation to prevent replaying on every refresh
CREATE OR REPLACE FUNCTION public.acknowledge_stamp_celebration(p_stamp_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE public.loyalty_stamps
  SET celebration_acknowledged = true, updated_at = now()
  WHERE id = p_stamp_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.acknowledge_stamp_celebration(uuid) TO anon, authenticated;

-- Claim Reward: Atomically consumes exactly 7 stamps and registers claim record
CREATE OR REPLACE FUNCTION public.claim_loyalty_reward(
  p_customer_id uuid,
  p_customer_email text,
  p_product_id uuid,
  p_variant_id uuid,
  p_size text,
  p_color text,
  p_shipping_address jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_claim_id uuid;
  v_claim_code text;
  v_stamp_ids uuid[];
  v_prod_name text := 'TH3EE Cult Oversized Graphic Tee';
  v_active_count integer;
BEGIN
  -- 1. Lock customer's active stamps for update
  SELECT array_agg(id) INTO v_stamp_ids
  FROM (
    SELECT id FROM public.loyalty_stamps
    WHERE customer_id = p_customer_id AND status = 'active' AND expires_at >= now()
    ORDER BY earned_at ASC
    LIMIT 7
    FOR UPDATE
  ) t;

  IF v_stamp_ids IS NULL OR array_length(v_stamp_ids, 1) < 7 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient active stamps. 7 unexpired stamps are required to claim a reward.'
    );
  END IF;

  -- 2. Fetch product name if specified
  IF p_product_id IS NOT NULL THEN
    SELECT name INTO v_prod_name FROM public.products WHERE id = p_product_id;
  END IF;

  -- 3. Generate unique claim code
  v_claim_code := 'TH3EE-RWD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  -- 4. Create Reward Claim record
  INSERT INTO public.loyalty_reward_claims (
    claim_code,
    customer_id,
    customer_email,
    reward_title,
    reward_type,
    selected_product_id,
    selected_variant_id,
    selected_product_name,
    selected_size,
    selected_color,
    shipping_address,
    stamps_consumed,
    status,
    claimed_at
  )
  VALUES (
    v_claim_code,
    p_customer_id,
    p_customer_email,
    'Free TH3EE Reward: ' || COALESCE(v_prod_name, 'Cult T-Shirt'),
    'free_tshirt',
    p_product_id,
    p_variant_id,
    v_prod_name,
    p_size,
    p_color,
    p_shipping_address,
    7,
    'claimed',
    now()
  )
  RETURNING id INTO v_claim_id;

  -- 5. Mark the 7 stamps as consumed
  UPDATE public.loyalty_stamps
  SET status = 'consumed',
      reward_claim_id = v_claim_id,
      updated_at = now()
  WHERE id = ANY(v_stamp_ids);

  -- 6. Audit log
  INSERT INTO public.loyalty_audit_logs (
    customer_id,
    action,
    previous_value,
    new_value,
    reason,
    performed_by
  )
  VALUES (
    p_customer_id,
    'reward_claimed',
    '7 active stamps',
    'Claim #' || v_claim_code,
    'Customer claimed reward: ' || COALESCE(v_prod_name, 'Cult T-Shirt') || ' (' || COALESCE(p_size, 'Std') || ')',
    p_customer_email
  );

  RETURN jsonb_build_object(
    'success', true,
    'claim_id', v_claim_id,
    'claim_code', v_claim_code,
    'product_name', v_prod_name,
    'size', p_size,
    'color', p_color
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.claim_loyalty_reward(uuid, text, uuid, uuid, text, text, jsonb) TO anon, authenticated;

-- Admin Manual Loyalty Stamp Adjustment RPC (Audit Protected)
CREATE OR REPLACE FUNCTION public.admin_adjust_loyalty_stamps(
  p_customer_id uuid,
  p_delta_stamps integer,
  p_reason text,
  p_admin_email text
)
RETURNS jsonb AS $$
DECLARE
  v_customer record;
  v_stamp_id uuid;
  v_dummy_order_id uuid;
  v_removed_count integer := 0;
  i integer;
BEGIN
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'A mandatory reason is required for manual loyalty adjustments.');
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id;
  IF v_customer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found.');
  END IF;

  IF p_delta_stamps > 0 THEN
    -- Add stamps
    FOR i IN 1..p_delta_stamps LOOP
      INSERT INTO public.loyalty_stamps (
        customer_id,
        customer_email,
        order_id,
        order_number,
        order_amount,
        earned_at,
        expires_at,
        status,
        celebration_acknowledged,
        notes
      )
      VALUES (
        p_customer_id,
        v_customer.email,
        NULL,
        'TH3EE-ADMIN-ADJ-' || upper(substr(md5(random()::text), 1, 6)),
        0.00,
        now(),
        now() + interval '12 months',
        'active',
        false,
        'Manual credit: ' || p_reason
      );
    END LOOP;
  ELSIF p_delta_stamps < 0 THEN
    -- Deduct active stamps
    WITH to_reverse AS (
      SELECT id FROM public.loyalty_stamps
      WHERE customer_id = p_customer_id AND status = 'active'
      ORDER BY earned_at DESC
      LIMIT abs(p_delta_stamps)
    )
    UPDATE public.loyalty_stamps
    SET status = 'reversed', reversal_ref = p_reason, updated_at = now()
    WHERE id IN (SELECT id FROM to_reverse);
  END IF;

  -- Record audit log
  INSERT INTO public.loyalty_audit_logs (
    customer_id,
    action,
    new_value,
    reason,
    performed_by
  )
  VALUES (
    p_customer_id,
    'manual_adjustment',
    p_delta_stamps::text || ' stamps',
    p_reason,
    p_admin_email
  );

  RETURN jsonb_build_object('success', true, 'adjusted_by', p_delta_stamps);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_adjust_loyalty_stamps(uuid, integer, text, text) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. HOOK INTO ORDER FULFILLMENT: AUTO-AWARD STAMP UPON DELIVERED
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_order_fulfillment(
  p_identifier text,
  p_status text,
  p_delivery_status text DEFAULT NULL,
  p_shipping_provider text DEFAULT NULL,
  p_tracking_number text DEFAULT NULL,
  p_tracking_url text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_updated_by text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_real_order_id uuid;
  v_db_status text;
  v_deliv_status text;
  v_title text;
  v_message text;
BEGIN
  -- 1. Identify order by UUID or order_number safely
  IF p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_real_order_id FROM public.orders WHERE id = p_identifier::uuid LIMIT 1;
  ELSE
    SELECT id INTO v_real_order_id FROM public.orders WHERE order_number = p_identifier LIMIT 1;
  END IF;

  IF v_real_order_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Normalize status
  v_db_status := lower(regexp_replace(p_status, '\s+', '_', 'g'));
  IF v_db_status = 'in_production' THEN v_db_status := 'processing'; END IF;
  IF v_db_status = 'dispatched' THEN v_db_status := 'shipped'; END IF;

  v_deliv_status := COALESCE(p_delivery_status, p_status);

  -- 3. Update orders table — CRITICAL: NEVER alter payment_status
  UPDATE public.orders
  SET order_status = v_db_status,
      delivery_status = v_deliv_status,
      shipping_provider = COALESCE(p_shipping_provider, shipping_provider),
      tracking_number = COALESCE(p_tracking_number, tracking_number),
      tracking_url = COALESCE(p_tracking_url, tracking_url),
      delivery_notes = COALESCE(p_notes, delivery_notes),
      updated_at = now()
  WHERE id = v_real_order_id;

  -- 4. Formulate milestone title and message
  IF v_db_status = 'confirmed' THEN
    v_title := 'Order Confirmed';
    v_message := COALESCE(p_notes, 'Order is officially confirmed and queued for production in the atelier.');
  ELSIF v_db_status = 'processing' THEN
    v_title := 'Order Processing';
    v_message := COALESCE(p_notes, 'Heavyweight silhouettes are being prepped and inspected at the atelier.');
  ELSIF v_db_status = 'packed' THEN
    v_title := 'Packed & Ready';
    v_message := COALESCE(p_notes, 'Order has been custom packed in signature TH3EE protective casing.');
  ELSIF v_db_status = 'shipped' THEN
    v_title := 'Shipped / Dispatched';
    IF p_shipping_provider IS NOT NULL THEN
      v_message := 'Handed over to ' || p_shipping_provider || '. Tracking #' || COALESCE(p_tracking_number, 'assigned') || '.';
    ELSE
      v_message := COALESCE(p_notes, 'Order has been dispatched from the atelier.');
    END IF;
  ELSIF v_db_status = 'out_for_delivery' THEN
    v_title := 'Out for Delivery';
    v_message := COALESCE(p_notes, 'The courier associate is en route to your destination.');
  ELSIF v_db_status = 'delivered' THEN
    v_title := 'Delivered';
    v_message := COALESCE(p_notes, 'Package successfully delivered and received in pristine condition.');
  ELSIF v_db_status = 'cancelled' THEN
    v_title := 'Order Cancelled';
    v_message := COALESCE(p_notes, 'Order was cancelled by atelier administrator.');
  ELSE
    v_title := 'Status Updated';
    v_message := COALESCE(p_notes, 'Order status updated to ' || p_status || '.');
  END IF;

  -- 5. Insert chronological tracking milestone
  INSERT INTO public.order_tracking_events (
    order_id,
    status,
    title,
    message,
    carrier_name,
    tracking_number,
    tracking_url,
    created_by,
    created_at
  )
  VALUES (
    v_real_order_id,
    v_db_status,
    v_title,
    v_message,
    p_shipping_provider,
    p_tracking_number,
    p_tracking_url,
    p_updated_by,
    now()
  );

  -- 6. CRITICAL LOYALTY INTEGRATION: If delivered, award loyalty stamp
  IF v_db_status = 'delivered' OR lower(v_deliv_status) = 'delivered' THEN
    PERFORM public.award_order_delivery_stamp(v_real_order_id, COALESCE(p_updated_by, 'Atelier Fulfillment'));
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_order_fulfillment(text, text, text, text, text, text, text, text) TO anon, authenticated;
