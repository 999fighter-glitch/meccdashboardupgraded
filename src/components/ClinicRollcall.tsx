/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Phone,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Edit2,
  X,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Trash2,
  FileText,
  Zap
} from 'lucide-react';
import {
  Shift,
  OncallClinic,
  ClinicRollcallEntry,
  ClinicRollcallStatus,
  ShiftRollcallMap,
  RollcallTemplates,
  PPPContact
} from '../types.ts';
import {
  SHIFT_DETAILS,
  DEFAULT_ROLLCALL_MESSAGE,
  DEFAULT_QUICK_REPLY_MESSAGE,
  CLINIC_ROLLCALL_STATUS_CONFIG
} from '../constants.ts';

interface ClinicRollcallProps {
  shift: Shift;
  setShift: (s: Shift) => void;
  formattedDate: string;
  reporter: string;
  setReporter: (r: string) => void;
  oncallClinics: OncallClinic[];
  setOncallClinics: React.Dispatch<React.SetStateAction<OncallClinic[]>>;
  shiftRollcalls: ShiftRollcallMap;
  setShiftRollcalls: React.Dispatch<React.SetStateAction<ShiftRollcallMap>>;
  rollcallTemplates: RollcallTemplates;
  setRollcallTemplates: React.Dispatch<React.SetStateAction<RollcallTemplates>>;
  allPPPList: PPPContact[];
  allStJohnResponders: string[];
}

const getEmptyEntry = (): ClinicRollcallEntry => ({
  status: 'PENDING',
  rollcallSent: false,
  oncallName: '',
  oncallPhone: '',
  ambulanceStatus: '',
  activatedByMecc: false,
  quickReplySent: false
});

const getCurrentTimeLabel = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatWhatsAppPhone = (raw: string): string => {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  if (!digits || digits.length < 9) return '';
  // Skip Malaysian landlines like 03-... unless mobile 01... or international 601...
  if (digits.startsWith('01')) return '6' + digits;
  if (digits.startsWith('601')) return digits;
  if (digits.length >= 10 && !digits.startsWith('03')) {
    return digits.startsWith('0') ? '6' + digits : digits;
  }
  return '';
};

export const formatQuickReplyText = (template: string, responderName: string): string => {
  const cleanName = responderName.trim().toUpperCase();
  const displayTarget = cleanName || '...name ..';
  const placeholderRegex = /(\.\.\.\s*name\s*\.\.|\.\.\.name\.\.|\{name\}|\[name\])/gi;
  if (placeholderRegex.test(template)) {
    return template.replace(placeholderRegex, displayTarget);
  }
  return cleanName ? `${template.trim()} (${cleanName})` : template;
};

