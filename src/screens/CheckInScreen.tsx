import React, { useState, useEffect } from 'react';
import { api, Appointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CameraQrScannerModal } from '../components/common/CameraQrScannerModal';
import { AppleButton } from '../components/ui/AppleButton';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleInput } from '../components/ui/AppleInput';
import {
  QrCode,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CheckInScreenProps {
  onOpenAuth: () => void;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchActiveAppointments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getPatientAppointments();
      if (res.success && Array.isArray(res.data)) {
        setAppointments(
          res.data.filter((a: Appointment) => a.status === 'WAITING' || a.status === 'IN_CONSULTATION')
        );
      }
    } catch (e) {
      // non blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAppointments();
  }, [user]);

  const handleProcessCheckIn = async (code: string, appointmentId?: string) => {
    setStatusMessage(null);
    setSubmitting(true);
    const targetAppointmentId = appointmentId || appointments[0]?.id;

    try {
      const res = await api.checkIn(targetAppointmentId, code);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Check-in confirmed! Doctor cabin notified of your arrival.',
        });
        setManualCode('');
        fetchActiveAppointments();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Check-in failed. Please re-check the clinic standee code.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error executing check-in.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea]">
        <h2 className="text-lg font-bold text-[#1d1d1f]">Check-In</h2>
        <p className="text-xs text-[#86868b]">
          Confirm your arrival at the clinic
        </p>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Scan Standee Hero Card */}
        <AppleCard className="text-center p-5 sm:p-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center mx-auto">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1d1d1f]">
              Scan Reception QR
            </h3>
            <p className="text-xs text-[#86868b] mt-1 max-w-xs mx-auto">
              Scan the desk QR standee to confirm your arrival.
            </p>
          </div>

          <AppleButton
            variant="primary"
            size="lg"
            className="w-full"
            icon={<QrCode className="w-4 h-4" />}
            onClick={() => setScannerOpen(true)}
          >
            Scan Standee QR
          </AppleButton>
        </AppleCard>

        {/* Manual Code Input Card */}
        <AppleCard className="space-y-3">
          <h4 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
            Or Enter Clinic Code
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) handleProcessCheckIn(manualCode.trim());
            }}
            className="space-y-3"
          >
            <AppleInput
              placeholder="e.g. CLINIC01"
              value={manualCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualCode(e.target.value)}
            />
            <AppleButton
              variant="secondary"
              size="md"
              className="w-full"
              type="submit"
              loading={submitting}
              disabled={!manualCode.trim()}
            >
              Verify Code
            </AppleButton>
          </form>
        </AppleCard>

        {/* Pending Appointments for Check-in */}
        {user && appointments.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider px-1 block">
              Active Visits ({appointments.length})
            </span>
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white p-3.5 rounded-2xl border border-[#e5e5ea] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#0066cc]">
                      #{String(appt.queueNumber).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-[#1d1d1f]">
                      {appt.doctor?.user?.fullName?.toLowerCase().startsWith('dr.')
                        ? appt.doctor.user.fullName
                        : `Dr. ${appt.doctor?.user?.fullName || 'Doctor'}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    {appt.clinic?.name} • {appt.date}
                  </p>
                </div>

                {appt.isCheckedIn ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Checked In
                  </span>
                ) : (
                  <AppleButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setScannerOpen(true)}
                  >
                    Check In
                  </AppleButton>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CameraQrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(code: string) => handleProcessCheckIn(code)}
      />
    </div>
  );
};
