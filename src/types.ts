/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Shift = 'AM' | 'PM' | 'ON';

export interface PPPContact {
  id: string;
  name: string;
  personalPhone: string;
  category: string;
}

export interface ResponderEditOverride {
  name: string;
  role: 'PPP' | 'STJOHN';
  category: string;
  phone: string;
  updatedAt?: string;
}

export interface AmbulanceTeam {
  id: string;
  name: string;
  tmPhone: string;
  defaultStatus: boolean;
  category?: string;
  vehiclePlate?: string;
}

export type MeccStatusType = 'SIAP_SEDIA' | 'ON_CALL' | 'ROSAK' | 'TIADA_STAFF' | 'OFF';

export interface MeccTeam {
  id: string;
  name: string;
  category: 'PKD BANTING' | 'BANTING' | 'SHAH ALAM' | 'HASA' | string;
  defaultStatus: MeccStatusType;
  defaultVehicle?: string;
  defaultDriver?: string;
  defaultPpp?: string;
  phone?: string;
}

export interface MeccTeamStatus {
  status: MeccStatusType;
  ppp: string;
  driver: string;
  crew?: string;
  vehicle: string;
  notes: string;
}

export interface DetectedManualName {
  id: string;
  type: 'stjohn' | 'ppp';
  name: string;
  selected: boolean;
  stJohnField?: 'manualName1' | 'manualName2';
  teamId?: string;
  teamName?: string;
  category: string;
  phone: string;
}

export type ActiveTab =
  | 'landing'
  | 'dashboard'
  | 'caselog'
  | 'teamrespond'
  | 'poz'
  | 'mecc'
  | 'rollcall'
  | 'responders'
  | 'settings';

export interface PozTeamStatusItem {
  active: boolean;
  pppId: string;
  customPppName?: string;
  isOthersPpp?: boolean;
  manualName1?: string;
  manualName2?: string;
  isOthers1?: boolean;
  isOthers2?: boolean;
  notes?: string;
}

export type ClinicRollcallStatus = 'PENDING' | 'ROLLCALL_SENT' | 'ACTIVE' | 'STANDBY' | 'OFF';

export interface OncallClinic {
  id: string;
  name: string;
  region: 'PKD KLANG' | 'PKD BANTING' | 'LAIN-LAIN' | string;
  whatsappPhone: string;
  linkedPozTeamId?: string;
  linkedMeccTeamId?: string;
  isCustom?: boolean;
}

export interface ClinicRollcallEntry {
  status: ClinicRollcallStatus;
  rollcallSent: boolean;
  sentAt?: string;
  oncallName: string;
  oncallPhone: string;
  ambulanceStatus: string;
  activatedByMecc?: boolean;
  activatedAt?: string;
  quickReplySent?: boolean;
  quickReplySentAt?: string;
}

export type ShiftRollcallMap = Record<Shift, Record<string, ClinicRollcallEntry>>;

export interface RollcallTemplates {
  rollcallMessage: string;
  quickReplyMessage: string;
}

export type CaseTriageType =
  | 'PENDING'
  | 'SD'
  | 'DAMA'
  | 'YZ'
  | 'RZ'
  | 'GZ'
  | 'WT'
  | 'PAC'
  | 'PEOBS'
  | 'CARSS'
  | 'OTHER';

export type CaseRespondState = 'RESPONDING' | 'COMPLETED';

export interface CaseLogItem {
  id: string;
  callCardNo: string;
  meccRef?: string;
  location: string;
  mapsUrl?: string;
  callTime: string;
  eventCode: string;
  mpds?: string;
  priority?: string;
  complaint?: string;
  patientInfo?: string;
  vitalsNote?: string;
  callerName?: string;
  callerPhone?: string;
  shift: Shift;
  assignedTeamId: string;
  assignedTeamName: string;
  assignedTeamSource: 'HTAR' | 'POZ' | 'MECC';
  responderName: string;
  triage: CaseTriageType;
  customTriage?: string;
  respondState: CaseRespondState;
  rawSummary?: string;
  createdAt: string;
  completedAt?: string;
}
