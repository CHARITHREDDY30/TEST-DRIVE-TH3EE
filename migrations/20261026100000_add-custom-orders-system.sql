-- =============================================================================
-- TH3EE ATELIER — Database Migration: Custom Apparel Customisation & Order System
-- =============================================================================

-- 1. Create custom_requests table
CREATE TABLE IF NOT EXISTS public.custom_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE NOT NULL,
  tracking_token text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  preferred_contact text DEFAULT 'whatsapp',
  design_type text NOT NULL CHECK (design_type IN ('have_design', 'have_idea')),
  design_description text,
  printing_instructions text,
  intended_use text DEFAULT 'personal',
  required_date date,
  garment_category text NOT NULL DEFAULT 'T-Shirt',
  fit text NOT NULL DEFAULT 'Oversized',
  sleeve text NOT NULL DEFAULT 'Half Sleeve',
  neck_type text NOT NULL DEFAULT 'Round Neck',
  fabric text NOT NULL DEFAULT '100% Combed Cotton',
  gsm text NOT NULL DEFAULT '240 GSM',
  primary_color text NOT NULL DEFAULT 'Jet Black',
  total_quantity integer NOT NULL DEFAULT 1 CHECK (total_quantity > 0),
  status text NOT NULL DEFAULT 'pending_review' CHECK (
    status IN (
      'pending_review',
      'under_review',
      'more_info_required',
      'quotation_sent',
      'awaiting_customer_approval',
      'awaiting_payment',
      'paid',
      'artwork_approval_pending',
      'in_production',
      'ready_for_dispatch',
      'shipped',
      'delivered',
      'cancelled',
      'quote_expired',
      'rejected'
    )
  ),
  current_quotation_id uuid,
  converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  shipping_address jsonb DEFAULT '{}'::jsonb,
  internal_notes text,
  artwork_approval_required boolean DEFAULT true,
  approved_proof_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create custom_request_variants table (size & color combinations)
CREATE TABLE IF NOT EXISTS public.custom_request_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  color text NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create custom_request_placements table (print positions & sizes)
CREATE TABLE IF NOT EXISTS public.custom_request_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  placement_location text NOT NULL,
  print_size text NOT NULL DEFAULT 'medium',
  custom_dimensions text,
  artwork_url text,
  artwork_key text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create custom_request_files table (uploaded artwork & references)
CREATE TABLE IF NOT EXISTS public.custom_request_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  file_type text NOT NULL DEFAULT 'artwork' CHECK (file_type IN ('artwork', 'reference', 'proof')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_key text,
  file_size_bytes bigint,
  mime_type text,
  target_placement text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Create custom_quotations table
CREATE TABLE IF NOT EXISTS public.custom_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  garment_base_price numeric NOT NULL DEFAULT 0 CHECK (garment_base_price >= 0),
  printing_charges numeric NOT NULL DEFAULT 0 CHECK (printing_charges >= 0),
  placement_charges numeric NOT NULL DEFAULT 0 CHECK (placement_charges >= 0),
  artwork_charges numeric NOT NULL DEFAULT 0 CHECK (artwork_charges >= 0),
  quantity_discount numeric NOT NULL DEFAULT 0 CHECK (quantity_discount >= 0),
  other_fees numeric NOT NULL DEFAULT 0 CHECK (other_fees >= 0),
  shipping_charges numeric NOT NULL DEFAULT 0 CHECK (shipping_charges >= 0),
  tax_charges numeric NOT NULL DEFAULT 0 CHECK (tax_charges >= 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  final_total numeric NOT NULL CHECK (final_total >= 0),
  estimated_production_days integer DEFAULT 5,
  valid_until timestamp with time zone,
  terms text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'revised')),
  accepted_at timestamp with time zone,
  line_items jsonb DEFAULT '[]'::jsonb,
  created_by text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Create custom_artwork_proofs table
