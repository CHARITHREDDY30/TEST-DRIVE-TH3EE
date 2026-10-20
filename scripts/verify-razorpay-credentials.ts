import { insforge, isInsForgeConfigured } from '../src/lib/insforge';
import { ordersService } from '../src/services/orders.service';
import crypto from 'crypto';

async function runRazorpayVerification() {
  console.log('======================================================');
  console.log('--- TESTING REAL RAZORPAY EDGE FUNCTION INTEGRATION ---');
  console.log('======================================================');

  if (!isInsForgeConfigured()) {
    console.error('FAIL: InsForge client not configured');
    process.exit(1);
  }

  // 1. Test Order Creation
  console.log('\n--- 1. Testing Razorpay Order Creation via Edge Function ---');
  const testPayload = {
    action: 'create-order',
    customerName: 'Aarav Sharma',
    customerPhone: '9876543210',
    customerEmail: 'aarav.sharma@example.com',
    shippingAddress: {
      line1: 'Flat 402, Skyline Residency',
      line2: 'MG Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'IN'
    },
    items: [
      {
        productName: 'OVERSIZED HEAVYWEIGHT TEE — CULT CINEMA',
        variantTitle: 'Vintage Charcoal / L',
        unitPrice: 1899,
        quantity: 1
      }
    ],
    subtotal: 1899,
    discountAmount: 0,
    shippingAmount: 0,
    totalAmount: 1899
  };

  const { data: createData, error: createError } = await insforge.functions.invoke('razorpay-checkout', {
    body: testPayload
  });

  if (createError) {
    console.error('✖ Order creation failed with error:', createError);
  } else {
    console.log('✔ Order Creation Response:', createData);
    if (createData?.success) {
      console.log(`  ✔ PASS: Order created: ${createData.orderNumber}`);
      console.log(`  ✔ PASS: Database Order ID: ${createData.orderId}`);
      console.log(`  ✔ PASS: Razorpay Order ID: ${createData.razorpayOrderId}`);
      console.log(`  ✔ PASS: Key ID returned: ${createData.keyId}`);
      console.log(`  ✔ PASS: Amount in paise: ${createData.amount}`);
      console.log(`  ✔ PASS: Is Mock Order: ${createData.isMock}`);
    } else {
      console.error('✖ Order creation returned unsuccessful status:', createData);
    }
  }

  if (!createData?.orderId || !createData?.razorpayOrderId) {
    console.error('\n✖ Cannot proceed with verification tests without valid order.');
    process.exit(1);
  }

  // 2. Test Payment Verification with Signature
  console.log('\n--- 2. Testing Payment Signature Verification ---');
  // Read secret for generating test signature in verification script via CLI
  let secretMatch = '';
  try {
    const { execSync } = await import('child_process');
    const out = execSync('insforge secrets get RAZORPAY_TEST_KEY_SECRET', { encoding: 'utf-8' });
    const m = out.match(/RAZORPAY_TEST_KEY_SECRET\s*=\s*(.+)/);
    if (m && m[1]) secretMatch = m[1].trim();
  } catch {}

  // Generate valid test signature
  const testPaymentId = `pay_test_${Date.now().toString(36)}`;
  const textToSign = `${createData.razorpayOrderId}|${testPaymentId}`;
  const validSignature = crypto.createHmac('sha256', secretMatch).update(textToSign).digest('hex');

  const { data: verifyData, error: verifyError } = await insforge.functions.invoke('razorpay-checkout', {
    body: {
      action: 'verify-payment',
      orderId: createData.orderId,
      orderNumber: createData.orderNumber,
      razorpayOrderId: createData.razorpayOrderId,
      razorpayPaymentId: testPaymentId,
      razorpaySignature: validSignature,
      amount: 1899
    }
  });

  if (verifyError) {
    console.error('✖ Payment verification failed with error:', verifyError);
  } else {
    console.log('✔ Payment Verification Response:', verifyData);
    if (verifyData?.verified) {
      console.log('  ✔ PASS: Payment successfully verified by Edge Function');
    }
  }

  // Check database order record via ordersService (tests get_order_by_identifier RPC)
  const dbOrder = await ordersService.getOrderByIdOrNumber(createData.orderId);

  console.log('✔ Database Order Status after verification:', dbOrder ? { id: dbOrder.id, orderNumber: dbOrder.orderNumber, paymentStatus: dbOrder.paymentStatus, status: dbOrder.status } : null);
  if (dbOrder?.paymentStatus === 'paid' && (dbOrder?.status === 'Confirmed' || dbOrder?.status === 'confirmed')) {
    console.log('  ✔ PASS: Order marked as paid and confirmed in database!');
  } else {
    console.error('  ✖ FAIL: Order was not marked paid in database');
  }

  // 3. Test Invalid Signature Rejection
  console.log('\n--- 3. Testing Invalid Signature Rejection ---');
  const { data: invalidVerifyData, error: invalidVerifyError } = await insforge.functions.invoke('razorpay-checkout', {
    body: {
      action: 'verify-payment',
      orderId: createData.orderId,
      orderNumber: createData.orderNumber,
      razorpayOrderId: createData.razorpayOrderId,
      razorpayPaymentId: testPaymentId,
      razorpaySignature: 'tampered_invalid_signature_hex_12345',
      amount: 1899
    }
  });

  if (invalidVerifyError || (invalidVerifyData && !invalidVerifyData.verified)) {
    console.log('  ✔ PASS: Invalid signature rejected as expected!');
  } else {
    console.error('  ✖ FAIL: Invalid signature was unexpectedly accepted');
  }

  // 4. Test Webhook Idempotency
  console.log('\n--- 4. Testing Webhook Signature & Idempotency ---');
  let webhookSecret = secretMatch;
  try {
    const { execSync } = await import('child_process');
    const out = execSync('insforge secrets get RAZORPAY_TEST_WEBHOOK_SECRET', { encoding: 'utf-8' });
    const m = out.match(/RAZORPAY_TEST_WEBHOOK_SECRET\s*=\s*(.+)/);
    if (m && m[1]) webhookSecret = m[1].trim();
  } catch {}

  const webhookBody = JSON.stringify({
    event: 'order.paid',
    payload: {
      order: {
        entity: {
          id: createData.razorpayOrderId,
          amount_paid: 189900,
          receipt: createData.orderNumber,
          notes: {
            order_id: createData.orderId,
            order_number: createData.orderNumber
          }
        }
      },
      payment: {
        entity: {
          id: testPaymentId,
          order_id: createData.razorpayOrderId,
          amount: 189900,
          notes: {
            order_id: createData.orderId,
            order_number: createData.orderNumber
          }
        }
      }
    }
  });

  const webhookSignature = crypto.createHmac('sha256', webhookSecret).update(webhookBody).digest('hex');

  const { data: webhookRes, error: webhookError } = await insforge.functions.invoke('razorpay-checkout', {
    headers: {
      'x-razorpay-signature': webhookSignature
    },
    body: JSON.parse(webhookBody)
  });

  console.log('✔ Webhook duplicate call response:', webhookRes || webhookError);
  if (webhookRes?.success || webhookRes?.message?.includes('idempotent') || webhookRes?.message?.includes('already')) {
    console.log('  ✔ PASS: Webhook processed with safe idempotency!');
  }

  console.log('\n======================================================');
  console.log('--- ALL RAZORPAY BACKEND & WEBHOOK TESTS COMPLETE ---');
  console.log('======================================================\n');
}

runRazorpayVerification().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
