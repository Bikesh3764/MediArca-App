import React, { useState, useEffect } from 'react';
import { api, Appointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import { DoctorPresenceBadge } from '../components/ui/DoctorPresenceBadge';
import {
  Users,
  Bell,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Coffee,
  Check,
  RefreshCw,
  FileText,
  User,
} from 'lucide-react';

interface DoctorConsoleScreenProps {
  onBack: () => void;
}

export const DoctorConsoleScreen: React.FC<DoctorConsoleScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCabinStatus, setCurrentCabinStatus] = useState<'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN'>('IN_CABIN');
  const [notes, setNotes] = useState('');
  const [callingPatientId, setCallingPatientId] = useState<string | null>(null);

  const fetchDoctorQueue = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.getDoctorQueue(today);
      if (res.success && Array.isArray(res.data)) {
        setQueue(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch doctor queue:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorQueue();
    const interval = setInterval(() => {
      fetchDoctorQueue(false);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdatePresence = async (status: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN', minutes?: number) => {
    setCurrentCabinStatus(status);
    try {
      await api.updateCabinStatus(status, minutes);
    } catch (e) {
      console.error('Presence error:', e);
    }
  };

  const handleCallPatient = async (appointmentId: string) => {
    setCallingPatientId(appointmentId);
    try {
      const res = await api.callPatient(appointmentId);
      if (res.success) {
        fetchDoctorQueue(true);
      } else {
        alert(res.message || 'Failed to call patient');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally {
      setCallingPatientId(null);
    }
  };

  const handleCompleteConsultation = async (appointmentId: string) => {
    try {
      const res = await api.completeConsultation(appointmentId, notes.trim() || undefined);
      if (res.success) {
        setNotes('');
        fetchDoctorQueue(true);
      } else {
        alert(res.message || 'Failed to complete visit');
      }
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  const inCabinPatient = queue.find((a) => a.status === 'IN_CONSULTATION');
  const waitingPatients = queue.filter((a) => a.status === 'WAITING');

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-[#1d1d1f]">Doctor Console</h2>
            <p className="text-[11px] text-[#86868b]">Dr. {user?.fullName}</p>
          </div>
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
        {/* Presence Controls Card */}
        <AppleCard className="space-y-3">
          <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider block">
            Cabin Presence
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleUpdatePresence('IN_CABIN')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                currentCabinStatus === 'IN_CABIN'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-[#fafafc] text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7]'
              }`}
            >
              In Cabin
            </button>
            <button
              type="button"
              onClick={() => handleUpdatePresence('STEPPED_OUT', 15)}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                currentCabinStatus === 'STEPPED_OUT'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-[#fafafc] text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7]'
              }`}
            >
              Step Out
            </button>
            <button
              type="button"
              onClick={() => handleUpdatePresence('NOT_IN_CABIN')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                currentCabinStatus === 'NOT_IN_CABIN'
                  ? 'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs'
                  : 'bg-[#fafafc] text-[#1d1d1f] border-[#e5e5ea] hover:bg-[#f5f5f7]'
              }`}
            >
              Off Duty
            </button>
          </div>
        </AppleCard>

        {/* Current Patient In Cabin */}
        {inCabinPatient && (
          <AppleCard className="bg-emerald-50/50 border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                In Cabin
              </span>
              <span className="text-sm font-black text-emerald-700">
                #{String(inCabinPatient.queueNumber).padStart(2, '0')}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1d1d1f]">
                {inCabinPatient.patientName}
              </h3>
              <p className="text-xs text-[#86868b]">
                {inCabinPatient.patientAge ? `${inCabinPatient.patientAge} yrs • ` : ''}
                {inCabinPatient.patientGender || 'Patient'}
                {inCabinPatient.reasonForVisit ? ` • ${inCabinPatient.reasonForVisit}` : ''}
              </p>
            </div>

            <div className="pt-1">
              <textarea
                placeholder="Prescription or consultation summary notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-white border border-emerald-200 focus:border-emerald-500 outline-none resize-none h-20"
              />
            </div>

            <AppleButton
              variant="success"
              size="md"
              className="w-full"
              icon={<Check className="w-4 h-4" />}
              onClick={() => handleCompleteConsultation(inCabinPatient.id)}
            >
              Complete Visit
            </AppleButton>
          </AppleCard>
        )}

        {/* Waiting List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Waiting Queue ({waitingPatients.length})
            </span>
            {waitingPatients.length > 0 && (
              <AppleButton
                size="sm"
                variant="primary"
                loading={callingPatientId === waitingPatients[0].id}
                icon={<Bell className="w-3.5 h-3.5" />}
                onClick={() => handleCallPatient(waitingPatients[0].id)}
              >
                Call Next (#{waitingPatients[0].queueNumber})
              </AppleButton>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#86868b]">Loading queue...</div>
          ) : waitingPatients.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-[#e5e5ea] text-center text-xs text-[#86868b]">
              No patients waiting in queue right now.
            </div>
          ) : (
            waitingPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white p-3.5 rounded-2xl border border-[#e5e5ea] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-[#0066cc] w-7">
                    #{String(patient.queueNumber).padStart(2, '0')}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#1d1d1f]">
                      {patient.patientName}
                    </h4>
                    <p className="text-[11px] text-[#86868b]">
                      {patient.isCheckedIn ? (
                        <span className="text-emerald-700 font-medium">Checked In</span>
                      ) : (
                        <span>Desk Check-in Pending</span>
                      )}
                    </p>
                  </div>
                </div>

                <AppleButton
                  size="sm"
                  variant="ghost"
                  loading={callingPatientId === patient.id}
                  onClick={() => handleCallPatient(patient.id)}
                >
                  Call
                </AppleButton>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
