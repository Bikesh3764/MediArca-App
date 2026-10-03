import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DoctorProfile, DoctorSlot } from './services/api';
import { ExploreScreen } from './screens/ExploreScreen';
import { DoctorDetailScreen } from './screens/DoctorDetailScreen';
import { BookingModal } from './screens/BookingModal';
import { QueuePassScreen } from './screens/QueuePassScreen';
import { CheckInScreen } from './screens/CheckInScreen';
import { AppointmentsHistoryScreen } from './screens/AppointmentsHistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DoctorConsoleScreen } from './screens/DoctorConsoleScreen';
import { AuthModal } from './screens/AuthModal';
import {
  Search,
  Ticket,
  QrCode,
  Calendar,
  User,
  Stethoscope,
} from 'lucide-react';

type Tab = 'explore' | 'queue' | 'checkin' | 'history' | 'profile' | 'doctor_console';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);

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

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
    setActiveTab('queue');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Top Branding Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066cc] to-[#10b981] flex items-center justify-center shadow-xs">
            <span className="text-sm font-bold text-white tracking-tight">M</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1d1d1f] tracking-tight leading-none">
              MediArca
            </h1>
            <p className="text-[10px] text-[#86868b] leading-tight">
              Clinical Queues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] active:bg-[#e5e5ea] text-xs font-medium text-[#1d1d1f]"
            >
              <div className="w-4 h-4 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[9px] font-bold">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <span className="truncate max-w-[80px]">
                {user.fullName.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-xs font-semibold text-[#0066cc] px-3 py-1 rounded-full bg-[#0066cc]/10 active:bg-[#0066cc]/20 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Screen Views */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {activeTab === 'doctor_console' ? (
          <DoctorConsoleScreen onBack={() => setActiveTab('profile')} />
        ) : selectedDoctor ? (
          <DoctorDetailScreen
            doctor={selectedDoctor}
            onBack={() => setSelectedDoctor(null)}
            onSelectSlotForBooking={handleSelectSlotForBooking}
          />
        ) : (
          <>
            {activeTab === 'explore' && (
              <ExploreScreen
                onSelectDoctor={(doc) => setSelectedDoctor(doc)}
                onQuickBook={handleQuickBook}
              />
            )}
            {activeTab === 'queue' && (
              <QueuePassScreen
                onExplorePress={() => setActiveTab('explore')}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}
            {activeTab === 'checkin' && (
              <CheckInScreen onOpenAuth={() => setAuthModalOpen(true)} />
            )}
            {activeTab === 'history' && (
              <AppointmentsHistoryScreen
                onOpenAuth={() => setAuthModalOpen(true)}
                onExplorePress={() => setActiveTab('explore')}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen
                onOpenAuth={() => setAuthModalOpen(true)}
                onOpenDoctorConsole={() => setActiveTab('doctor_console')}
              />
            )}
          </>
        )}
      </main>

      {/* Apple HIG Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#e5e5ea] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-lg mx-auto flex items-center justify-around h-15 px-2">
          <button
            onClick={() => {
              setSelectedDoctor(null);
              setActiveTab('explore');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none ${
              activeTab === 'explore' && !selectedDoctor
                ? 'text-[#0066cc]'
                : 'text-[#86868b] active:text-[#1d1d1f]'
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold tracking-tight">Explore</span>
          </button>

          <button
            onClick={() => {
              setSelectedDoctor(null);
              setActiveTab('queue');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none relative ${
              activeTab === 'queue'
                ? 'text-[#0066cc]'
                : 'text-[#86868b] active:text-[#1d1d1f]'
            }`}
          >
            <Ticket className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold tracking-tight">Live Pass</span>
          </button>

          <button
            onClick={() => {
              setSelectedDoctor(null);
              setActiveTab('checkin');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none ${
              activeTab === 'checkin'
                ? 'text-[#0066cc]'
                : 'text-[#86868b] active:text-[#1d1d1f]'
            }`}
          >
            <QrCode className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold tracking-tight">Check-In</span>
          </button>

          <button
            onClick={() => {
              setSelectedDoctor(null);
              setActiveTab('history');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none ${
              activeTab === 'history'
                ? 'text-[#0066cc]'
                : 'text-[#86868b] active:text-[#1d1d1f]'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-semibold tracking-tight">Visits</span>
          </button>

          <button
            onClick={() => {
              setSelectedDoctor(null);
              setActiveTab('profile');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none ${
              activeTab === 'profile'
                ? 'text-[#0066cc]'
                : 'text-[#86868b] active:text-[#1d1d1f]'
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
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
