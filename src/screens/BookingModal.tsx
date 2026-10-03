import React, { useState, useEffect } from 'react';
import { api, DoctorProfile, DoctorSlot, QueuePreviewResult } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppleButton } from '../components/ui/AppleButton';
import { AppleInput } from '../components/ui/AppleInput';
import { AppleCard } from '../components/ui/AppleCard';
import {
  X,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  clinicId: string;
  clinicName: string;
  slot: DoctorSlot;
  date: string;
  onBookingSuccess: (appointment: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  doctor,
  clinicId,
  clinicName,
  slot,
  date,
  onBookingSuccess,
}) => {
  const { user } = useAuth();

  const [isForOther, setIsForOther] = useState(false);
  const [patientName, setPatientName] = useState(user?.fullName || '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [reasonForVisit, setReasonForVisit] = useState('');

  const [preview, setPreview] = useState<QueuePreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (!isForOther && user) {
      setPatientName(user.fullName || '');
    }

    const fetchPreview = async () => {
      setLoadingPreview(true);
      setError(null);
      try {
        const res = await api.getQueuePreview({
          doctorId: doctor.id,
          clinicId,
          slotId: slot.id,
          date,
        });
        if (res.success && res.data) {
          setPreview(res.data);
        }
      } catch (err) {
        // preview non-blocking
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [isOpen, doctor.id, clinicId, slot.id, date, isForOther, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBookingLoading(true);

    try {
      const res = await api.bookAppointment({
        doctorId: doctor.id,
        clinicId,
        slotId: slot.id,
        date,
        isForOther,
        patientName: patientName.trim(),
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientGender,
        reasonForVisit: reasonForVisit.trim() || undefined,
      });

      if (res.success && res.data) {
        onBookingSuccess(res.data.appointment || res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to book appointment');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl p-6 border border-[#e5e5ea] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] active:bg-[#e5e5ea]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-[#0066cc] tracking-wider uppercase">
            Confirm Booking
          </span>
          <h3 className="text-xl font-bold text-[#1d1d1f] mt-0.5">
            Dr. {doctor.user?.fullName || 'Practitioner'}
          </h3>
          <p className="text-xs text-[#86868b]">
            {doctor.specialty} • {clinicName}
          </p>
        </div>

        {/* Live Token & Time Preview Card */}
        <div className="bg-gradient-to-br from-[#0066cc]/10 to-[#10b981]/10 rounded-2xl p-4 border border-[#0066cc]/20 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#0066cc]">
                Live Queue Allocation
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-[#1d1d1f]">
                  {loadingPreview
                    ? '...'
                    : preview
                    ? `#${String(preview.nextQueueNumber).padStart(2, '0')}`
                    : '#01'}
                </span>
                <span className="text-xs text-[#7a7a7a]">Your Token</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-[#7a7a7a]">
                Est. Time
              </span>
              <p className="text-sm font-bold text-[#1d1d1f] mt-0.5">
                {preview?.estimatedTime || `${slot.startTime} - ${slot.endTime}`}
              </p>
              {preview && (
                <p className="text-[11px] text-[#7a7a7a]">
                  {preview.patientsAhead} waiting ahead
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Who is this visit for? */}
          <div>
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
              Appointment For
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsForOther(false);
                  if (user) setPatientName(user.fullName);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  !isForOther
                    ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-sm'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent'
                }`}
              >
                Myself
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsForOther(true);
                  setPatientName('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  isForOther
                    ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-sm'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent'
                }`}
              >
                Family Member
              </button>
            </div>
          </div>

          {/* Patient Details */}
          <AppleInput
            label="Patient Name"
            placeholder="Full Name"
            value={patientName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <AppleInput
              label="Age (Years)"
              type="number"
              placeholder="e.g. 28"
              value={patientAge}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientAge(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 ml-1">
                Gender
              </label>
              <select
                value={patientGender}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPatientGender(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] text-sm rounded-xl py-3 px-3 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <AppleInput
            label="Reason for Visit (Optional)"
            placeholder="e.g. Fever, routine checkup"
            value={reasonForVisit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReasonForVisit(e.target.value)}
          />

          {/* Fee & Zero paywall badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fafafc] border border-[#f0f0f0]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-[#1d1d1f]">
                  Consultation Fee: ₹{doctor.consultationFee || 500}
                </p>
                <p className="text-[11px] text-[#7a7a7a]">
                  Pay at clinic counter after visit
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Zero Prepay
            </span>
          </div>

          <div className="pt-2">
            <AppleButton
              variant="primary"
              size="lg"
              className="w-full"
              type="submit"
              loading={bookingLoading}
              disabled={!patientName.trim()}
            >
              Confirm Appointment
            </AppleButton>
          </div>
        </form>
      </div>
    </div>
  );
};