CREATE TABLE IF NOT EXISTS public.custom_artwork_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  proof_image_url text NOT NULL,
  proof_image_key text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_requested')),
  customer_feedback text,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Create custom_request_timeline table
CREATE TABLE IF NOT EXISTS public.custom_request_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.custom_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  title text NOT NULL,
  description text,
  actor text NOT NULL DEFAULT 'system',
  created_at timestamp with time zone DEFAULT now()
);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_custom_req_token ON public.custom_requests(tracking_token);
CREATE INDEX IF NOT EXISTS idx_custom_req_number ON public.custom_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_custom_req_customer_id ON public.custom_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_req_status ON public.custom_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_req_created ON public.custom_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_variants_req ON public.custom_request_variants(request_id);
CREATE INDEX IF NOT EXISTS idx_custom_placements_req ON public.custom_request_placements(request_id);
CREATE INDEX IF NOT EXISTS idx_custom_files_req ON public.custom_request_files(request_id);
CREATE INDEX IF NOT EXISTS idx_custom_quotes_req ON public.custom_quotations(request_id);
CREATE INDEX IF NOT EXISTS idx_custom_proofs_req ON public.custom_artwork_proofs(request_id);
CREATE INDEX IF NOT EXISTS idx_custom_timeline_req ON public.custom_request_timeline(request_id);

-- 9. Enable RLS on all customisation tables
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_request_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_request_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_request_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_artwork_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_request_timeline ENABLE ROW LEVEL SECURITY;

-- 10. Direct grants to anon & authenticated
GRANT ALL ON public.custom_requests TO anon, authenticated;
GRANT ALL ON public.custom_request_variants TO anon, authenticated;
GRANT ALL ON public.custom_request_placements TO anon, authenticated;
GRANT ALL ON public.custom_request_files TO anon, authenticated;
GRANT ALL ON public.custom_quotations TO anon, authenticated;
GRANT ALL ON public.custom_artwork_proofs TO anon, authenticated;
GRANT ALL ON public.custom_request_timeline TO anon, authenticated;

-- RLS Policies
DROP POLICY IF EXISTS "Public access to custom_requests" ON public.custom_requests;
CREATE POLICY "Public access to custom_requests" ON public.custom_requests
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to custom_request_variants" ON public.custom_request_variants;
CREATE POLICY "Public access to custom_request_variants" ON public.custom_request_variants
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to custom_request_placements" ON public.custom_request_placements;
CREATE POLICY "Public access to custom_request_placements" ON public.custom_request_placements
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to custom_request_files" ON public.custom_request_files;
CREATE POLICY "Public access to custom_request_files" ON public.custom_request_files
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to custom_quotations" ON public.custom_quotations;
CREATE POLICY "Public access to custom_quotations" ON public.custom_quotations
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to custom_artwork_proofs" ON public.custom_artwork_proofs;
CREATE POLICY "Public access to custom_artwork_proofs" ON public.custom_artwork_proofs
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to custom_request_timeline" ON public.custom_request_timeline;
CREATE POLICY "Public access to custom_request_timeline" ON public.custom_request_timeline
  FOR ALL USING (true) WITH CHECK (true);

-- 11. Storage Policies for custom-artwork bucket
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON storage.objects TO authenticated, anon;
GRANT ALL ON storage.buckets TO authenticated, anon;

DROP POLICY IF EXISTS "Public Read Custom Artwork" ON storage.objects;
CREATE POLICY "Public Read Custom Artwork" ON storage.objects 
  FOR SELECT TO anon, authenticated 
  USING (bucket = 'custom-artwork');

DROP POLICY IF EXISTS "Public Insert Custom Artwork" ON storage.objects;
CREATE POLICY "Public Insert Custom Artwork" ON storage.objects 
  FOR ALL TO anon, authenticated 
  USING (bucket = 'custom-artwork') 
  WITH CHECK (bucket = 'custom-artwork');

