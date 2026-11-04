/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { DashboardPage } from './components/DashboardPage.tsx';
import { PozUpdater } from './components/PozUpdater.tsx';
import { MeccStatus } from './components/MeccStatus.tsx';
import { ClinicRollcall } from './components/ClinicRollcall.tsx';
import { CaseLogManager } from './components/CaseLogManager.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { RespondersDirectory } from './components/RespondersDirectory.tsx';
import { 
  ActiveTab, 
  Shift, 
  AmbulanceTeam, 
  MeccTeam, 
  PPPContact, 
  PozTeamStatusItem, 
  MeccTeamStatus,
  ResponderEditOverride,
  OncallClinic,
  ShiftRollcallMap,
  RollcallTemplates,
  CaseLogItem
} from './types.ts';
import { 
  AMBULANCE_TEAMS, 
  DEFAULT_MECC_TEAMS, 
  PPP_LIST, 
  STJOHN_RESPONDERS,
  DEFAULT_ONCALL_CLINICS,
  DEFAULT_ROLLCALL_MESSAGE,
  DEFAULT_QUICK_REPLY_MESSAGE,
  HTAR_PRIMARY_TEAMS
} from './constants.ts';

// Helper to get current Malaysian Date and Shift
const getMalaysianStatus = () => {
  const now = new Date();
  const MY_TIME = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const hour = MY_TIME.getUTCHours();
  
  let shift: Shift = 'AM';
  if (hour >= 7 && hour < 14) shift = 'AM';
  else if (hour >= 14 && hour < 21) shift = 'PM';
  else shift = 'ON';
  
  const day = MY_TIME.getUTCDate();
  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 
    'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'
  ];
  const monthIdx = MY_TIME.getUTCMonth();
  const month = monthNames[monthIdx];
  const year = MY_TIME.getUTCFullYear();
  
  const formattedDate = `${day} ${month} ${year}`;
  
  return { formattedDate, shift };
};

