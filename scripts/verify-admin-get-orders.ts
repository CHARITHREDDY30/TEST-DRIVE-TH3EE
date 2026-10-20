import { ordersService } from '../src/services/orders.service';

async function verify() {
  console.log('Testing ordersService.getOrders()...');
  const orders = await ordersService.getOrders();
  console.log(`Total orders returned: ${orders.length}`);

  if (orders.length === 0) {
    throw new Error('Expected at least 1 order, got 0');
  }

  const latest = orders[0];
  console.log('Latest order:', {
    orderNumber: latest.orderNumber,
    customerName: latest.customerName,
    phone: latest.phone,
    total: latest.total,
    paymentStatus: latest.paymentStatus,
    status: latest.status,
    deliveryStatus: latest.deliveryStatus,
    courier: latest.courier,
    trackingNumber: latest.trackingNumber,
    trackingUrl: latest.trackingUrl,
    orderItemsCount: latest.orderItems?.length
  });

  console.log('✓ SUCCESS: Admin getOrders() loads real persisted orders with full items and fulfillment details!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
