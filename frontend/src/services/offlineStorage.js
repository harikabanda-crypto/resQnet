/**
 * ResQNet Offline Storage & Synchronization Service
 * Uses browser IndexedDB to persist emergency distress calls,
 * offline shelter caches, and background sync queues during cellular outages.
 */

const DB_NAME = 'ResQNetOfflineDB';
const DB_VERSION = 1;

class OfflineStorageService {
  constructor() {
    this.dbPromise = this._initDB();
    this.syncListeners = new Set();
  }

  _initDB() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. SOS Distress Outbox store
        if (!db.objectStoreNames.contains('sos_outbox')) {
          const outboxStore = db.createObjectStore('sos_outbox', { keyPath: 'outboxId' });
          outboxStore.createIndex('status', 'status', { unique: false });
          outboxStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // 2. Cached Shelters for offline navigation
        if (!db.objectStoreNames.contains('cached_shelters')) {
          db.createObjectStore('cached_shelters', { keyPath: 'id' });
        }

        // 3. Cached Zones
        if (!db.objectStoreNames.contains('cached_zones')) {
          db.createObjectStore('cached_zones', { keyPath: 'id' });
        }
      };

      req.onsuccess = (event) => {
        resolve(event.target.result);
      };

      req.onerror = (event) => {
        console.warn('[OfflineStorage] IndexedDB open error:', event.target.error);
        resolve(null);
      };
    });
  }

  // --- SOS Outbox Operations ---

  async queueSOS(request) {
    const db = await this.dbPromise;
    const outboxId = request.outboxId || `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      ...request,
      outboxId,
      status: 'pending_sync',
      queuedAt: new Date().toISOString(),
    };

    if (!db) {
      // LocalStorage fallback if IndexedDB is disabled
      try {
        const raw = localStorage.getItem('resqnet_sos_outbox') || '[]';
        const list = JSON.parse(raw);
        list.push(record);
        localStorage.setItem('resqnet_sos_outbox', JSON.stringify(list));
      } catch (err) {
        console.warn('LocalStorage outbox fallback error:', err);
      }
      this._notifyListeners('queued', record);
      return record;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction('sos_outbox', 'readwrite');
      const store = tx.objectStore('sos_outbox');
      const addReq = store.put(record);

      addReq.onsuccess = () => {
        this._notifyListeners('queued', record);
        resolve(record);
      };
      addReq.onerror = () => reject(addReq.error);
    });
  }

  async getPendingSOS() {
    const db = await this.dbPromise;
    if (!db) {
      try {
        const raw = localStorage.getItem('resqnet_sos_outbox') || '[]';
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }

    return new Promise((resolve) => {
      const tx = db.transaction('sos_outbox', 'readonly');
      const store = tx.objectStore('sos_outbox');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async removePendingSOS(outboxId) {
    const db = await this.dbPromise;
    if (!db) {
      try {
        const raw = localStorage.getItem('resqnet_sos_outbox') || '[]';
        const list = JSON.parse(raw).filter((item) => item.outboxId !== outboxId);
        localStorage.setItem('resqnet_sos_outbox', JSON.stringify(list));
      } catch {}
      return;
    }

    return new Promise((resolve) => {
      const tx = db.transaction('sos_outbox', 'readwrite');
      const store = tx.objectStore('sos_outbox');
      const req = store.delete(outboxId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }

  // --- Auto-Sync Engine ---

  async syncOutbox(apiService) {
    const pending = await this.getPendingSOS();
    if (!pending.length) return { syncedCount: 0, failedCount: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    for (const item of pending) {
      try {
        await apiService.createSOS({
          type: item.type,
          zone: item.zone || item.zone_id,
          location: item.location,
          people: item.people,
          priority: item.priority,
          description: `[OFFLINE QUEUED - DELAYED TRANSMISSION] ${item.description || ''}`,
          citizen_name: item.citizen_name || item.citizenName || 'Citizen',
        });
        await this.removePendingSOS(item.outboxId);
        syncedCount++;
        this._notifyListeners('synced', item);
      } catch (err) {
        console.warn('[OfflineStorage] Sync retry failed for:', item.outboxId, err.message);
        failedCount++;
      }
    }

    return { syncedCount, failedCount };
  }

  // --- Cache Offline Shelters and Guidelines ---

  async cacheShelters(shelters) {
    const db = await this.dbPromise;
    if (!db || !shelters?.length) return;

    const tx = db.transaction('cached_shelters', 'readwrite');
    const store = tx.objectStore('cached_shelters');
    shelters.forEach((s) => store.put(s));
  }

  async getCachedShelters() {
    const db = await this.dbPromise;
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction('cached_shelters', 'readonly');
      const store = tx.objectStore('cached_shelters');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  onSyncEvent(callback) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  _notifyListeners(event, data) {
    this.syncListeners.forEach((cb) => {
      try {
        cb(event, data);
      } catch (e) {
        console.error('Offline sync listener error:', e);
      }
    });
  }
}

export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
