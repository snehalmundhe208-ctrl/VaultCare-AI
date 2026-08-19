// VaultCare AI - Multi-tier Persistent Storage Engine for Chat Messages, Blocked Users & Reports
// Combines Supabase Cloud DB (when configured) + IndexedDB (Local DB) + LocalStorage Sync
import { supabase, isSupabaseConfigured } from './supabaseClient';

const DB_NAME = 'VaultCareDB';
const DB_VERSION = 3;
const STORE_MESSAGES = 'chat_messages';
const STORE_BLOCKED = 'blocked_users';
const STORE_REPORTS = 'reported_users';

const openChatDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOCKED)) {
        db.createObjectStore(STORE_BLOCKED, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        db.createObjectStore(STORE_REPORTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// -------------------------------------------------------------
// CHAT MESSAGES PERSISTENCE
// -------------------------------------------------------------
export const saveMessageToStorage = async (msg) => {
  const sender = (msg.senderEmail || '').toLowerCase().trim();
  const receiver = (msg.receiverEmail || '').toLowerCase().trim();
  const convId = [sender, receiver].sort().join('::');

  const normalizedMsg = {
    id: msg.id || 'MSG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    senderEmail: sender,
    receiverEmail: receiver,
    senderRole: msg.senderRole || 'patient',
    text: msg.text || '',
    attachment: msg.attachment || null,
    isSharedVaultAccess: Boolean(msg.isSharedVaultAccess),
    timestamp: msg.timestamp || new Date().toISOString(),
    displayTime: msg.displayTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    conversationId: convId
  };

  // 1. Supabase Cloud Sync (if configured)
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('chat_messages').insert([normalizedMsg]);
    } catch (e) {
      console.warn('Supabase Chat Insert Warning (falling back to IndexedDB):', e);
    }
  }

  // 2. IndexedDB Local Persistent Storage
  try {
    const db = await openChatDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      store.put(normalizedMsg);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.warn('IndexedDB Message Save Warning:', e);
  }

  // 3. LocalStorage Memory Backup (Strictly per-conversation ID)
  try {
    const key = `vaultcare_chat_${convId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.some(m => m.id === normalizedMsg.id)) {
      existing.push(normalizedMsg);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch (e) {}

  return normalizedMsg;
};

export const getMessagesFromStorage = async (userEmail, targetEmail) => {
  const lowerUser = (userEmail || '').toLowerCase().trim();
  const lowerTarget = (targetEmail || '').toLowerCase().trim();
  if (!lowerUser || !lowerTarget) return [];

  const targetConvId = [lowerUser, lowerTarget].sort().join('::');

  let cloudMessages = [];

  // 1. Fetch from Supabase Cloud (if configured)
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversationId', targetConvId);

      if (!error && data && data.length > 0) {
        cloudMessages = data;
      }
    } catch (e) {}
  }

  // 2. Fetch from IndexedDB
  let idbMessages = [];
  try {
    const db = await openChatDB();
    idbMessages = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const filtered = all.filter(m => 
          m.conversationId === targetConvId ||
          (m.senderEmail === lowerUser && m.receiverEmail === lowerTarget) ||
          (m.senderEmail === lowerTarget && m.receiverEmail === lowerUser)
        );
        resolve(filtered);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {}

  // 3. Fetch from LocalStorage (Strictly per-conversation)
  let lsMessages = [];
  try {
    const key = `vaultcare_chat_${targetConvId}`;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    lsMessages = saved.filter(m =>
      m.conversationId === targetConvId ||
      (m.senderEmail === lowerUser && m.receiverEmail === lowerTarget) ||
      (m.senderEmail === lowerTarget && m.receiverEmail === lowerUser)
    );
  } catch (e) {}

  // Merge and deduplicate by ID
  const map = new Map();
  [...cloudMessages, ...idbMessages, ...lsMessages].forEach(m => {
    if (m && m.id) map.set(m.id, m);
  });

  const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return merged;
};

export const getAllUserConversationsFromStorage = async (userEmail) => {
  const lowerUser = (userEmail || '').toLowerCase().trim();
  if (!lowerUser) return [];

  let allMessages = [];

  // Fetch all messages involving user from IndexedDB
  try {
    const db = await openChatDB();
    allMessages = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const filtered = all.filter(m => m.senderEmail === lowerUser || m.receiverEmail === lowerUser);
        resolve(filtered);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {}

  // LocalStorage fallback merge
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vaultcare_chat_') && k.includes(lowerUser)) {
        const items = JSON.parse(localStorage.getItem(k) || '[]');
        items.forEach(m => {
          if (m.senderEmail === lowerUser || m.receiverEmail === lowerUser) {
            allMessages.push(m);
          }
        });
      }
    }
  } catch (e) {}

  const map = new Map();
  allMessages.forEach(m => {
    if (m && m.id) map.set(m.id, m);
  });

  return Array.from(map.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// -------------------------------------------------------------
// BLOCKED USERS PERSISTENCE
// -------------------------------------------------------------
export const blockUserInStorage = async (doctorEmail, patientEmail) => {
  const docKey = (doctorEmail || '').toLowerCase().trim();
  const patKey = (patientEmail || '').toLowerCase().trim();
  const blockRecord = {
    id: `BLOCK-${docKey}-${patKey}`,
    doctorEmail: docKey,
    patientEmail: patKey,
    blockedAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('blocked_users').insert([blockRecord]);
    } catch (e) {}
  }

  try {
    const db = await openChatDB();
    const tx = db.transaction(STORE_BLOCKED, 'readwrite');
    tx.objectStore(STORE_BLOCKED).put(blockRecord);
  } catch (e) {}

  try {
    const saved = JSON.parse(localStorage.getItem('vaultcare_blocked_users') || '[]');
    if (!saved.some(b => b.doctorEmail === docKey && b.patientEmail === patKey)) {
      saved.push(blockRecord);
      localStorage.setItem('vaultcare_blocked_users', JSON.stringify(saved));
    }
  } catch (e) {}

  return true;
};

export const unblockUserInStorage = async (doctorEmail, patientEmail) => {
  const docKey = (doctorEmail || '').toLowerCase().trim();
  const patKey = (patientEmail || '').toLowerCase().trim();
  const blockId = `BLOCK-${docKey}-${patKey}`;

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('blocked_users').delete().eq('id', blockId);
    } catch (e) {}
  }

  try {
    const db = await openChatDB();
    const tx = db.transaction(STORE_BLOCKED, 'readwrite');
    tx.objectStore(STORE_BLOCKED).delete(blockId);
  } catch (e) {}

  try {
    const saved = JSON.parse(localStorage.getItem('vaultcare_blocked_users') || '[]');
    const updated = saved.filter(b => !(b.doctorEmail === docKey && b.patientEmail === patKey));
    localStorage.setItem('vaultcare_blocked_users', JSON.stringify(updated));
  } catch (e) {}

  return true;
};

export const isUserBlockedInStorage = async (doctorEmail, patientEmail) => {
  const docKey = (doctorEmail || '').toLowerCase().trim();
  const patKey = (patientEmail || '').toLowerCase().trim();

  try {
    const saved = JSON.parse(localStorage.getItem('vaultcare_blocked_users') || '[]');
    if (saved.some(b => b.doctorEmail === docKey && b.patientEmail === patKey)) return true;
  } catch (e) {}

  try {
    const db = await openChatDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BLOCKED, 'readonly');
      const store = tx.objectStore(STORE_BLOCKED);
      const req = store.get(`BLOCK-${docKey}-${patKey}`);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
};

// -------------------------------------------------------------
// REPORTED USERS PERSISTENCE
// -------------------------------------------------------------
export const reportUserInStorage = async (reporterEmail, targetEmail, reason, userRole) => {
  const reportObj = {
    id: `REP-USER-${Date.now()}`,
    reporterEmail: (reporterEmail || '').toLowerCase().trim(),
    targetEmail: (targetEmail || '').toLowerCase().trim(),
    reason: reason || 'Inappropriate Behavior',
    reporterRole: userRole || 'doctor',
    reportedAt: new Date().toISOString(),
    status: 'Pending Admin Audit'
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('reported_users').insert([reportObj]);
    } catch (e) {}
  }

  try {
    const db = await openChatDB();
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    tx.objectStore(STORE_REPORTS).put(reportObj);
  } catch (e) {}

  try {
    const saved = JSON.parse(localStorage.getItem('vaultcare_reported_users') || '[]');
    saved.push(reportObj);
    localStorage.setItem('vaultcare_reported_users', JSON.stringify(saved));
  } catch (e) {}

  return reportObj;
};
