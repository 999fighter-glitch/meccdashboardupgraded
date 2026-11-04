/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  ClipboardList,
  Truck,
  MapPin,
  Clock,
  Activity,
  CheckCircle2,
  Send,
  Copy,
  Check,
  Search,
  Trash2,
  Edit2,
  Plus,
  X,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  User,
  ClipboardPaste,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  RotateCcw
} from 'lucide-react';
import {
  Shift,
  AmbulanceTeam,
  MeccTeam,
  PPPContact,
  PozTeamStatusItem,
  MeccTeamStatus,
  CaseLogItem,
  CaseTriageType
} from '../types.ts';
import {
  HTAR_PRIMARY_TEAMS,
  CASE_TRIAGE_OPTIONS,
  CASE_TRIAGE_CONFIG,
  SHIFT_DETAILS
} from '../constants.ts';

interface CaseLogManagerProps {
  initialView?: 'team_respond' | 'analyzer' | 'history';
  shift: Shift;
  formattedDate: string;
  pozTeams: AmbulanceTeam[];
  pozStatuses: Record<string, PozTeamStatusItem>;
  meccTeams: MeccTeam[];
  meccStatuses: Record<string, MeccTeamStatus>;
  allPPPList: PPPContact[];
  allStJohnResponders: string[];
  caseLogs: CaseLogItem[];
  setCaseLogs: React.Dispatch<React.SetStateAction<CaseLogItem[]>>;
}

interface ParsedSummaryResult {
  callCardNo: string;
  meccRef: string;
  location: string;
  mapsUrl: string;
  callTime: string;
  eventCode: string;
  mpds: string;
  priority: string;
  complaint: string;
  patientInfo: string;
  vitalsNote: string;
  callerName: string;
  callerPhone: string;
}

const SAMPLE_CALL_SUMMARY = `═══════════════════════════════════════════════════════
📋 RINGKASAN PANGGILAN / CALL SUMMARY
═══════════════════════════════════════════════════════

1️⃣ MAKLUMAT PANGGILAN / CALL INFO:
   Call Card: KCH0466/KHAIRA-HTAR-20261103-09:26:23-AM-000004
   MECC Ref: HTAR-20261103-09:26:23-AM-000004
   RC Ref: KCH-0466/KHAIRA
   Masa: 2026-11-03 09:26:25
   Call Taker: AL-HAFIS (CT-CALL-MVZV)
   Syif: AM
   Pemanggil: MA AZER
   No. Tel: 0135389622
   Hubungan: -
   Bahasa: Bahasa Melayu

2️⃣ LOKASI KECEMASAN / LOCATION:
   KK SIJANGKANG
   🗺️ Maps: https://www.google.com/maps/search/?api=1&query=KK%20SIJANGKANG%2C%20Malaysia

3️⃣ MAKLUMAT MANGSA / PATIENT:
   Nama: Tidak Diketahui
   Umur: 7
   Jantina: Lelaki / Male
   Bil. Mangsa: 1
   Sedar: Ya - Sedar Sepenuhnya
   Bernafas: Ya - Normal
   ⚠️ ADUAN: REFERRED FOR TRO APPENDICITIS
   📝 PENERANGAN: TEMP 36.9
BP 101/84
PR 98
   MPDS: 33 - Transfer / Interfacility / Palliative Care
   🚑 DISPATCH CODE: 33-A-1
   🔴 KEUTAMAAN: P4
   Sejarah Perubatan: -
   Alahan: -

4️⃣ ARAHAN PAI & TAMAT:
   PAI: -

═══════════════════════════════════════════════════════`;

export function parseCallSummaryText(raw: string): ParsedSummaryResult {
  const cleanLineVal = (regex: RegExp): string => {
    const match = raw.match(regex);
    return match && match[1] ? match[1].trim() : '';
  };

  // 1. Call Card & MECC Ref
  const callCardNo =
    cleanLineVal(/Call\s*Card\s*:\s*([^\n\r]+)/i) ||
    cleanLineVal(/No\.?\s*Call\s*Card\s*:\s*([^\n\r]+)/i) ||
    cleanLineVal(/MECC\s*Ref\s*:\s*([^\n\r]+)/i);

  const meccRef = cleanLineVal(/MECC\s*Ref\s*:\s*([^\n\r]+)/i);

  // 2. Masa (Call Time)
  let callTime =
    cleanLineVal(/^\s*Masa\s*:\s*([^\n\r]+)/im) ||
    cleanLineVal(/Tarikh\s*\/?\s*Masa\s*:\s*([^\n\r]+)/i);

  if (!callTime && callCardNo) {
    const embeddedTime = callCardNo.match(/(\d{4})(\d{2})(\d{2})-(\d{2}:\d{2}:\d{2})/);
    if (embeddedTime) {
      callTime = `${embeddedTime[1]}-${embeddedTime[2]}-${embeddedTime[3]} ${embeddedTime[4]}`;
    }
  }

  // 3. Location / Alamat & Maps URL
  let location = '';
  let mapsUrl = '';

  const locSectionMatch = raw.match(
    /(?:LOKASI\s+KECEMASAN\s*\/\s*LOCATION|2️⃣\s*LOKASI[^\n\r]*)\s*:?\s*([\s\S]*?)(?=\n\s*(?:3️⃣|MAKLUMAT\s+MANGSA|═{4,})|$)/i
  );

  if (locSectionMatch && locSectionMatch[1]) {
    const lines = locSectionMatch[1]
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const addressLines: string[] = [];
    lines.forEach((line) => {
      const urlMatch = line.match(/(https?:\/\/\S+)/i);
      if (/Maps\s*:/i.test(line) || urlMatch) {
        if (urlMatch && !mapsUrl) {
          mapsUrl = urlMatch[1].trim();
        }
      } else if (!/^═+$/.test(line)) {
        addressLines.push(line.replace(/^[-•*]\s*/, '').trim());
      }
    });
    location = addressLines.join(', ');
  }

  if (!location) {
    location =
      cleanLineVal(/(?:Alamat|Lokasi|Location)\s*:\s*([^\n\r]+)/i);
  }
  if (!mapsUrl) {
    const anyMaps = raw.match(/Maps\s*:\s*(https?:\/\/\S+)/i);
    if (anyMaps) mapsUrl = anyMaps[1].trim();
  }

  // 4. Event Code / Dispatch Code & MPDS
  const mpds = cleanLineVal(/MPDS\s*:\s*([^\n\r]+)/i);
  let eventCode =
    cleanLineVal(/DISPATCH\s*CODE\s*:\s*([^\n\r]+)/i) ||
    cleanLineVal(/Event\s*Code\s*:\s*([^\n\r]+)/i);

  if (!eventCode && mpds) {
    eventCode = mpds.split('-')[0]?.trim() || mpds;
  }

  // Additional clinical context
  const priority = cleanLineVal(/KEUTAMAAN\s*:\s*([^\n\r]+)/i);
  const complaint = cleanLineVal(/ADUAN\s*:\s*([^\n\r]+)/i);
  const callerName = cleanLineVal(/Pemanggil\s*:\s*([^\n\r]+)/i);
  const callerPhone = cleanLineVal(/No\.?\s*Tel\s*:\s*([^\n\r]+)/i);

  const age = cleanLineVal(/Umur\s*:\s*([^\n\r]+)/i);
  const gender = cleanLineVal(/Jantina\s*:\s*([^\n\r]+)/i);
  const patientParts = [age ? `${age} thn` : '', gender && gender !== '-' ? gender : ''].filter(Boolean);
  const patientInfo = patientParts.join(' • ');

  // Multi-line vitals / penerangan capture
  let vitalsNote = '';
  const descMatch = raw.match(
    /PENERANGAN\s*:\s*([\s\S]*?)(?=\n\s*(?:MPDS|🚑|DISPATCH\s*CODE|🔴|KEUTAMAAN|Sejarah|4️⃣|═{4,})|$)/i
  );
  if (descMatch && descMatch[1]) {
    vitalsNote = descMatch[1]
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' | ');
  }

  return {
    callCardNo,
    meccRef,
    location,
    mapsUrl,
    callTime,
    eventCode,
    mpds,
    priority,
    complaint,
    patientInfo,
    vitalsNote,
    callerName,
    callerPhone
  };
}

