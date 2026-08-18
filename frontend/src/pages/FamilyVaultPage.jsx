import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  FileText, 
  Calendar, 
  Clock, 
  Stethoscope, 
  AlertCircle, 
  Trash2, 
  Eye, 
  HeartHandshake, 
  ChevronRight, 
  RefreshCw,
  Info,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getUserFamilyVaultData, 
  createFamilyVault, 
  sendFamilyInvite, 
  respondToInvite, 
  toggleFamilyPermission, 
  getSharedDataFromMember, 
  removeFamilyMember 
} from '../services/familyVaultStorage';
import { downloadPdfFile } from '../utils/downloadPdf';
import ScannableQRCode from '../components/ScannableQRCode';

export default function FamilyVaultPage() {
  const { user } = useAuth();
  const currentEmail = (user?.email || '').toLowerCase().trim();
  const currentName = user?.fullName || currentEmail.split('@')[0];

  const [activeTab, setActiveTab] = useState('my-vault'); // 'my-vault' | 'permissions' | 'shared-with-me'

  // Vault Data State
  const [vault, setVault] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [myPermissions, setMyPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vaultNameInput, setVaultNameInput] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('Father');

  // Shared With Me View State
  const [selectedSharedMember, setSelectedSharedMember] = useState(null);
  const [sharedCategory, setSharedCategory] = useState('reports'); // 'reports' | 'prescriptions' | 'appointments' | 'history'
  const [sharedContent, setSharedContent] = useState({ allowed: false, data: [], message: '' });
  const [fetchingShared, setFetchingShared] = useState(false);
  const [viewingSharedDoc, setViewingSharedDoc] = useState(null);

  // Load Family Vault Data
  const loadVaultData = async () => {
    if (!currentEmail) return;
    setLoading(true);
    const data = await getUserFamilyVaultData(currentEmail);
    setVault(data.vault);
    setMembers(data.members || []);
    setPendingInvites(data.pendingInvites || []);
    setMyPermissions(data.myPermissions || []);
    setLoading(false);

    // Auto-set first shared member if available
    const otherMembers = (data.members || []).filter(m => m.userEmail?.toLowerCase().trim() !== currentEmail);
    if (otherMembers.length > 0 && !selectedSharedMember) {
      setSelectedSharedMember(otherMembers[0]);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, [currentEmail]);

  // Load Shared Content when member or category changes in "Shared With Me" tab
  useEffect(() => {
    if (activeTab === 'shared-with-me' && selectedSharedMember) {
      const fetchShared = async () => {
        setFetchingShared(true);
        const res = await getSharedDataFromMember(selectedSharedMember.userEmail, currentEmail, sharedCategory);
        setSharedContent(res);
        setFetchingShared(false);
      };
      fetchShared();
    }
  }, [activeTab, selectedSharedMember?.userEmail, sharedCategory, currentEmail]);

  // Handle Create Vault Submit
  const handleCreateVaultSubmit = async (e) => {
    e.preventDefault();
    if (!vaultNameInput.trim()) return;

    const res = await createFamilyVault(vaultNameInput.trim(), currentEmail, currentName);
    if (res.success) {
      setShowCreateModal(false);
      setVaultNameInput('');
      await loadVaultData();
      alert(`Family Vault "${res.vault.name}" created successfully! You are now the Vault Admin.`);
    }
  };

  // Handle Send Invite Submit
  const handleSendInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !vault) return;

    const res = await sendFamilyInvite(
      vault.id, 
      currentEmail, 
      inviteEmail.trim(), 
      inviteName.trim(), 
      inviteRelationship
    );

    if (res.success) {
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      await loadVaultData();
      alert(`Invitation sent to ${inviteEmail}! Status set to Pending.`);
    }
  };

  // Handle Respond to Invite (Accept / Reject)
  const handleInviteResponse = async (inviteId, accept) => {
    await respondToInvite(inviteId, currentEmail, accept);
    await loadVaultData();
    if (accept) {
      alert('Family Vault invitation accepted! Accounts linked successfully.');
    } else {
      alert('Invitation declined.');
    }
  };

  // Handle Permission Toggle
  const handlePermissionToggle = async (viewerEmail, dataType, currentVal) => {
    if (!vault) return;
    const newVal = !currentVal;

    // Optimistic UI state update
    setMyPermissions(prev => {
      const existingIdx = prev.findIndex(p => p.viewerEmail?.toLowerCase().trim() === viewerEmail.toLowerCase().trim() && p.dataType === dataType);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], isActive: newVal };
        return updated;
      } else {
        return [...prev, { vaultId: vault.id, ownerEmail: currentEmail, viewerEmail, dataType, isActive: newVal }];
      }
    });

    await toggleFamilyPermission(vault.id, currentEmail, viewerEmail, dataType, newVal);
    await loadVaultData();
  };

  // Handle Remove Member
  const handleRemoveMember = async (memberEmail) => {
    if (!vault) return;
    const confirmRemove = window.confirm(`Are you sure you want to remove ${memberEmail} from your Family Vault?\n\nAll permissions granted to/from this member will be revoked IMMEDIATELY.`);
    if (!confirmRemove) return;

    await removeFamilyMember(vault.id, memberEmail);
    await loadVaultData();
    alert(`Member ${memberEmail} removed from Family Vault. All access revoked.`);
  };

  // Helper: Check if specific permission is active
  const isPermissionActive = (viewerEmail, dataType) => {
    const perm = myPermissions.find(
      p => p.viewerEmail?.toLowerCase().trim() === viewerEmail.toLowerCase().trim() && p.dataType === dataType
    );
    return perm ? Boolean(perm.isActive) : false;
  };

  const otherVaultMembers = members.filter(m => m.userEmail?.toLowerCase().trim() !== currentEmail);

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12 select-none">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-black tracking-tight">Family Vault</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Permission Guard Active
            </span>
          </div>
          <p className="text-xs text-[#777777] font-semibold mt-1">
            Permission-based shared health space for family members. Granular, revocable, and 100% private.
          </p>
        </div>
      </div>

      {/* PENDING INVITATIONS NOTIFICATION BANNER */}
      {pendingInvites.length > 0 && (
        <div className="bg-amber-50 rounded-3xl border border-amber-200 p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4 text-amber-700" /> Pending Family Vault Invitations ({pendingInvites.length})
          </div>

          <div className="space-y-3">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-black">
                    Invitation to join <span className="text-amber-800 font-extrabold">"{inv.vaultName}"</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Invited by: <strong>{inv.createdBy}</strong> • Relationship Tag: <strong>{inv.relationshipTag}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleInviteResponse(inv.id, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-white" /> Accept Invitation
                  </button>

                  <button
                    onClick={() => handleInviteResponse(inv.id, false)}
                    className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IF USER HAS NO VAULT AND NO ACCEPTED MEMBERSHIP */}
      {!vault ? (
        <div className="bg-white rounded-3xl p-10 md:p-14 border border-[#E5E0D5] shadow-vault-card text-center max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-[#00796B] flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-8 h-8 text-[#00796B]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-black">Create Family Vault</h2>
            <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-md mx-auto">
              Link multiple family member accounts in a permission-based shared space. Individual data ownership stays 100% yours — nothing is shared until explicitly granted.
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] text-left text-xs font-semibold space-y-2 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-black font-bold">
              <Check className="w-4 h-4 text-emerald-600" /> Ownership Remains Yours (No Data Transfer)
            </div>
            <div className="flex items-center gap-2 text-black font-bold">
              <Check className="w-4 h-4 text-emerald-600" /> Default State: Everything OFF
            </div>
            <div className="flex items-center gap-2 text-black font-bold">
              <Check className="w-4 h-4 text-emerald-600" /> Revoke Access Anytime (Instant Enforcement)
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-3.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] font-black rounded-2xl text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#C9A574]" /> Create Family Vault Now
          </button>
        </div>
      ) : (
        <>
          {/* TAB NAVIGATION BUTTONS */}
          <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('my-vault')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'my-vault'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#E5E0D5] hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4 text-[#C9A574]" /> My Family Vault ({members.length} Members)
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'permissions'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#E5E0D5] hover:bg-gray-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#C9A574]" /> Permission Control Matrix
            </button>

            <button
              onClick={() => setActiveTab('shared-with-me')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'shared-with-me'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#E5E0D5] hover:bg-gray-50'
              }`}
            >
              <Eye className="w-4 h-4 text-[#C9A574]" /> Shared With Me ({otherVaultMembers.length})
            </button>
          </div>

          {/* TAB 1: MY VAULT MEMBERS LIST */}
          {activeTab === 'my-vault' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Vault Overview Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#E5E0D5] shadow-vault-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-black">{vault.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Vault
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Created by: <strong>{vault.createdBy}</strong> • Total Linked Members: <strong>{members.length}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-5 py-2.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
                >
                  <UserPlus className="w-4 h-4 text-[#C9A574]" /> + Invite Family Member
                </button>
              </div>

              {/* Members List Table */}
              <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-vault-card overflow-hidden">
                <div className="p-6 border-b border-[#E5E0D5] flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-black">Linked Family Members</h3>
                    <p className="text-xs text-gray-500 font-medium">Linked accounts in this vault space</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F5] text-[11px] font-extrabold text-[#777777] uppercase border-b border-[#E5E0D5]">
                        <th className="py-4 px-6">MEMBER NAME & EMAIL</th>
                        <th className="py-4 px-6">RELATIONSHIP</th>
                        <th className="py-4 px-6">MEMBERSHIP STATUS</th>
                        <th className="py-4 px-6">MY PERMISSIONS GIVEN</th>
                        <th className="py-4 px-6 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D5] text-xs font-semibold">
                      {members.map((m) => {
                        const isSelf = m.userEmail?.toLowerCase().trim() === currentEmail;
                        const activePermsCount = ['reports', 'prescriptions', 'appointments', 'history'].filter(dt => isPermissionActive(m.userEmail, dt)).length;

                        return (
                          <tr key={m.id} className="hover:bg-[#FAF8F5]">
                            <td className="py-4 px-6">
                              <div className="font-extrabold text-black flex items-center gap-2">
                                {m.userName || m.userEmail.split('@')[0]}
                                {isSelf && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">You</span>}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono">{m.userEmail}</div>
                            </td>

                            <td className="py-4 px-6 text-[#555555]">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]">
                                {m.relationshipTag || 'Family Member'}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              {m.status === 'pending' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 inline-flex">
                                  <Clock className="w-3 h-3 text-amber-600" /> Pending Invitation
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 inline-flex">
                                  <Check className="w-3 h-3 text-emerald-600" /> Active Member
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6">
                              {isSelf ? (
                                <span className="text-gray-400 font-medium text-[11px]">N/A (Owner)</span>
                              ) : activePermsCount > 0 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                   Sharing {activePermsCount} Categories
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-500 border border-gray-200">
                                   Sharing Nothing (Default)
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              {!isSelf && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setActiveTab('permissions')}
                                    className="px-3 py-1.5 bg-black text-white hover:bg-[#2a2a2a] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#C9A574]" /> Manage Access
                                  </button>

                                  <button
                                    onClick={() => handleRemoveMember(m.userEmail)}
                                    className="p-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors"
                                    title="Remove Member & Revoke All Access"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PERMISSION CONTROL MATRIX */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white p-6 rounded-3xl border border-[#E5E0D5] shadow-vault-card space-y-2">
                <div className="flex items-center gap-2 text-black font-extrabold text-base">
                  <ShieldCheck className="w-5 h-5 text-[#C9A574]" /> Granular Access Control Matrix
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Control exactly what medical record categories each linked member can view. Default state is <strong>OFF</strong>. Toggling OFF revokes access <strong>immediately</strong>.
                </p>
              </div>

              {otherVaultMembers.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-[#E5E0D5] shadow-vault-card space-y-3">
                  <Users className="w-10 h-10 text-gray-300 mx-auto" />
                  <h3 className="text-sm font-black text-black">No Other Linked Members Yet</h3>
                  <p className="text-xs text-gray-500 font-medium">Invite family members to start managing permission controls.</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-5 py-2.5 bg-black text-[#C9A574] font-black rounded-2xl text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer mt-2"
                  >
                    <UserPlus className="w-4 h-4 text-[#C9A574]" /> + Invite Family Member
                  </button>
                </div>
              ) : (
                otherVaultMembers.map((member) => {
                  const mEmail = member.userEmail;
                  const perms = [
                    { id: 'reports', label: 'Medical Lab Reports', desc: 'View uploaded blood test, imaging & diagnostic PDFs', icon: FileText },
                    { id: 'prescriptions', label: 'Official Prescriptions', desc: 'View digital prescriptions issued by doctors', icon: Stethoscope },
                    { id: 'appointments', label: 'OPD Appointments', desc: 'View scheduled doctor consultation slots & history', icon: Calendar },
                    { id: 'history', label: 'Health Timeline & History', desc: 'View complete medical timeline events', icon: Clock }
                  ];

                  return (
                    <div key={member.id} className="bg-white p-6 rounded-3xl border border-[#E5E0D5] shadow-vault-card space-y-5">
                      
                      {/* Member Header */}
                      <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00796B] border border-teal-200 flex items-center justify-center font-black text-xs">
                            {member.userName ? member.userName.slice(0, 2).toUpperCase() : 'FM'}
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-black">{member.userName || mEmail}</h3>
                            <p className="text-[11px] text-gray-500 font-medium">{mEmail} • <span className="text-[#916D41] font-bold">{member.relationshipTag}</span></p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(mEmail)}
                          className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Revoke Member Completely
                        </button>
                      </div>

                      {/* 4 Granular Toggles Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {perms.map((p) => {
                          const Icon = p.icon;
                          const active = isPermissionActive(mEmail, p.id);

                          return (
                            <div 
                              key={p.id}
                              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                active ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' : 'bg-[#FAF8F5] border-[#E5E0D5]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                                  active ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>

                                <div>
                                  <h4 className="text-xs font-black text-black">{p.label}</h4>
                                  <p className="text-[10px] text-gray-500 font-medium">{p.desc}</p>
                                </div>
                              </div>

                              {/* Interactive Toggle Switch */}
                              <button
                                type="button"
                                onClick={() => handlePermissionToggle(mEmail, p.id, active)}
                                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all flex-shrink-0 ${
                                  active ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
                                }`}
                              >
                                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-all" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })
              )}

            </div>
          )}

          {/* TAB 3: SHARED WITH ME */}
          {activeTab === 'shared-with-me' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white p-6 rounded-3xl border border-[#E5E0D5] shadow-vault-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-black">Read-Only Shared Family Vault Viewer</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    View medical records shared with you by linked family members. Strict read-only access.
                  </p>
                </div>

                {/* Member Dropdown Selector */}
                {otherVaultMembers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-700">Select Member:</label>
                    <select
                      value={selectedSharedMember?.userEmail || ''}
                      onChange={(e) => {
                        const found = otherVaultMembers.find(m => m.userEmail === e.target.value);
                        setSelectedSharedMember(found);
                      }}
                      className="bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-2 rounded-xl text-xs font-bold text-black outline-none cursor-pointer"
                    >
                      {otherVaultMembers.map(m => (
                        <option key={m.id} value={m.userEmail}>
                          {m.userName || m.userEmail} ({m.relationshipTag})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Data Type Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-2">
                {[
                  { id: 'reports', label: 'Medical Reports', icon: FileText },
                  { id: 'prescriptions', label: 'Prescriptions', icon: Stethoscope },
                  { id: 'appointments', label: 'Appointments', icon: Calendar },
                  { id: 'history', label: 'Health Timeline', icon: Clock }
                ].map(sub => {
                  const Icon = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSharedCategory(sub.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        sharedCategory === sub.id
                          ? 'bg-black text-[#C9A574] shadow-xs'
                          : 'bg-white text-gray-600 border border-[#E5E0D5] hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#C9A574]" /> {sub.label}
                    </button>
                  );
                })}
              </div>

              {/* SHARED CONTENT DISPLAY CONTAINER */}
              <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-vault-card p-6 md:p-8 space-y-4">
                {!selectedSharedMember ? (
                  <div className="text-center py-12 space-y-2 text-xs font-bold text-gray-500">
                    <Users className="w-8 h-8 text-gray-300 mx-auto" />
                    <p>No family member selected.</p>
                  </div>
                ) : fetchingShared ? (
                  <div className="text-center py-12 text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" /> Verifying permission matrix & loading shared records...
                  </div>
                ) : !sharedContent.allowed ? (
                  <div className="p-8 text-center bg-rose-50 rounded-2xl border border-rose-200 text-rose-950 space-y-3 max-w-lg mx-auto">
                    <Lock className="w-10 h-10 text-rose-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-black text-rose-950">Access Restricted by Permission Engine</h4>
                      <p className="text-xs text-rose-800 font-medium mt-1 leading-relaxed">
                        {sharedContent.message}
                      </p>
                    </div>
                  </div>
                ) : sharedContent.data.length === 0 ? (
                  <div className="text-center py-12 space-y-2 text-xs font-bold text-gray-500 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5]">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                    <p>Permission Granted — No {sharedCategory} uploaded yet by {selectedSharedMember.userName || selectedSharedMember.userEmail}.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-950">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Read-Only Shared Records • Owner: <strong>{selectedSharedMember.userName || selectedSharedMember.userEmail}</strong>
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md uppercase font-black">
                        READ-ONLY ACCESS
                      </span>
                    </div>

                    {/* Shared Data Renderers */}
                    {sharedCategory === 'reports' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sharedContent.data.map((rep, idx) => (
                          <div key={idx} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-extrabold text-black truncate">{rep.title || rep.name}</h4>
                              <span className="text-[10px] text-gray-500 font-mono">{rep.date}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 font-medium">Facility: {rep.facility || rep.hospital}</p>
                            <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between text-[11px]">
                              <span className="text-emerald-700 font-bold">{rep.category}</span>
                              <button
                                onClick={() => setViewingSharedDoc(rep)}
                                className="px-3.5 py-1.5 bg-black text-[#C9A574] hover:bg-[#2a2a2a] rounded-xl font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-[#C9A574]" /> View Shared PDF →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sharedCategory === 'prescriptions' && (
                      <div className="space-y-3">
                        {sharedContent.data.map((pres, idx) => (
                          <div key={idx} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-black">Prescription: {pres.diagnosis || 'OPD Consultation'}</h4>
                              <span className="text-[10px] text-emerald-700 font-bold">Doctor: {pres.doctorName}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 font-medium">Symptoms: {pres.symptoms}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {sharedCategory === 'appointments' && (
                      <div className="space-y-3">
                        {sharedContent.data.map((apt, idx) => (
                          <div key={idx} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-black text-black">{apt.doctor} ({apt.specialty})</h4>
                              <p className="text-[11px] text-gray-500">{apt.date} at {apt.time} • {apt.type}</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {apt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {sharedCategory === 'history' && (
                      <div className="space-y-3">
                        {sharedContent.data.map((ev, idx) => (
                          <div key={idx} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E0D5] flex items-center justify-between text-xs">
                            <div>
                              <h4 className="font-bold text-black">{ev.event}</h4>
                              <span className="text-[10px] text-gray-500">{ev.category} • {ev.facility}</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{ev.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </>
      )}

      {/* CREATE FAMILY VAULT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-5 relative font-sans">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C9A574]" />
                <h3 className="text-base font-black text-black">Create Family Vault</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-black rounded-xl cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVaultSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Family Vault Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Family Vault"
                  value={vaultNameInput}
                  onChange={(e) => setVaultNameInput(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none focus:border-black"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium">
                You will be set as the <strong>Vault Admin</strong>. Individual member data ownership is strictly retained by each user.
              </div>

              <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-xl font-black cursor-pointer shadow-md"
                >
                  Create Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-5 relative font-sans">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C9A574]" />
                <h3 className="text-base font-black text-black">Invite Family Member</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 text-gray-400 hover:text-black rounded-xl cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInviteSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Registered Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="family.member@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Member Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Relationship Tag *</label>
                <select
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none cursor-pointer"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-[11px] text-[#00796B] font-medium">
                An invitation will be sent with status <strong>Pending</strong>. No health data is shared by default.
              </div>

              <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-xl font-black cursor-pointer shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARED DOCUMENT PREVIEW & PDF DOWNLOAD MODAL */}
      {viewingSharedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-6 relative font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C9A574]" />
                <div>
                  <h3 className="text-base font-black text-black">
                    {viewingSharedDoc.title || viewingSharedDoc.name || 'Shared Medical Document'}
                  </h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-extrabold border border-emerald-200">
                    Shared Read-Only Access
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingSharedDoc(null)}
                className="p-2 text-gray-400 hover:text-black rounded-xl cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D5] grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-[11px] block font-bold">Category</span>
                  <span className="font-extrabold text-black">{viewingSharedDoc.category || 'Medical Report'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block font-bold">Record Date</span>
                  <span className="font-extrabold text-black">{viewingSharedDoc.date || 'Recent'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block font-bold">Facility / Hospital</span>
                  <span className="font-extrabold text-black">{viewingSharedDoc.facility || viewingSharedDoc.hospital || 'VaultCare Medical Network'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block font-bold">Status</span>
                  <span className="font-extrabold text-emerald-700">Verified & Signed</span>
                </div>
              </div>

              {/* Scannable Verification QR */}
              <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <div>
                  <h4 className="font-black text-black text-xs">Official VaultCare SHA-256 Verification</h4>
                  <p className="text-[11px] text-gray-600">Scan to verify document integrity</p>
                </div>
                <ScannableQRCode value={`https://vaultcare.ai/verify/${viewingSharedDoc.id || 'DOC-991'}`} size={70} />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
              <button
                onClick={() => setViewingSharedDoc(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
              >
                Close Viewer
              </button>
              <button
                onClick={() => {
                  downloadPdfFile(
                    viewingSharedDoc.title || viewingSharedDoc.name || 'Shared_Document',
                    viewingSharedDoc.prescriptionDetails || viewingSharedDoc,
                    `${(viewingSharedDoc.title || viewingSharedDoc.name || 'Shared_Document').replace(/\s+/g, '_')}.pdf`
                  );
                }}
                className="px-6 py-2.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-xl font-black cursor-pointer shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[#C9A574]" /> Download PDF Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
