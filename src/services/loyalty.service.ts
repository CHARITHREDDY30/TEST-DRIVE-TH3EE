import { insforge, isInsForgeConfigured } from '../lib/insforge';

export interface LoyaltyStamp {
  id: string;
  orderId: string;
  orderNumber: string;
  orderAmount: number;
  earnedAt: string;
  expiresAt: string;
  status: 'active' | 'consumed' | 'expired' | 'reversed';
  celebrationAcknowledged: boolean;
  notes?: string;
}

export interface LoyaltyRewardClaim {
  id: string;
  claimCode: string;
  rewardTitle: string;
  rewardType: string;
  selectedProductName?: string;
  selectedSize?: string;
  selectedColor?: string;
  status: 'claimed' | 'processing' | 'fulfilled' | 'cancelled';
  claimedAt: string;
  fulfilledAt?: string;
  adminNotes?: string;
}

export interface CustomerLoyaltySummary {
  configured: boolean;
  authenticated: boolean;
  customerId?: string;
  activeStampsCount: number;
  stampsNeededForReward: number;
  canClaimReward: boolean;
  unlockedRewardsCount: number;
  activeStamps: LoyaltyStamp[];
  newStampCelebration?: {
    stampId: string;
    orderNumber: string;
    earnedAt: string;
  } | null;
  rewardClaims: LoyaltyRewardClaim[];
}

export interface LoyaltySettings {
  enabled: boolean;
  stampsPerReward: number;
  rewardTitle: string;
  rewardType: string;
  validityMonths: number;
  minOrderAmount: number;
  eligibleProductId?: string;
}

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  stampsPerReward: 7,
  rewardTitle: 'Free TH3EE Cult T-Shirt',
  rewardType: 'free_tshirt',
  validityMonths: 12,
  minOrderAmount: 0
};

