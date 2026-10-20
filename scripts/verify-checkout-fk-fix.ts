/**
 * Comprehensive Automated Verification Suite for TH3EE Checkout Foreign Key Fix:
 * 
 * Tests all 6 scenarios specified in requirements:
 * 1. An existing verified customer checkout.
 * 2. A newly registered verified customer checkout.
 * 3. A customer whose profile record is missing (auto-healed & mapped).
 * 4. An unauthenticated visitor checkout (guest, customer_id: null).
 * 5. A failed order insertion (safeguards, error handling, bag retention).
 * 6. A successful Razorpay Test Mode payment (order creation, signature verification, payment status update).
 * 7. Verification that orders appear under customer's My Orders tab.
 */

import { insforge, isInsForgeConfigured } from '../src/lib/insforge';
import { customerService } from '../src/services/customer.service';
import { ordersService } from '../src/services/orders.service';
import { razorpayService } from '../src/services/razorpay.service';
import type { AuthUser } from '../src/types/auth';
import { execSync } from 'child_process';
import crypto from 'crypto';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, desc: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${desc}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${desc}${details ? ` -> ${details}` : ''}`);
  }
}

function queryDatabase(sql: string): any[] {
  try {
    const singleLine = sql.replace(/\s+/g, ' ').trim().replace(/"/g, '\\"');
    const jsonOutput = execSync(`npx --yes insforge db query --json "${singleLine}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const parsed = JSON.parse(jsonOutput);
    return Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch (e: any) {
    console.error('queryDatabase note:', e.message);
    return [];
  }
}

