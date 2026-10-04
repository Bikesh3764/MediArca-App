import React, { useState, useEffect } from 'react';
import { api, Appointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  LogIn,
} from 'lucide-react';

interface AppointmentsHistoryScreenProps {
  onOpenAuth: () => void;
  onExplorePress: () => void;
}

export const AppointmentsHistoryScreen: React.FC<AppointmentsHistoryScreenProps> = ({
  onOpenAuth,
  onExplorePress,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await api.getPatientAppointments();
        if (res.success && Array.isArray(res.data)) {
          // Sort descending by date
          const sorted = [...res.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAppointments(sorted);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center pb-safe">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-2xs border border-[#e5e5ea] flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-[#0066cc]" />
        </div>
        <h3 className="text-lg font-bold text-[#1d1d1f]">Visit History</h3>
        <p className="text-xs text-[#86868b] max-w-xs mt-1 mb-5">
          Sign in to view your consultation history and queue tokens.
        </p>
        <AppleButton
          variant="primary"
          size="lg"
          icon={<LogIn className="w-4 h-4" />}
          onClick={onOpenAuth}
        >
          Sign In
        </AppleButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-safe">
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea]">
        <h2 className="text-lg font-bold text-[#1d1d1f]">Visits</h2>
        <p className="text-xs text-[#86868b]">Past and upcoming consultations</p>
      </div>

      <div className="p-4 space-y-3.5">
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-[#e5e5ea] animate-pulse space-y-2"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 px-4 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-2xs border border-[#e5e5ea] flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-[#86868b]" />
            </div>
            <h4 className="text-base font-bold text-[#1d1d1f]">No Visits Yet</h4>
            <p className="text-xs text-[#86868b] mt-1 mb-5">
              Your consultation records will appear here.
            </p>
            <AppleButton variant="primary" size="md" onClick={onExplorePress}>
              Find a Doctor
            </AppleButton>
          </div>
        ) : (
          appointments.map((appt) => {
            const isCompleted = appt.status === 'COMPLETED';
            const isCancelled = appt.status === 'CANCELLED';
            const isWaiting = appt.status === 'WAITING';
            const isInCabin = appt.status === 'IN_CONSULTATION';

            return (
              <AppleCard key={appt.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black text-[#0066cc]">
                      Token #{String(appt.queueNumber).padStart(2, '0')}
                    </span>
                    <h4 className="text-sm font-bold text-[#1d1d1f] mt-0.5">
                      {appt.doctor?.user?.fullName?.toLowerCase().startsWith('dr.')
                        ? appt.doctor.user.fullName
                        : `Dr. ${appt.doctor?.user?.fullName || 'Practitioner'}`}
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      {appt.doctor?.specialty}
                    </p>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea]'
                        : isCancelled
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isInCabin
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-[#0066cc] border-blue-200'
                    }`}
                  >
                    {isCompleted
                      ? 'Completed'
                      : isCancelled
                      ? 'Cancelled'
                      : isInCabin
                      ? 'In Cabin'
                      : 'Waiting'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#86868b] pt-2 border-t border-[#f0f0f2]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>{appt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <User className="w-3.5 h-3.5 text-[#86868b]" />
                    <span>{appt.isForOther ? appt.patientName : 'Myself'}</span>
                  </div>
                </div>

                {appt.consultationNotes && (
                  <div className="bg-[#fafafc] p-2.5 rounded-xl border border-[#f0f0f2] text-xs">
                    <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-0.5">
                      Doctor's Notes
                    </span>
                    <p className="text-[#1d1d1f] leading-relaxed">{appt.consultationNotes}</p>
                  </div>
                )}
              </AppleCard>
            );
          })
        )}
      </div>
    </div>
  );
};
