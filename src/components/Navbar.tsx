/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  Radio, 
  Settings, 
  LayoutDashboard, 
  Clock, 
  Calendar,
  LayoutGrid,
  Users,
  ClipboardCheck,
  ClipboardList,
  Truck,
  ChevronDown,
  Menu,
  X,
  FolderOpen
} from 'lucide-react';
import { ActiveTab, Shift } from '../types.ts';
import { SHIFT_DETAILS } from '../constants.ts';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  shift: Shift;
  formattedDate: string;
  pozActiveCount: number;
  pozTotalCount: number;
  meccActiveCount: number;
  meccTotalCount: number;
  rollcallDoneCount: number;
  rollcallTotalCount: number;
  respondingCasesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  shift,
  formattedDate,
  pozActiveCount,
  pozTotalCount,
  meccActiveCount,
  meccTotalCount,
  rollcallDoneCount,
  rollcallTotalCount,
  respondingCasesCount
}) => {
  const [openDropdown, setOpenDropdown] = useState<'updater' | 'tetapan' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUpdaterFold, setMobileUpdaterFold] = useState(false);
  const [mobileTetapanFold, setMobileTetapanFold] = useState(false);

  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const totalActive = pozActiveCount + meccActiveCount;
  const totalFleet = pozTotalCount + meccTotalCount;

  const isUpdaterActive = activeTab === 'poz' || activeTab === 'mecc';
  const isTetapanActive = activeTab === 'settings' || activeTab === 'responders';

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header ref={navContainerRef} className="sticky top-0 z-40 bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* Logo & Identity */}
          <div 
            onClick={() => handleSelectTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-900/30 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-black text-xs sm:text-base tracking-tight text-white group-hover:text-rose-300 transition-colors uppercase block leading-tight">
                MECC MANAGEMENT BOARD
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                KLANG • BANTING • SHAH ALAM • HASA
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* 1. Utama */}
            <button
              type="button"
              onClick={() => handleSelectTab('landing')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'landing'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Utama</span>
            </button>

            {/* 2. Dashboard */}
            <button
              type="button"
              onClick={() => handleSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-300 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/40 hover:text-white'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/25 font-mono tabular-nums">
                {totalActive}/{totalFleet}
              </span>
            </button>

            {/* 3. Case Log Manager */}
            <button
              type="button"
              onClick={() => handleSelectTab('caselog')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'caselog'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ClipboardList size={15} />
              <span>Case Log</span>
            </button>

            {/* 4. Team Respond Status (Tabbed Link View) */}
            <button
              type="button"
              onClick={() => handleSelectTab('teamrespond')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'teamrespond'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Truck size={15} />
              <span>Team Respond</span>
              {respondingCasesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono tabular-nums font-bold">
                  {respondingCasesCount}
                </span>
              )}
            </button>

            {/* 5. Rollcall Klinik */}
            <button
              type="button"
              onClick={() => handleSelectTab('rollcall')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'rollcall'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ClipboardCheck size={15} />
              <span>Rollcall</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono tabular-nums">
                {rollcallDoneCount}/{rollcallTotalCount}
              </span>
            </button>

            {/* 6. FOLDABLE DROPDOWN: UPDATER (POZ UPDATER + MECC STATUS) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === 'updater' ? null : 'updater'))}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isUpdaterActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FolderOpen size={15} />
                <span>Updater</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${openDropdown === 'updater' ? 'rotate-180' : ''}`}
                />
              </button>

              {openDropdown === 'updater' && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('poz')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      activeTab === 'poz'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Activity size={14} className="text-sky-400" />
                      <span>POZ Updater</span>
                    </span>
                    <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {pozActiveCount}/{pozTotalCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('mecc')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      activeTab === 'mecc'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Radio size={14} className="text-amber-400" />
                      <span>MECC Status</span>
                    </span>
                    <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {meccActiveCount}/{meccTotalCount}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. FOLDABLE DROPDOWN: TETAPAN (TETAPAN SISTEM + SENARAI RESPONDER) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === 'tetapan' ? null : 'tetapan'))}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isTetapanActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings size={15} />
                <span>Tetapan</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${openDropdown === 'tetapan' ? 'rotate-180' : ''}`}
                />
              </button>

              {openDropdown === 'tetapan' && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('settings')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Settings size={14} className="text-slate-400" />
                    <span>Tetapan Sistem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('responders')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      activeTab === 'responders'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Users size={14} className="text-teal-400" />
                    <span>Senarai Responder</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Quick Actions + Hamburger Button */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectTab('teamrespond')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                activeTab === 'teamrespond'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              <Truck size={13} />
              <span>HTAR</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Menu Navigasi"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

        </div>
      </div>

      {/* Sub-bar showing shift & date */}
      <div className="bg-slate-950 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-1 truncate">
          <Calendar size={11} className="text-rose-400 shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1 font-mono tabular-nums">
          <Clock size={11} className="text-amber-400 shrink-0" />
          <span>Shift {shift} ({SHIFT_DETAILS[shift]?.time})</span>
        </div>
      </div>

      {/* Mobile Responsive Foldable Accordion Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-1.5 shadow-2xl">
          <button
            type="button"
            onClick={() => handleSelectTab('landing')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'landing' ? 'bg-rose-600 text-white' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LayoutGrid size={15} />
            <span>Utama (Kad Kompak)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'dashboard' ? 'bg-rose-600 text-white' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard size={15} />
              <span>Dashboard Ambulans</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800">{totalActive}/{totalFleet}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('caselog')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'caselog' ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ClipboardList size={15} />
            <span>Case Log Manager (Analyze Kes)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('teamrespond')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'teamrespond' ? 'bg-amber-500 text-slate-950' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Truck size={15} />
              <span>Team Respond Status (HTAR 1–4)</span>
            </span>
            {respondingCasesCount > 0 && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white">
                {respondingCasesCount} Aktif
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('rollcall')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === 'rollcall' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ClipboardCheck size={15} />
              <span>Rollcall Oncall Klinik</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800">{rollcallDoneCount}/{rollcallTotalCount}</span>
          </button>

          {/* Mobile Foldable Group 1: UPDATER */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileUpdaterFold((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/60 text-xs font-bold text-sky-300"
            >
              <span className="flex items-center gap-2.5">
                <FolderOpen size={15} />
                <span>Updater (POZ & MECC)</span>
              </span>
              <ChevronDown size={14} className={`transition-transform ${mobileUpdaterFold ? 'rotate-180' : ''}`} />
            </button>
            {mobileUpdaterFold && (
              <div className="p-1.5 bg-slate-950/60 space-y-1">
                <button
                  type="button"
                  onClick={() => handleSelectTab('poz')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
                >
                  <span>• POZ Updater</span>
                  <span className="font-mono text-[10px] text-sky-400">{pozActiveCount}/{pozTotalCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('mecc')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
                >
                  <span>• MECC Status</span>
                  <span className="font-mono text-[10px] text-amber-400">{meccActiveCount}/{meccTotalCount}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Foldable Group 2: TETAPAN (WITH RESPONDER SORTED UNDERNEATH) */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileTetapanFold((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/60 text-xs font-bold text-slate-200"
            >
              <span className="flex items-center gap-2.5">
                <Settings size={15} />
                <span>Tetapan & Responder</span>
              </span>
              <ChevronDown size={14} className={`transition-transform ${mobileTetapanFold ? 'rotate-180' : ''}`} />
            </button>
            {mobileTetapanFold && (
              <div className="p-1.5 bg-slate-950/60 space-y-1">
                <button
                  type="button"
                  onClick={() => handleSelectTab('settings')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800"
                >
                  <span>• Tetapan Sistem</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('responders')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-teal-300 hover:bg-slate-800"
                >
                  <span>• Senarai Responder</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