export const loyaltyService = {
  /**
   * Fetches customer's authoritative loyalty status directly from PostgreSQL ledger.
   */
  async getCustomerLoyaltySummary(customerId?: string | null, customerEmail?: string | null): Promise<CustomerLoyaltySummary> {
    if (!isInsForgeConfigured() || (!customerId && !customerEmail)) {
      return {
        configured: isInsForgeConfigured(),
        authenticated: Boolean(customerId || customerEmail),
        activeStampsCount: 0,
        stampsNeededForReward: 7,
        canClaimReward: false,
        unlockedRewardsCount: 0,
        activeStamps: [],
        newStampCelebration: null,
        rewardClaims: []
      };
    }

    try {
      const { data, error } = await (insforge.database as any).rpc('get_customer_loyalty_summary', {
        p_customer_id: customerId || null,
        p_customer_email: customerEmail ? customerEmail.trim().toLowerCase() : null
      });

      if (!error && data) {
        return {
          configured: true,
          authenticated: Boolean(data.authenticated),
          customerId: data.customer_id,
          activeStampsCount: Number(data.active_stamps_count || 0),
          stampsNeededForReward: Number(data.stamps_needed_for_reward || 7),
          canClaimReward: Boolean(data.can_claim_reward),
          unlockedRewardsCount: Number(data.unlocked_rewards_count || 0),
          activeStamps: Array.isArray(data.active_stamps) ? data.active_stamps.map((s: any) => ({
            id: s.id,
            orderId: s.order_id,
            orderNumber: s.order_number,
            orderAmount: Number(s.order_amount || 0),
            earnedAt: s.earned_at,
            expiresAt: s.expires_at,
            status: s.status,
            celebrationAcknowledged: Boolean(s.celebration_acknowledged)
          })) : [],
          newStampCelebration: data.new_stamp_celebration ? {
            stampId: data.new_stamp_celebration.stamp_id,
            orderNumber: data.new_stamp_celebration.order_number,
            earnedAt: data.new_stamp_celebration.earned_at
          } : null,
          rewardClaims: Array.isArray(data.reward_claims) ? data.reward_claims.map((c: any) => ({
            id: c.id,
            claimCode: c.claim_code,
            rewardTitle: c.reward_title,
            rewardType: c.reward_type,
            selectedProductName: c.selected_product_name,
            selectedSize: c.selected_size,
            selectedColor: c.selected_color,
            status: c.status,
            claimedAt: c.claimed_at,
            fulfilledAt: c.fulfilled_at,
            adminNotes: c.admin_notes
          })) : []
        };
      }
    } catch (err) {
      console.warn('Loyalty summary fetch note:', err);
    }

    return {
      configured: true,
      authenticated: true,
      activeStampsCount: 0,
      stampsNeededForReward: 7,
      canClaimReward: false,
      unlockedRewardsCount: 0,
      activeStamps: [],
      newStampCelebration: null,
      rewardClaims: []
    };
  },

  /**
   * Acknowledges newly celebrated stamp in database to prevent replaying on refresh.
   */
  async acknowledgeStampCelebration(stampId: string): Promise<boolean> {
    if (!isInsForgeConfigured()) return true;
    try {
      await (insforge.database as any).rpc('acknowledge_stamp_celebration', {
        p_stamp_id: stampId
      });
      return true;
    } catch (err) {
      console.warn('Stamp celebration ack note:', err);
      return false;
    }
  },

  /**
   * Concurrency-safe atomic reward claiming.
   */
  async claimLoyaltyReward(payload: {
    customerId: string;
    customerEmail: string;
    productId?: string;
    variantId?: string;
    size?: string;
    color?: string;
    shippingAddress?: any;
  }): Promise<{ success: boolean; claimCode?: string; error?: string }> {
    if (!isInsForgeConfigured()) {
      return { success: false, error: 'Backend is not configured' };
    }

    try {
      const { data, error } = await (insforge.database as any).rpc('claim_loyalty_reward', {
        p_customer_id: payload.customerId,
        p_customer_email: payload.customerEmail.trim().toLowerCase(),
        p_product_id: payload.productId || null,
        p_variant_id: payload.variantId || null,
        p_size: payload.size || 'L',
        p_color: payload.color || 'Standard',
        p_shipping_address: payload.shippingAddress || {}
      });

      if (error) {
        return { success: false, error: error.message || 'Failed to claim reward' };
      }

      if (data && data.success) {
        return { success: true, claimCode: data.claim_code };
      }

      return { success: false, error: data?.error || 'Unable to claim reward' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Server error claiming reward' };
    }
  },

  /**
   * Fetches full loyalty ledger for admin dashboard.
   */
  async adminGetFullLoyaltyLedger(): Promise<{
    stamps: any[];
    claims: any[];
    auditLogs: any[];
  }> {
    if (!isInsForgeConfigured()) {
      return { stamps: [], claims: [], auditLogs: [] };
    }

    try {
      const [stampsRes, claimsRes, auditRes] = await Promise.all([
        insforge.database
          .from('loyalty_stamps')
          .select('*, customers(full_name, email)')
          .order('earned_at', { ascending: false })
          .limit(100),
        insforge.database
          .from('loyalty_reward_claims')
          .select('*, customers(full_name, email)')
          .order('claimed_at', { ascending: false })
          .limit(100),
        insforge.database
          .from('loyalty_audit_logs')
          .select('*, customers(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      return {
        stamps: Array.isArray(stampsRes.data) ? stampsRes.data : [],
        claims: Array.isArray(claimsRes.data) ? claimsRes.data : [],
        auditLogs: Array.isArray(auditRes.data) ? auditRes.data : []
      };
    } catch (err) {
      console.warn('Admin loyalty ledger fetch error:', err);
      return { stamps: [], claims: [], auditLogs: [] };
    }
  },

  /**
   * Authorized manual adjustments with mandatory reason and audit log.
   */
  async adminAdjustStamps(
    customerId: string,
    delta: number,
    reason: string,
    adminEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isInsForgeConfigured()) {
      return { success: false, error: 'Backend is not configured' };
    }

    try {
      const { data, error } = await (insforge.database as any).rpc('admin_adjust_loyalty_stamps', {
        p_customer_id: customerId,
        p_delta_stamps: delta,
        p_reason: reason.trim(),
        p_admin_email: adminEmail.trim()
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        return { success: true };
      }

      return { success: false, error: data?.error || 'Adjustment rejected' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Server error' };
    }
  },

  /**
   * Fetches store loyalty settings.
   */
  async getLoyaltySettings(): Promise<LoyaltySettings> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'loyalty_settings')
          .maybeSingle();

        if (!error && data && data.setting_value) {
          return Object.assign({}, DEFAULT_LOYALTY_SETTINGS, data.setting_value);
        }
      } catch (err) {
        console.warn('Loyalty settings fetch notice:', err);
      }
    }
    return DEFAULT_LOYALTY_SETTINGS;
  },

  /**
   * Updates store loyalty settings (Admin only).
   */
  async updateLoyaltySettings(settings: Partial<LoyaltySettings>): Promise<LoyaltySettings> {
    const updated = Object.assign({}, DEFAULT_LOYALTY_SETTINGS, settings);
    if (isInsForgeConfigured()) {
      try {
        await insforge.database
          .from('store_settings')
          .upsert([
            {
              setting_key: 'loyalty_settings',
              setting_value: updated,
              is_public: true,
              updated_at: new Date().toISOString()
            }
          ], { onConflict: 'setting_key' });
      } catch (err) {
        console.warn('Loyalty settings save notice:', err);
      }
    }
    return updated;
  },

  /**
   * Updates reward claim status and optional admin note.
   */
  async adminUpdateClaimStatus(
    claimId: string,
    status: 'claimed' | 'processing' | 'fulfilled' | 'cancelled',
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isInsForgeConfigured()) return { success: false, error: 'Not configured' };
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      if (status === 'fulfilled') {
        updateData.fulfilled_at = new Date().toISOString();
      }
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }
      const { error } = await insforge.database
        .from('loyalty_reward_claims')
        .update(updateData)
        .eq('id', claimId);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Server error' };
    }
  },

  /**
   * Lists customer records for admin loyalty selector.
   */
  async adminGetAllCustomers(): Promise<Array<{ id: string; email: string; full_name: string }>> {
    if (!isInsForgeConfigured()) return [];
    try {
      const { data, error } = await insforge.database
        .from('customers')
        .select('id, email, full_name')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {
      // ignore
    }
    return [];
  }
};
