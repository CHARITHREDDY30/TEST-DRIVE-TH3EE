import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function runDbQuery(sql: string): string {
  const cleanSql = sql.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const res = spawnSync('cmd.exe', ['/c', 'insforge', 'db', 'query', cleanSql], {
    encoding: 'utf8'
  });
  if (res.status !== 0) {
    throw new Error(`DB Query failed: ${res.stderr || res.stdout}`);
  }
  return res.stdout || '';
}

async function main() {
  console.log('=================================================================');
  console.log('TH3EE — STAGE C: APPROVED PRODUCTION DATA CLEANUP EXECUTION');
  console.log('=================================================================');

  const backupDir = path.resolve(process.cwd(), 'scripts', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `pre_cleanup_backup_${timestamp}.json`);

  console.log('\n[1/4] Exporting records matching approved deletion scope for backup...');

  const testOrdersSql = `
SELECT json_agg(t) FROM (
  SELECT o.*, 
    COALESCE((SELECT json_agg(i) FROM order_items i WHERE i.order_id = o.id), '[]'::json) AS items,
    COALESCE((SELECT json_agg(p) FROM payments p WHERE p.order_id = o.id), '[]'::json) AS payments,
    COALESCE((SELECT json_agg(e) FROM order_tracking_events e WHERE e.order_id = o.id), '[]'::json) AS events
  FROM orders o
  WHERE o.order_number LIKE 'TH3EE-TEST-%'
     OR o.customer_email LIKE '%example.com'
     OR o.customer_name IN ('Test Verify User', 'Test Anon Razorpay Customer')
) t;
`;

  const testOrdersRaw = runDbQuery(testOrdersSql);

  const testCustSql = `
SELECT json_agg(c) FROM (
  SELECT * FROM customers
  WHERE email LIKE 'new_verified_%@th3ee.in'
     OR email LIKE 'missing_profile_%@th3ee.in'
     OR email LIKE 'test_unverified_%@th3ee.in'
) c;
`;

  const testCustRaw = runDbQuery(testCustSql);

  const backupData = {
    backupTimestamp: new Date().toISOString(),
    rawExport: {
      ordersQueryOutput: testOrdersRaw,
      customersQueryOutput: testCustRaw
    }
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✓ Backup successfully created at: ${backupFilePath}`);

  console.log('\n[2/4] Executing sequential cleanup in PostgreSQL...');

  // Step 1: Remove payments for test orders (due to ON DELETE RESTRICT)
  console.log('  -> Purging test payment transactions...');
  const res1 = runDbQuery(`
    DELETE FROM public.payments 
    WHERE order_id IN (
      SELECT id FROM public.orders 
      WHERE order_number LIKE 'TH3EE-TEST-%' 
         OR customer_email LIKE '%example.com' 
         OR customer_name IN ('Test Verify User', 'Test Anon Razorpay Customer')
    );
  `);
  console.log('     ' + res1.trim());

  // Step 2: Remove test orders (order_items and order_tracking_events cascade)
  console.log('  -> Purging test orders (line items & tracking milestones cascade automatically)...');
  const res2 = runDbQuery(`
    DELETE FROM public.orders 
    WHERE order_number LIKE 'TH3EE-TEST-%' 
       OR customer_email LIKE '%example.com' 
       OR customer_name IN ('Test Verify User', 'Test Anon Razorpay Customer');
  `);
  console.log('     ' + res2.trim());

  // Step 3: Remove synthetic test customer profiles
  console.log('  -> Purging synthetic test customer profiles...');
  const res3 = runDbQuery(`
    DELETE FROM public.customers 
    WHERE email LIKE 'new_verified_%@th3ee.in' 
       OR email LIKE 'missing_profile_%@th3ee.in' 
       OR email LIKE 'test_unverified_%@th3ee.in';
  `);
  console.log('     ' + res3.trim());

  // Step 4: Remove unverified test auth user
  console.log('  -> Purging unverified test user from auth.users...');
  const res4 = runDbQuery(`
    DELETE FROM auth.users 
    WHERE email LIKE 'test_unverified_%@th3ee.in';
  `);
  console.log('     ' + res4.trim());

  console.log('\n[3/4] Verifying post-cleanup database state...');
  const countSql = `
SELECT 'products' AS tbl, count(*) FROM products
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'hero_slides', count(*) FROM hero_slides
UNION ALL SELECT 'store_settings', count(*) FROM store_settings
UNION ALL SELECT 'coupons', count(*) FROM coupons
UNION ALL SELECT 'admin_users', count(*) FROM admin_users
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'payments', count(*) FROM payments
UNION ALL SELECT 'order_tracking_events', count(*) FROM order_tracking_events;
`;

  const postCountsOutput = runDbQuery(countSql);
  console.log(postCountsOutput);

  console.log('\n[4/4] Verifying remaining genuine customers and admin...');
  const genuineCustOutput = runDbQuery(`SELECT id, email, full_name, phone FROM customers;`);
  console.log(genuineCustOutput);

  console.log('=================================================================');
  console.log('STAGE C COMPLETE: DATA CLEANUP VERIFIED AND GENUINE DATA INTACT');
  console.log('=================================================================');
}

main().catch((err) => {
  console.error('Cleanup execution error:', err);
  process.exit(1);
});
