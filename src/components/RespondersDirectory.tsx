/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MessageSquare, 
  Trash2, 
  Copy, 
  Check, 
  Filter, 
  Building2, 
  X,
  Plus,
  ArrowRight,
  Edit2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { PPPContact, ActiveTab, ResponderEditOverride } from '../types.ts';
import { PPP_LIST, STJOHN_RESPONDERS, AVAILABLE_CATEGORIES } from '../constants.ts';

interface RespondersDirectoryProps {
  customPppList: PPPContact[];
  setCustomPppList: React.Dispatch<React.SetStateAction<PPPContact[]>>;
  customStJohnList: string[];
  setCustomStJohnList: React.Dispatch<React.SetStateAction<string[]>>;
  responderEdits: Record<string, ResponderEditOverride>;
  setResponderEdits: React.Dispatch<React.SetStateAction<Record<string, ResponderEditOverride>>>;
  setActiveTab: (tab: ActiveTab) => void;
}

interface UnifiedResponderItem {
  id: string;
  originalName: string;
  name: string;
  role: 'PPP' | 'STJOHN';
  category: string;
  phone: string;
  isCustom: boolean;
  isModified: boolean;
}

export const RespondersDirectory: React.FC<RespondersDirectoryProps> = ({
  customPppList,
  setCustomPppList,
  customStJohnList,
  setCustomStJohnList,
  responderEdits,
  setResponderEdits,
  setActiveTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'PPP' | 'STJOHN' | 'CUSTOM'>('ALL');
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'PPP' | 'STJOHN'>('PPP');
  const [newCategory, setNewCategory] = useState('PHC HTAR');
  const [newPhone, setNewPhone] = useState('');

  // Edit modal & Confirmation box state
  const [editingResponder, setEditingResponder] = useState<UnifiedResponderItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'PPP' | 'STJOHN'>('PPP');
  const [editCategory, setEditCategory] = useState('PHC HTAR');
  const [editPhone, setEditPhone] = useState('');
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);

  // Delete & Reset override confirmation modals
  const [deletingResponder, setDeletingResponder] = useState<UnifiedResponderItem | null>(null);
  const [resettingResponder, setResettingResponder] = useState<UnifiedResponderItem | null>(null);

  // Toast & Copied state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyPhone = (id: string, phone: string) => {
    if (!phone || phone === 'N/A') return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    showToast(`No. telefon "${phone}" berjaya disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compile all responders from constants + custom + edits
  const allResponders = useMemo(() => {
    const list: UnifiedResponderItem[] = [];

    // 1. Built-in PPPs
    PPP_LIST.forEach((p) => {
      const override = responderEdits[p.id];
      list.push({
        id: p.id,
        originalName: p.name,
        name: override ? override.name : p.name,
        role: override ? override.role : 'PPP',
        category: override ? override.category : p.category,
        phone: override ? override.phone : p.personalPhone,
        isCustom: false,
        isModified: Boolean(override)
      });
    });

    // 2. Custom PPPs
    customPppList.forEach((p) => {
      const override = responderEdits[p.id];
      list.push({
        id: p.id,
        originalName: p.name,
        name: override ? override.name : p.name,
        role: override ? override.role : 'PPP',
        category: override ? override.category : (p.category || 'PHC HTAR'),
        phone: override ? override.phone : (p.personalPhone || 'N/A'),
        isCustom: true,
        isModified: Boolean(override)
      });
    });

    // 3. Built-in St. John Responders (stable ID by original name)
    STJOHN_RESPONDERS.forEach((name) => {
      const stableId = `builtin_stjohn_${name}`;
      const override = responderEdits[stableId];
      list.push({
        id: stableId,
        originalName: name,
        name: override ? override.name : name,
        role: override ? override.role : 'STJOHN',
        category: override ? override.category : 'ST JOHN',
        phone: override ? override.phone : 'N/A',
        isCustom: false,
        isModified: Boolean(override)
      });
    });

    // 4. Custom St. John Responders
    customStJohnList.forEach((name) => {
      const stableId = `custom_stjohn_${name}`;
      const override = responderEdits[stableId];
      list.push({
        id: stableId,
        originalName: name,
        name: override ? override.name : name,
        role: override ? override.role : 'STJOHN',
        category: override ? override.category : 'ST JOHN',
        phone: override ? override.phone : 'N/A',
        isCustom: true,
        isModified: false
      });
    });

    return list;
  }, [customPppList, customStJohnList, responderEdits]);

  // Filtered responders
  const filteredResponders = useMemo(() => {
    return allResponders.filter((item) => {
      if (selectedRole === 'PPP' && item.role !== 'PPP') return false;
      if (selectedRole === 'STJOHN' && item.role !== 'STJOHN') return false;
      if (selectedRole === 'CUSTOM' && !item.isCustom) return false;

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allResponders, selectedRole, selectedCategory, searchQuery]);

  // Summary counts
  const counts = useMemo(() => {
    const total = allResponders.length;
    const pppCount = allResponders.filter((r) => r.role === 'PPP').length;
    const stJohnCount = allResponders.filter((r) => r.role === 'STJOHN').length;
    const customCount = allResponders.filter((r) => r.isCustom).length;
    return { total, pppCount, stJohnCount, customCount };
  }, [allResponders]);

  // Categories list for dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set<string>(AVAILABLE_CATEGORIES);
    allResponders.forEach((r) => set.add(r.category));
    return Array.from(set).sort();
  }, [allResponders]);

  // Submit Add New Responder
  const handleAddNewResponder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim().toUpperCase();
    if (!cleanName) return;

    const cleanPhoneVal = newPhone.trim() || 'N/A';

    if (newRole === 'STJOHN') {
      if (!customStJohnList.includes(cleanName) && !STJOHN_RESPONDERS.includes(cleanName)) {
        const updated = [...customStJohnList, cleanName];
        setCustomStJohnList(updated);
        try {
          localStorage.setItem('poz_custom_stjohn', JSON.stringify(updated));
        } catch (err) {
          console.error(err);
        }

        if (cleanPhoneVal !== 'N/A' || newCategory !== 'ST JOHN') {
          const customKey = `custom_stjohn_${cleanName}`;
          setResponderEdits((prev) => {
            const next = {
              ...prev,
              [customKey]: {
                name: cleanName,
                role: 'STJOHN' as const,
                category: newCategory || 'ST JOHN',
                phone: cleanPhoneVal,
                updatedAt: new Date().toISOString()
              }
            };
            localStorage.setItem('mecc_responder_edits', JSON.stringify(next));
            return next;
          });
        }
        showToast(`Responder St. John "${cleanName}" berjaya ditambah ke pangkalan data!`);
      } else {
        showToast(`Nama "${cleanName}" sudah wujud dalam senarai St. John!`);
      }
    } else {
      const newContact: PPPContact = {
        id: `custom_ppp_${Date.now()}`,
        name: cleanName,
        personalPhone: cleanPhoneVal,
        category: newCategory
      };
      const updated = [...customPppList, newContact];
      setCustomPppList(updated);
      try {
        localStorage.setItem('poz_custom_ppps', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      showToast(`Petugas "${cleanName}" (${newCategory}) berjaya ditambah ke pangkalan data!`);
    }

    setNewName('');
    setNewPhone('');
    setShowAddModal(false);
  };

  // Open Edit Modal for ANY Responder
  const handleOpenEditModal = (item: UnifiedResponderItem) => {
    setEditingResponder(item);
    setEditName(item.name);
    setEditRole(item.role);
    setEditCategory(item.category || (item.role === 'STJOHN' ? 'ST JOHN' : 'PHC HTAR'));
    setEditPhone(item.phone === 'N/A' ? '' : item.phone);
    setShowEditConfirmModal(false);
  };

  // Trigger Confirmation Box before saving responder update
  const handleRequestEditConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResponder || !editName.trim()) return;
    setShowEditConfirmModal(true);
  };

  // Commit Verified Update after Confirmation Box approval
  const handleConfirmUpdateResponder = () => {
    if (!editingResponder) return;

    const cleanName = editName.trim().toUpperCase();
    const cleanPhone = editPhone.trim() || 'N/A';
    const cleanCategory = editRole === 'STJOHN' && !editCategory ? 'ST JOHN' : editCategory;

    if (!editingResponder.isCustom) {
      // Built-in responder (PPP or St. John): persist override in responderEdits
      setResponderEdits((prev) => {
        const next: Record<string, ResponderEditOverride> = {
          ...prev,
          [editingResponder.id]: {
            name: cleanName,
            role: editRole,
            category: cleanCategory,
            phone: cleanPhone,
            updatedAt: new Date().toISOString()
          }
        };
        try {
          localStorage.setItem('mecc_responder_edits', JSON.stringify(next));
        } catch (err) {
          console.error(err);
        }
        return next;
      });
    } else {
      // Custom responder
      if (editingResponder.id.startsWith('custom_stjohn_')) {
        const oldName = editingResponder.originalName;
        if (editRole === 'STJOHN') {
          const updatedStJohn = customStJohnList.map((n) => (n === oldName ? cleanName : n));
          setCustomStJohnList(updatedStJohn);
          localStorage.setItem('poz_custom_stjohn', JSON.stringify(updatedStJohn));

          setResponderEdits((prev) => {
            const next = { ...prev };
            delete next[`custom_stjohn_${oldName}`];
            next[`custom_stjohn_${cleanName}`] = {
              name: cleanName,
              role: 'STJOHN',
              category: cleanCategory,
              phone: cleanPhone,
              updatedAt: new Date().toISOString()
            };
            localStorage.setItem('mecc_responder_edits', JSON.stringify(next));
            return next;
          });
        } else {
          // Converted from custom St. John -> custom PPP
          const updatedStJohn = customStJohnList.filter((n) => n !== oldName);
          setCustomStJohnList(updatedStJohn);
          localStorage.setItem('poz_custom_stjohn', JSON.stringify(updatedStJohn));

          const newPpp: PPPContact = {
            id: `custom_ppp_${Date.now()}`,
            name: cleanName,
            personalPhone: cleanPhone,
            category: cleanCategory
          };
          const updatedPpp = [...customPppList, newPpp];
          setCustomPppList(updatedPpp);
          localStorage.setItem('poz_custom_ppps', JSON.stringify(updatedPpp));

          setResponderEdits((prev) => {
            const next = { ...prev };
            delete next[`custom_stjohn_${oldName}`];
            localStorage.setItem('mecc_responder_edits', JSON.stringify(next));
            return next;
          });
        }
      } else {
        // Custom PPP record
        if (editRole === 'PPP') {
          const updatedPpp = customPppList.map((p) =>
            p.id === editingResponder.id
              ? { ...p, name: cleanName, personalPhone: cleanPhone, category: cleanCategory }
              : p
          );
          setCustomPppList(updatedPpp);
          localStorage.setItem('poz_custom_ppps', JSON.stringify(updatedPpp));
        } else {
          // Converted from custom PPP -> custom St. John
          const updatedPpp = customPppList.filter((p) => p.id !== editingResponder.id);
          setCustomPppList(updatedPpp);
          localStorage.setItem('poz_custom_ppps', JSON.stringify(updatedPpp));

          const updatedStJohn = customStJohnList.includes(cleanName)
            ? customStJohnList
            : [...customStJohnList, cleanName];
          setCustomStJohnList(updatedStJohn);
          localStorage.setItem('poz_custom_stjohn', JSON.stringify(updatedStJohn));

          setResponderEdits((prev) => {
            const next = {
              ...prev,
              [`custom_stjohn_${cleanName}`]: {
                name: cleanName,
                role: 'STJOHN' as const,
                category: cleanCategory || 'ST JOHN',
                phone: cleanPhone,
                updatedAt: new Date().toISOString()
              }
            };
            localStorage.setItem('mecc_responder_edits', JSON.stringify(next));
            return next;
          });
        }
      }
    }

    showToast(`Maklumat responder "${cleanName}" berjaya dikemaskini!`);
    setShowEditConfirmModal(false);
    setEditingResponder(null);
  };

  // Confirm Reset Built-in Override
  const handleConfirmResetOverride = () => {
    if (!resettingResponder) return;
    setResponderEdits((prev) => {
      const next = { ...prev };
      delete next[resettingResponder.id];
      localStorage.setItem('mecc_responder_edits', JSON.stringify(next));
      return next;
    });
    showToast(`Rekod "${resettingResponder.originalName}" telah dikembalikan ke data asal sistem.`);
    setResettingResponder(null);
  };

  // Confirm Delete Custom Responder
  const handleConfirmDeleteCustom = () => {
    if (!deletingResponder) return;

    if (deletingResponder.id.startsWith('custom_stjohn_')) {
      const updated = customStJohnList.filter((n) => n !== deletingResponder.originalName);
      setCustomStJohnList(updated);
      localStorage.setItem('poz_custom_stjohn', JSON.stringify(updated));
      setResponderEdits((prev) => {
        const next = { ...prev };
        delete next[deletingResponder.id];
        localStorage.setItem('mecc_responder_edits', JSON.stringify(next));
        return next;
      });
      showToast(`Responder St. John "${deletingResponder.name}" telah dipadam.`);
    } else {
      const updated = customPppList.filter((p) => p.id !== deletingResponder.id);
      setCustomPppList(updated);
      localStorage.setItem('poz_custom_ppps', JSON.stringify(updated));
      showToast(`Petugas "${deletingResponder.name}" telah dipadam.`);
    }
    setDeletingResponder(null);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/40 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check size={18} />
          </div>
          <p className="text-xs sm:text-sm font-semibold">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
              <Users size={14} /> MECC MANAGEMENT BOARD • PANGKALAN DATA RESPONDER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              MECC Management Board: Direktori Responder
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Senarai lengkap semua Penolong Pegawai Perubatan (PPP), Responder St. John Ambulance Malaysia, dan petugas kesihatan. Klik butang <strong>Kemaskini</strong> pada mana-mana baris untuk menyunting nama, stesen, atau nombor telefon responder.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-rose-900/30"
            >
              <UserPlus size={16} />
              <span>+ Tambah Responder Baru</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-bold border border-slate-700 transition-all"
            >
              <span>Tetapan Pangkalan Data</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Quick Stats Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60 font-mono tabular-nums">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] font-sans text-slate-400 font-semibold block uppercase">Jumlah Responder</span>
            <span className="text-xl sm:text-2xl font-black text-white">{counts.total}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] font-sans text-slate-400 font-semibold block uppercase">PPP & Paramedik</span>
            <span className="text-xl sm:text-2xl font-black text-rose-400">{counts.pppCount}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] font-sans text-slate-400 font-semibold block uppercase">St. John Responders</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">{counts.stJohnCount}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] font-sans text-slate-400 font-semibold block uppercase">Ditambah Manual</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{counts.customCount}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, stesen, no telefon..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter size={13} /> Jenis:
          </span>
          {[
            { id: 'ALL', label: `Semua (${counts.total})` },
            { id: 'PPP', label: `PPP (${counts.pppCount})` },
            { id: 'STJOHN', label: `St. John (${counts.stJohnCount})` },
            { id: 'CUSTOM', label: `Manual (${counts.customCount})` }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedRole(pill.id as 'ALL' | 'PPP' | 'STJOHN' | 'CUSTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === pill.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {/* Category Dropdown */}
          <div className="ml-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-xl border-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ALL">Semua Stesen / Kategori</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Responders Table List View */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Senarai Terperinci Responder</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono tabular-nums">
              {filteredResponders.length} / {counts.total}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
          >
            <Plus size={14} />
            <span>Tambah Responder Baru</span>
          </button>
        </div>

        {filteredResponders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users size={40} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Tiada responder ditemui</p>
            <p className="text-xs text-slate-500">Sila semak semula kata carian atau tetapan penapis anda.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedRole('ALL'); setSelectedCategory('ALL'); }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Set Semula Carian
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Bil</th>
                  <th className="py-3 px-4">Nama Responder</th>
                  <th className="py-3 px-4">Peranan / Jawatan</th>
                  <th className="py-3 px-4">Stesen / Kategori</th>
                  <th className="py-3 px-4">No. Telefon Perhubungan</th>
                  <th className="py-3 px-4 text-center">Sumber Rekod</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredResponders.map((item, index) => {
                  const cleanPhone = item.phone.replace(/[^0-9]/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? '6' + cleanPhone : cleanPhone;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Index */}
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-mono tabular-nums">
                        {index + 1}
                      </td>

                      {/* Name with initials badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            item.role === 'STJOHN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                              {item.name}
                            </span>
                            {item.isCustom ? (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                Ditambah oleh Pengguna
                              </span>
                            ) : item.isModified ? (
                              <span className="text-[10px] text-sky-600 font-semibold">
                                Dikemaskini (Asal: {item.originalName})
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="py-3 px-4">
                        {item.role === 'STJOHN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            St. John Responder
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            Penolong Pegawai Perubatan (PPP)
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Building2 size={12} className="text-slate-400" />
                          {item.category}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4">
                        {item.phone && item.phone !== 'N/A' ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono tabular-nums text-xs font-bold text-slate-800">
                              {item.phone}
                            </span>
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${item.phone}`}
                                title={`Panggil ${item.phone}`}
                                className="p-1 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
                              >
                                <Phone size={12} />
                              </a>
                              {cleanPhone.length >= 9 && (
                                <a
                                  href={`https://wa.me/${waPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Buka WhatsApp"
                                  className="p-1 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
                                >
                                  <MessageSquare size={12} />
                                </a>
                              )}
                              <button
                                onClick={() => handleCopyPhone(item.id, item.phone)}
                                title="Salin nombor telefon"
                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                              >
                                {copiedId === item.id ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="text-xs text-slate-400 hover:text-rose-600 italic underline decoration-dotted"
                          >
                            + Tambah nombor
                          </button>
                        )}
                      </td>

                      {/* Source badge */}
                      <td className="py-3 px-4 text-center">
                        {item.isCustom ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Manual
                          </span>
                        ) : item.isModified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            Dikemaskini
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Sistem Asal
                          </span>
                        )}
                      </td>

                      {/* Actions: Edit (for ALL responders) + Reset / Delete */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title={`Kemaskini nama & maklumat ${item.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white border border-slate-200 hover:border-rose-600 transition-all"
                          >
                            <Edit2 size={12} />
                            <span>Kemaskini</span>
                          </button>

                          {!item.isCustom && item.isModified && (
                            <button
                              type="button"
                              onClick={() => setResettingResponder(item)}
                              title="Kembalikan ke rekod asal sistem"
                              className="p-1.5 rounded-lg text-amber-600 hover:text-white hover:bg-amber-600 border border-amber-200 transition-colors"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}

                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => setDeletingResponder(item)}
                              title="Padam rekod responder manual ini"
                              className="p-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Tambah Responder Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-rose-950 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-md">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Tambah Responder Baru</h3>
                  <p className="text-xs text-slate-300">Simpan maklumat petugas ke pangkalan data</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNewResponder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis Petugas / Peranan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewRole('PPP'); setNewCategory('PHC HTAR'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      newRole === 'PPP'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    PPP / Paramedik
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewRole('STJOHN'); setNewCategory('ST JOHN'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      newRole === 'STJOHN'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    St. John Ambulance
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Penuh / Nama Panggilan *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: MUHAMMAD FARHAN"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold uppercase focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Stesen / Kategori
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                >
                  {AVAILABLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="HOSPITAL BANTING">HOSPITAL BANTING</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  No. Telefon Peribadi {newRole === 'STJOHN' && '(Pilihan)'}
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Contoh: 0198765432"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/30 flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  <span>Simpan ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Kemaskini Nama & Detail Responder */}
      {editingResponder && !showEditConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-rose-950 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-md">
                  <Edit2 size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Kemaskini Maklumat Responder</h3>
                  <p className="text-xs text-slate-300">Sunting nama, peranan, stesen & nombor telefon</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingResponder(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestEditConfirmation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Peranan / Jawatan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditRole('PPP');
                      if (editCategory === 'ST JOHN') setEditCategory('PHC HTAR');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      editRole === 'PPP'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    PPP / Paramedik
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditRole('STJOHN');
                      setEditCategory('ST JOHN');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      editRole === 'STJOHN'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    St. John Responder
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Responder *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Masukkan nama responder..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold uppercase focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Stesen / Kategori Bertugas
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {!categoryOptions.includes('HOSPITAL BANTING') && (
                    <option value="HOSPITAL BANTING">HOSPITAL BANTING</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  No. Telefon Perhubungan
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Contoh: 0123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingResponder(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Semak & Sahkan Kemaskini</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirmation Box (Kotak Pengesahan Kemaskini Responder) */}
      {editingResponder && showEditConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-amber-50/70">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Pengesahan Kemaskini Responder
                </h3>
                <p className="text-xs text-slate-600">
                  Sila semak dan sahkan perubahan maklumat responder sebelum disimpan ke pangkalan data.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200 text-xs">
                <div className="p-3.5 grid grid-cols-3 gap-2 items-center">
                  <span className="font-bold text-slate-500 uppercase">Nama</span>
                  <span className="text-slate-500 line-through truncate">{editingResponder.name}</span>
                  <span className="font-black text-emerald-700 truncate">{editName.trim().toUpperCase()}</span>
                </div>
                <div className="p-3.5 grid grid-cols-3 gap-2 items-center">
                  <span className="font-bold text-slate-500 uppercase">Peranan</span>
                  <span className="text-slate-500">{editingResponder.role === 'STJOHN' ? 'St. John' : 'PPP'}</span>
                  <span className="font-black text-emerald-700">{editRole === 'STJOHN' ? 'St. John' : 'PPP'}</span>
                </div>
                <div className="p-3.5 grid grid-cols-3 gap-2 items-center">
                  <span className="font-bold text-slate-500 uppercase">Stesen</span>
                  <span className="text-slate-500 truncate">{editingResponder.category}</span>
                  <span className="font-black text-emerald-700 truncate">{editCategory}</span>
                </div>
                <div className="p-3.5 grid grid-cols-3 gap-2 items-center">
                  <span className="font-bold text-slate-500 uppercase">No. Telefon</span>
                  <span className="font-mono text-slate-500 truncate">{editingResponder.phone || 'N/A'}</span>
                  <span className="font-mono font-black text-emerald-700 truncate">{editPhone.trim() || 'N/A'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Perubahan ini akan dikemaskini secara menyeluruh pada Direktori Responder, POZ Updater, Dashboard Ambulans, dan Rollcall Klinik.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Kembali Sunting
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditConfirmModal(false);
                    setEditingResponder(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpdateResponder}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Check size={16} />
                  <span>Ya, Sahkan & Simpan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Confirmation Box */}
      {deletingResponder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Padam Rekod Responder?</h3>
              <p className="text-xs text-slate-500">
                Adakah anda pasti mahu memadam responder <strong className="text-slate-900">{deletingResponder.name}</strong> ({deletingResponder.category}) daripada pangkalan data?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingResponder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustom}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                Ya, Padam Rekod
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Reset Built-in Override Confirmation Box */}
      {resettingResponder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw size={22} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Kembalikan Rekod Asal Sistem?</h3>
              <p className="text-xs text-slate-500">
                Perubahan pada <strong className="text-slate-900">{resettingResponder.name}</strong> akan dikembalikan kepada rekod asal sistem (<strong className="text-slate-900">{resettingResponder.originalName}</strong>).
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResettingResponder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetOverride}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
              >
                Ya, Set Semula Asal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
