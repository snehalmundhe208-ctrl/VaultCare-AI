// Family Vault Storage & Backend API Service Layer for PostgreSQL & Client Persistence

const STORAGE_KEYS = {
  VAULTS: 'vaultcare_family_vaults',
  MEMBERS: 'vaultcare_family_members',
  PERMISSIONS: 'vaultcare_family_permissions'
};

// Helper: Read JSON from localStorage safely
const readStorage = (key, defaultVal = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

// Helper: Write JSON to localStorage safely
const writeStorage = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

// Helper: API fetch for PostgreSQL backend
const apiFetch = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`http://localhost:5000/api/family-vault${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Backend API connection warning (fallback to local state):', e.message);
  }
  return null;
};

/**
 * Fetch Family Vault data for a specific user email
 * Returns: { vault, members, pendingInvites, myPermissions }
 */
export const getUserFamilyVaultData = async (userEmail) => {
  if (!userEmail) return { vault: null, members: [], pendingInvites: [], myPermissions: [] };
  const uEmail = userEmail.toLowerCase().trim();

  // 1. Try PostgreSQL API
  const apiResult = await apiFetch(`/user/${encodeURIComponent(uEmail)}`);
  if (apiResult && apiResult.success && apiResult.data) {
    const data = apiResult.data;
    // Cache for resilience
    writeStorage(`vaultcare_family_cache_${uEmail}`, data);
    return data;
  }

  // 2. Cached State Fallback
  const cached = readStorage(`vaultcare_family_cache_${uEmail}`, null);
  if (cached && (cached.vault || cached.pendingInvites?.length > 0)) {
    return cached;
  }

  // 3. LocalStorage Persistence Fallback
  const vaults = readStorage(STORAGE_KEYS.VAULTS);
  const members = readStorage(STORAGE_KEYS.MEMBERS);
  const permissions = readStorage(STORAGE_KEYS.PERMISSIONS);

  const pendingInvites = members
    .filter(m => (m.userEmail || m.user_email)?.toLowerCase().trim() === uEmail && m.status === 'pending')
    .map(m => {
      const v = vaults.find(v => v.id === (m.vaultId || m.vault_id));
      return {
        ...m,
        vaultId: m.vaultId || m.vault_id,
        userEmail: m.userEmail || m.user_email,
        userName: m.userName || m.user_name || uEmail.split('@')[0],
        relationshipTag: m.relationshipTag || m.relationship_tag || 'Family Member',
        vaultName: v ? v.name : 'Family Vault',
        createdBy: v ? (v.createdBy || v.created_by) : 'Family Member'
      };
    });

  const myMembership = members.find(m => (m.userEmail || m.user_email)?.toLowerCase().trim() === uEmail && m.status === 'accepted');
  let myVault = null;

  if (myMembership) {
    myVault = vaults.find(v => v.id === (myMembership.vaultId || myMembership.vault_id)) || null;
  } else {
    myVault = vaults.find(v => (v.createdBy || v.created_by)?.toLowerCase().trim() === uEmail) || null;
  }

  if (!myVault) {
    return { vault: null, members: [], pendingInvites, myPermissions: [] };
  }

  const vaultMembers = members
    .filter(m => (m.vaultId || m.vault_id) === myVault.id && (m.status === 'accepted' || m.status === 'pending'))
    .map(m => ({
      ...m,
      vaultId: m.vaultId || m.vault_id,
      userEmail: m.userEmail || m.user_email,
      userName: m.userName || m.user_name,
      relationshipTag: m.relationshipTag || m.relationship_tag || 'Family Member'
    }));

  const myPermissions = permissions
    .filter(p => (p.vaultId || p.vault_id) === myVault.id && (p.ownerEmail || p.owner_email)?.toLowerCase().trim() === uEmail)
    .map(p => ({
      ...p,
      vaultId: p.vaultId || p.vault_id,
      ownerEmail: p.ownerEmail || p.owner_email,
      viewerEmail: p.viewerEmail || p.viewer_email,
      dataType: p.dataType || p.data_type,
      isActive: p.isActive !== undefined ? p.isActive : p.is_active
    }));

  return {
    vault: myVault,
    members: vaultMembers,
    pendingInvites,
    myPermissions
  };
};

/**
 * Create a new Family Vault
 */
export const createFamilyVault = async (vaultName, creatorEmail, creatorName) => {
  if (!vaultName || !creatorEmail) return { success: false, error: 'Vault name and creator email are required' };
  const uEmail = creatorEmail.toLowerCase().trim();
  const cName = creatorName || uEmail.split('@')[0];

  // Try API first
  const apiResult = await apiFetch('/create', {
    method: 'POST',
    body: JSON.stringify({ vaultName, creatorEmail: uEmail, creatorName: cName })
  });

  let vault = null;
  if (apiResult && apiResult.success && apiResult.vault) {
    vault = apiResult.vault;
  } else {
    vault = {
      id: 'VAULT-' + Date.now(),
      name: vaultName,
      createdBy: uEmail,
      creatorName: cName,
      createdAt: new Date().toISOString()
    };
  }

  const creatorMember = {
    id: 'MEM-' + Date.now() + '-1',
    vaultId: vault.id,
    userEmail: uEmail,
    userName: cName,
    relationshipTag: 'Owner / Self',
    status: 'accepted',
    joinedAt: new Date().toISOString()
  };

  // Synchronize localStorage
  const vaults = readStorage(STORAGE_KEYS.VAULTS);
  const members = readStorage(STORAGE_KEYS.MEMBERS);

  writeStorage(STORAGE_KEYS.VAULTS, [vault, ...vaults.filter(v => v.id !== vault.id)]);
  writeStorage(STORAGE_KEYS.MEMBERS, [creatorMember, ...members.filter(m => !(m.vaultId === vault.id && m.userEmail === uEmail))]);

  return { success: true, vault };
};

/**
 * Send an invitation to a family member
 */
export const sendFamilyInvite = async (vaultId, inviterEmail, inviteeEmail, inviteeName, relationshipTag) => {
  if (!vaultId || !inviteeEmail) return { success: false, error: 'Email is required' };
  const targetEmail = inviteeEmail.toLowerCase().trim();
  const invName = inviteeName || targetEmail.split('@')[0];
  const relTag = relationshipTag || 'Family Member';

  const apiResult = await apiFetch('/invite', {
    method: 'POST',
    body: JSON.stringify({ vaultId, inviterEmail, inviteeEmail: targetEmail, inviteeName: invName, relationshipTag: relTag })
  });

  const newMember = (apiResult && apiResult.success && apiResult.member) ? apiResult.member : {
    id: 'MEM-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    vaultId: vaultId,
    userEmail: targetEmail,
    userName: invName,
    relationshipTag: relTag,
    status: 'pending',
    invitedBy: inviterEmail,
    joinedAt: new Date().toISOString()
  };

  const members = readStorage(STORAGE_KEYS.MEMBERS);
  const existingIdx = members.findIndex(m => (m.vaultId || m.vault_id) === vaultId && (m.userEmail || m.user_email)?.toLowerCase().trim() === targetEmail);
  if (existingIdx !== -1) {
    members[existingIdx] = newMember;
  } else {
    members.push(newMember);
  }

  writeStorage(STORAGE_KEYS.MEMBERS, members);
  return { success: true, member: newMember };
};

/**
 * Respond to invitation (Accept / Reject)
 */
export const respondToInvite = async (inviteId, userEmail, accept) => {
  if (!inviteId) return { success: false };

  await apiFetch('/respond-invite', {
    method: 'POST',
    body: JSON.stringify({ inviteId, userEmail, accept })
  });

  const members = readStorage(STORAGE_KEYS.MEMBERS);
  const idx = members.findIndex(m => m.id === inviteId);
  if (idx !== -1) {
    if (accept) {
      members[idx].status = 'accepted';
      members[idx].joinedAt = new Date().toISOString();
    } else {
      members[idx].status = 'rejected';
    }
    writeStorage(STORAGE_KEYS.MEMBERS, members);
  }

  return { success: true };
};

/**
 * Toggle a granular permission for a family member
 */
export const toggleFamilyPermission = async (vaultId, ownerEmail, viewerEmail, dataType, isActive) => {
  if (!vaultId || !ownerEmail || !viewerEmail || !dataType) return { success: false };

  const oEmail = ownerEmail.toLowerCase().trim();
  const vEmail = viewerEmail.toLowerCase().trim();

  await apiFetch('/toggle-permission', {
    method: 'POST',
    body: JSON.stringify({ vaultId, ownerEmail: oEmail, viewerEmail: vEmail, dataType, isActive })
  });

  const permissions = readStorage(STORAGE_KEYS.PERMISSIONS);
  const idx = permissions.findIndex(
    p => (p.vaultId || p.vault_id) === vaultId && (p.ownerEmail || p.owner_email)?.toLowerCase().trim() === oEmail && (p.viewerEmail || p.viewer_email)?.toLowerCase().trim() === vEmail && (p.dataType || p.data_type) === dataType
  );

  if (idx !== -1) {
    permissions[idx].isActive = isActive;
    permissions[idx].updatedAt = new Date().toISOString();
    if (!isActive) {
      permissions[idx].revokedAt = new Date().toISOString();
    }
  } else {
    permissions.push({
      id: 'PERM-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      vaultId,
      ownerEmail: oEmail,
      viewerEmail: vEmail,
      dataType,
      isActive,
      grantedAt: new Date().toISOString(),
      revokedAt: isActive ? null : new Date().toISOString()
    });
  }

  writeStorage(STORAGE_KEYS.PERMISSIONS, permissions);
  return { success: true };
};

/**
 * Get Shared Data from a member if permission is active
 */
export const getSharedDataFromMember = async (ownerEmail, viewerEmail, dataType) => {
  if (!ownerEmail || !viewerEmail || !dataType) return { allowed: false, message: 'Invalid request' };

  const oEmail = ownerEmail.toLowerCase().trim();
  const vEmail = viewerEmail.toLowerCase().trim();

  // Try DB first or localStorage
  const permissions = readStorage(STORAGE_KEYS.PERMISSIONS);
  const perm = permissions.find(
    p => (p.ownerEmail || p.owner_email)?.toLowerCase().trim() === oEmail && (p.viewerEmail || p.viewer_email)?.toLowerCase().trim() === vEmail && (p.dataType || p.data_type) === dataType && (p.isActive === true || p.is_active === true)
  );

  // If not in local, verify from server
  if (!perm) {
    const data = await getUserFamilyVaultData(vEmail);
    const serverPerm = data?.myPermissions?.find(
      p => (p.ownerEmail || p.owner_email)?.toLowerCase().trim() === oEmail && (p.dataType || p.data_type) === dataType && (p.isActive === true || p.is_active === true)
    );
    if (!serverPerm) {
      return {
        allowed: false,
        message: `Access Restricted — ${ownerEmail} has not granted ${dataType} permission to you, or access was revoked.`
      };
    }
  }

  // Permission IS ACTIVE: Fetch read-only data for ownerEmail
  try {
    if (dataType === 'reports') {
      const savedUserKey = localStorage.getItem(`vaultcare_reports_${oEmail}`);
      let reports = savedUserKey ? JSON.parse(savedUserKey) : [];
      if (!reports || reports.length === 0) {
        const savedGlobal = localStorage.getItem('vaultcare_reports');
        const allReports = savedGlobal ? JSON.parse(savedGlobal) : [];
        reports = allReports.filter(r => (r.userKey || r.patientEmail || '').toLowerCase().trim() === oEmail);
      }
      return { allowed: true, data: reports };
    }

    if (dataType === 'appointments') {
      const saved = localStorage.getItem('vaultcare_global_all_appointments');
      const allAppts = saved ? JSON.parse(saved) : [];
      const ownerAppts = allAppts.filter(a => (a.patientEmail || a.userKey || '').toLowerCase().trim() === oEmail);
      return { allowed: true, data: ownerAppts };
    }

    if (dataType === 'prescriptions') {
      const saved = localStorage.getItem('vaultcare_global_all_appointments');
      const allAppts = saved ? JSON.parse(saved) : [];
      const prescriptions = allAppts
        .filter(a => (a.patientEmail || a.userKey || '').toLowerCase().trim() === oEmail && a.status === 'Completed' && a.prescription)
        .map(a => a.prescription);

      const savedUserKey = localStorage.getItem(`vaultcare_reports_${oEmail}`);
      const userReports = savedUserKey ? JSON.parse(savedUserKey) : [];
      userReports.filter(r => r.category === 'Prescription' && r.prescriptionDetails).forEach(r => {
        prescriptions.push(r.prescriptionDetails);
      });

      return { allowed: true, data: prescriptions };
    }

    if (dataType === 'history') {
      const savedUserKey = localStorage.getItem(`vaultcare_reports_${oEmail}`);
      const reports = savedUserKey ? JSON.parse(savedUserKey) : [];
      const timeline = reports.map(r => ({
        date: r.date,
        event: r.title || r.name,
        category: r.category,
        facility: r.facility || r.hospital
      }));
      return { allowed: true, data: timeline };
    }
  } catch (e) {}

  return { allowed: true, data: [] };
};

/**
 * Remove a member from Family Vault & revoke all permissions
 */
export const removeFamilyMember = async (vaultId, memberEmailToRemove) => {
  if (!vaultId || !memberEmailToRemove) return { success: false };
  const mEmail = memberEmailToRemove.toLowerCase().trim();

  await apiFetch('/remove-member', {
    method: 'POST',
    body: JSON.stringify({ vaultId, memberEmailToRemove: mEmail })
  });

  const members = readStorage(STORAGE_KEYS.MEMBERS);
  const updatedMembers = members.filter(m => !((m.vaultId || m.vault_id) === vaultId && (m.userEmail || m.user_email)?.toLowerCase().trim() === mEmail));
  writeStorage(STORAGE_KEYS.MEMBERS, updatedMembers);

  const permissions = readStorage(STORAGE_KEYS.PERMISSIONS);
  const updatedPermissions = permissions.map(p => {
    if ((p.vaultId || p.vault_id) === vaultId && ((p.ownerEmail || p.owner_email)?.toLowerCase().trim() === mEmail || (p.viewerEmail || p.viewer_email)?.toLowerCase().trim() === mEmail)) {
      return { ...p, isActive: false, is_active: false, revokedAt: new Date().toISOString() };
    }
    return p;
  });
  writeStorage(STORAGE_KEYS.PERMISSIONS, updatedPermissions);

  return { success: true };
};
