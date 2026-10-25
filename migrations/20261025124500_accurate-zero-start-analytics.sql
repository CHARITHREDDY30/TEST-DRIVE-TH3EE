-- Migration: Remove synthetic baselines and ensure 100% authentic zero-start counting
CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary(
  p_timeframe text DEFAULT 'all'
)
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time timestamptz;
  v_now timestamptz := now();
  v_total_visitors bigint := 0;
  v_total_sessions bigint := 0;
  v_total_pageviews bigint := 0;
  v_mobile_visitors bigint := 0;
  v_desktop_visitors bigint := 0;
  v_total_orders bigint := 0;
  v_today_orders bigint := 0;
  v_total_revenue numeric := 0;
  v_today_revenue numeric := 0;
  v_avg_order_value numeric := 0;
  v_completed_orders bigint := 0;
  v_pending_orders bigint := 0;
  v_today_logins_count bigint := 0;
  v_total_customers bigint := 0;
  v_top_products jsonb := '[]'::jsonb;
  v_recent_logins jsonb := '[]'::jsonb;
  v_recent_orders jsonb := '[]'::jsonb;
  v_live_events jsonb := '[]'::jsonb;
  v_funnel jsonb;
  v_views_count bigint := 0;
  v_carts_count bigint := 0;
  v_checkouts_count bigint := 0;
  v_purchases_count bigint := 0;
  v_conversion_rate numeric := 0;
  v_cart_abandonment_rate numeric := 0;
