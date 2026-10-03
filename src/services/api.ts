import { Preferences } from '@capacitor/preferences';

// Production Render API & Supabase backend
export const DEFAULT_API_URL = 'https://mediarca-mdwk.onrender.com/api';

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
    return `https://pub-a590817d9f404eb889f6482b025ea9ad.r2.dev/${clean}`;
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

// Interfaces
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'CLINIC' | 'RECEPTIONIST' | 'ADMIN';
  avatarUrl?: string;
  isEmailVerified?: boolean;
  patientProfile?: {
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    emergencyContact?: string;
  };
  doctorProfile?: DoctorProfile;
  clinicProfile?: ClinicProfile;
}

export interface DoctorSlot {
  id: string;
  name: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "12:00"
  maxPatients: number;
  avgConsultationMinutes?: number;
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
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  cabinStatus: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN';
  steppedOutUntil?: string | null;
  schedules?: DoctorClinicSchedule[];
  user?: {
    fullName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  };
}

export interface ClinicProfile {
  id: string;
  userId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  checkinCode?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  clinicId: string;
  patientId: string;
  date: string;
  slotId: string;
  slotName?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  queueNumber: number;
  status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  isForOther: boolean;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  reasonForVisit?: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
  doctor?: {
    specialty: string;
    cabinStatus: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN';
    steppedOutUntil?: string;
    user: {
      fullName: string;
      avatarUrl?: string;
    };
  };
  clinic?: {
    name: string;
    address: string;
    city: string;
  };
  consultationNotes?: string;
  createdAt: string;
}

export interface QueuePreviewResult {
  nextQueueNumber: number;
  estimatedTime: string;
  patientsAhead: number;
  avgMinutesPerPatient: number;
  slotDetails?: DoctorSlot;
}

// HTTP request helper with auto Bearer token
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
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
      };
    }

    return {
      success: true,
      data: json.data !== undefined ? json.data : json,
      message: json.message,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unable to connect to server. Check your internet connection.',
    };
  }
}

// API methods
export const api = {
  // Auth
  async login(email: string, password: string) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(data: { email: string; password: string; fullName: string; phone?: string; role?: string }) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyOtp(email: string, otp: string) {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async resendOtp(email: string) {
    return apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getMe() {
    return apiRequest('/auth/me', { method: 'GET' });
  },

  async updateProfile(data: any) {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Doctors
  async getDoctors(params?: { specialty?: string; city?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.specialty) query.append('specialty', params.specialty);
    if (params?.city) query.append('city', params.city);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/doctors${qs}`, { method: 'GET' });
  },

  async getDoctorById(id: string) {
    return apiRequest(`/doctors/${id}`, { method: 'GET' });
  },

  async updateCabinStatus(status: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN', returnTimeMinutes?: number) {
    return apiRequest('/doctors/cabin-status', {
      method: 'PUT',
      body: JSON.stringify({ cabinStatus: status, returnTimeMinutes }),
    });
  },

  // Appointments & Queue
  async getQueuePreview(params: { doctorId: string; clinicId: string; slotId: string; date: string }) {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/appointments/queue-preview?${qs}`, { method: 'GET' });
  },

  async bookAppointment(data: {
    doctorId: string;
    clinicId: string;
    slotId: string;
    date: string;
    isForOther: boolean;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    reasonForVisit?: string;
  }) {
    return apiRequest('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPatientAppointments() {
    return apiRequest('/appointments/patient', { method: 'GET' });
  },

  async getAppointmentById(id: string) {
    return apiRequest(`/appointments/${id}`, { method: 'GET' });
  },

  async cancelAppointment(id: string, reason?: string) {
    return apiRequest(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async checkIn(appointmentId?: string, checkinCode?: string) {
    return apiRequest('/appointments/check-in', {
      method: 'POST',
      body: JSON.stringify({ appointmentId, checkinCode }),
    });
  },

  // Doctor Console
  async getDoctorQueue(date?: string, slotId?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (slotId) params.append('slotId', slotId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/consultations/queue${qs}`, { method: 'GET' });
  },

  async callPatient(appointmentId: string) {
    return apiRequest('/consultations/call-patient', {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    });
  },

  async completeConsultation(appointmentId: string, consultationNotes?: string) {
    return apiRequest('/consultations/complete', {
      method: 'POST',
      body: JSON.stringify({ appointmentId, consultationNotes }),
    });
  },

  // Receptionist Walk-in
  async bookWalkin(data: {
    doctorId: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    phone?: string;
    reasonForVisit?: string;
    slotId?: string;
  }) {
    return apiRequest('/receptionist/book-walkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
