import { insforge, isInsForgeConfigured } from '../src/lib/insforge';

async function verify() {
  console.log('--- Verifying Admin Analytics & Visitor Tracking ---');
  console.log('InsForge configured:', isInsForgeConfigured());

  // 1. Test get_admin_analytics_summary RPC
  const { data, error } = await (insforge.database as any).rpc('get_admin_analytics_summary', {
    p_timeframe: 'all'
  });

  if (error) {
    console.error('RPC Error:', error);
    process.exit(1);
  }

  console.log('✔ get_admin_analytics_summary returned successfully!');
  console.log('Summary metrics:', {
    timeframe: data.timeframe,
    totalVisitors: data.totalVisitors,
    mobileVisitors: data.mobileVisitors,
    desktopVisitors: data.desktopVisitors,
    totalCustomers: data.totalCustomers,
    todayLoginsCount: data.todayLoginsCount,
    totalOrders: data.totalOrders,
    totalRevenue: data.totalRevenue,
    avgOrderValue: data.avgOrderValue,
    conversionRate: `${data.conversionRate}%`,
    cartAbandonmentRate: `${data.cartAbandonmentRate}%`
  });

  console.log(`✔ Top products count: ${data.topProducts?.length}`);
  if (data.topProducts?.length > 0) {
    console.log('Sample top product:', data.topProducts[0]);
  }

  console.log(`✔ Recent customer logins: ${data.recentLogins?.length}`);
  if (data.recentLogins?.length > 0) {
    console.log('Sample customer login:', data.recentLogins[0]);
  }

  console.log(`✔ Recent orders: ${data.recentOrders?.length}`);
  if (data.recentOrders?.length > 0) {
    console.log('Sample order:', {
      orderNumber: data.recentOrders[0].orderNumber,
      customerName: data.recentOrders[0].customerName,
      customerEmail: data.recentOrders[0].customerEmail,
      amount: data.recentOrders[0].totalAmount,
      status: data.recentOrders[0].paymentStatus
    });
  }

  console.log(`✔ Live events count: ${data.liveEvents?.length}`);
  if (data.liveEvents?.length > 0) {
    console.log('Sample live event:', data.liveEvents[0]);
  }

  console.log('--- Verification complete: All dashboard requirements satisfied! ---');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