export default function App() {
  const { formattedDate, shift: defaultShift } = useMemo(getMalaysianStatus, []);
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');

  // Teams lists (persisted with fallback to defaults)
  const [pozTeams, setPozTeams] = useState<AmbulanceTeam[]>(() => {
    try {
      const saved = localStorage.getItem('poz_custom_teams_list');
      return saved ? JSON.parse(saved) : AMBULANCE_TEAMS;
    } catch {
      return AMBULANCE_TEAMS;
    }
  });

  const [meccTeams, setMeccTeams] = useState<MeccTeam[]>(() => {
    try {
      const saved = localStorage.getItem('mecc_custom_teams_list');
      return saved ? JSON.parse(saved) : DEFAULT_MECC_TEAMS;
    } catch {
      return DEFAULT_MECC_TEAMS;
    }
  });

  // Custom added responders
  const [customStJohnList, setCustomStJohnList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('poz_custom_stjohn');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customPppList, setCustomPppList] = useState<PPPContact[]>(() => {
    try {
      const saved = localStorage.getItem('poz_custom_ppps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Responder edit overrides
  const [responderEdits, setResponderEdits] = useState<Record<string, ResponderEditOverride>>(() => {
    try {
      const saved = localStorage.getItem('mecc_responder_edits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Clinic Oncall Rollcall state
  const [oncallClinics, setOncallClinics] = useState<OncallClinic[]>(() => {
    try {
      const saved = localStorage.getItem('mecc_clinic_rollcall_list');
      return saved ? JSON.parse(saved) : DEFAULT_ONCALL_CLINICS;
    } catch {
      return DEFAULT_ONCALL_CLINICS;
    }
  });

  const [shiftRollcalls, setShiftRollcalls] = useState<ShiftRollcallMap>(() => {
    const empty: ShiftRollcallMap = { AM: {}, PM: {}, ON: {} };
    try {
      const saved = localStorage.getItem('mecc_clinic_rollcall_by_shift');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...empty, ...parsed };
      }
    } catch {
      // fallback
    }
    return empty;
  });

  const [rollcallTemplates, setRollcallTemplates] = useState<RollcallTemplates>(() => {
    const defaults: RollcallTemplates = {
      rollcallMessage: DEFAULT_ROLLCALL_MESSAGE,
      quickReplyMessage: DEFAULT_QUICK_REPLY_MESSAGE
    };
    try {
      const saved = localStorage.getItem('mecc_rollcall_templates');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return defaults;
  });

  // Case Log Manager state
  const [caseLogs, setCaseLogs] = useState<CaseLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('mecc_case_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Shifts & Reporter
  const [shift, setShift] = useState<Shift>(() => {
    try {
      const saved = localStorage.getItem('poz_shift');
      if (saved && (saved === 'AM' || saved === 'PM' || saved === 'ON')) {
        return saved as Shift;
      }
    } catch {
      // fallback
    }
    return defaultShift;
  });

  const [reporter, setReporter] = useState<string>(() => {
    try {
      return localStorage.getItem('poz_reporter') || '';
    } catch {
      return '';
    }
  });

  // POZ team statuses
  const [teamStatuses, setTeamStatuses] = useState<Record<string, PozTeamStatusItem>>(() => {
    const initial: Record<string, PozTeamStatusItem> = {};
    AMBULANCE_TEAMS.forEach(team => {
      initial[team.id] = { 
        active: team.defaultStatus, 
        pppId: '',
        customPppName: '',
        isOthersPpp: false,
        manualName1: team.id === 'stjohn4' ? 'AFIQ' : '',
        manualName2: team.id === 'stjohn4' ? 'YONG' : '',
        isOthers1: false,
        isOthers2: false
      };
    });

    try {
      const saved = localStorage.getItem('poz_team_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch {
      // fallback
    }
    return initial;
  });

  // MECC team statuses
  const [meccStatuses, setMeccStatuses] = useState<Record<string, MeccTeamStatus>>(() => {
    const initial: Record<string, MeccTeamStatus> = {};
    DEFAULT_MECC_TEAMS.forEach(team => {
      initial[team.id] = {
        status: team.defaultStatus,
        ppp: team.defaultPpp || '',
        driver: team.defaultDriver || '',
        vehicle: team.defaultVehicle || '',
        notes: ''
      };
    });

    try {
      const saved = localStorage.getItem('mecc_team_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch {
      // fallback
    }
    return initial;
  });

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Auto-save POZ state
  useEffect(() => {
    try {
      localStorage.setItem('poz_shift', shift);
      localStorage.setItem('poz_reporter', reporter);
      localStorage.setItem('poz_team_statuses', JSON.stringify(teamStatuses));
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Failed to auto-save to localStorage:', e);
    }
  }, [shift, reporter, teamStatuses]);

  // Auto-save MECC state
  useEffect(() => {
    try {
      localStorage.setItem('mecc_team_statuses', JSON.stringify(meccStatuses));
    } catch (e) {
      console.error('Failed to auto-save mecc_team_statuses:', e);
    }
  }, [meccStatuses]);

  // Auto-save Clinic Rollcall shift state & templates
  useEffect(() => {
    try {
      localStorage.setItem('mecc_clinic_rollcall_by_shift', JSON.stringify(shiftRollcalls));
    } catch (e) {
      console.error('Failed to save shiftRollcalls:', e);
    }
  }, [shiftRollcalls]);

  useEffect(() => {
    try {
      localStorage.setItem('mecc_rollcall_templates', JSON.stringify(rollcallTemplates));
    } catch (e) {
      console.error('Failed to save rollcallTemplates:', e);
    }
  }, [rollcallTemplates]);

  // Auto-save Case Logs
  useEffect(() => {
    try {
      localStorage.setItem('mecc_case_logs', JSON.stringify(caseLogs));
    } catch (e) {
      console.error('Failed to save caseLogs:', e);
    }
  }, [caseLogs]);

  // Derived responder lists incorporating responderEdits
  const allStJohnResponders = useMemo(() => {
    const set = new Set<string>();

    STJOHN_RESPONDERS.forEach((origName) => {
      const override = responderEdits[`builtin_stjohn_${origName}`];
      if (!override) {
        set.add(origName);
      } else if (override.role === 'STJOHN') {
        set.add(override.name);
      }
    });

    PPP_LIST.forEach((p) => {
      const override = responderEdits[p.id];
      if (override && override.role === 'STJOHN') {
        set.add(override.name);
      }
    });

    customStJohnList.forEach((name) => {
      const override = responderEdits[`custom_stjohn_${name}`];
      set.add(override ? override.name : name);
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [customStJohnList, responderEdits]);

  const allPPPList = useMemo(() => {
    const list: PPPContact[] = [];

    PPP_LIST.forEach((p) => {
      const override = responderEdits[p.id];
      if (!override) {
        list.push(p);
      } else if (override.role === 'PPP') {
        list.push({
          id: p.id,
          name: override.name,
          personalPhone: override.phone,
          category: override.category
        });
      }
    });

    STJOHN_RESPONDERS.forEach((origName) => {
      const stableId = `builtin_stjohn_${origName}`;
      const override = responderEdits[stableId];
      if (override && override.role === 'PPP') {
        list.push({
          id: stableId,
          name: override.name,
          personalPhone: override.phone,
          category: override.category
        });
      }
    });

    customPppList.forEach((p) => {
      const override = responderEdits[p.id];
      if (!override) {
        list.push(p);
      } else if (override.role === 'PPP') {
        list.push({
          id: p.id,
          name: override.name,
          personalPhone: override.phone,
          category: override.category
        });
      }
    });

    return list;
  }, [customPppList, responderEdits]);

  // Active counts
  const pozActiveCount = useMemo(() => {
    return pozTeams.filter(t => teamStatuses[t.id]?.active).length;
  }, [pozTeams, teamStatuses]);

  const meccActiveCount = useMemo(() => {
    return meccTeams.filter(t => (meccStatuses[t.id]?.status || t.defaultStatus) === 'SIAP_SEDIA').length;
  }, [meccTeams, meccStatuses]);

  const rollcallStats = useMemo(() => {
    const shiftMap = shiftRollcalls[shift] || {};
    let sentOrVerified = 0;
    let activeCount = 0;
    let standbyCount = 0;
    oncallClinics.forEach((c) => {
      const st = shiftMap[c.id]?.status || 'PENDING';
      if (st !== 'PENDING') sentOrVerified++;
      if (st === 'ACTIVE') activeCount++;
      if (st === 'STANDBY') standbyCount++;
    });
    return {
      sentOrVerified,
      activeCount,
      standbyCount,
      total: oncallClinics.length
    };
  }, [shiftRollcalls, shift, oncallClinics]);

  const caseLogStats = useMemo(() => {
    const respondingList = caseLogs.filter((c) => c.respondState === 'RESPONDING');
    const busySet = new Set(respondingList.map((c) => c.assignedTeamId));
    const htarBusy = HTAR_PRIMARY_TEAMS.filter((h) => busySet.has(h.id)).length;
    return {
      total: caseLogs.length,
      responding: respondingList.length,
      htarBusy
    };
  }, [caseLogs]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Sticky Top Navigation */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shift={shift}
        formattedDate={formattedDate}
        pozActiveCount={pozActiveCount}
        pozTotalCount={pozTeams.length}
        meccActiveCount={meccActiveCount}
        meccTotalCount={meccTeams.length}
        rollcallDoneCount={rollcallStats.sentOrVerified}
        rollcallTotalCount={rollcallStats.total}
        respondingCasesCount={caseLogStats.responding}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {activeTab === 'landing' && (
          <LandingPage 
            setActiveTab={setActiveTab}
            shift={shift}
            formattedDate={formattedDate}
            reporter={reporter}
            pozTeams={pozTeams}
            pozStatuses={teamStatuses}
            allPPPList={allPPPList}
            allStJohnResponders={allStJohnResponders}
            meccTeams={meccTeams}
            meccStatuses={meccStatuses}
            rollcallStats={rollcallStats}
            caseLogStats={caseLogStats}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage 
            shift={shift}
            setShift={setShift}
            formattedDate={formattedDate}
            reporter={reporter}
            pozTeams={pozTeams}
            pozStatuses={teamStatuses}
            setPozStatuses={setTeamStatuses}
            allPPPList={allPPPList}
            allStJohnResponders={allStJohnResponders}
            meccTeams={meccTeams}
            meccStatuses={meccStatuses}
            setMeccStatuses={setMeccStatuses}
            setActiveTab={setActiveTab}
          />
        )}

        {(activeTab === 'caselog' || activeTab === 'teamrespond') && (
          <CaseLogManager
            initialView={activeTab === 'teamrespond' ? 'team_respond' : 'analyzer'}
            shift={shift}
            formattedDate={formattedDate}
            pozTeams={pozTeams}
            pozStatuses={teamStatuses}
            meccTeams={meccTeams}
            meccStatuses={meccStatuses}
            allPPPList={allPPPList}
            allStJohnResponders={allStJohnResponders}
            caseLogs={caseLogs}
            setCaseLogs={setCaseLogs}
          />
        )}

        {activeTab === 'poz' && (
          <PozUpdater 
            shift={shift}
            setShift={setShift}
            formattedDate={formattedDate}
            reporter={reporter}
            setReporter={setReporter}
            pozTeams={pozTeams}
            teamStatuses={teamStatuses}
            setTeamStatuses={setTeamStatuses}
            customStJohnList={customStJohnList}
            setCustomStJohnList={setCustomStJohnList}
            customPppList={customPppList}
            setCustomPppList={setCustomPppList}
            allPPPList={allPPPList}
            allStJohnResponders={allStJohnResponders}
            lastSavedTime={lastSavedTime}
          />
        )}

        {activeTab === 'mecc' && (
          <MeccStatus 
            shift={shift}
            setShift={setShift}
            formattedDate={formattedDate}
            reporter={reporter}
            setReporter={setReporter}
            meccTeams={meccTeams}
            meccStatuses={meccStatuses}
            setMeccStatuses={setMeccStatuses}
          />
        )}

        {activeTab === 'rollcall' && (
          <ClinicRollcall
            shift={shift}
            setShift={setShift}
            formattedDate={formattedDate}
            reporter={reporter}
            setReporter={setReporter}
            oncallClinics={oncallClinics}
            setOncallClinics={setOncallClinics}
            shiftRollcalls={shiftRollcalls}
            setShiftRollcalls={setShiftRollcalls}
            rollcallTemplates={rollcallTemplates}
            setRollcallTemplates={setRollcallTemplates}
            allPPPList={allPPPList}
            allStJohnResponders={allStJohnResponders}
          />
        )}

        {activeTab === 'responders' && (
          <RespondersDirectory 
            customPppList={customPppList}
            setCustomPppList={setCustomPppList}
            customStJohnList={customStJohnList}
            setCustomStJohnList={setCustomStJohnList}
            responderEdits={responderEdits}
            setResponderEdits={setResponderEdits}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage 
            pozTeams={pozTeams}
            setPozTeams={setPozTeams}
            meccTeams={meccTeams}
            setMeccTeams={setMeccTeams}
            customPppList={customPppList}
            setCustomPppList={setCustomPppList}
            customStJohnList={customStJohnList}
            setCustomStJohnList={setCustomStJohnList}
            responderEdits={responderEdits}
            setResponderEdits={setResponderEdits}
            oncallClinics={oncallClinics}
            setOncallClinics={setOncallClinics}
            shiftRollcalls={shiftRollcalls}
            setShiftRollcalls={setShiftRollcalls}
            rollcallTemplates={rollcallTemplates}
            setRollcallTemplates={setRollcallTemplates}
            caseLogs={caseLogs}
            setCaseLogs={setCaseLogs}
            setActiveTab={setActiveTab}
            reporter={reporter}
            setReporter={setReporter}
            shift={shift}
            setShift={setShift}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider">MECC MANAGEMENT BOARD</span>
            <span>•</span>
            <span>Sistem Kesiapsiagaan Operasi Ambulans</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Semua Wilayah: Klang • PKD Banting • Hospital Banting • Shah Alam • HASA • Shif {shift}
          </div>
        </div>
      </footer>
    </div>
  );
}
