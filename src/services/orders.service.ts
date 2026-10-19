import type { Order } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';

/**
 * Maps database orders row to frontend Order domain type.
 */
export function mapDbOrderToFrontend(row: any): Order {
  // Normalize status for UI compatibility
  let displayStatus = 'Received';
  const rawStatus = (row.order_status || '').toLowerCase();
  if (rawStatus === 'in_production' || rawStatus === 'in production') displayStatus = 'In Production';
  else if (rawStatus === 'dispatched') displayStatus = 'Dispatched';
  else if (rawStatus === 'delivered') displayStatus = 'Delivered';
  else if (rawStatus === 'cancelled') displayStatus = 'Cancelled';
  else displayStatus = row.order_status || 'Received';

  return {
    id: row.order_number || row.id,
    customerName: row.customer_name || 'Anonymous Customer',
    phone: row.customer_phone || '',
    items: row.admin_notes || (Array.isArray(row.order_items) && row.order_items.length > 0
      ? row.order_items.map((it: any) => `${it.product_name} (${it.variant_title}) x${it.quantity}`).join(', ')
      : 'Order Items'),
    total: Number(row.total_amount ?? 0),
    status: displayStatus,
    courier: row.shipping_provider || undefined,
    trackingNumber: row.tracking_number || undefined,
    trackingUrl: row.tracking_url || undefined,
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const ordersService = {
  async getOrders(): Promise<Order[]> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapDbOrderToFrontend);
        }
        if (error) {
          console.warn('InsForge orders query error:', error);
        }
      } catch (err) {
        console.warn('InsForge orders query error:', err);
      }
    }
    return [];
  },

  async createOrder(params: {
    customerName: string;
    phone: string;
    email?: string;
    shippingAddress: Record<string, any>;
    itemsSummary: string;
    subtotal: number;
    discountAmount?: number;
    shippingAmount?: number;
    totalAmount: number;
    couponCode?: string;
    items?: Array<{
      productId?: string;
      variantId?: string;
      productName: string;
      variantTitle: string;
      sku?: string;
      unitPrice: number;
      quantity: number;
    }>;
  }): Promise<Order> {
    const orderNumber = `TH3EE-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isInsForgeConfigured()) {
      try {
        // Reservation expires in 2 hours
        const reservationExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

        const orderRow = {
          order_number: orderNumber,
          customer_name: params.customerName,
          customer_phone: params.phone,
          customer_email: params.email || null,
          shipping_address: params.shippingAddress || {},
          subtotal: params.subtotal,
          discount_amount: params.discountAmount || 0,
          shipping_amount: params.shippingAmount || 0,
          total_amount: params.totalAmount,
          order_status: 'pending',
          payment_status: 'unpaid',
          coupon_code: params.couponCode || null,
          reservation_expires_at: reservationExpiresAt,
          admin_notes: params.itemsSummary,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await insforge.database
          .from('orders')
          .insert([orderRow])
          .select()
          .single();

        if (error) {
          console.warn('InsForge order creation note:', error);
        }

        if (data) {
          // If items array was provided, insert order_items
          if (Array.isArray(params.items) && params.items.length > 0) {
            const itemRows = params.items.map(it => ({
              order_id: data.id,
              product_id: it.productId || null,
              variant_id: it.variantId || null,
              product_name: it.productName,
              variant_title: it.variantTitle,
              sku: it.sku || null,
              unit_price: it.unitPrice,
              quantity: it.quantity,
              subtotal: it.unitPrice * it.quantity
            }));
            try {
              await insforge.database.from('order_items').insert(itemRows);
            } catch (itemErr) {
              console.warn('Order items insert note:', itemErr);
            }
          }

          return mapDbOrderToFrontend(data);
        }
      } catch (err) {
        console.warn('Orders service create fallback:', err);
      }
    }

    return {
      id: orderNumber,
      customerName: params.customerName,
      phone: params.phone,
      items: params.itemsSummary,
      total: params.totalAmount,
      status: 'Received',
      date: 'Just now',
      createdAt: new Date().toISOString()
    };
  },

  async updateOrderStatus(
    orderId: string, 
    status: string, 
    tracking?: { shippingProvider?: string; trackingNumber?: string; trackingUrl?: string }
  ): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        let dbStatus = status.toLowerCase();
        if (dbStatus === 'in production') dbStatus = 'in_production';

        const updatePayload: Record<string, any> = {
          order_status: dbStatus,
          updated_at: new Date().toISOString()
        };

        if (tracking?.shippingProvider !== undefined) updatePayload.shipping_provider = tracking.shippingProvider;
        if (tracking?.trackingNumber !== undefined) updatePayload.tracking_number = tracking.trackingNumber;
        if (tracking?.trackingUrl !== undefined) updatePayload.tracking_url = tracking.trackingUrl;

        const { error } = await insforge.database
          .from('orders')
          .update(updatePayload)
          .or(`id.eq.${orderId},order_number.eq.${orderId}`);

        if (error) {
          throw new Error(error.message || 'Failed to update order status');
        }
        return true;
      } catch (err) {
        console.error('Failed to update order status in InsForge:', err);
        throw err;
      }
    }
    return true;
  }
};
