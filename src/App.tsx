import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config/auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DoctorProfile, DoctorSlot, Appointment, api, parseDoctorSlots } from './services/api';
import { BrandLogo } from './components/ui/BrandLogo';
import { AppleCard } from './components/ui/AppleCard';
import { AppleButton } from './components/ui/AppleButton';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import {
  AppRole,
  RoleGatewayScreen,
  getStoredSelectedRole,
  saveSelectedRole,
} from './screens/RoleGatewayScreen';

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

// Clinic & Receptionist Workspaces
import { ClinicDashboardScreen, ClinicTab } from './screens/clinic/ClinicDashboardScreen';
import { ReceptionistDashboardScreen, ReceptionistTab } from './screens/receptionist/ReceptionistDashboardScreen';

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
  RefreshCw,
  TrendingUp,
  Users,
  CheckCircle2,
  Bell,
} from 'lucide-react';

type PatientTab = 'explore' | 'queue' | 'checkin' | 'history' | 'profile';
type DoctorTab = 'console' | 'schedule' | 'desk' | 'affiliations' | 'profile';

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

      <div className="p-4 space-y-4">
        {/* Active Cabin Consultation */}
        {inCabin ? (
          <AppleCard className="space-y-3 border-emerald-300/80 bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                Currently In Cabin
              </span>
              <span className="text-xs font-semibold text-[#86868b]">
                Token #{String(inCabin.queueNumber).padStart(2, '0')}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1d1d1f]">
                {inCabin.patientName}
              </h3>
              <p className="text-xs text-[#86868b]">
                {inCabin.patientAge ? `${inCabin.patientAge} yrs • ` : ''}
                {inCabin.patientGender || 'Patient'}
                {inCabin.reasonForVisit ? ` • ${inCabin.reasonForVisit}` : ''}
              </p>
            </div>

            <AppleButton
              variant="primary"
              size="md"
              className="w-full text-xs"
              onClick={() => onSelectAppointment(inCabin)}
            >
              Open Digital Rx & Observations
            </AppleButton>
          </AppleCard>
        ) : (
          <div className="p-4 bg-white rounded-2xl border border-[#e5e5ea] text-center text-xs text-[#86868b]">
            No patient currently inside the cabin. Call next patient from the waiting queue.
          </div>
        )}

        {/* Waiting Queue List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
              Waiting Patients ({waitingPatients.length})
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-[#86868b]">Loading queue...</div>
          ) : waitingPatients.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-[#e5e5ea] text-center text-xs text-[#86868b]">
              Queue is clear. No waiting patients.
            </div>
          ) : (
            waitingPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white p-3.5 rounded-2xl border border-[#e5e5ea] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#0066cc]">
                    #{String(patient.queueNumber).padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#1d1d1f]">{patient.patientName}</h4>
                    <p className="text-[11px] text-[#86868b]">
                      {patient.checkingWindow || 'Today'}
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
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { user, login } = useAuth();

  // Role Gate & Navigation State
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [roleLoaded, setRoleLoaded] = useState<boolean>(false);
  const [roleGatewayOpen, setRoleGatewayOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  // Tab states for each portal
  const [patientTab, setPatientTab] = useState<PatientTab>('explore');
  const [doctorTab, setDoctorTab] = useState<DoctorTab>('console');
  const [clinicTab, setClinicTab] = useState<ClinicTab>('kpi');
  const [receptionistTab, setReceptionistTab] = useState<ReceptionistTab>('walkin');

  // Active items
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [consultationAppt, setConsultationAppt] = useState<Appointment | null>(null);
  const [selectedClinicForSchedule, setSelectedClinicForSchedule] = useState<string | null>(null);

  // Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Booking Modal State
  const [bookingParams, setBookingParams] = useState<{
    isOpen: boolean;
    doctor: DoctorProfile | null;
    clinicId: string;
    clinicName: string;
    slot: DoctorSlot | null;
    date: string;
    consultationFee?: number;
  }>({
    isOpen: false,
    doctor: null,
    clinicId: '',
    clinicName: '',
    slot: null,
    date: '',
    consultationFee: undefined,
  });

  // Role switching helper
  const handleRoleSelect = async (role: AppRole) => {
    setActiveRole(role);
    await saveSelectedRole(role);
    setRoleGatewayOpen(false);
    setRoleSwitcherOpen(false);

    if (role === 'DOCTOR') {
      setDoctorTab('console');
      setConsultationAppt(null);
    } else if (role === 'PATIENT') {
      setPatientTab('explore');
      setSelectedDoctor(null);
    } else if (role === 'CLINIC') {
      setClinicTab('kpi');
    } else if (role === 'RECEPTIONIST') {
      setReceptionistTab('walkin');
    }
  };

  // On initial launch: retrieve saved role or present "Who are you?" gateway
  useEffect(() => {
    const initRole = async () => {
      const stored = await getStoredSelectedRole();
      if (user?.role && ['PATIENT', 'DOCTOR', 'CLINIC', 'RECEPTIONIST'].includes(user.role)) {
        const uRole = user.role as AppRole;
        setActiveRole(uRole);
        await saveSelectedRole(uRole);
      } else if (stored) {
        setActiveRole(stored);
      }
      setRoleLoaded(true);
    };
    initRole();
  }, []);

  // Whenever user state changes (e.g. login / demo login), synchronize active workspace
  useEffect(() => {
    if (roleLoaded && user?.role && ['PATIENT', 'DOCTOR', 'CLINIC', 'RECEPTIONIST'].includes(user.role)) {
      const uRole = user.role as AppRole;
      if (activeRole !== uRole) {
        handleRoleSelect(uRole);
      }
    }
  }, [user, roleLoaded]);

  const handleQuickBook = (doctor: DoctorProfile) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const firstClinicAffiliation = doctor.clinics?.[0];
    const effectiveFee = firstClinicAffiliation?.consultationFee ?? doctor.consultationFee ?? 500;
    const schedule = firstClinicAffiliation
      ? {
          clinicId: firstClinicAffiliation.clinicId,
          clinicName: firstClinicAffiliation.clinic?.clinicName || 'Clinic',
          slots: (firstClinicAffiliation.slots && firstClinicAffiliation.slots.length > 0)
            ? firstClinicAffiliation.slots
            : parseDoctorSlots(doctor),
        }
      : doctor.schedules?.[0] || {
          clinicId: doctor.id || 'cabin',
          clinicName: doctor.clinicAddress ? 'Clinical Cabin' : 'Outpatient Cabin',
          slots: parseDoctorSlots(doctor),
        };

    const slot = (Array.isArray(schedule.slots) && schedule.slots.length > 0)
      ? schedule.slots[0]
      : parseDoctorSlots(doctor)[0];

    setBookingParams({
      isOpen: true,
      doctor,
      clinicId: schedule.clinicId,
      clinicName: schedule.clinicName,
      slot,
      date: today,
      consultationFee: effectiveFee,
    });
  };

  const handleSelectSlotForBooking = (params: {
    doctor: DoctorProfile;
    clinicId: string;
    clinicName: string;
    slot: DoctorSlot;
    date: string;
    consultationFee?: number;
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
      consultationFee: params.consultationFee,
    });
  };

  const handleBookingSuccess = () => {
    setSelectedDoctor(null);
    setPatientTab('queue');
  };

  // Splash loading while reading preferences
  if (!roleLoaded) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Gateway: If no role selected yet or user chose "Switch Role", display "Who are you?" Apple HIG selection
  if (!activeRole || roleGatewayOpen) {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-[#f5f5f7] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] md:border-x md:border-[#e5e5ea] flex flex-col relative overflow-x-hidden">
          <RoleGatewayScreen
            onSelectRole={handleRoleSelect}
            currentRole={activeRole}
            isSwitching={!!activeRole && roleGatewayOpen}
            onCancel={activeRole ? () => setRoleGatewayOpen(false) : undefined}
            onDemoLogin={async (email, pass, role) => {
              await login(email, pass);
              handleRoleSelect(role);
            }}
          />
        </div>
      </div>
    );
  }

  // 1. CLINIC WORKSPACE
  if (activeRole === 'CLINIC') {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] md:border-x md:border-[#e5e5ea] flex flex-col relative overflow-x-hidden">
          {/* Top Apple Header for Clinic (clean, uncluttered - no role pill) */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#e5e5ea] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo variant="full" size="sm" />
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => setClinicTab('profile')}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:scale-95 transition-all text-xs font-semibold text-[#1d1d1f] cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'C'}
                  </div>
                  <span className="truncate max-w-[75px] sm:max-w-[95px]">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-full bg-[#0066cc] active:scale-95 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 w-full pb-20">
            <ClinicDashboardScreen
              onOpenRoleSwitcher={() => setRoleGatewayOpen(true)}
              activeTab={clinicTab}
              onTabChange={(tab) => setClinicTab(tab)}
            />
          </main>

          {/* Fixed Bottom Tab Navigation for Clinic */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#e5e5ea] safe-area-bottom">
            <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
              <button
                type="button"
                onClick={() => setClinicTab('kpi')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  clinicTab === 'kpi' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <TrendingUp className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">KPIs</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicTab('doctors')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  clinicTab === 'doctors' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Stethoscope className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Doctors</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicTab('receptionists')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  clinicTab === 'receptionists' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Users className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Desk</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicTab('standee')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  clinicTab === 'standee' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <QrCode className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Clinic QR</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicTab('profile')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  clinicTab === 'profile' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Building2 className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Profile</span>
              </button>
            </div>
          </nav>

          <RoleSwitcherModal
            isOpen={roleSwitcherOpen}
            onClose={() => setRoleSwitcherOpen(false)}
            currentRole={activeRole}
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
  if (activeRole === 'RECEPTIONIST') {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] md:border-x md:border-[#e5e5ea] flex flex-col relative overflow-x-hidden">
          {/* Top Apple Header for Receptionist (clean, uncluttered - no role pill) */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#e5e5ea] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo variant="full" size="sm" />
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => setReceptionistTab('notifications')}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:scale-95 transition-all text-xs font-semibold text-[#1d1d1f] cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'R'}
                  </div>
                  <span className="truncate max-w-[75px] sm:max-w-[95px]">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-full bg-[#0066cc] active:scale-95 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 w-full pb-20">
            <ReceptionistDashboardScreen
              onOpenRoleSwitcher={() => setRoleGatewayOpen(true)}
              activeTab={receptionistTab}
              onTabChange={(tab) => setReceptionistTab(tab)}
            />
          </main>

          {/* Fixed Bottom Tab Navigation for Receptionist */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#e5e5ea] safe-area-bottom">
            <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
              <button
                type="button"
                onClick={() => setReceptionistTab('walkin')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  receptionistTab === 'walkin' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Ticket className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Token</span>
              </button>

              <button
                type="button"
                onClick={() => setReceptionistTab('queue')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  receptionistTab === 'queue' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Clock className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Queue</span>
              </button>

              <button
                type="button"
                onClick={() => setReceptionistTab('pending')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  receptionistTab === 'pending' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Approvals</span>
              </button>

              <button
                type="button"
                onClick={() => setReceptionistTab('cabin')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  receptionistTab === 'cabin' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Stethoscope className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Cabin</span>
              </button>

              <button
                type="button"
                onClick={() => setReceptionistTab('notifications')}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none cursor-pointer active:scale-95 ${
                  receptionistTab === 'notifications' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                <Bell className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold tracking-tight">Alerts</span>
              </button>
            </div>
          </nav>

          <RoleSwitcherModal
            isOpen={roleSwitcherOpen}
            onClose={() => setRoleSwitcherOpen(false)}
            currentRole={activeRole}
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

  // 3. DOCTOR WORKSPACE
  if (activeRole === 'DOCTOR') {
    return (
      <div className="min-h-screen bg-[#ebebee] flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] md:border-x md:border-[#e5e5ea] flex flex-col relative overflow-x-hidden">
          {/* Top Apple Header for Doctor (clean, uncluttered - no role pill) */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#e5e5ea] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo variant="full" size="sm" />
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => setDoctorTab('profile')}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:scale-95 transition-all text-xs font-semibold text-[#1d1d1f] cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'D'}
                  </div>
                  <span className="truncate max-w-[75px] sm:max-w-[95px]">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-full bg-[#0066cc] active:scale-95 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
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
                onOpenSchedule={(clinicId) => {
                  if (clinicId) setSelectedClinicForSchedule(clinicId);
                  setDoctorTab('schedule');
                }}
                onOpenAffiliations={() => setDoctorTab('affiliations')}
                onOpenRoleSwitcher={() => setRoleGatewayOpen(true)}
              />
            )}
            {doctorTab === 'schedule' && (
              <ManageScheduleScreen
                onBack={() => setDoctorTab('console')}
                initialClinicId={selectedClinicForSchedule || undefined}
                onNavigateToAffiliations={() => setDoctorTab('affiliations')}
              />
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
              <DoctorAffiliationsScreen
                onBack={() => setDoctorTab('console')}
                onManageClinicSchedule={(clinicId) => {
                  setSelectedClinicForSchedule(clinicId);
                  setDoctorTab('schedule');
                }}
              />
            )}
            {doctorTab === 'profile' && (
              <DoctorProfileScreen
                onBack={() => setDoctorTab('console')}
                onOpenRoleSwitcher={() => setRoleGatewayOpen(true)}
                onNavigateToAffiliations={() => setDoctorTab('affiliations')}
                onNavigateToSchedule={() => setDoctorTab('schedule')}
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
            currentRole={activeRole}
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

  // 4. PATIENT WORKSPACE (Default for Patient role)
  return (
    <div className="min-h-screen bg-[#ebebee] flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#f5f5f7] text-[#1d1d1f] md:shadow-[0_0_60px_rgba(0,0,0,0.06)] md:border-x md:border-[#e5e5ea] flex flex-col relative overflow-x-hidden">
        {/* Top Apple Header for Patient (clean, uncluttered - no role pill) */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#e5e5ea] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo variant="full" size="sm" />
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => setPatientTab('profile')}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:scale-95 transition-all text-xs font-semibold text-[#1d1d1f] cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[75px] sm:max-w-[95px]">
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
                    handleRoleSelect('DOCTOR');
                  }}
                  onOpenRoleSwitcher={() => setRoleGatewayOpen(true)}
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
            consultationFee={bookingParams.consultationFee}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(loggedUser) => {
            if (loggedUser?.role && ['PATIENT', 'DOCTOR', 'CLINIC', 'RECEPTIONIST'].includes(loggedUser.role)) {
              handleRoleSelect(loggedUser.role as AppRole);
            }
          }}
        />

        {/* Role Switcher Modal */}
        <RoleSwitcherModal
          isOpen={roleSwitcherOpen}
          onClose={() => setRoleSwitcherOpen(false)}
          currentRole={activeRole}
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
