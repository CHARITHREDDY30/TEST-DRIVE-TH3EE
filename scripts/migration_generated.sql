-- TH3EE Catalog Migration (Idempotent)
BEGIN;

INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'f5670e2b-c9bf-573a-9c5b-3d0391a4fff2',
  'All TFI Cult',
  'tfi-tfi',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '35b3643b-c2a1-590c-8717-cc3847cc4007',
  'Baahubali',
  'tfi-bah',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '313b73f8-4fc4-5135-ab96-7f591fece7fb',
  'Salaar',
  'tfi-slr',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '8461429c-98b3-5969-8167-7e6035478c0c',
  'Spirit',
  'tfi-spt',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '5bab2271-0c61-5fb7-866d-ea1c3f0a8b2f',
  'RRR Fire & Water',
  'tfi-rrr',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '0405ccfc-0d30-5e7f-b6cc-0d47a464564c',
  'Kalki 2898 AD',
  'tfi-klk',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  6,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '4e1909e5-feb3-56e1-b831-b710f10ae5e5',
  'Pushpa Raw',
  'tfi-psh',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  7,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '01bdad30-2340-5c60-b112-5827d9701662',
  'Devara',
  'tfi-dvr',
  'Subcategory of TFI',
  NULL,
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '4e744cfa-cca3-51be-a170-2f8420f6734f',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '3e8eeb70-295e-593a-8236-b91999b4a33e',
  'All Anime',
  'anime-all',
  'Subcategory of ANIME',
  NULL,
  '4e744cfa-cca3-51be-a170-2f8420f6734f',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'ea45dbfe-970b-58d7-bee3-38a9f1381d3d',
  'Demon Slayer',
  'anime-kim',
  'Subcategory of ANIME',
  NULL,
  '4e744cfa-cca3-51be-a170-2f8420f6734f',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '8891cc2c-384c-58dd-bf7d-5e269c023cb4',
  'Naruto',
  'anime-uzu',
  'Subcategory of ANIME',
  NULL,
  '4e744cfa-cca3-51be-a170-2f8420f6734f',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '255af9a0-3007-5fb8-b1f8-bb195ce8b90a',
  'Attack On Titan',
  'anime-shi',
  'Subcategory of ANIME',
  NULL,
  '4e744cfa-cca3-51be-a170-2f8420f6734f',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'c320c53a-1f8e-5577-8b25-6bddf508d23e',
  'One Piece',
  'anime-str',
  'Subcategory of ANIME',
  NULL,
  '4e744cfa-cca3-51be-a170-2f8420f6734f',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '6f671f76-345c-58c9-943a-fb6cb66c0670',
  'Jujutsu Kaisen',
  'anime-sor',
  'Subcategory of ANIME',
  NULL,
  '4e744cfa-cca3-51be-a170-2f8420f6734f',
  6,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '317ac275-0c7b-5a8a-9ef9-6777ec5c03a9',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'ca513fa2-27c4-52b2-b14a-f5a94282a471',
  'All Marvel',
  'marvel-mcu',
  'Subcategory of MARVEL',
  NULL,
  '317ac275-0c7b-5a8a-9ef9-6777ec5c03a9',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '1cc7db6c-9894-5142-b1c3-91cd9a794e7a',
  'Spider-Man',
  'marvel-spd',
  'Subcategory of MARVEL',
  NULL,
  '317ac275-0c7b-5a8a-9ef9-6777ec5c03a9',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '32b4bf80-6d6f-5b71-918b-39f7c210738a',
  'Iron Man',
  'marvel-arc',
  'Subcategory of MARVEL',
  NULL,
  '317ac275-0c7b-5a8a-9ef9-6777ec5c03a9',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '3a181d2c-f772-5c2b-85c6-c0847b821255',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'ec68e8af-f701-5024-aa3c-1be43f17ef51',
  'All DC',
  'dc-dcu',
  'Subcategory of DC',
  NULL,
  '3a181d2c-f772-5c2b-85c6-c0847b821255',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '90d37aca-2ca0-5cf8-85f5-193ada6bb3f1',
  'The Batman',
  'dc-dkn',
  'Subcategory of DC',
  NULL,
  '3a181d2c-f772-5c2b-85c6-c0847b821255',
  2,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '79b2fc81-e12c-5712-be67-a23489446f2c',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '941838ca-595c-5730-b44d-9dc5c02bc592',
  'All Wizarding',
  'harry-potter-hp',
  'Subcategory of HARRY POTTER',
  NULL,
  '79b2fc81-e12c-5712-be67-a23489446f2c',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '394b61f4-cd12-5f80-92ba-3612bdc30a3e',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '7b8aa7c8-5be6-51ed-b684-41125a53e9d6',
  'All Nani Drops',
  'nanis-paradise-npr',
  'Subcategory of NANI''S PARADISE',
  NULL,
  '394b61f4-cd12-5f80-92ba-3612bdc30a3e',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'd6e4da84-8d22-57e1-8fa5-4c58d69a4026',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'b19c1d38-bc26-584a-91c4-91f20643241e',
  'All Doomsday',
  'doomsday-dmd',
  'Subcategory of DOOMSDAY',
  NULL,
  'd6e4da84-8d22-57e1-8fa5-4c58d69a4026',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '22f8734f-f364-5181-9be6-5df9a91619dc',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '59390ead-552c-5c78-ba82-531929aeaecd',
  'All Memes',
  'memes-mem',
  'Subcategory of MEMES',
  NULL,
  '22f8734f-f364-5181-9be6-5df9a91619dc',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '21be6470-1e59-5814-9424-e3da343e8d81',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '2fa28e2b-07ae-5d7b-9468-9fa16e927b3d',
  'All Gaming',
  'game-gam',
  'Subcategory of GAME',
  NULL,
  '21be6470-1e59-5814-9424-e3da343e8d81',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'b2e95306-c894-59d6-bc0c-7eddfc78e53d',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '19cb4225-9bb5-562c-81f1-517d882b7946',
  'All Festival',
  'festival-fst',
  'Subcategory of FESTIVAL',
  NULL,
  'b2e95306-c894-59d6-bc0c-7eddfc78e53d',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '6fb2e194-4d2d-5893-b84f-60204cd10210',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '7dda52ce-bb63-5694-9dfc-8339029f5693',
  'All Custom',
  'customise-cst',
  'Subcategory of CUSTOMISE',
  NULL,
  '6fb2e194-4d2d-5893-b84f-60204cd10210',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  'd1f6ba02-ab40-5f84-a7db-e20d5162601f',
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
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at)
VALUES (
  '1952f126-6c0d-5f7e-9d64-e9bc12b9e979',
  'All Campus',
  'college-cmp',
  'Subcategory of COLLEGE',
  NULL,
  'd1f6ba02-ab40-5f84-a7db-e20d5162601f',
  1,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01',
  'BAAHUBALI: THE BEGINNING CULT GRAPHIC TEE',
  'baahubali-the-beginning-cult-graphic-tee',
  'Official @th3ee.verse drop. Heavyweight 290 GSM loopback cotton tee featuring the Shivudu Mahishmati ascension artwork rendered with high-density gold and crimson metallic screenprints. Finished with minimal ''PRABHAS / BAAHUBALI'' chest insignia and signature ''TH3EE — WEAR THE SOUL'' rear graphic.',
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
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
ON CONFLICT (slug) DO UPDATE SET
  legacy_id = EXCLUDED.legacy_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  universe_id = EXCLUDED.universe_id,
  selling_price = EXCLUDED.selling_price,
  original_price = EXCLUDED.original_price,
  gsm = EXCLUDED.gsm,
  fabric = EXCLUDED.fabric,
  fit = EXCLUDED.fit,
  image = EXCLUDED.image,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  available_sizes = EXCLUDED.available_sizes,
  specifications = EXCLUDED.specifications,
  specs = EXCLUDED.specs,
  care = EXCLUDED.care,
  badge = EXCLUDED.badge,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  in_stock = EXCLUDED.in_stock,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '851688e4-c22a-55d1-bc55-dbe862e03817',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-washed-carbon-black-s',
  'S',
  'Washed Carbon Black',
  '#1C1C1C',
  14,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '8d7a26de-738c-58f0-bd6a-118d00011a56',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-washed-carbon-black-m',
  'M',
  'Washed Carbon Black',
  '#1C1C1C',
  22,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '34909f17-e8c4-5aea-91af-2b69715b83bb',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-washed-carbon-black-l',
  'L',
  'Washed Carbon Black',
  '#1C1C1C',
  35,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '7717b354-4211-5fe6-9a0e-3f096fe31325',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-washed-carbon-black-xl',
  'XL',
  'Washed Carbon Black',
  '#1C1C1C',
  18,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '8db05696-b263-59d1-8062-18631a90c77f',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-washed-carbon-black-xxl',
  'XXL',
  'Washed Carbon Black',
  '#1C1C1C',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '83fdbc06-87e3-50e9-b0ad-b2053a20a73b',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-blood-ochre-red-s',
  'S',
  'Blood Ochre Red',
  '#8B1E1E',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '365bae2c-9e2f-58e5-bcf2-2a54864a70f9',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-blood-ochre-red-m',
  'M',
  'Blood Ochre Red',
  '#8B1E1E',
  16,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'b659a559-18e9-508f-9f6e-3bc8c684242a',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-blood-ochre-red-l',
  'L',
  'Blood Ochre Red',
  '#8B1E1E',
  20,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '17e828fd-7a81-5c3c-903d-ec5532e8e359',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-blood-ochre-red-xl',
  'XL',
  'Blood Ochre Red',
  '#8B1E1E',
  12,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '044195ac-2adc-5085-ad61-081c4fc8b56b',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-blood-ochre-red-xxl',
  'XXL',
  'Blood Ochre Red',
  '#8B1E1E',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1429c6aa-0585-5357-a35c-a0ad78d182bd',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-antique-sand-s',
  'S',
  'Antique Sand',
  '#D4C5B9',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'f4e69876-70f4-50b3-aa55-73f8f557d8a3',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-antique-sand-m',
  'M',
  'Antique Sand',
  '#D4C5B9',
  12,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '41cf4d6d-0f6e-5e74-a0ec-fbd6df1bc020',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-antique-sand-l',
  'L',
  'Antique Sand',
  '#D4C5B9',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '584ff030-b8cc-5c93-8331-a6137968e030',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-antique-sand-xl',
  'XL',
  'Antique Sand',
  '#D4C5B9',
  9,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '8c2559f0-8723-5074-a920-841a6935d7a5',
  '4f1cde85-f26a-5168-bbcb-70ee06ebd434',
  'th-bahubali-01-antique-sand-xxl',
  'XXL',
  'Antique Sand',
  '#D4C5B9',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01',
  'SALAAR: DEVARATHA CULT RINGER OVERSIZED TEE',
  'salaar-devaratha-cult-ringer-oversized-tee',
  'Official @th3ee.verse drop. Heavyweight 290 GSM loopback cotton ringer tee inspired by the ruthless warlord Devaratha of Khansaar. Features a front tribal warrior totem emblem and a high-density back print with bold SALAAR typography, scarlet script ''devaratha'', and signature ''MAKE CODE TH3EE'' atelier insignia.',
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
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
ON CONFLICT (slug) DO UPDATE SET
  legacy_id = EXCLUDED.legacy_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  universe_id = EXCLUDED.universe_id,
  selling_price = EXCLUDED.selling_price,
  original_price = EXCLUDED.original_price,
  gsm = EXCLUDED.gsm,
  fabric = EXCLUDED.fabric,
  fit = EXCLUDED.fit,
  image = EXCLUDED.image,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  available_sizes = EXCLUDED.available_sizes,
  specifications = EXCLUDED.specifications,
  specs = EXCLUDED.specs,
  care = EXCLUDED.care,
  badge = EXCLUDED.badge,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  in_stock = EXCLUDED.in_stock,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '2cb68d65-d169-5f25-8e5c-32211e3b4900',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-vintage-chalk-white-crimson-rib-s',
  'S',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  12,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '5bd9ae87-99dc-50a6-bfa0-a844028ceaba',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-vintage-chalk-white-crimson-rib-m',
  'M',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  25,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'abae2b28-efaf-5c6d-8003-18b361497ab3',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-vintage-chalk-white-crimson-rib-l',
  'L',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  40,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '969a9368-13c4-5527-9fca-83aa99bb6689',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-vintage-chalk-white-crimson-rib-xl',
  'XL',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  22,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '4518295d-41e3-5405-8902-ed023a8e89cc',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-vintage-chalk-white-crimson-rib-xxl',
  'XXL',
  'Vintage Chalk White & Crimson Rib',
  '#F4F4F0',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'a142fb2b-d183-5966-8e21-d16cc57e15e4',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-washed-carbon-black-s',
  'S',
  'Washed Carbon Black',
  '#1C1C1C',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '831e48fe-7676-5bd1-978f-e15911bf5993',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-washed-carbon-black-m',
  'M',
  'Washed Carbon Black',
  '#1C1C1C',
  20,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'faf7b261-6420-5d67-ae1b-f42db5ee3157',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-washed-carbon-black-l',
  'L',
  'Washed Carbon Black',
  '#1C1C1C',
  30,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '0ab8d1e8-c1dd-52b8-9e43-cf3f42bf20f0',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-washed-carbon-black-xl',
  'XL',
  'Washed Carbon Black',
  '#1C1C1C',
  16,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '4a0be7e9-bb23-51a6-a822-896a23eec17e',
  'b2586efc-1f6c-5726-91c4-7352fb1cc340',
  'th-salaar-01-washed-carbon-black-xxl',
  'XXL',
  'Washed Carbon Black',
  '#1C1C1C',
  6,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  'dd393703-ec13-5a82-92b2-8f69aa3983e8',
  'th-spirit-02',
  'SPIRIT: BORN TO STAND OUT HEAVYWEIGHT TEE',
  'spirit-born-to-stand-out-oversized-tee',
  'Official @th3ee.verse drop. ''BORN TO STAND OUT'' Spirit oversized graphic tee crafted from 280 GSM premium ring-spun compact cotton. Features front ''ONE BAD HABIT'' crimson block lettering and an iconic rear vintage artwork print with star accents and stylized Spirit branding.',
  'f63d740e-e9af-5e85-9f77-cb0dca17f13f',
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
ON CONFLICT (slug) DO UPDATE SET
  legacy_id = EXCLUDED.legacy_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  universe_id = EXCLUDED.universe_id,
  selling_price = EXCLUDED.selling_price,
  original_price = EXCLUDED.original_price,
  gsm = EXCLUDED.gsm,
  fabric = EXCLUDED.fabric,
  fit = EXCLUDED.fit,
  image = EXCLUDED.image,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  available_sizes = EXCLUDED.available_sizes,
  specifications = EXCLUDED.specifications,
  specs = EXCLUDED.specs,
  care = EXCLUDED.care,
  badge = EXCLUDED.badge,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  in_stock = EXCLUDED.in_stock,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'b4bc82ec-2aad-5d3f-9b98-0a66a8f5930e',
  'dd393703-ec13-5a82-92b2-8f69aa3983e8',
  'th-spirit-02-chalk-white-s',
  'S',
  'Chalk White',
  '#F9F9F7',
  9,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '99f201aa-c0a1-5bfe-9222-5910adf557a5',
  'dd393703-ec13-5a82-92b2-8f69aa3983e8',
  'th-spirit-02-chalk-white-m',
  'M',
  'Chalk White',
  '#F9F9F7',
  18,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '7f21aa41-befd-5b4d-81b2-5d61c13955bc',
  'dd393703-ec13-5a82-92b2-8f69aa3983e8',
  'th-spirit-02-chalk-white-l',
  'L',
  'Chalk White',
  '#F9F9F7',
  28,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'd6054a24-0285-5139-8c1e-db0f59849f0e',
  'dd393703-ec13-5a82-92b2-8f69aa3983e8',
  'th-spirit-02-chalk-white-xl',
  'XL',
  'Chalk White',
  '#F9F9F7',
  14,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1f9fcd95-a42c-5dc0-a258-80033e1df91f',
  'dd393703-ec13-5a82-92b2-8f69aa3983e8',
  'th-spirit-02-chalk-white-xxl',
  'XXL',
  'Chalk White',
  '#F9F9F7',
  7,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '5456e45b-2c4f-526e-9c01-13f6f7e339b9',
  'th-01',
  'BATMAN DARK KNIGHT OVERSIZED GRAPHIC TEE',
  'batman-dark-knight-oversized-graphic-tee',
  'Unleash the Dark Knight with this Batman-inspired oversized graphic T-shirt from TH3EE. Crafted from heavyweight 280 GSM loopback terry cotton, featuring a bold Batman graphic, premium print detailing, and a relaxed boxy silhouette for everyday streetwear.',
  '3a181d2c-f772-5c2b-85c6-c0847b821255',
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
ON CONFLICT (slug) DO UPDATE SET
  legacy_id = EXCLUDED.legacy_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  universe_id = EXCLUDED.universe_id,
  selling_price = EXCLUDED.selling_price,
  original_price = EXCLUDED.original_price,
  gsm = EXCLUDED.gsm,
  fabric = EXCLUDED.fabric,
  fit = EXCLUDED.fit,
  image = EXCLUDED.image,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  available_sizes = EXCLUDED.available_sizes,
  specifications = EXCLUDED.specifications,
  specs = EXCLUDED.specs,
  care = EXCLUDED.care,
  badge = EXCLUDED.badge,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  in_stock = EXCLUDED.in_stock,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '92b48d0e-555c-5237-a542-d6ea90ac1a33',
  '5456e45b-2c4f-526e-9c01-13f6f7e339b9',
  'th-01-washed-black-s',
  'S',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '80125336-f439-51ab-a320-23cacd51eaa8',
  '5456e45b-2c4f-526e-9c01-13f6f7e339b9',
  'th-01-washed-black-m',
  'M',
  'Washed Black',
  '#1F1F1F',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'ae2fd35d-8e36-58d5-b537-92ee3d263638',
  '5456e45b-2c4f-526e-9c01-13f6f7e339b9',
  'th-01-washed-black-l',
  'L',
  'Washed Black',
  '#1F1F1F',
  25,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '0a4574cd-83b0-584f-8010-b5d28bfd63a2',
  '5456e45b-2c4f-526e-9c01-13f6f7e339b9',
  'th-01-washed-black-xl',
  'XL',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'dbd69438-9383-5954-b617-c92da21436c2',
  '5456e45b-2c4f-526e-9c01-13f6f7e339b9',
  'th-01-washed-black-xxl',
  'XXL',
  'Washed Black',
  '#1F1F1F',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02',
  'SPIDER-MAN OVERSIZED GRAPHIC TEE',
  'spider-man-oversized-graphic-tee',
  'Swing into streetwear with the TH3EE Spider-Man oversized graphic tee. Crafted from heavyweight 280 GSM loopback terry cotton, featuring a bold Spider-Man-inspired graphic, premium print detailing, and a relaxed boxy silhouette.',
  '317ac275-0c7b-5a8a-9ef9-6777ec5c03a9',
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
ON CONFLICT (slug) DO UPDATE SET
  legacy_id = EXCLUDED.legacy_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  universe_id = EXCLUDED.universe_id,
  selling_price = EXCLUDED.selling_price,
  original_price = EXCLUDED.original_price,
  gsm = EXCLUDED.gsm,
  fabric = EXCLUDED.fabric,
  fit = EXCLUDED.fit,
  image = EXCLUDED.image,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  available_sizes = EXCLUDED.available_sizes,
  specifications = EXCLUDED.specifications,
  specs = EXCLUDED.specs,
  care = EXCLUDED.care,
  badge = EXCLUDED.badge,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  in_stock = EXCLUDED.in_stock,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'aaee2085-9d9c-5847-a0b8-d65b6487bea9',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-blood-ochre-red-s',
  'S',
  'Blood Ochre Red',
  '#8B1E1E',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'd2bd7d74-65d3-5308-a6f3-376d094adf31',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-blood-ochre-red-m',
  'M',
  'Blood Ochre Red',
  '#8B1E1E',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '8e4f7965-2b48-57fd-8aa8-1549c5672be7',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-blood-ochre-red-l',
  'L',
  'Blood Ochre Red',
  '#8B1E1E',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '48937b36-ef5e-530b-b54b-357897a04ef9',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-blood-ochre-red-xl',
  'XL',
  'Blood Ochre Red',
  '#8B1E1E',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '1f58c3f7-145c-5f95-b973-c4388cf64395',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-blood-ochre-red-xxl',
  'XXL',
  'Blood Ochre Red',
  '#8B1E1E',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '791eb1b1-7b5e-5236-ac82-4d5149b9a70c',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-washed-black-s',
  'S',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'df0ad823-3bf2-5da1-a1f7-08250869e059',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-washed-black-m',
  'M',
  'Washed Black',
  '#1F1F1F',
  15,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'c5a5d023-42e3-55d8-855a-3d5f8fcb1d0e',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-washed-black-l',
  'L',
  'Washed Black',
  '#1F1F1F',
  25,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'a20f87ed-bc56-5663-8fbc-89e714e130e1',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-washed-black-xl',
  'XL',
  'Washed Black',
  '#1F1F1F',
  10,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'f496c088-7ba4-5182-bf10-4283c0250d80',
  '037bb243-6ea1-57f3-85f7-9539dea0bcae',
  'th-02-washed-black-xxl',
  'XXL',
  'Washed Black',
  '#1F1F1F',
  4,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO products (
  id, legacy_id, name, slug, description, category_id, category, subcategory, universe_id,
  selling_price, original_price, gsm, fabric, fit,
  image, image_url, image_urls,
  sizes, colors, available_sizes,
  specifications, specs, care,
  badge, rating, reviews_count, in_stock, is_published, created_at, updated_at
) VALUES (
  '189388b4-c614-5d0b-8e9c-faab9c016e4f',
  'th-04',
  '500 GSM ULTIMATE FRENCH TERRY HOODIE',
  '500-gsm-ultimate-french-terry-hoodie',
  'Our heaviest outerwear piece. Custom milled 500 GSM double-face French terry cotton with an articulated double-layered hood and zero drawstrings for a pure structural look.',
  'd1f6ba02-ab40-5f84-a7db-e20d5162601f',
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
ON CONFLICT (slug) DO UPDATE SET
  legacy_id = EXCLUDED.legacy_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  universe_id = EXCLUDED.universe_id,
  selling_price = EXCLUDED.selling_price,
  original_price = EXCLUDED.original_price,
  gsm = EXCLUDED.gsm,
  fabric = EXCLUDED.fabric,
  fit = EXCLUDED.fit,
  image = EXCLUDED.image,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  colors = EXCLUDED.colors,
  available_sizes = EXCLUDED.available_sizes,
  specifications = EXCLUDED.specifications,
  specs = EXCLUDED.specs,
  care = EXCLUDED.care,
  badge = EXCLUDED.badge,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  in_stock = EXCLUDED.in_stock,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'f43e355b-e52a-5788-8f2b-449e99eccfbd',
  '189388b4-c614-5d0b-8e9c-faab9c016e4f',
  'th-04-obsidian-black-s',
  'S',
  'Obsidian Black',
  '#111111',
  5,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '925e0944-3d42-5e60-ac46-4fb793329934',
  '189388b4-c614-5d0b-8e9c-faab9c016e4f',
  'th-04-obsidian-black-m',
  'M',
  'Obsidian Black',
  '#111111',
  8,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'c649f01b-0a90-5551-a886-0913f2d90c70',
  '189388b4-c614-5d0b-8e9c-faab9c016e4f',
  'th-04-obsidian-black-l',
  'L',
  'Obsidian Black',
  '#111111',
  14,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  '8028c6f5-e065-56ad-a24f-2aab3c6de193',
  '189388b4-c614-5d0b-8e9c-faab9c016e4f',
  'th-04-obsidian-black-xl',
  'XL',
  'Obsidian Black',
  '#111111',
  7,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity, is_active, created_at, updated_at
) VALUES (
  'dea9c077-f1d2-5583-98c3-d0b0b099cc70',
  '189388b4-c614-5d0b-8e9c-faab9c016e4f',
  'th-04-obsidian-black-xxl',
  'XXL',
  'Obsidian Black',
  '#111111',
  3,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (product_id, size, color_name) DO UPDATE SET
  sku = EXCLUDED.sku,
  color_code = EXCLUDED.color_code,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO hero_slides (
  id, title, subtitle, image_url, mobile_image_url, target_url, sort_order, is_active, created_at, updated_at
) VALUES (
  'eab8653b-0942-588b-9271-ab69c4d77180',
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
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  image_url = EXCLUDED.image_url,
  mobile_image_url = EXCLUDED.mobile_image_url,
  target_url = EXCLUDED.target_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO hero_slides (
  id, title, subtitle, image_url, mobile_image_url, target_url, sort_order, is_active, created_at, updated_at
) VALUES (
  'e20da5e2-c618-5cb7-b1d1-8978a60e23c8',
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
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  image_url = EXCLUDED.image_url,
  mobile_image_url = EXCLUDED.mobile_image_url,
  target_url = EXCLUDED.target_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO hero_slides (
  id, title, subtitle, image_url, mobile_image_url, target_url, sort_order, is_active, created_at, updated_at
) VALUES (
  '11001e4c-8e77-52a2-862d-7c60530c697c',
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
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  image_url = EXCLUDED.image_url,
  mobile_image_url = EXCLUDED.mobile_image_url,
  target_url = EXCLUDED.target_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


INSERT INTO store_settings (id, setting_key, setting_value, is_public, updated_at)
VALUES (
  '13ee21c4-2931-5464-a0ee-4b541c41e471',
  'store_brand',
  '{"domain":"th3ee.in","whatsappPhone":"919121798653","whatsappDisplay":"+91 9121798653","freeShippingLimit":999,"announcementText":"TH3EE HEAVYWEIGHT ARCHIVE • FREE EXPRESS SHIPPING OVER Rs.999"}'::jsonb,
  TRUE,
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();


INSERT INTO store_settings (id, setting_key, setting_value, is_public, updated_at)
VALUES (
  'fc9ef9a3-c34e-5bc9-a272-da1626a48d82',
  'coupon_stacking',
  '{"allow_stacking": false}'::jsonb,
  FALSE,
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();


INSERT INTO coupons (
  id, code, description, discount_type, discount_value, minimum_order_amount,
  maximum_discount, usage_limit, usage_count, is_active, can_stack, created_at, updated_at
) VALUES (
  'ba4b6084-aafe-559a-b3aa-6abb9bba5b94',
  'FIRSTDROP',
  'First order discount of Rs.100',
  'fixed',
  100,
  499,
  100,
  500,
  0,
  TRUE,
  FALSE,
  NOW(),
  NOW()
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  minimum_order_amount = EXCLUDED.minimum_order_amount,
  maximum_discount = EXCLUDED.maximum_discount,
  is_active = EXCLUDED.is_active,
  can_stack = EXCLUDED.can_stack,
  updated_at = NOW();


INSERT INTO coupons (
  id, code, description, discount_type, discount_value, minimum_order_amount,
  maximum_discount, usage_limit, usage_count, is_active, can_stack, created_at, updated_at
) VALUES (
  '8ee4a50c-969b-5de8-b2ad-0f04c7ebdc44',
  'TH3EE10',
  '10% off on all streetwear orders',
  'percentage',
  10,
  499,
  250,
  1000,
  0,
  TRUE,
  FALSE,
  NOW(),
  NOW()
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  minimum_order_amount = EXCLUDED.minimum_order_amount,
  maximum_discount = EXCLUDED.maximum_discount,
  is_active = EXCLUDED.is_active,
  can_stack = EXCLUDED.can_stack,
  updated_at = NOW();


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Public create orders'
  ) THEN
    CREATE POLICY "Public create orders" ON orders 
      FOR INSERT TO anon, authenticated 
      WITH CHECK (order_status = 'pending' AND payment_status = 'unpaid');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Public create order items'
  ) THEN
    CREATE POLICY "Public create order items" ON order_items 
      FOR INSERT TO anon, authenticated 
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'Public read active coupons'
  ) THEN
    CREATE POLICY "Public read active coupons" ON coupons 
      FOR SELECT TO anon, authenticated 
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'product_variants' AND policyname = 'Public read active variants'
  ) THEN
    CREATE POLICY "Public read active variants" ON product_variants 
      FOR SELECT TO anon, authenticated 
      USING (is_active = true);
  END IF;
END $$;

COMMIT;