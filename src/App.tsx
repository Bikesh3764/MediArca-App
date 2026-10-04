import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config/auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DoctorProfile, DoctorSlot, Appointment, api } from './services/api';
import { BrandLogo } from './components/ui/BrandLogo';
import { AppleCard } from './components/ui/AppleCard';
import { AppleButton } from './components/ui/AppleButton';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';

// Patient Portal Screens
import { ExploreScreen } from './screens/ExploreScreen';
import { DoctorDetailScreen } from './screens/DoctorDetailScreen';
import { BookingModal } from './screens/BookingModal';
import { QueuePassScreen } from './screens/QueuePassScreen';
import { CheckInScreen } from './screens/CheckInScreen';
import { AppointmentsHistoryScreen } from './screens/AppointmentsHistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AuthModal } from './screens/AuthModal';

// Doctor Console Screens
import { DoctorConsoleScreen } from './screens/DoctorConsoleScreen';
import { ManageScheduleScreen } from './screens/doctor/ManageScheduleScreen';
import { ConsultationDeskScreen } from './screens/doctor/ConsultationDeskScreen';
import { DoctorAffiliationsScreen } from './screens/doctor/DoctorAffiliationsScreen';
import { DoctorProfileScreen } from './screens/doctor/DoctorProfileScreen';

// Other Platform Workspaces
import { ClinicDashboardScreen } from './screens/clinic/ClinicDashboardScreen';
import { ReceptionistDashboardScreen } from './screens/receptionist/ReceptionistDashboardScreen';
import { AdminDashboardScreen } from './screens/admin/AdminDashboardScreen';

