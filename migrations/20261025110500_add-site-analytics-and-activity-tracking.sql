-- =============================================================================
-- TH3EE ATELIER — Database Migration: Store Analytics & Visitor Activity Tracker
-- =============================================================================

-- 1. Add last_login_at to customers table if not exists
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone DEFAULT now();

-- 2. Backfill last_login_at with updated_at / created_at for existing customers
UPDATE public.customers
SET last_login_at = COALESCE(updated_at, created_at, now())
WHERE last_login_at IS NULL;

-- 3. Create site_analytics_events table
CREATE TABLE IF NOT EXISTS public.site_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  event_type text NOT NULL,
  path text,
  item_id text,
  item_name text,
  item_category text,
  item_price numeric,
  customer_id uuid,
  customer_email text,
  customer_name text,
  device_type text DEFAULT 'desktop',
  referrer text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON public.site_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_event_type ON public.site_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_site_events_visitor_id ON public.site_analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_events_item_id ON public.site_analytics_events(item_id);
CREATE INDEX IF NOT EXISTS idx_site_events_session_id ON public.site_analytics_events(session_id);

-- 5. Enable Row Level Security
ALTER TABLE public.site_analytics_events ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "Anyone can record analytics events" ON public.site_analytics_events;
CREATE POLICY "Anyone can record analytics events" ON public.site_analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view analytics events" ON public.site_analytics_events;
CREATE POLICY "Admins can view analytics events" ON public.site_analytics_events
  FOR SELECT USING (true);

-- 7. Grant access to anon and authenticated roles
GRANT ALL ON public.site_analytics_events TO anon;
GRANT ALL ON public.site_analytics_events TO authenticated;

-- 8. Create RPC helper to record event cleanly
CREATE OR REPLACE FUNCTION public.log_site_event(
  p_session_id text,
  p_visitor_id text,
  p_event_type text,
  p_path text DEFAULT NULL,
  p_item_id text DEFAULT NULL,
  p_item_name text DEFAULT NULL,
  p_item_category text DEFAULT NULL,
  p_item_price numeric DEFAULT NULL,
  p_customer_id uuid DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_device_type text DEFAULT 'desktop',
  p_referrer text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.site_analytics_events (
    session_id,
    visitor_id,
    event_type,
    path,
    item_id,
    item_name,
    item_category,
    item_price,
    customer_id,
    customer_email,
    customer_name,
    device_type,
    referrer,
    metadata,
    created_at
  ) VALUES (
    p_session_id,
    p_visitor_id,
    p_event_type,
    p_path,
    p_item_id,
    p_item_name,
    p_item_category,
    p_item_price,
    p_customer_id,
    p_customer_email,
    p_customer_name,
    COALESCE(p_device_type, 'desktop'),
    p_referrer,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  )
  RETURNING id INTO v_id;

  -- If it's a login event or customer event, also touch customer's last_login_at
  IF p_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET last_login_at = now()
    WHERE id = p_customer_id OR auth_user_id = p_customer_id;
  ELSIF p_customer_email IS NOT NULL THEN
    UPDATE public.customers
    SET last_login_at = now()
    WHERE email = p_customer_email;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_site_event TO anon, authenticated;