BEGIN
  -- Determine timeframe filter
  IF p_timeframe = 'today' THEN
    v_start_time := date_trunc('day', v_now);
  ELSIF p_timeframe = 'yesterday' THEN
    v_start_time := date_trunc('day', v_now - interval '1 day');
  ELSIF p_timeframe = '7days' THEN
    v_start_time := v_now - interval '7 days';
  ELSIF p_timeframe = '30days' THEN
    v_start_time := v_now - interval '30 days';
  ELSE
    v_start_time := '1970-01-01'::timestamptz;
  END IF;

  -- 1. Order KPIs (True counts from orders table)
  SELECT 
    COUNT(*),
    COALESCE(SUM(total_amount), 0),
    COALESCE(AVG(total_amount), 0),
    COUNT(*) FILTER (WHERE LOWER(order_status) = 'delivered'),
    COUNT(*) FILTER (WHERE LOWER(order_status) != 'delivered')
  INTO 
    v_total_orders,
    v_total_revenue,
    v_avg_order_value,
    v_completed_orders,
    v_pending_orders
  FROM public.orders
  WHERE created_at >= v_start_time;

  -- Today specific orders
  SELECT 
    COUNT(*),
    COALESCE(SUM(total_amount), 0)
  INTO 
    v_today_orders,
    v_today_revenue
  FROM public.orders
  WHERE created_at >= date_trunc('day', v_now);

  -- 2. Customer KPIs
  SELECT COUNT(*) INTO v_total_customers FROM public.customers;
  
  SELECT COUNT(*) 
  INTO v_today_logins_count 
  FROM public.customers 
  WHERE last_login_at IS NOT NULL AND last_login_at >= date_trunc('day', v_now);

  -- 3. Visitor / Traffic KPIs (Pure counts from site_analytics_events, no artificial floors)
  SELECT 
    COALESCE(COUNT(DISTINCT visitor_id), 0),
    COALESCE(COUNT(DISTINCT session_id), 0),
    COALESCE(COUNT(*), 0),
    COALESCE(COUNT(DISTINCT visitor_id) FILTER (WHERE device_type = 'mobile'), 0),
    COALESCE(COUNT(DISTINCT visitor_id) FILTER (WHERE device_type != 'mobile'), 0)
  INTO 
    v_total_visitors,
    v_total_sessions,
    v_total_pageviews,
    v_mobile_visitors,
    v_desktop_visitors
  FROM public.site_analytics_events
  WHERE created_at >= v_start_time;

  -- Funnel counts (Pure counts)
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE event_type = 'product_view'), 0),
    COALESCE(COUNT(*) FILTER (WHERE event_type = 'add_to_cart'), 0),
    COALESCE(COUNT(*) FILTER (WHERE event_type = 'checkout_started'), 0),
    COALESCE(COUNT(*) FILTER (WHERE event_type = 'order_placed'), 0)
  INTO 
    v_views_count,
    v_carts_count,
    v_checkouts_count,
    v_purchases_count
  FROM public.site_analytics_events
  WHERE created_at >= v_start_time;

  -- Conversion Rates
  IF v_views_count > 0 THEN
    v_conversion_rate := ROUND(((v_total_orders::numeric / v_views_count::numeric) * 100), 1);
  ELSE
    v_conversion_rate := 0;
  END IF;

  IF v_carts_count > 0 THEN
    IF v_carts_count >= v_total_orders THEN
      v_cart_abandonment_rate := ROUND((((v_carts_count - v_total_orders)::numeric / v_carts_count::numeric) * 100), 1);
    ELSE
      v_cart_abandonment_rate := 0;
    END IF;
  ELSE
    v_cart_abandonment_rate := 0;
  END IF;

  -- 4. Top Products (Authentic Views, Cart Adds, Orders)
  WITH product_stats AS (
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.category,
      p.selling_price as price,
      p.image_url,
      p.in_stock,
      COALESCE(view_counts.views, 0) as views,
      COALESCE(cart_counts.carts, 0) as cart_adds,
      COALESCE(order_counts.orders, 0) as orders_count
    FROM public.products p
    LEFT JOIN (
      SELECT COALESCE(item_id, item_name) as pid, COUNT(*) as views
      FROM public.site_analytics_events
      WHERE event_type = 'product_view' AND created_at >= v_start_time
      GROUP BY 1
    ) view_counts ON view_counts.pid = p.id::text OR view_counts.pid = p.slug OR view_counts.pid = p.name
    LEFT JOIN (
      SELECT COALESCE(item_id, item_name) as pid, COUNT(*) as carts
      FROM public.site_analytics_events
      WHERE event_type = 'add_to_cart' AND created_at >= v_start_time
      GROUP BY 1
    ) cart_counts ON cart_counts.pid = p.id::text OR cart_counts.pid = p.slug OR cart_counts.pid = p.name
    LEFT JOIN (
      SELECT product_name, SUM(quantity) as orders
      FROM public.order_items
      WHERE created_at >= v_start_time
      GROUP BY product_name
    ) order_counts ON order_counts.product_name = p.name
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'category', category,
        'price', price,
        'imageUrl', image_url,
        'inStock', in_stock,
        'views', views,
        'cartAdds', cart_adds,
        'ordersCount', orders_count,
        'conversionRate', CASE 
          WHEN views > 0 THEN ROUND(((orders_count::numeric / views::numeric) * 100), 1)
          ELSE 0 
        END
      ) ORDER BY views DESC, orders_count DESC
    ),
    '[]'::jsonb
  ) INTO v_top_products
  FROM product_stats;

  -- 5. Customer Logins Ledger
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', COALESCE(c.full_name, c.email, 'Anonymous Customer'),
        'email', c.email,
        'phone', COALESCE(c.phone, ''),
        'avatarUrl', c.avatar_url,
        'lastLoginAt', c.last_login_at,
        'createdAt', c.created_at,
        'isToday', CASE WHEN c.last_login_at IS NOT NULL AND c.last_login_at >= date_trunc('day', v_now) THEN true ELSE false END,
        'orderCount', COALESCE(ord_summary.ord_count, 0),
        'totalSpent', COALESCE(ord_summary.total_spent, 0)
      ) ORDER BY c.last_login_at DESC NULLS LAST
    ),
    '[]'::jsonb
  ) INTO v_recent_logins
  FROM public.customers c
  LEFT JOIN (
    SELECT 
      customer_email, 
      COUNT(*) as ord_count, 
      SUM(total_amount) as total_spent
    FROM public.orders
    GROUP BY customer_email
  ) ord_summary ON ord_summary.customer_email = c.email;

  -- 6. Recent Orders with items detail
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'orderNumber', o.order_number,
        'customerName', o.customer_name,
        'customerEmail', o.customer_email,
        'customerPhone', o.customer_phone,
        'totalAmount', o.total_amount,
        'orderStatus', o.order_status,
        'paymentStatus', o.payment_status,
        'deliveryStatus', o.delivery_status,
        'shippingProvider', o.shipping_provider,
        'trackingNumber', o.tracking_number,
        'createdAt', o.created_at,
        'items', COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('productName', oi.product_name, 'quantity', oi.quantity, 'size', oi.size, 'color', oi.color_name, 'unitPrice', oi.unit_price))
           FROM public.order_items oi WHERE oi.order_id = o.id),
          '[]'::jsonb
        )
      ) ORDER BY o.created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_recent_orders
  FROM (
    SELECT * FROM public.orders 
    WHERE created_at >= v_start_time
    ORDER BY created_at DESC 
    LIMIT 20
  ) o;

  -- 7. Live Events Stream (latest 40 site actions)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'eventType', e.event_type,
        'path', e.path,
        'itemName', e.item_name,
        'itemPrice', e.item_price,
        'customerEmail', e.customer_email,
        'customerName', e.customer_name,
        'deviceType', e.device_type,
        'createdAt', e.created_at,
        'metadata', e.metadata
      ) ORDER BY e.created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_live_events
  FROM (
    SELECT * FROM public.site_analytics_events
    ORDER BY created_at DESC
    LIMIT 40
  ) e;

  -- Final JSON package
  RETURN jsonb_build_object(
    'timeframe', p_timeframe,
    'totalVisitors', v_total_visitors,
    'totalSessions', v_total_sessions,
    'totalPageviews', v_total_pageviews,
    'mobileVisitors', v_mobile_visitors,
    'desktopVisitors', v_desktop_visitors,
    'totalOrders', v_total_orders,
    'todayOrders', v_today_orders,
    'totalRevenue', v_total_revenue,
    'todayRevenue', v_today_revenue,
    'avgOrderValue', ROUND(v_avg_order_value, 2),
    'completedOrders', v_completed_orders,
    'pendingOrders', v_pending_orders,
    'todayLoginsCount', v_today_logins_count,
    'totalCustomers', v_total_customers,
    'conversionRate', v_conversion_rate,
    'cartAbandonmentRate', v_cart_abandonment_rate,
    'topProducts', v_top_products,
    'recentLogins', v_recent_logins,
    'recentOrders', v_recent_orders,
    'liveEvents', v_live_events,
    'funnel', jsonb_build_object(
      'visitors', v_total_visitors,
      'productViews', v_views_count,
      'addToCarts', v_carts_count,
      'checkouts', v_checkouts_count,
      'orders', v_purchases_count
    ),
    'generatedAt', v_now
  );
END;
$$;
