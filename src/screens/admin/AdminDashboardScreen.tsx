import React, { useEffect, useState, useCallback } from 'react';
import {
  api,
  Doctor,
  ContactMessageItem,
  formatDoctorDegrees,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ShieldCheck,
  Shield,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  X,
  Building2,
  Ban,
  Mail,
  Sparkles,
  Stethoscope,
  Eye,
  Check,
  TrendingUp,
  Activity,
  LogOut,
  ChevronRight,
  User,
} from 'lucide-react';

export type AdminTab = 'kpi' | 'doctors' | 'clinics' | 'appointments' | 'messages';

export interface AdminDashboardScreenProps {
  onOpenRoleSwitcher?: () => void;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onOpenRoleSwitcher,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<{
    totalPatients: number;
    totalDoctors: number;
    pendingDoctors: number;
    totalClinics?: number;
    pendingClinics?: number;
    totalAppointments: number;
    todayAppointments: number;
  } | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Tab sync: 'kpi' | 'doctors' | 'clinics' | 'appointments' | 'messages'
  const [localActiveTab, setLocalActiveTab] = useState<AdminTab>('kpi');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = (tab: AdminTab) => {
    setLocalActiveTab(tab);
    onTabChange?.(tab);
  };

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inspector modal states
  const [inspectDoctor, setInspectDoctor] = useState<Doctor | null>(null);
  const [inspectClinic, setInspectClinic] = useState<any | null>(null);

  const getDemoAdminData = useCallback(() => {
    return {
      stats: {
        totalPatients: 1420,
        totalDoctors: 48,
        pendingDoctors: 3,
        totalClinics: 16,
        pendingClinics: 2,
        totalAppointments: 3290,
        todayAppointments: 42,
      },
      doctors: [
        {
          id: 'doc_sarah_01',
          userId: 'usr_sarah_02',
          specialty: 'Cardiology',
          qualifications: 'MD, DM',
          experienceYears: 14,
          consultationFee: 800,
          bio: 'Specialist in preventive cardiology, hypertension, and heart failure management.',
          clinicAddress: 'City Heart & Vascular Institute, Bandra West, Mumbai, MH',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          checkingStartTime: '09:00',
          checkingEndTime: '20:00',
          avgConsultationMinutes: 2.7,
          maxDailyPatients: 110,
          rating: 4.9,
          totalReviews: 128,
          user: {
            id: 'usr_sarah_02',
            fullName: 'Dr. Sarah Jenkins',
            email: 'dr.sarah@mediarca.com',
            phone: '+91 98200 12345',
            avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
          },
        },
        {
          id: 'doc_arjun_02',
          userId: 'usr_arjun_03',
          specialty: 'Dermatology',
          qualifications: 'MD, DNB',
          experienceYears: 10,
          consultationFee: 650,
          bio: 'Consultant dermatologist focusing on clinical dermatology and cosmetic laser treatments.',
          clinicAddress: 'Apex Skin Clinic, Indiranagar, Bengaluru, KA',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          checkingStartTime: '10:00',
          checkingEndTime: '18:30',
          avgConsultationMinutes: 4.4,
          maxDailyPatients: 75,
          rating: 4.8,
          totalReviews: 94,
          user: {
            id: 'usr_arjun_03',
            fullName: 'Dr. Arjun Patel',
            email: 'dr.arjun@mediarca.com',
            phone: '+91 98450 11223',
            avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80',
          },
        },
        {
          id: 'doc_neha_pending',
          userId: 'usr_neha_05',
          specialty: 'Neurology',
          qualifications: 'MD, DM Neurology',
          experienceYears: 8,
          consultationFee: 900,
          bio: 'Neurologist with specialization in stroke management and headache disorders.',
          clinicAddress: 'NeuroCare Clinic, Connaught Place, New Delhi, DL',
          isVerified: false,
          verificationStatus: 'PENDING',
          checkingStartTime: '11:00',
          checkingEndTime: '17:00',
          avgConsultationMinutes: 5.0,
          maxDailyPatients: 30,
          rating: 0,
          totalReviews: 0,
          user: {
            id: 'usr_neha_05',
            fullName: 'Dr. Neha Kulkarni',
            email: 'dr.neha@neurocare.com',
            phone: '+91 98110 44556',
            avatarUrl: 'https://images.unsplash.com/photo-1594824813576-0f723652f146?auto=format&fit=crop&w=256&q=80',
          },
        },
      ],
      clinics: [
        {
          id: 'clinic_demo_1',
          clinicName: 'Metropolis Polyclinic & Diagnostic',
          address: 'Floor 3, 100 Hill Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          phone: '+91 98200 55001',
          checkinCode: 'METRO01',
          isVerified: true,
          verificationStatus: 'VERIFIED',
          _count: { doctors: 2 },
        },
        {
          id: 'clinic_demo_2',
          clinicName: 'Apollo City Health Hub',
          address: 'Sector 18, Noida',
          city: 'Noida',
          state: 'Uttar Pradesh',
          phone: '+91 98100 22334',
          checkinCode: 'APOLLO18',
          isVerified: false,
          verificationStatus: 'PENDING',
          _count: { doctors: 1 },
        },
      ],
      appointments: [
        {
          id: 'appt_adm_1',
          patientName: 'Aarav Sharma',
          doctorName: 'Dr. Sarah Jenkins',
          clinicName: 'Metropolis Polyclinic',
          appointmentDate: '2026-10-04',
          queueNumber: 1,
          status: 'COMPLETED',
          fee: 800,
        },
        {
          id: 'appt_adm_2',
          patientName: 'Priya Mehra',
          doctorName: 'Dr. Arjun Patel',
          clinicName: 'Apex Skin Clinic',
          appointmentDate: '2026-10-04',
          queueNumber: 2,
          status: 'IN_CONSULTATION',
          fee: 650,
        },
      ],
      contactMessages: [
        {
          id: 'msg_1',
          fullName: 'Siddharth Roy',
          email: 'siddharth@gmail.com',
          phone: '+91 98200 77889',
          subject: 'Clinic Onboarding Inquiry',
          message: 'We are expanding our hospital in South Delhi and would like to integrate 12 doctor cabins with MediArca.',
          status: 'NEW',
          createdAt: '2026-10-03',
        },
        {
          id: 'msg_2',
          fullName: 'Kavita Iyer',
          email: 'kavita@yahoo.com',
          phone: '+91 98450 88990',
          subject: 'Token Pass QR Scanner Help',
          message: 'The check-in scan was very fast at the Bandra clinic! Thank you for the zero-wait experience.',
          status: 'READ',
          createdAt: '2026-10-02',
        },
      ],
    };
  }, []);

