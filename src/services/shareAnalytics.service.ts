/**
 * Safe, privacy-preserving sharing analytics service.
 * Records only non-sensitive event metrics (channel, product ID/slug, timestamp).
 * Never records customer messages, contact lists, credentials, or tokens.
 */

export type ShareChannel = 
  | 'whatsapp' 
  | 'facebook' 
  | 'telegram' 
  | 'x' 
  | 'instagram' 
  | 'copy_link' 
  | 'native' 
  | 'native_sheet'
  | 'email';

export interface ShareAnalyticsEvent {
  eventName: 
    | 'product_share_clicked' 
    | 'product_share_completed' 
    | 'product_link_copied' 
    | 'collection_shared'
    | 'wishlist_shared';
  itemId?: string;
  itemType?: 'product' | 'collection' | 'universe' | 'wishlist';
  channel?: ShareChannel;
  timestamp: string;
}

const STORAGE_KEY = 'th3ee_share_analytics_log';
const MAX_LOCAL_EVENTS = 50;

class ShareAnalyticsService {
  private events: ShareAnalyticsEvent[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch {
      this.events = [];
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      if (this.events.length > MAX_LOCAL_EVENTS) {
        this.events = this.events.slice(-MAX_LOCAL_EVENTS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch {}
  }

  /**
   * Tracks a safe sharing event without collecting personal information.
   */
  track(
    eventName: ShareAnalyticsEvent['eventName'],
    details?: {
      itemId?: string;
      itemType?: ShareAnalyticsEvent['itemType'];
      channel?: ShareChannel;
    }
  ): void {
    const event: ShareAnalyticsEvent = {
      eventName,
      itemId: details?.itemId,
      itemType: details?.itemType || 'product',
      channel: details?.channel,
      timestamp: new Date().toISOString()
    };

    this.events.push(event);
    this.saveToStorage();

    // Dev logging for verification
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log(`[TH3EE Share Analytics] ${eventName}:`, {
        itemType: event.itemType,
        itemId: event.itemId,
        channel: event.channel
      });
    }
  }

  trackShareClicked(params: { productId?: string; productSlug?: string; productName?: string; channel?: ShareChannel }): void {
    this.track('product_share_clicked', {
      itemId: params.productSlug || params.productId,
      itemType: 'product',
      channel: params.channel
    });
  }

  trackShareCompleted(params: { productId?: string; productSlug?: string; productName?: string; channel?: ShareChannel; itemType?: ShareAnalyticsEvent['itemType'] }): void {
    this.track('product_share_completed', {
      itemId: params.productSlug || params.productId,
      itemType: params.itemType || 'product',
      channel: params.channel
    });
  }

  trackLinkCopied(params: { productId?: string; productSlug?: string; productName?: string }): void {
    this.track('product_link_copied', {
      itemId: params.productSlug || params.productId,
      itemType: 'product',
      channel: 'copy_link'
    });
  }

  trackCollectionShared(params: { collectionName?: string; channel?: ShareChannel }): void {
    this.track('collection_shared', {
      itemId: params.collectionName,
      itemType: 'collection',
      channel: params.channel
    });
  }

  trackWishlistShared(params: { channel?: ShareChannel }): void {
    this.track('wishlist_shared', {
      itemType: 'wishlist',
      channel: params.channel
    });
  }

  getRecentEvents(): ShareAnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }
}

export const shareAnalytics = new ShareAnalyticsService();
