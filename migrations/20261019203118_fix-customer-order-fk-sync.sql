-- =============================================================================
-- TH3EE ATELIER — Database Migration: Fix Customer Order Foreign Key & Auto-Sync
-- =============================================================================

-- 1. Backfill any existing auth.users into public.customers where id = auth_user_id = u.id
INSERT INTO public.customers (id, auth_user_id, full_name, email, phone, created_at, updated_at)
SELECT
    u.id,
    u.id,
    COALESCE(u.profile->>'name', u.profile->>'full_name', 'Customer'),
    u.email,
    COALESCE(u.profile->>'phone', ''),
    u.created_at,
    now()
FROM auth.users u
ON CONFLICT (auth_user_id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = CASE 
        WHEN public.customers.full_name = 'Customer' AND EXCLUDED.full_name <> 'Customer' 
        THEN EXCLUDED.full_name 
        ELSE public.customers.full_name 
    END,
    updated_at = now();

-- 2. Trigger function to automatically maintain customers table whenever auth.users is created or updated
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.customers (id, auth_user_id, full_name, email, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.profile->>'name', NEW.profile->>'full_name', 'Customer'),
    NEW.email,
    COALESCE(NEW.profile->>'phone', ''),
    NEW.created_at,
    now()
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = CASE 
          WHEN public.customers.full_name = 'Customer' AND EXCLUDED.full_name <> 'Customer' 
          THEN EXCLUDED.full_name 
          ELSE public.customers.full_name 
      END,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF profile, email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure customers table RLS policies
DROP POLICY IF EXISTS "Customers insert own profile" ON public.customers;
CREATE POLICY "Customers insert own profile" ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Customers read own profile" ON public.customers;
CREATE POLICY "Customers read own profile" ON public.customers
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Customers update own profile" ON public.customers;
CREATE POLICY "Customers update own profile" ON public.customers
    FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());
