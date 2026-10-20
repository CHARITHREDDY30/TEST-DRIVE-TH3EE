/**
 * Real-time Cross-Screen & Cross-Tab Catalog Synchronization Service.
 * Ensures that product catalog changes (stock toggles, price updates, new products, deletions)
 * apply immediately across all open tabs, windows, devices, and screens.
 */

export interface CatalogSyncEvent {
  type: 'CATALOG_UPDATED' | 'STOCK_STATUS_CHANGED' | 'PRODUCT_SAVED' | 'PRODUCT_DELETED' | 'INVENTORY_STEP' | 'ORDER_PLACED' | 'ORDER_UPDATED';
  productId?: string;
  orderId?: string;
  inStock?: boolean;
  timestamp: number;
}

const CHANNEL_NAME = 'th3ee_catalog_channel';
const STORAGE_KEY = 'th3ee_catalog_sync_timestamp';
const DOM_EVENT_NAME = 'th3ee:catalog-sync';

let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('BroadcastChannel initialization note:', err);
  }
}

/**
 * Broadcasts a catalog mutation to all open screens, tabs, and windows.
 */
export function broadcastCatalogChange(event?: Partial<CatalogSyncEvent>): void {
  const payload: CatalogSyncEvent = {
    type: event?.type || 'CATALOG_UPDATED',
    productId: event?.productId,
    inStock: event?.inStock,
    timestamp: Date.now()
  };

  // 1. Post to BroadcastChannel (instant <1ms cross-tab delivery)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (err) {
      console.warn('BroadcastChannel postMessage error:', err);
    }
  }

  // 2. Update localStorage to trigger cross-tab 'storage' event
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('localStorage sync notice:', err);
    }
  }

  // 3. Dispatch in-window DOM custom event
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(DOM_EVENT_NAME, { detail: payload }));
    } catch (err) {
      console.warn('DOM event dispatch error:', err);
    }
  }
}

/**
 * Subscribes to catalog synchronization events from any screen or tab.
 * Returns an unsubscription function.
 */
export function onCatalogSync(handler: (event: CatalogSyncEvent) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e && e.data) {
      handler(e.data as CatalogSyncEvent);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        handler(parsed);
      } catch {
        handler({ type: 'CATALOG_UPDATED', timestamp: Date.now() });
      }
    }
  };

  const handleDomEvent = (e: Event) => {
    const custom = e as CustomEvent<CatalogSyncEvent>;
    handler(custom.detail || { type: 'CATALOG_UPDATED', timestamp: Date.now() });
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }
  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener(DOM_EVENT_NAME, handleDomEvent);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener(DOM_EVENT_NAME, handleDomEvent);
  };
}
