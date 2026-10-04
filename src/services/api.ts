import { Preferences } from '@capacitor/preferences';

// Production Render API & Supabase backend (or custom local override)
export const DEFAULT_API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'https://mediarca-mdwk.onrender.com/api';

let currentApiUrl = DEFAULT_API_URL;

export const setApiUrl = (url: string) => {
  currentApiUrl = url.replace(/\/+$/, '');
};

export const getApiUrl = () => currentApiUrl;

export const getBackendBaseUrl = (): string => {
  return currentApiUrl.replace(/\/api\/?$/, '');
};

// Safe file URL resolver (supports Cloudflare R2, absolute URLs, or backend server relative paths)
export const getFileUrl = (filePath?: string): string => {
  if (!filePath) return '';
  if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  if (filePath.startsWith('r2://')) {
    const clean = filePath.replace(/^r2:\/\//, '');
    const r2PublicUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_R2_PUBLIC_URL) ||
      'https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev';
    return `${r2PublicUrl}/${clean}`;
  }
  const backendBase = getBackendBaseUrl();
  return `${backendBase}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

// Mobile Preference storage for Auth Token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { value } = await Preferences.get({ key: 'mediarca_token' });
    if (value) return value;
  } catch (e) {
    // fallback
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('mediarca_token');
  }
  return null;
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await Preferences.set({ key: 'mediarca_token', value: token });
  } catch (e) {}
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('mediarca_token', token);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: 'mediarca_token' });
  } catch (e) {}
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('mediarca_token');
  }
};

// --------------------------------------------------------------------------
// TYPES & INTERFACES (Full Parity with Web Platform)
// --------------------------------------------------------------------------

export interface DoctorSlot {
  id: string;
  name: string;
  startTime: string; // "09:00"
  endTime: string;   // "11:00"
  maxPatients: number;
  avgConsultationMinutes?: number;
  days?: string[];
}

export interface SlotStatusResult {
  slot: DoctorSlot;
  isToday: boolean;
  isPassed: boolean;
  isInProgress: boolean;
  isUpcoming: boolean;
  isFull: boolean;
  totalBooked: number;
  patientsAhead: number;
  estimatedTime: string;
  statusLabel: string;
}

export interface DoctorClinicSchedule {
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  consultationFee: number;
  daysOfWeek: number[]; // 0=Sun, 1=Mon...
  slots: DoctorSlot[];
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  clinicAddress?: string;
  isVerified?: boolean;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED' | string;
  checkingStartTime?: string;
  checkingEndTime?: string;
  avgConsultationMinutes?: number;
  maxDailyPatients?: number;
  rating?: number;
  totalReviews?: number;
  cabinStatus?: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN' | string;
  steppedOutUntil?: string | null;
  expectedReturnTime?: string | null;
  cabinStatusUpdatedAt?: string | null;
  schedules?: DoctorClinicSchedule[];
  slots?: DoctorSlot[];
  clinics?: Array<{
    id?: string;
    clinicId: string;
    clinic?: ClinicProfile;
    consultationFee?: number;
    slots?: DoctorSlot[];
  }>;
  user?: {
    id?: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  };
}

export interface PublicClinicDoctor {
  id: string;
  clinicId: string;
  doctorId: string;
  status: string;
  consultationFee?: number | null;
  slots?: DoctorSlot[] | string | null;
  doctor: Doctor;
}

export interface ClinicProfile {
  id: string;
  userId?: string;
  clinicName: string;
  name?: string;
  address: string;
  city?: string;
  state?: string;
  phone?: string;
  checkinCode?: string | null;
  isVerified?: boolean;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED' | string;
  createdAt?: string;
  _count?: {
    doctors?: number;
  };
  doctors?: PublicClinicDoctor[];
}

export interface ReceptionistProfile {
  id: string;
  phone?: string;
}

export interface ClinicReceptionistItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  doctorIds: string[];
  doctors: Array<{
    id: string;
    fullName: string;
    specialty: string;
  }>;
  createdAt: string;
}

export interface ClinicDoctorStat {
  affiliationId: string;
  doctorId: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  bookingCount: number;
  completedCount: number;
  revenue: number;
  status: string;
  joinedAt: string;
}

export interface ClinicAppointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorId: string;
  date: string;
  queueNumber: number;
  checkingWindow: string;
  estimatedTime: string;
  status: string;
  fee: number;
}

export interface ClinicDashboardData {
  clinic: ClinicProfile;
  doctors: ClinicDoctorStat[];
  incomingRequests?: Array<ClinicDoctorStat & { requestedAt?: string }>;
  outgoingRequests?: Array<ClinicDoctorStat & { requestedAt?: string }>;
  receptionists?: ClinicReceptionistItem[];
  incomingReceptionists?: Array<{
    id: string;
    userId: string;
    fullName: string;
    email: string;
    phone?: string;
    status: string;
    createdAt: string;
  }>;
  totalDoctors: number;
  totalBookings: number;
  totalRevenue: number;
  recentAppointments: ClinicAppointment[];
}

export interface ReceptionistLinkedDoctor {
  affiliationId: string;
  doctorId: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialty: string;
  clinicAddress?: string;
  consultationFee: number;
  slots: DoctorSlot[];
  clinics?: Array<{
    id: string;
    clinicId: string;
    clinic: ClinicProfile;
  }>;
  todayTotalBookings: number;
  todayWaitingPatients: number;
  joinedAt: string;
  cabinStatus?: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN' | string;
  expectedReturnTime?: string | null;
  cabinStatusUpdatedAt?: string | null;
}

export interface ReceptionistDashboardData {
  receptionist: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    clinicId?: string;
  };
  clinic?: ClinicProfile | null;
  doctors: ReceptionistLinkedDoctor[];
}

export interface ReceptionistQueueItem {
  id: string;
  queueNumber: number;
  patientName: string;
  patientPhone: string;
  gender?: string;
  bloodGroup?: string;
  checkingWindow: string;
  estimatedTime: string;
  slotId?: string;
  status: string;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
  reasonForVisit?: string;
  symptoms?: string;
  isForOther?: boolean;
  patientAge?: string;
  appointmentDate?: string;
  createdAt: string;
}

export interface DoctorAffiliationClinic {
  affiliationId: string;
  clinicId: string;
  clinicName: string;
  address: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  bookingCount?: number;
  revenue?: number;
  consultationFee?: number;
  workingDays?: string[];
  daysOfWeek?: number[];
  slots?: DoctorSlot[];
  status: string;
  requestedBy?: string;
  joinedAt?: string;
  requestedAt?: string;
}

export interface DoctorAffiliationsData {
  clinics: DoctorAffiliationClinic[];
  incomingRequests?: DoctorAffiliationClinic[];
  outgoingRequests?: DoctorAffiliationClinic[];
  rejectedRequests?: DoctorAffiliationClinic[];
  receptionists: Array<{
    affiliationId: string;
    receptionistId: string;
    fullName: string;
    email: string;
    phone?: string;
    clinicId?: string;
    clinicName?: string;
    status: string;
    joinedAt: string;
  }>;
}

export interface ContactMessageItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'RESOLVED' | string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  clinicAddress?: string;
  isVerified: boolean;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED' | string;
  checkingStartTime: string;
  checkingEndTime: string;
  avgConsultationMinutes: number;
  maxDailyPatients: number;
  rating: number;
  totalReviews: number;
  slots?: DoctorSlot[];
  cabinStatus?: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN' | string;
  steppedOutUntil?: string | null;
  expectedReturnTime?: string | null;
  cabinStatusUpdatedAt?: string | null;
  clinics?: Array<{
    id: string;
    clinicId: string;
    clinic: ClinicProfile;
    consultationFee?: number;
    slots?: DoctorSlot[];
    receptionists?: Array<{
      id: string;
      name: string;
      phone?: string;
    }>;
  }>;
  receptionists?: Array<{
    id: string;
    name: string;
    phone?: string;
    clinicId?: string;
    clinicName?: string;
  }>;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  };
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string;
    patientUser: { fullName: string; avatarUrl?: string };
    createdAt: string;
  }>;
}

export interface QueuePreview {
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  selectedSlotId?: string;
  selectedSlot?: SlotStatusResult;
  availableSlots?: SlotStatusResult[];
  checkingWindow: string;
  checkingStartTime: string;
  checkingEndTime: string;
  avgConsultationMinutes: number;
  maxDailyPatients: number;
  totalBooked: number;
  nextQueueNumber: number;
  patientsAhead: number;
  estimatedTime: string;
  isFull: boolean;
  isPassed?: boolean;
  isInProgress?: boolean;
  statusLabel?: string;
  consultationFee?: number;
  clinicId?: string | null;
  clinicName?: string | null;
  selectedClinic?: {
    clinicId: string;
    clinicName: string;
    address: string;
    city?: string;
    phone?: string;
    consultationFee?: number;
  } | null;
  hasClinics?: boolean;
  clinicsCount?: number;
  clinics?: Array<{
    clinicId: string;
    clinicName: string;
    address: string;
    city?: string;
    phone?: string;
    consultationFee?: number;
    slots?: DoctorSlot[];
  }>;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  clinicId?: string;
  clinic?: ClinicProfile;
  appointmentDate: string;
  date?: string; // mobile compatibility alias
  queueNumber: number;
  estimatedQueueNumber?: number;
  slotId?: string;
  slotName?: string;
  checkingWindow: string;
  status: 'PENDING' | 'PENDING_APPROVAL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED' | (string & {});
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | string;
  approvedBy?: string;
  approvedAt?: string;
  isPendingApproval?: boolean;
  clinicPhone?: string;
  receptionistPhone?: string | null;
  receptionistName?: string | null;
  fee?: number;
  reasonForVisit?: string;
  symptoms?: string;
  vitals?: any;
  clinicalNotes?: string;
  consultationNotes?: string;
  isForOther?: boolean;
  patientName?: string;
  patientPhone?: string;
  patientAge?: string | number;
  patientGender?: string;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  doctor?: Doctor;
  patient?: {
    id: string;
    userId: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    allergies?: string;
    existingConditions?: string;
    currentMedications?: string;
    emergencyContact?: string;
    user: { fullName: string; email: string; phone?: string; avatarUrl?: string };
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
  };
  liveQueue?: {
    currentServingQueueNumber: number;
    patientsAway: number;
    estimatedWaitMinutes: number;
    isYourTurn: boolean;
    isShiftActive?: boolean;
    isShiftPassed?: boolean;
    liveEstimatedTime?: string;
    estimatedQueueNumber?: number;
  };
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'QUEUE' | 'CLINICAL' | 'SYSTEM' | string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'CLINIC' | 'RECEPTIONIST';
  avatarUrl?: string;
  isEmailVerified?: boolean;
  mustChangePassword?: boolean;
  patientProfile?: {
    id?: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    allergies?: string;
    existingConditions?: string;
    currentMedications?: string;
    emergencyContact?: string;
  };
  doctorProfile?: DoctorProfile;
  clinicProfile?: ClinicProfile;
  receptionistProfile?: ReceptionistProfile;
}

export interface QueuePreviewResult {
  nextQueueNumber: number;
  estimatedTime: string;
  patientsAhead: number;
  avgMinutesPerPatient?: number;
  slotDetails?: DoctorSlot;
  [key: string]: any;
}

// --------------------------------------------------------------------------
// TIME & SLOT CALCULATION HELPERS
// --------------------------------------------------------------------------

export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/\s*(AM|PM)/i, '').trim();
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  if (timeStr.toUpperCase().includes('PM') && h < 12) h += 12;
  if (timeStr.toUpperCase().includes('AM') && h === 12) h = 0;
  return h * 60 + m;
};

export const minutesTo12Hour = (totalMinutes: number): string => {
  const normalized = ((Math.floor(totalMinutes) % (24 * 60)) + (24 * 60)) % (24 * 60);
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const format12Hour = (time24: string): string => {
  if (!time24) return '09:00 AM';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  return minutesTo12Hour(timeToMinutes(time24));
};

export const calculateSlotMetrics = (
  startTime: string,
  endTime: string,
  maxPatients: number
): { durationMinutes: number; avgConsultationMinutes: number } => {
  const startMins = timeToMinutes(startTime);
  let endMins = timeToMinutes(endTime);
  if (endMins <= startMins) {
    endMins += 24 * 60;
  }
  const durationMinutes = Math.max(1, endMins - startMins);
  const safeMax = Math.max(1, maxPatients || 1);
  const rawAvg = durationMinutes / safeMax;
  const avgConsultationMinutes = Math.round(rawAvg * 10) / 10;
  return { durationMinutes, avgConsultationMinutes };
};

export const parseDoctorSlots = (doctor: any): DoctorSlot[] => {
  if (doctor?.slots) {
    try {
      const parsed = typeof doctor.slots === 'string' ? JSON.parse(doctor.slots) : doctor.slots;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: any, idx: number) => {
          const startTime = s.startTime || '09:00';
          const endTime = s.endTime || '11:00';
          const maxPatients = Number(s.maxPatients) || 50;
          const { avgConsultationMinutes } = calculateSlotMetrics(startTime, endTime, maxPatients);
          return {
            id: s.id || `slot_${idx + 1}`,
            name: s.name || `Slot ${idx + 1} (${format12Hour(startTime)} – ${format12Hour(endTime)})`,
            startTime,
            endTime,
            maxPatients,
            avgConsultationMinutes: s.avgConsultationMinutes || avgConsultationMinutes,
          };
        });
      }
    } catch (e) {
      console.warn('Failed to parse doctor slots:', e);
    }
  }

  const startTime = doctor?.checkingStartTime || '09:00';
  const endTime = doctor?.checkingEndTime || '13:00';
  const maxPatients = Number(doctor?.maxDailyPatients) || 25;
  const { avgConsultationMinutes } = calculateSlotMetrics(startTime, endTime, maxPatients);

  return [
    {
      id: 'slot_1',
      name: `Shift 1 (${format12Hour(startTime)} – ${format12Hour(endTime)})`,
      startTime,
      endTime,
      maxPatients,
      avgConsultationMinutes: doctor?.avgConsultationMinutes || avgConsultationMinutes,
    },
  ];
};

export const formatDoctorDegrees = (qualifications?: string | null): string => {
  if (!qualifications || !qualifications.trim()) return 'Certified Specialist';

  const RECOGNIZED_DEGREES_MAP: Record<string, string> = {
    MBBS: 'MBBS',
    MD: 'MD',
    MS: 'MS',
    DM: 'DM',
    MCH: 'MCh',
    BDS: 'BDS',
    MDS: 'MDS',
    DNB: 'DNB',
    BAMS: 'BAMS',
    BHMS: 'BHMS',
    BUMS: 'BUMS',
    BSMS: 'BSMS',
    BNYS: 'BNYS',
    BVSC: 'BVSc',
    BPT: 'BPT',
    MPT: 'MPT',
    BOT: 'BOT',
    MOT: 'MOT',
    DO: 'DO',
    PHD: 'PhD',
    MPH: 'MPH',
    MHA: 'MHA',
    DGO: 'DGO',
    DCH: 'DCH',
    DMRD: 'DMRD',
    DORTHO: 'DOrtho',
    DA: 'DA',
    DTCD: 'DTCD',
    DDVL: 'DDVL',
    DVD: 'DVD',
    DPM: 'DPM',
    DOMS: 'DOMS',
    DLO: 'DLO',
    MBCHB: 'MBChB',
    BMBS: 'BMBS',
    BCHIR: 'BChir',
    BMED: 'BMed',
    MRCGP: 'MRCGP',
  };

  const cleanedInput = qualifications.replace(/\([^)]*\)/g, ' ');
  const NON_DEGREE_PATTERN = /\b(f[a-z]{2,5}|fellow|fellowship|diplomate|member|board\s*certified|board\s*eligible|certified|specialist|consultant|physician|surgeon|general|university|college|school|hospital|institute|academy|faculty|campus|stanford|harvard|hopkins|oxford|cambridge|aiims|pgi|yale|columbia|boston|london)\b/i;

  const parts = cleanedInput.split(/[,;\n/]+/);
  const collectedDegrees: string[] = [];

  for (const part of parts) {
    const subSegments = part.split(/\s*[-–—]\s*/);
    for (const sub of subSegments) {
      const trimmed = sub.trim().replace(/\.+/g, '');
      if (!trimmed) continue;
      if (NON_DEGREE_PATTERN.test(trimmed)) continue;

      const upper = trimmed.toUpperCase();
      if (RECOGNIZED_DEGREES_MAP[upper]) {
        const canonical = RECOGNIZED_DEGREES_MAP[upper];
        if (!collectedDegrees.includes(canonical)) {
          collectedDegrees.push(canonical);
        }
      }
    }
  }

  if (collectedDegrees.length > 0) {
    return collectedDegrees.join(', ');
  }

  return 'Certified Specialist';
};

export const getLocalDateString = (d: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
  } catch {
    const istMs = d.getTime() + 330 * 60 * 1000;
    const istDate = new Date(istMs);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

export const getIndianTimeMinutes = (d: Date = new Date()): number => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(d);
    let hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return hour * 60 + minute;
  } catch {
    const utcMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
    return (utcMinutes + 330) % (24 * 60);
  }
};

export const getTomorrowDateString = (d: Date = new Date()): string => {
  const tomorrow = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  return getLocalDateString(tomorrow);
};

export const DEFAULT_PHONE_PREFIX = '+91 ';

export const ALL_SPECIALTIES: string[] = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Gynecology & Obstetrics',
  'Gastroenterology',
  'Oncology',
  'Ophthalmology',
  'ENT / Otorhinolaryngology',
  'Pulmonology',
  'Nephrology',
  'Urology',
  'Psychiatry',
  'Endocrinology',
  'Rheumatology',
  'Dentistry',
  'Physiotherapy',
  'General Surgery',
  'Plastic Surgery',
  'Neurosurgery',
  'Cardiothoracic Surgery',
  'Anesthesiology',
  'Radiology',
  'Pathology',
  'Emergency Medicine',
  'Hematology',
  'Allergy & Immunology',
  'Infectious Disease',
  'Ayurveda',
  'Homeopathy',
  'Dietetics & Nutrition',
  'Other',
];

export const evaluateSlotStatus = (
  slot: DoctorSlot,
  appointmentDate: string,
  bookedCountForSlot: number,
  now = new Date(),
  overrideCurrentMinutes?: number
): SlotStatusResult => {
  const todayStr = getLocalDateString(now);

  const isToday = appointmentDate === todayStr;
  const isPastDate = appointmentDate < todayStr;
  const currentMinutes =
    typeof overrideCurrentMinutes === 'number' && !isNaN(overrideCurrentMinutes)
      ? overrideCurrentMinutes
      : getIndianTimeMinutes(now);

  const slotStartMins = timeToMinutes(slot.startTime);
  let slotEndMins = timeToMinutes(slot.endTime);
  if (slotEndMins <= slotStartMins) {
    slotEndMins += 24 * 60;
  }

  const patientsAhead = bookedCountForSlot;
  let isPassed = false;
  let isInProgress = false;
  let isUpcoming = false;
  let statusLabel = 'Available';
  let estimatedTime = '';

  const isCapacityFull = bookedCountForSlot >= slot.maxPatients;
  const isFull = isCapacityFull;

  if (isPastDate) {
    isPassed = true;
    statusLabel = 'Date Expired';
    estimatedTime = 'Date Expired';
  } else if (isToday) {
    if (currentMinutes >= slotEndMins) {
      isPassed = true;
      statusLabel = 'Shift Ended for Today';
      estimatedTime = 'Shift Ended';
    } else if (currentMinutes >= slotStartMins && currentMinutes < slotEndMins) {
      isInProgress = true;
      statusLabel = isFull ? 'Fully Booked' : 'Active Now • In Progress';
      const offsetMins = patientsAhead * (slot.avgConsultationMinutes || 3.0);
      const estTotal = Math.max(slotStartMins + offsetMins, currentMinutes + offsetMins);
      estimatedTime = isFull ? 'Shift Full' : minutesTo12Hour(estTotal);
    } else {
      isUpcoming = true;
      statusLabel = isFull ? 'Fully Booked' : 'Upcoming Today';
      const offsetMins = patientsAhead * (slot.avgConsultationMinutes || 3.0);
      const estTotal = slotStartMins + offsetMins;
      estimatedTime = isFull ? 'Shift Full' : minutesTo12Hour(estTotal);
    }
  } else {
    isUpcoming = true;
    statusLabel = isFull ? 'Fully Booked' : 'Upcoming';
    const offsetMins = patientsAhead * (slot.avgConsultationMinutes || 3.0);
    const estTotal = slotStartMins + offsetMins;
    estimatedTime = isFull ? 'Shift Full' : minutesTo12Hour(estTotal);
  }

  return {
    slot,
    isToday,
    isPassed,
    isInProgress,
    isUpcoming,
    isFull,
    totalBooked: bookedCountForSlot,
    patientsAhead,
    estimatedTime,
    statusLabel,
  };
};



// --------------------------------------------------------------------------
// HTTP REQUEST HANDLER (Mobile Unified Response Wrapper)
// --------------------------------------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  email?: string;
  [key: string]: any;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();
  const isMultipart = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${currentApiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: json.message || json.error || `Request failed with code ${res.status}`,
        error: json.error,
        data: json,
        requiresVerification: json.requiresVerification,
        email: json.email,
      };
    }

    const payload = json.data !== undefined ? json.data : json;

    return {
      success: true,
      data: payload,
      message: json.message,
      token: json.token || payload?.token,
      user: json.user || payload?.user,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unable to connect to server. Check your network connection.',
    };
  }
}

// --------------------------------------------------------------------------
// COMPLETE API CLIENT (All 54 Web & Mobile Operations)
// --------------------------------------------------------------------------

export const api = {
  // 1. Auth & Profiles
  async register(body: any): Promise<ApiResponse<{ user?: User; token?: string }>> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async verifyEmailOtp(body: { email: string; otp: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async verifyOtp(email: string, otp: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.verifyEmailOtp({ email, otp });
  },

  async resendEmailOtp(email: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resendOtp(email: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.resendEmailOtp(email);
  },

  async login(emailOrBody: string | any, password?: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const body = typeof emailOrBody === 'string' ? { email: emailOrBody, password } : emailOrBody;
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async googleAuth(credential: string, role = 'PATIENT'): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, role }),
    });
  },

  async getMe(): Promise<ApiResponse<User>> {
    return apiRequest('/auth/me', { method: 'GET' });
  },

  async updateProfile(body: any): Promise<ApiResponse<User>> {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async updateUserProfile(body: any): Promise<ApiResponse<User>> {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async updateDoctorProfile(body: any): Promise<ApiResponse<User>> {
    return apiRequest('/doctors/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string; user: User }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiRequest<{ avatarUrl: string; user: User }>('/auth/avatar', {
      method: 'POST',
      body: formData,
    });
    if (res.success) return res;

    // Base64 fallback if multipart fails
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const updateRes = await this.updateProfile({ avatarUrl: dataUrl });
      return {
        success: updateRes.success,
        data: { avatarUrl: dataUrl, user: updateRes.data as User },
        message: updateRes.message,
      };
    } catch {
      return res;
    }
  },

  // 2. Doctors & Public Directory
  async getDoctors(params?: {
    search?: string;
    specialty?: string;
    minExp?: number;
    maxFee?: number;
    sortBy?: string;
    clinicOnly?: boolean;
    clinicId?: string;
    state?: string;
    city?: string;
  }): Promise<ApiResponse<Doctor[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.specialty && params.specialty !== 'All') query.append('specialty', params.specialty);
    if (params?.minExp) query.append('minExp', String(params.minExp));
    if (params?.maxFee) query.append('maxFee', String(params.maxFee));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.clinicOnly !== undefined) query.append('clinicOnly', String(params.clinicOnly));
    if (params?.clinicId) query.append('clinicId', params.clinicId);
    if (params?.state && params.state !== 'All') query.append('state', params.state);
    if (params?.city && params.city !== 'All') query.append('city', params.city);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest<Doctor[]>(`/doctors${qs}`, { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      return res;
    }
    return { success: false, data: [], message: res.message || 'Failed to fetch doctors' };
  },

  async getPublicDoctors(params?: {
    search?: string;
    specialty?: string;
    minExp?: number;
    maxFee?: number;
    sortBy?: string;
    clinicOnly?: boolean;
    clinicId?: string;
    state?: string;
    city?: string;
  }): Promise<ApiResponse<Doctor[]>> {
    return this.getDoctors(params);
  },

  async getDoctorById(id: string): Promise<ApiResponse<Doctor>> {
    return apiRequest<Doctor>(`/doctors/${id}`, { method: 'GET' });
  },

  async getDoctorReviews(doctorId: string): Promise<ApiResponse<{
    rating: number;
    totalReviews: number;
    reviews: Array<{
      id: string;
      rating: number;
      comment?: string;
      createdAt: string;
      patientUser: { fullName: string };
    }>;
  }>> {
    return apiRequest(`/doctors/${doctorId}/reviews`, { method: 'GET' });
  },

  async updateDoctorSchedule(body: any): Promise<ApiResponse<Doctor>> {
    return apiRequest('/doctors/schedule', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async updateDoctorCabinStatus(data: {
    status: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN';
    expectedReturnTime?: string | null;
    returnEstimateMinutes?: number | null;
    doctorId?: string;
  }): Promise<ApiResponse<{
    id: string;
    cabinStatus: string;
    expectedReturnTime: string | null;
    cabinStatusUpdatedAt: string | null;
  }>> {
    return apiRequest('/doctors/cabin-status', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateCabinStatus(status: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN', returnTimeMinutes?: number): Promise<ApiResponse<any>> {
    return this.updateDoctorCabinStatus({
      status,
      returnEstimateMinutes: returnTimeMinutes,
    });
  },

  // 3. Appointments & Live Queue
  async getQueuePreview(
    paramsOrDoctorId: string | { doctorId: string; clinicId?: string; slotId?: string; date?: string },
    appointmentDate?: string,
    slotId?: string,
    clinicId?: string
  ): Promise<ApiResponse<QueuePreview>> {
    let docId: string;
    let apptDate: string;
    let sId: string | undefined;
    let cId: string | undefined;

    if (typeof paramsOrDoctorId === 'object') {
      docId = paramsOrDoctorId.doctorId;
      apptDate = paramsOrDoctorId.date || getLocalDateString();
      sId = paramsOrDoctorId.slotId;
      cId = paramsOrDoctorId.clinicId;
    } else {
      docId = paramsOrDoctorId;
      apptDate = appointmentDate || getLocalDateString();
      sId = slotId;
      cId = clinicId;
    }

    const query = new URLSearchParams();
    query.append('doctorId', docId);
    query.append('appointmentDate', apptDate);
    if (sId) query.append('slotId', sId);
    if (cId) query.append('clinicId', cId);

    const res = await apiRequest<QueuePreview>(`/appointments/queue-preview?${query.toString()}`, {
      method: 'GET',
    });

    if (res.success && res.data) return res;

    // Calculate preview dynamically from real doctor data
    const docRes = await this.getDoctorById(docId);
    if (!docRes.success || !docRes.data) {
      return { success: false, message: docRes.message || 'Slot availability unavailable' };
    }
    const doctor = docRes.data;
    const matchedClinic = cId ? doctor.clinics?.find((c) => c.clinicId === cId) : doctor.clinics?.[0];
    const slots = matchedClinic?.slots && matchedClinic.slots.length > 0 ? matchedClinic.slots : parseDoctorSlots(doctor);
    const effectiveFee = matchedClinic?.consultationFee ?? doctor.consultationFee;
    const now = new Date();

    const availableSlots: SlotStatusResult[] = slots.map((slot) => {
      return evaluateSlotStatus(slot, apptDate, 0, now);
    });

    let chosen = availableSlots.find((s) => s.slot.id === sId);
    if (chosen && chosen.isPassed) {
      const alt = availableSlots.find((s) => !s.isPassed && !s.isFull);
      if (alt) chosen = alt;
    }
    if (!chosen) {
      chosen = availableSlots.find((s) => !s.isPassed && !s.isFull) || availableSlots[0];
    }

    if (!chosen) {
      return { success: false, message: 'No slots available for this doctor' };
    }

    const fallbackPreview: QueuePreview = {
      doctorId: doctor.id,
      doctorName: doctor?.user?.fullName || 'Doctor',
      appointmentDate: apptDate,
      selectedSlotId: chosen.slot.id,
      selectedSlot: chosen,
      availableSlots,
      checkingWindow: chosen.slot.name,
      checkingStartTime: chosen.slot.startTime,
      checkingEndTime: chosen.slot.endTime,
      avgConsultationMinutes: chosen.slot.avgConsultationMinutes || 3.0,
      maxDailyPatients: chosen.slot.maxPatients,
      totalBooked: chosen.totalBooked,
      nextQueueNumber: 1,
      patientsAhead: chosen.patientsAhead,
      estimatedTime: chosen.estimatedTime,
      isFull: chosen.isFull,
      isPassed: chosen.isPassed,
      isInProgress: chosen.isInProgress,
      statusLabel: chosen.statusLabel,
      consultationFee: effectiveFee,
      clinicId: matchedClinic?.clinicId,
      clinicName: matchedClinic?.clinic?.clinicName,
      selectedClinic: matchedClinic
        ? {
            clinicId: matchedClinic.clinicId,
            clinicName: matchedClinic.clinic?.clinicName || 'Clinic',
            address: matchedClinic.clinic?.address || '',
            city: matchedClinic.clinic?.city || '',
            phone: matchedClinic.clinic?.phone,
            consultationFee: effectiveFee,
          }
        : null,
      hasClinics: (doctor.clinics?.length || 0) > 0,
      clinicsCount: doctor.clinics?.length || 0,
      clinics: doctor.clinics?.map((c) => ({
        clinicId: c.clinicId,
        clinicName: c.clinic?.clinicName || 'Clinic',
        address: c.clinic?.address || '',
        city: c.clinic?.city || '',
        phone: c.clinic?.phone,
        consultationFee: c.consultationFee ?? doctor.consultationFee,
        slots: c.slots || parseDoctorSlots(doctor),
      })),
    };

    return { success: true, data: fallbackPreview };
  },

  async bookAppointment(body: {
    doctorId: string;
    appointmentDate?: string;
    date?: string;
    slotId?: string;
    reasonForVisit?: string;
    symptoms?: string;
    clinicId?: string;
    isForOther?: boolean;
    patientName?: string;
    patientAge?: any;
    patientGender?: string;
    patientPhone?: string;
  }): Promise<ApiResponse<Appointment>> {
    const payload = {
      ...body,
      appointmentDate: body.appointmentDate || body.date || getLocalDateString(),
    };
    return apiRequest('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPatientAppointments(): Promise<ApiResponse<Appointment[]>> {
    return apiRequest('/appointments/patient', { method: 'GET' });
  },

  async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    return apiRequest(`/appointments/${id}`, { method: 'GET' });
  },

  async cancelAppointment(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    return apiRequest(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async checkInWithQR(data: { clinicId: string; code: string; appointmentId?: string }): Promise<ApiResponse<any>> {
    return apiRequest('/appointments/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async checkIn(appointmentId?: string, checkinCode?: string): Promise<ApiResponse<any>> {
    return apiRequest('/appointments/check-in', {
      method: 'POST',
      body: JSON.stringify({ appointmentId, checkinCode }),
    });
  },

  async checkInAppointmentDirect(appointmentId: string, isCheckedIn?: boolean): Promise<ApiResponse<any>> {
    return apiRequest(`/appointments/${appointmentId}/check-in`, {
      method: 'PATCH',
      body: JSON.stringify(isCheckedIn !== undefined ? { isCheckedIn } : {}),
    });
  },

  async submitAppointmentReview(
    appointmentId: string,
    data: { rating: number; comment?: string }
  ): Promise<ApiResponse<any>> {
    return apiRequest(`/appointments/${appointmentId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 4. Doctor Queue & Consultation Desk
  async getDoctorQueue(
    date?: string,
    scopeOrSlotId?: 'date' | 'all-upcoming' | string
  ): Promise<ApiResponse<{
    date: string;
    scope?: string;
    totalQueue: number;
    activeInConsultation: Appointment | null;
    waitingQueue: Appointment[];
    completedQueue: Appointment[];
    allAppointments: Appointment[];
    upcomingSummary?: {
      tomorrowDate: string;
      tomorrowCount: number;
      totalUpcomingCount: number;
      futureCountFromSelectedDate: number;
      nextDateWithBookings: string | null;
    };
  }>> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (scopeOrSlotId) {
      if (scopeOrSlotId === 'date' || scopeOrSlotId === 'all-upcoming') {
        params.append('scope', scopeOrSlotId);
      } else {
        params.append('slotId', scopeOrSlotId);
      }
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/consultations/queue${qs}`, { method: 'GET' });
  },

  async callPatient(appointmentId: string): Promise<ApiResponse<Appointment>> {
    return apiRequest('/consultations/call-patient', {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    });
  },

  async updateNotes(body: {
    appointmentId: string;
    vitals?: any;
    clinicalNotes?: string;
    diagnosis?: string;
    medicines?: any[];
    advice?: string;
    followUpDate?: string;
  }): Promise<ApiResponse<Appointment>> {
    return apiRequest('/consultations/notes', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async saveConsultationNotes(body: {
    appointmentId: string;
    vitals?: any;
    clinicalNotes?: string;
    diagnosis?: string;
    medicines?: any[];
    advice?: string;
    followUpDate?: string;
  }): Promise<ApiResponse<Appointment>> {
    return this.updateNotes(body);
  },

  async completeConsultation(
    bodyOrId: string | {
      appointmentId: string;
      diagnosis?: string;
      advice?: string;
      followUpDate?: string;
      clinicalNotes?: string;
      vitals?: any;
      medicines?: any[];
    },
    notes?: string
  ): Promise<ApiResponse<{ appointment: Appointment }>> {
    const body = typeof bodyOrId === 'string'
      ? { appointmentId: bodyOrId, clinicalNotes: notes }
      : bodyOrId;
    return apiRequest('/consultations/complete', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async completePrescription(body: {
    appointmentId: string;
    diagnosis?: string;
    medicines?: any[];
    advice?: string;
    followUpDate?: string;
    clinicalNotes?: string;
    vitals?: any;
  }): Promise<ApiResponse<{ appointment: Appointment; prescription?: any }>> {
    return this.completeConsultation(body);
  },

  // Contact & Support
  async submitContactMessage(data: {
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 6. Clinic Operations & Staff Roster
  async getMyClinic(): Promise<ApiResponse<ClinicDashboardData>> {
    return apiRequest('/clinics/my-clinic', { method: 'GET' });
  },

  async updateClinicProfile(body: any): Promise<ApiResponse<any>> {
    const res = await apiRequest('/clinics/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (res.success) return res;
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ clinicProfile: body }),
    });
  },

  async addDoctorToClinic(data: { doctorEmail?: string; doctorId?: string }): Promise<ApiResponse<any>> {
    return apiRequest('/clinics/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeDoctorFromClinic(doctorId: string): Promise<ApiResponse<any>> {
    return apiRequest(`/clinics/doctors/${doctorId}`, {
      method: 'DELETE',
    });
  },

  async addClinicReceptionist(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    doctorIds?: string[];
    assignedDoctorIds?: string[];
  }): Promise<ApiResponse<any>> {
    return apiRequest('/clinics/receptionists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getClinicReceptionists(): Promise<ApiResponse<ClinicReceptionistItem[]>> {
    return apiRequest('/clinics/receptionists', { method: 'GET' });
  },

  async updateClinicReceptionistDoctors(receptionistId: string, doctorIds: string[]): Promise<ApiResponse<any>> {
    return apiRequest(`/clinics/receptionists/${receptionistId}/doctors`, {
      method: 'PUT',
      body: JSON.stringify({ doctorIds }),
    });
  },

  async removeClinicReceptionist(receptionistId: string): Promise<ApiResponse<any>> {
    return apiRequest(`/clinics/receptionists/${receptionistId}`, {
      method: 'DELETE',
    });
  },

  async getPublicClinics(params?: { search?: string; city?: string; state?: string }): Promise<ApiResponse<ClinicProfile[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.city && params.city !== 'All') query.append('city', params.city);
    if (params?.state && params.state !== 'All') query.append('state', params.state);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest<ClinicProfile[]>(`/clinics/public${qs}`, { method: 'GET' });
    if (res.success && Array.isArray(res.data)) {
      return res;
    }
    return { success: false, data: [], message: res.message || 'Failed to fetch clinics' };
  },

  async getPublicClinicById(id: string): Promise<ApiResponse<ClinicProfile>> {
    return apiRequest<ClinicProfile>(`/clinics/public/${id}`, { method: 'GET' });
  },

  // 7. Receptionist Portal & Walk-in Desk
  async getMyReceptionist(): Promise<ApiResponse<ReceptionistDashboardData>> {
    return apiRequest('/receptionists/my-receptionist', { method: 'GET' });
  },

  async addDoctorToReceptionist(data: { doctorEmail?: string; doctorId?: string }): Promise<ApiResponse<any>> {
    return apiRequest('/receptionists/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeDoctorFromReceptionist(doctorId: string): Promise<ApiResponse<any>> {
    return apiRequest(`/receptionists/doctors/${doctorId}`, {
      method: 'DELETE',
    });
  },

  async getReceptionistDoctorQueue(
    doctorId: string,
    date?: string
  ): Promise<ApiResponse<{
    doctor: {
      id: string;
      fullName: string;
      specialty: string;
      slots: DoctorSlot[];
      cabinStatus?: string;
      expectedReturnTime?: string | null;
      cabinStatusUpdatedAt?: string | null;
    };
    appointmentDate: string;
    totalPatients: number;
    waitingCount: number;
    inConsultationCount: number;
    completedCount: number;
    cancelledCount: number;
    appointments: ReceptionistQueueItem[];
  }>> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiRequest(`/receptionists/doctors/${doctorId}/queue${qs}`, { method: 'GET' });
  },

  async bookWalkinAppointment(data: {
    doctorId: string;
    patientName: string;
    patientPhone: string;
    gender?: string;
    patientAge?: any;
    isForOther?: boolean;
    appointmentDate?: string;
    slotId?: string;
    reasonForVisit?: string;
    symptoms?: string;
    clinicId?: string;
  }): Promise<ApiResponse<any>> {
    return apiRequest('/receptionists/book-walkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async bookWalkin(data: any): Promise<ApiResponse<any>> {
    return this.bookWalkinAppointment(data);
  },

  async updateAppointmentStatus(appointmentId: string, status: string): Promise<ApiResponse<any>> {
    return apiRequest(`/receptionists/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async rescheduleAppointment(appointmentId: string, data: { newDate: string; newSlotId?: string }): Promise<ApiResponse<any>> {
    return apiRequest(`/receptionists/appointments/${appointmentId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async changeReceptionistPassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    const res = await apiRequest<any>('/receptionists/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success && res.data?.token) {
      await setAuthToken(res.data.token);
    }
    return res;
  },

  // 8. Affiliations & Approvals
  async respondToDoctorAffiliation(affiliationId: string, action: 'ACCEPT' | 'REJECT'): Promise<ApiResponse<any>> {
    return apiRequest(`/clinic/affiliations/${affiliationId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    });
  },

  async getDoctorAffiliations(): Promise<ApiResponse<DoctorAffiliationsData>> {
    return apiRequest('/doctors/me/affiliations', { method: 'GET' });
  },

  async addDoctorClinic(data: { clinicId?: string; clinicEmail?: string }): Promise<ApiResponse<any>> {
    return apiRequest('/doctors/me/clinics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async respondToClinicAffiliation(affiliationId: string, action: 'ACCEPT' | 'REJECT'): Promise<ApiResponse<any>> {
    return apiRequest(`/doctors/me/affiliations/${affiliationId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    });
  },

  async removeDoctorClinic(clinicId: string): Promise<ApiResponse<any>> {
    return apiRequest(`/doctors/me/clinics/${clinicId}`, {
      method: 'DELETE',
    });
  },

  async addDoctorReceptionist(data: { receptionistEmail: string }): Promise<ApiResponse<any>> {
    return apiRequest('/doctors/me/receptionists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeDoctorReceptionist(receptionistId: string): Promise<ApiResponse<any>> {
    return apiRequest(`/doctors/me/receptionists/${receptionistId}`, {
      method: 'DELETE',
    });
  },

  async getPendingAppointments(): Promise<ApiResponse<Appointment[]>> {
    return apiRequest('/receptionists/pending-appointments', { method: 'GET' });
  },

  async approveAppointment(appointmentId: string): Promise<ApiResponse<any>> {
    return apiRequest(`/receptionists/appointments/${appointmentId}/approve`, {
      method: 'POST',
    });
  },

  async rejectAppointment(appointmentId: string, reason?: string): Promise<ApiResponse<any>> {
    return apiRequest(`/receptionists/appointments/${appointmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async applyReceptionist(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    clinicId: string;
  }): Promise<ApiResponse<any>> {
    return apiRequest('/receptionists/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async respondToReceptionistRequest(
    receptionistId: string,
    action: 'ACCEPT' | 'REJECT',
    doctorIds?: string[]
  ): Promise<ApiResponse<any>> {
    return apiRequest(`/clinic/receptionists/${receptionistId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ action, doctorIds }),
    });
  },

  // 9. Notifications
  async getNotifications(): Promise<ApiResponse<NotificationsResponse>> {
    return apiRequest('/notifications', { method: 'GET' });
  },

  async markNotificationRead(id: string): Promise<ApiResponse<any>> {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead(): Promise<ApiResponse<any>> {
    return apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  },
};
