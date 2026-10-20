import { createClient } from 'npm:@insforge/sdk';

interface OrderItemInput {
  productId?: string;
  variantId?: string;
  productName: string;
  variantTitle: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
}

interface CreateOrderPayload {
  action: 'create-order';
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: Record<string, any>;
  items: OrderItemInput[];
  subtotal: number;
  discountAmount?: number;
  shippingAmount?: number;
  totalAmount: number;
  couponCode?: string;
}

interface VerifyPaymentPayload {
  action: 'verify-payment';
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount?: number;
}

/**
 * Constant-time HMAC-SHA256 signature verification to prevent timing attacks.
 */
async function verifyHmacSha256(data: string, signature: string, secret: string): Promise<boolean> {
  if (!data || !signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (expectedSignature.length !== signature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (err) {
    console.error('HMAC verification error:', err);
    return false;
  }
}

export default async function (req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, x-razorpay-signature'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const userToken = authHeader ? authHeader.replace('Bearer ', '') : null;

    const insforgeUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('VITE_INSFORGE_URL') || '';
    const anonKey = Deno.env.get('ANON_KEY') || Deno.env.get('INSFORGE_ANON_KEY') || Deno.env.get('VITE_INSFORGE_ANON_KEY') || '';

    // Read Razorpay credentials from InsForge project secrets with support for all naming conventions
    const razorpayKeyId =
      Deno.env.get('RAZORPAY_TEST_KEY_ID') ||
      Deno.env.get('RAZORPAY_KEY_ID') ||
      Deno.env.get('VITE_RAZORPAY_KEY_ID') ||
      Deno.env.get('RAZORPAY_LIVE_KEY_ID') ||
      '';

    const razorpayKeySecret =
      Deno.env.get('RAZORPAY_TEST_KEY_SECRET') ||
      Deno.env.get('RAZORPAY_KEY_SECRET') ||
      Deno.env.get('RAZORPAY_LIVE_KEY_SECRET') ||
      '';

    const razorpayWebhookSecret =
      Deno.env.get('RAZORPAY_TEST_WEBHOOK_SECRET') ||
      Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ||
      Deno.env.get('RAZORPAY_LIVE_WEBHOOK_SECRET') ||
      razorpayKeySecret;

    const client = createClient({
      baseUrl: insforgeUrl,
      edgeFunctionToken: userToken,
      anonKey: anonKey
    });

    const rawBody = await req.text();
    let body: any = {};
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // --------------------------------------------------------------------------
    // ACTION: RAZORPAY WEBHOOK (Automated Asynchronous Event Processing)
    // --------------------------------------------------------------------------
    const rzpWebhookSignature = req.headers.get('x-razorpay-signature');
    const isWebhookRequest = Boolean(rzpWebhookSignature || body.action === 'webhook' || body.event);

    if (isWebhookRequest) {
      const signatureToVerify = rzpWebhookSignature || body.signature;

      if (!razorpayWebhookSecret) {
        console.error('Webhook signing secret not configured');
        return new Response(
          JSON.stringify({ error: 'Webhook secret not configured on server' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify webhook HMAC-SHA256 signature using the raw payload
      const isSignatureValid = await verifyHmacSha256(rawBody, signatureToVerify || '', razorpayWebhookSecret);
      if (!isSignatureValid) {
        console.warn('Invalid Razorpay webhook signature received');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const eventType = body.event || '';
      console.log(`Verified Razorpay webhook event received: ${eventType}`);

      // Handle payment.captured or order.paid
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = body?.payload?.payment?.entity || {};
        const orderEntity = body?.payload?.order?.entity || {};

        const razorpayPaymentId = paymentEntity.id || '';
        const razorpayOrderId = paymentEntity.order_id || orderEntity.id || '';
        const paymentAmount = Number(paymentEntity.amount || orderEntity.amount_paid || 0) / 100;

        const customOrderId =
          paymentEntity.notes?.order_id ||
          orderEntity.notes?.order_id ||
          null;

        const customOrderNumber =
          paymentEntity.notes?.order_number ||
          orderEntity.notes?.order_number ||
          orderEntity.receipt ||
          null;

        // Idempotency: Check if order is already marked paid
        let orderQuery = client.database.from('orders').select('id, order_number, payment_status');
        if (customOrderId) {
          orderQuery = orderQuery.eq('id', customOrderId);
        } else if (customOrderNumber) {
          orderQuery = orderQuery.eq('order_number', customOrderNumber);
        } else if (razorpayOrderId) {
          // Check payments table for existing provider_order_id
          const { data: existingPayment } = await client.database
            .from('payments')
            .select('order_id, status')
            .eq('provider_order_id', razorpayOrderId)
            .maybeSingle();

          if (existingPayment?.status === 'paid') {
            return new Response(
              JSON.stringify({ success: true, message: 'Payment already processed (idempotent).' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { data: existingOrder } = await orderQuery.maybeSingle();
        if (existingOrder && existingOrder.payment_status === 'paid') {
          return new Response(
            JSON.stringify({ success: true, message: 'Order is already marked as paid (idempotent).' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Execute atomic confirmation
        try {
          const targetId = existingOrder?.id || customOrderId || '00000000-0000-0000-0000-000000000000';
          const targetNumber = existingOrder?.order_number || customOrderNumber || '';

          await (client.database as any).rpc('confirm_order_payment', {
            p_order_id: targetId,
            p_order_number: targetNumber,
            p_payment_id: razorpayPaymentId,
            p_provider_order_id: razorpayOrderId,
            p_amount: paymentAmount
          });

          return new Response(
            JSON.stringify({ success: true, message: 'Payment confirmed via webhook.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (wbErr: any) {
          console.error('Webhook confirm error:', wbErr);
          return new Response(
            JSON.stringify({ error: wbErr.message || 'Failed to confirm payment via webhook' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Handle payment.failed
      if (eventType === 'payment.failed') {
        const paymentEntity = body?.payload?.payment?.entity || {};
        const customOrderId = paymentEntity.notes?.order_id || null;
        const customOrderNumber = paymentEntity.notes?.order_number || null;

        if (customOrderId || customOrderNumber) {
          let updateQuery = client.database
            .from('orders')
            .update({ payment_status: 'failed', updated_at: new Date().toISOString() });

          if (customOrderId) updateQuery = updateQuery.eq('id', customOrderId);
          else if (customOrderNumber) updateQuery = updateQuery.eq('order_number', customOrderNumber);

          await updateQuery;
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Recorded payment failure.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Other events acknowledged
      return new Response(
        JSON.stringify({ success: true, message: `Event ${eventType} acknowledged.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --------------------------------------------------------------------------
    // ACTION: CREATE ORDER (Client-Initiated Checkout Flow)
    // --------------------------------------------------------------------------
    if (body.action === 'create-order') {
      const payload = body as CreateOrderPayload;

      // Validate compulsory fields
      if (!payload.customerName || !payload.customerPhone || !payload.shippingAddress) {
        return new Response(
          JSON.stringify({ error: 'Missing required customer delivery information' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Bag cannot be empty' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ensure Razorpay credentials exist on backend
      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(
          JSON.stringify({
            error:
              'Razorpay Test credentials are not configured on the backend. Please configure RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET in InsForge project secrets.'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Re-verify calculations server-side
      const calculatedSubtotal = payload.items.reduce(
        (sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
        0
      );
      const discount = Number(payload.discountAmount) || 0;
      const shipping = Number(payload.shippingAmount) || 0;
      const expectedTotal = Math.max(0, calculatedSubtotal - discount + shipping);

      if (Math.abs(expectedTotal - payload.totalAmount) > 1) {
        return new Response(
          JSON.stringify({ error: 'Price mismatch detected. Please review your cart.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const orderNumber = `TH3EE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const reservationExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const itemsSummary = payload.items
        .map((it) => `${it.productName} (${it.variantTitle}) x${it.quantity}`)
        .join(', ');

      const orderId = crypto.randomUUID();

      // Validate and resolve customer_id to ensure foreign key integrity
      let validCustomerId: string | null = null;
      if (payload.customerId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.customerId);
        if (isUuid) {
          try {
            const { data: rpcCustId, error: rpcErr } = await (client.database as any).rpc('ensure_customer', {
              p_user_id: payload.customerId,
              p_name: payload.customerName.trim() || 'Customer',
              p_email: payload.customerEmail ? payload.customerEmail.trim().toLowerCase() : null,
              p_phone: payload.customerPhone ? payload.customerPhone.trim() : null
            });

            if (!rpcErr && rpcCustId) {
              validCustomerId = rpcCustId;
            } else {
              const { data: cust } = await client.database
                .from('customers')
                .select('id')
                .or(`id.eq.${payload.customerId},auth_user_id.eq.${payload.customerId}`)
                .maybeSingle();

              if (cust && cust.id) {
                validCustomerId = cust.id;
              } else {
                validCustomerId = payload.customerId;
              }
            }
          } catch (cErr) {
            console.warn('Customer verification in function note:', cErr);
            validCustomerId = payload.customerId;
          }
        }
      }

      // Pre-validate coupon if supplied (Ensure not already redeemed by this account)
      if (payload.couponCode) {
        try {
          const { data: couponCheck, error: cErr } = await (client.database as any).rpc('validate_coupon_for_customer', {
            p_coupon_code: payload.couponCode,
            p_subtotal: calculatedSubtotal,
            p_customer_id: validCustomerId,
            p_customer_email: payload.customerEmail ? payload.customerEmail.trim().toLowerCase() : null
          });

          if (cErr || (couponCheck && !couponCheck.valid)) {
            const errMsg = couponCheck?.error || cErr?.message || "Invalid coupon code";
            return new Response(
              JSON.stringify({ 
                error: errMsg,
                already_redeemed: couponCheck?.already_redeemed || false 
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (cpErr: any) {
          console.warn('Coupon pre-validation note:', cpErr);
        }
      }

      // 1. Insert order into InsForge Database
      const orderRow = {
        id: orderId,
        order_number: orderNumber,
        customer_id: validCustomerId,
        customer_name: payload.customerName.trim(),
        customer_phone: payload.customerPhone.trim(),
        customer_email: payload.customerEmail ? payload.customerEmail.trim().toLowerCase() : null,
        shipping_address: payload.shippingAddress,
        subtotal: calculatedSubtotal,
        discount_amount: discount,
        shipping_amount: shipping,
        total_amount: expectedTotal,
        order_status: 'pending',
        payment_status: 'unpaid',
        coupon_code: payload.couponCode || null,
        reservation_expires_at: reservationExpiresAt,
        admin_notes: itemsSummary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: orderErr } = await client.database
        .from('orders')
        .insert([orderRow]);

      if (orderErr) {
        console.error('Database order creation error:', orderErr);
        return new Response(
          JSON.stringify({ error: orderErr?.message || 'Failed to initialize order record.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Insert order items
      const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
      const itemRows = payload.items.map((it) => {
        let size = '';
        let colorName = '';
        if (it.variantTitle) {
          const parts = it.variantTitle.split('/').map((s) => s.trim());
          if (parts.length >= 2) {
            colorName = parts[0];
            size = parts[1];
          } else {
            size = it.variantTitle;
          }
        }
        const validProdId = isUuid(it.productId) ? it.productId : null;
        const validVarId = isUuid(it.variantId) ? it.variantId : null;
        const lineTotal = Number(it.unitPrice || 0) * Number(it.quantity || 1);

        return {
          order_id: orderId,
          product_id: validProdId,
          variant_id: validVarId,
          product_name: it.productName,
          sku: it.sku || (it.productId && !validProdId ? it.productId : null),
          size: size || null,
          color_name: colorName || null,
          variant_title: it.variantTitle,
          unit_price: Number(it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          image_url: it.imageUrl || null,
          line_total: lineTotal,
          subtotal: lineTotal
        };
      });

      try {
        await client.database.from('order_items').insert(itemRows);
      } catch (itErr) {
        console.warn('Order items insert note:', itErr);
      }

      // 3. Record initial tracking event
      try {
        await (client.database as any).rpc('record_order_tracking_event', {
          p_order_id: orderId,
          p_status: 'order_placed',
          p_title: 'Order Placed',
          p_message: 'Your order was successfully registered with TH3EE Atelier.'
        });
      } catch (trackErr) {
        console.warn('Initial tracking event note:', trackErr);
      }

      // 4. Create Razorpay Payment Order with official Razorpay API
      const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const amountInPaise = Math.round(expectedTotal * 100);

      try {
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authString}`
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: orderNumber,
            notes: {
              order_id: orderId,
              order_number: orderNumber,
              customer_name: payload.customerName,
              customer_phone: payload.customerPhone
            }
          })
        });

        if (!rzpRes.ok) {
          const errJson = await rzpRes.json().catch(() => ({}));
          const errMsg = errJson?.error?.description || 'Razorpay order creation rejected by gateway.';
          console.error('Razorpay API Error:', errMsg);
          return new Response(
            JSON.stringify({
              error: `Razorpay Error: ${errMsg}`,
              details: errJson?.error?.code
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const rzpData = await rzpRes.json();
        const razorpayOrderId = rzpData.id;

        return new Response(
          JSON.stringify({
            success: true,
            orderId: orderId,
            orderNumber: orderNumber,
            razorpayOrderId: razorpayOrderId,
            amount: amountInPaise,
            currency: 'INR',
            keyId: razorpayKeyId,
            isMock: false,
            hasCredentials: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (networkErr: any) {
        console.error('Network error connecting to Razorpay API:', networkErr);
        return new Response(
          JSON.stringify({ error: `Network error connecting to Razorpay: ${networkErr.message}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // --------------------------------------------------------------------------
    // ACTION: VERIFY PAYMENT (Client-Completed Checkout Callback)
    // --------------------------------------------------------------------------
    if (body.action === 'verify-payment') {
      const payload = body as VerifyPaymentPayload;
      const { orderId, orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

      if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return new Response(
          JSON.stringify({ error: 'Missing required payment verification parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!razorpayKeySecret) {
        return new Response(
          JSON.stringify({ error: 'Payment signing secret is not configured on server' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Official Razorpay HMAC-SHA256 signature verification
      const textToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
      const isVerified = await verifyHmacSha256(textToSign, razorpaySignature, razorpayKeySecret);

      if (!isVerified) {
        console.warn(`Payment signature verification failed for order ${orderNumber} (${orderId})`);
        await client.database
          .from('orders')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', orderId);

        try {
          await (client.database as any).rpc('record_order_tracking_event', {
            p_order_id: orderId,
            p_status: 'payment_failed',
            p_title: 'Payment Failed',
            p_message: 'Payment verification was unsuccessful. Please retry payment or contact support.'
          });
        } catch {}

        return new Response(
          JSON.stringify({ success: false, verified: false, error: 'Payment signature verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Atomic confirmation via confirm_order_payment RPC
      try {
        const { data: rpcRes, error: rpcErr } = await (client.database as any).rpc('confirm_order_payment', {
          p_order_id: orderId,
          p_order_number: orderNumber || '',
          p_payment_id: razorpayPaymentId,
          p_provider_order_id: razorpayOrderId,
          p_amount: Number(payload.amount || 0)
        });

        if (rpcErr) {
          console.error('confirm_order_payment RPC error:', rpcErr);
          await client.database
            .from('orders')
            .update({
              payment_status: 'paid',
              order_status: 'confirmed',
              delivery_status: 'Order confirmed',
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
        }
      } catch (confirmEx) {
        console.error('Error confirming order payment in function:', confirmEx);
        await client.database
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'confirmed',
            delivery_status: 'Order confirmed',
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          orderId: orderId,
          orderNumber: orderNumber,
          paymentId: razorpayPaymentId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${body.action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal server error in payment processor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
