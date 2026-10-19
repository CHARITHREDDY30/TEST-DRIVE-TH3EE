import { insforge, isInsForgeConfigured } from '../lib/insforge';

export interface SalesReportSummary {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  totalStockUnits: number;
}

export const reportsService = {
  async getSalesSummary(): Promise<SalesReportSummary> {
    if (!isInsForgeConfigured()) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        totalStockUnits: 0
      };
    }

    try {
      const { data: orders } = await insforge.database
        .from('orders')
        .select('total_amount, order_status, payment_status');

      const { data: variants } = await insforge.database
        .from('product_variants')
        .select('stock_quantity');

      let totalRevenue = 0;
      let totalOrders = orders?.length || 0;
      let pendingOrders = 0;
      let completedOrders = 0;

      (orders || []).forEach((ord: any) => {
        const amt = Number(ord.total_amount) || 0;
        totalRevenue += amt;
        const st = (ord.order_status || '').toLowerCase();
        if (st === 'pending' || st === 'received') pendingOrders++;
        else if (st === 'delivered') completedOrders++;
      });

      let totalStockUnits = 0;
      (variants || []).forEach((v: any) => {
        totalStockUnits += Number(v.stock_quantity) || 0;
      });

      return {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        totalStockUnits
      };
    } catch (err) {
      console.warn('Reports summary error:', err);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        totalStockUnits: 0
      };
    }
  },

  downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => {
          const val = String(cell ?? '').replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')
      )
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
