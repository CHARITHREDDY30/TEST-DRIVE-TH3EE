-- =============================================================================
-- TH3EE ATELIER — Database Migration: Grant Table Permissions for Checkout Flow
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customers TO anon, authenticated;
