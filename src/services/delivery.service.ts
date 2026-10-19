import type { DeliverySettings, DeliveryPricingRule, DeliveryInfo } from '../types/store';
import { insforge, isInsForgeConfigured } from '../lib/insforge';

const LOCAL_STORAGE_DELIVERY_KEY = 'th3ee_delivery_settings';

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  defaultFee: 49, // Changed default from ₹149 to ₹49
  distanceUnit: 'km',
  distancePricingEnabled: false, // Can be toggled on/off by administrator
  freeDeliveryThreshold: 1999, // Orders >= ₹1999 qualify for Free Delivery
  maxServiceableDistanceKm: 30, // Default serviceable radius
  allowManualOverrides: true,
  pricingRules: [
    {
      id: 'rule-local-0-5',
      name: 'Local / Hyperlocal Band',
      minDistanceKm: 0,
      maxDistanceKm: 5,
      fee: 49,
      isEnabled: true
    },
    {
      id: 'rule-mid-5-10',
      name: 'Mid Distance Band',
      minDistanceKm: 5.01,
      maxDistanceKm: 10,
      fee: 69,
      isEnabled: true
    },
    {
      id: 'rule-extended-10-15',
      name: 'Extended Metro Band',
      minDistanceKm: 10.01,
      maxDistanceKm: 15,
      fee: 99,
      isEnabled: true
    },
    {
      id: 'rule-outer-15-30',
      name: 'Outer Zone Band',
      minDistanceKm: 15.01,
      maxDistanceKm: 30,
      fee: 149,
      isEnabled: true
    }
  ],
  serviceableZones: [
    'Bangalore Urban',
    'Bangalore Rural',
    'Hyderabad',
    'Mumbai',
    'Delhi NCR',
    'Chennai',
    'All India Express Courier'
  ]
};

export interface DeliveryCalculationResult {
  fee: number;
  isFree: boolean;
  serviceable: boolean;
  appliedRuleName: string;
  reason: string;
  distanceKm?: number;
  snapshot: {
    appliedFee: number;
    ruleId?: string;
    calculatedAt: string;
    distancePricingEnabled: boolean;
  };
}

function getLocalSettings(): DeliverySettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELIVERY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.defaultFee === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read local delivery settings:', e);
  }
  return null;
}

function setLocalSettings(settings: DeliverySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_DELIVERY_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save local delivery settings:', e);
  }
}

