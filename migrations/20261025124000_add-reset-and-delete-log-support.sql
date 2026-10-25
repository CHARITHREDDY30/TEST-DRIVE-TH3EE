-- Migration: Add Delete Log, Delete Order, and Reset Demo Data RPCs
-- Date: 2026-10-25

-- 1. RPC to delete a single analytics event (demo log)
CREATE OR REPLACE FUNCTION public.delete_analytics_event(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.site_analytics_events WHERE id = p_event_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_analytics_event(uuid) TO anon, authenticated;

-- 2. RPC to clear all site analytics events
CREATE OR REPLACE FUNCTION public.clear_all_analytics_events()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE TABLE public.site_analytics_events;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_all_analytics_events() TO anon, authenticated;

-- 3. RPC to delete a single order (demo order cleanup)
CREATE OR REPLACE FUNCTION public.delete_order_admin(p_order_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_real_id uuid;
BEGIN
  -- Check if UUID or order_number
  IF p_order_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_real_id := p_order_id::uuid;
  ELSE
    SELECT id INTO v_real_id FROM public.orders WHERE order_number = p_order_id LIMIT 1;
  END IF;

  IF v_real_id IS NOT NULL THEN
    -- Clean up dependent records safely
    DELETE FROM public.loyalty_reward_claims WHERE fulfilled_order_id = v_real_id;
    DELETE FROM public.loyalty_stamps WHERE order_id = v_real_id;
    DELETE FROM public.coupon_redemptions WHERE order_id = v_real_id;
    DELETE FROM public.order_tracking_events WHERE order_id = v_real_id;
    DELETE FROM public.order_items WHERE order_id = v_real_id;
    DELETE FROM public.payments WHERE order_id = v_real_id;
    DELETE FROM public.orders WHERE id = v_real_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_order_admin(text) TO anon, authenticated;

-- 4. RPC to reset all demo calculations to zero and start fresh from now
CREATE OR REPLACE FUNCTION public.reset_all_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove demo loyalty and coupon redemptions tied to orders
  DELETE FROM public.loyalty_reward_claims WHERE fulfilled_order_id IS NOT NULL;
  DELETE FROM public.loyalty_stamps;
  DELETE FROM public.coupon_redemptions;
  
  -- Remove all demo orders, items, payments, tracking
  DELETE FROM public.order_tracking_events;
  DELETE FROM public.order_items;
  DELETE FROM public.payments;
  DELETE FROM public.orders;

  -- Clear all analytics activity logs
  TRUNCATE TABLE public.site_analytics_events;

  -- Reset last_login_at on customers so today's logins count starts at 0
  UPDATE public.customers SET last_login_at = NULL;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'All orders, payments, and activity logs have been reset to 0. Fresh tracking started.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_all_demo_data() TO anon, authenticated;
