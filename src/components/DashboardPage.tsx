/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Activity, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Phone, 
  User, 
  Edit2, 
  Search, 
  Filter, 
  ArrowRight, 
  Check, 
  X, 
  AlertCircle,
  Calendar,
  Layers,
  Users,
  Table,
  List,
  LayoutGrid,
  ClipboardCheck,
  ChevronDown,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { 
  ActiveTab, 
  Shift, 
  AmbulanceTeam, 
  PPPContact, 
  MeccTeam, 
  MeccTeamStatus, 
  MeccStatusType, 
  PozTeamStatusItem 
} from '../types.ts';
import { SHIFT_DETAILS, MECC_STATUS_CONFIG } from '../constants.ts';

interface DashboardPageProps {
  shift: Shift;
  setShift: (s: Shift) => void;
  formattedDate: string;
  reporter: string;
  pozTeams: AmbulanceTeam[];
  pozStatuses: Record<string, PozTeamStatusItem>;
  setPozStatuses: React.Dispatch<React.SetStateAction<Record<string, PozTeamStatusItem>>>;
  allPPPList: PPPContact[];
  allStJohnResponders: string[];
  meccTeams: MeccTeam[];
  meccStatuses: Record<string, MeccTeamStatus>;
  setMeccStatuses: React.Dispatch<React.SetStateAction<Record<string, MeccTeamStatus>>>;
  setActiveTab: (tab: ActiveTab) => void;
}

interface UnifiedAmbulanceItem {
  source: 'POZ' | 'MECC';
  id: string;
  name: string;
  category: string;
  statusText: string;
  statusKey: string;
  statusType: 'success' | 'warning' | 'danger' | 'offline';
  crewText: string;
  phone: string;
  vehiclePlate?: string;
  notes?: string;
  rawPozStatus?: PozTeamStatusItem;
  rawMeccStatus?: MeccTeamStatus;
  rawTeam: AmbulanceTeam | MeccTeam;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  shift,
  formattedDate,
  reporter,
  pozTeams,
  pozStatuses,
  setPozStatuses,
  allPPPList,
  meccTeams,
  meccStatuses,
  setMeccStatuses,
  setActiveTab
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'POZ' | 'MECC' | 'READY' | 'ISSUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // View mode: 'table' (Jadual / Table List by default as requested) or 'cards' (Grid)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [updaterMenuOpen, setUpdaterMenuOpen] = useState(false);
  const [tetapanMenuOpen, setTetapanMenuOpen] = useState(false);
  
  // Instant Edit Modal State
  const [editingItem, setEditingItem] = useState<UnifiedAmbulanceItem | null>(null);

  // Form states for Instant Update
  const [formPozActive, setFormPozActive] = useState<boolean>(true);
  const [formPozPppId, setFormPozPppId] = useState<string>('');
  const [formPozCustomPpp, setFormPozCustomPpp] = useState<string>('');
  const [formPozIsOthers, setFormPozIsOthers] = useState<boolean>(false);
  const [formPozManual1, setFormPozManual1] = useState<string>('');
  const [formPozManual2, setFormPozManual2] = useState<string>('');
  
  const [formMeccStatus, setFormMeccStatus] = useState<MeccStatusType>('SIAP_SEDIA');
  const [formMeccPpp, setFormMeccPpp] = useState<string>('');
  const [formMeccDriver, setFormMeccDriver] = useState<string>('');
  const [formMeccVehicle, setFormMeccVehicle] = useState<string>('');
  const [formMeccNotes, setFormMeccNotes] = useState<string>('');

