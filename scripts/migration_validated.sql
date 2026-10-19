
INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  'TFI',
  'tfi',
  'TELUGU CINEMA',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
  NULL,
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '5b728787-f459-59b2-ab74-eb7e2e3ca1b5',
  'All TFI Cult',
  'tfi-tfi',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'ea2194c8-469c-5bd4-9688-6e5a946c8265',
  'Baahubali',
  'tfi-bah',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'd704f84a-8ca6-5f5d-a582-0c2f94d570ee',
  'Salaar',
  'tfi-slr',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '39c34939-f4d6-59d7-ad34-0dd684894f31',
  'Spirit',
  'tfi-spt',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'b27f753e-aaf0-5245-a00c-820dba812b07',
  'RRR Fire & Water',
  'tfi-rrr',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '7619fe9f-9755-5406-af13-41f336fd0844',
  'Kalki 2898 AD',
  'tfi-klk',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  6,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'bc04c87d-13fc-58ab-9e9f-df63a2570714',
  'Pushpa Raw',
  'tfi-psh',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  7,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'c8616d6c-4d64-5ba7-baf4-d2d3295c43bb',
  'Devara',
  'tfi-dvr',
  'Subcategory of TFI',
  NULL,
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'ca3bc87c-2886-58dd-84c9-140dbafd97e7',
  'ANIME',
  'anime',
  'SHONEN SAGA',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  NULL,
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '9eac6aee-f4ee-5a5d-a2ad-597e4f0085d4',
  'All Anime',
  'anime-all',
  'Subcategory of ANIME',
  NULL,
  'ca3bc87c-2886-58dd-84c9-140dbafd97e7',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '85b34e35-7b21-57a7-9a0b-b27299ded279',
  'Demon Slayer',
  'anime-kim',
  'Subcategory of ANIME',
  NULL,
  'ca3bc87c-2886-58dd-84c9-140dbafd97e7',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '5cc9ffdb-6842-5bb2-8aa0-cb43e5a1d274',
  'Naruto',
  'anime-uzu',
  'Subcategory of ANIME',
  NULL,
  'ca3bc87c-2886-58dd-84c9-140dbafd97e7',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '955f2aaa-fe3a-54d7-a1e5-cc1df974d2eb',
  'Attack On Titan',
  'anime-shi',
  'Subcategory of ANIME',
  NULL,
  'ca3bc87c-2886-58dd-84c9-140dbafd97e7',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'd3f5d13d-6b9e-5205-8fab-5af20ab1687d',
  'One Piece',
  'anime-str',
  'Subcategory of ANIME',
  NULL,
  'ca3bc87c-2886-58dd-84c9-140dbafd97e7',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '6c8044c4-3ef1-5456-8775-1eb5f11dfec5',
  'Jujutsu Kaisen',
  'anime-sor',
  'Subcategory of ANIME',
  NULL,
  'ca3bc87c-2886-58dd-84c9-140dbafd97e7',
  6,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '1cc2b4ac-2616-5d2b-a571-4ba3a897ed6c',
  'MARVEL',
  'marvel',
  'CINEMATIC COMICS',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  NULL,
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '36e6c328-cf12-51ac-834d-3525b8aaaa7a',
  'All Marvel',
  'marvel-mcu',
  'Subcategory of MARVEL',
  NULL,
  '1cc2b4ac-2616-5d2b-a571-4ba3a897ed6c',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '735d69b5-5981-5b2a-96fa-4d9f8e4c7df9',
  'Spider-Man',
  'marvel-spd',
  'Subcategory of MARVEL',
  NULL,
  '1cc2b4ac-2616-5d2b-a571-4ba3a897ed6c',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'b20ddbb5-018a-57e7-9ce2-45543dafddfa',
  'Iron Man',
  'marvel-arc',
  'Subcategory of MARVEL',
  NULL,
  '1cc2b4ac-2616-5d2b-a571-4ba3a897ed6c',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '896966cf-9390-5eaf-9f3b-418bf63d8508',
  'DC',
  'dc',
  'JUSTICE & GOTHAM',
  'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=600&auto=format&fit=crop&q=80',
  NULL,
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '5e8d7191-79df-5737-9235-000a2e892219',
  'All DC',
  'dc-dcu',
  'Subcategory of DC',
  NULL,
  '896966cf-9390-5eaf-9f3b-418bf63d8508',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'a7e7d25c-6a7c-5a30-9ff3-15920959c9ad',
  'The Batman',
  'dc-dkn',
  'Subcategory of DC',
  NULL,
  '896966cf-9390-5eaf-9f3b-418bf63d8508',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'd4102b9f-9945-5b3b-be8d-2b6e7eff2f89',
  'HARRY POTTER',
  'harry-potter',
  'WIZARDING WORLD',
  'https://images.unsplash.com/photo-1598153346810-860daa814c4b?w=600&auto=format&fit=crop&q=80',
  NULL,
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'b44a39ed-385c-582b-8fe6-4b78f82bea84',
  'All Wizarding',
  'harry-potter-hp',
  'Subcategory of HARRY POTTER',
  NULL,
  'd4102b9f-9945-5b3b-be8d-2b6e7eff2f89',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'e31155ea-b543-586b-84a3-c7e122ad1681',
  'NANI''S PARADISE',
  'nanis-paradise',
  'NATURAL STAR',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
  NULL,
  6,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '1f8bfce2-fb1b-5f1e-aa31-dc89a3fb9efb',
  'All Nani Drops',
  'nanis-paradise-npr',
  'Subcategory of NANI''S PARADISE',
  NULL,
  'e31155ea-b543-586b-84a3-c7e122ad1681',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'bf5ad04c-ac88-5e55-87f0-4018cd7c4026',
  'DOOMSDAY',
  'doomsday',
  'AVENGERS SAGA',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  NULL,
  7,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'a7be27f6-25a3-545f-b4fb-67793d6d318f',
  'All Doomsday',
  'doomsday-dmd',
  'Subcategory of DOOMSDAY',
  NULL,
  'bf5ad04c-ac88-5e55-87f0-4018cd7c4026',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '0cc4aeec-e924-51d2-9d67-38b1ba9dcb3a',
  'MEMES',
  'memes',
  'BRAINROT & IRONY',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
  NULL,
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '2888c986-87e4-53fb-b0f7-798f630755bc',
  'All Memes',
  'memes-mem',
  'Subcategory of MEMES',
  NULL,
  '0cc4aeec-e924-51d2-9d67-38b1ba9dcb3a',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '609cbcf8-6a73-5654-8de0-94f624ab1229',
  'GAME',
  'game',
  'CONSOLE & PC',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
  NULL,
  9,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'ab340b71-6177-5b14-93f2-13297f2dc354',
  'All Gaming',
  'game-gam',
  'Subcategory of GAME',
  NULL,
  '609cbcf8-6a73-5654-8de0-94f624ab1229',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '0efeb6b0-0b52-5cb7-9556-382a0f480fbf',
  'FESTIVAL',
  'festival',
  'LIGHTS & KITES',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  NULL,
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '20123e7e-16cb-56be-9957-a291add3e8c6',
  'All Festival',
  'festival-fst',
  'Subcategory of FESTIVAL',
  NULL,
  '0efeb6b0-0b52-5cb7-9556-382a0f480fbf',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'da59b9bb-7fd2-531c-a4f1-beb638c7890a',
  'CUSTOMISE',
  'customise',
  'BESPOKE STUDIO',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
  NULL,
  11,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '447c57d5-ee9c-5f73-8b27-1cf6bca1a287',
  'All Custom',
  'customise-cst',
  'Subcategory of CUSTOMISE',
  NULL,
  'da59b9bb-7fd2-531c-a4f1-beb638c7890a',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '15262a25-d009-56fe-aa02-467109829cb0',
  'COLLEGE',
  'college',
  'CAMPUS NOSTALGIA',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
  NULL,
  12,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '61caf559-2919-5c54-a4a2-e3288e8606f5',
  'All Campus',
  'college-cmp',
  'Subcategory of COLLEGE',
  NULL,
  '15262a25-d009-56fe-aa02-467109829cb0',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01',
  'BAAHUBALI: THE BEGINNING CULT GRAPHIC TEE',
  'baahubali-the-beginning-cult-graphic-tee',
  'Official @th3ee.verse drop. Heavyweight 290 GSM loopback cotton tee featuring the Shivudu Mahishmati ascension artwork rendered with high-density gold and crimson metallic screenprints. Finished with minimal ''PRABHAS / BAAHUBALI'' chest insignia and signature ''TH3EE — WEAR THE SOUL'' rear graphic.',
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  'T-Shirts',
  'Baahubali',
  'tfi',
  499,
  799,
  290,
  '100% Combed Terry Cotton',
  'Mahishmati Oversized Box Cut',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/IMg%201.jpeg',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/IMg%201.jpeg',
  '["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/IMg%201.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/img%202.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/img%204.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/img%205.jpeg"]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '[{"name":"Washed Carbon Black","hex":"#1C1C1C","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/1792122621359-IMg_1.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/1792122624943-img_2.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/img3.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/1792122631732-img_6.jpeg"]},{"name":"Blood Ochre Red","hex":"#8B1E1E","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_00000000e5d482089eb173017419586a.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_00000000077c820887b61e1ee64c4d7f.png"]},{"name":"Antique Sand","hex":"#D4C5B9","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_0000000022c88208929371af34120bb7.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/file_00000000284c8208815effc4db5f38bc.png"]}]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '["290 GSM Custom Milled Heavyweight Loopback Cotton","Metallic Gold & Crimson High-Density Foil Screenprint","Signature ''TH3EE — WEAR THE SOUL'' Back Print","Pre-Washed Anti-Shrink Mahishmati Oversized Boxy Cut","Reinforced 1.25-inch Heavy Collar Ribbing"]'::jsonb,
  '["290 GSM Custom Milled Heavyweight Loopback Cotton","Metallic Gold & Crimson High-Density Foil Screenprint","Signature ''TH3EE — WEAR THE SOUL'' Back Print","Pre-Washed Anti-Shrink Mahishmati Oversized Boxy Cut","Reinforced 1.25-inch Heavy Collar Ribbing"]'::jsonb,
  '["Cold machine wash inside out","Do not iron directly on metallic and foil prints","Dry flat in shade"]'::jsonb,
  'LIMITED EDITION',
  5,
  84,
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '2e972482-7342-5059-95c7-0eb32abf3866',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-washed-carbon-black-s',
  'S',
  'Washed Carbon Black',
  '#1C1C1C',
  14,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1b904ab5-2e68-57e1-bb8a-032c00cab8a0',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-washed-carbon-black-m',
  'M',
  'Washed Carbon Black',
  '#1C1C1C',
  22,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'a547d699-6ecb-5496-849c-d68e041bd235',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-washed-carbon-black-l',
  'L',
  'Washed Carbon Black',
  '#1C1C1C',
  35,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '11ee5cc3-444f-54b4-886e-543516cde601',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-washed-carbon-black-xl',
  'XL',
  'Washed Carbon Black',
  '#1C1C1C',
  18,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'eb6d3eb7-adc4-55d3-bea8-9cc572fd7b06',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-washed-carbon-black-xxl',
  'XXL',
  'Washed Carbon Black',
  '#1C1C1C',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1b852342-0117-528b-ac0c-cfc5f7df5b9c',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-blood-ochre-red-s',
  'S',
  'Blood Ochre Red',
  '#8B1E1E',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '3e21971d-39e4-5ce9-97eb-aea0fd23ed37',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-blood-ochre-red-m',
  'M',
  'Blood Ochre Red',
  '#8B1E1E',
  16,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '8c3c2619-c987-5845-b779-5a30f64e8a70',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-blood-ochre-red-l',
  'L',
  'Blood Ochre Red',
  '#8B1E1E',
  20,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'b21533b1-b847-568a-8637-2bbef19ecf27',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-blood-ochre-red-xl',
  'XL',
  'Blood Ochre Red',
  '#8B1E1E',
  12,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '16fc47ea-c83a-584e-879f-a576fcc2cfcc',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-blood-ochre-red-xxl',
  'XXL',
  'Blood Ochre Red',
  '#8B1E1E',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'a83c8c11-e935-53be-8ecb-46c26508b114',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-antique-sand-s',
  'S',
  'Antique Sand',
  '#D4C5B9',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'b2918bbb-b8d2-507e-95af-b7c5867865bf',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-antique-sand-m',
  'M',
  'Antique Sand',
  '#D4C5B9',
  12,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'fa49ae69-d5ae-51da-8377-b59141921410',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-antique-sand-l',
  'L',
  'Antique Sand',
  '#D4C5B9',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'a5b8874a-b82c-52e0-a171-1da1fbb3e416',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-antique-sand-xl',
  'XL',
  'Antique Sand',
  '#D4C5B9',
  9,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'd97bafdf-feeb-59e4-891f-df0b5b7ec388',
  'b38275c6-022a-5007-a205-64fe52679e08',
  'th-bahubali-01-antique-sand-xxl',
  'XXL',
  'Antique Sand',
  '#D4C5B9',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01',
  'SALAAR: DEVARATHA CULT RINGER OVERSIZED TEE',
  'salaar-devaratha-cult-ringer-oversized-tee',
  'Official @th3ee.verse drop. Heavyweight 290 GSM loopback cotton ringer tee inspired by the ruthless warlord Devaratha of Khansaar. Features a front tribal warrior totem emblem and a high-density back print with bold SALAAR typography, scarlet script ''devaratha'', and signature ''MAKE CODE TH3EE'' atelier insignia.',
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  'T-Shirts',
  'All TFI Cult',
  'tfi',
  499,
  799,
  240,
  '100% Combed Terry Cotton',
  'Khansaar Oversized Box Cut',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/21.jpeg',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/21.jpeg',
  '["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/21.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/22.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/27.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/24.jpeg"]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '[{"name":"Vintage Chalk White & Crimson Rib","hex":"#F4F4F0","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/%40th3ee.veese_20261010_192852_0000.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/22.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/21.jpeg"]},{"name":"Washed Carbon Black","hex":"#1C1C1C","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/22.jpeg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/salar/21.jpeg"]}]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '["240 GSM Custom Milled Heavyweight Loopback Cotton","Signature Crimson Red Contrast Ribbed Collar & Cuffs","Front Chest: Intricate Tribal Battle Crest Screenprint","Back: High-Density Monolithic SALAAR Typography with Scarlet Devaratha Script","Official ''MAKE CODE TH3EE'' Authentic Insignia Stamp","Pre-Washed Anti-Shrink Khansaar Oversized Box Silhouette"]'::jsonb,
  '["240 GSM Custom Milled Heavyweight Loopback Cotton","Signature Crimson Red Contrast Ribbed Collar & Cuffs","Front Chest: Intricate Tribal Battle Crest Screenprint","Back: High-Density Monolithic SALAAR Typography with Scarlet Devaratha Script","Official ''MAKE CODE TH3EE'' Authentic Insignia Stamp","Pre-Washed Anti-Shrink Khansaar Oversized Box Silhouette"]'::jsonb,
  '["Cold machine wash inside out","Do not iron directly on high-density graphics","Dry flat in shade"]'::jsonb,
  'NEW DROP',
  5,
  92,
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1c43abc2-2b80-5034-903d-853114e6f5ce',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-vintage-chalk-white-crimson-rib-s',
  'S',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  12,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '71cdcf0b-aeb9-538e-918e-d7a47bfb8fc6',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-vintage-chalk-white-crimson-rib-m',
  'M',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  25,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'ae87da97-f000-5862-8e77-d5e62a331ec7',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-vintage-chalk-white-crimson-rib-l',
  'L',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  40,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '0e80cd8e-b9b6-575a-bc16-a41357361643',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-vintage-chalk-white-crimson-rib-xl',
  'XL',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  22,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'da543752-802d-5a61-84fc-0401b51bccd5',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-vintage-chalk-white-crimson-rib-xxl',
  'XXL',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '5894e7bb-36df-5b06-9524-46edb72ecc69',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-washed-carbon-black-s',
  'S',
  'Washed Carbon Black',
  '#1C1C1C',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'd41e196b-f886-5911-bcb0-4bf1c5e6578e',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-washed-carbon-black-m',
  'M',
  'Washed Carbon Black',
  '#1C1C1C',
  20,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '925bde43-edd2-5521-a395-f0866be85f70',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-washed-carbon-black-l',
  'L',
  'Washed Carbon Black',
  '#1C1C1C',
  30,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'ab45196e-257e-51f0-948e-fba10045933c',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-washed-carbon-black-xl',
  'XL',
  'Washed Carbon Black',
  '#1C1C1C',
  16,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '56b2b94c-88a0-58b4-a4be-8f782b7dfd88',
  '60ca5a69-b043-5510-864f-daa688440256',
  'th-salaar-01-washed-carbon-black-xxl',
  'XXL',
  'Washed Carbon Black',
  '#1C1C1C',
  6,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '309e1b6a-1036-5a4f-99e1-b07287d7929e',
  'th-spirit-02',
  'SPIRIT: BORN TO STAND OUT HEAVYWEIGHT TEE',
  'spirit-born-to-stand-out-oversized-tee',
  'Official @th3ee.verse drop. ''BORN TO STAND OUT'' Spirit oversized graphic tee crafted from 280 GSM premium ring-spun compact cotton. Features front ''ONE BAD HABIT'' crimson block lettering and an iconic rear vintage artwork print with star accents and stylized Spirit branding.',
  '0482e7dc-7b81-59cd-a9b0-f89c7ce7186a',
  'T-Shirts',
  'All TFI Cult',
  'tfi',
  499,
  799,
  240,
  '100% Ring-Spun Compact Cotton',
  'Loose Architectural Drape',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/29.jpeg',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/29.jpeg',
  '["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/29.jpeg"]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '[{"name":"Chalk White","hex":"#F9F9F7","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/1_20261016_140131_0000.jpg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/2_20261016_140131_0001.jpg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/3_20261016_140131_0002.jpg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/4_20261016_140131_0003.jpg","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spirt%201/Spirit%202/5_20261016_140131_0004.jpg"]}]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '["240 GSM Pre-Shrunk Compact Cotton","Front Chest: Crimson ''ONE BAD HABIT'' Distressed Screenprint","Rear Spine: Full-Color ''SPIRIT / BORN TO STAND OUT'' Signature Poster Artwork","Reinforced 1.25-inch Heavy Collar Ribbing","Drop-Shoulder Streetwear Silhouette"]'::jsonb,
  '["240 GSM Pre-Shrunk Compact Cotton","Front Chest: Crimson ''ONE BAD HABIT'' Distressed Screenprint","Rear Spine: Full-Color ''SPIRIT / BORN TO STAND OUT'' Signature Poster Artwork","Reinforced 1.25-inch Heavy Collar Ribbing","Drop-Shoulder Streetwear Silhouette"]'::jsonb,
  '["Cold gentle cycle wash inside out","Do not bleach or tumble dry","Warm iron inside out"]'::jsonb,
  'TRENDING DROP',
  4.9,
  64,
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'ca2836c3-3e72-5a4f-84e7-e08e7561bf13',
  '309e1b6a-1036-5a4f-99e1-b07287d7929e',
  'th-spirit-02-chalk-white-s',
  'S',
  'Chalk White',
  '#F9F9F7',
  9,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'f471ed76-c471-5021-91c1-d0dadd08aeb9',
  '309e1b6a-1036-5a4f-99e1-b07287d7929e',
  'th-spirit-02-chalk-white-m',
  'M',
  'Chalk White',
  '#F9F9F7',
  18,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '9808b4d7-2fe8-554b-9d73-3982b7425e21',
  '309e1b6a-1036-5a4f-99e1-b07287d7929e',
  'th-spirit-02-chalk-white-l',
  'L',
  'Chalk White',
  '#F9F9F7',
  28,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '0ed53ecc-e145-541c-aa8f-462b5b2cb5af',
  '309e1b6a-1036-5a4f-99e1-b07287d7929e',
  'th-spirit-02-chalk-white-xl',
  'XL',
  'Chalk White',
  '#F9F9F7',
  14,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '36908570-f4b6-512d-aac5-19aac970fcc5',
  '309e1b6a-1036-5a4f-99e1-b07287d7929e',
  'th-spirit-02-chalk-white-xxl',
  'XXL',
  'Chalk White',
  '#F9F9F7',
  7,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  'ea753eae-f4e5-52ad-a99c-0364bb5ba1d5',
  'th-01',
  'BATMAN DARK KNIGHT OVERSIZED GRAPHIC TEE',
  'batman-dark-knight-oversized-graphic-tee',
  'Unleash the Dark Knight with this Batman-inspired oversized graphic T-shirt from TH3EE. Crafted from heavyweight 280 GSM loopback terry cotton, featuring a bold Batman graphic, premium print detailing, and a relaxed boxy silhouette for everyday streetwear.',
  '896966cf-9390-5eaf-9f3b-418bf63d8508',
  'T-Shirts',
  'Batman',
  'dc',
  899,
  1299,
  240,
  '100% Combed Terry Cotton',
  'Relaxed Boxy Cut',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png',
  '["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png"]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '[{"name":"Washed Black","hex":"#1F1F1F","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045042513.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045053896.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045058609.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045062219.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045065681.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045069445.png"]}]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '["240 GSM Heavyweight Terry Cotton","100% Combed Terry Cotton","Anti-Shrink Pre-Washed Finish","Signature Drop Shoulder Cut","Batman Graphic Print"]'::jsonb,
  '["240 GSM Heavyweight Terry Cotton","100% Combed Terry Cotton","Anti-Shrink Pre-Washed Finish","Signature Drop Shoulder Cut","Batman Graphic Print"]'::jsonb,
  '["Machine wash cold inside out","Wash with similar colours","Do not iron directly on the print","Tumble dry low"]'::jsonb,
  'BESTSELLER',
  4.9,
  38,
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1ceabbb0-44d1-51dc-8b88-963adb7a1168',
  'ea753eae-f4e5-52ad-a99c-0364bb5ba1d5',
  'th-01-washed-black-s',
  'S',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'd72671a2-4558-59a9-9b31-89841df9752a',
  'ea753eae-f4e5-52ad-a99c-0364bb5ba1d5',
  'th-01-washed-black-m',
  'M',
  'Washed Black',
  '#1F1F1F',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'e97b807e-270a-543b-9b0e-d480ce2d3511',
  'ea753eae-f4e5-52ad-a99c-0364bb5ba1d5',
  'th-01-washed-black-l',
  'L',
  'Washed Black',
  '#1F1F1F',
  25,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1c5e132e-b1d3-573b-8315-2de5b5950c2f',
  'ea753eae-f4e5-52ad-a99c-0364bb5ba1d5',
  'th-01-washed-black-xl',
  'XL',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'f169c7e4-613e-5ff8-aedf-6c37e91ea677',
  'ea753eae-f4e5-52ad-a99c-0364bb5ba1d5',
  'th-01-washed-black-xxl',
  'XXL',
  'Washed Black',
  '#1F1F1F',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02',
  'SPIDER-MAN OVERSIZED GRAPHIC TEE',
  'spider-man-oversized-graphic-tee',
  'Swing into streetwear with the TH3EE Spider-Man oversized graphic tee. Crafted from heavyweight 280 GSM loopback terry cotton, featuring a bold Spider-Man-inspired graphic, premium print detailing, and a relaxed boxy silhouette.',
  '1cc2b4ac-2616-5d2b-a571-4ba3a897ed6c',
  'T-Shirts',
  'Spider-Man',
  'marvel',
  499,
  799,
  240,
  '100% Combed Terry Cotton',
  'Relaxed Boxy Cut',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045075644.png',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045075644.png',
  '["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045075644.png"]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '[{"name":"Blood Ochre Red","hex":"#8B1E1E","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045075644.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045082281.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045089479.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045097744.png","https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Spiderman%201/First%20edition/1792045110815.png"]},{"name":"Washed Black","hex":"#1F1F1F","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png"]}]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '["240 GSM Heavyweight Terry Cotton","100% Combed Terry Cotton","Anti-Shrink Pre-Washed Finish","Signature Drop Shoulder Cut","Spider-Man Graphic Print"]'::jsonb,
  '["240 GSM Heavyweight Terry Cotton","100% Combed Terry Cotton","Anti-Shrink Pre-Washed Finish","Signature Drop Shoulder Cut","Spider-Man Graphic Print"]'::jsonb,
  '["Machine wash cold inside out","Wash with similar colours","Do not iron directly on the print","Tumble dry low"]'::jsonb,
  'BESTSELLER',
  4.9,
  38,
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '7ffaa5ae-f2f4-54b2-9893-9dba996459e5',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-blood-ochre-red-s',
  'S',
  'Blood Ochre Red',
  '#8B1E1E',
  0,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '81d6dc90-8687-5a7a-bf05-717b726c989a',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-blood-ochre-red-m',
  'M',
  'Blood Ochre Red',
  '#8B1E1E',
  0,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '811d5288-b22b-51ee-83fa-30e9542eed04',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-blood-ochre-red-l',
  'L',
  'Blood Ochre Red',
  '#8B1E1E',
  0,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'e84a5481-5686-5689-b047-cee69a4affda',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-blood-ochre-red-xl',
  'XL',
  'Blood Ochre Red',
  '#8B1E1E',
  0,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '7aaa0c30-d417-5b68-9e21-190adc850533',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-blood-ochre-red-xxl',
  'XXL',
  'Blood Ochre Red',
  '#8B1E1E',
  0,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'e583b1ef-8eee-5201-aba7-824dc28e982c',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-washed-black-s',
  'S',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1e26bf8c-46a8-5f59-b495-cc16259949d9',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-washed-black-m',
  'M',
  'Washed Black',
  '#1F1F1F',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'cfba6360-c532-5718-8dd2-5bcba7ab57dd',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-washed-black-l',
  'L',
  'Washed Black',
  '#1F1F1F',
  25,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '94c18e42-84ac-5ccb-ab23-02866d4176aa',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-washed-black-xl',
  'XL',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '8178353f-3e99-501f-9f94-2370ecbc5d20',
  '6181a173-f454-58ba-a8c0-dd93b00b352f',
  'th-02-washed-black-xxl',
  'XXL',
  'Washed Black',
  '#1F1F1F',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '28b114bb-b25e-54b3-8a85-c217a81d15f0',
  'th-04',
  '500 GSM ULTIMATE FRENCH TERRY HOODIE',
  '500-gsm-ultimate-french-terry-hoodie',
  'Our heaviest outerwear piece. Custom milled 500 GSM double-face French terry cotton with an articulated double-layered hood and zero drawstrings for a pure structural look.',
  '15262a25-d009-56fe-aa02-467109829cb0',
  'Hoodies & Sweats',
  'All Campus',
  'college',
  3499,
  4799,
  500,
  'Double-Loop French Terry',
  'Oversized Heavy Drape',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png',
  '["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png"]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '[{"name":"Obsidian Black","hex":"#111111","images":["https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/Batman/Batman%201%20edition/1792045048099.png"]}]'::jsonb,
  '["S","M","L","XL","XXL"]'::jsonb,
  '["500 GSM Double-Faced Terry","Seamless Double-Layered Hood","Pre-Shrunk 100% Combed Cotton"]'::jsonb,
  '["500 GSM Double-Faced Terry","Seamless Double-Layered Hood","Pre-Shrunk 100% Combed Cotton"]'::jsonb,
  '["Dry clean recommended","Cold gentle wash"]'::jsonb,
  'GRAIL',
  5,
  51,
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'abae8a55-70ab-5c1f-963a-41334e8a71c6',
  '28b114bb-b25e-54b3-8a85-c217a81d15f0',
  'th-04-obsidian-black-s',
  'S',
  'Obsidian Black',
  '#111111',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '153ad69c-87bc-584a-997e-2f9883553751',
  '28b114bb-b25e-54b3-8a85-c217a81d15f0',
  'th-04-obsidian-black-m',
  'M',
  'Obsidian Black',
  '#111111',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '92788f55-b6ee-52ca-9db1-c9c82cd8eac9',
  '28b114bb-b25e-54b3-8a85-c217a81d15f0',
  'th-04-obsidian-black-l',
  'L',
  'Obsidian Black',
  '#111111',
  14,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'd77f771c-f098-5e8e-9ec0-b56bc0552220',
  '28b114bb-b25e-54b3-8a85-c217a81d15f0',
  'th-04-obsidian-black-xl',
  'XL',
  'Obsidian Black',
  '#111111',
  7,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'b868aef2-8e2b-572d-9cc4-6118f38785c2',
  '28b114bb-b25e-54b3-8a85-c217a81d15f0',
  'th-04-obsidian-black-xxl',
  'XXL',
  'Obsidian Black',
  '#111111',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO NOTHING;


