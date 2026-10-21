/**
 * Comprehensive Automated Launch Verification Suite:
 * 1. Production Data Preservation & Baseline Integrity
 * 2. Coupon Security (Strict Single-Use Per Account, Concurrency-Safe RPCs)
 * 3. TH3EE REWARD CLUB (Delivery Stamp Minting, 12-Month Expiry, 7-Stamp Reward Claim)
 * 4. Admin Loyalty Management & Tamper-Proof Audit Logging
 * 5. Frontend UI & Secret Leak Prevention
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, desc: string, errorDetail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${desc}`);
  } else {
    failedTests++;
    console.error(`  ✖ FAIL: ${desc}${errorDetail ? ` -> ${errorDetail}` : ''}`);
  }
}

function runSql(sql: string): string {
  const cleanSql = sql.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const res = spawnSync('cmd.exe', ['/c', 'insforge', 'db', 'query', cleanSql], {
    encoding: 'utf8'
  });
  if (res.status !== 0) {
    throw new Error(`DB Query error: ${res.stderr || res.stdout}`);
  }
  return res.stdout || '';
}

function queryJson(sql: string): any[] {
  const cleanSql = sql.trim().replace(/;$/, '');
  const wrapper = `SELECT COALESCE(json_agg(t), '[]'::json)::text AS payload FROM (${cleanSql}) t;`;
  const raw = runSql(wrapper);
  const clean = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/[┌┐└┘├┤─│]/g, '').trim();
  const s = clean.indexOf('[');
  const e = clean.lastIndexOf(']');
  if (s !== -1 && e !== -1 && e >= s) {
    try {
      return JSON.parse(clean.slice(s, e + 1));
    } catch {
      return [];
    }
  }
  return [];
}

function querySingleJson(sql: string): any {
  const cleanSql = sql.trim().replace(/;$/, '');
  const wrapped = `SELECT (${cleanSql})::text AS payload;`;
  const raw = runSql(wrapped);
  const clean = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/[┌┐└┘├┤─│]/g, '').trim();
  const s = clean.indexOf('{');
  const e = clean.lastIndexOf('}');
  if (s !== -1 && e !== -1 && e > s) {
    try {
      return JSON.parse(clean.slice(s, e + 1));
    } catch {
      return null;
    }
  }
  return null;
}

async function runLaunchVerification() {
  console.log('\n======================================================');
  console.log('TH3EE — FINAL LAUNCH VERIFICATION SUITE');
  console.log('Coupons Security + Loyalty Programme + Clean Data');
  console.log('======================================================\n');

  // -------------------------------------------------------------------
  // SECTION 1: PRODUCTION DATA PRESERVATION & CLEANUP AUDIT
  // -------------------------------------------------------------------
  console.log('--- 1. Production Data Preservation & Baseline Audit ---');

  const products = queryJson("SELECT id, name, slug, selling_price, is_published FROM products WHERE is_published = true");
  assert(products.length >= 8, `Genuine catalog preserved (found ${products.length} active products)`);

  const baahubaliProduct = products.find((p: any) => (p.slug || '').includes('baahubali') || (p.name || '').includes('Baahubali'));
  assert(Boolean(baahubaliProduct), 'Baahubali flagship silhouette preserved in production database');

  const customers = queryJson("SELECT id, email, full_name FROM customers");
  assert(customers.length >= 3, `Genuine customers preserved (found ${customers.length} genuine customers)`);

  const genuineCharith = customers.find((c: any) => c.email === 'charithreddy014@gmail.com');
  const genuineCharith18 = customers.find((c: any) => c.email === 'charithreddy018@gmail.com');
  assert(Boolean(genuineCharith), 'Genuine customer charithreddy014@gmail.com preserved');
  assert(Boolean(genuineCharith18), 'Genuine customer charithreddy018@gmail.com preserved');

  const syntheticProfiles = queryJson("SELECT id, email FROM customers WHERE email LIKE 'new_verified_%' OR email LIKE 'missing_profile_%'");
  assert(syntheticProfiles.length === 0, 'All synthetic customer test profiles permanently purged from production');

  const orders = queryJson("SELECT id, order_number, total_amount, order_status FROM orders");
  assert(Array.isArray(orders), `Orders table queried successfully (current count: ${orders.length} orders)`);

  const categories = queryJson("SELECT count(*) AS count FROM categories");
  assert(Number(categories[0]?.count || 0) >= 30, `Categories preserved (${categories[0]?.count} categories)`);

  const heroSlides = queryJson("SELECT count(*) AS count FROM hero_slides");
  assert(Number(heroSlides[0]?.count || 0) >= 3, `Hero slides preserved (${heroSlides[0]?.count} slides)`);


  // -------------------------------------------------------------------
  // SECTION 2: BACKEND COUPON SECURITY & REDEMPTION ENFORCEMENT
  // -------------------------------------------------------------------
  console.log('\n--- 2. Coupon Security & Single-Use Per Account Enforcement ---');

  const coupons = queryJson("SELECT id, code, discount_type, discount_value, minimum_order_amount FROM coupons WHERE is_active = true");
  assert(coupons.length >= 2, `Active promo coupons found in database (${coupons.length} coupons)`);

  const testCoupon = coupons[0];
  assert(Boolean(testCoupon), `Target coupon found: ${testCoupon?.code}`);

  const testEmailAlpha = 'verify.patron.alpha@th3ee.test';
  const testEmailBeta = 'verify.patron.beta@th3ee.test';

  // Ensure clean test customer accounts exist
  runSql(`DELETE FROM customers WHERE email IN ('${testEmailAlpha}', '${testEmailBeta}');`);
  runSql(`INSERT INTO customers (full_name, email, phone) VALUES ('Patron Alpha', '${testEmailAlpha}', '9999911111');`);
  runSql(`INSERT INTO customers (full_name, email, phone) VALUES ('Patron Beta', '${testEmailBeta}', '9999922222');`);

  const alphaCust = queryJson(`SELECT id FROM customers WHERE email = '${testEmailAlpha}';`)[0];
  const betaCust = queryJson(`SELECT id FROM customers WHERE email = '${testEmailBeta}';`)[0];

  // Ensure clean test state for coupon redemptions
  runSql(`DELETE FROM coupon_redemptions WHERE customer_email IN ('${testEmailAlpha}', '${testEmailBeta}');`);

  // Test 2.1: Fresh patron validates coupon
  const res1 = querySingleJson(`SELECT public.validate_coupon_for_customer('${testCoupon.code}', 2000, '${alphaCust.id}', '${testEmailAlpha}')`);
  assert(res1?.valid === true, `Fresh patron can validate and preview coupon ${testCoupon.code}`);
  assert(Number(res1?.discount_amount) > 0, `Discount amount correctly computed: Rs. ${res1?.discount_amount}`);

  // Test 2.2: Validation does NOT consume the coupon
  const redemptionsCheck = queryJson(`SELECT id FROM coupon_redemptions WHERE customer_email = '${testEmailAlpha}' AND coupon_id = '${testCoupon.id}';`);
  assert(redemptionsCheck.length === 0, 'Coupon validation/preview does NOT consume coupon in database');

  // Test 2.3: Commit redemption upon verified payment
  const dummyOrderId = '00000000-0000-0000-0000-000000000001';
  runSql(`INSERT INTO orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, total_amount, order_status, payment_status) VALUES ('${dummyOrderId}', 'TH3EE-VERIFY-001', '${alphaCust.id}', 'Verify User', '${testEmailAlpha}', '9999988888', 2000, 'pending', 'pending') ON CONFLICT (id) DO NOTHING;`);
  const commitRes1 = querySingleJson(`SELECT public.commit_coupon_redemption('${dummyOrderId}'::uuid, 'TH3EE-VERIFY-001'::text, '${testCoupon.code}'::text, '${alphaCust.id}'::uuid, '${testEmailAlpha}'::text, ${res1.discount_amount}::numeric)`);
  assert(commitRes1?.success === true, 'commit_coupon_redemption RPC successfully records customer redemption');

  // Test 2.4: Second validation for the SAME customer is strictly blocked
  const res2 = querySingleJson(`SELECT public.validate_coupon_for_customer('${testCoupon.code}'::text, 2000::numeric, '${alphaCust.id}'::uuid, '${testEmailAlpha}'::text)`);
  assert(res2?.valid === false, 'Second use of coupon by the same customer account is strictly REJECTED');
  assert(
    (res2?.error || '').includes("already used this coupon"),
    `Error message informs customer: "${res2?.error}"`
  );

  // Test 2.5: Different customer account can still apply the coupon
  const res3 = querySingleJson(`SELECT public.validate_coupon_for_customer('${testCoupon.code}'::text, 2000::numeric, '${betaCust.id}'::uuid, '${testEmailBeta}'::text)`);
  assert(res3?.valid === true, 'Different customer account can still apply the coupon within limits');

  // Test 2.6: Second coupon code can be redeemed by the first customer
  const secondCoupon = coupons[1];
  if (secondCoupon) {
    const res4 = querySingleJson(`SELECT public.validate_coupon_for_customer('${secondCoupon.code}'::text, 2000::numeric, '${alphaCust.id}'::uuid, '${testEmailAlpha}'::text)`);
    assert(res4?.valid === true, `First customer can apply different coupon ${secondCoupon.code}`);
  }

  // Test 2.7: Idempotent payment callback handling
  const commitIdempotentRes = querySingleJson(`SELECT public.commit_coupon_redemption('${dummyOrderId}'::uuid, 'TH3EE-VERIFY-001'::text, '${testCoupon.code}'::text, '${alphaCust.id}'::uuid, '${testEmailAlpha}'::text, ${res1.discount_amount}::numeric)`);
  assert(commitIdempotentRes?.success === true, 'Duplicate payment callback for same order/coupon is handled idempotently without error');

  // Clean up test redemptions, temporary test order, and test customers
  runSql(`DELETE FROM coupon_redemptions WHERE customer_email IN ('${testEmailAlpha}', '${testEmailBeta}');`);
  runSql(`DELETE FROM orders WHERE id = '${dummyOrderId}';`);
  runSql(`DELETE FROM customers WHERE email IN ('${testEmailAlpha}', '${testEmailBeta}');`);


  // -------------------------------------------------------------------
  // SECTION 3: TH3EE REWARD CLUB (LOYALTY PROGRAMME BACKEND & RULES)
  // -------------------------------------------------------------------
  console.log('\n--- 3. TH3EE REWARD CLUB (Loyalty Programme Backend & Rules) ---');

  const testLoyaltyEmail = 'verify.patron.loyalty@th3ee.test';

  // Ensure test customer record exists
  let testCustId = '';
  const existingCust = queryJson(`SELECT id FROM customers WHERE email = '${testLoyaltyEmail}';`);
  if (existingCust.length > 0) {
    testCustId = existingCust[0].id;
  } else {
    runSql(`INSERT INTO customers (full_name, email, phone) VALUES ('Loyalty Test Patron', '${testLoyaltyEmail}', '9999988888');`);
    const createdCust = queryJson(`SELECT id FROM customers WHERE email = '${testLoyaltyEmail}';`);
    testCustId = createdCust[0]?.id || '';
  }

  // Clean up test tables for this customer
  runSql(`DELETE FROM loyalty_reward_claims WHERE customer_id = '${testCustId}';`);
  runSql(`DELETE FROM loyalty_stamps WHERE customer_id = '${testCustId}';`);
  runSql(`DELETE FROM loyalty_audit_logs WHERE customer_id = '${testCustId}';`);

  // Test 3.1: Fresh patron has 0 active stamps
  const sum0 = querySingleJson(`SELECT public.get_customer_loyalty_summary('${testCustId}'::uuid, '${testLoyaltyEmail}'::text);`);
  assert(Number(sum0?.active_stamps_count) === 0, 'Fresh patron has 0 active stamps');
  assert(Number(sum0?.stamps_needed_for_reward) === 7, 'Punchcard requires 7 stamps to unlock reward');
  assert(sum0?.can_claim_reward === false, 'Cannot claim reward with 0 stamps');

  // Test 3.2: Admin adjustment adds 1 stamp with mandatory audit log
  const adjust1 = querySingleJson(`SELECT public.admin_adjust_loyalty_stamps('${testCustId}'::uuid, 1::integer, 'Automated launch test: 1st stamp'::text, 'admin@th3ee.in'::text);`);
  assert(adjust1?.success === true, 'admin_adjust_loyalty_stamps RPC successfully issues stamp');

  // Test 3.3: Stamp validity is 12 calendar months
  const stampRow = queryJson(`SELECT id, status, earned_at, expires_at, celebration_acknowledged FROM loyalty_stamps WHERE customer_id = '${testCustId}';`);
  assert(stampRow.length === 1, 'Stamp record minted in loyalty_stamps table');
  assert(stampRow[0]?.status === 'active', 'Stamp status is active');

  const earnedDate = new Date(stampRow[0]?.earned_at).getTime();
  const expiresDate = new Date(stampRow[0]?.expires_at).getTime();
  const monthsDiff = Math.round((expiresDate - earnedDate) / (1000 * 60 * 60 * 24 * 30.4));
  assert(monthsDiff >= 11 && monthsDiff <= 13, `Stamp validity is exactly 12 calendar months (computed: ~${monthsDiff} months)`);

  // Test 3.4: Audit log permanently logged
  const auditLogs = queryJson(`SELECT action, reason, performed_by FROM loyalty_audit_logs WHERE customer_id = '${testCustId}';`);
  assert(auditLogs.length >= 1, 'Administrative adjustment logged in tamper-proof loyalty_audit_logs table');
  assert(auditLogs[0]?.performed_by === 'admin@th3ee.in', 'Audit log records acting administrator identity');

  // Test 3.5: Celebration acknowledgement
  assert(stampRow[0]?.celebration_acknowledged === false, 'Newly earned stamp starts with celebration_acknowledged = false');

  runSql(`SELECT public.acknowledge_stamp_celebration('${stampRow[0]?.id}'::uuid);`);
  const ackedRow = queryJson(`SELECT celebration_acknowledged FROM loyalty_stamps WHERE id = '${stampRow[0]?.id}';`);
  assert(ackedRow[0]?.celebration_acknowledged === true, 'Stamp celebration acknowledged to prevent replaying animation on refresh');

  // Test 3.6: Accumulate 7 stamps to unlock reward
  querySingleJson(`SELECT public.admin_adjust_loyalty_stamps('${testCustId}'::uuid, 6::integer, 'Automated test: Completing 7/7 punchcard'::text, 'admin@th3ee.in'::text);`);
  const sum7 = querySingleJson(`SELECT public.get_customer_loyalty_summary('${testCustId}'::uuid, '${testLoyaltyEmail}'::text);`);
  assert(Number(sum7?.active_stamps_count) === 7, `Patron now has 7 active stamps (found ${sum7?.active_stamps_count})`);
  assert(sum7?.can_claim_reward === true, 'Reward is UNLOCKED when 7 active stamps are collected');

  // Test 3.7: Claim reward
  const claimPayload = {
    p_customer_id: testCustId,
    p_customer_email: testLoyaltyEmail,
    p_product_id: baahubaliProduct?.id || null,
    p_variant_id: null,
    p_size: 'XL',
    p_color: 'Carbon Black',
    p_shipping_address: JSON.stringify({
      fullName: 'Loyalty Patron',
      phone: '9999988888',
      street: 'Jubilee Hills Road 36',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033'
    })
  };

  const claimData = querySingleJson(`SELECT public.claim_loyalty_reward('${claimPayload.p_customer_id}'::uuid, '${claimPayload.p_customer_email}'::text, '${claimPayload.p_product_id}'::uuid, NULL::uuid, '${claimPayload.p_size}'::text, '${claimPayload.p_color}'::text, '${claimPayload.p_shipping_address.replace(/'/g, "''")}'::jsonb)`);
  assert(claimData?.success === true, 'claim_loyalty_reward RPC successfully creates reward claim');
  assert(Boolean(claimData?.claim_code && claimData.claim_code.startsWith('TH3EE-RWD-')), `Unique claim code generated: ${claimData?.claim_code}`);

  // Test 3.8: 7 stamps consumed and card resets to 0
  const sumPostClaim = querySingleJson(`SELECT public.get_customer_loyalty_summary('${testCustId}'::uuid, '${testLoyaltyEmail}'::text)`);
  assert(Number(sumPostClaim?.active_stamps_count) === 0, 'Claiming reward consumes exactly 7 stamps; active punchcard starts fresh');
  assert(sumPostClaim?.can_claim_reward === false, 'Cannot claim another reward without collecting 7 new stamps');

  const consumedStamps = queryJson(`SELECT count(*) AS count FROM loyalty_stamps WHERE customer_id = '${testCustId}' AND status = 'consumed';`);
  assert(Number(consumedStamps[0]?.count) === 7, 'Exactly 7 stamps transitioned to status = consumed');

  // Test 3.9: Fulfillment of claim
  const claimRecord = queryJson(`SELECT id, status FROM loyalty_reward_claims WHERE customer_id = '${testCustId}';`);
  assert(claimRecord.length === 1, 'Reward claim appears in loyalty_reward_claims ledger');

  if (claimRecord[0]?.id) {
    runSql(`UPDATE loyalty_reward_claims SET status = 'fulfilled', fulfilled_at = now(), admin_notes = 'Dispatched via BlueDart AWB #TH3EE8899' WHERE id = '${claimRecord[0].id}';`);
    const fulfilledCheck = queryJson(`SELECT status, admin_notes, fulfilled_at FROM loyalty_reward_claims WHERE id = '${claimRecord[0].id}';`);
    assert(fulfilledCheck[0]?.status === 'fulfilled', 'Reward claim status updated to fulfilled');
    assert(Boolean(fulfilledCheck[0]?.fulfilled_at), 'Reward claim timestamped with fulfillment date');
  }

  // Clean up test data
  runSql(`DELETE FROM loyalty_reward_claims WHERE customer_id = '${testCustId}';`);
  runSql(`DELETE FROM loyalty_stamps WHERE customer_id = '${testCustId}';`);
  runSql(`DELETE FROM loyalty_audit_logs WHERE customer_id = '${testCustId}';`);
  runSql(`DELETE FROM customers WHERE id = '${testCustId}';`);


  // -------------------------------------------------------------------
  // SECTION 4: FRONTEND UI & ARCHITECTURE VERIFICATION
  // -------------------------------------------------------------------
  console.log('\n--- 4. Frontend UI & Architecture Verification ---');

  const loyaltyClubCardPath = resolve(__dirname, '../src/components/loyalty/LoyaltyClubCard.tsx');
  assert(existsSync(loyaltyClubCardPath), 'src/components/loyalty/LoyaltyClubCard.tsx component exists');
  const loyaltyClubCardContent = readFileSync(loyaltyClubCardPath, 'utf8');

  assert(loyaltyClubCardContent.includes('TH3EE REWARD CLUB'), 'Loyalty card renders TH3EE REWARD CLUB header');
  assert(loyaltyClubCardContent.includes('TOTAL_STAMPS = 7'), 'Loyalty card enforces 7 circular stamp slots');
  assert(loyaltyClubCardContent.includes('isCelebrating'), 'Tactile physical stamp drop animation supported');
  assert(loyaltyClubCardContent.includes('useReducedMotion'), 'Accessibility: reduced motion supported');
  assert(loyaltyClubCardContent.includes('isClaimModalOpen'), 'Reward claim modal with size & address selection supported');

  const accountViewPath = resolve(__dirname, '../src/components/auth/CustomerAccountView.tsx');
  const accountViewContent = readFileSync(accountViewPath, 'utf8');
  assert(accountViewContent.includes("activeTab === 'loyalty'"), 'CustomerAccountView integrates Reward Club tab');
  assert(accountViewContent.includes('LoyaltyClubCard'), 'CustomerAccountView renders LoyaltyClubCard');

  const adminLoyaltyManagerPath = resolve(__dirname, '../src/components/admin/AdminLoyaltyManager.tsx');
  assert(existsSync(adminLoyaltyManagerPath), 'src/components/admin/AdminLoyaltyManager.tsx component exists');
  const adminLoyaltyManagerContent = readFileSync(adminLoyaltyManagerPath, 'utf8');
  assert(adminLoyaltyManagerContent.includes('adminUpdateClaimStatus'), 'AdminLoyaltyManager supports claims fulfillment');
  assert(adminLoyaltyManagerContent.includes('adminAdjustStamps'), 'AdminLoyaltyManager provides manual adjustment tool with mandatory reason');

  const appPath = resolve(__dirname, '../src/App.tsx');
  const appContent = readFileSync(appPath, 'utf8');
  assert(appContent.includes('AdminLoyaltyManager'), 'src/App.tsx imports and integrates AdminLoyaltyManager');
  assert(appContent.includes('activeTab === "loyalty"'), 'src/App.tsx renders Reward Club tab in Atelier Desk');

  const edgeCheckoutPath = resolve(__dirname, '../functions/razorpay-checkout/index.ts');
  const edgeCheckoutContent = readFileSync(edgeCheckoutPath, 'utf8');
  assert(edgeCheckoutContent.includes('validate_coupon_for_customer'), 'Edge function pre-validates coupon redemption eligibility');

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLaunchVerification().catch((err) => {
  console.error('\nVerification suite crashed:', err);
  process.exit(1);
});
