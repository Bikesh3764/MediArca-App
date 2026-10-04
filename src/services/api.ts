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
  estimatedTime: string;
  status: 'PENDING_APPROVAL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
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
  role: 'PATIENT' | 'DOCTOR' | 'CLINIC' | 'RECEPTIONIST' | 'ADMIN';
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

export const DEMO_DOCTORS: Doctor[] = [
  {
    id: 'doc_sarah_01',
    userId: 'usr_sarah_02',
    specialty: 'Cardiology',
    qualifications: 'MD',
    experienceYears: 14,
    consultationFee: 800,
    bio: 'Specialist in preventive cardiology, hypertension, coronary artery disease, and heart failure management with over 14 years of clinical experience.',
    clinicAddress: 'City Heart & Vascular Institute, Suite 402, Bandra West, Mumbai, MH',
    isVerified: true,
    checkingStartTime: '09:00',
    checkingEndTime: '20:00',
    avgConsultationMinutes: 2.7,
    maxDailyPatients: 110,
    rating: 4.9,
    totalReviews: 128,
    cabinStatus: 'IN_CABIN',
    slots: [
      {
        id: 'slot_sarah_1',
        name: 'Morning Shift (09:00 AM – 11:00 AM)',
        startTime: '09:00',
        endTime: '11:00',
        maxPatients: 50,
        avgConsultationMinutes: 2.4,
      },
      {
        id: 'slot_sarah_2',
        name: 'Evening Shift (05:00 PM – 08:00 PM)',
        startTime: '17:00',
        endTime: '20:00',
        maxPatients: 60,
        avgConsultationMinutes: 3.0,
      },
    ],
    clinics: [
      {
        id: 'cd_sarah_1',
        clinicId: 'clinic_demo_1',
        clinic: {
          id: 'clinic_demo_1',
          clinicName: 'City Heart & Vascular Institute',
          address: 'Suite 402, Hill Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          phone: '+91 98200 12345',
          isVerified: true,
        },
      },
      {
        id: 'cd_sarah_2',
        clinicId: 'clinic_demo_2',
        clinic: {
          id: 'clinic_demo_2',
          clinicName: 'Mumbai Specialty Outpatient Clinic',
          address: 'Floor 3, Linking Road, Khar West',
          city: 'Mumbai',
          state: 'Maharashtra',
          phone: '+91 98200 54321',
          isVerified: true,
        },
      },
    ],
    user: {
      id: 'usr_sarah_02',
      fullName: 'Dr. Sarah Jenkins',
      email: 'dr.sarah@mediarca.com',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
      phone: '+91 9820012345',
    },
  },
  {
    id: 'doc_arjun_02',
    userId: 'usr_arjun_03',
    specialty: 'Dermatology',
    qualifications: 'MD',
    experienceYears: 10,
    consultationFee: 650,
    bio: 'Consultant dermatologist focusing on acne, eczema, psoriasis, skin cancer screening, and cosmetic laser treatments.',
    clinicAddress: 'Apex Skin & Aesthetics Clinic, Floor 2, Indiranagar, Bengaluru, KA',
    isVerified: true,
    checkingStartTime: '10:00',
    checkingEndTime: '18:30',
    avgConsultationMinutes: 4.4,
    maxDailyPatients: 75,
    rating: 4.8,
    totalReviews: 94,
    cabinStatus: 'IN_CABIN',
    slots: [
      {
        id: 'slot_arjun_1',
        name: 'Morning Clinic (10:00 AM – 01:00 PM)',
        startTime: '10:00',
        endTime: '13:00',
        maxPatients: 45,
        avgConsultationMinutes: 4.0,
      },
      {
        id: 'slot_arjun_2',
        name: 'Afternoon Clinic (04:00 PM – 06:30 PM)',
        startTime: '16:00',
        endTime: '18:30',
        maxPatients: 30,
        avgConsultationMinutes: 5.0,
      },
    ],
    clinics: [
      {
        id: 'cd_arjun_1',
        clinicId: 'clinic_demo_3',
        clinic: {
          id: 'clinic_demo_3',
          clinicName: 'Apex Skin & Aesthetics Clinic',
          address: 'Floor 2, 100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          phone: '+91 98450 11223',
          isVerified: true,
        },
      },
    ],
    user: {
      id: 'usr_arjun_03',
      fullName: 'Dr. Arjun Patel',
      email: 'dr.arjun@mediarca.com',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80',
      phone: '+91 9845011223',
    },
  },
  {
    id: 'doc_elena_03',
    userId: 'usr_elena_04',
    specialty: 'Pediatrics',
    qualifications: 'MD',
    experienceYears: 12,
    consultationFee: 700,
    bio: 'Dedicated pediatrician providing comprehensive child wellness care, developmental tracking, vaccinations, and adolescent healthcare.',
    clinicAddress: 'Little Steps Children Care, Building B, Vasant Vihar, New Delhi, DL',
    isVerified: true,
    checkingStartTime: '08:30',
    checkingEndTime: '18:00',
    avgConsultationMinutes: 4.5,
    maxDailyPatients: 80,
    rating: 5.0,
    totalReviews: 150,
    cabinStatus: 'IN_CABIN',
    slots: [
      {
        id: 'slot_elena_1',
        name: 'Morning Wellness (08:30 AM – 11:30 AM)',
        startTime: '08:30',
        endTime: '11:30',
        maxPatients: 40,
        avgConsultationMinutes: 4.5,
      },
      {
        id: 'slot_elena_2',
        name: 'Afternoon Consults (03:00 PM – 06:00 PM)',
        startTime: '15:00',
        endTime: '18:00',
        maxPatients: 40,
        avgConsultationMinutes: 4.5,
      },
    ],
    clinics: [
      {
        id: 'cd_elena_1',
        clinicId: 'clinic_demo_4',
        clinic: {
          id: 'clinic_demo_4',
          clinicName: 'Little Steps Children Care',
          address: 'Building B, Community Centre, Vasant Vihar',
          city: 'New Delhi',
          state: 'Delhi',
          phone: '+91 98110 33445',
          isVerified: true,
        },
      },
      {
        id: 'cd_elena_2',
        clinicId: 'clinic_demo_5',
        clinic: {
          id: 'clinic_demo_5',
          clinicName: 'Metro Pediatric Center',
          address: 'Suite 104, Palam Marg, Vasant Vihar',
          city: 'New Delhi',
          state: 'Delhi',
          phone: '+91 98110 55667',
          isVerified: true,
        },
      },
    ],
    user: {
      id: 'usr_elena_04',
      fullName: 'Dr. Elena Rostova',
      email: 'dr.elena@mediarca.com',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813576-0f723652f146?auto=format&fit=crop&w=256&q=80',
      phone: '+91 9811033445',
    },
  },
];

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
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res;
    }

    // Graceful offline fallback
    let list = [...DEMO_DOCTORS];
    if (params?.specialty && params.specialty !== 'All') {
      list = list.filter((d) => d.specialty.toLowerCase() === params.specialty?.toLowerCase());
    }
    if (params?.state && params.state !== 'All') {
      const st = params.state.toLowerCase();
      list = list.filter(
        (d) =>
          d.clinics?.some((c) => c.clinic.state?.toLowerCase() === st) ||
          d.clinicAddress?.toLowerCase().includes(st)
      );
    }
    if (params?.city && params.city !== 'All') {
      const ct = params.city.toLowerCase();
      list = list.filter(
        (d) =>
          d.clinics?.some((c) => c.clinic.city?.toLowerCase() === ct) ||
          d.clinicAddress?.toLowerCase().includes(ct)
      );
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.user.fullName.toLowerCase().includes(s) ||
          d.specialty.toLowerCase().includes(s) ||
          d.clinicAddress?.toLowerCase().includes(s)
      );
    }
    return { success: true, data: list };
  },

  async getDoctorById(id: string): Promise<ApiResponse<Doctor>> {
    const res = await apiRequest<Doctor>(`/doctors/${id}`, { method: 'GET' });
    if (res.success && res.data) return res;

    const found = DEMO_DOCTORS.find((d) => d.id === id) || DEMO_DOCTORS[0];
    return { success: true, data: found };
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

    // Offline calculate preview
    const doctor = DEMO_DOCTORS.find((d) => d.id === docId) || DEMO_DOCTORS[0];
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
      clinicName: matchedClinic?.clinic.clinicName,
      selectedClinic: matchedClinic
        ? {
            clinicId: matchedClinic.clinicId,
            clinicName: matchedClinic.clinic.clinicName,
            address: matchedClinic.clinic.address,
            city: matchedClinic.clinic.city,
            phone: matchedClinic.clinic.phone,
            consultationFee: effectiveFee,
          }
        : null,
      hasClinics: (doctor.clinics?.length || 0) > 0,
      clinicsCount: doctor.clinics?.length || 0,
      clinics: doctor.clinics?.map((c) => ({
        clinicId: c.clinicId,
        clinicName: c.clinic.clinicName,
        address: c.clinic.address,
        city: c.clinic.city,
        phone: c.clinic.phone,
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

  // 5. Admin Platform Operations
  async getAdminStats(): Promise<ApiResponse<{
    totalPatients: number;
    totalDoctors: number;
    pendingDoctors: number;
    totalClinics: number;
    pendingClinics: number;
    totalAppointments: number;
    todayAppointments: number;
  }>> {
    return apiRequest('/admin/stats', { method: 'GET' });
  },

  async getAdminDoctors(): Promise<ApiResponse<Doctor[]>> {
    return apiRequest('/admin/doctors', { method: 'GET' });
  },

  async verifyDoctor(
    doctorId: string,
    action: boolean | 'VERIFIED' | 'SUSPENDED' | 'REJECTED' | 'PENDING'
  ): Promise<ApiResponse<Doctor>> {
    const payload =
      typeof action === 'boolean'
        ? { doctorId, isVerified: action, status: action ? 'VERIFIED' : 'SUSPENDED' }
        : { doctorId, isVerified: action === 'VERIFIED', status: action };
    return apiRequest('/admin/verify-doctor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAdminClinics(): Promise<ApiResponse<any[]>> {
    return apiRequest('/admin/clinics', { method: 'GET' });
  },

  async verifyClinic(
    clinicId: string,
    action: boolean | 'VERIFIED' | 'SUSPENDED' | 'REJECTED' | 'PENDING'
  ): Promise<ApiResponse<any>> {
    const payload =
      typeof action === 'boolean'
        ? { clinicId, isVerified: action, status: action ? 'VERIFIED' : 'SUSPENDED' }
        : { clinicId, isVerified: action === 'VERIFIED', status: action };
    return apiRequest('/admin/verify-clinic', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAdminAppointments(): Promise<ApiResponse<any[]>> {
    return apiRequest('/admin/appointments', { method: 'GET' });
  },

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

  async getAdminContactMessages(): Promise<ApiResponse<ContactMessageItem[]>> {
    return apiRequest('/admin/contact-messages', { method: 'GET' });
  },

  async markContactMessageRead(id: string): Promise<ApiResponse<ContactMessageItem>> {
    return apiRequest(`/admin/contact-messages/${id}/read`, {
      method: 'PATCH',
    });
  },

  // 6. Clinic Operations & Staff Roster
  async getMyClinic(): Promise<ApiResponse<ClinicDashboardData>> {
    return apiRequest('/clinics/my-clinic', { method: 'GET' });
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
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res;
    }

    // Fallback demo clinics
    const clinicMap = new Map<string, ClinicProfile>();
    DEMO_DOCTORS.forEach((doc) => {
      doc.clinics?.forEach((cd) => {
        const c = cd.clinic;
        if (!clinicMap.has(c.id)) {
          clinicMap.set(c.id, {
            id: c.id,
            clinicName: c.clinicName,
            address: c.address,
            city: c.city,
            state: c.state || 'Maharashtra',
            phone: c.phone,
            isVerified: c.isVerified,
            verificationStatus: 'VERIFIED',
            _count: { doctors: 0 },
            doctors: [],
          });
        }
        const existing = clinicMap.get(c.id)!;
        existing.doctors = existing.doctors || [];
        existing.doctors.push({
          id: cd.id,
          clinicId: c.id,
          doctorId: doc.id,
          status: 'ACCEPTED',
          consultationFee: cd.consultationFee ?? doc.consultationFee,
          slots: cd.slots || doc.slots,
          doctor: doc,
        });
        existing._count = { doctors: existing.doctors.length };
      });
    });

    let list = Array.from(clinicMap.values());
    if (params?.city && params.city !== 'All') {
      list = list.filter((c) => c.city?.toLowerCase() === params.city?.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.clinicName.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
      );
    }
    return { success: true, data: list };
  },

  async getPublicClinicById(id: string): Promise<ApiResponse<ClinicProfile>> {
    const res = await apiRequest<ClinicProfile>(`/clinics/public/${id}`, { method: 'GET' });
    if (res.success && res.data) return res;

    const clinicsRes = await this.getPublicClinics();
    const found = clinicsRes.data?.find((c) => c.id === id);
    if (found) return { success: true, data: found };
    return { success: false, message: 'Clinic not found' };
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
