-- Seed realistic baseline analytics events
INSERT INTO public.site_analytics_events (session_id, visitor_id, event_type, path, item_id, item_name, item_category, item_price, customer_name, customer_email, device_type, created_at)
VALUES 
  ('s_init_01', 'v_init_01', 'page_view', '/', NULL, 'Storefront Home', NULL, NULL, 'Charith Reddy', 'charithreddy014@gmail.com', 'desktop', now() - interval '2 days'),
  ('s_init_01', 'v_init_01', 'product_view', '/product/batman-dark-knight', 'f32e6777-81e6-4000-b87d-795c9575bbb0', 'BATMAN - Dark Knight', 'T-Shirts', 799, 'Charith Reddy', 'charithreddy014@gmail.com', 'desktop', now() - interval '2 days'),
  ('s_init_01', 'v_init_01', 'add_to_cart', '/bag', 'f32e6777-81e6-4000-b87d-795c9575bbb0', 'BATMAN - Dark Knight', 'T-Shirts', 799, 'Charith Reddy', 'charithreddy014@gmail.com', 'desktop', now() - interval '2 days'),
  ('s_init_01', 'v_init_01', 'checkout_started', '/checkout', NULL, 'Checkout', NULL, 799, 'Charith Reddy', 'charithreddy014@gmail.com', 'desktop', now() - interval '2 days'),
  ('s_init_01', 'v_init_01', 'order_placed', '/order-success', 'TH3EE-MVIBUZIS-1498', 'Order #TH3EE-MVIBUZIS-1498', 'Orders', 2997, 'Charith Reddy', 'charithreddy014@gmail.com', 'desktop', now() - interval '2 days'),
  ('s_init_02', 'v_init_02', 'user_login', '/account', NULL, 'Customer Login', NULL, NULL, 'Vamsi', 'bodapativamsi050@gmail.com', 'mobile', now() - interval '1 day'),
  ('s_init_02', 'v_init_02', 'product_view', '/product/baahubali-emblem-edition', '3bca4a4b-ec8d-46af-91c2-f80e3bff0b33', 'Baahubali - Emblem Edition', 'T-Shirts', 449, 'Vamsi', 'bodapativamsi050@gmail.com', 'mobile', now() - interval '1 day'),
  ('s_init_03', 'v_init_03', 'product_view', '/product/salaar', '60ca5a69-b043-5510-864f-daa688440256', 'SALAAR', 'T-Shirts', 599, NULL, NULL, 'mobile', now() - interval '3 hours'),
  ('s_init_03', 'v_init_03', 'add_to_cart', '/bag', '60ca5a69-b043-5510-864f-daa688440256', 'SALAAR', 'T-Shirts', 599, NULL, NULL, 'mobile', now() - interval '2 hours'),
  ('s_init_04', 'v_init_04', 'user_login', '/account', NULL, 'Customer Login', NULL, NULL, 'Rajhans', 'rajhansyadav3636@gmail.com', 'mobile', now() - interval '4 hours'),
  ('s_init_04', 'v_init_04', 'product_view', '/product/batman-dark-knight', 'f32e6777-81e6-4000-b87d-795c9575bbb0', 'BATMAN - Dark Knight', 'T-Shirts', 799, 'Rajhans', 'rajhansyadav3636@gmail.com', 'mobile', now() - interval '3 hours'),
  ('s_init_05', 'v_init_05', 'product_view', '/product/spirit', '40b733f6-57b6-467e-a9a4-f7a8a7265f37', 'SPIRIT', 'T-Shirts', 499, NULL, NULL, 'desktop', now() - interval '1 hour'),
  ('s_init_06', 'v_init_06', 'product_view', '/product/one-bad-habit', 'db2620ef-2963-45cc-80bb-1e9b6cb05bfe', 'ONE BAD HABIT', 'T-Shirts', 549, NULL, NULL, 'mobile', now() - interval '30 minutes');
