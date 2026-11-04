/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPPContact, AmbulanceTeam, Shift, MeccTeam, MeccStatusType, OncallClinic, ClinicRollcallStatus, CaseTriageType } from './types.ts';

export * from './types.ts';

export const PPP_LIST: PPPContact[] = [
  // CONTACT PPP PHC HTAR
  { id: 'h1', name: 'ABD RAHMAN', personalPhone: '0122570293', category: 'PHC HTAR' },
  { id: 'h2', name: 'AFENDI', personalPhone: '0195355381', category: 'PHC HTAR' },
  { id: 'h3', name: 'AIMAN', personalPhone: '01123337183', category: 'PHC HTAR' },
  { id: 'h4', name: 'AKMAL', personalPhone: '0183101074', category: 'PHC HTAR' },
  { id: 'h5', name: 'ALHAFIS', personalPhone: '01111904435', category: 'PHC HTAR' },
  { id: 'h6', name: 'ALIF', personalPhone: '0172903369', category: 'PHC HTAR' },
  { id: 'h7', name: 'ALLIMIN', personalPhone: '0197931994 / 0183374480', category: 'PHC HTAR' },
  { id: 'h8', name: 'AMIR', personalPhone: '0197064116', category: 'PHC HTAR' },
  { id: 'h9', name: 'AMIRUN', personalPhone: '0132214273', category: 'PHC HTAR' },
  { id: 'h10', name: 'AZRI', personalPhone: '0145328221', category: 'PHC HTAR' },
  { id: 'h11', name: 'AZWAN', personalPhone: '0172737381', category: 'PHC HTAR' },
  { id: 'h37', name: 'BALKIS', personalPhone: '0103609499', category: 'PHC HTAR' },
  { id: 'h12', name: 'CALEMENT', personalPhone: '0138675395', category: 'PHC HTAR' },
  { id: 'h41', name: 'DANIAL', personalPhone: '0167687238', category: 'PHC HTAR' },
  { id: 'h13', name: 'ERNA', personalPhone: '0143958647', category: 'PHC HTAR' },
  { id: 'h14', name: 'FAKRURUZEE', personalPhone: '0199962284', category: 'PHC HTAR' },
  { id: 'h15', name: 'FLORINA', personalPhone: '0195832878', category: 'PHC HTAR' },
  { id: 'h16', name: 'HAAZIM', personalPhone: '01110203938', category: 'PHC HTAR' },
  { id: 'h17', name: 'HADI', personalPhone: '01111414718', category: 'PHC HTAR' },
  { id: 'h18', name: 'HAFIZUDIN', personalPhone: '0139404065', category: 'PHC HTAR' },
  { id: 'h42', name: 'HAFIZZAT', personalPhone: '0185760902', category: 'PHC HTAR' },
  { id: 'h19', name: 'HAMID', personalPhone: '0145327239', category: 'PHC HTAR' },
  { id: 'h20', name: 'HAZIQ', personalPhone: '0174344688', category: 'PHC HTAR' },
  { id: 'h21', name: 'HUZAIMEE', personalPhone: '01117645031', category: 'PHC HTAR' },
  { id: 'h22', name: 'IMRAN', personalPhone: '0129594215', category: 'PHC HTAR' },
  { id: 'h23', name: 'KAMARUL', personalPhone: '0145356522', category: 'PHC HTAR' },
  { id: 'h24', name: 'MEDILITA', personalPhone: '0145506096', category: 'PHC HTAR' },
  { id: 'h25', name: 'MUHAIMIN', personalPhone: '0199157211', category: 'PHC HTAR' },
  { id: 'h26', name: 'NABIL', personalPhone: '0132586709', category: 'PHC HTAR' },
  { id: 'h38', name: 'NAWICH', personalPhone: '0128436856', category: 'PHC HTAR' },
  { id: 'h27', name: 'NAZMI', personalPhone: '0137387823', category: 'PHC HTAR' },
  { id: 'h28', name: 'NELSON', personalPhone: '0145606563', category: 'PHC HTAR' },
  { id: 'h29', name: 'NORHISHAM', personalPhone: '0199277009', category: 'PHC HTAR' },
  { id: 'h30', name: 'PATLOB', personalPhone: '01125205737', category: 'PHC HTAR' },
  { id: 'h31', name: 'SHAFIQ (HTAR)', personalPhone: '0199477037', category: 'PHC HTAR' },
  { id: 'h39', name: 'STONE', personalPhone: '0135546764', category: 'PHC HTAR' },
  { id: 'h32', name: 'SYAFIQ (HTAR)', personalPhone: '0198328266', category: 'PHC HTAR' },
  { id: 'h33', name: 'SYAHRUL IKRAM', personalPhone: '01139829202', category: 'PHC HTAR' },
  { id: 'h40', name: 'SYAZWANI', personalPhone: '01114356298', category: 'PHC HTAR' },
  { id: 'h34', name: 'WAN MOHD RIDZUAN', personalPhone: '0183920125', category: 'PHC HTAR' },
  { id: 'h35', name: 'ZAFIR', personalPhone: '0146646277', category: 'PHC HTAR' },
  { id: 'h36', name: 'ZULHAKIMI', personalPhone: '0145102058', category: 'PHC HTAR' },
  
  // KK KAPAR
  { id: 'k1', name: 'IZWAN', personalPhone: '0134514775', category: 'KK KAPAR' },
  { id: 'k2', name: 'FAZI', personalPhone: '0199505634', category: 'KK KAPAR' },
  { id: 'k3', name: 'SHAFIQ (KAPAR)', personalPhone: '0166549939', category: 'KK KAPAR' },
  { id: 'k4', name: 'ZAHIR', personalPhone: '0145182583', category: 'KK KAPAR' },
  { id: 'k5', name: 'WAFI', personalPhone: '0105737303', category: 'KK KAPAR' },

  // KK MERU
  { id: 'm1', name: 'LUQMAN', personalPhone: '0173895692', category: 'KK MERU' },
  { id: 'm2', name: 'NIZAM', personalPhone: '0176391567', category: 'KK MERU' },
  { id: 'm3', name: 'SYAFIQ ROSLAN', personalPhone: '01135258253', category: 'KK MERU' },
  { id: 'm4', name: 'SYAFIQ ABDOL', personalPhone: '0135174002', category: 'KK MERU' },
  { id: 'm5', name: 'LIZA', personalPhone: '0123390671', category: 'KK MERU' },

  // KK P.INDAH
  { id: 'pi1', name: 'SULAIMAN', personalPhone: '0136283282', category: 'KK P.INDAH' },
  { id: 'pi2', name: 'MUSTAKIM', personalPhone: '0195779107', category: 'KK P.INDAH' },
  { id: 'pi3', name: 'NAIM', personalPhone: '0137740846', category: 'KK P.INDAH' },

  // ST JOHN
  { id: 'sj1', name: 'HARIRI', personalPhone: '0179704014', category: 'ST JOHN' },
];

