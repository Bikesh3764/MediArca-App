import React, { useState, useEffect } from 'react';
import { api, Appointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LiveQueuePass } from '../components/queue/LiveQueuePass';
import { CameraQrScannerModal } from '../components/common/CameraQrScannerModal';
import { AppleButton } from '../components/ui/AppleButton';
import { AppleCard } from '../components/ui/AppleCard';
import {
  Ticket,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  LogIn,
} from 'lucide-react';

interface QueuePassScreenProps {
  onExplorePress: () => void;
  onOpenAuth: () => void;
}

export const QueuePassScreen: React.FC<QueuePassScreenProps> = ({
  onExplorePress,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAppointments = async (showRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (showRefresh) setRefreshing(true);

    try {
      const res = await api.getPatientAppointments();
      if (res.success && Array.isArray(res.data)) {
        setAppointments(res.data);
      }
    } catch (e) {
      console.error('Error fetching appointments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Auto-poll every 8 seconds for live queue updates
    const interval = setInterval(() => {
      fetchAppointments(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [user]);

  // Active appointments are WAITING, IN_CONSULTATION, or PENDING (awaiting front-desk confirmation)
  const activeAppointments = appointments.filter(
    (a) =>
      a.status === 'WAITING' ||
      a.status === 'IN_CONSULTATION' ||
      a.status === 'PENDING' ||
      a.status === 'PENDING_APPROVAL'
  );

  const handleScanSuccess = async (scannedText: string) => {
    setScannerOpen(false);
    setScanMessage(null);

    // If active appointment exists, check it in
    const activeAppt = activeAppointments[0];
    const clinicId = activeAppt?.clinicId || (activeAppt?.clinic as any)?.id;
    try {
      const res = await api.checkIn(activeAppt?.id, scannedText, clinicId);
      if (res.success) {
        setScanMessage({
          type: 'success',
          text: 'Checked in successfully! The doctor cabin has been notified.',
        });
        fetchAppointments(true);
      } else {
        setScanMessage({
          type: 'error',
          text: res.message || 'Check-in failed. Please verify the code with clinic desk.',
        });
      }
    } catch (err: any) {
      setScanMessage({
        type: 'error',
        text: err.message || 'Error processing check-in.',
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment token?')) {
      return;
    }

    try {
      const res = await api.cancelAppointment(appointmentId, 'Patient requested cancellation');
      if (res.success) {
        fetchAppointments(true);
      } else {
        alert(res.message || 'Failed to cancel appointment');
      }
    } catch (err: any) {
      alert(err.message || 'Cancellation error');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center pb-safe">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#e5e5ea] flex items-center justify-center mb-4">
          <Ticket className="w-8 h-8 text-[#0066cc]" />
        </div>
        <h3 className="text-lg font-bold text-[#1d1d1f]">Live Pass</h3>
        <p className="text-xs text-[#86868b] max-w-xs mt-1 mb-5">
          Sign in to view your live queue position and tokens.
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
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1d1d1f] leading-tight">Live Pass</h2>
        </div>

        <button
          onClick={() => fetchAppointments(true)}
          disabled={refreshing}
          className="p-2 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#0066cc] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {scanMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 ${
              scanMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {scanMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4 pt-4">
            <div className="w-full max-w-sm mx-auto h-72 bg-white rounded-3xl border border-[#e5e5ea] animate-pulse" />
          </div>
        ) : activeAppointments.length > 0 ? (
          <div className="space-y-6 pt-2">
            {activeAppointments.map((appt) => (
              <LiveQueuePass
                key={appt.id}
                appointment={appt}
                onRefresh={() => fetchAppointments(true)}
                onCheckInPress={() => setScannerOpen(true)}
                onCancelPress={() => handleCancelAppointment(appt.id)}
                isRefreshing={refreshing}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#e5e5ea] flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-[#86868b]" />
            </div>
            <h3 className="text-base font-bold text-[#1d1d1f]">No Active Pass</h3>
            <p className="text-xs text-[#86868b] mt-1 mb-5">
              No active queue tokens right now.
            </p>
            <AppleButton
              variant="primary"
              size="md"
              icon={<Search className="w-4 h-4" />}
              onClick={onExplorePress}
            >
              Find a Doctor
            </AppleButton>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <CameraQrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
