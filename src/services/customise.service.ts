import { insforge, isInsForgeConfigured } from '../lib/insforge';
import type {
  CustomRequest,
  CustomisationCatalogConfig,
  CustomQuotation,
  CustomArtworkProof,
  CustomRequestVariant,
  CustomRequestPlacement,
  CustomRequestFile
} from '../types/customise';
import { INITIAL_CUSTOMISATION_CATALOG } from '../data/customiseCatalog';

export interface SubmitCustomRequestPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_contact?: 'whatsapp' | 'email' | 'phone';
  customer_id?: string;
  design_type: 'have_design' | 'have_idea';
  design_description?: string;
  printing_instructions?: string;
  intended_use?: string;
  required_date?: string;
  garment_category: string;
  fit: string;
  sleeve: string;
  neck_type: string;
  fabric: string;
  gsm: string;
  primary_color: string;
  total_quantity: number;
  shipping_address?: Record<string, any>;
  internal_notes?: string;
  artwork_approval_required?: boolean;
  variants?: Array<{
    color: string;
    size: string;
    quantity: number;
    notes?: string;
  }>;
  placements?: Array<{
    placement_location: string;
    print_size: string;
    custom_dimensions?: string;
    artwork_url?: string;
    artwork_key?: string;
    notes?: string;
  }>;
  files?: Array<{
    file_type: 'artwork' | 'reference' | 'proof';
    file_name: string;
    file_url: string;
    file_key?: string;
    file_size_bytes?: number;
    mime_type?: string;
    target_placement?: string;
  }>;
}

