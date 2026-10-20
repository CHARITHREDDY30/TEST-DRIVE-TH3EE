GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated, anon;
GRANT ALL ON storage.buckets TO authenticated, anon;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" ON storage.objects 
  FOR SELECT TO anon, authenticated 
  USING (bucket = 'avatars');

DROP POLICY IF EXISTS "All Access Avatars" ON storage.objects;
CREATE POLICY "All Access Avatars" ON storage.objects 
  FOR ALL TO anon, authenticated 
  USING (bucket = 'avatars') 
  WITH CHECK (bucket = 'avatars');