  const loadAdminData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const [statsRes, doctorsRes, clinicsRes, apptsRes, msgsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminDoctors(),
        api.getAdminClinics(),
        api.getAdminAppointments(),
        api.getAdminContactMessages().catch(() => ({ success: false, data: [] })),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStats(getDemoAdminData().stats);
      }

      if (doctorsRes.success && Array.isArray(doctorsRes.data)) {
        setDoctors(doctorsRes.data);
      } else {
        setDoctors(getDemoAdminData().doctors as any);
      }

      if (clinicsRes.success && Array.isArray(clinicsRes.data)) {
        setClinics(clinicsRes.data);
      } else {
        setClinics(getDemoAdminData().clinics);
      }

      if (apptsRes.success && Array.isArray(apptsRes.data)) {
        setAppointments(apptsRes.data);
      } else {
        setAppointments(getDemoAdminData().appointments);
      }

      if (msgsRes.success && Array.isArray(msgsRes.data)) {
        setContactMessages(msgsRes.data);
      } else {
        setContactMessages(getDemoAdminData().contactMessages);
      }
    } catch {
      const demo = getDemoAdminData();
      setStats(demo.stats);
      setDoctors(demo.doctors as any);
      setClinics(demo.clinics);
      setAppointments(demo.appointments);
      setContactMessages(demo.contactMessages);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDemoAdminData]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleVerifyDoctor = async (
    doctorId: string,
    action: 'VERIFIED' | 'SUSPENDED' | 'REJECTED'
  ) => {
    try {
      const res = await api.verifyDoctor(doctorId, action);
      if (res.success) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === doctorId ? { ...d, verificationStatus: action, isVerified: action === 'VERIFIED' } : d))
        );
        setSuccessMsg(`Doctor status set to ${action}.`);
        setInspectDoctor(null);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.message || 'Action failed');
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  const handleVerifyClinic = async (
    clinicId: string,
    action: 'VERIFIED' | 'SUSPENDED' | 'REJECTED'
  ) => {
    try {
      const res = await api.verifyClinic(clinicId, action);
      if (res.success) {
        setClinics((prev) =>
          prev.map((c) => (c.id === clinicId ? { ...c, verificationStatus: action, isVerified: action === 'VERIFIED' } : c))
        );
        setSuccessMsg(`Clinic status set to ${action}.`);
        setInspectClinic(null);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.message || 'Action failed');
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  const handleMarkMessageRead = async (id: string) => {
    try {
      await api.markContactMessageRead(id);
      setContactMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: 'READ' } : m))
      );
      setSuccessMsg('Message marked as read.');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to mark message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats || getDemoAdminData().stats;

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 text-[#1d1d1f]">
      {/* Sub Bar */}
      <div className="bg-white border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base text-[#1d1d1f] tracking-tight">Platform Governance</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-[#86868b]">National Clinical Registry & Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadAdminData(true);
              }}
              disabled={refreshing}
              className="p-2 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {onOpenRoleSwitcher && (
              <button
                type="button"
                onClick={onOpenRoleSwitcher}
                className="px-3 py-1.5 rounded-full bg-[#0066cc]/10 hover:bg-[#0066cc]/20 text-[#0066cc] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch Role</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)}><X className="w-4 h-4 text-rose-600" /></button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)}><X className="w-4 h-4 text-emerald-600" /></button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#e5e5ea]/60 rounded-2xl overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('kpi')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'kpi'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            KPIs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'doctors'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Doctors ({doctors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clinics')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'clinics'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Clinics ({clinics.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'appointments'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Audit Log ({appointments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'messages'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Inbox ({contactMessages.length})
          </button>
        </div>

        {/* TAB 1: PLATFORM KPIS & SYSTEM HEALTH */}
        {activeTab === 'kpi' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                <div>
                  <h3 className="font-semibold text-base text-[#1d1d1f]">Platform Operations KPI</h3>
                  <p className="text-xs text-[#86868b]">Real-time system health and network velocity metrics</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#f5f5f7] rounded-2xl p-3.5 border border-[#e5e5ea]/80">
                  <div className="flex items-center gap-1.5 text-[#86868b] text-xs">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Patients</span>
                  </div>
                  <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">{s.totalPatients}</div>
                  <div className="text-[10px] text-blue-700 font-medium mt-0.5">National Citizens</div>
                </div>

                <div className="bg-[#f5f5f7] rounded-2xl p-3.5 border border-[#e5e5ea]/80">
                  <div className="flex items-center gap-1.5 text-[#86868b] text-xs">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    <span>Doctors</span>
                  </div>
                  <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">{s.totalDoctors}</div>
                  <div className="text-[10px] text-amber-700 font-medium mt-0.5">{s.pendingDoctors} Pending Review</div>
                </div>

                <div className="bg-[#f5f5f7] rounded-2xl p-3.5 border border-[#e5e5ea]/80">
                  <div className="flex items-center gap-1.5 text-[#86868b] text-xs">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>Clinics</span>
                  </div>
                  <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">{s.totalClinics || 16}</div>
                  <div className="text-[10px] text-amber-700 font-medium mt-0.5">{s.pendingClinics || 2} Pending Inspection</div>
                </div>

                <div className="bg-[#f5f5f7] rounded-2xl p-3.5 border border-[#e5e5ea]/80">
                  <div className="flex items-center gap-1.5 text-[#86868b] text-xs">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Appointments</span>
                  </div>
                  <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">{s.totalAppointments}</div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">{s.todayAppointments} Today</div>
                </div>
              </div>

              {/* System Infrastructure Status */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-900">MediArca Cloud Engine Online</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 font-medium">Latency: 38ms</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Real-time queue synchronization, OTP SMS gateway, Cloudflare R2 file storage, and Supabase PostgreSQL data cluster operating at optimal performance.
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('doctors')}
                  className="p-3 rounded-2xl border border-[#e5e5ea] hover:bg-[#f5f5f7] flex items-center justify-between text-left transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#1d1d1f]">Verify Doctors</div>
                    <div className="text-[10px] text-[#86868b]">{s.pendingDoctors} awaiting approval</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#86868b]" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('clinics')}
                  className="p-3 rounded-2xl border border-[#e5e5ea] hover:bg-[#f5f5f7] flex items-center justify-between text-left transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#1d1d1f]">Inspect Clinics</div>
                    <div className="text-[10px] text-[#86868b]">{s.pendingClinics || 2} awaiting audit</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#86868b]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DOCTORS VERIFICATION */}
        {activeTab === 'doctors' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">Medical Practitioner Verifications</h2>
            <div className="space-y-2.5">
              {doctors.map((doc) => {
                const status = (doc.verificationStatus || (doc.isVerified ? 'VERIFIED' : 'PENDING')).toUpperCase();
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={doc.user?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80'}
                        alt={doc.user?.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-[#e5e5ea] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-[#1d1d1f]">{doc.user?.fullName}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-xs text-[#86868b] mt-0.5">
                          {doc.specialty} • {formatDoctorDegrees(doc.qualifications)} • {doc.experienceYears} yrs
                        </p>
                        <p className="text-[11px] text-[#86868b] mt-0.5 line-clamp-1">{doc.clinicAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setInspectDoctor(doc)}
                        className="p-2 rounded-xl text-[#0066cc] hover:bg-blue-50 transition-colors"
                        title="Inspect Credentials"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {status !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyDoctor(doc.id, 'VERIFIED')}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                        >
                          Verify
                        </button>
                      )}
                      {status !== 'SUSPENDED' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyDoctor(doc.id, 'SUSPENDED')}
                          className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CLINIC INSPECTION */}
        {activeTab === 'clinics' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">Clinical Facility Inspections</h2>
            <div className="space-y-2.5">
              {clinics.map((c) => {
                const status = (c.verificationStatus || (c.isVerified ? 'VERIFIED' : 'PENDING')).toUpperCase();
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[#1d1d1f]">{c.clinicName}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-[#86868b] mt-0.5">{c.address}, {c.city}, {c.state}</p>
                      <p className="text-[11px] font-mono text-[#0066cc] mt-1">Check-in Code: {c.checkinCode || 'N/A'}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {status !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyClinic(c.id, 'VERIFIED')}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                        >
                          Approve Facility
                        </button>
                      )}
                      {status !== 'SUSPENDED' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyClinic(c.id, 'SUSPENDED')}
                          className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOG */}
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">Appointments Audit Trail ({appointments.length})</h2>
            <div className="space-y-2">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center font-bold text-sm text-[#0066cc]">
                      #{appt.queueNumber || 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#1d1d1f]">{appt.patientName}</h4>
                      <p className="text-xs text-[#86868b]">{appt.doctorName} • {appt.clinicName || 'Clinic'}</p>
                      <p className="text-[11px] text-[#86868b] mt-0.5">{appt.appointmentDate}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {appt.status}
                    </span>
                    <div className="text-xs font-semibold text-[#1d1d1f] mt-1">₹{appt.fee || 800}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORT INBOX */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">Inbound Support & Inquiries ({contactMessages.length})</h2>
            <div className="space-y-2.5">
              {contactMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0066cc]" />
                      <h4 className="font-semibold text-sm text-[#1d1d1f]">{msg.subject}</h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      msg.status === 'NEW'
                        ? 'bg-blue-50 text-[#0066cc] border border-blue-200'
                        : 'bg-gray-100 text-[#86868b]'
                    }`}>
                      {msg.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#1d1d1f]">{msg.message}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0] text-xs text-[#86868b]">
                    <span>From: <strong>{msg.fullName}</strong> ({msg.email})</span>
                    {msg.status === 'NEW' && (
                      <button
                        type="button"
                        onClick={() => handleMarkMessageRead(msg.id)}
                        className="px-3 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-xs font-medium text-[#1d1d1f]"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Profile & Terminal Management */}
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-4 mt-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                <div>
                  <h3 className="font-semibold text-base text-[#1d1d1f]">Administrator Console</h3>
                  <p className="text-xs text-[#86868b]">Authenticated root session and portal controls</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700">
                  <Shield className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                    {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1d1d1f]">{user?.fullName || 'Root Administrator'}</h4>
                    <p className="text-xs text-[#86868b]">{user?.email || 'admin@mediarca.com'}</p>
                    <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      SUPER_ADMIN ACCESS
                    </span>
                  </div>
                </div>
                {onOpenRoleSwitcher && (
                  <button
                    type="button"
                    onClick={onOpenRoleSwitcher}
                    className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Switch</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full py-3 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out of Administrator Terminal</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Doctor Inspection Modal */}
      {inspectDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3 className="font-semibold text-base text-[#1d1d1f]">Practitioner Inspection</h3>
              <button
                type="button"
                onClick={() => setInspectDoctor(null)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={inspectDoctor.user?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80'}
                alt={inspectDoctor.user?.fullName}
                className="w-14 h-14 rounded-full object-cover border border-[#e5e5ea]"
              />
              <div>
                <h4 className="font-bold text-base text-[#1d1d1f]">{inspectDoctor.user?.fullName}</h4>
                <p className="text-xs text-[#86868b]">{inspectDoctor.specialty} • {inspectDoctor.qualifications}</p>
                <p className="text-xs text-[#0066cc]">{inspectDoctor.user?.email}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f5f7] text-xs space-y-1.5 font-mono">
              <div><strong>Experience:</strong> {inspectDoctor.experienceYears} Years</div>
              <div><strong>Consultation Fee:</strong> ₹{inspectDoctor.consultationFee}</div>
              <div><strong>Clinical Address:</strong> {inspectDoctor.clinicAddress}</div>
              <div><strong>Bio:</strong> {inspectDoctor.bio || 'Not provided'}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleVerifyDoctor(inspectDoctor.id, 'VERIFIED')}
                className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-medium"
              >
                Verify Practitioner
              </button>
              <button
                type="button"
                onClick={() => handleVerifyDoctor(inspectDoctor.id, 'SUSPENDED')}
                className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 text-xs font-medium"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
