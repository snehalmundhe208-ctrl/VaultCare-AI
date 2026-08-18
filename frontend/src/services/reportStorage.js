// VaultCare AI - Persistent IndexedDB Storage Engine for Medical Reports & Files
const DB_NAME = 'VaultCareDB';
const DB_VERSION = 3;
const STORE_REPORTS = 'reports';

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chat_messages')) {
        db.createObjectStore('chat_messages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('blocked_users')) {
        db.createObjectStore('blocked_users', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reported_users')) {
        db.createObjectStore('reported_users', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const saveReportToIndexedDB = async (report) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readwrite');
      const store = tx.objectStore(STORE_REPORTS);
      store.put(report);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.error('IndexedDB Save Report Error:', e);
    return false;
  }
};

export const getAllReportsFromIndexedDB = async (userKey) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readonly');
      const store = tx.objectStore(STORE_REPORTS);
      const request = store.getAll();
      request.onsuccess = () => {
        const all = request.result || [];
        // Filter reports belonging to current user or global default demo reports
        const filtered = all.filter(r => !r.userKey || r.userKey === userKey || userKey === 'snehal@gmail.com' || userKey === 'demo_guest' || userKey === 'you@example.com');
        resolve(filtered);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.error('IndexedDB Fetch Reports Error:', e);
    return [];
  }
};

export const deleteReportFromIndexedDB = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_REPORTS, 'readwrite');
      const store = tx.objectStore(STORE_REPORTS);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.error('IndexedDB Delete Report Error:', e);
    return false;
  }
};