export const ClinicRollcall: React.FC<ClinicRollcallProps> = ({
  shift,
  setShift,
  formattedDate,
  reporter,
  setReporter,
  oncallClinics,
  setOncallClinics,
  shiftRollcalls,
  setShiftRollcalls,
  rollcallTemplates,
  setRollcallTemplates,
  allPPPList,
  allStJohnResponders
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClinicRollcallStatus>('ALL');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Modals
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicRegion, setNewClinicRegion] = useState('PKD KLANG');
  const [newClinicPhone, setNewClinicPhone] = useState('');

  const [editingClinicPhone, setEditingClinicPhone] = useState<OncallClinic | null>(null);
  const [tempClinicPhone, setTempClinicPhone] = useState('');
  const [tempClinicName, setTempClinicName] = useState('');

  // Custom Quick Reply per-clinic modal
  const [customReplyTarget, setCustomReplyTarget] = useState<{
    clinic: OncallClinic;
    entry: ClinicRollcallEntry;
    draftMessage: string;
  } | null>(null);

  // Reset Shift Checklist Confirmation Modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // Summary Report Preview Modal
  const [showSummaryPreview, setShowSummaryPreview] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Current shift entries
  const currentShiftMap = useMemo(() => {
    return shiftRollcalls[shift] || {};
  }, [shiftRollcalls, shift]);

  // Helper to update a single clinic's rollcall entry in current shift
  const updateClinicEntry = (
    clinicId: string,
    updater: (prev: ClinicRollcallEntry) => ClinicRollcallEntry
  ) => {
    setShiftRollcalls((prev) => {
      const shiftMap = prev[shift] || {};
      const existing = shiftMap[clinicId] || getEmptyEntry();
      const updatedEntry = updater(existing);
      return {
        ...prev,
        [shift]: {
          ...shiftMap,
          [clinicId]: updatedEntry
        }
      };
    });
  };

  // Responder lookup map for auto-filling phone when selecting from datalist
  const responderLookup = useMemo(() => {
    const map = new Map<string, string>();
    allPPPList.forEach((p) => {
      map.set(p.name.toUpperCase(), p.personalPhone !== 'N/A' ? p.personalPhone : '');
      map.set(`PPP ${p.name.toUpperCase()}`, p.personalPhone !== 'N/A' ? p.personalPhone : '');
    });
    return map;
  }, [allPPPList]);

  const responderSuggestions = useMemo(() => {
    const names = new Set<string>();
    allPPPList.forEach((p) => names.add(`PPP ${p.name.toUpperCase()}`));
    allStJohnResponders.forEach((n) => names.add(n.toUpperCase()));
    return Array.from(names).sort();
  }, [allPPPList, allStJohnResponders]);

  // Step 1: Send Rollcall WhatsApp -> Automatically sets status to ROLLCALL_SENT
  const handleMarkRollcallSent = (clinic: OncallClinic) => {
    const timeStr = getCurrentTimeLabel();
    updateClinicEntry(clinic.id, (prev) => ({
      ...prev,
      status: 'ROLLCALL_SENT',
      rollcallSent: true,
      sentAt: timeStr
    }));
    showToast(`Rollcall WhatsApp dihantar ke ${clinic.name} — Status: ROLLCALL SENT (${timeStr})`);
  };

  // Copy Rollcall Message & Mark Sent
  const handleCopyRollcallAndMarkSent = (clinic: OncallClinic) => {
    navigator.clipboard.writeText(rollcallTemplates.rollcallMessage);
    setCopiedId(`rc_${clinic.id}`);
    setTimeout(() => setCopiedId(null), 2000);
    handleMarkRollcallSent(clinic);
  };

  // Step 2: Handle Oncall Name input (auto-fills phone if known responder)
  const handleOncallNameChange = (clinicId: string, value: string) => {
    const upper = value.toUpperCase();
    const matchedPhone = responderLookup.get(upper.trim());
    updateClinicEntry(clinicId, (prev) => ({
      ...prev,
      oncallName: value,
      oncallPhone: matchedPhone ? matchedPhone : prev.oncallPhone
    }));
  };

  // Step 3: Manual MECC Activation (ACTIVE or STANDBY or OFF or PENDING)
  const handleManualMeccStatus = (clinic: OncallClinic, newStatus: ClinicRollcallStatus) => {
    const timeStr = getCurrentTimeLabel();
    const isMeccActivation = newStatus === 'ACTIVE' || newStatus === 'STANDBY';
    updateClinicEntry(clinic.id, (prev) => ({
      ...prev,
      status: newStatus,
      rollcallSent: newStatus === 'PENDING' ? false : true,
      activatedByMecc: isMeccActivation,
      activatedAt: isMeccActivation ? timeStr : undefined
    }));

    if (newStatus === 'ACTIVE') {
      showToast(`${clinic.name} diaktifkan secara manual oleh MECC: ACTIVE (${timeStr})`);
    } else if (newStatus === 'STANDBY') {
      showToast(`${clinic.name} ditetapkan secara manual oleh MECC: STANDBY (${timeStr})`);
    } else {
      showToast(`Status ${clinic.name} dikemaskini kepada ${CLINIC_ROLLCALL_STATUS_CONFIG[newStatus].shortLabel}`);
    }
  };

  // Step 4: Quick Reply Sent marker
  const handleMarkQuickReplySent = (clinic: OncallClinic, customText?: string) => {
    const timeStr = getCurrentTimeLabel();
    if (customText) {
      navigator.clipboard.writeText(customText);
    }
    updateClinicEntry(clinic.id, (prev) => ({
      ...prev,
      quickReplySent: true,
      quickReplySentAt: timeStr
    }));
    showToast(`Quick Reply dihantar kepada petugas ${clinic.name} (${timeStr})`);
  };

  const handleCopyQuickReply = (clinic: OncallClinic, entry: ClinicRollcallEntry) => {
    const msg = formatQuickReplyText(rollcallTemplates.quickReplyMessage, entry.oncallName);
    navigator.clipboard.writeText(msg);
    setCopiedId(`qr_${clinic.id}`);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Quick Reply "${msg}" disalin!`);
  };

  // Regions list
  const regionOptions = useMemo(() => {
    const set = new Set<string>(['PKD KLANG', 'PKD BANTING']);
    oncallClinics.forEach((c) => set.add(c.region));
    return Array.from(set);
  }, [oncallClinics]);

  // Filtered clinics
  const filteredClinics = useMemo(() => {
    return oncallClinics.filter((clinic) => {
      const entry = currentShiftMap[clinic.id] || getEmptyEntry();
      if (regionFilter !== 'ALL' && clinic.region !== regionFilter) return false;
      if (statusFilter !== 'ALL' && entry.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          clinic.name.toLowerCase().includes(q) ||
          clinic.region.toLowerCase().includes(q) ||
          clinic.whatsappPhone.toLowerCase().includes(q) ||
          entry.oncallName.toLowerCase().includes(q) ||
          entry.ambulanceStatus.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [oncallClinics, currentShiftMap, regionFilter, statusFilter, searchQuery]);

  // Shift Summary Metrics
  const stats = useMemo(() => {
    let pending = 0;
    let rollcallSent = 0;
    let active = 0;
    let standby = 0;
    let off = 0;

    oncallClinics.forEach((c) => {
      const st = currentShiftMap[c.id]?.status || 'PENDING';
      if (st === 'PENDING') pending++;
      else if (st === 'ROLLCALL_SENT') rollcallSent++;
      else if (st === 'ACTIVE') active++;
      else if (st === 'STANDBY') standby++;
      else if (st === 'OFF') off++;
    });

    const total = oncallClinics.length;
    const contacted = total - pending;
    const progressPct = total > 0 ? Math.round((contacted / total) * 100) : 0;

    return { total, pending, rollcallSent, active, standby, off, contacted, progressPct };
  }, [oncallClinics, currentShiftMap]);

  // Quick greeting updater for Rollcall WhatsApp Template
  const applyGreetingToTemplate = (greeting: string) => {
    setRollcallTemplates((prev) => {
      const updatedMsg = prev.rollcallMessage.replace(
        /SELAMAT\s+(PAGI|PETANG|MALAM)\.*/i,
        greeting
      );
      return { ...prev, rollcallMessage: updatedMsg };
    });
    showToast(`Ucapan template ditukar kepada "${greeting}"`);
  };

  // Add New Custom Oncall Clinic
  const handleAddClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim()) return;
    const added: OncallClinic = {
      id: `rc_custom_${Date.now()}`,
      name: newClinicName.trim(),
      region: newClinicRegion,
      whatsappPhone: newClinicPhone.trim(),
      isCustom: true
    };
    const next = [...oncallClinics, added];
    setOncallClinics(next);
    localStorage.setItem('mecc_clinic_rollcall_list', JSON.stringify(next));
    setNewClinicName('');
    setNewClinicPhone('');
    setShowAddClinicModal(false);
    showToast(`Klinik "${added.name}" ditambah ke senarai Rollcall!`);
  };

  // Save edited clinic WhatsApp number / name
  const handleSaveClinicDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinicPhone || !tempClinicName.trim()) return;
    const next = oncallClinics.map((c) =>
      c.id === editingClinicPhone.id
        ? { ...c, name: tempClinicName.trim(), whatsappPhone: tempClinicPhone.trim() }
        : c
    );
    setOncallClinics(next);
    localStorage.setItem('mecc_clinic_rollcall_list', JSON.stringify(next));
    showToast(`Maklumat hubungan "${tempClinicName.trim()}" telah dikemaskini.`);
    setEditingClinicPhone(null);
  };

  // Delete custom clinic
  const handleDeleteCustomClinic = (clinic: OncallClinic) => {
    const next = oncallClinics.filter((c) => c.id !== clinic.id);
    setOncallClinics(next);
    localStorage.setItem('mecc_clinic_rollcall_list', JSON.stringify(next));
    showToast(`Klinik "${clinic.name}" telah dipadam.`);
  };

  // Reset current shift checklist
  const handleResetShiftChecklist = () => {
    setShiftRollcalls((prev) => ({
      ...prev,
      [shift]: {}
    }));
    setShowResetConfirm(false);
    showToast(`Ceklist Rollcall bagi Shif ${shift} telah diset semula.`);
  };

  // Generate Shift Rollcall Summary Report for WhatsApp
  const generateRollcallSummaryReport = () => {
    const shiftInfo = SHIFT_DETAILS[shift];
    let text = `*LAPORAN ROLLCALL ONCALL KLINIK (MECC HTAR)*\n`;
    text += `📅 *Tarikh*: ${formattedDate}\n`;
    text += `🕒 *Syif*: ${shift} (${shiftInfo.time} H)\n`;
    text += `───────────────────────────\n\n`;

    oncallClinics.forEach((clinic, idx) => {
      const entry = currentShiftMap[clinic.id] || getEmptyEntry();
      const statusBadge =
        entry.status === 'ACTIVE'
          ? '🟢 *ACTIVE (MECC)*'
          : entry.status === 'STANDBY'
          ? '🟡 *STANDBY (MECC)*'
          : entry.status === 'ROLLCALL_SENT'
          ? '🔵 *ROLLCALL SENT (Menunggu Reply)*'
          : entry.status === 'OFF'
          ? '🔴 *TIDAK AKTIF / ROSAK*'
          : '⚪ *BELUM ROLLCALL*';

      text += `${idx + 1}. *${clinic.name}* (${clinic.region})\n`;
      text += `   Status: ${statusBadge}\n`;
      if (entry.oncallName.trim()) {
        text += `   Oncall: ${entry.oncallName.trim().toUpperCase()}${entry.oncallPhone ? ` (${entry.oncallPhone})` : ''}\n`;
      }
      if (entry.ambulanceStatus.trim()) {
        text += `   Ambulans: ${entry.ambulanceStatus.trim()}\n`;
      }
    });

    text += `\n───────────────────────────\n`;
    text += `📊 *Ringkasan Rollcall Syif ${shift}*:\n`;
    text += `✅ Active (MECC): ${stats.active}\n`;
    text += `🟡 Standby (MECC): ${stats.standby}\n`;
    text += `📨 Rollcall Sent: ${stats.rollcallSent}\n`;
    text += `⏳ Belum Rollcall: ${stats.pending}\n`;
    if (reporter.trim()) {
      text += `📝 Dilaporkan oleh: ${reporter.trim().toUpperCase()}`;
    }
    return text;
  };

  const summaryReportText = generateRollcallSummaryReport();

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Datalist for responder name suggestions */}
      <datalist id="mecc-responder-suggestions">
        {responderSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Operational Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide">
              <ClipboardCheck size={14} /> MECC HTAR • CEKLIST ROLLCALL ONCALL KLINIK SETIAP SHIF
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Rollcall Oncall Klinik
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Hantar mesej Rollcall WhatsApp mengikut template rasmi setiap shif. Apabila WhatsApp dihantar, status klinik bertukar automatik kepada <strong>Rollcall Sent</strong>. Setelah menerima maklum balas klinik oncall, aktifkan secara manual kepada <strong>Active</strong> atau <strong>Standby</strong> dan balas menggunakan <strong>Quick Reply Custom</strong>.
            </p>
          </div>

          {/* Right Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowTemplateEditor((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                showTemplateEditor
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              <Sliders size={15} />
              <span>Template Wasap & Quick Reply</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSummaryPreview(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/40 transition-all"
            >
              <FileText size={15} />
              <span>Ringkasan Rollcall</span>
            </button>
          </div>
        </div>

        {/* Shift Progress Bar & Tabular Metric Grid */}
        <div className="mt-6 pt-6 border-t border-slate-700/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider">
              Kemajuan Ceklist Rollcall Shif {shift} ({SHIFT_DETAILS[shift].time})
            </span>
            <span className="font-mono tabular-nums font-bold text-emerald-300">
              {stats.contacted}/{stats.total} Klinik Dihubungi ({stats.progressPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400 transition-all duration-300"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono tabular-nums">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] font-sans text-slate-400 font-bold block uppercase">Jumlah Klinik</span>
              <span className="text-xl font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
              <span className="text-[10px] font-sans text-slate-400 font-bold block uppercase">Belum Rollcall</span>
              <span className="text-xl font-black text-slate-300">{stats.pending}</span>
            </div>
            <div className="bg-sky-950/60 p-3 rounded-xl border border-sky-500/40 text-center">
              <span className="text-[10px] font-sans text-sky-300 font-bold block uppercase">Rollcall Sent</span>
              <span className="text-xl font-black text-sky-400">{stats.rollcallSent}</span>
            </div>
            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/40 text-center">
              <span className="text-[10px] font-sans text-emerald-300 font-bold block uppercase">Active (MECC)</span>
              <span className="text-xl font-black text-emerald-400">{stats.active}</span>
            </div>
            <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-500/40 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-sans text-amber-300 font-bold block uppercase">Standby (MECC)</span>
              <span className="text-xl font-black text-amber-400">{stats.standby}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Panel: WhatsApp Rollcall Template & Custom Quick Reply Editor */}
      {showTemplateEditor && (
        <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-lg space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" />
                Tetapan Template WhatsApp Rollcall & Quick Reply Custom
              </h2>
              <p className="text-xs text-slate-500">
                Perubahan disimpan secara automatik. Gunakan <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-rose-600">...name ..</code> atau <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-rose-600">{'{name}'}</code> untuk gantian nama petugas oncall.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplateEditor(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Rollcall WhatsApp Template */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  1. Template Mesej Rollcall Klinik
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyGreetingToTemplate('SELAMAT PAGI..')}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-white border border-slate-200 hover:bg-amber-50 text-slate-700"
                  >
                    Pagi
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGreetingToTemplate('SELAMAT PETANG..')}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-white border border-slate-200 hover:bg-sky-50 text-slate-700"
                  >
                    Petang
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGreetingToTemplate('SELAMAT MALAM..')}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-white border border-slate-200 hover:bg-indigo-50 text-slate-700"
                  >
                    Malam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRollcallTemplates((prev) => ({
                        ...prev,
                        rollcallMessage: DEFAULT_ROLLCALL_MESSAGE
                      }));
                      showToast('Template Rollcall dikembalikan ke format asal.');
                    }}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 ml-1"
                  >
                    Reset Asal
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                value={rollcallTemplates.rollcallMessage}
                onChange={(e) =>
                  setRollcallTemplates((prev) => ({
                    ...prev,
                    rollcallMessage: e.target.value
                  }))
                }
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Right: Custom Quick Reply Template */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    2. Quick Reply Message (Custom)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRollcallTemplates((prev) => ({
                        ...prev,
                        quickReplyMessage: DEFAULT_QUICK_REPLY_MESSAGE
                      }));
                      showToast('Template Quick Reply dikembalikan ke format asal.');
                    }}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                  >
                    Reset Asal
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={rollcallTemplates.quickReplyMessage}
                  onChange={(e) =>
                    setRollcallTemplates((prev) => ({
                      ...prev,
                      quickReplyMessage: e.target.value
                    }))
                  }
                  placeholder="THANK YOU ...name ..& SELAMAT BERTUGAS"
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-bold text-slate-800 leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">
                    Pratonton Automatik (Contoh Petugas: PPP MUSTAKIM):
                  </span>
                  <p className="font-mono text-xs font-bold text-emerald-950">
                    {formatQuickReplyText(rollcallTemplates.quickReplyMessage, 'PPP MUSTAKIM')}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                <strong>Tip:</strong> Anda juga boleh klik ikon pensel pada butang Quick Reply setiap klinik untuk mengubah suai mesej khas sebelum menghantarnya.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Control Bar & Filters */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Shift Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-600" /> Pilihan Shif Rollcall
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['AM', 'PM', 'ON'] as Shift[]).map((s) => {
                const isSelected = shift === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>Shif {s}</div>
                    <div className="text-[10px] opacity-80 font-mono">{SHIFT_DETAILS[s].time}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-rose-600" /> Tarikh Rollcall
            </label>
            <div className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800">
              {formattedDate}
            </div>
          </div>

          {/* MECC Operator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-amber-600" /> Pegawai MECC Bertugas
            </label>
            <input
              type="text"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              placeholder="Contoh: PPP AMIRUN"
              className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Search, Filter & Checklist Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari klinik atau nama oncall..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Zon ({oncallClinics.length})</option>
              {regionOptions.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-1">
              <Filter size={13} className="text-slate-400 ml-1" />
              {(
                [
                  { id: 'ALL', label: 'Semua' },
                  { id: 'PENDING', label: `Belum (${stats.pending})` },
                  { id: 'ROLLCALL_SENT', label: `Rollcall Sent (${stats.rollcallSent})` },
                  { id: 'ACTIVE', label: `Active (${stats.active})` },
                  { id: 'STANDBY', label: `Standby (${stats.standby})` }
                ] as { id: 'ALL' | ClinicRollcallStatus; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    statusFilter === item.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddClinicModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5"
            >
              <Plus size={14} /> Tambah Klinik Oncall
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Reset Shif {shift}
            </button>
          </div>
        </div>
      </div>

      {/* Main High-Density Shift Rollcall Checklist Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-emerald-600" />
            <h2 className="text-base font-black text-slate-900">
              Senarai Semak (Checklist) Rollcall Klinik — Shif {shift}
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono tabular-nums">
              {filteredClinics.length} Klinik
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Klik <strong>Rollcall WA</strong> untuk hantar mesej & tukar status automatik ke <strong>Rollcall Sent</strong>
          </span>
        </div>

        {filteredClinics.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ClipboardCheck size={38} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Tiada klinik sepadan ditemui</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRegionFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Set Semula Penapis
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">Cek</th>
                  <th className="py-3 px-3.5 min-w-[190px]">Klinik Oncall & No. WA</th>
                  <th className="py-3 px-3 min-w-[165px]">1. Hantar Rollcall</th>
                  <th className="py-3 px-3 min-w-[165px]">Status Semasa</th>
                  <th className="py-3 px-3 min-w-[230px]">2. Reply Klinik (Oncall & Ambulans)</th>
                  <th className="py-3 px-3 min-w-[185px]">3. Aktifkan Manual (MECC)</th>
                  <th className="py-3 px-3.5 min-w-[195px]">4. Quick Reply Custom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredClinics.map((clinic) => {
                  const entry = currentShiftMap[clinic.id] || getEmptyEntry();
                  const stCfg = CLINIC_ROLLCALL_STATUS_CONFIG[entry.status];

                  // Build WhatsApp URL for Rollcall
                  const clinicWaDigits = formatWhatsAppPhone(clinic.whatsappPhone);
                  const encodedRollcall = encodeURIComponent(rollcallTemplates.rollcallMessage);
                  const rollcallWaUrl = clinicWaDigits
                    ? `https://api.whatsapp.com/send?phone=${clinicWaDigits}&text=${encodedRollcall}`
                    : `https://api.whatsapp.com/send?text=${encodedRollcall}`;

                  // Build WhatsApp URL for Quick Reply (prefer responder personal phone if entered, else clinic WA)
                  const responderWaDigits = formatWhatsAppPhone(entry.oncallPhone) || clinicWaDigits;
                  const formattedQuickReply = formatQuickReplyText(
                    rollcallTemplates.quickReplyMessage,
                    entry.oncallName
                  );
                  const encodedQuickReply = encodeURIComponent(formattedQuickReply);
                  const quickReplyWaUrl = responderWaDigits
                    ? `https://api.whatsapp.com/send?phone=${responderWaDigits}&text=${encodedQuickReply}`
                    : `https://api.whatsapp.com/send?text=${encodedQuickReply}`;

                  const isChecked = entry.status !== 'PENDING';

                  return (
                    <tr
                      key={clinic.id}
                      className={`transition-colors hover:bg-slate-50/70 ${
                        entry.status === 'ACTIVE'
                          ? 'bg-emerald-50/25'
                          : entry.status === 'STANDBY'
                          ? 'bg-amber-50/25'
                          : entry.status === 'ROLLCALL_SENT'
                          ? 'bg-sky-50/20'
                          : entry.status === 'OFF'
                          ? 'bg-rose-50/20 opacity-85'
                          : 'bg-white'
                      }`}
                    >
                      {/* Checklist Checkbox Indicator */}
                      <td className="py-3.5 px-3 text-center align-top">
                        <button
                          type="button"
                          onClick={() =>
                            handleManualMeccStatus(
                              clinic,
                              entry.status === 'PENDING' ? 'ROLLCALL_SENT' : 'PENDING'
                            )
                          }
                          title={isChecked ? 'Tandakan Belum Rollcall' : 'Tandakan Rollcall Sent'}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                            entry.status === 'ACTIVE'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : entry.status === 'STANDBY'
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : entry.status === 'ROLLCALL_SENT'
                              ? 'bg-sky-600 border-sky-600 text-white'
                              : entry.status === 'OFF'
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-emerald-500'
                          }`}
                        >
                          <Check size={14} />
                        </button>
                      </td>

                      {/* Clinic Name, Region & WhatsApp Phone */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {clinic.region}
                            </span>
                            <div className="font-black text-slate-900 text-xs sm:text-sm mt-1">
                              {clinic.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClinicPhone(clinic);
                                setTempClinicName(clinic.name);
                                setTempClinicPhone(clinic.whatsappPhone);
                              }}
                              title="Kemaskini nama / no WhatsApp klinik"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                              <Edit2 size={12} />
                            </button>
                            {clinic.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomClinic(clinic)}
                                title="Padam klinik tambahan"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[11px] font-mono tabular-nums text-slate-500">
                          <Phone size={10} className="text-slate-400 shrink-0" />
                          {clinic.whatsappPhone ? (
                            <span>{clinic.whatsappPhone}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClinicPhone(clinic);
                                setTempClinicName(clinic.name);
                                setTempClinicPhone('');
                              }}
                              className="text-rose-600 hover:underline font-sans italic"
                            >
                              + Set No. WA
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Step 1: Hantar Rollcall WhatsApp */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <a
                              href={rollcallWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleMarkRollcallSent(clinic)}
                              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                entry.rollcallSent
                                  ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Send size={12} />
                              <span>{entry.rollcallSent ? 'Hantar Semula' : 'Rollcall WA'}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyRollcallAndMarkSent(clinic)}
                              title="Salin mesej Rollcall & tandakan Rollcall Sent"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                            >
                              {copiedId === `rc_${clinic.id}` ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>

                          {entry.sentAt && (
                            <span className="text-[10px] font-mono tabular-nums text-sky-700 font-semibold flex items-center gap-1">
                              <Check size={10} /> Dihantar {entry.sentAt}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 align-top">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black border ${stCfg.bg} ${stCfg.border}`}>
                          <span className={`w-2 h-2 rounded-full ${stCfg.dot}`} />
                          <span>{stCfg.shortLabel}</span>
                        </div>
                        {entry.activatedByMecc && (entry.status === 'ACTIVE' || entry.status === 'STANDBY') && (
                          <div className="mt-1 text-[10px] font-semibold text-slate-600 leading-tight">
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                              <ShieldCheck size={11} /> Activated by MECC
                            </span>
                            {entry.activatedAt && (
                              <span className="block font-mono tabular-nums text-slate-400">
                                Masa: {entry.activatedAt}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Step 2: Reply Details from Clinic (Oncall Name, Phone & Ambulance Status) */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            list="mecc-responder-suggestions"
                            value={entry.oncallName}
                            onChange={(e) => handleOncallNameChange(clinic.id, e.target.value)}
                            placeholder="Nama Oncall (cth: PPP MUSTAKIM)"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={entry.oncallPhone}
                              onChange={(e) =>
                                updateClinicEntry(clinic.id, (prev) => ({
                                  ...prev,
                                  oncallPhone: e.target.value
                                }))
                              }
                              placeholder="No. Tel Oncall..."
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono tabular-nums text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={entry.ambulanceStatus}
                              onChange={(e) =>
                                updateClinicEntry(clinic.id, (prev) => ({
                                  ...prev,
                                  ambulanceStatus: e.target.value
                                }))
                              }
                              placeholder="Status Ambulans..."
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Step 3: Manual Activation by MECC (ACTIVE / STANDBY / OFF) */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleManualMeccStatus(clinic, 'ACTIVE')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-black border transition-all ${
                                entry.status === 'ACTIVE'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                                  : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              ACTIVE
                            </button>
                            <button
                              type="button"
                              onClick={() => handleManualMeccStatus(clinic, 'STANDBY')}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-black border transition-all ${
                                entry.status === 'STANDBY'
                                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm ring-2 ring-amber-200'
                                  : 'bg-amber-50/70 hover:bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              STANDBY
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handleManualMeccStatus(clinic, 'OFF')}
                              className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border transition-all ${
                                entry.status === 'OFF'
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border-slate-200'
                              }`}
                            >
                              Tidak Aktif / Rosak
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Step 4: Quick Reply Custom ("THANK YOU ...name ..& SELAMAT BERTUGAS") */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <a
                              href={quickReplyWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleMarkQuickReplySent(clinic)}
                              title={`Hantar Quick Reply: "${formattedQuickReply}"`}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
                            >
                              <MessageSquare size={12} className="text-amber-400 shrink-0" />
                              <span>Quick Reply</span>
                            </a>

                            <button
                              type="button"
                              onClick={() =>
                                setCustomReplyTarget({
                                  clinic,
                                  entry,
                                  draftMessage: formattedQuickReply
                                })
                              }
                              title="Ubah suai mesej Quick Reply untuk klinik ini"
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyQuickReply(clinic, entry)}
                              title="Salin teks Quick Reply"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                            >
                              {copiedId === `qr_${clinic.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>

                          <p className="text-[10px] font-mono text-slate-500 truncate" title={formattedQuickReply}>
                            {formattedQuickReply}
                          </p>

                          {entry.quickReplySent && entry.quickReplySentAt && (
                            <span className="text-[10px] font-mono tabular-nums text-emerald-600 font-bold flex items-center gap-1">
                              <Check size={10} /> Dibalas {entry.quickReplySentAt}
                            </span>
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

      {/* Modal: Custom Quick Reply Message Per Clinic */}
      {customReplyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Quick Reply Custom — {customReplyTarget.clinic.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sunting mesej balasan kepada {customReplyTarget.entry.oncallName || 'petugas oncall'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomReplyTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Teks Mesej Quick Reply
                </label>
                <textarea
                  rows={4}
                  value={customReplyTarget.draftMessage}
                  onChange={(e) =>
                    setCustomReplyTarget((prev) =>
                      prev ? { ...prev, draftMessage: e.target.value } : null
                    )
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustomReplyTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customReplyTarget.draftMessage);
                    handleMarkQuickReplySent(customReplyTarget.clinic, customReplyTarget.draftMessage);
                    setCustomReplyTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Copy size={14} /> Salin Mesej
                </button>
                {(() => {
                  const targetDigits =
                    formatWhatsAppPhone(customReplyTarget.entry.oncallPhone) ||
                    formatWhatsAppPhone(customReplyTarget.clinic.whatsappPhone);
                  const encoded = encodeURIComponent(customReplyTarget.draftMessage);
                  const url = targetDigits
                    ? `https://api.whatsapp.com/send?phone=${targetDigits}&text=${encoded}`
                    : `https://api.whatsapp.com/send?text=${encoded}`;

                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        handleMarkQuickReplySent(customReplyTarget.clinic);
                        setCustomReplyTarget(null);
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
                    >
                      <Send size={14} /> Hantar WhatsApp
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Clinic Name & WhatsApp Number */}
      {editingClinicPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Kemaskini Maklumat Klinik</h3>
              <button
                type="button"
                onClick={() => setEditingClinicPhone(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveClinicDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Klinik
                </label>
                <input
                  type="text"
                  required
                  value={tempClinicName}
                  onChange={(e) => setTempClinicName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  No. Telefon Bimbit / WhatsApp Klinik (TM / Bilik Gerakan)
                </label>
                <input
                  type="text"
                  value={tempClinicPhone}
                  onChange={(e) => setTempClinicPhone(e.target.value)}
                  placeholder="Contoh: 01162619655"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Jika dikosongkan, butang Rollcall WA akan membuka pemilih kenalan/kumpulan WhatsApp.
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClinicPhone(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Oncall Clinic */}
      {showAddClinicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Tambah Klinik Oncall Baharu</h3>
              <button
                type="button"
                onClick={() => setShowAddClinicModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddClinic} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Klinik *
                </label>
                <input
                  type="text"
                  required
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  placeholder="Contoh: KK Sungai Bertik"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Zon / Wilayah PKD
                </label>
                <select
                  value={newClinicRegion}
                  onChange={(e) => setNewClinicRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <option value="PKD KLANG">PKD KLANG</option>
                  <option value="PKD BANTING">PKD BANTING</option>
                  <option value="SHAH ALAM">SHAH ALAM</option>
                  <option value="LAIN-LAIN">LAIN-LAIN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  No. Telefon WhatsApp (Pilihan)
                </label>
                <input
                  type="text"
                  value={newClinicPhone}
                  onChange={(e) => setNewClinicPhone(e.target.value)}
                  placeholder="Contoh: 01162619500"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinicModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Tambah Klinik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Shift Checklist Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Set Semula Ceklist Rollcall Shif {shift}?
              </h3>
              <p className="text-xs text-slate-500">
                Semua status Rollcall Sent, Active, Standby dan nama oncall bagi Shif {shift} akan dikosongkan semula kepada <strong>Belum Rollcall</strong>.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetShiftChecklist}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Ya, Set Semula Shif {shift}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Shift Rollcall Summary Report */}
      {showSummaryPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Ringkasan Rollcall Oncall Klinik (Shif {shift})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Salin atau kongsi laporan status semasa Rollcall Klinik ke WhatsApp MECC
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800 leading-relaxed select-all">
                {summaryReportText}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={() => setShowSummaryPreview(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(summaryReportText);
                  showToast('Ringkasan Rollcall berjaya disalin!');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <Copy size={15} /> Salin Ringkasan
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(summaryReportText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm"
              >
                <Send size={15} /> Hantar ke WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
