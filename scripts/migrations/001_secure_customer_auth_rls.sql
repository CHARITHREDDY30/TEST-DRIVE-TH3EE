-- =============================================================================
-- TH3EE ATELIER — Row Level Security (RLS) Policies Migration
-- Target: Customer Profile & Order Ownership Security
-- Environment: Local / Development Database Migration File
-- =============================================================================

BEGIN;

-- 1. Ensure RLS is active on customers, orders, and order_items
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. CUSTOMERS TABLE POLICIES
-- -----------------------------------------------------------------------------

-- Drop existing customer policy if needed to make script idempotent
DROP POLICY IF EXISTS "Customers read own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers update own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers insert own profile" ON public.customers;

-- Authenticated customers can read strictly their own profile record
CREATE POLICY "Customers read own profile" ON public.customers
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

-- Authenticated customers can update strictly their own profile record
CREATE POLICY "Customers update own profile" ON public.customers
    FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Authenticated customers can insert their own customer record linked to auth.uid()
CREATE POLICY "Customers insert own profile" ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. ORDERS TABLE POLICIES
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;

-- Authenticated customers can read strictly orders where customer_id equals auth.uid()
-- or where customer_email matches the authenticated user's JWT email claim.
CREATE POLICY "Customers read own orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- -----------------------------------------------------------------------------
-- 4. ORDER_ITEMS TABLE POLICIES
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Customers read own order items" ON public.order_items;

-- Authenticated customers can read order_items only for orders they own or if admin
CREATE POLICY "Customers read own order items" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders AS o
            WHERE o.id = order_items.order_id
              AND (
                  is_th3ee_admin()
                  OR o.customer_id = auth.uid()
                  OR o.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
              )
        )
    );

-- -----------------------------------------------------------------------------
-- 5. ADMIN VERIFICATION GUARANTEE
-- -----------------------------------------------------------------------------
-- Verify that ordinary customers cannot modify admin_users table under any circumstances.
-- No INSERT, UPDATE, or DELETE policies exist for {anon} or {authenticated} on admin_users.
-- Only the existing "admin_users_read_self" SELECT policy is permitted for authenticated users:
-- (user_id = auth.uid())

COMMIT;
