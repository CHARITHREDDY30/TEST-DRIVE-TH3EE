-- =============================================================================
-- TH3EE ATELIER — Database Migration: Admin Order Management & Fulfillment RPCs
-- =============================================================================

-- 1. Create atomic update_order_fulfillment RPC
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
    shipping_provider,
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

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_order_fulfillment(text, text, text, text, text, text, text, text) TO anon, authenticated;

-- 2. Create get_all_orders_admin RPC to reliably deliver orders to admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_orders_admin()
RETURNS jsonb AS $$
DECLARE
  v_res jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(
    to_jsonb(o.*) || jsonb_build_object(
      'order_items', COALESCE((
        SELECT jsonb_agg(to_jsonb(oi.*))
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      ), '[]'::jsonb),
      'payments', COALESCE((
        SELECT jsonb_agg(to_jsonb(p.*))
        FROM public.payments p
        WHERE p.order_id = o.id
      ), '[]'::jsonb)
    )
    ORDER BY o.created_at DESC
  ), '[]'::jsonb) INTO v_res
  FROM public.orders o;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_all_orders_admin() TO anon, authenticated;
