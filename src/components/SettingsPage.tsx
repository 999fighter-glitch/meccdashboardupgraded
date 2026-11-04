/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Truck, 
  Database, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Tag, 
  ShieldCheck,
  Save,
  ArrowRight
} from 'lucide-react';
import { 
  ActiveTab,
  AmbulanceTeam, 
  PPPContact, 
  MeccTeam, 
  Shift,
  ResponderEditOverride,
  OncallClinic,
  ShiftRollcallMap,
  RollcallTemplates,
  CaseLogItem
} from '../types.ts';
import { 
  AVAILABLE_CATEGORIES, 
  MECC_CATEGORIES,
  DEFAULT_MECC_TEAMS,
  AMBULANCE_TEAMS,
  PPP_LIST,
  STJOHN_RESPONDERS,
  DEFAULT_ONCALL_CLINICS,
  DEFAULT_ROLLCALL_MESSAGE,
  DEFAULT_QUICK_REPLY_MESSAGE
} from '../constants.ts';

interface SettingsPageProps {
  pozTeams: AmbulanceTeam[];
  setPozTeams: React.Dispatch<React.SetStateAction<AmbulanceTeam[]>>;
  meccTeams: MeccTeam[];
  setMeccTeams: React.Dispatch<React.SetStateAction<MeccTeam[]>>;
  customPppList: PPPContact[];
  setCustomPppList: React.Dispatch<React.SetStateAction<PPPContact[]>>;
  customStJohnList: string[];
  setCustomStJohnList: React.Dispatch<React.SetStateAction<string[]>>;
  responderEdits: Record<string, ResponderEditOverride>;
  setResponderEdits: React.Dispatch<React.SetStateAction<Record<string, ResponderEditOverride>>>;
  oncallClinics: OncallClinic[];
  setOncallClinics: React.Dispatch<React.SetStateAction<OncallClinic[]>>;
  shiftRollcalls: ShiftRollcallMap;
  setShiftRollcalls: React.Dispatch<React.SetStateAction<ShiftRollcallMap>>;
  rollcallTemplates: RollcallTemplates;
  setRollcallTemplates: React.Dispatch<React.SetStateAction<RollcallTemplates>>;
  caseLogs: CaseLogItem[];
  setCaseLogs: React.Dispatch<React.SetStateAction<CaseLogItem[]>>;
  reporter: string;
  setReporter: (r: string) => void;
  shift: Shift;
  setShift: (s: Shift) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  pozTeams,
  setPozTeams,
  meccTeams,
  setMeccTeams,
  customPppList,
  setCustomPppList,
  customStJohnList,
  setCustomStJohnList,
  responderEdits,
  setResponderEdits,
  oncallClinics,
  setOncallClinics,
  shiftRollcalls,
  setShiftRollcalls,
  rollcallTemplates,
  setRollcallTemplates,
  caseLogs,
  setCaseLogs,
  reporter,
  setReporter,
  shift,
  setShift,
  setActiveTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teams' | 'responders' | 'app' | 'database'>('teams');
  const [teamTypeFilter, setTeamTypeFilter] = useState<'ALL' | 'POZ' | 'MECC'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamType, setNewTeamType] = useState<'POZ' | 'MECC'>('MECC');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCategory, setNewTeamCategory] = useState('PKD BANTING');
  const [newTeamPhone, setNewTeamPhone] = useState('');

  // Add Custom Responder
  const [newPppName, setNewPppName] = useState('');
  const [newPppPhone, setNewPppPhone] = useState('');
  const [newPppCategory, setNewPppCategory] = useState('PHC HTAR');
  const [newStJohnName, setNewStJohnName] = useState('');

  // Reset database confirm
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add Team
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    if (newTeamType === 'POZ') {
      const newTeam: AmbulanceTeam = {
        id: `poz_custom_${Date.now()}`,
        name: newTeamName.trim(),
        tmPhone: newTeamPhone.trim() || 'N/A',
        defaultStatus: true,
        category: newTeamCategory
      };
      const updated = [...pozTeams, newTeam];
      setPozTeams(updated);
      localStorage.setItem('poz_custom_teams_list', JSON.stringify(updated));
    } else {
      const newTeam: MeccTeam = {
        id: `mecc_custom_${Date.now()}`,
        name: newTeamName.trim(),
        category: newTeamCategory,
        defaultStatus: 'SIAP_SEDIA',
        phone: newTeamPhone.trim() || 'N/A'
      };
      const updated = [...meccTeams, newTeam];
      setMeccTeams(updated);
      localStorage.setItem('mecc_custom_teams_list', JSON.stringify(updated));
    }

    setNewTeamName('');
    setNewTeamPhone('');
    setShowAddTeamModal(false);
    showToast(`Pasukan "${newTeamName.trim()}" berjaya ditambah!`);
  };

  // Delete Team
  const handleDeletePozTeam = (teamId: string) => {
    const updated = pozTeams.filter(t => t.id !== teamId);
    setPozTeams(updated);
    localStorage.setItem('poz_custom_teams_list', JSON.stringify(updated));
    showToast('Pasukan POZ berjaya dipadam');
  };

  const handleDeleteMeccTeam = (teamId: string) => {
    const updated = meccTeams.filter(t => t.id !== teamId);
    setMeccTeams(updated);
    localStorage.setItem('mecc_custom_teams_list', JSON.stringify(updated));
    showToast('Pasukan MECC berjaya dipadam');
  };

  // Responders management
  const handleAddCustomPpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPppName.trim()) return;
    const item: PPPContact = {
      id: `custom_ppp_${Date.now()}`,
      name: newPppName.trim().toUpperCase(),
      personalPhone: newPppPhone.trim() || 'N/A',
      category: newPppCategory
    };
    const updated = [...customPppList, item];
    setCustomPppList(updated);
    localStorage.setItem('poz_custom_ppps', JSON.stringify(updated));
    setNewPppName('');
    setNewPppPhone('');
    showToast(`PPP ${item.name} berjaya disimpan`);
  };

  const handleDeletePpp = (id: string) => {
    const updated = customPppList.filter(p => p.id !== id);
    setCustomPppList(updated);
    localStorage.setItem('poz_custom_ppps', JSON.stringify(updated));
    showToast('PPP berjaya dipadam dari senarai');
  };

  const handleAddCustomStJohn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStJohnName.trim()) return;
    const name = newStJohnName.trim().toUpperCase();
    if (!customStJohnList.includes(name) && !STJOHN_RESPONDERS.includes(name)) {
      const updated = [...customStJohnList, name];
      setCustomStJohnList(updated);
      localStorage.setItem('poz_custom_stjohn', JSON.stringify(updated));
      showToast(`St. John responder ${name} berjaya disimpan`);
    } else {
      showToast('Nama ini sudah wujud dalam senarai');
    }
    setNewStJohnName('');
  };

  const handleDeleteStJohn = (name: string) => {
    const updated = customStJohnList.filter(n => n !== name);
    setCustomStJohnList(updated);
    localStorage.setItem('poz_custom_stjohn', JSON.stringify(updated));
    showToast('Responder St. John berjaya dipadam');
  };

  // Database Backup (Export JSON)
  const handleExportData = () => {
    const backup = {
      version: '1.2',
      exportDate: new Date().toISOString(),
      pozTeams,
      meccTeams,
      customPppList,
      customStJohnList,
      responderEdits,
      oncallClinics,
      shiftRollcalls,
      rollcallTemplates,
      caseLogs,
      pozTeamStatuses: JSON.parse(localStorage.getItem('poz_team_statuses') || '{}'),
      meccTeamStatuses: JSON.parse(localStorage.getItem('mecc_team_statuses') || '{}'),
      reporter,
      shift
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mecc_management_board_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Fail sandaran JSON berjaya dimuat turun!');
  };

  // Database Restore (Import JSON)
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.pozTeams) {
          setPozTeams(parsed.pozTeams);
          localStorage.setItem('poz_custom_teams_list', JSON.stringify(parsed.pozTeams));
        }
        if (parsed.meccTeams) {
          setMeccTeams(parsed.meccTeams);
          localStorage.setItem('mecc_custom_teams_list', JSON.stringify(parsed.meccTeams));
        }
        if (parsed.customPppList) {
          setCustomPppList(parsed.customPppList);
          localStorage.setItem('poz_custom_ppps', JSON.stringify(parsed.customPppList));
        }
        if (parsed.customStJohnList) {
          setCustomStJohnList(parsed.customStJohnList);
          localStorage.setItem('poz_custom_stjohn', JSON.stringify(parsed.customStJohnList));
        }
        if (parsed.responderEdits) {
          setResponderEdits(parsed.responderEdits);
          localStorage.setItem('mecc_responder_edits', JSON.stringify(parsed.responderEdits));
        }
        if (parsed.oncallClinics) {
          setOncallClinics(parsed.oncallClinics);
          localStorage.setItem('mecc_clinic_rollcall_list', JSON.stringify(parsed.oncallClinics));
        }
        if (parsed.shiftRollcalls) {
          setShiftRollcalls(parsed.shiftRollcalls);
          localStorage.setItem('mecc_clinic_rollcall_by_shift', JSON.stringify(parsed.shiftRollcalls));
        }
        if (parsed.rollcallTemplates) {
          setRollcallTemplates(parsed.rollcallTemplates);
          localStorage.setItem('mecc_rollcall_templates', JSON.stringify(parsed.rollcallTemplates));
        }
        if (Array.isArray(parsed.caseLogs)) {
          setCaseLogs(parsed.caseLogs);
          localStorage.setItem('mecc_case_logs', JSON.stringify(parsed.caseLogs));
        }
        if (parsed.pozTeamStatuses) {
          localStorage.setItem('poz_team_statuses', JSON.stringify(parsed.pozTeamStatuses));
        }
        if (parsed.meccTeamStatuses) {
          localStorage.setItem('mecc_team_statuses', JSON.stringify(parsed.meccTeamStatuses));
        }
        if (parsed.reporter) {
          setReporter(parsed.reporter);
          localStorage.setItem('poz_reporter', parsed.reporter);
        }
        if (parsed.shift) {
          setShift(parsed.shift);
          localStorage.setItem('poz_shift', parsed.shift);
        }

        showToast('Data sandaran berjaya dipulihkan!');
      } catch (err) {
        console.error('Import failed:', err);
        showToast('Ralat: Fail JSON tidak sah');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Factory Reset
  const handleFactoryReset = () => {
    localStorage.removeItem('poz_custom_teams_list');
    localStorage.removeItem('mecc_custom_teams_list');
    localStorage.removeItem('poz_custom_ppps');
    localStorage.removeItem('poz_custom_stjohn');
    localStorage.removeItem('mecc_responder_edits');
    localStorage.removeItem('mecc_clinic_rollcall_list');
    localStorage.removeItem('mecc_clinic_rollcall_by_shift');
    localStorage.removeItem('mecc_rollcall_templates');
    localStorage.removeItem('mecc_case_logs');
    localStorage.removeItem('poz_team_statuses');
    localStorage.removeItem('mecc_team_statuses');
    localStorage.removeItem('poz_reporter');
    localStorage.removeItem('poz_shift');

    setPozTeams(AMBULANCE_TEAMS);
    setMeccTeams(DEFAULT_MECC_TEAMS);
    setCustomPppList([]);
    setCustomStJohnList([]);
    setResponderEdits({});
    setOncallClinics(DEFAULT_ONCALL_CLINICS);
    setShiftRollcalls({ AM: {}, PM: {}, ON: {} });
    setRollcallTemplates({
      rollcallMessage: DEFAULT_ROLLCALL_MESSAGE,
      quickReplyMessage: DEFAULT_QUICK_REPLY_MESSAGE
    });
    setCaseLogs([]);
    setReporter('');
    setShowFactoryResetModal(false);
    showToast('Sistem berjaya diset semula kepada konfigurasi asal kilang');
  };

  // Storage Stats
  const storageUsageKb = (JSON.stringify(localStorage).length * 2) / 1024;

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
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
              <Sliders size={14} className="text-rose-400" /> MECC MANAGEMENT BOARD • PENGURUSAN SISTEM
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tetapan MECC Management Board
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Urus senarai pasukan ambulans, responder, tetapan aplikasi dan sandaran pangkalan data bagi semua wilayah terlibat (Klang, Banting, Shah Alam & HASA).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Download size={14} /> Eksport Data
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveSubTab('teams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'teams' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck size={16} className={activeSubTab === 'teams' ? 'text-rose-600' : ''} />
          <span>Pengurusan Pasukan</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {pozTeams.length + meccTeams.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('responders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'responders' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={16} className={activeSubTab === 'responders' ? 'text-rose-600' : ''} />
          <span>Pengurusan Responder</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {customPppList.length + customStJohnList.length} Ditambah
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('app')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'app' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders size={16} className={activeSubTab === 'app' ? 'text-rose-600' : ''} />
          <span>Tetapan Aplikasi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'database' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database size={16} className={activeSubTab === 'database' ? 'text-rose-600' : ''} />
          <span>Pangkalan Data & Sandaran</span>
        </button>

        {/* Sorted Direct Link: Senarai Responder under Tetapan */}
        <button
          onClick={() => setActiveTab('responders')}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
        >
          <Users size={15} />
          <span>Direktori Senarai Responder</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* SUB-TAB 1: TEAM MANAGEMENT */}
      {activeSubTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Tapis Kategori Pasukan:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setTeamTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-lg ${teamTypeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                  Semua ({pozTeams.length + meccTeams.length})
                </button>
                <button
                  onClick={() => setTeamTypeFilter('POZ')}
                  className={`px-3 py-1 rounded-lg ${teamTypeFilter === 'POZ' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
                >
                  POZ HTAR ({pozTeams.length})
                </button>
                <button
                  onClick={() => setTeamTypeFilter('MECC')}
                  className={`px-3 py-1 rounded-lg ${teamTypeFilter === 'MECC' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600'}`}
                >
                  MECC ({meccTeams.length})
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowAddTeamModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Tambah Pasukan Baharu
            </button>
          </div>

          {/* List of Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* POZ Teams */}
            {(teamTypeFilter === 'ALL' || teamTypeFilter === 'POZ') && pozTeams.map((team) => (
              <div key={team.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        POZ
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {team.category || 'KLANG'}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">{team.name}</h4>
                  </div>
                  {team.id.startsWith('poz_custom_') && (
                    <button 
                      onClick={() => handleDeletePozTeam(team.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Padam pasukan ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    <span className="font-mono text-[11px]">{team.tmPhone}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${team.defaultStatus ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {team.defaultStatus ? 'Aktif Lalai' : 'Standby'}
                  </span>
                </div>
              </div>
            ))}

            {/* MECC Teams */}
            {(teamTypeFilter === 'ALL' || teamTypeFilter === 'MECC') && meccTeams.map((team) => (
              <div key={team.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        MECC
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {team.category}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 mt-1">{team.name}</h4>
                  </div>
                  {team.id.startsWith('mecc_custom_') && (
                    <button 
                      onClick={() => handleDeleteMeccTeam(team.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Padam pasukan ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    <span className="font-mono text-[11px]">{team.phone || 'N/A'}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                    {team.defaultStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RESPONDERS MANAGEMENT */}
      {activeSubTab === 'responders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Custom PPP List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="text-rose-600" size={18} /> Senarai PPP Tambahan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pegawai Penolong Perubatan yang dimasukkan secara manual
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
                {customPppList.length} Orang
              </span>
            </div>

            {/* Form tambah PPP */}
            <form onSubmit={handleAddCustomPpp} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Tambah PPP Baharu:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input 
                  type="text"
                  placeholder="Nama PPP (cth: AHMAD)..."
                  value={newPppName}
                  onChange={(e) => setNewPppName(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl uppercase font-semibold"
                />
                <input 
                  type="text"
                  placeholder="No Telefon (cth: 0123456789)..."
                  value={newPppPhone}
                  onChange={(e) => setNewPppPhone(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newPppCategory}
                  onChange={(e) => setNewPppCategory(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl flex-1 font-medium"
                >
                  {AVAILABLE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Simpan
                </button>
              </div>
            </form>

            {/* List */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {customPppList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Tiada PPP manual disimpan setakat ini.</p>
              ) : (
                customPppList.map((ppp) => (
                  <div key={ppp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{ppp.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {ppp.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{ppp.personalPhone}</span>
                    </div>
                    <button 
                      onClick={() => handleDeletePpp(ppp.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom St John List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600" size={18} /> Responders St. John Tambahan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anggota St. John Ambulans Malaysia (SJAM) manual
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {customStJohnList.length} Orang
              </span>
            </div>

            {/* Form tambah St John */}
            <form onSubmit={handleAddCustomStJohn} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2">
              <input 
                type="text"
                placeholder="Nama Responder (cth: SHAHRIR)..."
                value={newStJohnName}
                onChange={(e) => setNewStJohnName(e.target.value)}
                className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl uppercase font-semibold flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shrink-0"
              >
                <Plus size={14} /> Simpan
              </button>
            </form>

            {/* List */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {customStJohnList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Tiada responder St. John manual disimpan setakat ini.</p>
              ) : (
                customStJohnList.map((name) => (
                  <div key={name} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{name}</span>
                    <button 
                      onClick={() => handleDeleteStJohn(name)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: APP SETTINGS */}
      {activeSubTab === 'app' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm max-w-2xl space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Tetapan Umum Aplikasi</h3>
            <p className="text-xs text-slate-500">Konfigurasi nilai lalai untuk sesi pelaporan ambulans</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Lalai Pelapor / Pegawai Bertugas
              </label>
              <input 
                type="text"
                value={reporter}
                onChange={(e) => {
                  setReporter(e.target.value);
                  localStorage.setItem('poz_reporter', e.target.value);
                }}
                placeholder="Contoh: PPP MUHAIMIN"
                className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl uppercase font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nama ini akan dipaparkan secara automatik dalam kedua-dua format WhatsApp POZ & MECC.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pilihan Shif Semasa
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['AM', 'PM', 'ON'] as Shift[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setShift(s);
                      localStorage.setItem('poz_shift', s);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      shift === s ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Shif {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Auto-simpan ke storan peranti (localStorage):</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> Sentiasa Aktif
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DATABASE & STORAGE SETTINGS */}
      {activeSubTab === 'database' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Database className="text-rose-600" size={20} /> Pangkalan Data Tempatan & Sandaran
              </h3>
              <p className="text-xs text-slate-500">
                Sandarkan keseluruhan rekod pasukan, nama responder, dan status shif ke fail JSON untuk disimpan atau dipindahkan ke peranti lain.
              </p>
            </div>

            {/* Storage Info Widget */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pasukan POZ</span>
                <div className="text-lg font-black text-slate-900">{pozTeams.length}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pasukan MECC</span>
                <div className="text-lg font-black text-slate-900">{meccTeams.length}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Responder Manual</span>
                <div className="text-lg font-black text-slate-900">{customPppList.length + customStJohnList.length}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Storan Digunakan</span>
                <div className="text-lg font-black text-emerald-600">{storageUsageKb.toFixed(1)} KB</div>
              </div>
            </div>

            {/* Action Buttons: Export & Import */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Download size={16} className="text-rose-600" /> Muat Turun Sandaran (Export)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Simpan semua konfigurasi dan rekod terkini ke komputer/telefon anda.
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Eksport ke Fail JSON
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Upload size={16} className="text-emerald-600" /> Pulihkan Sandaran (Import)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Muat naik fail JSON sandaran yang telah disimpan sebelum ini.
                  </p>
                </div>
                <label className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center">
                  <Upload size={14} /> Pilih Fail JSON untuk Dipulihkan
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden" 
                  />
                </label>
              </div>

            </div>

            {/* Danger Zone: Factory Reset */}
            <div className="pt-6 border-t border-rose-100">
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-rose-600" /> Set Semula Pangkalan Data Kilang
                  </h4>
                  <p className="text-xs text-rose-700/80 mt-0.5">
                    Memadam semua cache setempat, nama responder manual, dan mengembalikan senarai pasukan asal.
                  </p>
                </div>
                <button
                  onClick={() => setShowFactoryResetModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-sm"
                >
                  Set Semula Data
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Add New Team */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Tambah Pasukan Baharu</h3>
              <button onClick={() => setShowAddTeamModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddTeam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Pasukan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTeamType('POZ');
                      setNewTeamCategory('PHC HTAR');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border ${newTeamType === 'POZ' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    POZ (Hospital/KK)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTeamType('MECC');
                      setNewTeamCategory('PKD BANTING');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border ${newTeamType === 'MECC' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    MECC Ambulance
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pasukan</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: KK Bukit Naga 2 / Banting 3"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Zon</label>
                <select
                  value={newTeamCategory}
                  onChange={(e) => setNewTeamCategory(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {(newTeamType === 'POZ' ? AVAILABLE_CATEGORIES : MECC_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. Telefon TM / Bilik Gerakan</label>
                <input 
                  type="text"
                  placeholder="Contoh: 01162619400"
                  value={newTeamPhone}
                  onChange={(e) => setNewTeamPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                >
                  Tambah Pasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Factory Reset */}
      {showFactoryResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Sahkan Set Semula Data Kilang?</h3>
              <p className="text-xs text-slate-500">
                Tindakan ini akan memadam semua nama responder manual, data draf shif, dan mengembalikan senarai pasukan asal. Tindakan ini tidak boleh diundur.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setShowFactoryResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleFactoryReset}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Ya, Set Semula Semua
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