  // Confirmation Box State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger Toast Notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Compile Unified Ambulance Fleet List
  const unifiedList = useMemo(() => {
    const list: UnifiedAmbulanceItem[] = [];

    // 1. POZ Teams
    pozTeams.forEach(team => {
      const st = pozStatuses[team.id];
      const isActive = st?.active ?? team.defaultStatus;

      let pppDisplay = 'Belum Ditugaskan';
      if (team.id === 'stjohn4') {
        const n1 = st?.manualName1 || 'AFIQ';
        const n2 = st?.manualName2 || 'YONG';
        pppDisplay = `St. John: ${n1} & ${n2}`;
      } else if (st?.isOthersPpp && st.customPppName) {
        pppDisplay = `PPP: ${st.customPppName}`;
      } else if (st?.pppId) {
        const p = allPPPList.find(x => x.id === st.pppId);
        if (p) pppDisplay = `PPP: ${p.name}`;
      }

      list.push({
        source: 'POZ',
        id: team.id,
        name: team.name,
        category: team.category || 'KLANG / HTAR',
        statusText: isActive ? 'SIAP SEDIA' : 'TIDAK BEROPERASI',
        statusKey: isActive ? 'ACTIVE' : 'INACTIVE',
        statusType: isActive ? 'success' : 'offline',
        crewText: pppDisplay,
        phone: team.tmPhone,
        vehiclePlate: team.vehiclePlate,
        notes: st?.notes,
        rawPozStatus: st,
        rawTeam: team
      });
    });

    // 2. MECC Teams
    meccTeams.forEach(team => {
      const st = meccStatuses[team.id];
      const statusKey = st?.status || team.defaultStatus;
      const cfg = MECC_STATUS_CONFIG[statusKey] || MECC_STATUS_CONFIG.SIAP_SEDIA;

      let statusType: 'success' | 'warning' | 'danger' | 'offline' = 'offline';
      if (statusKey === 'SIAP_SEDIA') statusType = 'success';
      else if (statusKey === 'ON_CALL') statusType = 'warning';
      else if (statusKey === 'ROSAK' || statusKey === 'TIADA_STAFF') statusType = 'danger';

      const crewParts = [];
      if (st?.ppp) crewParts.push(`PPP: ${st.ppp}`);
      if (st?.driver) crewParts.push(`Pemandu: ${st.driver}`);
      if (st?.vehicle) crewParts.push(`No: ${st.vehicle}`);

      list.push({
        source: 'MECC',
        id: team.id,
        name: team.name,
        category: team.category,
        statusText: cfg.label,
        statusKey,
        statusType,
        crewText: crewParts.length > 0 ? crewParts.join(' • ') : 'Belum Ditugaskan',
        phone: team.phone || 'N/A',
        vehiclePlate: st?.vehicle || team.defaultVehicle,
        notes: st?.notes,
        rawMeccStatus: st,
        rawTeam: team
      });
    });

    return list;
  }, [pozTeams, pozStatuses, allPPPList, meccTeams, meccStatuses]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let ready = 0;
    let onCall = 0;
    let issues = 0;
    let offline = 0;

    unifiedList.forEach(item => {
      if (item.statusType === 'success') ready++;
      else if (item.statusType === 'warning') onCall++;
      else if (item.statusType === 'danger') issues++;
      else offline++;
    });

    return {
      total: unifiedList.length,
      ready,
      onCall,
      issues,
      offline,
      pozCount: pozTeams.length,
      pozActive: pozTeams.filter(t => pozStatuses[t.id]?.active).length,
      meccCount: meccTeams.length,
      meccReady: meccTeams.filter(t => (meccStatuses[t.id]?.status || t.defaultStatus) === 'SIAP_SEDIA').length
    };
  }, [unifiedList, pozTeams, pozStatuses, meccTeams, meccStatuses]);

  // Filtered List
  const filteredList = useMemo(() => {
    return unifiedList.filter(item => {
      if (filterType === 'POZ' && item.source !== 'POZ') return false;
      if (filterType === 'MECC' && item.source !== 'MECC') return false;
      if (filterType === 'READY' && item.statusType !== 'success') return false;
      if (filterType === 'ISSUE' && item.statusType !== 'danger' && item.statusType !== 'offline') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.crewText.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          (item.vehiclePlate && item.vehiclePlate.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [unifiedList, filterType, searchQuery]);

  // Open Instant Edit Modal via Pencil Icon
  const handleOpenEdit = (item: UnifiedAmbulanceItem) => {
    setEditingItem(item);
    if (item.source === 'POZ') {
      const st = item.rawPozStatus;
      const t = item.rawTeam as AmbulanceTeam;
      setFormPozActive(st?.active ?? t.defaultStatus);
      setFormPozPppId(st?.pppId || '');
      setFormPozCustomPpp(st?.customPppName || '');
      setFormPozIsOthers(st?.isOthersPpp || false);
      setFormPozManual1(st?.manualName1 || (item.id === 'stjohn4' ? 'AFIQ' : ''));
      setFormPozManual2(st?.manualName2 || (item.id === 'stjohn4' ? 'YONG' : ''));
    } else {
      const st = item.rawMeccStatus;
      const t = item.rawTeam as MeccTeam;
      setFormMeccStatus(st?.status || t.defaultStatus);
      setFormMeccPpp(st?.ppp || t.defaultPpp || '');
      setFormMeccDriver(st?.driver || t.defaultDriver || '');
      setFormMeccVehicle(st?.vehicle || t.defaultVehicle || '');
      setFormMeccNotes(st?.notes || '');
    }
  };

  // Step 1: User clicks "Kemaskini Status" in Modal -> Show Confirmation Box
  const handleInitiateConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Step 2: User Confirms in Confirmation Box -> Save immediately to state and localStorage
  const handleExecuteSave = () => {
    if (!editingItem) return;

    if (editingItem.source === 'POZ') {
      const updatedStatuses = {
        ...pozStatuses,
        [editingItem.id]: {
          ...pozStatuses[editingItem.id],
          active: formPozActive,
          pppId: formPozIsOthers ? '' : formPozPppId,
          customPppName: formPozIsOthers ? formPozCustomPpp : '',
          isOthersPpp: formPozIsOthers,
          manualName1: formPozManual1,
          manualName2: formPozManual2
        }
      };

      setPozStatuses(updatedStatuses);
      try {
        localStorage.setItem('poz_team_statuses', JSON.stringify(updatedStatuses));
      } catch (err) {
        console.error('Error saving poz_team_statuses:', err);
      }
      triggerToast(`Status bagi ${editingItem.name} berjaya dikemaskini kepada: ${formPozActive ? 'SIAP SEDIA' : 'TIDAK BEROPERASI'}`);
    } else {
      // MECC Team Update
      const updatedStatuses = {
        ...meccStatuses,
        [editingItem.id]: {
          status: formMeccStatus,
          ppp: formMeccPpp,
          driver: formMeccDriver,
          vehicle: formMeccVehicle,
          notes: formMeccNotes
        }
      };

      setMeccStatuses(updatedStatuses);
      try {
        localStorage.setItem('mecc_team_statuses', JSON.stringify(updatedStatuses));
      } catch (err) {
        console.error('Error saving mecc_team_statuses:', err);
      }
      const label = MECC_STATUS_CONFIG[formMeccStatus]?.label || formMeccStatus;
      triggerToast(`Status bagi ${editingItem.name} berjaya dikemaskini kepada: ${label}`);
    }

    // Close modals
    setShowConfirmModal(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/40 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
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

      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
              <Truck size={14} /> MECC MANAGEMENT BOARD • SEMUA WILAYAH TERLIBAT
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              MECC Management Board: Dashboard Ambulans
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pemantauan masa nyata keseluruhan armada ambulans bagi semua wilayah terlibat: Daerah Klang (HTAR & KK), PKD Banting, Hospital Banting, Shah Alam & HASA. Kemaskini pantas boleh dibuat secara langsung menggunakan <strong>ikon pensel</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                <Calendar size={13} className="text-rose-400" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                <Clock size={13} className="text-amber-400" />
                <span>Shif: <strong>{shift} ({SHIFT_DETAILS[shift]?.time})</strong></span>
              </span>
              {reporter && (
                <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                  <User size={13} className="text-emerald-400" />
                  <span>Pelapor: <strong>{reporter}</strong></span>
                </span>
              )}
            </div>
          </div>

          {/* Compact Grouped Quick Jump Links (50% Smaller & Mobile Responsive) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 w-full lg:w-auto lg:justify-end shrink-0">
            <button
              onClick={() => setActiveTab('caselog')}
              className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
            >
              <span className="flex items-center gap-1.5 truncate">
                <FileSpreadsheet size={13} className="shrink-0" />
                <span className="truncate">Case Log</span>
              </span>
              <ArrowRight size={12} className="shrink-0" />
            </button>

            <button
              onClick={() => setActiveTab('teamrespond')}
              className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Truck size={13} className="shrink-0" />
                <span className="truncate">Team Respond</span>
              </span>
              <ArrowRight size={12} className="shrink-0" />
            </button>

            <button
              onClick={() => setActiveTab('rollcall')}
              className="flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
            >
              <span className="flex items-center gap-1.5 truncate">
                <ClipboardCheck size={13} className="shrink-0" />
                <span className="truncate">Rollcall Klinik</span>
              </span>
              <ArrowRight size={12} className="shrink-0" />
            </button>

            {/* Foldable Link Group: UPDATER (POZ Updater & MECC Status) */}
            <div className="relative">
              <button
                onClick={() => {
                  setUpdaterMenuOpen(prev => !prev);
                  setTetapanMenuOpen(false);
                }}
                className="w-full flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold border border-slate-700 transition-all shadow-sm"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Activity size={13} className="shrink-0 text-rose-400" />
                  <span className="truncate">Updater</span>
                </span>
                <ChevronDown size={13} className={`shrink-0 transition-transform ${updaterMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {updaterMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-slate-900 rounded-xl border border-slate-700 shadow-xl p-1 z-30 space-y-0.5">
                  <button
                    onClick={() => { setActiveTab('poz'); setUpdaterMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-200 hover:bg-slate-800 hover:text-rose-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><Activity size={12} className="text-rose-400" /> POZ Updater</span>
                    <ArrowRight size={11} />
                  </button>
                  <button
                    onClick={() => { setActiveTab('mecc'); setUpdaterMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-200 hover:bg-slate-800 hover:text-amber-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><Radio size={12} className="text-amber-400" /> MECC Status</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Foldable Link Group: TETAPAN (Tetapan Sistem + Senarai Responder) */}
            <div className="relative col-span-2 sm:col-span-1">
              <button
                onClick={() => {
                  setTetapanMenuOpen(prev => !prev);
                  setUpdaterMenuOpen(false);
                }}
                className="w-full flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-700 transition-all shadow-sm"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Settings size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">Tetapan & Responder</span>
                </span>
                <ChevronDown size={13} className={`shrink-0 transition-transform ${tetapanMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {tetapanMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 rounded-xl border border-slate-700 shadow-xl p-1 z-30 space-y-0.5">
                  <button
                    onClick={() => { setActiveTab('responders'); setTetapanMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-200 hover:bg-slate-800 hover:text-rose-300 transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><Users size={12} className="text-rose-400" /> Senarai Responder</span>
                    <ArrowRight size={11} />
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setTetapanMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-1.5"><Settings size={12} className="text-slate-400" /> Tetapan Sistem</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Armada */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Jumlah Armada</span>
            <Layers size={18} className="text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.total}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">POZ: {metrics.pozCount} • MECC: {metrics.meccCount}</p>
          </div>
        </div>

        {/* Siap Sedia */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">Siap Sedia</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.ready}</div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              POZ {metrics.pozActive} | MECC {metrics.meccReady}
            </p>
          </div>
        </div>

        {/* On Call */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider">On Call</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">{metrics.onCall}</div>
            <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Dalam Tugas Menyelamat</p>
          </div>
        </div>

        {/* Rosak / Tiada Staff */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider">Rosak / Kekurangan</span>
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">{metrics.issues}</div>
            <p className="text-[11px] text-rose-700 font-semibold mt-0.5">Memerlukan Tindakan</p>
          </div>
        </div>

        {/* Tidak Aktif / Off */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Off / Rehat</span>
            <XCircle size={18} className="text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-700">{metrics.offline}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Di Luar Waktu Operasi</p>
          </div>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pasukan, KK, responder, plat..."
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter size={13} /> Tapis:
          </span>
          {[
            { id: 'ALL', label: `Semua (${unifiedList.length})` },
            { id: 'POZ', label: `POZ (${pozTeams.length})` },
            { id: 'MECC', label: `MECC (${meccTeams.length})` },
            { id: 'READY', label: `Siap Sedia (${metrics.ready})` },
            { id: 'ISSUE', label: `Bermasalah (${metrics.issues + metrics.offline})` }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === pill.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

      </div>

      {/* View Mode Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-rose-600" />
            Paparan Senarai:
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Paparan Jadual Lengkap (Table List - Default)"
            >
              <List size={14} />
              <span>Jadual (Table List)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Paparan Kad Grid"
            >
              <LayoutGrid size={14} />
              <span>Kad (Grid)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {filteredList.length} pasukan tersenarai
          </span>
          <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1 font-medium">
            <Edit2 size={13} className="text-rose-600" /> Klik ikon pensel untuk kemaskini segera
          </span>
        </div>
      </div>

      {/* Ambulance Teams Display */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Truck size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Tiada Pasukan Dijumpai</h3>
            <p className="text-xs text-slate-500 mt-1">Cuba tukar kata carian atau penapis kategori anda.</p>
            <button
              onClick={() => { setFilterType('ALL'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              Set Semula Carian
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* ======================================================== */
          /* DEFAULT: TABLE LIST VIEW (SENARAI JADUAL DI DASHBOARD)   */
          /* ======================================================== */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center">Bil</th>
                    <th className="py-3 px-4 min-w-[200px]">Pasukan & Kategori</th>
                    <th className="py-3 px-4 min-w-[150px]">Status Kesiapsiagaan</th>
                    <th className="py-3 px-4 min-w-[220px]">Petugas / Responder Bertugas</th>
                    <th className="py-3 px-4 min-w-[140px]">No. Perhubungan</th>
                    <th className="py-3 px-4 min-w-[160px]">Catatan / Lokasi</th>
                    <th className="py-3 px-4 text-center min-w-[110px]">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {filteredList.map((item, index) => {
                    const isPoz = item.source === 'POZ';
                    
                    // Status Badge Styling
                    let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                    let statusDot = 'bg-slate-400';
                    if (item.statusType === 'success') {
                      statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      statusDot = 'bg-emerald-500 animate-pulse';
                    } else if (item.statusType === 'warning') {
                      statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                      statusDot = 'bg-amber-500';
                    } else if (item.statusType === 'danger') {
                      statusBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                      statusDot = 'bg-rose-500';
                    }

                    return (
                      <tr 
                        key={`${item.source}-${item.id}`}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* 1. Bil */}
                        <td className="py-3.5 px-3.5 text-center text-xs text-slate-400 font-mono">
                          {index + 1}
                        </td>

                        {/* 2. Pasukan & Kategori */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors text-xs sm:text-sm">
                                {item.name}
                              </span>
                              {item.vehiclePlate && (
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                  {item.vehiclePlate}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border ${
                                isPoz 
                                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {item.source}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Status Kesiapsiagaan */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
                            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                            {item.statusText}
                          </span>
                        </td>

                        {/* 4. Petugas Bertugas */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2 bg-slate-50/90 p-2 rounded-xl border border-slate-100 text-xs">
                            <User size={13} className="text-slate-400 mt-0.5 shrink-0" />
                            <span className="font-semibold text-slate-800 break-words leading-snug">
                              {item.crewText}
                            </span>
                          </div>
                        </td>

                        {/* 5. No. Perhubungan */}
                        <td className="py-3.5 px-4">
                          {item.phone && item.phone !== 'N/A' ? (
                            <a 
                              href={`tel:${item.phone}`} 
                              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 hover:text-rose-600 hover:underline bg-slate-100 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                              title={`Hubungi ${item.phone}`}
                            >
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span>{item.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tiada nombor</span>
                          )}
                        </td>

                        {/* 6. Catatan / Lokasi */}
                        <td className="py-3.5 px-4">
                          {item.notes ? (
                            <span className="text-xs text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg block font-normal leading-relaxed">
                              {item.notes}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">-</span>
                          )}
                        </td>

                        {/* 7. Tindakan (Pencil Kemaskini Button) */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title={`Kemaskini segera ${item.name}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white transition-all text-xs font-bold shadow-sm group-hover:bg-rose-50 group-hover:text-rose-700 group-hover:hover:bg-rose-600 group-hover:hover:text-white"
                          >
                            <Edit2 size={13} className="shrink-0" />
                            <span>Kemaskini</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* COMPACT CARD GRID VIEW (50% SMALLER & MOBILE RESPONSIVE) */
          /* ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredList.map((item) => {
              const isPoz = item.source === 'POZ';
              
              // Status Badge Styling
              let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
              let statusDot = 'bg-slate-400';
              if (item.statusType === 'success') {
                statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                statusDot = 'bg-emerald-500';
              } else if (item.statusType === 'warning') {
                statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                statusDot = 'bg-amber-500';
              } else if (item.statusType === 'danger') {
                statusBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                statusDot = 'bg-rose-500';
              }

              return (
                <div 
                  key={`${item.source}-${item.id}`}
                  className="bg-white rounded-xl p-3 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between gap-2 group relative"
                >
                  <div>
                    {/* Top row: Category tag & Compact Edit Button */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1 flex-wrap min-w-0">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider border ${
                          isPoz 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.source} • {item.category}
                        </span>
                        {item.vehiclePlate && (
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {item.vehiclePlate}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        title={`Kemaskini segera ${item.name}`}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white transition-all text-[11px] font-bold shrink-0"
                      >
                        <Edit2 size={11} className="shrink-0" />
                        <span>Ubah</span>
                      </button>
                    </div>

                    {/* Team Name & Status Inline */}
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                        {item.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${statusBadgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                        {item.statusText}
                      </span>
                    </div>

                    {/* Compact Crew & Phone */}
                    <div className="mt-2 space-y-1 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <div className="flex items-start gap-1.5">
                        <User size={11} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="font-semibold text-slate-800 break-words leading-tight line-clamp-2">
                          {item.crewText}
                        </span>
                      </div>
                      {item.phone && item.phone !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Phone size={10} className="text-slate-400 shrink-0" />
                          <a 
                            href={`tel:${item.phone}`} 
                            className="font-mono hover:text-rose-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.phone}
                          </a>
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[10px] text-slate-500 italic border-t border-slate-200/60 pt-1 line-clamp-1">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* INSTANT UPDATE MODAL (TRIGGERED BY PENCIL ICON) */}
      {/* ======================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                  <Edit2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">
                      Kemaskini Segera Ambulans
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {editingItem.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {editingItem.name} • {editingItem.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInitiateConfirm} className="space-y-5">
              
              {/* IF POZ TEAM FORM */}
              {editingItem.source === 'POZ' ? (
                <div className="space-y-4">
                  
                  {/* Status Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Status Pengoperasian Pasukan
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormPozActive(true)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                          formPozActive 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/20' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        <span>SIAP SEDIA (Aktif)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormPozActive(false)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                          !formPozActive 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-900/20' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <XCircle size={16} />
                        <span>TIDAK BEROPERASI (Off)</span>
                      </button>
                    </div>
                  </div>

                  {/* PPP Selector or St John Inputs */}
                  {editingItem.id === 'stjohn4' ? (
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800">
                        Responder St. John 4 Bertugas:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500">Anggota 1</label>
                          <input 
                            type="text"
                            value={formPozManual1}
                            onChange={(e) => setFormPozManual1(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                            placeholder="Nama Responder 1"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500">Anggota 2</label>
                          <input 
                            type="text"
                            value={formPozManual2}
                            onChange={(e) => setFormPozManual2(e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                            placeholder="Nama Responder 2"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Penolong Pegawai Perubatan (PPP)
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormPozIsOthers(!formPozIsOthers)}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          {formPozIsOthers ? 'Pilih Dari Senarai' : 'Taip Manual (Lain-lain)'}
                        </button>
                      </div>

                      {formPozIsOthers ? (
                        <input 
                          type="text"
                          value={formPozCustomPpp}
                          onChange={(e) => setFormPozCustomPpp(e.target.value)}
                          placeholder="Masukkan nama PPP bertugas..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      ) : (
                        <select
                          value={formPozPppId}
                          onChange={(e) => setFormPozPppId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <option value="">-- Pilih PPP Bertugas --</option>
                          {allPPPList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.personalPhone}) [{p.category}]
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Phone Info */}
                  <div className="text-xs text-slate-500 flex items-center justify-between bg-slate-100/60 p-2.5 rounded-xl">
                    <span>No. Telefon TM:</span>
                    <strong className="font-mono text-slate-800">{editingItem.phone}</strong>
                  </div>

                </div>
              ) : (
                /* IF MECC TEAM FORM */
                <div className="space-y-4">
                  
                  {/* MECC Status 5-Way Radio Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Pilih Status Operasi MECC:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['SIAP_SEDIA', 'ON_CALL', 'ROSAK', 'TIADA_STAFF', 'OFF'] as MeccStatusType[]).map((stKey) => {
                        const cfg = MECC_STATUS_CONFIG[stKey];
                        const isSelected = formMeccStatus === stKey;
                        return (
                          <button
                            type="button"
                            key={stKey}
                            onClick={() => setFormMeccStatus(stKey)}
                            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all text-left ${
                              isSelected
                                ? `${cfg.bg} ${cfg.border} ring-2 ring-slate-800/40 shadow-sm font-black`
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className="truncate">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Responder inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        PPP / Paramedik:
                      </label>
                      <input 
                        type="text"
                        value={formMeccPpp}
                        onChange={(e) => setFormMeccPpp(e.target.value)}
                        placeholder="Contoh: PPP AHMAD"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Pemandu (Driver):
                      </label>
                      <input 
                        type="text"
                        value={formMeccDriver}
                        onChange={(e) => setFormMeccDriver(e.target.value)}
                        placeholder="Contoh: EN. RAZIF"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        No. Kenderaan / Plat:
                      </label>
                      <input 
                        type="text"
                        value={formMeccVehicle}
                        onChange={(e) => setFormMeccVehicle(e.target.value)}
                        placeholder="Contoh: WYY 1234"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Catatan / Lokasi:
                      </label>
                      <input 
                        type="text"
                        value={formMeccNotes}
                        onChange={(e) => setFormMeccNotes(e.target.value)}
                        placeholder="Contoh: Di Zon Hijau / Servis"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/30 flex items-center gap-1.5 transition-all"
                >
                  <Check size={16} />
                  <span>Sahkan Perubahan Status</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRMATION BOX MODAL AS REQUESTED */}
      {/* "AND CONFIRMTAION BOX WHEN CHOOSE TO UPDATE AND MAKE CHANGES" */}
      {/* ======================================================== */}
      {showConfirmModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-rose-500/20 space-y-5 animate-scale-up">
            
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
                <AlertCircle size={26} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  Pengesahan Kemaskini Status
                </h4>
                <p className="text-xs text-slate-500">
                  Sila sahkan maklumat sebelum perubahan disimpan.
                </p>
              </div>
            </div>

            {/* Change Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Pasukan Ambulans:</span>
                <span className="font-bold text-slate-900">{editingItem.name} ({editingItem.category})</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Status Semasa:</span>
                <span className="font-semibold text-slate-600">{editingItem.statusText}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Status Baru Ditukar:</span>
                <span className="font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  {editingItem.source === 'POZ' 
                    ? (formPozActive ? 'SIAP SEDIA (Aktif)' : 'TIDAK BEROPERASI (Off)')
                    : MECC_STATUS_CONFIG[formMeccStatus]?.label
                  }
                </span>
              </div>

              {editingItem.source === 'POZ' ? (
                <div className="flex justify-between items-start pt-1">
                  <span className="text-slate-500">Petugas PPP/Crew:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {editingItem.id === 'stjohn4' 
                      ? `St. John: ${formPozManual1 || 'AFIQ'} & ${formPozManual2 || 'YONG'}`
                      : formPozIsOthers 
                        ? (formPozCustomPpp || 'Lain-lain')
                        : (allPPPList.find(p => p.id === formPozPppId)?.name || 'Belum dipilih')
                    }
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">Petugas PPP:</span>
                    <span className="font-bold text-slate-900">{formMeccPpp || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Pemandu:</span>
                    <span className="font-bold text-slate-900">{formMeccDriver || '-'}</span>
                  </div>
                  {formMeccVehicle && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">No. Kenderaan:</span>
                      <span className="font-mono font-bold text-slate-900">{formMeccVehicle}</span>
                    </div>
                  )}
                  {formMeccNotes && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="text-slate-500">Catatan:</span>
                      <span className="italic">{formMeccNotes}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Adakah anda pasti untuk membuat kemaskini ini? Perubahan akan disimpan secara langsung ke storan peranti.
            </p>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Batal / Edit Semula
              </button>
              <button
                type="button"
                onClick={handleExecuteSave}
                className="py-2.5 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                <span>Ya, Sahkan Kemaskini</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