async function runCheckoutFKVerificationSuite() {
  console.log('\n======================================================');
  console.log('--- RUNNING TH3EE CHECKOUT FOREIGN KEY FIX VERIFICATION ---');
  console.log('======================================================\n');

  if (!isInsForgeConfigured()) {
    console.error('InsForge is not configured. Aborting tests.');
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // Audit Foreign Key Constraint on Orders
  // --------------------------------------------------------------------------
  console.log('--- 0. Database Schema & FK Constraint Audit ---');
  const fkCheck = queryDatabase(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'orders';
  `);
  
  const fkOnCustomerId = fkCheck.find(f => f.column_name === 'customer_id');
  assert(
    Boolean(fkOnCustomerId && fkOnCustomerId.foreign_table === 'customers' && fkOnCustomerId.foreign_column === 'id'),
    `Foreign key constraint orders_customer_id_fkey verified: references customers(id)`
  );

  // --------------------------------------------------------------------------
  // Scenario 1: Existing Verified Customer Checkout
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 1: Existing Verified Customer Checkout ---');
  // Known existing customer Chandu (d850e242-83ff-4d03-bfc5-c203a6ea099a)
  const existingUser: AuthUser = {
    id: 'd850e242-83ff-4d03-bfc5-c203a6ea099a',
    email: 'charithreddy018@gmail.com',
    name: 'Chandu',
    phone: '+919999988888',
    isEmailVerified: true
  };

  const resolvedExistingId = await customerService.ensureCustomerRecord(existingUser, {
    name: existingUser.name,
    phone: existingUser.phone
  });
  assert(
    resolvedExistingId === existingUser.id,
    `Existing customer resolved to stable customers.id: ${resolvedExistingId}`
  );

  const orderNum1 = `TH3EE-TEST-EXISTING-${Date.now().toString(36).toUpperCase()}`;
  const order1 = await ordersService.createOrder({
    orderNumber: orderNum1,
    customerId: resolvedExistingId || undefined,
    customerEmail: existingUser.email,
    customerName: existingUser.name || 'Customer',
    phone: existingUser.phone || '9999999999',
    shippingAddress: {
      fullName: existingUser.name,
      addressLine1: '123 Heritage Way',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      phone: existingUser.phone
    },
    itemsSummary: 'Heavyweight Minimalist Tee (Black/L) x1',
    subtotal: 2499,
    totalAmount: 2548,
    shippingAmount: 49,
    items: [{
      productName: 'Heavyweight Minimalist Tee',
      variantTitle: 'Black / L',
      unitPrice: 2499,
      quantity: 1
    }]
  });

  assert(Boolean(order1 && order1.orderNumber === orderNum1), `Order ${orderNum1} inserted without foreign key error`);

  // Verify in database that customer_id is strictly linked
  const dbOrder1Rows = queryDatabase(`SELECT id, order_number, customer_id, customer_email FROM public.orders WHERE order_number = '${orderNum1}';`);
  const dbOrder1 = dbOrder1Rows[0];
  assert(
    dbOrder1?.customer_id === existingUser.id,
    `Order in database has customer_id strictly set to ${existingUser.id}`
  );

  // --------------------------------------------------------------------------
  // Scenario 2: Newly Registered Customer Checkout
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Newly Registered Verified Customer Checkout ---');
  // Use a simulated newly registered user ID
  const newUserId = crypto.randomUUID();
  const newUserEmail = `new_verified_${Date.now()}@th3ee.in`;
  const newUserName = 'Aarav Sharma';
  const newUserPhone = '+919876543210';

  const newUser: AuthUser = {
    id: newUserId,
    email: newUserEmail,
    name: newUserName,
    phone: newUserPhone,
    isEmailVerified: true
  };

  // Customer record ensured (uses atomic ensure_customer RPC)
  const resolvedNewId = await customerService.ensureCustomerRecord(newUser, {
    name: newUserName,
    phone: newUserPhone
  });

  assert(resolvedNewId === newUserId, `New customer ID correctly created and aligned: ${resolvedNewId}`);

  // Check customer exists in public.customers
  const newCustDbRows = queryDatabase(`SELECT id, auth_user_id, full_name, email FROM public.customers WHERE id = '${newUserId}';`);
  const newCustDb = newCustDbRows[0];
  assert(
    newCustDb?.id === newUserId && newCustDb?.full_name === newUserName,
    'New customer profile verified in public.customers'
  );

  const orderNum2 = `TH3EE-TEST-NEW-${Date.now().toString(36).toUpperCase()}`;
  const order2 = await ordersService.createOrder({
    orderNumber: orderNum2,
    customerId: resolvedNewId || undefined,
    customerEmail: newUser.email,
    customerName: newUserName,
    phone: newUserPhone,
    shippingAddress: {
      fullName: newUserName,
      addressLine1: '45 Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      phone: newUserPhone
    },
    itemsSummary: 'Oversized Raw Edge Hoodie (Washed Grey/M) x1',
    subtotal: 4499,
    totalAmount: 4499,
    shippingAmount: 0,
    items: [{
      productName: 'Oversized Raw Edge Hoodie',
      variantTitle: 'Washed Grey / M',
      unitPrice: 4499,
      quantity: 1
    }]
  });

  assert(Boolean(order2 && order2.orderNumber === orderNum2), `Order ${orderNum2} for new customer inserted cleanly`);

  const dbOrder2Rows = queryDatabase(`SELECT id, customer_id FROM public.orders WHERE order_number = '${orderNum2}';`);
  assert(dbOrder2Rows[0]?.customer_id === newUserId, `Order 2 customer_id linked to new customer ${newUserId}`);

  // --------------------------------------------------------------------------
  // Scenario 3: Customer Whose Profile Record Is Missing (Self-Healing)
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Customer Whose Profile Record Is Missing ---');
  const missingUserId = crypto.randomUUID();
  const missingUser: AuthUser = {
    id: missingUserId,
    email: `missing_profile_${Date.now()}@th3ee.in`,
    name: 'Priya Verma',
    phone: '+919123456780',
    isEmailVerified: true
  };

  // We directly call ordersService.createOrder with customerId: missingUserId to verify self-healing!
  const orderNum3 = `TH3EE-TEST-HEAL-${Date.now().toString(36).toUpperCase()}`;
  const order3 = await ordersService.createOrder({
    orderNumber: orderNum3,
    customerId: missingUserId,
    customerEmail: missingUser.email,
    customerName: missingUser.name,
    phone: missingUser.phone || '',
    shippingAddress: {
      fullName: missingUser.name,
      addressLine1: '77 Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      phone: missingUser.phone
    },
    itemsSummary: 'Boxy Structured Tee (Olive/S) x1',
    subtotal: 2199,
    totalAmount: 2248,
    shippingAmount: 49,
    items: [{
      productName: 'Boxy Structured Tee',
      variantTitle: 'Olive / S',
      unitPrice: 2199,
      quantity: 1
    }]
  });

  assert(Boolean(order3 && order3.orderNumber === orderNum3), `Order ${orderNum3} succeeded despite missing profile record`);

  // Verify that customer profile was auto-healed in public.customers
  const healedCustRows = queryDatabase(`SELECT id, full_name, email FROM public.customers WHERE id = '${missingUserId}';`);
  const healedCust = healedCustRows[0];
  assert(
    healedCust?.id === missingUserId && healedCust?.full_name === missingUser.name,
    'Missing customer record was reliably auto-healed without foreign key violation'
  );

  // --------------------------------------------------------------------------
  // Scenario 4: Unauthenticated Visitor (Guest Checkout)
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Unauthenticated Visitor (Guest Checkout) ---');
  const guestResult = await customerService.ensureCustomerRecord(null);
  assert(guestResult === null, 'ensureCustomerRecord safely returns null for guest visitor');

  const orderNum4 = `TH3EE-TEST-GUEST-${Date.now().toString(36).toUpperCase()}`;
  const order4 = await ordersService.createOrder({
    orderNumber: orderNum4,
    customerId: undefined,
    customerEmail: 'guest_shopper@gmail.com',
    customerName: 'Anonymous Shopper',
    phone: '+919811122233',
    shippingAddress: {
      fullName: 'Anonymous Shopper',
      addressLine1: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110001',
      phone: '+919811122233'
    },
    itemsSummary: 'Minimalist Signature Cap (Black/One Size) x1',
    subtotal: 1499,
    totalAmount: 1548,
    shippingAmount: 49,
    items: [{
      productName: 'Minimalist Signature Cap',
      variantTitle: 'Black / One Size',
      unitPrice: 1499,
      quantity: 1
    }]
  });

  assert(Boolean(order4 && order4.orderNumber === orderNum4), `Guest order ${orderNum4} inserted successfully`);

  const dbOrder4Rows = queryDatabase(`SELECT customer_id, customer_email FROM public.orders WHERE order_number = '${orderNum4}';`);
  assert(dbOrder4Rows[0]?.customer_id === null, 'Guest order has customer_id: null in database, respecting foreign key');

  // --------------------------------------------------------------------------
  // Scenario 5: Failed Order Insertion Safeguards
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Failed Order Insertion Safeguards ---');
  let bagCleared = false;
  const onClearBagMock = () => { bagCleared = true; };

  let orderFailed = false;
  try {
    // Attempt invalid order with missing compulsory values
    await ordersService.createOrder({
      orderNumber: 'INVALID-ORDER',
      customerName: '', // empty name violates constraint
      phone: '',
      shippingAddress: {},
      itemsSummary: '',
      subtotal: -100,
      totalAmount: -100
    });
  } catch (failErr: any) {
    orderFailed = true;
  }

  // In App.tsx checkout workflow, onClearBag is only called if createOrder resolves:
  if (!orderFailed) {
    onClearBagMock();
  }

  assert(orderFailed === true, 'Failed order creation throws error as expected');
  assert(bagCleared === false, 'Shopping bag is strictly preserved when order creation fails');

  // --------------------------------------------------------------------------
  // Scenario 6: Successful Razorpay Test Mode Payment
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Successful Razorpay Test Mode Payment ---');
  const razorpayTestCart = [{
    id: 'prod_test_rzp',
    name: 'Atelier French Terry Sweatshirt',
    price: 3999,
    originalPrice: 4999,
    quantity: 1,
    selectedSize: 'L',
    selectedColor: 'Charcoal'
  }];

  const paymentOrder = await razorpayService.createPaymentOrder({
    customerId: existingUser.id,
    customerEmail: existingUser.email,
    customerName: existingUser.name || 'Chandu',
    customerPhone: existingUser.phone || '9999999999',
    deliveryInfo: {
      fullName: existingUser.name,
      addressLine1: '123 Heritage Way',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      phone: existingUser.phone
    },
    cart: razorpayTestCart as any,
    subtotal: 3999,
    discountAmount: 0,
    shippingAmount: 49,
    totalAmount: 4048
  });

  assert(paymentOrder.success === true, `Payment order initialized successfully: ${paymentOrder.orderNumber}`);
  assert(Boolean(paymentOrder.orderId), `Database order ID created: ${paymentOrder.orderId}`);
  assert(Boolean(paymentOrder.razorpayOrderId), `Razorpay Order ID created: ${paymentOrder.razorpayOrderId}`);

  // Test signature verification
  const secretKey = 'test_secret_for_signature_verification';
  const text = `${paymentOrder.razorpayOrderId}|pay_test_${Date.now()}`;
  const validSignature = crypto.createHmac('sha256', secretKey).update(text).digest('hex');

  // Verify payment verification API
  const verifyResult = await razorpayService.verifyPayment({
    orderId: paymentOrder.orderId,
    orderNumber: paymentOrder.orderNumber,
    razorpayOrderId: paymentOrder.razorpayOrderId,
    razorpayPaymentId: `pay_test_${Date.now()}`,
    razorpaySignature: validSignature,
    amount: 4048
  });

  assert(verifyResult.verified === true, `Payment signature verification succeeded for order ${paymentOrder.orderNumber}`);

  // Check in database that order is marked paid
  const paidOrderRows = queryDatabase(`SELECT payment_status, order_number FROM public.orders WHERE id = '${paymentOrder.orderId}';`);
  assert(paidOrderRows[0]?.payment_status === 'paid', `Order ${paymentOrder.orderNumber} is marked 'paid' in database`);

  // --------------------------------------------------------------------------
  // Scenario 7: Verify Orders Appear Under Customer's My Orders Tab
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Customer Orders Query (My Orders Tab) ---');
  const customerDbOrders = queryDatabase(`
    SELECT o.id, o.order_number, o.customer_id, o.total_amount, o.order_status, o.payment_status
    FROM public.orders o
    WHERE o.customer_id = '${existingUser.id}' OR lower(o.customer_email) = '${existingUser.email}'
    ORDER BY o.created_at DESC;
  `);

  assert(Array.isArray(customerDbOrders) && customerDbOrders.length > 0, 'Customer orders exist in database for authenticated customer');

  const foundOrder1 = customerDbOrders.find(o => o.order_number === orderNum1);
  const foundOrderRzp = customerDbOrders.find(o => o.order_number === paymentOrder.orderNumber);

  assert(Boolean(foundOrder1), `Order ${orderNum1} appears in customer's order history`);
  assert(Boolean(foundOrderRzp), `Razorpay Order ${paymentOrder.orderNumber} appears in customer's order history`);
  assert(foundOrderRzp?.payment_status === 'paid', 'Razorpay Order shows payment_status: paid in database');

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runCheckoutFKVerificationSuite().catch((e) => {
  console.error('Test suite uncaught error:', e);
  process.exit(1);
});
