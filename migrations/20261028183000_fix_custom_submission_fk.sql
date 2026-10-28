-- Fix foreign key constraint and ensure submit_customisation_request never fails on non-existent customer_id
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

  -- Handle optional customer ID with safe existence check against public.customers
  IF (p_data->>'customer_id') IS NOT NULL AND (p_data->>'customer_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_cust_id FROM public.customers WHERE id = (p_data->>'customer_id')::uuid;
    IF NOT FOUND THEN
      v_cust_id := NULL;
    END IF;
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

GRANT EXECUTE ON FUNCTION public.submit_customisation_request(jsonb) TO anon, authenticated;
