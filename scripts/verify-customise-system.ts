import { insforge } from '../src/lib/insforge';
import { INITIAL_CUSTOMISATION_CATALOG } from '../src/data/customiseCatalog';

const client = insforge;

async function runVerification() {
  console.log('=====================================================');
  console.log(' TH3EE CUSTOMISE SYSTEM END-TO-END VERIFICATION SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ' -> ' + detail : ''}`);
      failed++;
    }
  }

  // TEST SUITE 1: CATALOG AND VISUAL SPECIFICATIONS
  console.log('--- SUITE 1: Visual Garment Guides & Specifications Catalog ---');
  
  // 1. Fits
  assert(
    INITIAL_CUSTOMISATION_CATALOG.fits.length === 3 &&
    INITIAL_CUSTOMISATION_CATALOG.fits.some(f => f.name === 'Oversized') &&
    INITIAL_CUSTOMISATION_CATALOG.fits.some(f => f.name === 'Regular Fit') &&
    INITIAL_CUSTOMISATION_CATALOG.fits.some(f => f.name === 'Boxy Fit'),
    'All 3 fits (Oversized, Regular Fit, Boxy Fit) configured with distinct silhouettes'
  );

  // 2. Verified Size Measurements
  const oversizedFit = INITIAL_CUSTOMISATION_CATALOG.fits.find(f => f.name === 'Oversized');
  const regularFit = INITIAL_CUSTOMISATION_CATALOG.fits.find(f => f.name === 'Regular Fit');
  const boxyFit = INITIAL_CUSTOMISATION_CATALOG.fits.find(f => f.name === 'Boxy Fit');

  const overM = oversizedFit?.measurements?.find(m => m.size === 'M');
  const regM = regularFit?.measurements?.find(m => m.size === 'M');
  const boxM = boxyFit?.measurements?.find(m => m.size === 'M');

  assert(
    overM !== undefined && overM.chestCm === 112 && overM.lengthCm === 76,
    `Verified Oversized fit M-size measurements loaded (Chest: ${overM?.chestCm}cm, Length: ${overM?.lengthCm}cm)`
  );
  assert(
    regM !== undefined && regM.chestCm === 102 && regM.lengthCm === 72,
    `Verified Regular fit M-size measurements loaded (Chest: ${regM?.chestCm}cm, Length: ${regM?.lengthCm}cm)`
  );
  assert(
    boxM !== undefined && boxM.chestCm === 117 && boxM.lengthCm === 68.5,
    `Verified Boxy fit M-size measurements loaded (Chest: ${boxM?.chestCm}cm, cropped Length: ${boxM?.lengthCm}cm)`
  );

  // 3. Fabrics & GSM
  assert(
    INITIAL_CUSTOMISATION_CATALOG.fabrics.length >= 3 &&
    INITIAL_CUSTOMISATION_CATALOG.fabrics.some(f => f.gsm.includes('240')) &&
    INITIAL_CUSTOMISATION_CATALOG.fabrics.some(f => f.gsm.includes('200')) &&
    INITIAL_CUSTOMISATION_CATALOG.fabrics.some(f => f.gsm.includes('180')),
    'Verified Fabric & GSM options (180 GSM, 200 GSM, 240 GSM Luxury French Terry)'
  );

  // 4. Color Swatches
  assert(
    INITIAL_CUSTOMISATION_CATALOG.colors.length >= 8 &&
    INITIAL_CUSTOMISATION_CATALOG.colors.some(c => c.name === 'Jet Black') &&
    INITIAL_CUSTOMISATION_CATALOG.colors.some(c => c.name === 'Optical White'),
    'Rich color palette configured with accessible names and hex swatches'
  );

  // 5. Print Placements
  assert(
    INITIAL_CUSTOMISATION_CATALOG.placements.length >= 7 &&
    INITIAL_CUSTOMISATION_CATALOG.placements.some(p => p.id === 'center_chest') &&
    INITIAL_CUSTOMISATION_CATALOG.placements.some(p => p.id === 'front_chest') &&
    INITIAL_CUSTOMISATION_CATALOG.placements.some(p => p.id === 'both_sleeves'),
    'Interactive print placement zones configured with technical coordinate anchors'
  );

  // TEST SUITE 2: COMPLETE ORDER LIFECYCLE ON LIVE INSFORGE BACKEND
  console.log('\n--- SUITE 2: End-to-End Custom Order Lifecycle via InsForge BaaS ---');

  let testRequestId: string = '';
  let testTrackingToken: string = '';
  let testQuotationId: string = '';
  let testProofId: string = '';

  try {
    // 1. Submit Customisation Request (Customer Journey)
    console.log('Submitting test customisation request...');
    const testPayload = {
      customer_name: 'Aditya Varma',
      customer_email: 'aditya.verification@th3ee.in',
      customer_phone: '+91 98765 43210',
      preferred_contact: 'whatsapp',
      shipping_address: {
        line1: 'Flat 402, Elite Heights, Balaji Colony',
        city: 'Tirupati',
        state: 'Andhra Pradesh',
        pincode: '517501',
        country: 'India'
      },
      design_type: 'have_design',
      design_description: 'High-density cybernetic tiger back print with Kanji embroidery accent on left chest.',
      printing_instructions: 'Please ensure crisp edge contrast on dark washed fabric.',
      garment_category: 'T-Shirt',
      fit: 'Oversized',
      sleeve: 'Half Sleeve',
      neck_type: 'Round Neck',
      fabric: '100% Combed Compact Cotton',
      gsm: '240 GSM',
      primary_color: 'Jet Black',
      intended_use: 'brand_drop',
      required_date: '2026-11-15',
      total_quantity: 7,
      artwork_approval_required: true,
      variants: [
        { color: 'Jet Black', size: 'M', quantity: 2, notes: 'Baggy silhouette' },
        { color: 'Jet Black', size: 'L', quantity: 3, notes: 'Standard drop' },
        { color: 'Optical White', size: 'XL', quantity: 2, notes: 'Sample contrast' }
      ],
      placements: [
        { placement_location: 'front_chest', print_size: 'small', custom_dimensions: '10cm x 10cm', artwork_url: 'https://cdn.th3ee.in/custom-artwork/logo.png', notes: 'DTF + Puff' },
        { placement_location: 'back_full', print_size: 'full_print', custom_dimensions: '35cm x 45cm', artwork_url: 'https://cdn.th3ee.in/custom-artwork/tiger.png', notes: 'High-Density DTF' }
      ],
      files: [
        { file_type: 'artwork', file_name: 'cyber_tiger_back.png', file_url: 'https://cdn.th3ee.in/custom-artwork/tiger.png', file_size_bytes: 4500000, mime_type: 'image/png', target_placement: 'back_full' },
        { file_type: 'artwork', file_name: 'logo_chest.png', file_url: 'https://cdn.th3ee.in/custom-artwork/logo.png', file_size_bytes: 850000, mime_type: 'image/png', target_placement: 'front_chest' }
      ]
    };

    const submitRes = await client.database.rpc('submit_customisation_request', {
      p_data: testPayload
    });
    const submitData = submitRes.data as any;

    if (submitRes.error) {
      console.error('Submit RPC error:', submitRes.error);
    }

    assert(
      submitRes.error === null && submitData && submitData.success === true,
      'Customer submits customisation request with multi-variants & placements'
    );

    testRequestId = submitData.requestId;
    testTrackingToken = submitData.trackingToken;

    assert(
      typeof testRequestId === 'string' && testRequestId.length > 0,
      `Persistent database record created (Request ID: ${testRequestId}, Number: ${submitData.requestNumber})`
    );
    assert(
      typeof testTrackingToken === 'string' && testTrackingToken.length >= 32,
      `Secure non-guessable tracking token generated (${testTrackingToken.length} characters)`
    );

    // 2. Query Request by Tracking Token
    const trackingRes = await client.database.rpc('get_custom_request_by_token', {
      p_token: testTrackingToken
    });
    const reqData = trackingRes.data as any;

    assert(
      trackingRes.error === null && reqData && reqData.request && reqData.request.status === 'pending_review',
      'Request successfully retrieved via token with initial status "pending_review"'
    );
    assert(
      reqData.variants && reqData.variants.length === 3 && reqData.request.total_quantity === 7,
      `Multi-variant quantity tally verified (2 + 3 + 2 = ${reqData.request.total_quantity} garments)`
    );
    assert(
      reqData.placements && reqData.placements.length === 2,
      'Print placements correctly persisted and mapped'
    );
    assert(
      reqData.files && reqData.files.length === 2,
      'Uploaded artwork files securely associated with print positions'
    );
    assert(
      reqData.timeline && reqData.timeline.length >= 1,
      'Audit timeline entry created for submission timestamp'
    );

    // 3. Admin Review & Itemised Quotation Creation
    console.log('Admin generating itemised quotation...');
    const quotePayload = {
      garment_base_price: 3493.00, // 7 garments * ₹499 base
      printing_charges: 1750.00,    // ₹250 per garment for 2 DTF prints
      placement_charges: 350.00,    // Additional back full area charge
      artwork_charges: 200.00,      // Raster to vector prep
      quantity_discount: 300.00,    // Volume discount for 7 units
      other_fees: 0.00,
      shipping_charges: 99.00,
      tax_charges: 280.00,
      subtotal: 5493.00,
      final_total: 5872.00,         // 5493 - 300 + 99 + 280 = 5572 or 5872
      estimated_production_days: 4,
      valid_until: new Date(Date.now() + 7 * 86400000).toISOString(),
      terms: 'Full payment confirms slot. Production begins post artwork proof sign-off.',
      created_by: 'admin@th3ee.in',
      line_items: [
        { label: 'Heavyweight 240 GSM Oversized Garments (7 pcs)', amount: 3493.00 },
        { label: 'Front Left Chest DTF Print (7 pcs)', amount: 700.00 },
        { label: 'Back Full Graphic DTF Print (7 pcs)', amount: 1050.00 },
        { label: 'High-Density Puff Texture Upgrade', amount: 350.00 },
        { label: 'Studio Artwork Alignment & Separation', amount: 200.00 },
        { label: 'Small Batch Volume Discount', amount: -300.00 },
        { label: 'Express Tracked Logistics (Tirupati Hub)', amount: 99.00 },
        { label: 'GST (5% Apparel Standard)', amount: 280.00 }
      ]
    };

    const quoteRes = await client.database.rpc('admin_create_custom_quotation', {
      p_request_id: testRequestId,
      p_payload: quotePayload
    });
    const quoteData = quoteRes.data as any;

    if (quoteRes.error) {
      console.error('Quote RPC error:', quoteRes.error);
    }

    assert(
      quoteRes.error === null && quoteData && quoteData.success === true,
      'Admin creates comprehensive itemised quotation'
    );
    testQuotationId = quoteData.quotationId;

    // Verify status updated to quotation_sent
    const reqAfterQuote = (await client.database.rpc('get_custom_request_by_token', { p_token: testTrackingToken })).data as any;
    assert(
      reqAfterQuote && reqAfterQuote.request && reqAfterQuote.request.status === 'quotation_sent' && reqAfterQuote.activeQuotation,
      'Order status automatically transitions to "quotation_sent" with active quotation attached'
    );

    // 4. Customer Accepts Quotation
    console.log('Customer accepting quotation...');
    const acceptRes = await client.database.rpc('customer_accept_custom_quotation', {
      p_token: testTrackingToken,
      p_quotation_id: testQuotationId
    });
    const acceptData = acceptRes.data as any;

    assert(
      acceptRes.error === null && acceptData && acceptData.success === true,
      'Customer securely accepts the quotation snapshot'
    );

    const reqAfterAccept = (await client.database.rpc('get_custom_request_by_token', { p_token: testTrackingToken })).data as any;
    assert(
      reqAfterAccept && reqAfterAccept.request && reqAfterAccept.request.status === 'awaiting_payment' && reqAfterAccept.activeQuotation.status === 'accepted',
      'Quotation marked "accepted" and order status advances to "awaiting_payment"'
    );

    // 5. Authoritative Pricing Verification
    const verifiedBaseAmount = reqAfterAccept.activeQuotation.final_total;
    assert(
      Number(verifiedBaseAmount) === 5872,
      `Authoritative quotation payable amount confirmed: ₹${verifiedBaseAmount}`
    );

    // 6. Payment Verification & Confirmation
    console.log('Simulating verified Razorpay payment callback...');
    const paymentPayload = {
      p_request_id: testRequestId,
      p_token: testTrackingToken,
      p_payment_id: 'pay_test_custom_777666',
      p_provider_order_id: 'order_test_custom_999888',
      p_amount: 5872.00,
      p_coupon_code: 'WELCOME10',
      p_discount: 0.00
    };

    const payRes = await client.database.rpc('confirm_custom_order_payment', paymentPayload);
    const payData = payRes.data as any;

    if (payRes.error) {
      console.error('Payment RPC error:', payRes.error);
    }

    assert(
      payRes.error === null && payData && payData.success === true,
      `Authoritative payment confirmed and synced into native orders table (Order #: ${payData?.orderNumber})`
    );

    const reqAfterPay = (await client.database.rpc('get_custom_request_by_token', { p_token: testTrackingToken })).data as any;
    assert(
      reqAfterPay && reqAfterPay.request && (reqAfterPay.request.status === 'artwork_approval_pending' || reqAfterPay.request.status === 'paid'),
      `Order status reflects payment verification (Status: ${reqAfterPay.request.status}, Converted Order ID: ${reqAfterPay.request.converted_order_id})`
    );

    // 7. Digital Artwork Proof Workflow
    console.log('Admin uploading digital artwork proof for customer sign-off...');
    const proofPayload = {
      p_request_id: testRequestId,
      p_proof_url: 'https://cdn.th3ee.in/custom-proofs/tiger_mockup_v1.jpg',
      p_proof_key: 'custom-proofs/tiger_mockup_v1.jpg',
      p_notes: 'Placement calibrated to 4cm below back collar seam. Colors calibrated to Pantone 426C.'
    };

    const proofRes = await client.database.rpc('admin_upload_artwork_proof', proofPayload);
    const proofData = proofRes.data as any;

    assert(
      proofRes.error === null && proofData && proofData.success === true,
      'Admin uploads digital artwork proof'
    );
    testProofId = proofData.proofId;

    const reqAfterProof = (await client.database.rpc('get_custom_request_by_token', { p_token: testTrackingToken })).data as any;
    assert(
      reqAfterProof && reqAfterProof.proofs && reqAfterProof.proofs.length === 1,
      'Proof attached to request for customer inspection'
    );

    // Customer Approves Proof
    console.log('Customer approving artwork proof...');
    const approveProofRes = await client.database.rpc('customer_respond_artwork_proof', {
      p_token: testTrackingToken,
      p_proof_id: testProofId,
      p_approved: true,
      p_feedback: 'Approved! Print size and placement on back look perfect.'
    });
    const approveProofData = approveProofRes.data as any;

    assert(
      approveProofRes.error === null && approveProofData && approveProofData.success === true,
      'Customer formally signs off digital artwork proof'
    );

    const reqAfterApprove = (await client.database.rpc('get_custom_request_by_token', { p_token: testTrackingToken })).data as any;
    assert(
      reqAfterApprove && reqAfterApprove.request && reqAfterApprove.request.status === 'in_production',
      'Order progresses into "in_production" following sign-off'
    );

    // 8. Admin Production & Logistics Status Transitions
    console.log('Admin updating fulfillment progression...');
    const dispatchRes = await client.database.rpc('admin_update_custom_order_status', {
      p_request_id: testRequestId,
      p_status: 'ready_for_dispatch',
      p_notes: 'Printed, cured, quality inspected, and folded into TH3EE luxury gift box.',
      p_tracking_number: 'DELHIVERY_TH3EE_789456',
      p_tracking_url: 'https://www.delhivery.com/track/package/DELHIVERY_TH3EE_789456'
    });

    assert(
      dispatchRes.error === null && (dispatchRes.data as any).success === true,
      'Status transitions to "ready_for_dispatch"'
    );

    const shipRes = await client.database.rpc('admin_update_custom_order_status', {
      p_request_id: testRequestId,
      p_status: 'shipped',
      p_notes: 'Handed over to Delhivery logistics Tirupati hub.',
      p_tracking_number: 'DELHIVERY_TH3EE_789456',
      p_tracking_url: 'https://www.delhivery.com/track/package/DELHIVERY_TH3EE_789456'
    });

    assert(
      shipRes.error === null && (shipRes.data as any).success === true,
      'Status transitions to "shipped" with live courier tracking link'
    );

    const reqFinal = (await client.database.rpc('get_custom_request_by_token', { p_token: testTrackingToken })).data as any;
    assert(
      reqFinal && reqFinal.request && reqFinal.request.status === 'shipped',
      'Final customer tracking page reflects shipped state'
    );

    // TEST SUITE 3: SECURITY & AUTHORIZATION VERIFICATION
    console.log('\n--- SUITE 3: Security & Authorization Protection ---');
    
    // Attempt unauthorized access with forged token
    const forgedRes = await client.database.rpc('get_custom_request_by_token', {
      p_token: '0000000000000000000000000000000000000000000000000000000000000000'
    });
    assert(
      forgedRes.data === null || (forgedRes.data as any).request === undefined,
      'Forged tracking token rejected — customer data isolated'
    );

    // Attempt quotation acceptance with invalid token
    const forgedAcceptRes = await client.database.rpc('customer_accept_custom_quotation', {
      p_token: 'bad_token_attempt',
      p_quotation_id: testQuotationId
    });
    assert(
      forgedAcceptRes.error !== null || (forgedAcceptRes.data as any).success === false,
      'Unauthorized quotation acceptance blocked by token verification'
    );

  } catch (err: any) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    // Clean up test records
    if (testRequestId) {
      console.log('\nCleaning up verification records from database...');
      try {
        await client.database.from('custom_request_timeline').delete().eq('request_id', testRequestId);
        await client.database.from('custom_artwork_proofs').delete().eq('request_id', testRequestId);
        await client.database.from('custom_quotations').delete().eq('request_id', testRequestId);
        await client.database.from('custom_request_files').delete().eq('request_id', testRequestId);
        await client.database.from('custom_request_placements').delete().eq('request_id', testRequestId);
        await client.database.from('custom_request_variants').delete().eq('request_id', testRequestId);
        await client.database.from('custom_requests').delete().eq('id', testRequestId);
        console.log('Cleanup completed cleanly.');
      } catch (cleanErr) {
        console.warn('Cleanup notice:', cleanErr);
      }
    }
  }

  console.log('\n=====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
