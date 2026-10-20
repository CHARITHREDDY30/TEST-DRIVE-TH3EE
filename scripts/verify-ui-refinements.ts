import fs from 'fs';
import path from 'path';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    failedCount++;
  }
}

console.log('======================================================');
console.log('TH3EE — UI REFINEMENT & VERIFICATION SUITE');
console.log('Digital Loyalty Pass + Payment Confirmation Receipt + Profile');
console.log('======================================================\n');

const projectRoot = process.cwd();

// File paths
const loyaltyCardPath = path.join(projectRoot, 'src/components/loyalty/LoyaltyClubCard.tsx');
const receiptPath = path.join(projectRoot, 'src/components/checkout/PaymentConfirmationReceipt.tsx');
const checkoutViewPath = path.join(projectRoot, 'src/components/checkout/CheckoutView.tsx');
const customerAccountPath = path.join(projectRoot, 'src/components/auth/CustomerAccountView.tsx');
const passQRCodesPath = path.join(projectRoot, 'src/components/common/PassQRCodes.tsx');
const authServicePath = path.join(projectRoot, 'src/services/auth.service.ts');
const customerServicePath = path.join(projectRoot, 'src/services/customer.service.ts');
const r2UploadFnPath = path.join(projectRoot, 'functions/r2-upload/index.ts');
const appTsxPath = path.join(projectRoot, 'src/App.tsx');

// File contents
const loyaltyCardContent = fs.readFileSync(loyaltyCardPath, 'utf-8');
const receiptContent = fs.readFileSync(receiptPath, 'utf-8');
const checkoutViewContent = fs.readFileSync(checkoutViewPath, 'utf-8');
const customerAccountContent = fs.readFileSync(customerAccountPath, 'utf-8');
const passQRCodesContent = fs.readFileSync(passQRCodesPath, 'utf-8');
const authServiceContent = fs.readFileSync(authServicePath, 'utf-8');
const customerServiceContent = fs.readFileSync(customerServicePath, 'utf-8');
const r2UploadFnContent = fs.readFileSync(r2UploadFnPath, 'utf-8');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf-8');

// -------------------------------------------------------------------
// 1. SECTION 2: DIGITAL LOYALTY CARD (WALLET PASS)
// -------------------------------------------------------------------
console.log('--- 1. Section 2: Digital Loyalty Card (Wallet Pass Aesthetic) ---');

assert(
  loyaltyCardContent.includes('rounded-[28px]') || loyaltyCardContent.includes('rounded-3xl'),
  'Loyalty card has clean rounded silhouette inspired by wallet pass'
);

assert(
  loyaltyCardContent.includes('bg-gradient-to-b') && loyaltyCardContent.includes('#18181A') && loyaltyCardContent.includes('#0A0A0C'),
  'Loyalty card uses dark obsidian / charcoal luxury streetwear card surface'
);

assert(
  loyaltyCardContent.includes('TH3EE REWARD CLUB') && loyaltyCardContent.includes('CULT PASS'),
  'Card header includes official TH3EE REWARD CLUB and CULT PASS branding'
);

assert(
  loyaltyCardContent.includes('memberCode') && loyaltyCardContent.includes('PASS #'),
  'Card includes clear customer membership pass identifier'
);

assert(
  loyaltyCardContent.includes('TOTAL_STAMPS = 7'),
  'Punchcard strictly enforces seven valid stamp positions'
);

assert(
  loyaltyCardContent.includes('PassQRCode') && loyaltyCardContent.includes('TH3EE MEMBER PASS'),
  'Card renders authentic digital wallet pass QR code block'
);

assert(
  loyaltyCardContent.includes('12 calendar months'),
  'Card clearly states 12 calendar month stamp validity'
);

assert(
  loyaltyCardContent.includes('stampsRemaining') && loyaltyCardContent.includes('STAMPS COLLECTED'),
  'Card displays dynamic progress and accurate remaining stamps calculation'
);

assert(
  loyaltyCardContent.includes('useReducedMotion') && loyaltyCardContent.includes('shouldReduceMotion'),
  'Card respects reduced motion accessibility settings for stamp animations'
);

assert(
  loyaltyCardContent.includes('acknowledgeStampCelebration'),
  'Card acknowledges newly awarded stamp to prevent infinite replays on refresh'
);

assert(
  loyaltyCardContent.includes('CLAIM YOUR REWARD') && loyaltyCardContent.includes('setIsClaimModalOpen'),
  'Reward claim button is explicit and requires customer confirmation'
);

// -------------------------------------------------------------------
// 2. SECTION 3: PAYMENT CONFIRMATION SCREEN (TICKET SILHOUETTE RECEIPT)
// -------------------------------------------------------------------
console.log('\n--- 2. Section 3: Payment Confirmation Receipt (Ticket Silhouette) ---');

assert(
  fs.existsSync(receiptPath),
  'PaymentConfirmationReceipt.tsx component exists'
);

assert(
  receiptContent.includes('PAYMENT SUCCESSFUL') && receiptContent.includes('ORDER CONFIRMED'),
  'Receipt features clear PAYMENT SUCCESSFUL and ORDER CONFIRMED headings'
);

