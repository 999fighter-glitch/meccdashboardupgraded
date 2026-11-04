/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Send, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck, 
  Copy,
  ChevronDown,
  Info,
  Save,
  RotateCcw,
  UserPlus,
  Users,
  Check,
  CheckSquare,
  Square,
  Trash2,
  LayoutGrid,
  List,
  Truck
} from 'lucide-react';
import { 
  Shift, 
  AmbulanceTeam, 
  PPPContact, 
  DetectedManualName, 
  PozTeamStatusItem 
} from '../types.ts';
import { 
  SHIFT_DETAILS, 
  AVAILABLE_CATEGORIES, 
  STJOHN_RESPONDERS, 
  PPP_LIST 
} from '../constants.ts';

interface PozUpdaterProps {
  shift: Shift;
  setShift: (s: Shift) => void;
  formattedDate: string;
  reporter: string;
  setReporter: (r: string) => void;
  pozTeams: AmbulanceTeam[];
  teamStatuses: Record<string, PozTeamStatusItem>;
  setTeamStatuses: React.Dispatch<React.SetStateAction<Record<string, PozTeamStatusItem>>>;
  customStJohnList: string[];
  setCustomStJohnList: React.Dispatch<React.SetStateAction<string[]>>;
  customPppList: PPPContact[];
  setCustomPppList: React.Dispatch<React.SetStateAction<PPPContact[]>>;
  allPPPList?: PPPContact[];
  allStJohnResponders?: string[];
  lastSavedTime: string | null;
}

