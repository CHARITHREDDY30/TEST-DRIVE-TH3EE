import { insforge, isInsForgeConfigured } from '../lib/insforge';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  canStack: boolean;
  createdAt?: string;
}

export function mapDbCouponToFrontend(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description || '',
    discountType: row.discount_type || 'percentage',
    discountValue: Number(row.discount_value ?? 0),
    minimumOrderAmount: Number(row.minimum_order_amount ?? 0),
    maximumDiscount: row.maximum_discount ? Number(row.maximum_discount) : undefined,
    usageLimit: row.usage_limit ? Number(row.usage_limit) : undefined,
    usageCount: Number(row.usage_count ?? 0),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isActive: Boolean(row.is_active),
    canStack: Boolean(row.can_stack),
    createdAt: row.created_at
  };
}

export const couponsService = {
  async getCoupons(): Promise<Coupon[]> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapDbCouponToFrontend);
        }
      } catch (err) {
        console.warn('InsForge coupons fetch warning:', err);
      }
    }
    return [];
  },

  async validateCoupon(
    code: string, 
    subtotal: number, 
    customerId?: string | null, 
    customerEmail?: string | null
  ): Promise<{ valid: boolean; discount: number; message: string; coupon?: Coupon; alreadyRedeemed?: boolean }> {
    if (!code || !code.trim()) {
      return { valid: false, discount: 0, message: 'Please enter a coupon code' };
    }

    const cleanCode = code.trim().toUpperCase();

    if (isInsForgeConfigured()) {
      try {
        // 1. First attempt secure RPC check enforcing 1 successful redemption per account
        const { data: rpcData, error: rpcErr } = await (insforge.database as any).rpc('validate_coupon_for_customer', {
          p_coupon_code: cleanCode,
          p_subtotal: subtotal,
          p_customer_id: customerId || null,
          p_customer_email: customerEmail ? customerEmail.trim().toLowerCase() : null
        });

        if (!rpcErr && rpcData) {
          if (!rpcData.valid) {
            return {
              valid: false,
              discount: 0,
              message: rpcData.already_redeemed 
                ? "You've already used this coupon on your account." 
                : (rpcData.error || 'Invalid or inactive promotional code.'),
              alreadyRedeemed: Boolean(rpcData.already_redeemed)
            };
          }

          return {
            valid: true,
            discount: Number(rpcData.discount_amount || 0),
            message: `Coupon ${cleanCode} applied! Saved ₹${rpcData.discount_amount}`,
            coupon: {
              id: rpcData.coupon_id,
              code: cleanCode,
              description: rpcData.description,
              discountType: rpcData.discount_type,
              discountValue: Number(rpcData.discount_value || 0),
              minimumOrderAmount: 0,
              usageCount: 0,
              isActive: true,
              canStack: false
            }
          };
        }

        // 2. Direct table fallback
        const { data, error } = await insforge.database
          .from('coupons')
          .select('*')
          .eq('code', cleanCode)
          .maybeSingle();

        if (error || !data) {
          return { valid: false, discount: 0, message: 'Invalid coupon code' };
        }

        const coupon = mapDbCouponToFrontend(data);

        if (!coupon.isActive) {
          return { valid: false, discount: 0, message: 'This coupon is no longer active' };
        }

        // Check if customer already has a completed redemption record
        if (customerId || customerEmail) {
          let redQuery = insforge.database
            .from('coupon_redemptions')
            .select('id')
            .eq('coupon_id', coupon.id)
            .eq('status', 'completed');

          if (customerId && customerEmail) {
            redQuery = redQuery.or(`customer_id.eq.${customerId},customer_email.eq.${customerEmail.trim().toLowerCase()}`);
          } else if (customerId) {
            redQuery = redQuery.eq('customer_id', customerId);
          } else if (customerEmail) {
            redQuery = redQuery.eq('customer_email', customerEmail.trim().toLowerCase());
          }

          const { data: existingRedemption } = await redQuery.maybeSingle();
          if (existingRedemption) {
            return {
              valid: false,
              discount: 0,
              message: "You've already used this coupon on your account.",
              alreadyRedeemed: true
            };
          }
        }

        if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
          return { valid: false, discount: 0, message: 'This coupon is not yet valid' };
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return { valid: false, discount: 0, message: 'This coupon has expired' };
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          return { valid: false, discount: 0, message: 'This coupon has reached its maximum usage limit' };
        }

        if (subtotal < coupon.minimumOrderAmount) {
          return { valid: false, discount: 0, message: `Minimum cart value of ₹${coupon.minimumOrderAmount} required for this coupon` };
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }

        return {
          valid: true,
          discount,
          message: `Coupon ${coupon.code} applied! Saved ₹${discount}`,
          coupon
        };
      } catch (err) {
        console.warn('Coupon validation error:', err);
      }
    }

    return { valid: false, discount: 0, message: 'Could not validate coupon at this time' };
  },

  /**
   * Fetches full redemption history for administrative oversight.
   */
  async getCouponRedemptions(couponId?: string): Promise<any[]> {
    if (isInsForgeConfigured()) {
      try {
        let query = insforge.database
          .from('coupon_redemptions')
          .select('*')
          .order('redeemed_at', { ascending: false });

        if (couponId) {
          query = query.eq('coupon_id', couponId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        console.warn('Coupon redemptions fetch error:', err);
      }
    }
    return [];
  },

  async saveCoupon(coupon: Partial<Coupon>): Promise<Coupon> {
    if (!isInsForgeConfigured()) throw new Error('InsForge is not configured');

    const dbPayload = {
      code: (coupon.code || '').trim().toUpperCase(),
      description: coupon.description || null,
      discount_type: coupon.discountType || 'percentage',
      discount_value: coupon.discountValue || 0,
      minimum_order_amount: coupon.minimumOrderAmount || 0,
      maximum_discount: coupon.maximumDiscount || null,
      usage_limit: coupon.usageLimit || null,
      is_active: coupon.isActive !== undefined ? coupon.isActive : true,
      can_stack: Boolean(coupon.canStack),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await insforge.database
      .from('coupons')
      .upsert([dbPayload], { onConflict: 'code' })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to save coupon');
    }

    return mapDbCouponToFrontend(data);
  },

  async deleteCoupon(couponId: string): Promise<boolean> {
    if (!isInsForgeConfigured()) return true;

    const { error } = await insforge.database
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) throw new Error(error.message);
    return true;
  }
};
