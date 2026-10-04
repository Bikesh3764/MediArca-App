import React, { useState, useEffect } from 'react';
import {
  api,
  Appointment,
  DoctorAffiliationsData,
  DoctorAffiliationClinic,
  getLocalDateString,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import { ClinicQrStandeeModal } from '../components/common/ClinicQrStandeeModal';
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
  Sparkles,
  Building2,
  QrCode,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface DoctorConsoleScreenProps {
  onBack: () => void;
  onOpenConsultation?: (appointment: Appointment) => void;
  onOpenSchedule?: (clinicId?: string) => void;
  onOpenAffiliations?: () => void;
  onOpenRoleSwitcher?: () => void;
}

export const DoctorConsoleScreen: React.FC<DoctorConsoleScreenProps> = ({
  onBack,
  onOpenConsultation,
  onOpenSchedule,
  onOpenAffiliations,
  onOpenRoleSwitcher,
}) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [affiliations, setAffiliations] = useState<DoctorAffiliationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCabinStatus, setCurrentCabinStatus] = useState<
    'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN'
  >((user?.doctorProfile?.cabinStatus as any) || 'IN_CABIN');
  const [notes, setNotes] = useState('');
  const [callingPatientId, setCallingPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.doctorProfile?.cabinStatus) {
      setCurrentCabinStatus(user.doctorProfile.cabinStatus as any);
    }
  }, [user]);

  // Standee Modal
  const [standeeModalOpen, setStandeeModalOpen] = useState(false);
  const [selectedStandeeClinic, setSelectedStandeeClinic] = useState<{
    clinicId: string;
    clinicName: string;
    clinicAddress?: string;
    clinicPhone?: string;
    checkinCode?: string;
  } | null>(null);

  const fetchDoctorQueue = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const today = getLocalDateString();
      const [queueRes, affRes] = await Promise.all([
        api.getDoctorQueue(today),
        api.getDoctorAffiliations(),
      ]);

      if (queueRes.success && queueRes.data) {
        if (Array.isArray(queueRes.data)) {
          setQueue(queueRes.data);
        } else if (Array.isArray((queueRes.data as any).allAppointments)) {
          setQueue((queueRes.data as any).allAppointments);
        } else if (Array.isArray((queueRes.data as any).waitingQueue)) {
          const w = (queueRes.data as any).waitingQueue || [];
          const a = (queueRes.data as any).activeInConsultation;
          const c = (queueRes.data as any).completedQueue || [];
          setQueue([...(a ? [a] : []), ...w, ...c]);
        }
      }
      if (affRes.success && affRes.data) {
        setAffiliations(affRes.data);
      }
    } catch (e) {
      console.error('Failed to fetch doctor console data:', e);
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

  const handleUpdatePresence = async (
    status: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN',
    minutes?: number
  ) => {
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
      // 1. Ensure doctor presence is set to IN_CABIN so callPatient doesn't reject with 400
      if (currentCabinStatus !== 'IN_CABIN') {
        await handleUpdatePresence('IN_CABIN');
      }

      // 2. Auto check-in patient if arrival was not marked to prevent backend 400 rejection
      const target = queue.find((p) => p.id === appointmentId);
      if (target && !target.isCheckedIn) {
        await api.checkInAppointmentDirect(appointmentId, true);
      }

      const res = await api.callPatient(appointmentId);
      if (res.success) {
        fetchDoctorQueue(true);
      } else {
        alert(res.message || 'Failed to call patient');
      }
    } catch (e: any) {
      alert(e.message || 'Error calling patient');
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
      alert(e.message || 'Error completing visit');
    }
  };

  const inCabinPatient = queue.find((a) => a.status === 'IN_CONSULTATION');
  const waitingPatients = queue.filter((a) => a.status === 'WAITING');

  const affiliatedClinicsCount = affiliations?.clinics?.length || 0;
  const pendingRequestsCount =
    (affiliations?.incomingRequests?.length || 0) +
    (affiliations?.outgoingRequests?.length || 0);

  return (
    <div className="flex flex-col min-h-full pb-safe">
      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Presence Controls Card */}
        <AppleCard className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider block">
              Cabin Presence
            </span>
            {affiliations?.clinics && affiliations.clinics.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const firstClinic = affiliations.clinics[0];
                  setSelectedStandeeClinic({
                    clinicId: firstClinic.clinicId,
                    clinicName: firstClinic.clinicName,
                    clinicAddress: `${firstClinic.address || ''}${firstClinic.city ? `, ${firstClinic.city}` : ''}`,
                    clinicPhone: firstClinic.phone || '',
                    checkinCode: (firstClinic as any).checkinCode || '',
                  });
                  setStandeeModalOpen(true);
                }}
                className="text-[11px] font-semibold text-[#0066cc] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Standee</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleUpdatePresence('IN_CABIN')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                currentCabinStatus === 'IN_CABIN'
                  ? 'bg-emerald-600 text-white border-emerald-600'
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
                  ? 'bg-amber-500 text-white border-amber-500'
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
                  ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
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
                placeholder="Consultation summary or prescription..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-white border border-emerald-200 focus:border-emerald-500 outline-none resize-none h-20"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onOpenConsultation && (
                <AppleButton
                  variant="secondary"
                  size="md"
                  className="flex-1 text-xs"
                  onClick={() => onOpenConsultation(inCabinPatient)}
                >
                  Clinical Desk & Rx
                </AppleButton>
              )}
              <AppleButton
                variant="success"
                size="md"
                className="flex-1"
                icon={<Check className="w-4 h-4" />}
                onClick={() => handleCompleteConsultation(inCabinPatient.id)}
              >
                Complete Visit
              </AppleButton>
            </div>
          </AppleCard>
        )}

        {/* Waiting List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                Waiting Queue ({waitingPatients.length})
              </span>
              <button
                type="button"
                onClick={() => fetchDoctorQueue(true)}
                disabled={refreshing}
                className="p-1 rounded-full text-[#86868b] hover:text-[#0066cc] active:scale-95 transition-all cursor-pointer"
                title="Refresh Queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#0066cc]' : ''}`} />
              </button>
            </div>
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
            <div className="p-8 text-center text-xs text-[#86868b] bg-white rounded-2xl border border-[#e5e5ea]">
              Loading queue...
            </div>
          ) : waitingPatients.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-[#e5e5ea] text-center text-xs text-[#86868b]">
              No patients waiting in queue right now.
            </div>
          ) : (
            waitingPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white p-3.5 rounded-2xl border border-[#e5e5ea] flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base font-black text-[#0066cc] w-7 shrink-0">
                    #{String(patient.queueNumber).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#1d1d1f] truncate">
                      {patient.patientName}
                    </h4>
                    <div className="text-[11px] text-[#86868b] truncate mt-0.5">
                      {patient.isCheckedIn ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Checked In
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await api.checkInAppointmentDirect(patient.id, true);
                            fetchDoctorQueue(true);
                          }}
                          className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium hover:bg-amber-100 cursor-pointer"
                        >
                          Mark In Cabin
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenConsultation && (
                    <AppleButton
                      size="sm"
                      variant="secondary"
                      className="text-xs px-2.5"
                      onClick={() => onOpenConsultation(patient)}
                    >
                      Desk
                    </AppleButton>
                  )}
                  <AppleButton
                    size="sm"
                    variant="ghost"
                    loading={callingPatientId === patient.id}
                    onClick={() => handleCallPatient(patient.id)}
                  >
                    Call
                  </AppleButton>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Standee Modal */}
      {selectedStandeeClinic && (
        <ClinicQrStandeeModal
          isOpen={standeeModalOpen}
          onClose={() => {
            setStandeeModalOpen(false);
            setSelectedStandeeClinic(null);
          }}
          clinicId={selectedStandeeClinic.clinicId}
          clinicName={selectedStandeeClinic.clinicName}
          clinicAddress={selectedStandeeClinic.clinicAddress}
          clinicPhone={selectedStandeeClinic.clinicPhone}
          checkinCode={selectedStandeeClinic.checkinCode}
        />
      )}
    </div>
  );
};
