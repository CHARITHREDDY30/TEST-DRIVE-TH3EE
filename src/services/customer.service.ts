import { insforge, isInsForgeConfigured } from '../lib/insforge';
import { authService } from './auth.service';
import type { SavedAddress, AuthUser } from '../types/auth';
import type { Order } from '../types/store';
import { mapDbOrderToFrontend } from './orders.service';

const ADDRESSES_STORAGE_KEY_PREFIX = 'th3ee_customer_addresses_';

export const customerService = {
  /**
   * Ensures a valid, stable customer record exists in public.customers for an authenticated customer.
   * Resolves the primary key (customers.id) required by orders.customer_id foreign key constraint.
   * Returns null if user is unauthenticated.
   */
  async ensureCustomerRecord(
    user?: AuthUser | null,
    details?: { name?: string; phone?: string }
  ): Promise<string | null> {
    if (!user || !user.id) {
      return null;
    }

    if (!isInsForgeConfigured()) {
      return user.id;
    }

    const resolvedName = details?.name?.trim() || user.name?.trim() || 'Customer';
    const resolvedEmail = user.email?.trim().toLowerCase() || null;
    const resolvedPhone = details?.phone?.trim() || user.phone?.trim() || null;

    try {
      // 1. Try atomic, server-side SECURITY DEFINER RPC ensure_customer
      try {
        const { data: rpcId, error: rpcErr } = await (insforge.database as any).rpc('ensure_customer', {
          p_user_id: user.id,
          p_name: resolvedName,
          p_email: resolvedEmail,
          p_phone: resolvedPhone
        });

        if (!rpcErr && rpcId) {
          return rpcId;
        }
      } catch (rpcEx) {
        console.warn('RPC ensure_customer fallback note:', rpcEx);
      }

      // 2. Direct table fallback: check existing record by id or auth_user_id
      const { data: existing } = await insforge.database
        .from('customers')
        .select('id, auth_user_id, full_name, email, phone')
        .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle();

      if (existing && existing.id) {
        const cleanName = details?.name?.trim() || user.name?.trim();
        const cleanPhone = details?.phone?.trim() || user.phone?.trim();
        const needsUpdate =
          (cleanName && (!existing.full_name || existing.full_name === 'Customer')) ||
          (cleanPhone && !existing.phone);

        if (needsUpdate) {
          try {
            await insforge.database
              .from('customers')
              .update({
                ...(cleanName ? { full_name: cleanName } : {}),
                ...(cleanPhone ? { phone: cleanPhone } : {}),
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } catch (upErr) {
            console.warn('Customer gentle profile update note:', upErr);
          }
        }
        return existing.id;
      }

      // 3. Customer record does not exist yet; create one with id = user.id and auth_user_id = user.id
      const newCustomer = {
        id: user.id,
        auth_user_id: user.id,
        full_name: resolvedName,
        email: resolvedEmail,
        phone: resolvedPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await insforge.database
        .from('customers')
        .upsert([newCustomer], { onConflict: 'auth_user_id' })
        .select('id')
        .maybeSingle();

      if (!insertErr && inserted && inserted.id) {
        return inserted.id;
      }

      if (!insertErr) {
        return user.id;
      }

      // 4. Fallback query in case of concurrent insert
      const { data: retry } = await insforge.database
        .from('customers')
        .select('id')
        .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle();

      if (retry && retry.id) {
        return retry.id;
      }

      console.error('Failed to create or verify customer record:', insertErr);
      throw new Error('Unable to establish verified customer profile in database.');
    } catch (err: any) {
      console.error('ensureCustomerRecord failure:', err);
      throw err;
    }
  },

  /**
   * Retrieves saved addresses for an authenticated customer.
   * Prioritizes profile addresses from InsForge; provides session fallback.
   */
  async getSavedAddresses(user: AuthUser): Promise<SavedAddress[]> {
    if (!user || !user.id) return [];

    // 1. Try reading from user profile
    if (user.profile && Array.isArray(user.profile.addresses) && user.profile.addresses.length > 0) {
      return user.profile.addresses;
    }

    // 2. Fetch fresh profile from InsForge
    if (isInsForgeConfigured()) {
      try {
        const { data } = await insforge.auth.getProfile(user.id);
        const addrs = (data as any)?.profile?.addresses || (data as any)?.addresses;
        if (Array.isArray(addrs) && addrs.length > 0) {
          return addrs;
        }
      } catch (err) {
        console.warn('Customer addresses profile query note:', err);
      }
    }

    // 3. Fallback to customer-isolated local storage (keyed by customer ID)
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`${ADDRESSES_STORAGE_KEY_PREFIX}${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}

    return [];
  },

  /**
   * Saves or updates an address for the authenticated customer.
   */
  async saveAddress(
    user: AuthUser,
    addressData: Omit<SavedAddress, 'id'>,
    existingId?: string
  ): Promise<SavedAddress[]> {
    if (!user || !user.id) {
      throw new Error('Customer authentication required to save addresses.');
    }

    const currentAddresses = await this.getSavedAddresses(user);
    const id = existingId || `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // If marked default, unset other defaults
    const isDefault = Boolean(addressData.isDefault) || currentAddresses.length === 0;

    let updatedList: SavedAddress[];
    if (existingId) {
      updatedList = currentAddresses.map(addr => {
        if (addr.id === existingId) {
          return { ...addr, ...addressData, id: existingId, isDefault };
        }
        return isDefault ? { ...addr, isDefault: false } : addr;
      });
    } else {
      const newAddr: SavedAddress = { ...addressData, id, isDefault };
      const baseList = isDefault ? currentAddresses.map(a => ({ ...a, isDefault: false })) : currentAddresses;
      updatedList = [newAddr, ...baseList];
    }

    // Persist to InsForge user profile & customers
    if (isInsForgeConfigured()) {
      try {
        await authService.updateProfile({ addresses: updatedList });
        await insforge.database.from('customers').upsert([{
          id: user.id,
          auth_user_id: user.id,
          full_name: user.name || 'Customer',
          email: user.email || null,
          phone: user.phone || null,
          updated_at: new Date().toISOString()
        }], { onConflict: 'auth_user_id' });
      } catch (err) {
        console.warn('Failed to save addresses to backend profile:', err);
      }
    }

    // Cache locally under user key
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${ADDRESSES_STORAGE_KEY_PREFIX}${user.id}`, JSON.stringify(updatedList));
      }
    } catch {}

    return updatedList;
  },

  /**
   * Deletes a saved address for the customer.
   */
  async deleteAddress(user: AuthUser, addressId: string): Promise<SavedAddress[]> {
    if (!user || !user.id) {
      throw new Error('Authentication required.');
    }

    const currentAddresses = await this.getSavedAddresses(user);
    const filtered = currentAddresses.filter(a => a.id !== addressId);

    // If deleted address was default, set first remaining as default
    if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
      filtered[0].isDefault = true;
    }

    if (isInsForgeConfigured()) {
      try {
        await authService.updateProfile({ addresses: filtered });
        await insforge.database.from('customers').upsert([{
          id: user.id,
          auth_user_id: user.id,
          full_name: user.name || 'Customer',
          email: user.email || null,
          phone: user.phone || null,
          updated_at: new Date().toISOString()
        }], { onConflict: 'auth_user_id' });
      } catch (err) {
        console.warn('Failed to persist address deletion to backend:', err);
      }
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${ADDRESSES_STORAGE_KEY_PREFIX}${user.id}`, JSON.stringify(filtered));
      }
    } catch {}

    return filtered;
  },

  /**
   * Sets an existing address as the default delivery address.
   */
  async setDefaultAddress(user: AuthUser, addressId: string): Promise<SavedAddress[]> {
    if (!user || !user.id) throw new Error('Authentication required.');

    const currentAddresses = await this.getSavedAddresses(user);
    const updated = currentAddresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));

    if (isInsForgeConfigured()) {
      try {
        await authService.updateProfile({ addresses: updated });
        await insforge.database.from('customers').upsert([{
          id: user.id,
          auth_user_id: user.id,
          full_name: user.name || 'Customer',
          email: user.email || null,
          phone: user.phone || null,
          updated_at: new Date().toISOString()
        }], { onConflict: 'auth_user_id' });
      } catch (err) {
        console.warn('Failed to persist default address update:', err);
      }
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${ADDRESSES_STORAGE_KEY_PREFIX}${user.id}`, JSON.stringify(updated));
      }
    } catch {}

    return updated;
  },

  /**
   * Securely queries order history strictly belonging to the authenticated customer.
   * Filtering ensures customer A cannot view customer B's orders.
   */
  async getCustomerOrders(user: AuthUser): Promise<Order[]> {
    if (!user || !user.id) return [];

    if (isInsForgeConfigured()) {
      try {
        const email = user.email ? user.email.toLowerCase() : '';
        let query = insforge.database
          .from('orders')
          .select('*, order_items(*)');

        if (email) {
          // Filter strictly by customer_id or customer_email
          query = query.or(`customer_id.eq.${user.id},customer_email.eq.${email}`);
        } else {
          query = query.eq('customer_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapDbOrderToFrontend);
        }
        if (error) {
          console.warn('Customer orders fetch error (RLS may require migration):', error);
        }
      } catch (err) {
        console.warn('Customer orders fetch error:', err);
      }
    }

    return [];
  },

  /**
   * Updates customer profile details (name, phone, avatar_url) on the backend.
   */
  async updateCustomerProfile(
    user: AuthUser,
    updates: { name?: string; phone?: string; avatar_url?: string | null; profile?: Record<string, any> }
  ): Promise<{ user: AuthUser | null; error: Error | null }> {
    if (!user || !user.id) {
      return { user: null, error: new Error('Authentication required.') };
    }
    return authService.updateProfile(updates);
  }
};

export default customerService;