export const CaseLogManager: React.FC<CaseLogManagerProps> = ({
  initialView = 'team_respond',
  shift,
  formattedDate,
  pozTeams,
  pozStatuses,
  meccTeams,
  meccStatuses,
  allPPPList,
  allStJohnResponders,
  caseLogs,
  setCaseLogs
}) => {
  const [subTab, setSubTab] = useState<'team_respond' | 'analyzer' | 'history'>(initialView);

  useEffect(() => {
    setSubTab(initialView);
  }, [initialView]);

  // Analyzer & Form state
  const [rawInput, setRawInput] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  const [callCardNo, setCallCardNo] = useState('');
  const [location, setLocation] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [callTime, setCallTime] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [complaint, setComplaint] = useState('');
  const [priority, setPriority] = useState('');
  const [vitalsNote, setVitalsNote] = useState('');
  const [patientInfo, setPatientInfo] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');

  const [selectedTeamKey, setSelectedTeamKey] = useState<string>('POZ:htar1');
  const [responderName, setResponderName] = useState<string>('');
  const [triage, setTriage] = useState<CaseTriageType>('PENDING');
  const [customTriage, setCustomTriage] = useState<string>('');

  // Filters & Sorting for History (Senarai Case Log) tab
  const [searchQuery, setSearchQuery] = useState('');
  const [triageFilter, setTriageFilter] = useState<'ALL' | CaseTriageType>('ALL');
  const [stateFilter, setStateFilter] = useState<'ALL' | 'RESPONDING' | 'COMPLETED'>('ALL');
  const [historySortBy, setHistorySortBy] = useState<'masa' | 'callCard'>('masa');
  const [historySortDir, setHistorySortDir] = useState<'asc' | 'desc'>('desc');
  const [showCallCardMasaFilter, setShowCallCardMasaFilter] = useState<boolean>(false);
  const [callCardColumnFilter, setCallCardColumnFilter] = useState<string>('');
  const [masaColumnFilter, setMasaColumnFilter] = useState<string>('');
  const [shiftColumnFilter, setShiftColumnFilter] = useState<'ALL' | Shift>('ALL');
  const [showOtherTeamsInRespondBoard, setShowOtherTeamsInRespondBoard] = useState(false);

  // Modals & Toast
  const [viewingCase, setViewingCase] = useState<CaseLogItem | null>(null);
  const [deletingCase, setDeletingCase] = useState<CaseLogItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Helper to resolve current responder name of a POZ or MECC team
  const getTeamDefaultResponder = (teamKey: string): string => {
    const [source, id] = teamKey.split(':');
    if (source === 'POZ') {
      const st = pozStatuses[id];
      if (!st) return '';
      if (id === 'stjohn4') {
        const names = [st.manualName1, st.manualName2].filter(Boolean);
        return names.join(' / ');
      }
      if (st.isOthersPpp && st.customPppName) {
        return `PPP ${st.customPppName}`;
      }
      if (st.pppId) {
        const found = allPPPList.find((p) => p.id === st.pppId);
        if (found) return `PPP ${found.name}`;
      }
      return '';
    } else {
      const st = meccStatuses[id];
      if (!st) return '';
      const parts = [st.ppp ? `PPP ${st.ppp}` : '', st.driver ? `DRV ${st.driver}` : ''].filter(Boolean);
      return parts.join(' / ');
    }
  };

  // All assignable teams grouped: 1) HTAR 1-4 Focus, 2) Other POZ, 3) MECC
  const teamOptions = useMemo(() => {
    const htarFocus: { key: string; id: string; label: string; shortLabel: string; source: 'HTAR' }[] = [];
    const pozOthers: { key: string; id: string; label: string; shortLabel: string; source: 'POZ' }[] = [];
    const meccAll: { key: string; id: string; label: string; shortLabel: string; source: 'MECC' }[] = [];

    HTAR_PRIMARY_TEAMS.forEach((ht) => {
      const found = pozTeams.find((t) => t.id === ht.id);
      htarFocus.push({
        key: `POZ:${ht.id}`,
        id: ht.id,
        label: `${ht.shortName} (${found ? found.name : ht.fullName})`,
        shortLabel: ht.shortName,
        source: 'HTAR'
      });
    });

    pozTeams.forEach((t) => {
      if (!HTAR_PRIMARY_TEAMS.some((h) => h.id === t.id)) {
        pozOthers.push({
          key: `POZ:${t.id}`,
          id: t.id,
          label: `${t.name}`,
          shortLabel: t.name,
          source: 'POZ'
        });
      }
    });

    meccTeams.forEach((t) => {
      meccAll.push({
        key: `MECC:${t.id}`,
        id: t.id,
        label: `${t.name} (${t.category})`,
        shortLabel: t.name,
        source: 'MECC'
      });
    });

    return { htarFocus, pozOthers, meccAll, flat: [...htarFocus, ...pozOthers, ...meccAll] };
  }, [pozTeams, meccTeams]);

  // Responder suggestions datalist
  const responderSuggestions = useMemo(() => {
    const set = new Set<string>();
    allPPPList.forEach((p) => set.add(`PPP ${p.name.toUpperCase()}`));
    allStJohnResponders.forEach((n) => set.add(n.toUpperCase()));
    return Array.from(set).sort();
  }, [allPPPList, allStJohnResponders]);

  // Sync default responder when team selection changes (if not editing existing responder)
  const handleSelectTeamKey = (key: string) => {
    setSelectedTeamKey(key);
    const autoResp = getTeamDefaultResponder(key);
    if (autoResp) {
      setResponderName(autoResp);
    }
  };

  // Run Call Summary Analyzer
  const handleAnalyzeText = (textToParse?: string) => {
    const target = typeof textToParse === 'string' ? textToParse : rawInput;
    if (!target.trim()) {
      showToast('Sila tampal teks Ringkasan Panggilan terlebih dahulu.');
      return;
    }

    const parsed = parseCallSummaryText(target);
    setCallCardNo(parsed.callCardNo);
    setLocation(parsed.location);
    setMapsUrl(parsed.mapsUrl);
    setCallTime(
      parsed.callTime ||
        new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    );
    setEventCode(parsed.eventCode);
    setComplaint(parsed.complaint);
    setPriority(parsed.priority);
    setVitalsNote(parsed.vitalsNote);
    setPatientInfo(parsed.patientInfo);
    setCallerName(parsed.callerName);
    setCallerPhone(parsed.callerPhone);

    // Ensure responder is prefilled if empty
    if (!responderName.trim()) {
      const autoResp = getTeamDefaultResponder(selectedTeamKey);
      if (autoResp) setResponderName(autoResp);
    }

    showToast('Ringkasan Panggilan berjaya dianalisis! Sila pilih pasukan respon.');
  };

  const handlePasteAndAnalyze = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip && clip.trim()) {
        setRawInput(clip);
        handleAnalyzeText(clip);
      } else {
        showToast('Tiada teks ditemui dalam papan keratan (clipboard).');
      }
    } catch {
      showToast('Sila tampal (Ctrl+V) secara manual ke dalam kotak teks dan klik Analyze.');
    }
  };

  const getTriageDisplayText = (t: CaseTriageType, manualText?: string): string => {
    if (t === 'OTHER') {
      return manualText?.trim() ? manualText.trim().toUpperCase() : 'LAIN-LAIN';
    }
    return (CASE_TRIAGE_CONFIG[t] || CASE_TRIAGE_CONFIG.PENDING).shortLabel;
  };

  const resetForm = () => {
    setEditingCaseId(null);
    setRawInput('');
    setCallCardNo('');
    setLocation('');
    setMapsUrl('');
    setCallTime('');
    setEventCode('');
    setComplaint('');
    setPriority('');
    setVitalsNote('');
    setPatientInfo('');
    setCallerName('');
    setCallerPhone('');
    setTriage('PENDING');
    setCustomTriage('');
  };

  // Save / Assign Case
  const handleSaveCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callCardNo.trim() && !location.trim()) {
      showToast('Sila masukkan sekurang-kurangnya No. Call Card atau Lokasi.');
      return;
    }

    const chosenTeam = teamOptions.flat.find((t) => t.key === selectedTeamKey) || teamOptions.htarFocus[0];
    const finalResponder = responderName.trim() || getTeamDefaultResponder(chosenTeam.key) || '-';
    const finalTime =
      callTime.trim() ||
      new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false });
    const finalCustomTriage =
      triage === 'OTHER' ? customTriage.trim().toUpperCase() : undefined;

    if (editingCaseId) {
      setCaseLogs((prev) =>
        prev.map((item) =>
          item.id === editingCaseId
            ? {
                ...item,
                callCardNo: callCardNo.trim(),
                location: location.trim(),
                mapsUrl: mapsUrl.trim() || undefined,
                callTime: finalTime,
                eventCode: eventCode.trim() || '-',
                complaint: complaint.trim() || undefined,
                priority: priority.trim() || undefined,
                vitalsNote: vitalsNote.trim() || undefined,
                patientInfo: patientInfo.trim() || undefined,
                callerName: callerName.trim() || undefined,
                callerPhone: callerPhone.trim() || undefined,
                assignedTeamId: chosenTeam.id,
                assignedTeamName: chosenTeam.shortLabel,
                assignedTeamSource: chosenTeam.source,
                responderName: finalResponder.toUpperCase(),
                triage,
                customTriage: finalCustomTriage,
                rawSummary: rawInput.trim() || item.rawSummary
              }
            : item
        )
      );
      showToast(`Rekod kes bagi ${chosenTeam.shortLabel} berjaya dikemaskini!`);
    } else {
      const newCase: CaseLogItem = {
        id: `case_${Date.now()}`,
        callCardNo: callCardNo.trim() || 'TIADA CALL CARD',
        location: location.trim() || 'TIADA LOKASI',
        mapsUrl: mapsUrl.trim() || undefined,
        callTime: finalTime,
        eventCode: eventCode.trim() || '-',
        complaint: complaint.trim() || undefined,
        priority: priority.trim() || undefined,
        vitalsNote: vitalsNote.trim() || undefined,
        patientInfo: patientInfo.trim() || undefined,
        callerName: callerName.trim() || undefined,
        callerPhone: callerPhone.trim() || undefined,
        shift,
        assignedTeamId: chosenTeam.id,
        assignedTeamName: chosenTeam.shortLabel,
        assignedTeamSource: chosenTeam.source,
        responderName: finalResponder.toUpperCase(),
        triage,
        customTriage: finalCustomTriage,
        respondState: 'RESPONDING',
        rawSummary: rawInput.trim() || undefined,
        createdAt: new Date().toISOString()
      };

      setCaseLogs((prev) => [newCase, ...prev]);
      showToast(`Kes berjaya ditugaskan kepada ${chosenTeam.shortLabel}!`);
    }

    resetForm();
    setSubTab('team_respond');
  };

  // Edit existing case in Analyzer form
  const handleStartEditCase = (item: CaseLogItem) => {
    setEditingCaseId(item.id);
    setRawInput(item.rawSummary || '');
    setCallCardNo(item.callCardNo);
    setLocation(item.location);
    setMapsUrl(item.mapsUrl || '');
    setCallTime(item.callTime);
    setEventCode(item.eventCode);
    setComplaint(item.complaint || '');
    setPriority(item.priority || '');
    setVitalsNote(item.vitalsNote || '');
    setPatientInfo(item.patientInfo || '');
    setCallerName(item.callerName || '');
    setCallerPhone(item.callerPhone || '');
    const keyPrefix = item.assignedTeamSource === 'MECC' ? 'MECC' : 'POZ';
    setSelectedTeamKey(`${keyPrefix}:${item.assignedTeamId}`);
    setResponderName(item.responderName);
    setTriage(item.triage);
    setCustomTriage(item.customTriage || '');
    setSubTab('analyzer');
  };

  // Inline Triage Update
  const handleUpdateTriage = (caseId: string, newTriage: CaseTriageType) => {
    setCaseLogs((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              triage: newTriage,
              customTriage: newTriage === 'OTHER' ? c.customTriage || '' : undefined
            }
          : c
      )
    );
    showToast(
      newTriage === 'OTHER'
        ? 'Sila masukkan Triage manual pada ruangan Lain-lain.'
        : `Triage dikemaskini kepada ${CASE_TRIAGE_CONFIG[newTriage].shortLabel}`
    );
  };

  // Inline Custom Triage Text Update (for 'OTHER' / Lain-lain)
  const handleUpdateCustomTriage = (caseId: string, text: string) => {
    setCaseLogs((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, customTriage: text.toUpperCase() } : c
      )
    );
  };

  // Inline Responder Update
  const handleUpdateCaseResponder = (caseId: string, newResp: string) => {
    setCaseLogs((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, responderName: newResp.toUpperCase() } : c))
    );
  };

  // Complete / Re-open Case
  const handleToggleCaseState = (item: CaseLogItem) => {
    const nextState = item.respondState === 'RESPONDING' ? 'COMPLETED' : 'RESPONDING';
    setCaseLogs((prev) =>
      prev.map((c) =>
        c.id === item.id
          ? {
              ...c,
              respondState: nextState,
              completedAt:
                nextState === 'COMPLETED'
                  ? new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })
                  : undefined
            }
          : c
      )
    );
    showToast(
      nextState === 'COMPLETED'
        ? `Kes ${item.assignedTeamName} ditandakan SELESAI — Pasukan kembali Standby.`
        : `Kes ${item.assignedTeamName} diaktifkan semula kepada SEDANG RESPON.`
    );
  };

  // Build WhatsApp Dispatch Text for a Case
  const buildDispatchWhatsAppText = (c: CaseLogItem) => {
    let msg = `🚑 *DISPATCH KES MECC HTAR*\n`;
    msg += `Pasukan: *${c.assignedTeamName}*\n`;
    if (c.responderName && c.responderName !== '-') {
      msg += `Responder: *${c.responderName}*\n`;
    }
    msg += `No. Call Card: ${c.callCardNo}\n`;
    msg += `Masa: ${c.callTime}\n`;
    msg += `Event Code: *${c.eventCode}*${c.priority ? ` (${c.priority})` : ''}\n`;
    msg += `Lokasi: *${c.location}*\n`;
    if (c.mapsUrl) {
      msg += `Maps: ${c.mapsUrl}\n`;
    }
    if (c.complaint) {
      msg += `Aduan: ${c.complaint}\n`;
    }
    if (c.vitalsNote) {
      msg += `Info/Vitals: ${c.vitalsNote}\n`;
    }
    if (c.triage !== 'PENDING') {
      msg += `Triage: *${getTriageDisplayText(c.triage, c.customTriage)}*\n`;
    }
    return msg;
  };

  // Active responding cases mapped by teamId (most recent active case per team)
  const activeCaseByTeamId = useMemo(() => {
    const map = new Map<string, CaseLogItem>();
    caseLogs.forEach((c) => {
      if (c.respondState === 'RESPONDING' && !map.has(c.assignedTeamId)) {
        map.set(c.assignedTeamId, c);
      }
    });
    return map;
  }, [caseLogs]);

  // Rows for Team Respond Status View (Focused on HTAR 1 - HTAR 4, plus any other active responding units)
  const teamRespondRows = useMemo(() => {
    const rows: {
      teamKey: string;
      teamId: string;
      displayName: string;
      subCode: string;
      source: 'HTAR' | 'POZ' | 'MECC';
      defaultResponder: string;
      activeCase: CaseLogItem | null;
    }[] = [];

    // 1. Always show HTAR 1, HTAR 2, HTAR 3, HTAR 4 first (Core Focus)
    HTAR_PRIMARY_TEAMS.forEach((ht) => {
      const pozObj = pozTeams.find((t) => t.id === ht.id);
      const key = `POZ:${ht.id}`;
      rows.push({
        teamKey: key,
        teamId: ht.id,
        displayName: ht.shortName,
        subCode: pozObj?.name || ht.fullName,
        source: 'HTAR',
        defaultResponder: getTeamDefaultResponder(key),
        activeCase: activeCaseByTeamId.get(ht.id) || null
      });
    });

    // 2. Include other POZ / MECC teams if they currently have an active responding case OR user toggled "Show All"
    pozTeams.forEach((t) => {
      if (HTAR_PRIMARY_TEAMS.some((h) => h.id === t.id)) return;
      const active = activeCaseByTeamId.get(t.id) || null;
      if (active || showOtherTeamsInRespondBoard) {
        const key = `POZ:${t.id}`;
        rows.push({
          teamKey: key,
          teamId: t.id,
          displayName: t.name,
          subCode: t.category || 'POZ KLANG',
          source: 'POZ',
          defaultResponder: getTeamDefaultResponder(key),
          activeCase: active
        });
      }
    });

    meccTeams.forEach((t) => {
      const active = activeCaseByTeamId.get(t.id) || null;
      if (active || showOtherTeamsInRespondBoard) {
        const key = `MECC:${t.id}`;
        rows.push({
          teamKey: key,
          teamId: t.id,
          displayName: t.name,
          subCode: t.category,
          source: 'MECC',
          defaultResponder: getTeamDefaultResponder(key),
          activeCase: active
        });
      }
    });

    return rows;
  }, [pozTeams, meccTeams, activeCaseByTeamId, showOtherTeamsInRespondBoard, pozStatuses, meccStatuses, allPPPList]);

  const handleToggleHistorySort = (field: 'callCard' | 'masa') => {
    if (historySortBy === field) {
      setHistorySortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setHistorySortBy(field);
      setHistorySortDir(field === 'masa' ? 'desc' : 'asc');
    }
  };

  const hasActiveCallCardMasaFilter =
    Boolean(callCardColumnFilter.trim()) ||
    Boolean(masaColumnFilter.trim()) ||
    shiftColumnFilter !== 'ALL';

  // Filtered & Sorted History Cases (Senarai Case Log)
  const filteredHistory = useMemo(() => {
    const getComparableTime = (c: CaseLogItem): string => {
      const raw = (c.callTime || '').trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
      const datePrefix = c.createdAt ? c.createdAt.slice(0, 10) : '0000-00-00';
      return raw ? `${datePrefix} ${raw}` : c.createdAt || '';
    };

    const filtered = caseLogs.filter((c) => {
      if (triageFilter !== 'ALL' && c.triage !== triageFilter) return false;
      if (stateFilter !== 'ALL' && c.respondState !== stateFilter) return false;
      if (shiftColumnFilter !== 'ALL' && c.shift !== shiftColumnFilter) return false;

      if (callCardColumnFilter.trim()) {
        const ccQuery = callCardColumnFilter.trim().toLowerCase();
        if (!c.callCardNo.toLowerCase().includes(ccQuery)) return false;
      }

      if (masaColumnFilter.trim()) {
        const mQuery = masaColumnFilter.trim().toLowerCase();
        const combinedTime = `${c.callTime} ${c.shift}`.toLowerCase();
        if (!combinedTime.includes(mQuery)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.callCardNo.toLowerCase().includes(q) ||
          c.callTime.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.assignedTeamName.toLowerCase().includes(q) ||
          c.responderName.toLowerCase().includes(q) ||
          c.eventCode.toLowerCase().includes(q) ||
          (c.customTriage && c.customTriage.toLowerCase().includes(q)) ||
          (c.complaint && c.complaint.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (historySortBy === 'callCard') {
        cmp = a.callCardNo.localeCompare(b.callCardNo, undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      } else {
        cmp = getComparableTime(a).localeCompare(getComparableTime(b), undefined, {
          numeric: true
        });
      }
      return historySortDir === 'asc' ? cmp : -cmp;
    });
  }, [
    caseLogs,
    triageFilter,
    stateFilter,
    shiftColumnFilter,
    callCardColumnFilter,
    masaColumnFilter,
    searchQuery,
    historySortBy,
    historySortDir
  ]);

  // Stats
  const stats = useMemo(() => {
    const total = caseLogs.length;
    const responding = caseLogs.filter((c) => c.respondState === 'RESPONDING').length;
    const htarBusy = HTAR_PRIMARY_TEAMS.filter((h) => activeCaseByTeamId.has(h.id)).length;
    const htarFree = HTAR_PRIMARY_TEAMS.length - htarBusy;
    return { total, responding, htarBusy, htarFree };
  }, [caseLogs, activeCaseByTeamId]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <datalist id="caselog-responder-list">
        {responderSuggestions.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/40 flex items-center gap-3 animate-fade-in">
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold tracking-wide">
              <ClipboardList size={13} /> MECC MANAGEMENT BOARD • CASE LOG & DISPATCH HTAR 1–4
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Case Log Manager & Status Respon Pasukan
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Analisis automatik teks <strong>Ringkasan Panggilan (Call Summary)</strong> untuk mengekstrak No. Call Card, Lokasi, Masa & Event Code, tugaskan pasukan respon (fokus utama <strong>HTAR 1 – HTAR 4</strong> serta POZ/MECC), dan pantau status Triage (<strong>SD, DAMA, YZ, RZ, PAC, PEOBS, CARSS</strong>).
            </p>
          </div>

          {/* Compact Tabular Counters */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0 font-mono tabular-nums">
            <div className="bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] font-sans font-bold text-emerald-300 uppercase block">HTAR Sedia</span>
              <span className="text-xl font-black text-emerald-400">{stats.htarFree}/4</span>
            </div>
            <div className="bg-rose-950/60 border border-rose-500/40 px-3.5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] font-sans font-bold text-rose-300 uppercase block">Sedang Respon</span>
              <span className="text-xl font-black text-rose-400">{stats.responding}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase block">Jumlah Log</span>
              <span className="text-xl font-black text-white">{stats.total}</span>
            </div>
          </div>
        </div>

        {/* Tabbed Link View Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-700/70">
            <button
              type="button"
              onClick={() => setSubTab('team_respond')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'team_respond'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Truck size={15} />
              <span>Team Respond Status (HTAR 1–4)</span>
              <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono tabular-nums">
                {stats.htarBusy}/4 Aktif
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('analyzer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'analyzer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles size={15} />
              <span>{editingCaseId ? 'Kemaskini Kes' : '+ Analyze Case Summary & Assign'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText size={15} />
              <span>Senarai Case Log</span>
              <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono tabular-nums">
                {stats.total}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            {formattedDate} • Shif {shift} ({SHIFT_DETAILS[shift].time})
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: TEAM RESPOND STATUS (FOKUS HTAR 1 - HTAR 4)                    */}
      {/* Columns: Team, No Call Card, Alamat, Responder, Event Code, Triage    */}
      {/* ===================================================================== */}
      {subTab === 'team_respond' && (
        <div className="space-y-4">
          {/* Quick 4-Card Strip for HTAR 1 - HTAR 4 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {HTAR_PRIMARY_TEAMS.map((ht) => {
              const activeCase = activeCaseByTeamId.get(ht.id);
              const defaultResp = getTeamDefaultResponder(`POZ:${ht.id}`);
              const isBusy = Boolean(activeCase);

              return (
                <div
                  key={ht.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isBusy
                      ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                      : 'bg-white border-emerald-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isBusy ? 'bg-rose-600 animate-ping' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="font-black text-sm text-slate-900">{ht.shortName}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        isBusy
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isBusy ? 'RESPON KES' : 'SEDIA'}
                    </span>
                  </div>

                  {activeCase ? (
                    <div className="space-y-1 text-[11px]">
                      <div className="font-mono tabular-nums font-bold text-slate-800 truncate" title={activeCase.callCardNo}>
                        {activeCase.callCardNo || '—'}
                      </div>
                      <div className="flex items-center justify-between text-slate-500 font-mono tabular-nums">
                        <span>{activeCase.eventCode}</span>
                        <span className="font-bold text-rose-700 truncate max-w-[110px]" title={getTriageDisplayText(activeCase.triage, activeCase.customTriage)}>
                          {getTriageDisplayText(activeCase.triage, activeCase.customTriage)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="truncate">{defaultResp || 'Tiada PPP dipilih'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectTeamKey(`POZ:${ht.id}`);
                          setSubTab('analyzer');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold whitespace-nowrap ml-1"
                      >
                        + Assign
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Main Team Respond Status Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Activity size={18} className="text-rose-600" />
                  Jadual Status Respon Pasukan (Team Respond Status)
                </h2>
                <p className="text-xs text-slate-500">
                  Fokus Utama: <strong>HTAR 1, HTAR 2, HTAR 3, HTAR 4</strong> • Kemaskini Triage terus (SD / DAMA / YZ / RZ / WT / PAC / PEOBS / CARSS / Lain-lain)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtherTeamsInRespondBoard((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    showOtherTeamsInRespondBoard
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {showOtherTeamsInRespondBoard ? 'Fokus HTAR 1–4 Sahaja' : '+ Papar Semua Unit POZ/MECC'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setSubTab('analyzer');
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} /> Analyze Kes Baru
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3.5 min-w-[140px]">Team</th>
                    <th className="py-3 px-3 min-w-[200px]">No. Call Card</th>
                    <th className="py-3 px-3 min-w-[190px]">Alamat / Lokasi</th>
                    <th className="py-3 px-3 min-w-[155px]">Responder</th>
                    <th className="py-3 px-3 min-w-[110px]">Event Code</th>
                    <th className="py-3 px-3 min-w-[165px]">Triage</th>
                    <th className="py-3 px-3.5 text-right min-w-[165px]">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {teamRespondRows.map((row) => {
                    const c = row.activeCase;
                    const triageCfg = c ? CASE_TRIAGE_CONFIG[c.triage] : CASE_TRIAGE_CONFIG.PENDING;

                    return (
                      <tr
                        key={row.teamKey}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          c ? 'bg-rose-50/20' : 'bg-white'
                        }`}
                      >
                        {/* 1. TEAM */}
                        <td className="py-3.5 px-3.5 align-top">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                c ? 'bg-rose-600 animate-pulse' : 'bg-emerald-500'
                              }`}
                            />
                            <div>
                              <span className="font-black text-slate-900 text-xs sm:text-sm block">
                                {row.displayName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {row.subCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. NO CALL CARD */}
                        <td className="py-3.5 px-3 align-top">
                          {c ? (
                            <div className="space-y-1">
                              <span className="font-mono tabular-nums font-bold text-slate-900 break-all leading-snug block">
                                {c.callCardNo}
                              </span>
                              <span className="text-[10px] font-mono tabular-nums text-slate-500 flex items-center gap-1">
                                <Clock size={10} /> {c.callTime}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Tiada panggilan aktif (Standby)</span>
                          )}
                        </td>

                        {/* 3. ALAMAT / LOKASI */}
                        <td className="py-3.5 px-3 align-top">
                          {c ? (
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900">{c.location}</div>
                              {c.complaint && (
                                <div className="text-[11px] text-rose-700 font-semibold">
                                  ⚠️ {c.complaint}
                                </div>
                              )}
                              {c.mapsUrl && (
                                <a
                                  href={c.mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
                                >
                                  <MapPin size={10} /> Buka Google Maps <ExternalLink size={9} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>

                        {/* 4. RESPONDER */}
                        <td className="py-3.5 px-3 align-top">
                          {c ? (
                            <input
                              type="text"
                              list="caselog-responder-list"
                              value={c.responderName}
                              onChange={(e) => handleUpdateCaseResponder(c.id, e.target.value)}
                              placeholder="Nama Responder..."
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-slate-600">
                              {row.defaultResponder || <span className="text-slate-400 italic">Belum ditetapkan</span>}
                            </span>
                          )}
                        </td>

                        {/* 5. EVENT CODE */}
                        <td className="py-3.5 px-3 align-top">
                          {c ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono tabular-nums text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
                                {c.eventCode}
                              </span>
                              {c.priority && (
                                <span className="block text-[10px] font-black text-rose-600 font-mono">
                                  Keutamaan: {c.priority}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>

                        {/* 6. TRIAGE (SD / DAMA / YZ / RZ / WT / PAC / PEOBS / CARSS / LAIN-LAIN) */}
                        <td className="py-3.5 px-3 align-top">
                          {c ? (
                            <div className="space-y-1.5">
                              <select
                                value={c.triage}
                                onChange={(e) => handleUpdateTriage(c.id, e.target.value as CaseTriageType)}
                                className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-black border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${triageCfg.bg} ${triageCfg.border}`}
                              >
                                {CASE_TRIAGE_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt} className="bg-white text-slate-900 font-bold">
                                    {CASE_TRIAGE_CONFIG[opt].label}
                                  </option>
                                ))}
                              </select>
                              {c.triage === 'OTHER' && (
                                <input
                                  type="text"
                                  value={c.customTriage || ''}
                                  onChange={(e) => handleUpdateCustomTriage(c.id, e.target.value)}
                                  placeholder="Key-in triage manual..."
                                  className="w-full px-2.5 py-1.5 bg-white border border-violet-300 rounded-lg text-xs font-black uppercase text-violet-900 placeholder:font-normal placeholder:normal-case focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>

                        {/* 7. ACTIONS */}
                        <td className="py-3.5 px-3.5 align-top text-right">
                          {c ? (
                            <div className="inline-flex items-center justify-end gap-1">
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(buildDispatchWhatsAppText(c))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Hantar maklumat kes ke WhatsApp"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-colors"
                              >
                                <Send size={13} />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleStartEditCase(c)}
                                title="Sunting butiran kes"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCaseState(c)}
                                title="Tandakan kes selesai & kembalikan pasukan ke Standby"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors whitespace-nowrap"
                              >
                                Selesai
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                resetForm();
                                handleSelectTeamKey(row.teamKey);
                                setSubTab('analyzer');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-bold transition-all"
                            >
                              <Plus size={13} /> Assign Kes
                            </button>
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

      {/* ===================================================================== */}
      {/* TAB 2: ANALYZE CASE SUMMARY & ASSIGN TEAM                             */}
      {/* ===================================================================== */}
      {subTab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Paste Raw Call Summary */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Sparkles size={17} className="text-indigo-600" />
                    1. Analyze Ringkasan Panggilan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tampal teks <em>RINGKASAN PANGGILAN / CALL SUMMARY</em> dari sistem MERS/MECC
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRawInput(SAMPLE_CALL_SUMMARY);
                    handleAnalyzeText(SAMPLE_CALL_SUMMARY);
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:underline shrink-0"
                >
                  Muat Contoh
                </button>
              </div>

              <textarea
                rows={14}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`Tampal teks RINGKASAN PANGGILAN di sini...\n\nContoh:\nCall Card: KCH0466/KHAIRA-HTAR-...\nMasa: 2026-11-03 09:26:25\n2️⃣ LOKASI KECEMASAN / LOCATION:\n   KK SIJANGKANG\n🚑 DISPATCH CODE: 33-A-1`}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePasteAndAnalyze}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ClipboardPaste size={15} /> Paste & Analyze
              </button>
              <button
                type="button"
                onClick={() => handleAnalyzeText()}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles size={15} /> Analyze Teks
              </button>
              {rawInput && (
                <button
                  type="button"
                  onClick={() => setRawInput('')}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  Kosongkan
                </button>
              )}
            </div>
          </div>

          {/* Right 7 Cols: Extracted Fields + Team Assignment */}
          <form
            onSubmit={handleSaveCase}
            className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Truck size={18} className="text-rose-600" />
                  {editingCaseId ? 'Kemaskini Maklumat Kes & Pasukan' : '2. Data Diekstrak & Assign Pasukan Respon'}
                </h2>
                <p className="text-xs text-slate-500">
                  Semak maklumat yang ditangkap dan pilih pasukan respon daripada senarai HTAR 1–4, POZ, atau MECC.
                </p>
              </div>
              {editingCaseId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Batal Edit
                </button>
              )}
            </div>

            {/* Captured Core 4 Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  No. Call Card (Captured) *
                </label>
                <input
                  type="text"
                  required
                  value={callCardNo}
                  onChange={(e) => setCallCardNo(e.target.value)}
                  placeholder="cth: KCH0466/KHAIRA-HTAR-20261103-09:26:23-AM-000004"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Alamat / Location / Lokasi (Captured) *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="cth: KK SIJANGKANG"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Masa Panggilan (Captured)
                </label>
                <input
                  type="text"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  placeholder="cth: 2026-11-03 09:26:25"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono tabular-nums text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Event Code / Dispatch Code (Captured)
                </label>
                <input
                  type="text"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  placeholder="cth: 33-A-1"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-black text-indigo-800 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Aduan / Chief Complaint
                </label>
                <input
                  type="text"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="cth: REFERRED FOR TRO APPENDICITIS"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Keutamaan & Vitals Ringkas
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    placeholder="P4"
                    className="col-span-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-rose-700 uppercase"
                  />
                  <input
                    type="text"
                    value={vitalsNote}
                    onChange={(e) => setVitalsNote(e.target.value)}
                    placeholder="Vitals / Nota..."
                    className="col-span-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Assign Team Respon: Quick HTAR 1-4 Focus + Full POZ / MECC Dropdown */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Pilih Pasukan Respon (Fokus Utama: HTAR 1 – HTAR 4)
              </label>

              {/* Quick 1-Click HTAR 1 - 4 Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {teamOptions.htarFocus.map((ht) => {
                  const isChosen = selectedTeamKey === ht.key;
                  const busyCase = activeCaseByTeamId.get(ht.id);
                  return (
                    <button
                      key={ht.key}
                      type="button"
                      onClick={() => handleSelectTeamKey(ht.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isChosen
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-200'
                          : busyCase
                          ? 'bg-amber-50/70 text-slate-800 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs">{ht.shortLabel}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isChosen
                              ? 'bg-white/20 text-white'
                              : busyCase
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {busyCase ? 'Sibuk' : 'Sedia'}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 ${
                          isChosen ? 'text-rose-100' : 'text-slate-500'
                        }`}
                      >
                        {getTeamDefaultResponder(ht.key) || 'Pilih HTAR'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Full POZ & MECC Team Selector + Responder Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Senarai Penuh Pasukan (HTAR / POZ / MECC)
                  </label>
                  <select
                    value={selectedTeamKey}
                    onChange={(e) => handleSelectTeamKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <optgroup label="★ FOKUS UTAMA: PASUKAN HTAR (HTAR 1 - 4)">
                      {teamOptions.htarFocus.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="SENARAI PASUKAN POZ (KK KLANG & ST. JOHN)">
                      {teamOptions.pozOthers.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="SENARAI PASUKAN MECC (BANTING / SHAH ALAM / HASA)">
                      {teamOptions.meccAll.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <User size={12} /> Nama Responder Bertugas
                  </label>
                  <input
                    type="text"
                    list="caselog-responder-list"
                    value={responderName}
                    onChange={(e) => setResponderName(e.target.value)}
                    placeholder="cth: PPP STONE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Triage Quick Pills */}
              <div className="pt-1 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Triage Kes (SD / DAMA / YZ / RZ / WT / PAC / PEOBS / CARSS / Lain-lain)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CASE_TRIAGE_OPTIONS.map((opt) => {
                    const cfg = CASE_TRIAGE_CONFIG[opt];
                    const active = triage === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTriage(opt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                          active
                            ? `${cfg.bg} ${cfg.border} ring-2 ring-slate-900/15 scale-[1.02]`
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt === 'PENDING'
                          ? 'Belum Triage'
                          : opt === 'OTHER'
                          ? 'Lain-lain (Manual)'
                          : cfg.shortLabel}
                      </button>
                    );
                  })}
                </div>

                {triage === 'OTHER' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customTriage}
                      onChange={(e) => setCustomTriage(e.target.value)}
                      placeholder="Key-in Triage Manual (cth: BID / WAD / KK / DECONTAM)..."
                      className="w-full sm:w-80 px-3 py-2 bg-violet-50/60 border border-violet-300 rounded-xl text-xs font-black uppercase text-violet-900 placeholder:font-normal placeholder:normal-case focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSubTab('team_respond')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Lihat Jadual Respon
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 flex items-center gap-2 transition-all"
              >
                <CheckCircle2 size={16} />
                <span>{editingCaseId ? 'Simpan Kemaskini Kes' : 'Assign Pasukan & Simpan Log'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: FULL CASE LOG HISTORY                                          */}
      {/* ===================================================================== */}
      {subTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Triage Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Call Card, lokasi, pasukan, responder..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value as 'ALL' | 'RESPONDING' | 'COMPLETED')}
                className="py-1.5 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="ALL">Semua Status ({caseLogs.length})</option>
                <option value="RESPONDING">Sedang Respon</option>
                <option value="COMPLETED">Selesai</option>
              </select>

              <select
                value={triageFilter}
                onChange={(e) => setTriageFilter(e.target.value as 'ALL' | CaseTriageType)}
                className="py-1.5 px-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="ALL">Semua Triage</option>
                {CASE_TRIAGE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {CASE_TRIAGE_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {caseLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ClipboardList size={38} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Tiada rekod log kes ditemui</p>
                <button
                  type="button"
                  onClick={() => setSubTab('analyzer')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  + Analyze & Daftar Kes Pertama
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3.5 align-bottom">Team & Status</th>
                      <th className="py-2.5 px-3 min-w-[270px] align-bottom">
                        <div className="space-y-1.5">
                          {/* Buttons above No. Call Card & Masa */}
                          <div className="flex flex-wrap items-center gap-1 normal-case">
                            <button
                              type="button"
                              onClick={() => handleToggleHistorySort('callCard')}
                              title="Susun mengikut No. Call Card"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                                historySortBy === 'callCard'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>No. Call Card</span>
                              {historySortBy === 'callCard' ? (
                                historySortDir === 'asc' ? (
                                  <ArrowUp size={11} />
                                ) : (
                                  <ArrowDown size={11} />
                                )
                              ) : (
                                <ArrowUpDown size={11} className="opacity-60" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleHistorySort('masa')}
                              title="Susun mengikut Masa Panggilan"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                                historySortBy === 'masa'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <Clock size={10} />
                              <span>Masa</span>
                              {historySortBy === 'masa' ? (
                                historySortDir === 'asc' ? (
                                  <ArrowUp size={11} />
                                ) : (
                                  <ArrowDown size={11} />
                                )
                              ) : (
                                <ArrowUpDown size={11} className="opacity-60" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowCallCardMasaFilter((prev) => !prev)}
                              title="Tapis mengikut No. Call Card atau Masa"
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                                showCallCardMasaFilter || hasActiveCallCardMasaFilter
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <Filter size={10} />
                              <span>Tapis</span>
                            </button>

                            {hasActiveCallCardMasaFilter && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCallCardColumnFilter('');
                                  setMasaColumnFilter('');
                                  setShiftColumnFilter('ALL');
                                }}
                                title="Set semula tapisan No. Call Card & Masa"
                                className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700"
                              >
                                <RotateCcw size={10} />
                              </button>
                            )}
                          </div>

                          {/* Expandable Filter Inputs for No. Call Card / Masa */}
                          {showCallCardMasaFilter && (
                            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 normal-case font-normal">
                              <input
                                type="text"
                                value={callCardColumnFilter}
                                onChange={(e) => setCallCardColumnFilter(e.target.value)}
                                placeholder="Tapis No. Call Card (cth: KCH0466 / 0004)..."
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={masaColumnFilter}
                                  onChange={(e) => setMasaColumnFilter(e.target.value)}
                                  placeholder="Tapis Masa/Tarikh (cth: 2026-11-03 / 09:)..."
                                  className="flex-1 min-w-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                />
                                <select
                                  value={shiftColumnFilter}
                                  onChange={(e) => setShiftColumnFilter(e.target.value as 'ALL' | Shift)}
                                  className="px-1.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                                >
                                  <option value="ALL">Shif</option>
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                  <option value="ON">ON</option>
                                </select>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span>No. Call Card & Masa</span>
                            <span className="text-[9px] font-mono font-semibold text-slate-400 normal-case">
                              {historySortBy === 'callCard'
                                ? `Call Card (${historySortDir === 'asc' ? 'A→Z' : 'Z→A'})`
                                : `Masa (${historySortDir === 'desc' ? 'Terkini' : 'Terawal'})`}
                            </span>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-3 align-bottom">Alamat / Lokasi</th>
                      <th className="py-3 px-3 align-bottom">Responder</th>
                      <th className="py-3 px-3 align-bottom">Event Code</th>
                      <th className="py-3 px-3 min-w-[155px] align-bottom">Triage</th>
                      <th className="py-3 px-3.5 text-right align-bottom">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 px-4 text-center space-y-2">
                          <p className="text-xs font-bold text-slate-600">
                            Tiada rekod sepadan dengan tapisan No. Call Card / Masa semasa.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCallCardColumnFilter('');
                              setMasaColumnFilter('');
                              setShiftColumnFilter('ALL');
                              setSearchQuery('');
                              setTriageFilter('ALL');
                              setStateFilter('ALL');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            <RotateCcw size={12} /> Set Semula Semua Tapisan
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item) => {
                        const tCfg = CASE_TRIAGE_CONFIG[item.triage];
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3.5 align-top">
                            <span className="font-black text-slate-900 block">{item.assignedTeamName}</span>
                            <span
                              className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                                item.respondState === 'RESPONDING'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {item.respondState === 'RESPONDING'
                                ? 'SEDANG RESPON'
                                : `SELESAI ${item.completedAt || ''}`}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 align-top">
                            <span className="font-mono tabular-nums font-bold text-slate-900 break-all block">
                              {item.callCardNo}
                            </span>
                            <span className="text-[10px] font-mono tabular-nums text-slate-500">
                              {item.callTime} • Shif {item.shift}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 align-top">
                            <span className="font-bold text-slate-900 block">{item.location}</span>
                            {item.complaint && (
                              <span className="text-[11px] text-slate-500 block">{item.complaint}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 align-top font-bold text-slate-800">
                            {item.responderName}
                          </td>

                          <td className="py-3.5 px-3 align-top">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-bold">
                              {item.eventCode}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 align-top">
                            <div className="space-y-1.5">
                              <select
                                value={item.triage}
                                onChange={(e) => handleUpdateTriage(item.id, e.target.value as CaseTriageType)}
                                className={`w-full py-1 px-2 rounded-lg text-xs font-black border cursor-pointer ${tCfg.bg} ${tCfg.border}`}
                              >
                                {CASE_TRIAGE_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt} className="bg-white text-slate-900">
                                    {opt === 'OTHER' ? 'LAIN-LAIN (MANUAL)' : CASE_TRIAGE_CONFIG[opt].shortLabel}
                                  </option>
                                ))}
                              </select>
                              {item.triage === 'OTHER' && (
                                <input
                                  type="text"
                                  value={item.customTriage || ''}
                                  onChange={(e) => handleUpdateCustomTriage(item.id, e.target.value)}
                                  placeholder="Key-in triage manual..."
                                  className="w-full px-2 py-1 bg-white border border-violet-300 rounded-lg text-[11px] font-black uppercase text-violet-900 placeholder:font-normal placeholder:normal-case focus:ring-1 focus:ring-violet-500 focus:outline-none"
                                />
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3.5 align-top text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingCase(item)}
                                title="Lihat butiran penuh"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(buildDispatchWhatsAppText(item));
                                  setCopiedId(item.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                  showToast('Mesej dispatch kes disalin!');
                                }}
                                title="Salin teks WhatsApp"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                {copiedId === item.id ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCaseState(item)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold"
                              >
                                {item.respondState === 'RESPONDING' ? 'Selesai' : 'Aktifkan'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingCase(item)}
                                title="Padam log kes"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-600 hover:text-white"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: View Full Case Details */}
      {viewingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Butiran Kes — {viewingCase.assignedTeamName}
                </h3>
                <p className="text-xs font-mono text-slate-500">{viewingCase.callCardNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingCase(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Pasukan & Responder</span>
                  <span className="font-black text-slate-900">{viewingCase.assignedTeamName} ({viewingCase.responderName})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Event Code & Triage</span>
                  <span className="font-mono font-black text-indigo-700">
                    {viewingCase.eventCode} • {getTriageDisplayText(viewingCase.triage, viewingCase.customTriage)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Lokasi</span>
                  <span className="font-bold text-slate-900">{viewingCase.location}</span>
                </div>
              </div>

              {viewingCase.rawSummary && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Teks Asal Ringkasan Panggilan
                  </span>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] whitespace-pre-wrap overflow-x-auto">
                    {viewingCase.rawSummary}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingCase(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Case */}
      {deletingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={22} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Padam Rekod Case Log?</h3>
              <p className="text-xs text-slate-500">
                Padam kes <strong className="text-slate-800">{deletingCase.callCardNo}</strong> ({deletingCase.location}) daripada pangkalan data?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCase(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaseLogs((prev) => prev.filter((c) => c.id !== deletingCase.id));
                  setDeletingCase(null);
                  showToast('Rekod log kes telah dipadam.');
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Ya, Padam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
