/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Radio, 
  Settings, 
  LayoutDashboard, 
  Truck, 
  ArrowRight, 
  Clock, 
  Calendar, 
  User, 
  Sparkles, 
  Users,
  ClipboardCheck,
  ClipboardList,
  ChevronDown,
  FolderOpen
} from 'lucide-react';
import { 
  ActiveTab, 
  Shift, 
  AmbulanceTeam, 
  PPPContact, 
  MeccTeam, 
  MeccTeamStatus, 
  PozTeamStatusItem 
} from '../types.ts';
import { SHIFT_DETAILS } from '../constants.ts';

interface LandingPageProps {
  setActiveTab: (tab: ActiveTab) => void;
  shift: Shift;
  formattedDate: string;
  reporter: string;
  pozTeams: AmbulanceTeam[];
  pozStatuses: Record<string, PozTeamStatusItem>;
  allPPPList: PPPContact[];
  allStJohnResponders: string[];
  meccTeams: MeccTeam[];
  meccStatuses: Record<string, MeccTeamStatus>;
  rollcallStats: {
    sentOrVerified: number;
    activeCount: number;
    standbyCount: number;
    total: number;
  };
  caseLogStats: {
    total: number;
    responding: number;
    htarBusy: number;
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setActiveTab,
  shift,
  formattedDate,
  reporter,
  pozTeams,
  pozStatuses,
  allPPPList,
  allStJohnResponders,
  meccTeams,
  meccStatuses,
  rollcallStats,
  caseLogStats
}) => {
  // Foldable group states
  const [updaterOpen, setUpdaterOpen] = useState<boolean>(false);
  const [tetapanOpen, setTetapanOpen] = useState<boolean>(false);

  // POZ Metrics
  const pozActiveCount = useMemo(() => {
    return pozTeams.filter(t => pozStatuses[t.id]?.active).length;
  }, [pozTeams, pozStatuses]);

  // MECC Metrics
  const meccStats = useMemo(() => {
    let ready = 0;
    meccTeams.forEach(t => {
      const s = meccStatuses[t.id]?.status || t.defaultStatus;
      if (s === 'SIAP_SEDIA') ready++;
    });
    return { ready, total: meccTeams.length };
  }, [meccTeams, meccStatuses]);

  const totalActive = pozActiveCount + meccStats.ready;
  const totalFleet = pozTeams.length + meccTeams.length;
  const totalResponders = (allPPPList?.length || 0) + (allStJohnResponders?.length || 0);

  return (
    <div className="space-y-5 pb-14 max-w-6xl mx-auto">
      
      {/* Compact Responsive Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 p-4 sm:p-6 text-white shadow-lg border border-slate-700/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] sm:text-xs font-bold tracking-wide">
              <Sparkles size={12} /> PUSAT KAWALAN OPERASI • SEMUA WILAYAH
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              MECC MANAGEMENT BOARD
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                <Calendar size={12} className="text-rose-400" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono tabular-nums">
                <Clock size={12} className="text-amber-400" />
                <span>Shif {shift} ({SHIFT_DETAILS[shift]?.time})</span>
              </span>
              {reporter && (
                <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <User size={12} className="text-emerald-400" />
                  <strong className="text-white">{reporter}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Compact Fleet Summary Box */}
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-2xl flex items-center justify-between md:flex-col md:justify-center gap-2 shrink-0 font-mono tabular-nums">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
              Armada Siap Sedia
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-400">
              {totalActive}<span className="text-xs font-sans font-medium text-slate-400">/{totalFleet}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-300">
              <span className="text-emerald-400">POZ: {pozActiveCount}</span>
              <span>•</span>
              <span className="text-amber-400">MECC: {meccStats.ready}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact 50%-Smaller Mobile-Responsive Module Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
            <Truck className="text-rose-600" size={18} /> Pautan Modul Operasi
          </h2>
          <span className="text-[11px] font-medium text-slate-500">
            Paparan Kompak • Mesra Mudah Alih
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
          
          {/* 1. DASHBOARD STATUS AMBULANS */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="w-full text-left group bg-white rounded-2xl p-3.5 sm:p-4 border border-rose-200 hover:border-rose-400 shadow-sm hover:shadow-md transition-all flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <LayoutDashboard size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-rose-600 truncate">
                  DASHBOARD AMBULANS
                </h3>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                  {totalActive}/{totalFleet}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                Jadual senarai semua pasukan ambulans & kemaskini pantas ikon pensel.
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-rose-600">
                <span>Buka Dashboard</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* 2. CASE LOG MANAGER (NEW) */}
          <button
            type="button"
            onClick={() => setActiveTab('caselog')}
            className="w-full text-left group bg-white rounded-2xl p-3.5 sm:p-4 border border-indigo-200 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <ClipboardList size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 truncate">
                  CASE LOG MANAGER
                </h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                  BARU
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                Analyze Ringkasan Panggilan (Call Card, Lokasi, Masa, Event Code) & assign pasukan.
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                <span>Analyze & Assign Kes ({caseLogStats.total})</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* 3. TEAM RESPOND STATUS - HTAR 1-4 (NEW TABBED VIEW LINK) */}
          <button
            type="button"
            onClick={() => setActiveTab('teamrespond')}
            className="w-full text-left group bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Truck size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-amber-700 truncate">
                  TEAM RESPOND STATUS
                </h3>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                  HTAR {4 - caseLogStats.htarBusy}/4 Sedia
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                Fokus HTAR 1–4: Call Card, Alamat, Responder, Event Code & Triage (SD/DAMA/YZ/RZ/PAC/PEOBS/CARSS).
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-amber-700">
                <span>Status Respon Pasukan</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* 4. ROLLCALL ONCALL KLINIK */}
          <button
            type="button"
            onClick={() => setActiveTab('rollcall')}
            className="w-full text-left group bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <ClipboardCheck size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-600 truncate">
                  ROLLCALL ONCALL KLINIK
                </h3>
                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  {rollcallStats.sentOrVerified}/{rollcallStats.total}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                Ceklist shif, WhatsApp Rollcall, pengaktifan Active/Standby MECC & Quick Reply.
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-emerald-600">
                <span>Buka Ceklist Rollcall</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* 5. FOLDABLE GROUP CARD: UPDATER (POZ UPDATER + MECC STATUS) */}
          <div className="bg-white rounded-2xl border border-sky-200 shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setUpdaterOpen((prev) => !prev)}
              className="w-full text-left p-3.5 sm:p-4 hover:bg-sky-50/40 transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FolderOpen size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    UPDATER (POZ & MECC)
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 shrink-0">
                    <span>2 Modul</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${updaterOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                  Klik untuk lipat/buka pautan <strong>POZ Updater</strong> & <strong>MECC Status</strong>.
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono tabular-nums font-bold text-sky-700">
                  <span>POZ: {pozActiveCount}/{pozTeams.length}</span>
                  <span>•</span>
                  <span>MECC: {meccStats.ready}/{meccStats.total}</span>
                </div>
              </div>
            </button>

            {updaterOpen && (
              <div className="px-3.5 pb-3.5 pt-2 bg-slate-50/90 border-t border-slate-100 space-y-1.5 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setActiveTab('poz')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs font-bold text-slate-800 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Activity size={14} className="text-sky-600" />
                    <span>POZ Updater</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] text-sky-700">
                    {pozActiveCount}/{pozTeams.length}
                    <ArrowRight size={12} />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mecc')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-xs font-bold text-slate-800 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Radio size={14} className="text-amber-600" />
                    <span>MECC Status</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] text-amber-700">
                    {meccStats.ready}/{meccStats.total}
                    <ArrowRight size={12} />
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 6. FOLDABLE GROUP CARD: TETAPAN (WITH SENARAI RESPONDER SORTED UNDER TETAPAN) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setTetapanOpen((prev) => !prev)}
              className="w-full text-left p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Settings size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    TETAPAN & RESPONDER
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    <span>Lipat/Buka</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${tetapanOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                  Konfigurasi sistem, sandaran JSON & <strong>Senarai Responder</strong> ({totalResponders} petugas).
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Tetapan & Direktori Responder</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${tetapanOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            </button>

            {tetapanOpen && (
              <div className="px-3.5 pb-3.5 pt-2 bg-slate-50/90 border-t border-slate-100 space-y-1.5 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Settings size={14} className="text-slate-700" />
                    <span>Pengurusan & Tetapan Sistem</span>
                  </span>
                  <ArrowRight size={12} className="text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('responders')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-bold text-slate-800 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Users size={14} className="text-teal-600" />
                    <span>Senarai Nama Responder</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] text-teal-700">
                    {totalResponders}
                    <ArrowRight size={12} />
                  </span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