export const PozUpdater: React.FC<PozUpdaterProps> = ({
  shift,
  setShift,
  formattedDate,
  reporter,
  setReporter,
  pozTeams,
  teamStatuses,
  setTeamStatuses,
  customStJohnList,
  setCustomStJohnList,
  customPppList,
  setCustomPppList,
  allPPPList: propAllPPPList,
  allStJohnResponders: propAllStJohnResponders,
  lastSavedTime
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState('');

  // View mode: 'list' (Form List / Senarai Borang) by default, or 'cards' (Grid)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // New manual names detection & confirmation modal
  const [detectedNames, setDetectedNames] = useState<DetectedManualName[]>([]);
  const [showNewNamesModal, setShowNewNamesModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const allStJohnResponders = useMemo(() => {
    if (propAllStJohnResponders) return propAllStJohnResponders;
    const set = new Set([...STJOHN_RESPONDERS, ...customStJohnList]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [propAllStJohnResponders, customStJohnList]);

  const allPPPList = useMemo(() => {
    if (propAllPPPList) return propAllPPPList;
    return [...PPP_LIST, ...customPppList];
  }, [propAllPPPList, customPppList]);

  const groupedPPPs = useMemo(() => {
    const groups: Record<string, PPPContact[]> = {};
    allPPPList.forEach(ppp => {
      const cat = ppp.category || 'LAIN-LAIN';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ppp);
    });
    return groups;
  }, [allPPPList]);

  const toggleTeamStatus = (teamId: string) => {
    setTeamStatuses(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        active: !prev[teamId]?.active
      }
    }));
  };

  const setTeamPPP = (teamId: string, pppId: string) => {
    setTeamStatuses(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        pppId: pppId,
        isOthersPpp: pppId === 'OTHERS'
      }
    }));
  };

  const setTeamCustomPppName = (teamId: string, name: string) => {
    setTeamStatuses(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        customPppName: name
      }
    }));
  };

  const setTeamManualName = (teamId: string, field: 'manualName1' | 'manualName2', value: string) => {
    setTeamStatuses(prev => {
      const current = prev[teamId] || { active: true, pppId: '' };
      const isOthersField = field === 'manualName1' ? 'isOthers1' : 'isOthers2';
      return {
        ...prev,
        [teamId]: {
          ...current,
          [field]: value,
          [isOthersField]: value === 'OTHERS' ? true : (current[isOthersField] || false)
        }
      };
    });
  };

  const setCustomOthersStJohnName = (teamId: string, field: 'manualName1' | 'manualName2', customName: string) => {
    setTeamStatuses(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || { active: true, pppId: '' }),
        [field]: customName
      }
    }));
  };

  const setTeamNotes = (teamId: string, notes: string) => {
    setTeamStatuses(prev => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || { active: true, pppId: '' }),
        notes
      }
    }));
  };

  const getDefaultCategoryForTeam = (teamId: string): string => {
    if (teamId.startsWith('htar')) return 'PHC HTAR';
    if (teamId.startsWith('bukitkuda')) return 'KK BUKIT KUDA';
    if (teamId.startsWith('bukitnaga')) return 'KK BUKIT NAGA';
    if (teamId.startsWith('kkkapar')) return 'KK KAPAR';
    if (teamId.startsWith('meru')) return 'KK MERU';
    if (teamId.startsWith('pulauindah')) return 'KK P.INDAH';
    if (teamId.startsWith('anika')) return 'KK ANIKA';
    if (teamId.startsWith('botanik')) return 'KK BOTANIK';
    if (teamId.startsWith('pandamaran')) return 'KK PANDAMARAN';
    if (teamId.startsWith('portklang')) return 'KK PORT KLANG';
    if (teamId.startsWith('rantaupanjang')) return 'KK RANTAU PANJANG';
    return 'PHC HTAR';
  };

  const handleJanaLaporan = () => {
    const newItems: DetectedManualName[] = [];

    // Scan St. John manual names
    const stJohnStatus = teamStatuses['stjohn4'];
    if (stJohnStatus && stJohnStatus.active) {
      if (stJohnStatus.isOthers1 && stJohnStatus.manualName1 && stJohnStatus.manualName1 !== 'OTHERS') {
        const cleanName = stJohnStatus.manualName1.trim().toUpperCase();
        if (cleanName && !allStJohnResponders.includes(cleanName)) {
          newItems.push({
            id: `stjohn-1-${cleanName}`,
            type: 'stjohn',
            name: cleanName,
            selected: true,
            stJohnField: 'manualName1',
            teamId: 'stjohn4',
            teamName: 'St. John 4',
            category: 'St. John',
            phone: 'N/A'
          });
        }
      }

      if (stJohnStatus.isOthers2 && stJohnStatus.manualName2 && stJohnStatus.manualName2 !== 'OTHERS') {
        const cleanName = stJohnStatus.manualName2.trim().toUpperCase();
        if (cleanName && !allStJohnResponders.includes(cleanName) && !newItems.some(i => i.name === cleanName)) {
          newItems.push({
            id: `stjohn-2-${cleanName}`,
            type: 'stjohn',
            name: cleanName,
            selected: true,
            stJohnField: 'manualName2',
            teamId: 'stjohn4',
            teamName: 'St. John 4',
            category: 'St. John',
            phone: 'N/A'
          });
        }
      }
    }

    // Scan other ambulance teams for manual PPPs
    pozTeams.forEach(team => {
      const status = teamStatuses[team.id];
      if (status && status.active && status.isOthersPpp && status.customPppName) {
        const cleanName = status.customPppName.trim().toUpperCase();
        const existsInMaster = allPPPList.some(p => p.name.toUpperCase() === cleanName);
        if (cleanName && !existsInMaster && !newItems.some(i => i.name === cleanName && i.type === 'ppp')) {
          newItems.push({
            id: `ppp-${team.id}-${cleanName}`,
            type: 'ppp',
            name: cleanName,
            selected: true,
            teamId: team.id,
            teamName: team.name,
            category: getDefaultCategoryForTeam(team.id),
            phone: 'N/A'
          });
        }
      }
    });

    if (newItems.length > 0) {
      setDetectedNames(newItems);
      setShowNewNamesModal(true);
    } else {
      setPreviewText(generateMessage());
      setShowPreview(true);
    }
  };

  const handleToggleSelectDetectedName = (id: string) => {
    setDetectedNames(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleCategoryChangeDetectedName = (id: string, category: string) => {
    setDetectedNames(prev => prev.map(item => 
      item.id === id ? { ...item, category } : item
    ));
  };

  const handleConfirmSaveNewNames = () => {
    const selectedToSave = detectedNames.filter(i => i.selected);

    let updatedStJohnList = [...customStJohnList];
    let updatedPppList = [...customPppList];
    const updatedTeamStatuses = { ...teamStatuses };

    selectedToSave.forEach(item => {
      if (item.type === 'stjohn') {
        if (!updatedStJohnList.includes(item.name)) {
          updatedStJohnList.push(item.name);
        }
        if (item.teamId && item.stJohnField) {
          const current = updatedTeamStatuses[item.teamId] || { active: true, pppId: '' };
          const isOthersField = item.stJohnField === 'manualName1' ? 'isOthers1' : 'isOthers2';
          updatedTeamStatuses[item.teamId] = {
            ...current,
            [item.stJohnField]: item.name,
            [isOthersField]: false
          };
        }
      } else if (item.type === 'ppp') {
        const newPppId = `custom_ppp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const newPppContact: PPPContact = {
          id: newPppId,
          name: item.name,
          personalPhone: item.phone || 'N/A',
          category: item.category
        };
        updatedPppList.push(newPppContact);

        if (item.teamId) {
          const current = updatedTeamStatuses[item.teamId] || { active: true, pppId: '' };
          updatedTeamStatuses[item.teamId] = {
            ...current,
            pppId: newPppId,
            isOthersPpp: false,
            customPppName: ''
          };
        }
      }
    });

    if (updatedStJohnList.length !== customStJohnList.length) {
      setCustomStJohnList(updatedStJohnList);
      localStorage.setItem('poz_custom_stjohn', JSON.stringify(updatedStJohnList));
    }

    if (updatedPppList.length !== customPppList.length) {
      setCustomPppList(updatedPppList);
      localStorage.setItem('poz_custom_ppps', JSON.stringify(updatedPppList));
    }

    setTeamStatuses(updatedTeamStatuses);
    setShowNewNamesModal(false);
    showToast(`Berjaya menambah ${selectedToSave.length} nama ke dalam senarai induk!`);
    setPreviewText(generateMessage(updatedTeamStatuses));
    setShowPreview(true);
  };

  const generateMessage = (statuses?: Record<string, PozTeamStatusItem>) => {
    const currentStatuses = statuses || teamStatuses;
    const shiftDetails = SHIFT_DETAILS[shift];
    let timeText = shiftDetails?.time || '1400-2100';
    if (!timeText.toUpperCase().includes('H')) {
      timeText = `${timeText} H`;
    }

    let msg = `******LAPORAN POZ **************\n`;
    msg += `📍*Fasiliti*: Hospital Tengku Ampuan Rahimah Klang (POZ HTAR)             \n`;
    msg += `🕒 *Syif*: *${shift} (${timeText})*  \n`;
    msg += `📅 *Tarikh*: *${formattedDate.toUpperCase()}*\n\n`;
    msg += `🚑 *Ambulance Teams Readiness*:\n`;

    const activeTeams = pozTeams.filter(t => (currentStatuses[t.id]?.active ?? t.defaultStatus));
    const inactiveTeams = pozTeams.filter(t => !(currentStatuses[t.id]?.active ?? t.defaultStatus));

    const activeLines: string[] = [];

    activeTeams.forEach((team) => {
      const status = currentStatuses[team.id];
      const tmPhone = (!team.tmPhone || team.tmPhone === 'N/A' || team.tmPhone === '---') ? '---' : team.tmPhone;
      let line = `${team.name} – ✅ Ready. `;

      if (team.id === 'stjohn4') {
        const n1 = status?.manualName1 || 'HARIRI';
        const n2 = status?.manualName2;

        let leaderStr = `Team Leader_@${n1}`;
        if (n2 && n2 !== 'OTHERS') {
          leaderStr += ` & @${n2}`;
        }
        line += `${leaderStr} @TMPhone ${tmPhone}`;

        // Look up responder contact for personal phone
        const matchedContact = allPPPList.find(p => p.name.toUpperCase() === n1.trim().toUpperCase());
        const phone = matchedContact?.personalPhone;
        if (phone && phone !== 'N/A' && phone.trim()) {
          line += `, @PHONE_${n1} ${phone}`;
        }
      } else {
        let leaderName = '';
        let personalPhone = '';

        if (status?.isOthersPpp && status.customPppName) {
          leaderName = status.customPppName.trim().toUpperCase();
        } else if (status?.pppId) {
          const ppp = allPPPList.find(p => p.id === status.pppId);
          if (ppp) {
            leaderName = ppp.name.toUpperCase();
            if (ppp.personalPhone && ppp.personalPhone !== 'N/A' && ppp.personalPhone.trim()) {
              personalPhone = ppp.personalPhone.trim();
            }
          }
        }

        if (leaderName) {
          line += `Team Leader PPP ${leaderName} , @TMPhone ${tmPhone}`;
          if (personalPhone) {
            line += `, @Phone_${leaderName}_${personalPhone}`;
          }
        } else {
          line += `Team Leader PPP [Belum Ditugaskan] , @TMPhone ${tmPhone}`;
        }
      }

      if (status?.notes && status.notes.trim()) {
        line += ` - ${status.notes.trim()}`;
      }

      activeLines.push(line);
    });

    if (activeLines.length > 0) {
      msg += activeLines.join('\n\n') + '\n';
    } else {
      msg += `(Tiada unit sedia)\n`;
    }

    if (inactiveTeams.length > 0) {
      msg += `\n----------TIDAK AKTIF -------------\n`;
      const inactiveLines = inactiveTeams.map((team) => {
        const tmPhone = (!team.tmPhone || team.tmPhone === 'N/A' || team.tmPhone === '---') ? '---' : team.tmPhone;
        return `* ${team.name} – ❌(not available) Team Leader @, @TMPhone ${tmPhone}, @Phone_(TIDAK AKTIF UTK 999)`;
      });
      msg += inactiveLines.join('\n\n') + '\n';
    }

    const reporterClean = reporter.trim();
    const reporterText = reporterClean 
      ? (reporterClean.toUpperCase().startsWith('PPP') ? reporterClean.toUpperCase() : `PPP ${reporterClean.toUpperCase()}`)
      : 'PPP AMIRUN';

    msg += `\n📊 Jumlah Unit Sedia: ${activeTeams.length}/${pozTeams.length} \n`;
    msg += `📝 Dilaporkan oleh: ${reporterText} `;

    return msg;
  };

  const handleCopy = () => {
    const text = previewText || generateMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Mesej berjaya disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const currentFormattedMessage = previewText || generateMessage();
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(currentFormattedMessage)}`;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-rose-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-bold">
              <ShieldCheck size={14} /> MECC MANAGEMENT BOARD • WILAYAH KLANG (POZ HTAR)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              POZ Updater: Kesiapsiagaan Pasukan Ambulans
            </h1>
            <p className="text-xs sm:text-sm text-rose-100/90 max-w-2xl">
              Kemaskini penugasan Penolong Pegawai Perubatan (PPP) dan responden St. John bagi setiap ambulans aktif di daerah Klang.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(customStJohnList.length > 0 || customPppList.length > 0) && (
              <button
                onClick={() => setShowManageModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-colors"
              >
                <Users size={14} /> Nama Tambahan ({customStJohnList.length + customPppList.length})
              </button>
            )}
            {lastSavedTime && (
              <div className="hidden sm:flex items-center gap-1.5 bg-rose-950/40 px-3.5 py-2 rounded-xl border border-rose-500/30 text-xs text-rose-200">
                <Save size={13} className="text-emerald-400" />
                <span>Auto-simpan: {lastSavedTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Form: Shift & Reporter */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Shift */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-rose-600" /> Pilihan Shif
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
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30' 
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
              <Calendar size={14} className="text-rose-600" /> Tarikh
            </label>
            <div className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
              {formattedDate}
            </div>
          </div>

          {/* Pelapor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={14} className="text-emerald-600" /> Nama Pelapor
            </label>
            <input 
              type="text"
              placeholder="Contoh: PPP MUHAIMIN"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase"
            />
          </div>

        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const allActive: Record<string, PozTeamStatusItem> = {};
                pozTeams.forEach(t => {
                  allActive[t.id] = { ...(teamStatuses[t.id] || { pppId: '' }), active: true };
                });
                setTeamStatuses(allActive);
                showToast('Semua pasukan ditetapkan kepada Beroperasi');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Aktifkan Semua
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Set Semula
            </button>
          </div>

          <button
            onClick={handleJanaLaporan}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Send size={16} /> Jana Laporan WhatsApp POZ
          </button>
        </div>
      </div>

      {/* View Mode Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <List size={14} className="text-rose-600" /> Format Paparan:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-rose-600 text-white shadow-sm'
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
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} /> Paparan Kad (Grid)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{pozTeams.filter(t => teamStatuses[t.id]?.active).length} / {pozTeams.length} Pasukan Aktif</span>
        </div>
      </div>

      {/* FORM LIST VIEW (SENARAI BORANG) - Default and Compact */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-wide flex items-center gap-2">
                <Truck size={16} className="text-rose-600" /> Senarai Borang Status Pasukan POZ
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kemas kini status kesiapsiagaan dan petugas bagi setiap pasukan kontinjen POZ shif {shift}.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {pozTeams.length} Pasukan Berdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">Bil</th>
                  <th className="py-3 px-4 min-w-[180px]">Pasukan</th>
                  <th className="py-3 px-4 min-w-[150px] text-center">Status Operasi</th>
                  <th className="py-3 px-4 min-w-[320px]">Petugas / Responder Bertugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pozTeams.map((team, idx) => {
                  const status = teamStatuses[team.id] || { active: team.defaultStatus, pppId: '' };
                  const isActive = status.active;

                  return (
                    <tr 
                      key={team.id}
                      className={`transition-colors ${
                        isActive ? 'bg-white hover:bg-rose-50/30' : 'bg-slate-50/60 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* Bil */}
                      <td className="py-3.5 px-3.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Pasukan */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 text-sm">{team.name}</span>
                      </td>

                      {/* Status Operasi Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleTeamStatus(team.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            isActive 
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' 
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 size={13} /> BEROPERASI
                            </>
                          ) : (
                            <>
                              <XCircle size={13} /> OFF
                            </>
                          )}
                        </button>
                      </td>

                      {/* Petugas Bertugas Input/Dropdown */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <div>
                            {team.id === 'stjohn4' ? (
                              /* SJAM Dual Responders */
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">Responder 1 (SJAM)</span>
                                  {status.isOthers1 ? (
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="text"
                                        placeholder="Nama Manual 1..."
                                        value={status.manualName1 === 'OTHERS' ? '' : (status.manualName1 || '')}
                                        onChange={(e) => setCustomOthersStJohnName(team.id, 'manualName1', e.target.value)}
                                        className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg uppercase font-semibold focus:ring-1 focus:ring-rose-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setTeamManualName(team.id, 'manualName1', 'AFIQ')}
                                        className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      value={status.manualName1 || 'AFIQ'}
                                      onChange={(e) => setTeamManualName(team.id, 'manualName1', e.target.value)}
                                      className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                                    >
                                      {allStJohnResponders.map(n => (
                                        <option key={n} value={n}>{n}</option>
                                      ))}
                                      <option value="OTHERS">+ LAIN-LAIN (MANUAL)</option>
                                    </select>
                                  )}
                                </div>

                                <div>
                                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">Responder 2 (SJAM)</span>
                                  {status.isOthers2 ? (
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="text"
                                        placeholder="Nama Manual 2..."
                                        value={status.manualName2 === 'OTHERS' ? '' : (status.manualName2 || '')}
                                        onChange={(e) => setCustomOthersStJohnName(team.id, 'manualName2', e.target.value)}
                                        className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg uppercase font-semibold focus:ring-1 focus:ring-rose-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setTeamManualName(team.id, 'manualName2', 'YONG')}
                                        className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      value={status.manualName2 || 'YONG'}
                                      onChange={(e) => setTeamManualName(team.id, 'manualName2', e.target.value)}
                                      className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                                    >
                                      {allStJohnResponders.map(n => (
                                        <option key={n} value={n}>{n}</option>
                                      ))}
                                      <option value="OTHERS">+ LAIN-LAIN (MANUAL)</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* Standard PPP Selector */
                              <div>
                                {status.isOthersPpp ? (
                                  <div className="flex items-center gap-1.5">
                                    <input 
                                      type="text"
                                      placeholder="Taip nama manual PPP..."
                                      value={status.customPppName || ''}
                                      onChange={(e) => setTeamCustomPppName(team.id, e.target.value)}
                                      className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg uppercase font-semibold focus:ring-1 focus:ring-rose-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setTeamPPP(team.id, '')}
                                      className="text-[10px] text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={status.pppId || ''}
                                    onChange={(e) => setTeamPPP(team.id, e.target.value)}
                                    className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-1 focus:ring-rose-500"
                                  >
                                    <option value="">-- Pilih PPP Bertugas --</option>
                                    {(Object.entries(groupedPPPs) as [string, PPPContact[]][]).map(([category, items]) => (
                                      <optgroup key={category} label={`--- ${category} ---`}>
                                        {items.map(p => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} ({p.personalPhone})
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                    <option value="OTHERS">+ LAIN-LAIN (NAMA MANUAL)</option>
                                  </select>
                                )}
                              </div>
                            )}

                            {/* Optional Team Note / Catatan */}
                            <div className="mt-2 flex items-center gap-1.5">
                              <input 
                                type="text"
                                placeholder="Nota / Catatan (cth: TIDAK DIMAKLUMKAN STANDDOWN)"
                                value={status.notes || ''}
                                onChange={(e) => setTeamNotes(team.id, e.target.value)}
                                className="w-full text-[11px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-rose-500 font-medium"
                              />
                              {status.notes && (
                                <button
                                  type="button"
                                  onClick={() => setTeamNotes(team.id, '')}
                                  className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
                                  title="Padam Catatan"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pasukan OFF / Tidak Beroperasi</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pozTeams.map((team) => {
            const status = teamStatuses[team.id] || { active: team.defaultStatus, pppId: '' };
            const isActive = status.active;

            return (
              <div 
                key={team.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${
                  isActive ? 'border-rose-200 ring-1 ring-rose-500/20' : 'border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-black text-slate-900">{team.name}</h4>
                  </div>

                  <button
                    onClick={() => toggleTeamStatus(team.id)}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                      isActive 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {isActive ? 'BEROPERASI' : 'OFF'}
                  </button>
                </div>

                {isActive ? (
                  <div className="mt-4 space-y-3">
                    {team.id === 'stjohn4' ? (
                      /* St John dual responders */
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Responder 1 (SJAM)</label>
                          {status.isOthers1 ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="text"
                                placeholder="Nama Manual 1..."
                                value={status.manualName1 === 'OTHERS' ? '' : (status.manualName1 || '')}
                                onChange={(e) => setCustomOthersStJohnName(team.id, 'manualName1', e.target.value)}
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-semibold"
                              />
                              <button
                                onClick={() => setTeamManualName(team.id, 'manualName1', 'AFIQ')}
                                className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <select
                              value={status.manualName1 || 'AFIQ'}
                              onChange={(e) => setTeamManualName(team.id, 'manualName1', e.target.value)}
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                            >
                              {allStJohnResponders.map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                              <option value="OTHERS">+ LAIN-LAIN (MANUAL)</option>
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Responder 2 (SJAM)</label>
                          {status.isOthers2 ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="text"
                                placeholder="Nama Manual 2..."
                                value={status.manualName2 === 'OTHERS' ? '' : (status.manualName2 || '')}
                                onChange={(e) => setCustomOthersStJohnName(team.id, 'manualName2', e.target.value)}
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-semibold"
                              />
                              <button
                                onClick={() => setTeamManualName(team.id, 'manualName2', 'YONG')}
                                className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <select
                              value={status.manualName2 || 'YONG'}
                              onChange={(e) => setTeamManualName(team.id, 'manualName2', e.target.value)}
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                            >
                              {allStJohnResponders.map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                              <option value="OTHERS">+ LAIN-LAIN (MANUAL)</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* PPP Dropdown / Input */
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <User size={12} className="text-slate-400" /> Team Leader (PPP)
                        </label>
                        {status.isOthersPpp ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1">
                              <input 
                                type="text"
                                placeholder="Taip nama manual PPP..."
                                value={status.customPppName || ''}
                                onChange={(e) => setTeamCustomPppName(team.id, e.target.value)}
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-semibold focus:ring-1 focus:ring-rose-500"
                              />
                              <button
                                onClick={() => setTeamPPP(team.id, '')}
                                className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                              >
                                Batal
                              </button>
                            </div>
                            <span className="text-[10px] text-amber-600 flex items-center gap-1">
                              <UserPlus size={10} /> Nama manual akan dikesan automatik semasa jana laporan.
                            </span>
                          </div>
                        ) : (
                          <select
                            value={status.pppId || ''}
                            onChange={(e) => setTeamPPP(team.id, e.target.value)}
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                          >
                            <option value="">-- Pilih PPP Bertugas --</option>
                            {(Object.entries(groupedPPPs) as [string, PPPContact[]][]).map(([category, items]) => (
                              <optgroup key={category} label={`--- ${category} ---`}>
                                {items.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.personalPhone})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                            <option value="OTHERS">+ LAIN-LAIN (NAMA MANUAL)</option>
                          </select>
                        )}
                      </div>
                    )}

                    {/* Catatan / Nota Pasukan */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nota / Catatan Tambahan</label>
                      <input 
                        type="text"
                        placeholder="cth: TIDAK DIMAKLUMKAN STANDDOWN"
                        value={status.notes || ''}
                        onChange={(e) => setTeamNotes(team.id, e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-rose-500 font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 font-medium">
                    Pasukan ditetapkan tidak beroperasi bagi shif ini.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Bar for Quick Generation */}
      <div className="sticky bottom-6 z-30 max-w-xl mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-2 pl-2">
            <ShieldCheck className="text-rose-400" size={18} />
            <div className="text-xs">
              <span className="font-bold text-white">POZ {shift}</span>
              <span className="text-slate-400 ml-1.5">
                ({pozTeams.filter(t => teamStatuses[t.id]?.active).length}/{pozTeams.length} Aktif)
              </span>
            </div>
          </div>
          <button
            onClick={handleJanaLaporan}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Send size={15} /> JANA LAPORAN POZ
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Auto-detected Manual Names */}
      {showNewNamesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Kesan Nama Manual Baharu
                </h3>
                <p className="text-xs text-slate-500">
                  Adakah anda ingin menyimpan nama baharu ini ke dalam senarai induk secara automatik?
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {detectedNames.map((item) => (
                <div 
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    item.selected ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectDetectedName(item.id)}
                      className="text-amber-600"
                    >
                      {item.selected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <div>
                      <span className="text-sm font-black text-slate-900">{item.name}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{item.teamName}</span>
                        <span>•</span>
                        <span className="font-semibold text-rose-600">{item.type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {item.type === 'ppp' && (
                    <select
                      value={item.category}
                      onChange={(e) => handleCategoryChangeDetectedName(item.id, e.target.value)}
                      className="text-xs p-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      {AVAILABLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setShowNewNamesModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowNewNamesModal(false);
                  setShowPreview(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Teruskan Tanpa Simpan
              </button>
              <button
                onClick={handleConfirmSaveNewNames}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Check size={14} /> Simpan ke Senarai & Teruskan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Pratonton Laporan WhatsApp POZ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Semak format teks mesej sebelum dihantar
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Format Teks Laporan POZ (Boleh disunting terus jika perlu):</span>
                <button
                  type="button"
                  onClick={() => setPreviewText(generateMessage())}
                  className="text-rose-600 hover:text-rose-700 text-xs font-bold underline"
                >
                  Set Semula ke Format Asal
                </button>
              </div>
              <textarea
                value={currentFormattedMessage}
                onChange={(e) => setPreviewText(e.target.value)}
                rows={16}
                className="w-full bg-white p-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm whitespace-pre-wrap text-slate-900 leading-relaxed focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-inner resize-y select-all"
              />
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3 bg-white">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? 'Telah Disalin!' : 'Salin Mesej'}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md shadow-emerald-600/30"
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
            <h3 className="text-lg font-black text-slate-900 text-center">Set Semula Borang POZ?</h3>
            <p className="text-xs text-slate-500 text-center">
              Semua pilihan responder dan status aktif pasukan akan dikembalikan ke keadaan lalai.
            </p>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const resetVal: Record<string, PozTeamStatusItem> = {};
                  pozTeams.forEach(t => {
                    resetVal[t.id] = {
                      active: t.defaultStatus,
                      pppId: '',
                      manualName1: t.id === 'stjohn4' ? 'AFIQ' : '',
                      manualName2: t.id === 'stjohn4' ? 'YONG' : ''
                    };
                  });
                  setTeamStatuses(resetVal);
                  setShowResetConfirm(false);
                  showToast('Borang POZ telah diset semula');
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Ya, Set Semula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manage Saved Custom Names */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Urus Senarai Nama Tambahan</h3>
              <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">PPP Tambahan ({customPppList.length})</span>
                <div className="mt-1 space-y-1.5">
                  {customPppList.map(p => (
                    <div key={p.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-800">{p.name}</strong>
                        <span className="text-[10px] text-slate-400 ml-2">({p.category})</span>
                      </div>
                      <button 
                        onClick={() => {
                          const updated = customPppList.filter(item => item.id !== p.id);
                          setCustomPppList(updated);
                          localStorage.setItem('poz_custom_ppps', JSON.stringify(updated));
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">St. John Tambahan ({customStJohnList.length})</span>
                <div className="mt-1 space-y-1.5">
                  {customStJohnList.map(n => (
                    <div key={n} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                      <strong className="text-slate-800">{n}</strong>
                      <button 
                        onClick={() => {
                          const updated = customStJohnList.filter(item => item !== n);
                          setCustomStJohnList(updated);
                          localStorage.setItem('poz_custom_stjohn', JSON.stringify(updated));
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
