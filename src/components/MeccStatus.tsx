/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Send, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Truck, 
  Copy, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Sparkles,
  FileText,
  Save,
  Building2,
  ChevronRight,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  Shift, 
  MeccTeam, 
  MeccTeamStatus, 
  MeccStatusType 
} from '../types.ts';
import { 
  SHIFT_DETAILS, 
  MECC_CATEGORIES, 
  MECC_STATUS_CONFIG 
} from '../constants.ts';

interface MeccStatusProps {
  shift: Shift;
  setShift: (shift: Shift) => void;
  formattedDate: string;
  reporter: string;
  setReporter: (rep: string) => void;
  meccTeams: MeccTeam[];
  meccStatuses: Record<string, MeccTeamStatus>;
  setMeccStatuses: React.Dispatch<React.SetStateAction<Record<string, MeccTeamStatus>>>;
}

export const MeccStatus: React.FC<MeccStatusProps> = ({
  shift,
  setShift,
  formattedDate,
  reporter,
  setReporter,
  meccTeams,
  meccStatuses,
  setMeccStatuses
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // View mode: 'list' (Form List / Senarai Borang) by default, or 'cards' (Grid)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-save MECC data
  useEffect(() => {
    try {
      localStorage.setItem('mecc_team_statuses', JSON.stringify(meccStatuses));
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to save MECC statuses:', e);
    }
  }, [meccStatuses]);

  // Group MECC teams by category
  const groupedTeams = useMemo(() => {
    const groups: Record<string, MeccTeam[]> = {};
    
    // Ensure known categories appear in clean order
    MECC_CATEGORIES.forEach(cat => {
      groups[cat] = [];
    });

    meccTeams.forEach(team => {
      const cat = team.category || 'LAIN-LAIN';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(team);
    });

    return groups;
  }, [meccTeams]);

  // Count summaries
  const summaryStats = useMemo(() => {
    let ready = 0;
    let onCall = 0;
    let rosak = 0;
    let tiadaStaff = 0;
    let off = 0;

    meccTeams.forEach(t => {
      const s = meccStatuses[t.id]?.status || t.defaultStatus;
      if (s === 'SIAP_SEDIA') ready++;
      else if (s === 'ON_CALL') onCall++;
      else if (s === 'ROSAK') rosak++;
      else if (s === 'TIADA_STAFF') tiadaStaff++;
      else if (s === 'OFF') off++;
    });

    return { ready, onCall, rosak, tiadaStaff, off, total: meccTeams.length };
  }, [meccTeams, meccStatuses]);

  // Handlers for modifying team fields
  const handleStatusChange = (teamId: string, status: MeccStatusType) => {
    setMeccStatuses(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || { ppp: '', driver: '', vehicle: '', notes: '', status: 'SIAP_SEDIA' }),
        status
      }
    }));
  };

  const handleFieldChange = (teamId: string, field: keyof MeccTeamStatus, value: string) => {
    setMeccStatuses(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || { ppp: '', driver: '', vehicle: '', notes: '', status: 'SIAP_SEDIA' }),
        [field]: value
      }
    }));
  };

  const handleSetAllReady = () => {
    setMeccStatuses(prev => {
      const updated: Record<string, MeccTeamStatus> = { ...prev };
      meccTeams.forEach(t => {
        updated[t.id] = {
          ...(updated[t.id] || { ppp: '', driver: '', vehicle: '', notes: '', status: 'SIAP_SEDIA' }),
          status: 'SIAP_SEDIA'
        };
      });
      return updated;
    });
    showToast('Semua pasukan telah ditetapkan kepada SIAP SEDIA');
  };

  const handleReset = () => {
    const fresh: Record<string, MeccTeamStatus> = {};
    meccTeams.forEach(t => {
      fresh[t.id] = {
        status: t.defaultStatus,
        ppp: t.defaultPpp || '',
        driver: t.defaultDriver || '',
        vehicle: t.defaultVehicle || '',
        notes: ''
      };
    });
    setMeccStatuses(fresh);
    setShowResetConfirm(false);
    showToast('Borang status MECC telah diset semula');
  };

  // WhatsApp Message Generator for MECC
  const generateMeccMessage = () => {
    const shiftInfo = SHIFT_DETAILS[shift];
    let msg = `*STATUS KESIAPSIAGAAN AMBULANS MECC*\n`;
    msg += `*TARIKH:* ${formattedDate}\n`;
    msg += `*SHIF:* ${shift} (${shiftInfo?.time || ''})\n`;
    if (reporter.trim()) {
      msg += `*DISEDIAKAN OLEH:* ${reporter.toUpperCase()}\n`;
    }
    msg += `\n═══════════════════════════\n`;

    (Object.entries(groupedTeams) as [string, MeccTeam[]][]).forEach(([category, teams]) => {
      if (teams.length === 0) return;
      msg += `\n*【 ${category} 】*\n`;

      teams.forEach((t, index) => {
        const current = meccStatuses[t.id] || { status: t.defaultStatus, ppp: '', driver: '', vehicle: '', notes: '' };
        const cfg = MECC_STATUS_CONFIG[current.status] || MECC_STATUS_CONFIG.SIAP_SEDIA;
        
        msg += `${index + 1}. *${t.name}* : [ ${cfg.shortLabel} ]\n`;
        if (current.ppp.trim()) {
          msg += `   • PPP: ${current.ppp.trim()}\n`;
        }
        if (current.driver.trim()) {
          msg += `   • Pemandu: ${current.driver.trim()}\n`;
        }
        if (current.vehicle.trim()) {
          msg += `   • No. Kenderaan: ${current.vehicle.trim()}\n`;
        }
        if (current.notes.trim()) {
          msg += `   • Catatan: ${current.notes.trim()}\n`;
        }
      });
    });

    msg += `\n═══════════════════════════\n`;
    msg += `*RINGKASAN STATUS KESIAPSIAGAAN:*\n`;
    msg += `✅ Siap Sedia (Beroperasi): ${summaryStats.ready}\n`;
    msg += `⏳ On Call (Kes Berjalan): ${summaryStats.onCall}\n`;
    msg += `⚠️ Rosak / Penyelenggaraan: ${summaryStats.rosak}\n`;
    msg += `👤 Tiada Pemandu / Staff: ${summaryStats.tiadaStaff}\n`;
    msg += `🛑 Tidak Beroperasi (Off): ${summaryStats.off}\n`;
    msg += `📊 Jumlah Pasukan: ${summaryStats.total}\n\n`;
    msg += `_Laporan dijana secara automatik melalui MECC Management Board._`;

    return msg;
  };

  const handleCopyMessage = () => {
    const text = generateMeccMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Teks laporan MECC berjaya disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = generateMeccMessage();
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold">
              <Radio size={14} className="animate-pulse" /> MECC MANAGEMENT BOARD • WILAYAH BANTING, SHAH ALAM & HASA
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              MECC Management Board: Status Ambulans
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl">
              Kemaskini penugasan shif ambulans bagi semua wilayah terlibat: PKD Banting (KK Telok Panglima Garang, Jenjarom, Bandar, Bukit Changgang, Tg Sepat), Hospital Banting (Banting 1, 2), Shah Alam (SA 1, 2) & HASA.
            </p>
          </div>

          {/* Quick Summary Pill Counters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-300">Siap Sedia</span>
              <div className="text-xl font-black text-white">{summaryStats.ready}</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-300">On Call</span>
              <div className="text-xl font-black text-white">{summaryStats.onCall}</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-300">Rosak/Staff</span>
              <div className="text-xl font-black text-white">{summaryStats.rosak + summaryStats.tiadaStaff}</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-300">Off</span>
              <div className="text-xl font-black text-white">{summaryStats.off}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Shift, Date, Reporter & Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Shift Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600" /> Pilihan Shif
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
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>{s}</div>
                    <div className="text-[10px] opacity-80">{SHIFT_DETAILS[s].time}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarikh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={14} className="text-rose-600" /> Tarikh Laporan
            </label>
            <div className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
              {formattedDate}
            </div>
          </div>

          {/* Pelapor MECC */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={14} className="text-emerald-600" /> Nama Pelapor / Pegawai MECC
            </label>
            <input 
              type="text"
              placeholder="Contoh: PPP MUHAIMIN"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
            />
          </div>

        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSetAllReady}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Set Semua Siap Sedia
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={15} /> Set Semula
            </button>
          </div>

          <div className="flex items-center gap-2">
            {lastSavedTime && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-2">
                <Save size={12} className="text-emerald-500" /> Auto-simpan: {lastSavedTime}
              </span>
            )}
            <button
              onClick={() => setShowPreview(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Send size={16} /> Jana Laporan WhatsApp MECC
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <List size={14} className="text-amber-600" /> Format Paparan MECC:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={14} /> Senarai Borang (Form List)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} /> Paparan Kad (Grid)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{summaryStats.ready} Siap Sedia / {summaryStats.total} Pasukan</span>
        </div>
      </div>

      {/* Grouped Form for Each Team per Category */}
      <div className="space-y-8">
        {(Object.entries(groupedTeams) as [string, MeccTeam[]][]).map(([category, teams]) => {
          if (teams.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              
              {/* Category Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-lg bg-amber-500 shadow-sm" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wide">
                    {category}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {teams.length} Pasukan
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500 hidden sm:block">
                  Kemas kini petugas & status armada {category}
                </div>
              </div>

              {/* View Mode: LIST VIEW (Form List / Senarai Borang) */}
              {viewMode === 'list' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-3 w-10 text-center">Bil</th>
                          <th className="py-3 px-3.5 min-w-[200px]">Pasukan & Telefon</th>
                          <th className="py-3 px-3 min-w-[170px]">Status Semasa</th>
                          <th className="py-3 px-3 min-w-[160px]">PPP / Paramedik</th>
                          <th className="py-3 px-3 min-w-[150px]">Pemandu Ambulans</th>
                          <th className="py-3 px-3 min-w-[140px]">No. Plat Kenderaan</th>
                          <th className="py-3 px-3.5 min-w-[180px]">Catatan / Lokasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {teams.map((team, idx) => {
                          const current = meccStatuses[team.id] || {
                            status: team.defaultStatus,
                            ppp: team.defaultPpp || '',
                            driver: team.defaultDriver || '',
                            vehicle: team.defaultVehicle || '',
                            notes: ''
                          };

                          const cfg = MECC_STATUS_CONFIG[current.status] || MECC_STATUS_CONFIG.SIAP_SEDIA;

                          return (
                            <tr 
                              key={team.id}
                              className={`transition-colors hover:bg-slate-50/70 ${
                                current.status === 'SIAP_SEDIA'
                                  ? 'bg-white'
                                  : current.status === 'ON_CALL'
                                  ? 'bg-amber-50/25'
                                  : current.status === 'ROSAK' || current.status === 'TIADA_STAFF'
                                  ? 'bg-rose-50/25'
                                  : 'bg-slate-50/50 opacity-75'
                              }`}
                            >
                              {/* Bil */}
                              <td className="py-3 px-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              {/* Pasukan & Telefon */}
                              <td className="py-3 px-3.5">
                                <div className="font-black text-slate-900 text-xs sm:text-sm">
                                  {team.name}
                                </div>
                                {team.phone && (
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                    <Phone size={10} className="text-slate-400" /> {team.phone}
                                  </div>
                                )}
                              </td>

                              {/* Status Semasa Selector */}
                              <td className="py-3 px-3">
                                <select
                                  value={current.status}
                                  onChange={(e) => handleStatusChange(team.id, e.target.value as MeccStatusType)}
                                  className={`w-full text-xs font-bold py-1.5 px-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${cfg.bg} ${cfg.border}`}
                                >
                                  <option value="SIAP_SEDIA" className="bg-white text-emerald-800 font-bold">🟢 SIAP SEDIA</option>
                                  <option value="ON_CALL" className="bg-white text-amber-800 font-bold">🟡 ON CALL</option>
                                  <option value="ROSAK" className="bg-white text-rose-800 font-bold">🔴 ROSAK</option>
                                  <option value="TIADA_STAFF" className="bg-white text-orange-800 font-bold">🟠 TIADA STAFF</option>
                                  <option value="OFF" className="bg-white text-slate-800 font-bold">⚪ OFF</option>
                                </select>
                              </td>

                              {/* PPP / Paramedik */}
                              <td className="py-3 px-3">
                                <input
                                  type="text"
                                  placeholder="PPP Bertugas..."
                                  value={current.ppp}
                                  onChange={(e) => handleFieldChange(team.id, 'ppp', e.target.value)}
                                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none uppercase font-semibold text-slate-800"
                                />
                              </td>

                              {/* Pemandu */}
                              <td className="py-3 px-3">
                                <input
                                  type="text"
                                  placeholder="Pemandu..."
                                  value={current.driver}
                                  onChange={(e) => handleFieldChange(team.id, 'driver', e.target.value)}
                                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none uppercase font-semibold text-slate-800"
                                />
                              </td>

                              {/* No Plat / Kenderaan */}
                              <td className="py-3 px-3">
                                <input
                                  type="text"
                                  placeholder="No. Plat..."
                                  value={current.vehicle}
                                  onChange={(e) => handleFieldChange(team.id, 'vehicle', e.target.value)}
                                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none uppercase font-mono font-bold text-slate-800"
                                />
                              </td>

                              {/* Catatan / Lokasi */}
                              <td className="py-3 px-3.5">
                                <input
                                  type="text"
                                  placeholder="Catatan..."
                                  value={current.notes}
                                  onChange={(e) => handleFieldChange(team.id, 'notes', e.target.value)}
                                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-700"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* View Mode: GRID CARD VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {teams.map((team) => {
                    const current = meccStatuses[team.id] || {
                      status: team.defaultStatus,
                      ppp: team.defaultPpp || '',
                      driver: team.defaultDriver || '',
                      vehicle: team.defaultVehicle || '',
                      notes: ''
                    };

                    const cfg = MECC_STATUS_CONFIG[current.status] || MECC_STATUS_CONFIG.SIAP_SEDIA;

                    return (
                      <div 
                        key={team.id}
                        className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${
                          current.status === 'SIAP_SEDIA' 
                            ? 'border-emerald-200 ring-1 ring-emerald-500/20' 
                            : current.status === 'ON_CALL'
                            ? 'border-amber-200 ring-1 ring-amber-500/20'
                            : current.status === 'ROSAK' || current.status === 'TIADA_STAFF'
                            ? 'border-rose-200 ring-1 ring-rose-500/20'
                            : 'border-slate-200 opacity-90'
                        }`}
                      >
                        {/* Top Bar of Team Card */}
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {team.category}
                            </span>
                            <h4 className="text-base font-black text-slate-900 mt-1">
                              {team.name}
                            </h4>
                            {team.phone && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone size={11} /> {team.phone}
                              </span>
                            )}
                          </div>

                          <div className={`px-2.5 py-1 rounded-full text-xs font-black ${cfg.bg} border ${cfg.border}`}>
                            {cfg.shortLabel}
                          </div>
                        </div>

                        {/* Status Selector Buttons */}
                        <div className="mt-3">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Pilih Status Semasa
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['SIAP_SEDIA', 'ON_CALL', 'ROSAK', 'TIADA_STAFF', 'OFF'] as MeccStatusType[]).map((stKey) => {
                              const isChosen = current.status === stKey;
                              const btnCfg = MECC_STATUS_CONFIG[stKey];
                              return (
                                <button
                                  key={stKey}
                                  type="button"
                                  onClick={() => handleStatusChange(team.id, stKey)}
                                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                    isChosen 
                                      ? `${btnCfg.bg} ${btnCfg.border} border-2 shadow-sm scale-[1.02]` 
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {btnCfg.shortLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Detail Inputs */}
                        <div className="mt-4 space-y-2.5">
                          
                          {/* PPP / Paramedik */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                              <User size={12} className="text-slate-400" /> PPP / Paramedik
                            </label>
                            <input 
                              type="text"
                              placeholder="Nama PPP Bertugas..."
                              value={current.ppp}
                              onChange={(e) => handleFieldChange(team.id, 'ppp', e.target.value)}
                              className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none uppercase font-medium"
                            />
                          </div>

                          {/* Pemandu */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                              <User size={12} className="text-slate-400" /> Pemandu Ambulans
                            </label>
                            <input 
                              type="text"
                              placeholder="Nama Pemandu..."
                              value={current.driver}
                              onChange={(e) => handleFieldChange(team.id, 'driver', e.target.value)}
                              className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none uppercase font-medium"
                            />
                          </div>

                          {/* No Plat / No Kenderaan */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                              <Truck size={12} className="text-slate-400" /> No. Plat / Panggilan
                            </label>
                            <input 
                              type="text"
                              placeholder="Contoh: WXX 1234 / Amb 01"
                              value={current.vehicle}
                              onChange={(e) => handleFieldChange(team.id, 'vehicle', e.target.value)}
                              className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none uppercase font-mono"
                            />
                          </div>

                          {/* Catatan / Status Kes */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                              <FileText size={12} className="text-slate-400" /> Catatan / Lokasi Kes
                            </label>
                            <input 
                              type="text"
                              placeholder="Contoh: Kes HTAR / Servis Berkala"
                              value={current.notes}
                              onChange={(e) => handleFieldChange(team.id, 'notes', e.target.value)}
                              className="w-full text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-700"
                            />
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Floating Bottom Action Bar for Quick WhatsApp Generation */}
      <div className="sticky bottom-6 z-30 max-w-xl mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-2 pl-2">
            <Radio className="text-amber-400 animate-pulse" size={18} />
            <div className="text-xs">
              <span className="font-bold text-white">MECC {shift}</span>
              <span className="text-slate-400 ml-1.5">({summaryStats.ready} Siap Sedia)</span>
            </div>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Send size={15} /> JANA LAPORAN MECC
          </button>
        </div>
      </div>

      {/* WhatsApp Message Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Radio size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Pratonton Laporan WhatsApp MECC
                  </h3>
                  <p className="text-xs text-slate-500">
                    Semak format teks sebelum disalin atau dihantar ke kumpulan WhatsApp
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: WhatsApp Formatted Text */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-inner font-mono text-xs sm:text-sm whitespace-pre-wrap text-slate-800 leading-relaxed select-all">
                {whatsappMessage}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3 bg-white">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              
              <button
                onClick={handleCopyMessage}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? 'Telah Disalin!' : 'Salin Mesej'}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-2 shadow-md shadow-emerald-600/30"
              >
                <Send size={16} /> Buka WhatsApp
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Set Semula Borang MECC?</h3>
              <p className="text-xs text-slate-500">
                Semua input nama pemandu, PPP, dan no kenderaan untuk shif ini akan dikosongkan kembali kepada nilai asal.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-md"
              >
                Ya, Set Semula
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
