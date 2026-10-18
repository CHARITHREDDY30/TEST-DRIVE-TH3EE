import type { Order } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';

export const ordersService = {
  async getOrders(): Promise<Order[]> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data as Order[];
        }
      } catch (err) {
        console.warn('InsForge orders query error:', err);
      }
    }
    // No fake/mock orders returned
    return [];
  },

  async createOrder(orderPayload: Omit<Order, 'id'> & { id?: string }): Promise<Order> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();

        if (!error && data) {
          return data as Order;
        }
        if (error) {
          throw new Error(error.message || 'Failed to create order');
        }
      } catch (err) {
        console.error('Failed to create order in InsForge:', err);
        throw err;
      }
    }
    // Fallback when backend is pending connection
    return {
      id: orderPayload.id || `TH3EE-${Math.floor(1000 + Math.random() * 9000)}`,
      ...orderPayload
    } as Order;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        const { error } = await insforge.database
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId);

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
