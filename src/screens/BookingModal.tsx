import React, { useState, useEffect, useMemo } from 'react';
import {
  api,
  DoctorProfile,
  DoctorSlot,
  Appointment,
  QueuePreview,
  parseDoctorSlots,
  format12Hour,
  getLocalDateString,
  getTomorrowDateString,
  formatDoctorDegrees,
} from '../services/api';
import { formatDisplayPhone } from '../utils/phoneUtils';
import { useAuth } from '../context/AuthContext';
import { AppleButton } from '../components/ui/AppleButton';
import { AppleInput } from '../components/ui/AppleInput';
import {
  X,
  Clock,
  Calendar,
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  ChevronLeft,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  clinicId?: string;
  clinicName?: string;
  slot?: DoctorSlot | null;
  date?: string;
  consultationFee?: number;
  onBookingSuccess: (appointment: any) => void;
  onViewPasses?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  doctor,
  clinicId: initialClinicId,
  clinicName: initialClinicName,
  slot: initialSlot,
  date: initialDate,
  consultationFee: initialFee,
  onBookingSuccess,
  onViewPasses,
}) => {
  const { user } = useAuth();

  // Date selection state
  const [appointmentDate, setAppointmentDate] = useState<string>(
    initialDate || getLocalDateString()
  );

  // Clinic selection state
  const clinicsList = useMemo(() => {
    if (doctor.clinics && doctor.clinics.length > 0) {
      return doctor.clinics.map((cd) => ({
        clinicId: cd.clinicId,
        clinicName: cd.clinic?.clinicName || 'Clinic Venue',
        clinicAddress: cd.clinic?.address || doctor.clinicAddress || 'Lobby Counter',
        clinicCity: cd.clinic?.city || '',
        clinicPhone: cd.clinic?.phone || '',
        consultationFee: cd.consultationFee ?? doctor.consultationFee ?? 500,
        slots: Array.isArray(cd.slots) && cd.slots.length > 0 ? cd.slots : parseDoctorSlots(doctor),
      }));
    }
    return [
      {
        clinicId: doctor.id || 'cabin',
        clinicName: initialClinicName || 'Clinical Cabin',
        clinicAddress: doctor.clinicAddress || 'Consultation Cabin',
        clinicCity: '',
        clinicPhone: '',
        consultationFee: initialFee ?? doctor.consultationFee ?? 500,
        slots: parseDoctorSlots(doctor),
      },
    ];
  }, [doctor, initialClinicName, initialFee]);

  const [selectedClinicId, setSelectedClinicId] = useState<string>(
    initialClinicId || clinicsList[0]?.clinicId || ''
  );

  const selectedClinic = useMemo(() => {
    return clinicsList.find((c) => c.clinicId === selectedClinicId) || clinicsList[0];
  }, [clinicsList, selectedClinicId]);

  const activeFee = selectedClinic?.consultationFee ?? doctor.consultationFee ?? 500;

  // Slots for the active clinic
  const availableSlots = useMemo(() => {
    return selectedClinic?.slots && selectedClinic.slots.length > 0
      ? selectedClinic.slots
      : parseDoctorSlots(doctor);
  }, [selectedClinic, doctor]);

  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialSlot?.id || availableSlots[0]?.id || ''
  );

  // Patient demographics state
  const [isForOther, setIsForOther] = useState(false);
  const [patientName, setPatientName] = useState(user?.fullName || '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Queue Preview State
  const [queuePreview, setQueuePreview] = useState<QueuePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmed Appointment state (Post-booking screen)
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setAppointmentDate(initialDate || getLocalDateString());
      if (initialClinicId) setSelectedClinicId(initialClinicId);
      if (initialSlot?.id) setSelectedSlotId(initialSlot.id);
      if (!isForOther && user) setPatientName(user.fullName || '');
      setConfirmedAppointment(null);
      setError(null);
    }
  }, [isOpen, initialDate, initialClinicId, initialSlot, isForOther, user]);

  // Ensure valid slot is selected when clinic changes
  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.some((s) => s.id === selectedSlotId)) {
      setSelectedSlotId(availableSlots[0].id);
    }
  }, [availableSlots, selectedSlotId]);

  // Dynamic Queue Preview recalculation
  useEffect(() => {
    if (!isOpen || !doctor.id || !appointmentDate) return;

    let isMounted = true;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await api.getQueuePreview(
          doctor.id,
          appointmentDate,
          selectedSlotId || undefined,
          selectedClinicId || undefined
        );
        if (isMounted && res.success && res.data) {
          setQueuePreview(res.data);
          if (
            res.data.selectedSlotId &&
            (!selectedSlotId || (res.data.isPassed && res.data.selectedSlotId !== selectedSlotId))
          ) {
            setSelectedSlotId(res.data.selectedSlotId);
          }
        }
      } catch (err) {
        console.error('Queue calculation preview failed:', err);
      } finally {
        if (isMounted) setLoadingPreview(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [isOpen, doctor.id, appointmentDate, selectedSlotId, selectedClinicId]);

  if (!isOpen) return null;

  const currentSlot = availableSlots.find((s) => s.id === selectedSlotId) || availableSlots[0];
  const isSelectedSlotPassed = Boolean(queuePreview?.isPassed);
  const isSelectedSlotFull = Boolean(queuePreview?.isFull);

  // Reception desk info
  const attachedReceptionist = (doctor as any).receptionists?.[0];
  const deskPhone =
    attachedReceptionist?.phone ||
    selectedClinic?.clinicPhone ||
    (doctor as any).phone ||
    '+91 98765 43210';
  const deskName = attachedReceptionist?.name || 'Clinic Reception Desk';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    setError(null);
    setBookingLoading(true);

    try {
      const res = await api.bookAppointment({
        doctorId: doctor.id,
        clinicId: selectedClinicId || undefined,
        appointmentDate,
        date: appointmentDate,
        slotId: selectedSlotId || undefined,
        reasonForVisit: reasonForVisit.trim() || 'General Consultation',
        symptoms: symptoms.trim() || undefined,
        isForOther,
        patientName: patientName.trim(),
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientGender,
      });

      if (res.success && res.data) {
        const appt = (res.data as any).appointment || res.data;
        setConfirmedAppointment(appt);
      } else {
        setError(res.message || 'Failed to complete appointment booking');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while booking appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleFinish = () => {
    if (confirmedAppointment) {
      onBookingSuccess(confirmedAppointment);
    }
    onClose();
  };

  const handleViewInPasses = () => {
    if (confirmedAppointment) {
      onBookingSuccess(confirmedAppointment);
    }
    onClose();
    if (onViewPasses) {
      onViewPasses();
    }
  };

  // ==========================================
  // 1. POST-BOOKING SUCCESS & RECEPTIONIST SCREEN
  // ==========================================
  if (confirmedAppointment) {
    const estToken =
      confirmedAppointment.estimatedQueueNumber ||
      (confirmedAppointment.queueNumber > 0 ? confirmedAppointment.queueNumber : 1);

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[28px] p-6 sm:p-8 border border-[#e5e5ea] max-h-[92vh] overflow-y-auto space-y-6">
          <button
            onClick={handleFinish}
            className="absolute top-5 right-5 p-2 rounded-full bg-[#f5f5f7] text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Clock Icon & Heading */}
          <div className="text-center space-y-2 pt-2">
            <div className="w-16 h-16 rounded-full bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea] flex items-center justify-center mx-auto shadow-2xs">
              <Clock className="w-8 h-8 text-[#0066cc]" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066cc] block">
              Request Submitted
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
              Pending Receptionist Confirmation
            </h2>
            <p className="text-xs text-[#86868b] font-medium">
              {confirmedAppointment.appointmentDate} ·{' '}
              {confirmedAppointment.checkingWindow || currentSlot?.name || 'Scheduled Slot'}
            </p>

            <div className="mt-3 inline-flex items-baseline gap-2 px-4 py-1.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                Estimated Token
              </span>
              <span className="text-xl font-bold text-[#1d1d1f] tracking-tight">
                #{estToken}
              </span>
            </div>
          </div>

          {/* Pay Receptionist to Confirm Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] text-left space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block">
                  Pay Receptionist to Confirm
                </span>
                <h4 className="text-base font-bold text-[#1d1d1f] mt-0.5">{deskName}</h4>
                <p className="text-xs text-[#86868b] mt-0.5">
                  {selectedClinic?.clinicName} · {selectedClinic?.clinicAddress}
                  {selectedClinic?.clinicCity ? `, ${selectedClinic.clinicCity}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-bold text-[#1d1d1f] block">
                  ₹{activeFee}
                </span>
                <span className="text-[10px] text-[#86868b]">Consultation Fee</span>
              </div>
            </div>

            <p className="text-xs text-[#86868b] leading-relaxed pt-2.5 border-t border-[#e5e5ea]">
              Your token will be officially assigned by the receptionist upon payment. If another
              patient pays earlier, their token will be confirmed before yours.
            </p>

            {deskPhone && (
              <div className="pt-1">
                <a
                  href={`tel:${deskPhone.replace(/\s+/g, '')}`}
                  className="w-full h-11 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Receptionist: {formatDisplayPhone(deskPhone)}</span>
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <AppleButton
              variant="primary"
              size="lg"
              onClick={handleViewInPasses}
              className="w-full sm:flex-1"
            >
              View Request in My Passes
            </AppleButton>
            <AppleButton
              variant="secondary"
              size="lg"
              onClick={handleFinish}
              className="w-full sm:flex-1"
            >
              Done
            </AppleButton>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. MAIN BOOKING FORM
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[28px] p-5 sm:p-6 border border-[#e5e5ea] max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#f5f5f7] text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Doctor Header */}
        <div className="mb-4 pr-10">
          <span className="text-[11px] font-semibold text-[#0066cc] tracking-wider uppercase">
            Book Appointment
          </span>
          <h3 className="text-xl font-bold text-[#1d1d1f] mt-0.5">
            {doctor.user?.fullName?.toLowerCase().startsWith('dr.')
              ? doctor.user.fullName
              : `Dr. ${doctor.user?.fullName || 'Practitioner'}`}
          </h3>
          <p className="text-xs text-[#86868b] mt-0.5">
            {doctor.specialty} • {formatDoctorDegrees(doctor.qualifications)}
          </p>
        </div>

        {/* 1. Clinic Venue Selection */}
        {clinicsList.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0066cc]" />
              Select Clinic Venue
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {clinicsList.map((c) => {
                const isSelected = selectedClinicId === c.clinicId;
                return (
                  <button
                    key={c.clinicId}
                    type="button"
                    onClick={() => setSelectedClinicId(c.clinicId)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'bg-white border-[#0066cc] ring-2 ring-[#0066cc]/15 shadow-2xs'
                        : 'bg-[#fafafc] border-[#e5e5ea] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-[#1d1d1f] truncate">
                        {c.clinicName}
                      </span>
                      {isSelected && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#0066cc] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#86868b] flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-[#86868b] shrink-0" />
                      <span className="truncate">
                        {c.clinicAddress}
                        {c.clinicCity ? `, ${c.clinicCity}` : ''}
                      </span>
                    </span>
                    <div className="mt-1.5 pt-1.5 border-t border-[#f0f0f2] flex items-center justify-between text-[11px]">
                      <span className="text-[#86868b]">Fee</span>
                      <span className="font-semibold text-[#1d1d1f]">₹{c.consultationFee}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Date Picker (Today, Tomorrow, Calendar Input) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0066cc]" />
              Consultation Date
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAppointmentDate(getLocalDateString())}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  appointmentDate === getLocalDateString()
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setAppointmentDate(getTomorrowDateString())}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  appointmentDate === getTomorrowDateString()
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Tomorrow
              </button>
            </div>
          </div>

          <input
            type="date"
            min={getLocalDateString()}
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-[#e5e5ea] text-xs font-medium bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all cursor-pointer"
          />
        </div>

        {/* 3. Shift Selection */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
            Checking Shift
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableSlots.map((s) => {
              const isSelected = s.id === selectedSlotId;
              const slotStatus = queuePreview?.availableSlots?.find((as) => as.slot.id === s.id);
              const isEnded = slotStatus?.isPassed;
              const isFull = slotStatus?.isFull;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSlotId(s.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? 'bg-white border-[#0066cc] ring-2 ring-[#0066cc]/15 shadow-2xs'
                      : 'bg-[#fafafc] border-[#e5e5ea] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-[#1d1d1f] truncate">{s.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isEnded
                          ? 'bg-amber-100 text-amber-800'
                          : isFull
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isEnded ? 'Ended' : isFull ? 'Full' : 'Available'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868b]">
                    {format12Hour(s.startTime)} – {format12Hour(s.endTime)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shift Notices */}
        {isSelectedSlotPassed && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Shift ended for today. Please select tomorrow or another active shift.</span>
          </div>
        )}

        {isSelectedSlotFull && !isSelectedSlotPassed && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Shift capacity reached. Please pick another shift or alternate date.</span>
          </div>
        )}

        {/* 4. Live Token Allocation Preview Card */}
        <div className="bg-[#f5f5f7] rounded-2xl p-4 border border-[#e5e5ea] mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#0066cc] uppercase tracking-wider">
                Queue Preview
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-[#1d1d1f]">
                  {loadingPreview
                    ? '...'
                    : queuePreview
                    ? `#${String(queuePreview.nextQueueNumber).padStart(2, '0')}`
                    : '#01'}
                </span>
                <span className="text-xs text-[#86868b]">Next Token</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                Time Window
              </span>
              <p className="text-xs font-bold text-[#1d1d1f] mt-0.5">
                {queuePreview?.estimatedTime ||
                  `${format12Hour(currentSlot?.startTime || '09:00')} - ${format12Hour(
                    currentSlot?.endTime || '13:00'
                  )}`}
              </p>
              {queuePreview && (
                <p className="text-[11px] text-[#86868b]">
                  {queuePreview.patientsAhead} waiting ahead
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 5. Booking Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Who is this visit for? */}
          <div>
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 ml-1">
              Appointment For
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsForOther(false);
                  if (user) setPatientName(user.fullName || '');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  !isForOther
                    ? 'bg-[#0066cc] text-white border-[#0066cc]'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent hover:bg-[#e5e5ea]'
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
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  isForOther
                    ? 'bg-[#0066cc] text-white border-[#0066cc]'
                    : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent hover:bg-[#e5e5ea]'
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
              label="Age"
              type="number"
              placeholder="Years"
              value={patientAge}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientAge(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5 ml-1">
                Gender
              </label>
              <select
                value={patientGender}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPatientGender(e.target.value)
                }
                className="w-full bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] text-xs font-medium rounded-xl py-3 px-3 outline-none cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <AppleInput
            label="Reason for Visit (Optional)"
            placeholder="e.g. Fever, routine consultation"
            value={reasonForVisit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReasonForVisit(e.target.value)}
          />

          {/* Fee & Counter Payment badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fafafc] border border-[#e5e5ea]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0066cc]" />
              <div>
                <p className="text-xs font-semibold text-[#1d1d1f]">Fee: ₹{activeFee}</p>
                <p className="text-[11px] text-[#86868b]">Pay at receptionist desk on arrival</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-0.5 rounded-full border border-[#0066cc]/20">
              Counter Pay
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
              Request Appointment (₹{activeFee})
            </AppleButton>
          </div>
        </form>
      </div>
    </div>
  );
};