import {
  Search,
  Ticket,
  QrCode,
  Calendar,
  User,
  Stethoscope,
  Clock,
  FileText,
  Building2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

type PatientTab = 'explore' | 'queue' | 'checkin' | 'history' | 'profile';
type DoctorTab = 'console' | 'schedule' | 'desk' | 'affiliations' | 'profile';

const DEMO_CONSULTATION_APPT: Appointment = {
  id: 'appt_demo_01',
  patientId: 'usr_pat_01',
  patientName: 'Aarav Sharma',
  patientAge: 32,
  patientGender: 'Male',
  patientPhone: '+91 98765 43210',
  doctorId: 'doc_sarah_01',
  doctorName: 'Dr. Sarah Jenkins',
  clinicId: 'cln_01',
  appointmentDate: new Date().toISOString().split('T')[0],
  date: new Date().toISOString().split('T')[0],
  queueNumber: 4,
  checkingWindow: 'Morning Clinic (09:00 AM – 11:30 AM)',
  estimatedTime: '09:45 AM',
  status: 'IN_CONSULTATION',
  reasonForVisit: 'Persistent dry cough and mild chest tightness',
  fee: 800,
  isCheckedIn: true,
  createdAt: new Date().toISOString(),
};

interface DoctorDeskHomeProps {
  onSelectAppointment: (appointment: Appointment) => void;
}

const DoctorDeskHome: React.FC<DoctorDeskHomeProps> = ({ onSelectAppointment }) => {
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctorQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.getDoctorQueue(today);
      if (res.success && Array.isArray(res.data)) {
        setQueue(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorQueue();
  }, []);

  const inCabin = queue.find((a) => a.status === 'IN_CONSULTATION');
  const waitingPatients = queue.filter((a) => a.status === 'WAITING');

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea] flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1d1d1f]">Consultation Desk</h2>
          <p className="text-[11px] text-[#86868b]">Record vitals, diagnosis & write prescriptions</p>
        </div>
        <button
          type="button"
          onClick={() => fetchDoctorQueue(true)}
          disabled={refreshing}
          className="p-2 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#0066cc] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {inCabin && (
          <AppleCard className="bg-emerald-50/60 border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Currently In Cabin
              </span>
              <span className="text-sm font-black text-emerald-700">
                #{String(inCabin.queueNumber).padStart(2, '0')}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f]">{inCabin.patientName}</h3>
              <p className="text-xs text-[#86868b]">
                {inCabin.patientAge ? `${inCabin.patientAge} yrs • ` : ''}
                {inCabin.patientGender || 'Patient'}
                {inCabin.reasonForVisit ? ` • ${inCabin.reasonForVisit}` : ''}
              </p>
            </div>
            <AppleButton
              variant="success"
              size="md"
              className="w-full"
              onClick={() => onSelectAppointment(inCabin)}
            >
              Resume Consultation & Prescription
            </AppleButton>
          </AppleCard>
        )}

        {/* Waiting Patients List */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider block px-1">
            Waiting Patients ({waitingPatients.length})
          </span>
          {loading ? (
            <div className="p-8 text-center text-xs text-[#86868b]">Loading appointments...</div>
          ) : waitingPatients.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-[#e5e5ea] text-center text-xs text-[#86868b]">
              No patients waiting in queue right now.
            </div>
          ) : (
            waitingPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white p-3.5 rounded-2xl border border-[#e5e5ea] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base font-black text-[#0066cc] w-7 shrink-0">
                    #{String(patient.queueNumber).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#1d1d1f] truncate">
                      {patient.patientName}
                    </h4>
                    <p className="text-[11px] text-[#86868b] truncate">
                      {patient.reasonForVisit || 'General Consultation'}
                    </p>
                  </div>
                </div>
                <AppleButton
                  size="sm"
                  variant="primary"
                  onClick={() => onSelectAppointment(patient)}
                >
                  Start Desk
                </AppleButton>
              </div>
            ))
          )}
        </div>

        {/* Demo Consultation Desk Launcher */}
        <AppleCard className="space-y-2.5 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border-blue-200/70 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0066cc]" />
            <h4 className="text-xs font-bold text-[#1d1d1f]">Interactive Demo Desk</h4>
          </div>
          <p className="text-[11px] text-[#48484a] leading-relaxed">
            Open active clinical desk for Aarav Sharma to test digital vitals logging (BP, Pulse, SpO2, Temp), clinical observations, and multi-medication Rx builder.
          </p>
          <AppleButton
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={() => onSelectAppointment(DEMO_CONSULTATION_APPT)}
          >
            Open Demo Patient Desk
          </AppleButton>
        </AppleCard>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { user } = useAuth();

  // Tab states
  const [patientTab, setPatientTab] = useState<PatientTab>('explore');
  const [doctorTab, setDoctorTab] = useState<DoctorTab>('console');

  // Active items
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [consultationAppt, setConsultationAppt] = useState<Appointment | null>(null);

  // Modals
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Booking Modal State
  const [bookingParams, setBookingParams] = useState<{
    isOpen: boolean;
    doctor: DoctorProfile | null;
    clinicId: string;
    clinicName: string;
    slot: DoctorSlot | null;
    date: string;
  }>({
    isOpen: false,
    doctor: null,
    clinicId: '',
    clinicName: '',
    slot: null,
    date: '',
  });

  const handleRoleSelect = (role: 'PATIENT' | 'DOCTOR' | 'CLINIC' | 'RECEPTIONIST' | 'ADMIN') => {
    setRoleSwitcherOpen(false);
    if (role === 'DOCTOR') {
      setDoctorTab('console');
      setConsultationAppt(null);
    } else if (role === 'PATIENT') {
      setPatientTab('explore');
      setSelectedDoctor(null);
    }
  };

  const handleQuickBook = (doctor: DoctorProfile) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const schedule = doctor.schedules?.[0];
    const slot = schedule?.slots?.[0] || {
      id: 'default_slot',
      name: 'General Shift',
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      maxPatients: 30,
    };

    setBookingParams({
      isOpen: true,
      doctor,
      clinicId: schedule?.clinicId || 'cln_01',
      clinicName: schedule?.clinicName || 'MediArca Clinic',
      slot,
      date: today,
    });
  };

  const handleSelectSlotForBooking = (params: {
    doctor: DoctorProfile;
    clinicId: string;
    clinicName: string;
    slot: DoctorSlot;
    date: string;
  }) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setBookingParams({
      isOpen: true,
      doctor: params.doctor,
      clinicId: params.clinicId,
      clinicName: params.clinicName,
      slot: params.slot,
      date: params.date,
    });
  };

  const handleBookingSuccess = () => {
    setSelectedDoctor(null);
    setPatientTab('queue');
  };

  // 1. CLINIC WORKSPACE
  if (user?.role === 'CLINIC') {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-4xl min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] flex flex-col relative overflow-x-hidden">
          <ClinicDashboardScreen onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)} />
          <RoleSwitcherModal
            isOpen={roleSwitcherOpen}
            onClose={() => setRoleSwitcherOpen(false)}
            onSelectRole={handleRoleSelect}
          />
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  // 2. RECEPTIONIST WORKSPACE
  if (user?.role === 'RECEPTIONIST') {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-4xl min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] flex flex-col relative overflow-x-hidden">
          <ReceptionistDashboardScreen onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)} />
          <RoleSwitcherModal
            isOpen={roleSwitcherOpen}
            onClose={() => setRoleSwitcherOpen(false)}
            onSelectRole={handleRoleSelect}
          />
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  // 3. ADMIN WORKSPACE
  if (user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-4xl min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] flex flex-col relative overflow-x-hidden">
          <AdminDashboardScreen onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)} />
          <RoleSwitcherModal
            isOpen={roleSwitcherOpen}
            onClose={() => setRoleSwitcherOpen(false)}
            onSelectRole={handleRoleSelect}
          />
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  // 4. DOCTOR WORKSPACE
  if (user?.role === 'DOCTOR') {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] md:border-x md:border-[#e5e5ea] flex flex-col relative overflow-x-hidden">
          {/* Top Apple Header for Doctor */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#e5e5ea] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo variant="full" size="sm" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 active:scale-95 transition-all text-xs font-semibold text-indigo-700 cursor-pointer shadow-2xs hover:bg-indigo-100/70"
                title="Switch Workspace Portal"
              >
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                <span>Doctor</span>
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => setDoctorTab('profile')}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:scale-95 transition-all text-xs font-semibold text-[#1d1d1f] cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'D'}
                </div>
                <span className="truncate max-w-[65px] sm:max-w-[85px]">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>
            </div>
          </header>

          {/* Doctor Workspace Views */}
          <main className="flex-1 w-full pb-20">
            {doctorTab === 'console' && (
              <DoctorConsoleScreen
                onBack={() => setDoctorTab('profile')}
                onOpenConsultation={(appt) => {
                  setConsultationAppt(appt);
                  setDoctorTab('desk');
                }}
                onOpenSchedule={() => setDoctorTab('schedule')}
                onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
              />
            )}
            {doctorTab === 'schedule' && (
              <ManageScheduleScreen onBack={() => setDoctorTab('console')} />
            )}
            {doctorTab === 'desk' && (
              consultationAppt ? (
                <ConsultationDeskScreen
                  appointment={consultationAppt}
                  onBack={() => setConsultationAppt(null)}
                  onCompleted={() => {
                    setConsultationAppt(null);
                    setDoctorTab('console');
                  }}
                />
              ) : (
                <DoctorDeskHome
                  onSelectAppointment={(appt) => setConsultationAppt(appt)}
                />
              )
            )}
            {doctorTab === 'affiliations' && (
              <DoctorAffiliationsScreen onBack={() => setDoctorTab('console')} />
            )}
            {doctorTab === 'profile' && (
              <DoctorProfileScreen
                onBack={() => setDoctorTab('console')}
                onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
              />
            )}
          </main>

          {/* Doctor Bottom Tab Bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-[#e5e5ea] pb-[env(safe-area-inset-bottom)]">
            <div className="w-full max-w-md mx-auto flex items-center justify-around h-14 px-2">
              <button
                type="button"
                onClick={() => {
                  setDoctorTab('console');
                  setConsultationAppt(null);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  doctorTab === 'console'
                    ? 'text-[#0066cc]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Stethoscope className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Console</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDoctorTab('schedule');
                  setConsultationAppt(null);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  doctorTab === 'schedule'
                    ? 'text-[#0066cc]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Clock className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDoctorTab('desk');
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  doctorTab === 'desk'
                    ? 'text-[#0066cc]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Desk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDoctorTab('affiliations');
                  setConsultationAppt(null);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  doctorTab === 'affiliations'
                    ? 'text-[#0066cc]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Building2 className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Clinics</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDoctorTab('profile');
                  setConsultationAppt(null);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  doctorTab === 'profile'
                    ? 'text-[#0066cc]'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <User className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Profile</span>
              </button>
            </div>
          </nav>

          <RoleSwitcherModal
            isOpen={roleSwitcherOpen}
            onClose={() => setRoleSwitcherOpen(false)}
            onSelectRole={handleRoleSelect}
          />
        </div>
      </div>
    );
  }

  // 5. PATIENT WORKSPACE (Default for Patients & Guests)
  return (
    <div className="min-h-screen bg-[#ebebee] flex justify-center">
      {/* Mobile-contained layout */}
      <div className="w-full max-w-md min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] md:border-x md:border-[#e5e5ea] flex flex-col relative overflow-x-hidden">
        {/* Top Apple Header for Patient */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#e5e5ea] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo variant="full" size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRoleSwitcherOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:scale-95 transition-all text-xs font-semibold text-[#1d1d1f] cursor-pointer hover:bg-white shadow-2xs"
              title="Switch Workspace Portal"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Portal</span>
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => setPatientTab('profile')}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:scale-95 transition-all text-xs font-semibold text-[#1d1d1f] cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[65px] sm:max-w-[90px]">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-full bg-[#0066cc] active:scale-95 active:bg-[#0055b3] transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Screen Views */}
        <main className="flex-1 w-full pb-20">
          {selectedDoctor ? (
            <DoctorDetailScreen
              doctor={selectedDoctor}
              onBack={() => setSelectedDoctor(null)}
              onSelectSlotForBooking={handleSelectSlotForBooking}
            />
          ) : (
            <>
              {patientTab === 'explore' && (
                <ExploreScreen
                  onSelectDoctor={(doc) => setSelectedDoctor(doc)}
                  onQuickBook={handleQuickBook}
                />
              )}
              {patientTab === 'queue' && (
                <QueuePassScreen
                  onExplorePress={() => setPatientTab('explore')}
                  onOpenAuth={() => setAuthModalOpen(true)}
                />
              )}
              {patientTab === 'checkin' && (
                <CheckInScreen onOpenAuth={() => setAuthModalOpen(true)} />
              )}
              {patientTab === 'history' && (
                <AppointmentsHistoryScreen
                  onOpenAuth={() => setAuthModalOpen(true)}
                  onExplorePress={() => setPatientTab('explore')}
                />
              )}
              {patientTab === 'profile' && (
                <ProfileScreen
                  onOpenAuth={() => setAuthModalOpen(true)}
                  onOpenDoctorConsole={() => {
                    setRoleSwitcherOpen(true);
                  }}
                  onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Apple HIG Bottom Tab Bar for Patient */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-[#e5e5ea] pb-[env(safe-area-inset-bottom)]">
          <div className="w-full max-w-md mx-auto flex items-center justify-around h-14 px-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null);
                setPatientTab('explore');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                patientTab === 'explore' && !selectedDoctor
                  ? 'text-[#0066cc]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Search className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">Explore</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null);
                setPatientTab('queue');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                patientTab === 'queue'
                  ? 'text-[#0066cc]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Ticket className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">Live Pass</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null);
                setPatientTab('checkin');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                patientTab === 'checkin'
                  ? 'text-[#0066cc]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <QrCode className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">Check-In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null);
                setPatientTab('history');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                patientTab === 'history'
                  ? 'text-[#0066cc]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">Visits</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDoctor(null);
                setPatientTab('profile');
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                patientTab === 'profile'
                  ? 'text-[#0066cc]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">Account</span>
            </button>
          </div>
        </nav>

        {/* Booking Modal */}
        {bookingParams.isOpen && bookingParams.doctor && bookingParams.slot && (
          <BookingModal
            isOpen={bookingParams.isOpen}
            onClose={() =>
              setBookingParams((prev) => ({ ...prev, isOpen: false }))
            }
            doctor={bookingParams.doctor}
            clinicId={bookingParams.clinicId}
            clinicName={bookingParams.clinicName}
            slot={bookingParams.slot}
            date={bookingParams.date}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(loggedUser) => {
            if (loggedUser?.role === 'DOCTOR') {
              setDoctorTab('console');
            } else if (loggedUser?.role === 'PATIENT') {
              setPatientTab('explore');
            }
          }}
        />

        {/* Role Switcher Modal */}
        <RoleSwitcherModal
          isOpen={roleSwitcherOpen}
          onClose={() => setRoleSwitcherOpen(false)}
          onSelectRole={handleRoleSelect}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