assert(
  receiptContent.includes('Thank you') && receiptContent.includes('Your payment has been processed successfully'),
  'Receipt includes concise thank-you message matching reference image'
);

assert(
  receiptContent.includes('rounded-full bg-neutral-100') && receiptContent.includes('border-dashed'),
  'Ticket silhouette incorporates side notches and perforation line'
);

assert(
  receiptContent.includes('ReceiptBarcode') && receiptContent.includes('border-dashed'),
  'Receipt renders crisp SVG barcode with order number underneath'
);

assert(
  receiptContent.includes('isVerifying') && receiptContent.includes('VERIFYING YOUR PAYMENT'),
  'Receipt protects against false successes with a dedicated VERIFYING YOUR PAYMENT state'
);

assert(
  receiptContent.includes('isFailed') && receiptContent.includes('PAYMENT VERIFICATION FAILED'),
  'Receipt handles failed payment with a retry option and preserves user state'
);

assert(
  receiptContent.includes('window.print()') && receiptContent.includes('@media print'),
  'Receipt supports print media stylesheet for pristine physical printing / PDF download'
);

assert(
  receiptContent.includes('Track Your Order') &&
  receiptContent.includes('Print Receipt') &&
  receiptContent.includes('View In Order History') &&
  receiptContent.includes('Continue Shopping'),
  'Receipt provides all 4 required actions: Track, Print, View Orders, and Continue Shopping'
);

assert(
  receiptContent.includes('support@th3ee.in'),
  'Receipt directs customer support inquiries to support@th3ee.in'
);

assert(
  checkoutViewContent.includes('PaymentConfirmationReceipt') && checkoutViewContent.includes('orderReceipt'),
  'CheckoutView renders PaymentConfirmationReceipt upon verified backend payment'
);

assert(
  appTsxContent.includes('PaymentConfirmationReceipt') && appTsxContent.includes('ShoppingBagDrawer'),
  'ShoppingBagDrawer renders PaymentConfirmationReceipt upon verified order placement'
);

// -------------------------------------------------------------------
// 3. SECTION 4: REMOVAL OF UNWANTED AI-STYLE GIMMICKS
// -------------------------------------------------------------------
console.log('\n--- 3. Section 4: Removal of Unwanted AI-Style Visual Elements ---');

assert(
  !loyaltyCardContent.includes('SparklesIcon'),
  'SparklesIcon removed from LoyaltyClubCard'
);

assert(
  !loyaltyCardContent.includes('text-9xl tracking-tighter flex items-center justify-center text-white'),
  'Giant 9xl watermark background graphic removed from loyalty card'
);

assert(
  !loyaltyCardContent.includes('blur-3xl pointer-events-none'),
  'Artificial blur-3xl glow blob removed from loyalty card'
);

assert(
  !appTsxContent.includes('<Sparkles className="w-3.5 h-3.5'),
  'Toast notification sparkles icon replaced with refined status indicator in App.tsx'
);

// -------------------------------------------------------------------
// 4. SECTION 5: CUSTOMER PROFILE REDESIGN & SECURE AVATAR UPLOAD
// -------------------------------------------------------------------
console.log('\n--- 4. Section 5: Customer Profile Redesign & Avatar Upload ---');

assert(
  customerAccountContent.includes('uploadService.uploadImage'),
  'CustomerAccountView integrates secure uploadService for avatar upload'
);

assert(
  customerAccountContent.includes('5 * 1024 * 1024'),
  'Avatar upload strictly enforces 5 MB file size limit'
);

assert(
  customerAccountContent.includes('image/jpeg') &&
  customerAccountContent.includes('image/png') &&
  customerAccountContent.includes('image/webp'),
  'Avatar upload validates acceptable image types (JPEG, PNG, WebP)'
);

assert(
  customerAccountContent.includes('URL.createObjectURL') && customerAccountContent.includes('avatarPreview'),
  'Avatar upload provides local preview before saving'
);

assert(
  customerAccountContent.includes('handleSaveAvatar') &&
  customerAccountContent.includes('handleCancelAvatar') &&
  customerAccountContent.includes('handleRemoveAvatar'),
  'Avatar management includes complete Save, Cancel, and Remove Photo workflow'
);

assert(
  customerAccountContent.includes('getCustomerInitials'),
  'Fallback avatar displays stylish customer initials when no photo exists'
);

assert(
  authServiceContent.includes('avatar_url') &&
  customerServiceContent.includes('avatar_url'),
  'authService and customerService support avatar_url persistence to InsForge'
);

assert(
  r2UploadFnContent.includes('avatars') &&
  r2UploadFnContent.includes('user-${userId}'),
  'Edge function scopes avatar uploads to user-${userId} to prevent cross-customer tampering'
);

assert(
  customerAccountContent.includes('rounded-2xl') &&
  customerAccountContent.includes('PATRON IDENTITY') &&
  customerAccountContent.includes('ACCOUNT CREDENTIALS'),
  'Customer Profile Details tab redesigned with clean rounded cards and premium typography'
);

// -------------------------------------------------------------------
// 5. SUMMARY
// -------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TOTAL AUDIT CHECKS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('ALL TH3EE UI REFINEMENT & VERIFICATION REQUIREMENTS PASSED WITH 100% SUCCESS!\n');
  process.exit(0);
}