INSERT INTO hero_slides (
  id, title, subtitle, image_url, mobile_image_url, target_url, sort_order, is_active, created_at, updated_at
) VALUES (
  '6edd55d9-d652-517e-b2f4-7a33bb62888c',
  'BAAHUBALI CULT TEE',
  'THE EPIC OF MAHISHMATI • Heavyweight 290 GSM loopback cotton tee with high-density gold and crimson metallic screenprints.',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/IMg%201.jpeg',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/IMg%201.jpeg',
  '/products/baahubali-the-beginning-cult-graphic-tee',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO hero_slides (
  id, title, subtitle, image_url, mobile_image_url, target_url, sort_order, is_active, created_at, updated_at
) VALUES (
  '17f48a1e-8ff0-535e-95e9-c30b143c4f31',
  'SALAAR DEVARATHA TEE',
  'KHANSAAR WARRIOR • Heavyweight 290 GSM loopback cotton ringer with contrast red ribbing and tribal battle crest.',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/21.jpeg',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/21.jpeg',
  '/shop?universe=tfi',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO hero_slides (
  id, title, subtitle, image_url, mobile_image_url, target_url, sort_order, is_active, created_at, updated_at
) VALUES (
  'a1fa6597-1f46-56e4-87ee-ce705d973361',
  'SPIRIT OVERSIZED TEE',
  'BORN TO STAND OUT • 280 GSM compact cotton with ''ONE BAD HABIT'' distressed lettering and iconic poster artwork.',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/29.jpeg',
  'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/tshirts/29.jpeg',
  '/shop?universe=tfi',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;


INSERT INTO store_settings (id, setting_key, setting_value, is_public, updated_at)
VALUES (
  'fb8ef041-8270-5153-9a52-38762a45c06a',
  'store_brand',
  '{"domain":"th3ee.in","whatsappPhone":"919121798653","whatsappDisplay":"+91 9121798653","freeShippingLimit":999,"announcementText":"TH3EE HEAVYWEIGHT ARCHIVE • FREE EXPRESS SHIPPING OVER Rs.999"}'::jsonb,
  TRUE,
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;


INSERT INTO store_settings (id, setting_key, setting_value, is_public, updated_at)
VALUES (
  '63f0bb3a-ecd0-5243-9521-4a27730201ee',
  'coupon_stacking',
  '{"allow_stacking": false}'::jsonb,
  FALSE,
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;
