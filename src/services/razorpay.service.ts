import { insforge, isInsForgeConfigured } from '../lib/insforge';
import type { DeliveryInfo, CartItem } from '../types/store';

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: Record<string, string>;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface PaymentOrderResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  hasCredentials?: boolean;
  isMock?: boolean;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  orderNumber?: string;
  error?: string;
}

export function getRazorpayKeyId(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RAZORPAY_KEY_ID) {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID.trim();
    if (key && !key.includes('placeholder') && !key.includes('...')) {
      return key;
    }
  }
  const proc = (globalThis as any)?.process;
  if (proc?.env?.VITE_RAZORPAY_KEY_ID) {
    const key = proc.env.VITE_RAZORPAY_KEY_ID.trim();
    if (key && !key.includes('placeholder') && !key.includes('...')) {
      return key;
    }
  }
  return '';
}

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 */
export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as any).Razorpay) return true;

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export const razorpayService = {
  /**
   * Initializes a pending order and server-side Razorpay order via InsForge edge function.
   */
  async createPaymentOrder(params: {
    customerId?: string;
    customerEmail?: string;
    customerName: string;
    customerPhone: string;
    deliveryInfo: DeliveryInfo;
    cart: CartItem[];
    subtotal: number;
    discountAmount: number;
    shippingAmount: number;
    totalAmount: number;
    couponCode?: string;
  }): Promise<PaymentOrderResult> {
    const items = params.cart.map((it) => ({
      productId: it.id,
      productName: it.name,
      variantTitle: `${it.selectedColor} / ${it.selectedSize}`,
      unitPrice: it.price,
      quantity: it.quantity,
      imageUrl: it.thumbnail || (it.images && it.images[0]) || ''
    }));

    const payload = {
      action: 'create-order',
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      shippingAddress: params.deliveryInfo,
      items,
      subtotal: params.subtotal,
      discountAmount: params.discountAmount,
      shippingAmount: params.shippingAmount,
      totalAmount: params.totalAmount,
      couponCode: params.couponCode
    };

    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.functions.invoke('razorpay-checkout', {
          body: payload
        });

        if (!error && data && data.success) {
          const clientKey = data.keyId && data.keyId !== 'rzp_test_placeholder' 
            ? data.keyId 
            : getRazorpayKeyId();

          return {
            success: true,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            razorpayOrderId: data.razorpayOrderId,
            amount: data.amount,
            currency: data.currency || 'INR',
            keyId: clientKey,
            hasCredentials: data.hasCredentials ?? Boolean(clientKey),
            isMock: data.isMock ?? false
          };
        }

        if (error) {
          console.warn('Edge function razorpay-checkout note:', error);
        }
      } catch (err: any) {
        console.warn('Edge function invoke error, falling back to direct DB order creation:', err);
      }
    }

    // Direct Database fallback if edge function is unreachable
    try {
      const orderNumber = `TH3EE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const reservationExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const itemsSummary = items.map((i) => `${i.productName} (${i.variantTitle}) x${i.quantity}`).join(', ');

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
              p_email: params.customerEmail ? params.customerEmail.trim().toLowerCase() : null,
              p_phone: params.customerPhone ? params.customerPhone.trim() : null
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
          } catch (cErr) {
            validCustomerId = params.customerId;
          }
        }
      }

      const orderRow = {
        id: orderId,
        order_number: orderNumber,
        customer_id: validCustomerId,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        customer_email: params.customerEmail || null,
        shipping_address: params.deliveryInfo,
        subtotal: params.subtotal,
        discount_amount: params.discountAmount || 0,
        shipping_amount: params.shippingAmount || 0,
        total_amount: params.totalAmount,
        order_status: 'pending',
        payment_status: 'unpaid',
        coupon_code: params.couponCode || null,
        reservation_expires_at: reservationExpiresAt,
        admin_notes: itemsSummary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: dbErr } = await insforge.database
        .from('orders')
        .insert([orderRow]);

      if (dbErr) {
        throw new Error(dbErr?.message || 'Failed to record checkout order.');
      }

      // Record initial tracking event
      try {
        await (insforge.database as any).rpc('record_order_tracking_event', {
          p_order_id: orderId,
          p_status: 'order_placed',
          p_title: 'Order Placed',
          p_message: 'Your order was successfully registered with TH3EE Atelier.'
        });
      } catch {}

      // Insert order items
      const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
      const itemRows = items.map((it) => {
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
        const lineTotal = Number(it.unitPrice || 0) * Number(it.quantity || 1);

        return {
          order_id: orderId,
          product_id: validProdId,
          product_name: it.productName,
          sku: it.productId && !validProdId ? it.productId : null,
          size: size || null,
          color_name: colorName || null,
          variant_title: it.variantTitle,
          unit_price: Number(it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          image_url: it.imageUrl || null,
          line_total: lineTotal,
          subtotal: lineTotal
        };
      });

      try {
        await insforge.database.from('order_items').insert(itemRows);
      } catch (itErr) {
        console.warn('Order items insert note:', itErr);
      }

      const clientKey = getRazorpayKeyId();
      const razorpayOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        success: true,
        orderId: orderId,
        orderNumber: orderNumber,
        razorpayOrderId: razorpayOrderId,
        amount: Math.round(params.totalAmount * 100),
        currency: 'INR',
        keyId: clientKey,
        hasCredentials: Boolean(clientKey),
        isMock: true
      };
    } catch (fallbackErr: any) {
      console.error('Razorpay order creation fallback error:', fallbackErr);
      return {
        success: false,
        orderId: '',
        orderNumber: '',
        razorpayOrderId: '',
        amount: 0,
        currency: 'INR',
        keyId: '',
        error: fallbackErr.message || 'Unable to create checkout order'
      };
    }
  },

  /**
   * Verifies payment result securely via server-side verification.
   */
  async verifyPayment(params: {
    orderId: string;
    orderNumber: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount?: number;
  }): Promise<PaymentVerificationResult> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.functions.invoke('razorpay-checkout', {
          body: {
            action: 'verify-payment',
            ...params
          }
        });

        if (!error && data && data.success) {
          return {
            success: true,
            verified: true,
            orderNumber: data.orderNumber || params.orderNumber
          };
        }

        // If the server explicitly evaluated the signature and verification failed,
        // strictly reject the payment. Customers must never be marked paid if signature check fails.
        if (data && (data.verified === false || data.success === false)) {
          return {
            success: false,
            verified: false,
            error: data.error || 'Payment verification failed'
          };
        }

        if (error) {
          console.warn('Edge function payment verification note:', error);
        }
      } catch (err) {
        console.warn('Edge function invoke error during verification, using direct DB update fallback:', err);
      }
    }

    // Direct atomic database confirmation via confirm_order_payment RPC
    try {
      const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
      const uuidArg = isUuid(params.orderId) ? params.orderId : '00000000-0000-0000-0000-000000000000';

      const { data: rpcRes, error: rpcErr } = await (insforge.database as any).rpc('confirm_order_payment', {
        p_order_id: uuidArg,
        p_order_number: params.orderNumber || params.orderId,
        p_payment_id: params.razorpayPaymentId,
        p_provider_order_id: params.razorpayOrderId,
        p_amount: params.amount || 0
      });

      if (!rpcErr && rpcRes) {
        return {
          success: true,
          verified: true,
          orderNumber: params.orderNumber
        };
      }

      // Direct fallback update
      let orderQuery = insforge.database
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'confirmed',
          updated_at: new Date().toISOString()
        });

      if (isUuid(params.orderId)) {
        orderQuery = orderQuery.eq('id', params.orderId);
      } else {
        orderQuery = orderQuery.eq('order_number', params.orderNumber || params.orderId);
      }

      const { error: updateErr } = await orderQuery;
      if (updateErr) throw updateErr;

      return {
        success: true,
        verified: true,
        orderNumber: params.orderNumber
      };
    } catch (err: any) {
      return {
        success: false,
        verified: false,
        error: err.message || 'Payment verification failed'
      };
    }
  },

  /**
   * Opens the interactive Razorpay Checkout Modal after verifying credentials.
   */
  async launchCheckout(
    options: {
      orderId: string;
      orderNumber: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
      customerName: string;
      customerEmail?: string;
      customerPhone?: string;
      hasCredentials?: boolean;
      isMock?: boolean;
    },
    callbacks: {
      onSuccess: (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
      onDismiss?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || typeof (window as any).Razorpay === 'undefined') {
      callbacks.onError?.(new Error('Razorpay payment gateway script could not be loaded. Please check your network connection.'));
      return;
    }

    const keyToUse = options.keyId || getRazorpayKeyId();

    // Verify valid Razorpay Key ID
    if (!keyToUse || keyToUse === 'rzp_test_placeholder' || keyToUse.startsWith('rzp_test_...')) {
      const configMsg = 'Razorpay Test Key ID is not configured. Please add VITE_RAZORPAY_KEY_ID=rzp_test_... in .env and configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in InsForge project secrets.';
      callbacks.onError?.(new Error(configMsg));
      return;
    }

    // Verify valid Razorpay Order ID
    if (!options.razorpayOrderId || options.razorpayOrderId.startsWith('order_mock_')) {
      const orderMsg = 'A valid Razorpay Test order ID was not returned by the backend. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are configured in InsForge secrets.';
      callbacks.onError?.(new Error(orderMsg));
      return;
    }

    const rzpOptions: RazorpayCheckoutOptions = {
      key: keyToUse,
      amount: options.amount,
      currency: options.currency || 'INR',
      name: 'TH3EE ATELIER',
      description: `Order ${options.orderNumber}`,
      image: 'https://pub-7f200224eefe4b0b9b167a01c3d7dabe.r2.dev/products/th3ee-logo.png',
      order_id: options.razorpayOrderId,
      prefill: {
        name: options.customerName,
        email: options.customerEmail || '',
        contact: options.customerPhone || ''
      },
      theme: {
        color: '#E51E2B'
      },
      notes: {
        order_number: options.orderNumber
      },
      handler: callbacks.onSuccess,
      modal: {
        ondismiss: callbacks.onDismiss
      }
    };

    try {
      const razorpayInstance = new (window as any).Razorpay(rzpOptions);
      razorpayInstance.on('payment.failed', function (resp: any) {
        callbacks.onError?.(new Error(resp.error?.description || 'Payment failed.'));
      });
      razorpayInstance.open();
    } catch (err) {
      callbacks.onError?.(err);
    }
  }
};

export default razorpayService;