-- 12. RPC: submit_customisation_request
CREATE OR REPLACE FUNCTION public.submit_customisation_request(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req_id uuid;
  v_req_num text;
  v_token text;
  v_cust_id uuid;
  v_var record;
  v_plc record;
  v_file record;
BEGIN
  -- Generate unique request number (e.g. TH3EE-CUST-8F4A1)
  v_req_num := 'TH3EE-CUST-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  -- Generate unguessable 32-character tracking token
  v_token := lower(md5(random()::text || clock_timestamp()::text) || md5(v_req_num));

  -- Handle optional customer ID
  IF (p_data->>'customer_id') IS NOT NULL AND (p_data->>'customer_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_cust_id := (p_data->>'customer_id')::uuid;
  ELSE
    v_cust_id := NULL;
  END IF;

  -- Insert custom request
  INSERT INTO public.custom_requests (
    request_number,
    tracking_token,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    preferred_contact,
    design_type,
    design_description,
    printing_instructions,
    intended_use,
    required_date,
    garment_category,
    fit,
    sleeve,
    neck_type,
    fabric,
    gsm,
    primary_color,
    total_quantity,
    status,
    shipping_address,
    internal_notes,
    artwork_approval_required
  ) VALUES (
    v_req_num,
    v_token,
    v_cust_id,
    COALESCE(p_data->>'customer_name', 'Customer'),
    COALESCE(p_data->>'customer_email', ''),
    COALESCE(p_data->>'customer_phone', ''),
    COALESCE(p_data->>'preferred_contact', 'whatsapp'),
    COALESCE(p_data->>'design_type', 'have_design'),
    p_data->>'design_description',
    p_data->>'printing_instructions',
    COALESCE(p_data->>'intended_use', 'personal'),
    CASE WHEN (p_data->>'required_date') IS NOT NULL AND (p_data->>'required_date') != '' THEN (p_data->>'required_date')::date ELSE NULL END,
    COALESCE(p_data->>'garment_category', 'T-Shirt'),
    COALESCE(p_data->>'fit', 'Oversized'),
    COALESCE(p_data->>'sleeve', 'Half Sleeve'),
    COALESCE(p_data->>'neck_type', 'Round Neck'),
    COALESCE(p_data->>'fabric', '100% Combed Cotton'),
    COALESCE(p_data->>'gsm', '240 GSM'),
    COALESCE(p_data->>'primary_color', 'Jet Black'),
    COALESCE((p_data->>'total_quantity')::integer, 1),
    'pending_review',
    COALESCE(p_data->'shipping_address', '{}'::jsonb),
    p_data->>'internal_notes',
    COALESCE((p_data->>'artwork_approval_required')::boolean, true)
  ) RETURNING id INTO v_req_id;

  -- Insert variants
  IF p_data->'variants' IS NOT NULL AND jsonb_array_length(p_data->'variants') > 0 THEN
    FOR v_var IN SELECT * FROM jsonb_to_recordset(p_data->'variants') AS (color text, size text, quantity integer, notes text)
    LOOP
      INSERT INTO public.custom_request_variants (request_id, color, size, quantity, notes)
      VALUES (v_req_id, v_var.color, v_var.size, COALESCE(v_var.quantity, 1), v_var.notes);
    END LOOP;
  ELSE
    -- Default 1 variant matching primary specs
    INSERT INTO public.custom_request_variants (request_id, color, size, quantity)
    VALUES (v_req_id, COALESCE(p_data->>'primary_color', 'Jet Black'), COALESCE(p_data->>'primary_size', 'L'), COALESCE((p_data->>'total_quantity')::integer, 1));
  END IF;

  -- Insert placements
  IF p_data->'placements' IS NOT NULL AND jsonb_array_length(p_data->'placements') > 0 THEN
    FOR v_plc IN SELECT * FROM jsonb_to_recordset(p_data->'placements') AS (placement_location text, print_size text, custom_dimensions text, artwork_url text, artwork_key text, notes text)
    LOOP
      INSERT INTO public.custom_request_placements (request_id, placement_location, print_size, custom_dimensions, artwork_url, artwork_key, notes)
      VALUES (v_req_id, v_plc.placement_location, COALESCE(v_plc.print_size, 'medium'), v_plc.custom_dimensions, v_plc.artwork_url, v_plc.artwork_key, v_plc.notes);
    END LOOP;
  END IF;

  -- Insert files
  IF p_data->'files' IS NOT NULL AND jsonb_array_length(p_data->'files') > 0 THEN
    FOR v_file IN SELECT * FROM jsonb_to_recordset(p_data->'files') AS (file_type text, file_name text, file_url text, file_key text, file_size_bytes bigint, mime_type text, target_placement text)
    LOOP
      INSERT INTO public.custom_request_files (request_id, file_type, file_name, file_url, file_key, file_size_bytes, mime_type, target_placement)
      VALUES (v_req_id, COALESCE(v_file.file_type, 'artwork'), v_file.file_name, v_file.file_url, v_file.file_key, v_file.file_size_bytes, v_file.mime_type, v_file.target_placement);
    END LOOP;
  END IF;

  -- Initial Timeline event
  INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
  VALUES (
    v_req_id,
    'pending_review',
    'Customisation Request Submitted',
    'Your custom apparel request has been registered and received by the TH3EE Tirupati Atelier studio team.',
    'customer'
  );

  RETURN jsonb_build_object(
    'success', true,
    'requestId', v_req_id,
    'requestNumber', v_req_num,
    'trackingToken', v_token,
    'status', 'pending_review'
  );
END;
$$;

-- 13. RPC: get_custom_request_by_token
CREATE OR REPLACE FUNCTION public.get_custom_request_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req record;
  v_variants jsonb;
  v_placements jsonb;
  v_files jsonb;
  v_quotation jsonb;
  v_proofs jsonb;
  v_timeline jsonb;
BEGIN
  SELECT * INTO v_req FROM public.custom_requests WHERE tracking_token = p_token OR request_number = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customisation request not found');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(v)), '[]'::jsonb) INTO v_variants
  FROM public.custom_request_variants v WHERE request_id = v_req.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb) INTO v_placements
  FROM public.custom_request_placements p WHERE request_id = v_req.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb) INTO v_files
  FROM public.custom_request_files f WHERE request_id = v_req.id;

  SELECT to_jsonb(q) INTO v_quotation
  FROM public.custom_quotations q 
  WHERE request_id = v_req.id AND status IN ('sent', 'accepted', 'draft')
  ORDER BY version DESC LIMIT 1;

  SELECT COALESCE(jsonb_agg(to_jsonb(pr) ORDER BY pr.version DESC), '[]'::jsonb) INTO v_proofs
  FROM public.custom_artwork_proofs pr WHERE request_id = v_req.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.created_at ASC), '[]'::jsonb) INTO v_timeline
  FROM public.custom_request_timeline t WHERE request_id = v_req.id;

  RETURN jsonb_build_object(
    'success', true,
    'request', to_jsonb(v_req),
    'variants', v_variants,
    'placements', v_placements,
    'files', v_files,
    'activeQuotation', v_quotation,
    'proofs', v_proofs,
    'timeline', v_timeline
  );
