-- Migration: Add secure get_order_by_identifier RPC for order tracking
CREATE OR REPLACE FUNCTION public.get_order_by_identifier(p_identifier text)
RETURNS jsonb AS $$
DECLARE
  v_res jsonb;
BEGIN
  SELECT to_jsonb(o.*) || jsonb_build_object(
    'order_items', COALESCE((
      SELECT jsonb_agg(to_jsonb(oi.*))
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::jsonb)
  ) INTO v_res
  FROM public.orders o
  WHERE o.order_number = p_identifier
     OR (p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND o.id = p_identifier::uuid)
  LIMIT 1;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_order_by_identifier(text) TO anon, authenticated;