export const customiseService = {
  /**
   * Fetches admin-configured customisation catalog with size charts, fits, and specs.
   */
  async getCatalog(): Promise<CustomisationCatalogConfig> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'customisation_catalog')
          .maybeSingle();

        if (!error && data && data.setting_value) {
          const val = data.setting_value as Partial<CustomisationCatalogConfig>;
          return {
            fits: val.fits && val.fits.length > 0 ? val.fits : INITIAL_CUSTOMISATION_CATALOG.fits,
            categories: val.categories || INITIAL_CUSTOMISATION_CATALOG.categories,
            sleeves: val.sleeves || INITIAL_CUSTOMISATION_CATALOG.sleeves,
            neckTypes: val.neckTypes || INITIAL_CUSTOMISATION_CATALOG.neckTypes,
            fabrics: val.fabrics || INITIAL_CUSTOMISATION_CATALOG.fabrics,
            colors: val.colors || INITIAL_CUSTOMISATION_CATALOG.colors,
            placements: val.placements || INITIAL_CUSTOMISATION_CATALOG.placements,
            basePrices: val.basePrices || INITIAL_CUSTOMISATION_CATALOG.basePrices
          };
        }
      } catch (err) {
        console.warn('Failed to fetch customisation catalog from database:', err);
      }
    }
    return INITIAL_CUSTOMISATION_CATALOG;
  },

  /**
   * Saves updated customisation catalog to store settings.
   */
  async saveCatalog(config: CustomisationCatalogConfig): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        const payload = [{
          setting_key: 'customisation_catalog',
          setting_value: config,
          is_public: true,
          updated_at: new Date().toISOString()
        }];

        const { error } = await insforge.database
          .from('store_settings')
          .upsert(payload, { onConflict: 'setting_key' });

        if (!error) return true;
        console.error('Error saving customisation catalog:', error);
      } catch (err) {
        console.error('Save catalog error:', err);
      }
    }
    return false;
  },

  /**
   * Submits a customisation request to the backend.
   */
  async submitRequest(payload: SubmitCustomRequestPayload): Promise<{
    success: boolean;
    requestId?: string;
    requestNumber?: string;
    trackingToken?: string;
    error?: string;
  }> {
    if (!isInsForgeConfigured()) {
      // Local fallback token for offline dev
      const mockNum = `TH3EE-CUST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const mockTok = `token_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      return {
        success: true,
        requestId: 'mock-' + Date.now(),
        requestNumber: mockNum,
        trackingToken: mockTok
      };
    }

    try {
      const { data, error } = await (insforge.database as any).rpc('submit_customisation_request', {
        p_data: payload
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit customisation request');
      }

      return {
        success: Boolean(data?.success),
        requestId: data?.requestId,
        requestNumber: data?.requestNumber,
        trackingToken: data?.trackingToken
      };
    } catch (err: any) {
      console.error('Submit customisation request error:', err);
      return {
        success: false,
        error: err.message || 'Unable to submit request. Please try again or reach out on WhatsApp.'
      };
    }
  },

  /**
   * Retrieves full customisation request details, variants, active quote, proofs, and timeline by token.
   */
  async getRequestByToken(token: string): Promise<{
    success: boolean;
    request?: CustomRequest;
    error?: string;
  }> {
    if (!token || !token.trim()) {
      return { success: false, error: 'Tracking reference is required' };
    }

    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await (insforge.database as any).rpc('get_custom_request_by_token', {
          p_token: token.trim()
        });

        if (error || !data || !data.success) {
          return { success: false, error: error?.message || data?.error || 'Request not found' };
        }

        const rawReq = data.request;
        const request: CustomRequest = {
          id: rawReq.id,
          requestNumber: rawReq.request_number,
          trackingToken: rawReq.tracking_token,
          customerId: rawReq.customer_id,
          customerName: rawReq.customer_name,
          customerEmail: rawReq.customer_email,
          customerPhone: rawReq.customer_phone,
          preferredContact: rawReq.preferred_contact || 'whatsapp',
          designType: rawReq.design_type,
          designDescription: rawReq.design_description,
          printingInstructions: rawReq.printing_instructions,
          intendedUse: rawReq.intended_use || 'personal',
          requiredDate: rawReq.required_date,
          garmentCategory: rawReq.garment_category,
          fit: rawReq.fit,
          sleeve: rawReq.sleeve,
          neckType: rawReq.neck_type,
          fabric: rawReq.fabric,
          gsm: rawReq.gsm,
          primaryColor: rawReq.primary_color,
          totalQuantity: Number(rawReq.total_quantity || 1),
          status: rawReq.status,
          currentQuotationId: rawReq.current_quotation_id,
          convertedOrderId: rawReq.converted_order_id,
          shippingAddress: rawReq.shipping_address,
          internalNotes: rawReq.internal_notes,
          artworkApprovalRequired: Boolean(rawReq.artwork_approval_required),
          approvedProofId: rawReq.approved_proof_id,
          createdAt: rawReq.created_at,
          updatedAt: rawReq.updated_at,
          variants: (data.variants || []).map((v: any) => ({
            id: v.id,
            requestId: v.request_id,
            color: v.color,
            size: v.size,
            quantity: Number(v.quantity || 1),
            notes: v.notes
          })),
          placements: (data.placements || []).map((p: any) => ({
            id: p.id,
            requestId: p.request_id,
            placementLocation: p.placement_location,
            printSize: p.print_size || 'medium',
            customDimensions: p.custom_dimensions,
            artworkUrl: p.artwork_url,
            artworkKey: p.artwork_key,
            notes: p.notes
          })),
          files: (data.files || []).map((f: any) => ({
            id: f.id,
            requestId: f.request_id,
            fileType: f.file_type,
            fileName: f.file_name,
            fileUrl: f.file_url,
            fileKey: f.file_key,
            fileSizeBytes: f.file_size_bytes,
            mimeType: f.mime_type,
            targetPlacement: f.target_placement,
            createdAt: f.created_at
          })),
          activeQuotation: data.activeQuotation ? {
            id: data.activeQuotation.id,
            requestId: data.activeQuotation.request_id,
            version: Number(data.activeQuotation.version || 1),
            garmentBasePrice: Number(data.activeQuotation.garment_base_price || 0),
            printingCharges: Number(data.activeQuotation.printing_charges || 0),
            placementCharges: Number(data.activeQuotation.placement_charges || 0),
            artworkCharges: Number(data.activeQuotation.artwork_charges || 0),
            quantityDiscount: Number(data.activeQuotation.quantity_discount || 0),
            otherFees: Number(data.activeQuotation.other_fees || 0),
            shippingCharges: Number(data.activeQuotation.shipping_charges || 0),
            taxCharges: Number(data.activeQuotation.tax_charges || 0),
            subtotal: Number(data.activeQuotation.subtotal || 0),
            finalTotal: Number(data.activeQuotation.final_total || 0),
            estimatedProductionDays: Number(data.activeQuotation.estimated_production_days || 5),
            validUntil: data.activeQuotation.valid_until,
            terms: data.activeQuotation.terms,
            status: data.activeQuotation.status,
            acceptedAt: data.activeQuotation.accepted_at,
            lineItems: Array.isArray(data.activeQuotation.line_items) ? data.activeQuotation.line_items : [],
            createdBy: data.activeQuotation.created_by,
            createdAt: data.activeQuotation.created_at
          } : undefined,
          proofs: (data.proofs || []).map((pr: any) => ({
            id: pr.id,
            requestId: pr.request_id,
            version: Number(pr.version || 1),
            proofImageUrl: pr.proof_image_url,
            proofImageKey: pr.proof_image_key,
            notes: pr.notes,
            status: pr.status,
            customerFeedback: pr.customer_feedback,
            approvedAt: pr.approved_at,
            createdAt: pr.created_at
          })),
          timeline: (data.timeline || []).map((t: any) => ({
            id: t.id,
            requestId: t.request_id,
            status: t.status,
            title: t.title,
            description: t.description,
            actor: t.actor,
            createdAt: t.created_at
          }))
        };

        return { success: true, request };
      } catch (err: any) {
        console.error('Get request by token error:', err);
        return { success: false, error: err.message || 'Unable to retrieve customisation request' };
      }
    }

    return { success: false, error: 'Database not available' };
  },

  /**
   * Retrieves all requests for an authenticated customer.
   */
  async getCustomerRequests(customerId?: string, email?: string): Promise<CustomRequest[]> {
    if (!isInsForgeConfigured()) return [];
    try {
      const { data, error } = await (insforge.database as any).rpc('get_customer_custom_requests', {
        p_customer_id: customerId || null,
        p_email: email ? email.trim().toLowerCase() : null
      });

      if (!error && data && Array.isArray(data.requests)) {
        return data.requests.map((r: any) => ({
          id: r.id,
          requestNumber: r.request_number,
          trackingToken: r.tracking_token,
          customerId: r.customer_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          preferredContact: r.preferred_contact || 'whatsapp',
          designType: r.design_type,
          designDescription: r.design_description,
          printingInstructions: r.printing_instructions,
          intendedUse: r.intended_use || 'personal',
          requiredDate: r.required_date,
          garmentCategory: r.garment_category,
          fit: r.fit,
          sleeve: r.sleeve,
          neckType: r.neck_type,
          fabric: r.fabric,
          gsm: r.gsm,
          primaryColor: r.primary_color,
          totalQuantity: Number(r.total_quantity || 1),
          status: r.status,
          currentQuotationId: r.current_quotation_id,
          convertedOrderId: r.converted_order_id,
          shippingAddress: r.shipping_address,
          internalNotes: r.internal_notes,
          artworkApprovalRequired: Boolean(r.artwork_approval_required),
          approvedProofId: r.approved_proof_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (err) {
      console.warn('Get customer custom requests error:', err);
    }
    return [];
  },

  /**
   * Retrieves all requests for Admin Atelier Desk.
   */
  async getAllAdminRequests(): Promise<CustomRequest[]> {
    if (!isInsForgeConfigured()) return [];
    try {
      const { data, error } = await (insforge.database as any).rpc('get_all_custom_requests_admin');
      if (!error && data && Array.isArray(data.requests)) {
        return data.requests.map((r: any) => ({
          id: r.id,
          requestNumber: r.request_number,
          trackingToken: r.tracking_token,
          customerId: r.customer_id,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          customerPhone: r.customer_phone,
          preferredContact: r.preferred_contact || 'whatsapp',
          designType: r.design_type,
          designDescription: r.design_description,
          printingInstructions: r.printing_instructions,
          intendedUse: r.intended_use || 'personal',
          requiredDate: r.required_date,
          garmentCategory: r.garment_category,
          fit: r.fit,
          sleeve: r.sleeve,
          neckType: r.neck_type,
          fabric: r.fabric,
          gsm: r.gsm,
          primaryColor: r.primary_color,
          totalQuantity: Number(r.total_quantity || 1),
          status: r.status,
          currentQuotationId: r.current_quotation_id,
          convertedOrderId: r.converted_order_id,
          shippingAddress: r.shipping_address,
          internalNotes: r.internal_notes,
          artworkApprovalRequired: Boolean(r.artwork_approval_required),
          approvedProofId: r.approved_proof_id,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          activeQuotation: r.active_quotation ? {
            id: r.active_quotation.id,
            requestId: r.active_quotation.request_id,
            version: Number(r.active_quotation.version || 1),
            garmentBasePrice: Number(r.active_quotation.garment_base_price || 0),
            printingCharges: Number(r.active_quotation.printing_charges || 0),
            placementCharges: Number(r.active_quotation.placement_charges || 0),
            artworkCharges: Number(r.active_quotation.artwork_charges || 0),
            quantityDiscount: Number(r.active_quotation.quantity_discount || 0),
            otherFees: Number(r.active_quotation.other_fees || 0),
            shippingCharges: Number(r.active_quotation.shipping_charges || 0),
            taxCharges: Number(r.active_quotation.tax_charges || 0),
            subtotal: Number(r.active_quotation.subtotal || 0),
            finalTotal: Number(r.active_quotation.final_total || 0),
            estimatedProductionDays: Number(r.active_quotation.estimated_production_days || 5),
            validUntil: r.active_quotation.valid_until,
            terms: r.active_quotation.terms,
            status: r.active_quotation.status,
            acceptedAt: r.active_quotation.accepted_at,
            lineItems: Array.isArray(r.active_quotation.line_items) ? r.active_quotation.line_items : [],
            createdBy: r.active_quotation.created_by,
            createdAt: r.active_quotation.created_at
          } : undefined
        }));
      }
    } catch (err) {
      console.warn('Get admin custom requests error:', err);
    }
    return [];
  },

  /**
   * Admin creates or revises an itemised quotation.
   */
  async createQuotation(requestId: string, payload: {
    garment_base_price: number;
    printing_charges: number;
    placement_charges?: number;
    artwork_charges?: number;
    quantity_discount?: number;
    other_fees?: number;
    shipping_charges?: number;
    tax_charges?: number;
    subtotal: number;
    final_total: number;
    estimated_production_days?: number;
    valid_until?: string;
    terms?: string;
    line_items?: Array<{ description: string; amount: number; category?: string }>;
    created_by?: string;
  }): Promise<{ success: boolean; quotationId?: string; version?: number; error?: string }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const { data, error } = await (insforge.database as any).rpc('admin_create_custom_quotation', {
        p_request_id: requestId,
        p_payload: payload
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Failed to create quotation' };
      }

      return {
        success: true,
        quotationId: data.quotationId,
        version: data.version
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Quotation creation failed' };
    }
  },

  /**
   * Customer accepts quotation.
   */
  async acceptQuotation(token: string, quotationId: string): Promise<{ success: boolean; error?: string; finalAmount?: number }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const { data, error } = await (insforge.database as any).rpc('customer_accept_custom_quotation', {
        p_token: token,
        p_quotation_id: quotationId
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Failed to accept quotation' };
      }

      return {
        success: true,
        finalAmount: data.finalAmount
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Acceptance error' };
    }
  },

  /**
   * Customer requests changes on a quotation.
   */
  async requestQuotationChanges(token: string, notes: string): Promise<{ success: boolean; error?: string }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const { data, error } = await (insforge.database as any).rpc('customer_request_quotation_changes', {
        p_token: token,
        p_notes: notes
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Failed to request changes' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to request changes' };
    }
  },

  /**
   * Admin uploads digital artwork proof.
   */
  async uploadProof(requestId: string, proofUrl: string, proofKey?: string, notes?: string): Promise<{ success: boolean; proofId?: string; error?: string }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const { data, error } = await (insforge.database as any).rpc('admin_upload_artwork_proof', {
        p_request_id: requestId,
        p_proof_url: proofUrl,
        p_proof_key: proofKey || null,
        p_notes: notes || null
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Failed to upload proof' };
      }

      return { success: true, proofId: data.proofId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Proof upload failed' };
    }
  },

  /**
   * Customer responds to proof (approves or requests revision).
   */
  async respondProof(token: string, proofId: string, approved: boolean, feedback?: string): Promise<{ success: boolean; status?: string; error?: string }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const { data, error } = await (insforge.database as any).rpc('customer_respond_artwork_proof', {
        p_token: token,
        p_proof_id: proofId,
        p_approved: approved,
        p_feedback: feedback || null
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Failed to submit proof feedback' };
      }

      return { success: true, status: data.status };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit feedback' };
    }
  },

  /**
   * Confirms verified payment for custom order, creates orders/payments record and updates custom request status.
   */
  async confirmCustomPayment(params: {
    requestId: string;
    token: string;
    paymentId: string;
    providerOrderId: string;
    amount: number;
    couponCode?: string;
    discount?: number;
  }): Promise<{ success: boolean; orderId?: string; orderNumber?: string; status?: string; error?: string }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const { data, error } = await (insforge.database as any).rpc('confirm_custom_order_payment', {
        p_request_id: params.requestId,
        p_token: params.token,
        p_payment_id: params.paymentId,
        p_provider_order_id: params.providerOrderId,
        p_amount: params.amount,
        p_coupon_code: params.couponCode || null,
        p_discount: params.discount || 0
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Payment confirmation failed' };
      }

      return {
        success: true,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        status: data.status
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Payment confirmation failed' };
    }
  },

  /**
   * Admin updates production, dispatch, or delivery status.
   */
  async updateAdminStatus(
    requestId: string,
    status: string,
    notes?: string,
    trackingNumber?: string,
    trackingUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const { data, error } = await (insforge.database as any).rpc('admin_update_custom_order_status', {
        p_request_id: requestId,
        p_status: status,
        p_notes: notes || null,
        p_tracking_number: trackingNumber || null,
        p_tracking_url: trackingUrl || null
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Failed to update status' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update status' };
    }
  },

  /**
   * Securely uploads custom artwork or reference files to InsForge Storage bucket 'custom-artwork'
   * with fallback to R2 edge function.
   */
  async uploadFile(file: File, folder: string = 'custom-artwork'): Promise<{
    url: string;
    key: string;
    name: string;
    size: number;
    type: string;
  }> {
    if (!file) throw new Error('No file provided');

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error('Unsupported file format. Please upload PNG, JPG, JPEG, WebP, or PDF.');
    }

    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSizeBytes) {
      throw new Error('File exceeds the maximum limit of 25MB.');
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `${Date.now()}-${cleanName}`;

    // 1. Try InsForge Storage SDK
    if (isInsForgeConfigured() && (insforge as any).storage) {
      try {
        const storageBucket = (insforge.storage as any).from ? (insforge.storage as any).from('custom-artwork') : null;
        if (storageBucket && typeof storageBucket.upload === 'function') {
          const { data: uploadRes, error: uploadErr } = await storageBucket.upload(objectKey, file);
          if (!uploadErr && uploadRes) {
            let publicUrl = '';
            if (typeof storageBucket.getPublicUrl === 'function') {
              const { data: pUrl } = storageBucket.getPublicUrl(objectKey);
              publicUrl = pUrl?.publicUrl || (uploadRes as any).url || '';
            } else {
              publicUrl = (uploadRes as any).url || `https://28fmr484.ap-southeast.insforge.app/api/storage/buckets/custom-artwork/objects/${objectKey}`;
            }

            return {
              url: publicUrl,
              key: objectKey,
              name: file.name,
              size: file.size,
              type: file.type
            };
          }
        }
      } catch (storageErr) {
        console.warn('InsForge storage upload note, attempting edge upload:', storageErr);
      }
    }

    // 2. Direct R2 upload via edge function or Base64 data URL preview fallback
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(b64);
        };
        reader.onerror = () => reject(new Error('Failed to read file contents'));
        reader.readAsDataURL(file);
      });

      const { data: fnData, error: fnErr } = await insforge.functions.invoke('r2-upload', {
        body: {
          filename: file.name,
          contentType: file.type,
          base64Data,
          folder: 'custom-artwork'
        }
      });

      if (!fnErr && fnData && fnData.url) {
        return {
          url: fnData.url,
          key: fnData.key || objectKey,
          name: file.name,
          size: file.size,
          type: file.type
        };
      }
    } catch (edgeErr) {
      console.warn('Edge upload note:', edgeErr);
    }

    // 3. Resilient client-side object preview URL
    const previewUrl = URL.createObjectURL(file);
    return {
      url: previewUrl,
      key: objectKey,
      name: file.name,
      size: file.size,
      type: file.type
    };
  }
};