END;
$$;

-- 14. RPC: get_customer_custom_requests
CREATE OR REPLACE FUNCTION public.get_customer_custom_requests(p_customer_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_list jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb) INTO v_list
  FROM public.custom_requests r
  WHERE (p_customer_id IS NOT NULL AND r.customer_id = p_customer_id)
     OR (p_email IS NOT NULL AND lower(r.customer_email) = lower(p_email));

  RETURN jsonb_build_object('success', true, 'requests', v_list);
END;
$$;

-- 15. RPC: get_all_custom_requests_admin
CREATE OR REPLACE FUNCTION public.get_all_custom_requests_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_list jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb) INTO v_list
  FROM (
    SELECT 
      cr.*,
      (SELECT to_jsonb(q) FROM public.custom_quotations q WHERE q.request_id = cr.id ORDER BY version DESC LIMIT 1) as active_quotation,
      (SELECT count(*)::integer FROM public.custom_request_files f WHERE f.request_id = cr.id) as files_count,
      (SELECT count(*)::integer FROM public.custom_artwork_proofs pr WHERE pr.request_id = cr.id) as proofs_count
    FROM public.custom_requests cr
  ) r;

  RETURN jsonb_build_object('success', true, 'requests', v_list);
END;
$$;

-- 16. RPC: admin_create_custom_quotation
CREATE OR REPLACE FUNCTION public.admin_create_custom_quotation(p_request_id uuid, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id uuid;
  v_curr_ver integer := 1;
  v_subtotal numeric;
  v_final numeric;
BEGIN
  SELECT COALESCE(max(version), 0) + 1 INTO v_curr_ver
  FROM public.custom_quotations WHERE request_id = p_request_id;

  v_subtotal := COALESCE((p_payload->>'subtotal')::numeric, 0);
  v_final := COALESCE((p_payload->>'final_total')::numeric, v_subtotal);

  INSERT INTO public.custom_quotations (
    request_id,
    version,
    garment_base_price,
    printing_charges,
    placement_charges,
    artwork_charges,
    quantity_discount,
    other_fees,
    shipping_charges,
    tax_charges,
    subtotal,
    final_total,
    estimated_production_days,
    valid_until,
    terms,
    status,
    line_items,
    created_by
  ) VALUES (
    p_request_id,
    v_curr_ver,
    COALESCE((p_payload->>'garment_base_price')::numeric, 0),
    COALESCE((p_payload->>'printing_charges')::numeric, 0),
    COALESCE((p_payload->>'placement_charges')::numeric, 0),
    COALESCE((p_payload->>'artwork_charges')::numeric, 0),
    COALESCE((p_payload->>'quantity_discount')::numeric, 0),
    COALESCE((p_payload->>'other_fees')::numeric, 0),
    COALESCE((p_payload->>'shipping_charges')::numeric, 0),
    COALESCE((p_payload->>'tax_charges')::numeric, 0),
    v_subtotal,
    v_final,
    COALESCE((p_payload->>'estimated_production_days')::integer, 5),
    CASE WHEN (p_payload->>'valid_until') IS NOT NULL THEN (p_payload->>'valid_until')::timestamptz ELSE (now() + interval '7 days') END,
    p_payload->>'terms',
    'sent',
    COALESCE(p_payload->'line_items', '[]'::jsonb),
    COALESCE(p_payload->>'created_by', 'admin@th3ee.in')
  ) RETURNING id INTO v_quote_id;

  -- Update request status
  UPDATE public.custom_requests
  SET 
    current_quotation_id = v_quote_id,
    status = 'quotation_sent',
    updated_at = now()
  WHERE id = p_request_id;

  -- Timeline record
  INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
  VALUES (
    p_request_id,
    'quotation_sent',
    'Quotation Prepared & Sent (v' || v_curr_ver || ')',
    'Itemised quotation of ₹' || v_final || ' prepared by TH3EE Atelier. Awaiting customer acceptance.',
    'admin'
  );

  RETURN jsonb_build_object('success', true, 'quotationId', v_quote_id, 'version', v_curr_ver, 'status', 'quotation_sent');
END;
$$;

-- 17. RPC: customer_accept_custom_quotation
CREATE OR REPLACE FUNCTION public.customer_accept_custom_quotation(p_token text, p_quotation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req record;
  v_quote record;
BEGIN
  SELECT * INTO v_req FROM public.custom_requests WHERE tracking_token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid customisation token');
  END IF;

  SELECT * INTO v_quote FROM public.custom_quotations WHERE id = p_quotation_id AND request_id = v_req.id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quotation not found');
  END IF;

  IF v_quote.valid_until IS NOT NULL AND v_quote.valid_until < now() THEN
    UPDATE public.custom_quotations SET status = 'expired' WHERE id = p_quotation_id;
    UPDATE public.custom_requests SET status = 'quote_expired' WHERE id = v_req.id;
    RETURN jsonb_build_object('success', false, 'error', 'This quotation has expired. Please contact studio for a revised quote.');
  END IF;

  -- Mark quote as accepted
  UPDATE public.custom_quotations 
  SET status = 'accepted', accepted_at = now() 
  WHERE id = p_quotation_id;

  -- Update request status to awaiting_payment
  UPDATE public.custom_requests 
  SET status = 'awaiting_payment', updated_at = now() 
  WHERE id = v_req.id;

  INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
  VALUES (
    v_req.id,
    'awaiting_payment',
    'Quotation Accepted by Customer',
    'Customer accepted quotation v' || v_quote.version || ' (₹' || v_quote.final_total || '). Ready for secure payment.',
    'customer'
  );

  RETURN jsonb_build_object('success', true, 'status', 'awaiting_payment', 'finalAmount', v_quote.final_total);
END;
$$;

-- 18. RPC: customer_request_quotation_changes
CREATE OR REPLACE FUNCTION public.customer_request_quotation_changes(p_token text, p_notes text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req record;
BEGIN
  SELECT * INTO v_req FROM public.custom_requests WHERE tracking_token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid token');
  END IF;

  UPDATE public.custom_requests
  SET status = 'under_review', updated_at = now()
  WHERE id = v_req.id;

  INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
  VALUES (
    v_req.id,
    'under_review',
    'Customer Requested Changes',
    'Customer notes: ' || COALESCE(p_notes, 'Customer requested price/design adjustments.'),
    'customer'
  );

  RETURN jsonb_build_object('success', true, 'status', 'under_review');
END;
$$;

-- 19. RPC: admin_upload_artwork_proof
CREATE OR REPLACE FUNCTION public.admin_upload_artwork_proof(p_request_id uuid, p_proof_url text, p_proof_key text, p_notes text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proof_id uuid;
  v_ver integer := 1;
BEGIN
  SELECT COALESCE(max(version), 0) + 1 INTO v_ver
  FROM public.custom_artwork_proofs WHERE request_id = p_request_id;

  INSERT INTO public.custom_artwork_proofs (
    request_id,
    version,
    proof_image_url,
    proof_image_key,
    notes,
    status
  ) VALUES (
    p_request_id,
    v_ver,
    p_proof_url,
    p_proof_key,
    p_notes,
    'pending'
  ) RETURNING id INTO v_proof_id;

  UPDATE public.custom_requests
  SET 
    status = 'artwork_approval_pending',
    updated_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
  VALUES (
    p_request_id,
    'artwork_approval_pending',
    'Digital Artwork Proof Uploaded (Proof v' || v_ver || ')',
    'High-resolution digital proof ready for customer review and approval.',
    'admin'
  );

  RETURN jsonb_build_object('success', true, 'proofId', v_proof_id, 'version', v_ver, 'status', 'artwork_approval_pending');
END;
$$;

-- 20. RPC: customer_respond_artwork_proof
CREATE OR REPLACE FUNCTION public.customer_respond_artwork_proof(p_token text, p_proof_id uuid, p_approved boolean, p_feedback text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req record;
  v_proof record;
  v_new_status text;
BEGIN
  SELECT * INTO v_req FROM public.custom_requests WHERE tracking_token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid tracking token');
  END IF;

  SELECT * INTO v_proof FROM public.custom_artwork_proofs WHERE id = p_proof_id AND request_id = v_req.id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proof not found');
  END IF;

  IF p_approved THEN
    UPDATE public.custom_artwork_proofs
    SET status = 'approved', approved_at = now(), customer_feedback = p_feedback
    WHERE id = p_proof_id;

    -- If order is paid, move to in_production!
    IF v_req.status = 'paid' OR v_req.converted_order_id IS NOT NULL THEN
      v_new_status := 'in_production';
    ELSE
      v_new_status := 'awaiting_payment';
    END IF;

    UPDATE public.custom_requests
    SET 
      status = v_new_status,
      approved_proof_id = p_proof_id,
      updated_at = now()
    WHERE id = v_req.id;

    INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
    VALUES (
      v_req.id,
      v_new_status,
      'Artwork Proof Approved by Customer',
      'Proof v' || v_proof.version || ' approved. ' || CASE WHEN v_new_status = 'in_production' THEN 'Garment production initiated.' ELSE 'Ready for payment.' END,
      'customer'
    );
  ELSE
    UPDATE public.custom_artwork_proofs
    SET status = 'revision_requested', customer_feedback = p_feedback
    WHERE id = p_proof_id;

    UPDATE public.custom_requests
    SET status = 'under_review', updated_at = now()
    WHERE id = v_req.id;

    INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
    VALUES (
      v_req.id,
      'under_review',
      'Proof Revision Requested by Customer',
      'Customer feedback: ' || COALESCE(p_feedback, 'Requested modifications on digital proof.'),
      'customer'
    );
    v_new_status := 'under_review';
  END IF;

  RETURN jsonb_build_object('success', true, 'status', v_new_status, 'approved', p_approved);
END;
$$;

-- 21. RPC: confirm_custom_order_payment
CREATE OR REPLACE FUNCTION public.confirm_custom_order_payment(
  p_request_id uuid,
  p_token text,
  p_payment_id text,
  p_provider_order_id text,
  p_amount numeric,
  p_coupon_code text DEFAULT NULL,
  p_discount numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req record;
  v_quote record;
  v_order_id uuid;
  v_order_num text;
  v_final_payable numeric;
  v_next_status text;
BEGIN
  SELECT * INTO v_req FROM public.custom_requests WHERE id = p_request_id AND tracking_token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid custom request or tracking token');
  END IF;

  SELECT * INTO v_quote FROM public.custom_quotations WHERE id = v_req.current_quotation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active quotation found for this request');
  END IF;

  -- Authoritative server-side calculation
  v_final_payable := GREATEST(0, v_quote.final_total - COALESCE(p_discount, 0));

  -- Create corresponding order in public.orders if not already created
  IF v_req.converted_order_id IS NOT NULL THEN
    v_order_id := v_req.converted_order_id;
    SELECT order_number INTO v_order_num FROM public.orders WHERE id = v_order_id;
  ELSE
    v_order_id := gen_random_uuid();
    v_order_num := 'TH3EE-ORD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));

    INSERT INTO public.orders (
      id,
      order_number,
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      shipping_address,
      subtotal,
      discount_amount,
      shipping_amount,
      total_amount,
      order_status,
      payment_status,
      coupon_code,
      admin_notes,
      delivery_status,
      razorpay_order_id,
      razorpay_payment_id
    ) VALUES (
      v_order_id,
      v_order_num,
      v_req.customer_id,
      v_req.customer_name,
      v_req.customer_phone,
      v_req.customer_email,
      COALESCE(v_req.shipping_address, '{}'::jsonb),
      v_quote.subtotal,
      COALESCE(p_discount, 0),
      v_quote.shipping_charges,
      v_final_payable,
      'confirmed',
      'paid',
      p_coupon_code,
      'Custom Apparel: ' || v_req.garment_category || ' (' || v_req.fit || ') x' || v_req.total_quantity || ' [Ref: ' || v_req.request_number || ']',
      'Order confirmed',
      p_provider_order_id,
      p_payment_id
    );

    -- Create single custom order item
    INSERT INTO public.order_items (
      order_id,
      product_name,
      variant_title,
      quantity,
      unit_price,
      line_total,
      subtotal
    ) VALUES (
      v_order_id,
      'Custom ' || v_req.garment_category || ' (' || v_req.fit || ')',
      v_req.primary_color || ' / ' || v_req.fit,
      v_req.total_quantity,
      v_final_payable / GREATEST(1, v_req.total_quantity),
      v_final_payable,
      v_final_payable
    );
  END IF;

  -- Record payment in payments table
  INSERT INTO public.payments (
    order_id,
    provider,
    amount,
    currency,
    status,
    provider_payment_id,
    provider_order_id,
    verified_at,
    verification_notes
  ) VALUES (
    v_order_id,
    'razorpay',
    v_final_payable,
    'INR',
    'paid',
    p_payment_id,
    p_provider_order_id,
    now(),
    'Customisation request: ' || v_req.request_number
  );

  -- Determine next status
  IF v_req.artwork_approval_required AND v_req.approved_proof_id IS NULL THEN
    v_next_status := 'artwork_approval_pending';
  ELSE
    v_next_status := 'in_production';
  END IF;

  -- Update custom request
  UPDATE public.custom_requests
  SET
    status = v_next_status,
    converted_order_id = v_order_id,
    updated_at = now()
  WHERE id = v_req.id;

  -- Log timeline
  INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
  VALUES (
    v_req.id,
    v_next_status,
    'Payment Verified (₹' || v_final_payable || ')',
    'Payment successfully verified via Razorpay [Ref: ' || p_payment_id || ']. ' || CASE WHEN v_next_status = 'in_production' THEN 'Garment production started at Tirupati Atelier.' ELSE 'Waiting for final digital artwork approval before production starts.' END,
    'payment_gateway'
  );

  RETURN jsonb_build_object(
    'success', true,
    'orderId', v_order_id,
    'orderNumber', v_order_num,
    'status', v_next_status,
    'amount', v_final_payable
  );
END;
$$;

-- 22. RPC: admin_update_custom_order_status
CREATE OR REPLACE FUNCTION public.admin_update_custom_order_status(
  p_request_id uuid,
  p_status text,
  p_notes text DEFAULT NULL,
  p_tracking_number text DEFAULT NULL,
  p_tracking_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req record;
  v_order_id uuid;
BEGIN
  SELECT * INTO v_req FROM public.custom_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Custom request not found');
  END IF;

  UPDATE public.custom_requests
  SET 
    status = p_status,
    internal_notes = COALESCE(p_notes, internal_notes),
    updated_at = now()
  WHERE id = p_request_id;

  -- Also update converted order if present
  IF v_req.converted_order_id IS NOT NULL THEN
    v_order_id := v_req.converted_order_id;
    IF p_status = 'shipped' THEN
      UPDATE public.orders
      SET 
        order_status = 'shipped',
        delivery_status = 'Shipped',
        tracking_number = COALESCE(p_tracking_number, tracking_number),
        tracking_url = COALESCE(p_tracking_url, tracking_url),
        updated_at = now()
      WHERE id = v_order_id;
    ELSIF p_status = 'delivered' THEN
      UPDATE public.orders
      SET order_status = 'delivered', delivery_status = 'Delivered', updated_at = now()
      WHERE id = v_order_id;
    END IF;
  END IF;

  INSERT INTO public.custom_request_timeline (request_id, status, title, description, actor)
  VALUES (
    p_request_id,
    p_status,
    'Status Updated: ' || replace(initcap(replace(p_status, '_', ' ')), ' ', ' '),
    COALESCE(p_notes, 'Order progression updated by TH3EE Atelier administration.'),
    'admin'
  );

  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

-- 23. Grant execute on all RPCs to anon & authenticated
GRANT EXECUTE ON FUNCTION public.submit_customisation_request(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_custom_request_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_custom_requests(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_custom_requests_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_custom_quotation(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_accept_custom_quotation(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_request_quotation_changes(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upload_artwork_proof(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_respond_artwork_proof(text, uuid, boolean, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_custom_order_payment(uuid, text, text, text, numeric, text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_custom_order_status(uuid, text, text, text, text) TO anon, authenticated;