export const deliveryService = {
  async getDeliverySettings(): Promise<DeliverySettings> {
    if (isInsForgeConfigured()) {
      try {
        const { data, error } = await insforge.database
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'delivery_settings')
          .maybeSingle();

        if (!error && data && data.setting_value) {
          const val: DeliverySettings = data.setting_value;
          setLocalSettings(val);
          return val;
        }
      } catch (err) {
        console.warn('InsForge delivery_settings query notice:', err);
      }
    }

    const local = getLocalSettings();
    if (local) return local;

    return DEFAULT_DELIVERY_SETTINGS;
  },

  async saveDeliverySettings(settings: DeliverySettings): Promise<DeliverySettings> {
    if (!settings || typeof settings.defaultFee !== 'number') {
      throw new Error('Invalid delivery settings configuration');
    }

    setLocalSettings(settings);

    if (isInsForgeConfigured()) {
      try {
        const { error } = await insforge.database
          .from('store_settings')
          .upsert([{
            setting_key: 'delivery_settings',
            setting_value: settings,
            is_public: true,
            updated_at: new Date().toISOString()
          }], { onConflict: 'setting_key' });

        if (error) {
          console.warn('Failed to persist delivery settings to store_settings:', error.message);
        }
      } catch (err) {
        console.error('Failed to save delivery settings in InsForge:', err);
      }
    }

    return settings;
  },

  /**
   * Deterministic, server-safe delivery fee calculation.
   * Ensures checkout, WhatsApp message, and order records always match.
   */
  calculateFee(
    subtotal: number,
    settings: DeliverySettings = DEFAULT_DELIVERY_SETTINGS,
    distanceKm?: number,
    _address?: Partial<DeliveryInfo>,
    manualFeeOverride?: number
  ): DeliveryCalculationResult {
    const timestamp = new Date().toISOString();

    // 0. Manual fee override (if enabled in settings and provided)
    if (settings.allowManualOverrides && typeof manualFeeOverride === 'number' && manualFeeOverride >= 0) {
      return {
        fee: manualFeeOverride,
        isFree: manualFeeOverride === 0,
        serviceable: true,
        appliedRuleName: 'Manual Admin Override',
        reason: `Manually overridden fee of ₹${manualFeeOverride}`,
        distanceKm,
        snapshot: {
          appliedFee: manualFeeOverride,
          ruleId: 'manual-override',
          calculatedAt: timestamp,
          distancePricingEnabled: Boolean(settings.distancePricingEnabled)
        }
      };
    }

    // 1. Free delivery threshold check
    if (settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold) {
      return {
        fee: 0,
        isFree: true,
        serviceable: true,
        appliedRuleName: 'Free Delivery Threshold',
        reason: `Order subtotal exceeds ₹${settings.freeDeliveryThreshold} threshold`,
        distanceKm,
        snapshot: {
          appliedFee: 0,
          ruleId: 'free-threshold',
          calculatedAt: timestamp,
          distancePricingEnabled: settings.distancePricingEnabled
        }
      };
    }

    // 2. If distance-based pricing is enabled
    if (settings.distancePricingEnabled && typeof distanceKm === 'number' && !isNaN(distanceKm)) {
      // Check maximum serviceable distance
      if (settings.maxServiceableDistanceKm > 0 && distanceKm > settings.maxServiceableDistanceKm) {
        return {
          fee: settings.defaultFee,
          isFree: false,
          serviceable: false,
          appliedRuleName: 'Out of Serviceable Area',
          reason: `Delivery distance (${distanceKm.toFixed(1)} km) exceeds the maximum serviceable distance of ${settings.maxServiceableDistanceKm} km. Please contact support@th3ee.in or WhatsApp for custom regional courier arrangement.`,
          distanceKm,
          snapshot: {
            appliedFee: settings.defaultFee,
            ruleId: 'unserviceable-distance',
            calculatedAt: timestamp,
            distancePricingEnabled: true
          }
        };
      }

      // Match distance band pricing rule
      const activeRules = (settings.pricingRules || []).filter(r => r.isEnabled);
      const matched = activeRules.find(r => distanceKm >= r.minDistanceKm && distanceKm <= r.maxDistanceKm);

      if (matched) {
        return {
          fee: matched.fee,
          isFree: matched.fee === 0,
          serviceable: true,
          appliedRuleName: matched.name,
          reason: `Matched distance band (${matched.minDistanceKm}–${matched.maxDistanceKm} ${settings.distanceUnit})`,
          distanceKm,
          snapshot: {
            appliedFee: matched.fee,
            ruleId: matched.id,
            calculatedAt: timestamp,
            distancePricingEnabled: true
          }
        };
      }
    }

    // 3. Standard default fee (₹49 default)
    const baseFee = typeof settings.defaultFee === 'number' ? settings.defaultFee : 49;
    return {
      fee: baseFee,
      isFree: baseFee === 0,
      serviceable: true,
      appliedRuleName: 'Standard Flat Delivery',
      reason: `Standard delivery fee of ₹${baseFee} applies.`,
      distanceKm,
      snapshot: {
        appliedFee: baseFee,
        ruleId: 'default-fee',
        calculatedAt: timestamp,
        distancePricingEnabled: Boolean(settings.distancePricingEnabled)
      }
    };
  }
};

export type DeliveryFeeOptions = {
  subtotal: number;
  settings?: DeliverySettings;
  distanceKm?: number;
  address?: Partial<DeliveryInfo>;
  manualFeeOverride?: number;
};

export function calculateDeliveryFee(options: DeliveryFeeOptions): DeliveryCalculationResult;
export function calculateDeliveryFee(
  subtotal: number,
  settings?: DeliverySettings,
  distanceKm?: number,
  address?: Partial<DeliveryInfo>,
  manualFeeOverride?: number
): DeliveryCalculationResult;
export function calculateDeliveryFee(
  arg1: number | DeliveryFeeOptions,
  settings: DeliverySettings = DEFAULT_DELIVERY_SETTINGS,
  distanceKm?: number,
  address?: Partial<DeliveryInfo>,
  manualFeeOverride?: number
): DeliveryCalculationResult {
  if (typeof arg1 === 'object') {
    return deliveryService.calculateFee(
      arg1.subtotal,
      arg1.settings || DEFAULT_DELIVERY_SETTINGS,
      arg1.distanceKm,
      arg1.address,
      arg1.manualFeeOverride
    );
  }
  return deliveryService.calculateFee(arg1, settings, distanceKm, address, manualFeeOverride);
}

export const saveDeliverySettings = (settings: DeliverySettings) => deliveryService.saveDeliverySettings(settings);
export const loadDeliverySettings = () => deliveryService.getDeliverySettings();