export const STJOHN_RESPONDERS = [
  'AFIQ',
  'ASYRAF',
  'AZIM',
  'FAIZZAT',
  'HARIRI',
  'HAZIQ',
  'LEE',
  'LOGAN HARIRI',
  'SHAM',
  'STEEL',
  'YONG',
  'ZALI'
];

export const AMBULANCE_TEAMS: AmbulanceTeam[] = [
  { id: 'htar1', name: 'HTAR_1_Sel_H', tmPhone: '01162621438', defaultStatus: true, category: 'PHC HTAR' },
  { id: 'htar2', name: 'HTAR_2_Sel_H', tmPhone: '01162621432', defaultStatus: true, category: 'PHC HTAR' },
  { id: 'htar3', name: 'HTAR_3_Sel_H', tmPhone: '01162621451', defaultStatus: true, category: 'PHC HTAR' },
  { id: 'htar4', name: 'HTAR_4_Sel_H', tmPhone: '01162619400', defaultStatus: true, category: 'PHC HTAR' },
  { id: 'pulauindah1', name: 'Pulau indah_1_Sel_KK', tmPhone: '01162616949', defaultStatus: true, category: 'KK P.INDAH' },
  { id: 'kkkapar1', name: 'KK_Kapar_1_Sel_KK', tmPhone: '01162619655', defaultStatus: true, category: 'KK KAPAR' },
  { id: 'meru1', name: 'Meru_1_Sel_KK', tmPhone: '01162620457', defaultStatus: true, category: 'KK MERU' },
  { id: 'stjohn4', name: 'St. John_4_Sel_KK', tmPhone: '01162619488', defaultStatus: true, category: 'ST JOHN' },
  { id: 'anika1', name: 'Anika_1_Sel_KK', tmPhone: '01162619500', defaultStatus: false, category: 'KK ANIKA' },
  { id: 'botanik1', name: 'Botanik_1_Sel_KK', tmPhone: '01162619511', defaultStatus: false, category: 'KK BOTANIK' },
  { id: 'bukitkuda1', name: 'Bukit Kuda_1_Sel_H', tmPhone: '---', defaultStatus: false, category: 'KK BUKIT KUDA' },
  { id: 'bukitnaga1', name: 'Bukit Naga_1_Sel_H', tmPhone: '---', defaultStatus: false, category: 'KK BUKIT NAGA' },
  { id: 'pandamaran1', name: 'Pandamaran _1_Sel_KK', tmPhone: '01162621865', defaultStatus: false, category: 'KK PANDAMARAN' },
  { id: 'portklang1', name: 'Port klang_1_Sel_KK', tmPhone: '01162616944', defaultStatus: false, category: 'KK PORT KLANG' },
  { id: 'rantaupanjang1', name: 'Rantau Panjang_1_Sel_KK', tmPhone: '01162616971', defaultStatus: false, category: 'KK RANTAU PANJANG' },
];

