import type { Order, OrderTrackingEvent } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { broadcastCatalogChange } from './catalogSync';

/**
 * Maps database orders row to frontend Order domain type.
 */
export function mapDbOrderToFrontend(row: any): Order {
  // Normalize status for UI compatibility
  let displayStatus = 'Received';
  const rawStatus = (row.order_status || '').toLowerCase();
  if (rawStatus === 'in_production' || rawStatus === 'in production') displayStatus = 'In Production';
  else if (rawStatus === 'confirmed') displayStatus = 'Confirmed';
  else if (rawStatus === 'packed') displayStatus = 'Packed';
  else if (rawStatus === 'out_for_delivery' || rawStatus === 'out for delivery') displayStatus = 'Out For Delivery';
  else if (rawStatus === 'dispatched' || rawStatus === 'shipped') displayStatus = 'Dispatched';
  else if (rawStatus === 'delivered') displayStatus = 'Delivered';
  else if (rawStatus === 'cancelled') displayStatus = 'Cancelled';
  else displayStatus = row.order_status || 'Received';

  let displayDeliveryStatus = row.delivery_status || displayStatus;
  const rawDeliv = (row.delivery_status || '').toLowerCase();
  if (rawDeliv === 'order confirmed' || rawDeliv === 'confirmed') displayDeliveryStatus = 'Order confirmed';
  else if (rawDeliv === 'processing' || rawDeliv === 'in_production') displayDeliveryStatus = 'Processing';
  else if (rawDeliv === 'packed') displayDeliveryStatus = 'Packed';
  else if (rawDeliv === 'shipped' || rawDeliv === 'dispatched') displayDeliveryStatus = 'Shipped';
  else if (rawDeliv === 'out_for_delivery' || rawDeliv === 'out for delivery') displayDeliveryStatus = 'Out for delivery';
  else if (rawDeliv === 'delivered') displayDeliveryStatus = 'Delivered';
  else if (rawDeliv === 'cancelled') displayDeliveryStatus = 'Cancelled';

  const paymentRef = row.razorpay_payment_id || (Array.isArray(row.payments) && row.payments[0]?.provider_payment_id) || undefined;
  const orderRef = row.razorpay_order_id || (Array.isArray(row.payments) && row.payments[0]?.provider_order_id) || undefined;

  return {
    id: row.id || row.order_number,
    orderNumber: row.order_number || row.id,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || 'Customer',
    customerEmail: row.customer_email || undefined,
    phone: row.customer_phone || '',
    items: row.admin_notes || (Array.isArray(row.order_items) && row.order_items.length > 0
      ? row.order_items.map((it: any) => `${it.product_name} (${it.variant_title || it.size || 'Standard'}) x${it.quantity}`).join(', ')
      : 'Order Items'),
    total: Number(row.total_amount ?? 0),
    subtotal: Number(row.subtotal ?? row.total_amount ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    shippingAmount: Number(row.shipping_amount ?? 0),
    couponCode: row.coupon_code || undefined,
    status: displayStatus,
    paymentStatus: row.payment_status || 'unpaid',
    deliveryStatus: displayDeliveryStatus,
    paymentId: paymentRef,
    razorpayOrderId: orderRef,
    razorpayPaymentId: paymentRef,
    shippingAddress: row.shipping_address || undefined,
    orderItems: Array.isArray(row.order_items) ? row.order_items : undefined,
    courier: row.shipping_provider || undefined,
    trackingNumber: row.tracking_number || undefined,
    trackingUrl: row.tracking_url || undefined,
    deliveryPartnerId: row.delivery_partner_id || undefined,
    deliveryNotes: row.delivery_notes || undefined,
    deliveryAttempts: Number(row.delivery_attempts || 0),
    estimatedDeliveryDate: row.estimated_delivery_date || undefined,
    adminNotes: row.admin_notes || undefined,
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const ordersService = {
  /**
   * Fetches all orders with items (for Admin / reporting).
   */
  async getOrders(): Promise<Order[]> {
    if (isInsForgeConfigured()) {
      try {
        // 1. First try get_all_orders_admin RPC for reliable administrative order visibility
        const { data: rpcData, error: rpcErr } = await (insforge.database as any).rpc('get_all_orders_admin');
        if (!rpcErr && Array.isArray(rpcData)) {
          return rpcData.map(mapDbOrderToFrontend);
        }

        // 2. Direct table query fallback
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

  /**
   * Fetches a single order by UUID or orderNumber.
   */
  async getOrderByIdOrNumber(idOrNumber: string): Promise<Order | null> {
    if (!idOrNumber) return null;
    if (isInsForgeConfigured()) {
      try {
        // 1. Try secure get_order_by_identifier RPC (supports guest and authenticated tracking)
        const { data: rpcData, error: rpcErr } = await (insforge.database as any).rpc('get_order_by_identifier', {
          p_identifier: idOrNumber
        });

        if (!rpcErr && rpcData) {
          return mapDbOrderToFrontend(rpcData);
        }

        // 2. Direct table fallback query
        const { data, error } = await insforge.database
          .from('orders')
          .select('*, order_items(*)')
          .or(`id.eq.${idOrNumber},order_number.eq.${idOrNumber}`)
          .maybeSingle();

        if (!error && data) {
          return mapDbOrderToFrontend(data);
        }
      } catch (err) {
        console.warn('Get order error:', err);
      }
    }
    return null;
  },

  /**
   * Fetches chronological tracking events for an order.
   */
  async getOrderTrackingTimeline(orderIdOrNumber: string): Promise<OrderTrackingEvent[]> {
    if (!orderIdOrNumber) return [];
    if (isInsForgeConfigured()) {
      try {
        let realOrderId = orderIdOrNumber;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);
        
        if (!isUuid) {
          const { data: oRow } = await insforge.database
            .from('orders')
            .select('id')
            .eq('order_number', orderIdOrNumber)
            .maybeSingle();
          if (oRow?.id) {
            realOrderId = oRow.id;
          }
        }

        const { data, error } = await insforge.database
          .from('order_tracking_events')
          .select('*')
          .eq('order_id', realOrderId)
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(data)) {
          return data.map((ev: any) => ({
            id: ev.id,
            orderId: ev.order_id,
            status: ev.status,
            title: ev.title,
            message: ev.message,
            location: ev.location,
            carrierName: ev.carrier_name,
            trackingNumber: ev.tracking_number,
            trackingUrl: ev.tracking_url,
            createdBy: ev.created_by,
            createdAt: ev.created_at
          }));
        }
      } catch (err) {
        console.warn('Tracking events fetch error:', err);
      }
    }
    return [];
  },

  /**
   * Records a new milestone tracking event for an order.
   */
  async recordTrackingEvent(params: {
    orderId: string;
    status: string;
    title: string;
    message?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    location?: string;
    createdBy?: string;
  }): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        const { error } = await (insforge.database as any).rpc('record_order_tracking_event', {
          p_order_id: params.orderId,
          p_status: params.status,
          p_title: params.title,
          p_message: params.message || null,
          p_carrier: params.carrier || null,
          p_tracking_number: params.trackingNumber || null,
          p_tracking_url: params.trackingUrl || null,
          p_location: params.location || null,
          p_created_by: params.createdBy || null
        });
        return !error;
      } catch (err) {
        console.warn('Record tracking event error:', err);
      }
    }
    return false;
  },

  /**
   * Creates an order directly in the database.
   */
  async createOrder(params: {
    customerName: string;
    phone: string;
    email?: string;
    customerId?: string;
    customerEmail?: string;
    shippingAddress: Record<string, any>;
    itemsSummary: string;
    subtotal: number;
    discountAmount?: number;
    shippingAmount?: number;
    totalAmount: number;
    couponCode?: string;
    orderNumber?: string;
    paymentStatus?: string;
    orderStatus?: string;
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
    const orderNumber = params.orderNumber || `TH3EE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isInsForgeConfigured()) {
      const reservationExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const orderId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      let validCustomerId: string | null = null;
      if (params.customerId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.customerId);
        if (isUuid) {
          try {
            const { data: rpcCustId, error: rpcErr } = await (insforge.database as any).rpc('ensure_customer', {
              p_user_id: params.customerId,
              p_name: params.customerName.trim() || 'Customer',
              p_email: params.customerEmail ? params.customerEmail.trim().toLowerCase() : (params.email || null),
              p_phone: params.phone ? params.phone.trim() : null
            });

            if (!rpcErr && rpcCustId) {
              validCustomerId = rpcCustId;
            } else {
              const { data: cust } = await insforge.database
                .from('customers')
                .select('id')
                .or(`id.eq.${params.customerId},auth_user_id.eq.${params.customerId}`)
                .maybeSingle();

              validCustomerId = cust?.id || params.customerId;
            }
          } catch (cCheckErr) {
            console.warn('Customer verification note:', cCheckErr);
            validCustomerId = params.customerId;
          }
        }
      }

      const orderRow: Record<string, any> = {
        id: orderId,
        order_number: orderNumber,
        customer_id: validCustomerId,
        customer_name: params.customerName.trim(),
        customer_phone: params.phone.trim(),
        customer_email: params.customerEmail || params.email || null,
        shipping_address: params.shippingAddress || {},
        subtotal: params.subtotal,
        discount_amount: params.discountAmount || 0,
        shipping_amount: params.shippingAmount || 0,
        total_amount: params.totalAmount,
        order_status: params.orderStatus || 'pending',
        payment_status: params.paymentStatus || 'unpaid',
        coupon_code: params.couponCode || null,
        reservation_expires_at: reservationExpiresAt,
        admin_notes: params.itemsSummary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await insforge.database
        .from('orders')
        .insert([orderRow]);

      if (error) {
        console.error('InsForge order creation error:', error);
        throw new Error(error.message || 'Failed to save order to database.');
      }

      // Record initial order_placed tracking event
      try {
        await (insforge.database as any).rpc('record_order_tracking_event', {
          p_order_id: orderId,
          p_status: 'order_placed',
          p_title: 'Order Placed',
          p_message: 'Your order was successfully registered with TH3EE Atelier.'
        });
      } catch {}

      if (Array.isArray(params.items) && params.items.length > 0) {
        const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
        const itemRows = params.items.map(it => {
          let size = '';
          let colorName = '';
          if (it.variantTitle) {
            const parts = it.variantTitle.split('/').map(s => s.trim());
            if (parts.length >= 2) {
              colorName = parts[0];
              size = parts[1];
            } else {
              size = it.variantTitle;
            }
          }
          const validProdId = isUuid(it.productId) ? it.productId : null;
          const validVarId = isUuid(it.variantId) ? it.variantId : null;
          const lineTotal = Number(it.unitPrice || 0) * Number(it.quantity || 1);

          return {
            order_id: orderId,
            product_id: validProdId,
            variant_id: validVarId,
            product_name: it.productName,
            sku: it.sku || (it.productId && !validProdId ? it.productId : null),
            size: size || null,
            color_name: colorName || null,
            variant_title: it.variantTitle || null,
            unit_price: Number(it.unitPrice || 0),
            quantity: Number(it.quantity || 1),
            line_total: lineTotal,
            subtotal: lineTotal
          };
        });

        try {
          await insforge.database.from('order_items').insert(itemRows);
        } catch (itemErr) {
          console.warn('Order items insert note:', itemErr);
        }
      }

      return mapDbOrderToFrontend(orderRow);
    }

    return {
      id: orderNumber,
      orderNumber: orderNumber,
      customerName: params.customerName,
      phone: params.phone,
      items: params.itemsSummary,
      total: params.totalAmount,
      status: 'Received',
      paymentStatus: params.paymentStatus || 'unpaid',
      date: 'Just now',
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Updates fulfillment status, courier details, and records chronological tracking milestone.
   */
  async updateFulfillmentStatus(
    orderId: string, 
    status: string, 
    tracking?: { 
      shippingProvider?: string; 
      trackingNumber?: string; 
      trackingUrl?: string; 
      notes?: string;
      location?: string;
      deliveryStatus?: string;
      updatedBy?: string;
    }
  ): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        let dbStatus = status.toLowerCase().replace(/\s+/g, '_');
        if (dbStatus === 'in_production') dbStatus = 'processing';
        if (dbStatus === 'dispatched') dbStatus = 'shipped';

        const effectiveDeliveryStatus = tracking?.deliveryStatus || status;

        // 1. Try atomic update_order_fulfillment RPC (guarantees payment_status is never touched)
        try {
          const { data: rpcSuccess, error: rpcErr } = await (insforge.database as any).rpc('update_order_fulfillment', {
            p_identifier: orderId,
            p_status: status,
            p_delivery_status: effectiveDeliveryStatus,
            p_shipping_provider: tracking?.shippingProvider || null,
            p_tracking_number: tracking?.trackingNumber || null,
            p_tracking_url: tracking?.trackingUrl || null,
            p_notes: tracking?.notes || null,
            p_updated_by: tracking?.updatedBy || null
          });

          if (!rpcErr && rpcSuccess) {
            broadcastCatalogChange({ type: 'ORDER_UPDATED', orderId });
            return true;
          }
        } catch (rpcCallErr) {
          console.warn('RPC update_order_fulfillment error, trying fallback:', rpcCallErr);
        }

        // 2. Direct table update fallback
        const updatePayload: Record<string, any> = {
          order_status: dbStatus,
          delivery_status: effectiveDeliveryStatus,
          updated_at: new Date().toISOString()
        };

        if (tracking?.shippingProvider !== undefined) updatePayload.shipping_provider = tracking.shippingProvider;
        if (tracking?.trackingNumber !== undefined) updatePayload.tracking_number = tracking.trackingNumber;
        if (tracking?.trackingUrl !== undefined) updatePayload.tracking_url = tracking.trackingUrl;
        if (tracking?.notes !== undefined) updatePayload.delivery_notes = tracking.notes;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        let updateQuery = insforge.database.from('orders').update(updatePayload);
        if (isUuid) {
          updateQuery = updateQuery.eq('id', orderId);
        } else {
          updateQuery = updateQuery.eq('order_number', orderId);
        }

        const { error } = await updateQuery;
        if (error) {
          throw new Error(error.message || 'Failed to update order status');
        }

        // Map status to milestone title & message
        let title = 'Status Updated';
        let message = `Order fulfillment updated to ${status}.`;

        if (dbStatus === 'confirmed') {
          title = 'Order Confirmed';
          message = tracking?.notes || 'Order is officially confirmed and queued for production in the atelier.';
        } else if (dbStatus === 'processing') {
          title = 'Order Processing';
          message = tracking?.notes || 'Heavyweight silhouettes are being prepped and inspected at the atelier.';
        } else if (dbStatus === 'packed') {
          title = 'Packed & Ready';
          message = tracking?.notes || 'Order has been custom packed in signature TH3EE protective casing.';
        } else if (dbStatus === 'shipped') {
          title = 'Shipped / Dispatched';
          message = tracking?.shippingProvider 
            ? `Handed over to ${tracking.shippingProvider}. Tracking #${tracking.trackingNumber || 'assigned'}.` 
            : (tracking?.notes || 'Order has been dispatched from the atelier.');
        } else if (dbStatus === 'out_for_delivery') {
          title = 'Out for Delivery';
          message = tracking?.notes || 'Courier partner is en route for final delivery to your destination.';
        } else if (dbStatus === 'delivered') {
          title = 'Delivered';
          message = tracking?.notes || 'Package safely delivered. Enjoy your TH3EE atelier pieces.';
        } else if (dbStatus === 'cancelled') {
          title = 'Order Cancelled';
          message = tracking?.notes || 'Order has been cancelled.';
        }

        await this.recordTrackingEvent({
          orderId,
          status: dbStatus,
          title: title,
          message: message,
          carrier: tracking?.shippingProvider,
          trackingNumber: tracking?.trackingNumber,
          trackingUrl: tracking?.trackingUrl,
          location: tracking?.location,
          createdBy: tracking?.updatedBy || 'Atelier Administrator'
        });

        // Broadcast to all open tabs/screens
        broadcastCatalogChange({ type: 'ORDER_UPDATED', orderId });

        return true;
      } catch (err) {
        console.error('Failed to update order status in InsForge:', err);
        throw err;
      }
    }
    return true;
  },

  /**
   * Alias for updating order fulfillment status.
   */
  async updateOrderStatus(
    orderId: string, 
    status: string, 
    tracking?: { 
      shippingProvider?: string; 
      trackingNumber?: string; 
      trackingUrl?: string; 
      notes?: string;
      location?: string;
    }
  ): Promise<boolean> {
    return this.updateFulfillmentStatus(orderId, status, tracking);
  },

  /**
   * Assigns an order to a delivery partner.
   */
  async assignDeliveryPartner(orderId: string, partnerUserId: string, partnerName?: string): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        const { error } = await insforge.database
          .from('orders')
          .update({
            delivery_partner_id: partnerUserId,
            updated_at: new Date().toISOString()
          })
          .or(`id.eq.${orderId},order_number.eq.${orderId}`);

        if (error) throw error;

        await this.recordTrackingEvent({
          orderId: orderId,
          status: 'assigned_to_courier',
          title: 'Delivery Partner Assigned',
          message: partnerName ? `Assigned to delivery agent ${partnerName}.` : 'Assigned to delivery partner.'
        });

        return true;
      } catch (err) {
        console.error('Assign delivery partner error:', err);
        return false;
      }
    }
    return true;
  },

  /**
   * Records a failed delivery attempt with customer-visible explanation.
   */
  async recordDeliveryAttempt(orderId: string, reason: string, notes?: string): Promise<boolean> {
    if (isInsForgeConfigured()) {
      try {
        // Increment delivery_attempts
        const { data: order } = await insforge.database
          .from('orders')
          .select('id, delivery_attempts')
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)
          .maybeSingle();

        const newAttempts = ((order?.delivery_attempts || 0) as number) + 1;
        const realId = order?.id || orderId;

        await insforge.database
          .from('orders')
          .update({
            delivery_attempts: newAttempts,
            delivery_notes: notes || reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', realId);

        await this.recordTrackingEvent({
          orderId: realId,
          status: 'delivery_attempt_failed',
          title: `Delivery Attempt ${newAttempts} Failed`,
          message: `Attempt unfulfilled: ${reason}. A re-attempt will be scheduled.`
        });

        return true;
      } catch (err) {
        console.error('Record delivery attempt error:', err);
        return false;
      }
    }
    return true;
  },

  /**
   * Fetches orders assigned to a specific delivery partner.
   */
  async getDeliveryPartnerOrders(partnerUserId?: string): Promise<Order[]> {
    if (isInsForgeConfigured()) {
      try {
        let query = insforge.database
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (partnerUserId) {
          query = query.or(`delivery_partner_id.eq.${partnerUserId},delivery_partner_id.is.null`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(mapDbOrderToFrontend);
        }
      } catch (err) {
        console.warn('Delivery partner orders error:', err);
      }
    }
    return [];
  },

  /**
   * Fetches orders belonging to a specific customer.
   */
  async getCustomerOrders(customerId: string, customerEmail?: string): Promise<Order[]> {
    if (!customerId && !customerEmail) return [];
    if (isInsForgeConfigured()) {
      try {
        let query = insforge.database
          .from('orders')
          .select('*, order_items(*)');

        const cleanEmail = customerEmail ? customerEmail.trim().toLowerCase() : '';
        if (customerId && cleanEmail) {
          query = query.or(`customer_id.eq.${customerId},customer_email.eq.${cleanEmail}`);
        } else if (customerId) {
          query = query.eq('customer_id', customerId);
        } else if (cleanEmail) {
          query = query.eq('customer_email', cleanEmail);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          return data.map(mapDbOrderToFrontend);
        }
      } catch (err) {
        console.warn('Customer orders fetch note:', err);
      }
    }
    return [];
  }
};
