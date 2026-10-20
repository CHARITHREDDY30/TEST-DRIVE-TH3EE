-- =============================================================================
-- TH3EE ATELIER — Database Migration: Safe Customer Ensure RPC Function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.ensure_customer(
  p_user_id uuid,
  p_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
  v_auth_user_id uuid := NULL;
BEGIN
  -- 1. Check if customer already exists by id or auth_user_id
  SELECT id INTO v_id FROM public.customers
  WHERE id = p_user_id OR (auth_user_id IS NOT NULL AND auth_user_id = p_user_id)
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- Update name or phone if currently empty or default placeholder
    UPDATE public.customers
    SET full_name = CASE 
            WHEN (full_name = 'Customer' OR full_name IS NULL) AND p_name IS NOT NULL AND p_name <> '' 
            THEN p_name 
            ELSE full_name 
        END,
        phone = CASE 
            WHEN (phone IS NULL OR phone = '') AND p_phone IS NOT NULL AND p_phone <> '' 
            THEN p_phone 
            ELSE phone 
        END,
        email = COALESCE(email, p_email),
        updated_at = now()
    WHERE id = v_id;
    RETURN v_id;
  END IF;

  -- 2. Verify if p_user_id exists in auth.users before setting foreign key
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    v_auth_user_id := p_user_id;
  ELSE
    v_auth_user_id := NULL;
  END IF;

  -- 3. Insert customer record with id = p_user_id
  IF v_auth_user_id IS NOT NULL THEN
    INSERT INTO public.customers (id, auth_user_id, full_name, email, phone, created_at, updated_at)
    VALUES (
      p_user_id,
      v_auth_user_id,
      COALESCE(NULLIF(p_name, ''), 'Customer'),
      p_email,
      p_phone,
      now(),
      now()
    )
    ON CONFLICT (auth_user_id) DO UPDATE
    SET full_name = CASE 
            WHEN (public.customers.full_name = 'Customer' OR public.customers.full_name IS NULL) AND EXCLUDED.full_name <> '' 
            THEN EXCLUDED.full_name 
            ELSE public.customers.full_name 
        END,
        updated_at = now()
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.customers (id, auth_user_id, full_name, email, phone, created_at, updated_at)
    VALUES (
      p_user_id,
      NULL,
      COALESCE(NULLIF(p_name, ''), 'Customer'),
      p_email,
      p_phone,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = CASE 
            WHEN (public.customers.full_name = 'Customer' OR public.customers.full_name IS NULL) AND EXCLUDED.full_name <> '' 
            THEN EXCLUDED.full_name 
            ELSE public.customers.full_name 
        END,
        updated_at = now()
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.ensure_customer(uuid, text, text, text) TO anon, authenticated;

-- Allow insert by anon/authenticated during checkout
DROP POLICY IF EXISTS "Customers insert own profile" ON public.customers;
CREATE POLICY "Customers insert own profile" ON public.customers
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