export const SHIFT_DETAILS: Record<Shift, { label: string; time: string; badge: string }> = {
  AM: { label: 'AM (Pagi)', time: '0700-1400', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
  PM: { label: 'PM (Petang)', time: '1400-2100', badge: 'bg-sky-100 text-sky-900 border-sky-300' },
  ON: { label: 'ON (Malam)', time: '2100-0700', badge: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
};

export const AVAILABLE_CATEGORIES = [
  'PHC HTAR',
  'KK KAPAR',
  'KK MERU',
  'KK P.INDAH',
  'KK ANIKA',
  'KK BOTANIK',
  'KK BUKIT KUDA',
  'KK BUKIT NAGA',
  'KK PANDAMARAN',
  'KK PORT KLANG',
  'KK RANTAU PANJANG',
  'ST JOHN',
  'PKD BANTING',
  'BANTING',
  'SHAH ALAM',
  'HASA',
  'LAIN-LAIN'
];

// MECC AMBULANCE STATUS TEAMS LIST as requested by user
export const DEFAULT_MECC_TEAMS: MeccTeam[] = [
  // PKD BANTING
  { id: 'mecc_kk_tpg', name: 'KK Telok Panglima Garang', category: 'PKD BANTING', defaultStatus: 'SIAP_SEDIA', phone: '03-31227333' },
  { id: 'mecc_kk_jenjarom', name: 'KK Jenjarom', category: 'PKD BANTING', defaultStatus: 'SIAP_SEDIA', phone: '03-31913333' },
  { id: 'mecc_kk_bandar', name: 'KK Bandar', category: 'PKD BANTING', defaultStatus: 'SIAP_SEDIA', phone: '03-31201234' },
  { id: 'mecc_kk_changgang', name: 'KK Bukit Changgang', category: 'PKD BANTING', defaultStatus: 'SIAP_SEDIA', phone: '03-31491234' },
  { id: 'mecc_kk_tgsepat', name: 'KK Tg Sepat', category: 'PKD BANTING', defaultStatus: 'SIAP_SEDIA', phone: '03-31974234' },

  // BANTING
  { id: 'mecc_banting_1', name: 'Banting 1', category: 'BANTING', defaultStatus: 'SIAP_SEDIA', phone: '03-31871333' },
  { id: 'mecc_banting_2', name: 'Banting 2', category: 'BANTING', defaultStatus: 'SIAP_SEDIA', phone: '03-31871334' },

  // SHAH ALAM
  { id: 'mecc_sa_1', name: 'SA 1', category: 'SHAH ALAM', defaultStatus: 'SIAP_SEDIA', phone: '03-55263000' },
  { id: 'mecc_sa_2', name: 'SA 2', category: 'SHAH ALAM', defaultStatus: 'SIAP_SEDIA', phone: '03-55263001' },

  // HASA
  { id: 'mecc_hasa_1', name: 'HASA 1', category: 'HASA', defaultStatus: 'SIAP_SEDIA', phone: '03-55442000' },
];

export const MECC_CATEGORIES = [
  'PKD BANTING',
  'BANTING',
  'SHAH ALAM',
  'HASA'
];

export const MECC_STATUS_CONFIG: Record<MeccStatusType, { label: string; shortLabel: string; bg: string; text: string; border: string; dot: string; icon: string }> = {
  SIAP_SEDIA: {
    label: 'Siap Sedia (Beroperasi)',
    shortLabel: 'SIAP SEDIA',
    bg: 'bg-emerald-500/10 text-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
    icon: 'CheckCircle2'
  },
  ON_CALL: {
    label: 'On Call (Kes)',
    shortLabel: 'ON CALL',
    bg: 'bg-amber-500/10 text-amber-800',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    icon: 'Clock'
  },
  ROSAK: {
    label: 'Rosak / Penyelenggaraan',
    shortLabel: 'ROSAK',
    bg: 'bg-rose-500/10 text-rose-700',
    text: 'text-rose-700',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
    icon: 'XCircle'
  },
  TIADA_STAFF: {
    label: 'Tiada Pemandu / Anggota',
    shortLabel: 'TIADA STAFF',
    bg: 'bg-orange-500/10 text-orange-800',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
    icon: 'User'
  },
  OFF: {
    label: 'Tidak Beroperasi / Off',
    shortLabel: 'OFF',
    bg: 'bg-slate-500/10 text-slate-700',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    icon: 'ShieldCheck'
  }
};

// DEFAULT ONCALL CLINICS FOR SHIFT ROLLCALL
export const DEFAULT_ONCALL_CLINICS: OncallClinic[] = [
  // PKD KLANG (Zon HTAR)
  { id: 'rc_kk_pulauindah', name: 'KK Pulau Indah', region: 'PKD KLANG', whatsappPhone: '01162616949', linkedPozTeamId: 'pulauindah1' },
  { id: 'rc_kk_kapar', name: 'KK Kapar', region: 'PKD KLANG', whatsappPhone: '01162619655', linkedPozTeamId: 'kkkapar1' },
  { id: 'rc_kk_meru', name: 'KK Meru', region: 'PKD KLANG', whatsappPhone: '01162620457', linkedPozTeamId: 'meru1' },
  { id: 'rc_kk_anika', name: 'KK Anika', region: 'PKD KLANG', whatsappPhone: '01162619500', linkedPozTeamId: 'anika1' },
  { id: 'rc_kk_botanik', name: 'KK Botanik', region: 'PKD KLANG', whatsappPhone: '01162619511', linkedPozTeamId: 'botanik1' },
  { id: 'rc_kk_pandamaran', name: 'KK Pandamaran', region: 'PKD KLANG', whatsappPhone: '01162621865', linkedPozTeamId: 'pandamaran1' },
  { id: 'rc_kk_portklang', name: 'KK Port Klang', region: 'PKD KLANG', whatsappPhone: '01162616944', linkedPozTeamId: 'portklang1' },
  { id: 'rc_kk_rantaupanjang', name: 'KK Rantau Panjang', region: 'PKD KLANG', whatsappPhone: '01162616971', linkedPozTeamId: 'rantaupanjang1' },
  { id: 'rc_kk_bukitkuda', name: 'KK Bukit Kuda', region: 'PKD KLANG', whatsappPhone: '', linkedPozTeamId: 'bukitkuda1' },
  { id: 'rc_kk_bukitnaga', name: 'KK Bukit Naga', region: 'PKD KLANG', whatsappPhone: '', linkedPozTeamId: 'bukitnaga1' },

  // PKD BANTING (Zon Kuala Langat)
  { id: 'rc_kk_tpg', name: 'KK Telok Panglima Garang', region: 'PKD BANTING', whatsappPhone: '', linkedMeccTeamId: 'mecc_kk_tpg' },
  { id: 'rc_kk_jenjarom', name: 'KK Jenjarom', region: 'PKD BANTING', whatsappPhone: '', linkedMeccTeamId: 'mecc_kk_jenjarom' },
  { id: 'rc_kk_bandar', name: 'KK Bandar', region: 'PKD BANTING', whatsappPhone: '', linkedMeccTeamId: 'mecc_kk_bandar' },
  { id: 'rc_kk_changgang', name: 'KK Bukit Changgang', region: 'PKD BANTING', whatsappPhone: '', linkedMeccTeamId: 'mecc_kk_changgang' },
  { id: 'rc_kk_tgsepat', name: 'KK Tg Sepat', region: 'PKD BANTING', whatsappPhone: '', linkedMeccTeamId: 'mecc_kk_tgsepat' },
];

export const DEFAULT_ROLLCALL_MESSAGE = `SALAM \n\nSELAMAT PAGI.. \n\nDari MECC HTAR\n\nONCALL siapa ya hari ini ?\n\n status ambulan ?\n\nMinta reply dan maklumkan .. terima kasih ..`;

export const DEFAULT_QUICK_REPLY_MESSAGE = `THANK YOU ...name ..& SELAMAT BERTUGAS`;

export const CLINIC_ROLLCALL_STATUS_CONFIG: Record<ClinicRollcallStatus, {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  PENDING: {
    label: 'Belum Rollcall',
    shortLabel: 'BELUM ROLLCALL',
    bg: 'bg-slate-100 text-slate-600',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  ROLLCALL_SENT: {
    label: 'Rollcall Dihantar (Menunggu Reply)',
    shortLabel: 'ROLLCALL SENT',
    bg: 'bg-sky-50 text-sky-800',
    text: 'text-sky-800',
    border: 'border-sky-300',
    dot: 'bg-sky-500',
  },
  ACTIVE: {
    label: 'Active (Manually Activated by MECC)',
    shortLabel: 'ACTIVE',
    bg: 'bg-emerald-50 text-emerald-800',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  STANDBY: {
    label: 'Standby (Manually Activated by MECC)',
    shortLabel: 'STANDBY',
    bg: 'bg-amber-50 text-amber-800',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  OFF: {
    label: 'Tidak Beroperasi / Rosak',
    shortLabel: 'TIDAK AKTIF',
    bg: 'bg-rose-50 text-rose-700',
    text: 'text-rose-700',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
  },
};

export const HTAR_PRIMARY_TEAMS: { id: string; shortName: string; fullName: string }[] = [
  { id: 'htar1', shortName: 'HTAR 1', fullName: 'HTAR_1_Sel_H' },
  { id: 'htar2', shortName: 'HTAR 2', fullName: 'HTAR_2_Sel_H' },
  { id: 'htar3', shortName: 'HTAR 3', fullName: 'HTAR_3_Sel_H' },
  { id: 'htar4', shortName: 'HTAR 4', fullName: 'HTAR_4_Sel_H' },
];

export const CASE_TRIAGE_OPTIONS: CaseTriageType[] = [
  'PENDING',
  'RZ',
  'YZ',
  'GZ',
  'WT',
  'PAC',
  'PEOBS',
  'CARSS',
  'SD',
  'DAMA',
  'OTHER',
];

export const CASE_TRIAGE_CONFIG: Record<CaseTriageType, {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  PENDING: {
    label: 'Belum Triage',
    shortLabel: 'BELUM TRIAGE',
    bg: 'bg-slate-100 text-slate-600',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  RZ: {
    label: 'RZ (Red Zone)',
    shortLabel: 'RZ',
    bg: 'bg-rose-100 text-rose-800',
    text: 'text-rose-800',
    border: 'border-rose-300',
    dot: 'bg-rose-600',
  },
  YZ: {
    label: 'YZ (Yellow Zone)',
    shortLabel: 'YZ',
    bg: 'bg-amber-100 text-amber-900',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  GZ: {
    label: 'GZ (Green Zone)',
    shortLabel: 'GZ',
    bg: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  WT: {
    label: 'WT',
    shortLabel: 'WT',
    bg: 'bg-cyan-100 text-cyan-800',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    dot: 'bg-cyan-500',
  },
  PAC: {
    label: 'PAC',
    shortLabel: 'PAC',
    bg: 'bg-fuchsia-100 text-fuchsia-800',
    text: 'text-fuchsia-800',
    border: 'border-fuchsia-300',
    dot: 'bg-fuchsia-500',
  },
  PEOBS: {
    label: 'PEOBS',
    shortLabel: 'PEOBS',
    bg: 'bg-pink-100 text-pink-800',
    text: 'text-pink-800',
    border: 'border-pink-300',
    dot: 'bg-pink-500',
  },
  CARSS: {
    label: 'CARSS',
    shortLabel: 'CARSS',
    bg: 'bg-indigo-100 text-indigo-800',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    dot: 'bg-indigo-600',
  },
  SD: {
    label: 'SD (Stand Down)',
    shortLabel: 'SD',
    bg: 'bg-slate-200 text-slate-800',
    text: 'text-slate-800',
    border: 'border-slate-400',
    dot: 'bg-slate-600',
  },
  DAMA: {
    label: 'DAMA',
    shortLabel: 'DAMA',
    bg: 'bg-orange-100 text-orange-800',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
  },
  OTHER: {
    label: 'Lain-lain (Key-in Manual)',
    shortLabel: 'LAIN-LAIN',
    bg: 'bg-violet-100 text-violet-800',
    text: 'text-violet-800',
    border: 'border-violet-300',
    dot: 'bg-violet-500',
  },
};
