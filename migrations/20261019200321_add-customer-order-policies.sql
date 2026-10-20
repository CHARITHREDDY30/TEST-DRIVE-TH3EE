-- =============================================================================
-- TH3EE ATELIER — Database Migration: Customer & Order RLS Policies + Schema Fix
-- =============================================================================

-- 1. Ensure columns exist on order_items for compatibility
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_title text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal numeric;

-- 2. ORDERS POLICIES
DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;
CREATE POLICY "Customers read own orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid()
        OR lower(customer_email) = lower(auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "Public update order payment" ON public.orders;
CREATE POLICY "Public update order payment" ON public.orders
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. ORDER_ITEMS POLICIES
DROP POLICY IF EXISTS "Customers read own order items" ON public.order_items;
CREATE POLICY "Customers read own order items" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders AS o
            WHERE o.id = order_items.order_id
              AND (
                  o.customer_id = auth.uid()
                  OR lower(o.customer_email) = lower(auth.jwt()->>'email')
              )
        )
    );

-- 4. CUSTOMERS PROFILE POLICIES
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

DROP POLICY IF EXISTS "Customers insert own profile" ON public.customers;
CREATE POLICY "Customers insert own profile" ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

-- 5. PAYMENTS POLICIES
DROP POLICY IF EXISTS "Public record payments" ON public.payments;
CREATE POLICY "Public record payments" ON public.payments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Customers view own payments" ON public.payments;
CREATE POLICY "Customers view own payments" ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders AS o
            WHERE o.id = payments.order_id
              AND (
                  o.customer_id = auth.uid()
                  OR lower(o.customer_email) = lower(auth.jwt()->>'email')
              )
        )
    );
