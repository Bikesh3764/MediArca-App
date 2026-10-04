import React, { useState, useMemo } from 'react';
import {
  DoctorProfile,
  DoctorSlot,
  getFileUrl,
  calculateSlotMetrics,
  parseDoctorSlots,
  getLocalDateString,
  format12Hour,
} from '../services/api';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import { DoctorPresenceBadge } from '../components/ui/DoctorPresenceBadge';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Award,
  Calendar,
  CheckCircle2,
  User,
  ShieldCheck,
  Users,
  Ticket,
} from 'lucide-react';

interface DoctorDetailScreenProps {
  doctor: DoctorProfile;
  onBack: () => void;
  onSelectSlotForBooking: (params: {
    doctor: DoctorProfile;
    clinicId: string;
    clinicName: string;
    slot: DoctorSlot;
    date: string;
    consultationFee?: number;
  }) => void;
}

export const DoctorDetailScreen: React.FC<DoctorDetailScreenProps> = ({
  doctor,
  onBack,
  onSelectSlotForBooking,
}) => {
  const docName = doctor.user?.fullName || 'Practitioner';
  const avatar = doctor.user?.avatarUrl;

  // Generate next 3 days for booking
  const dates = [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      dateString: getLocalDateString(d),
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].dateString);

  // Authentic clinic affiliations or clinical cabin (zero mock clinics)
  const clinicsList = useMemo(() => {
    if (doctor.clinics && doctor.clinics.length > 0) {
      return doctor.clinics.map((cd) => ({
        clinicId: cd.clinicId,
        clinicName: cd.clinic?.clinicName || 'Clinic',
        clinicAddress: cd.clinic?.address || doctor.clinicAddress || '',
        clinicCity: cd.clinic?.city || '',
        consultationFee: cd.consultationFee ?? doctor.consultationFee ?? 500,
        slots: Array.isArray(cd.slots) && cd.slots.length > 0 ? cd.slots : parseDoctorSlots(doctor),
      }));
    }
    if (doctor.schedules && doctor.schedules.length > 0) {
      return doctor.schedules;
    }
    return [
      {
        clinicId: doctor.id || 'cabin',
        clinicName: doctor.clinicAddress ? 'Clinical Cabin' : 'Outpatient Consultation',
        clinicAddress: doctor.clinicAddress || 'Consultation Cabin',
        clinicCity: '',
        consultationFee: doctor.consultationFee || 500,
        slots: parseDoctorSlots(doctor),
      },
    ];
  }, [doctor]);

  const [selectedClinicId, setSelectedClinicId] = useState(clinicsList[0]?.clinicId || '');
  const activeSchedule = clinicsList.find((s: any) => s.clinicId === selectedClinicId) || clinicsList[0];

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea] flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f] active:scale-95 active:bg-[#f0f0f0] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-[#1d1d1f]">Doctor</span>
        <div className="w-8" />
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <AppleCard className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] rounded-full overflow-hidden bg-[#f5f5f7] border border-[#e5e5ea] shrink-0 flex items-center justify-center">
              {avatar ? (
                <img
                  src={getFileUrl(avatar)}
                  alt={docName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <User className="w-8 h-8 text-[#86868b]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-[#1d1d1f] leading-snug truncate">
                  {docName.toLowerCase().startsWith('dr.') ? docName : `Dr. ${docName}`}
                </h2>
                <ShieldCheck className="w-4 h-4 text-[#0066cc] shrink-0" />
              </div>
              <p className="text-sm font-semibold text-[#0066cc]">
                {doctor.specialty}
              </p>
              <p className="text-xs text-[#86868b] mt-0.5">
                {doctor.qualifications}
              </p>
              {doctor.cabinStatus === 'IN_CABIN' && (
                <div className="mt-2">
                  <DoctorPresenceBadge
                    status={doctor.cabinStatus}
                    steppedOutUntil={doctor.steppedOutUntil}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f0f0f2]">
            <div className="p-2.5 rounded-xl bg-[#fafafc] border border-[#f0f0f2] text-center">
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                Experience
              </span>
              <p className="text-sm font-bold text-[#1d1d1f] mt-0.5">
                {doctor.experienceYears}+ Yrs
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#fafafc] border border-[#f0f0f2] text-center">
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                Consultation Fee
              </span>
              <p className="text-sm font-bold text-[#0066cc] mt-0.5">
                ₹{activeSchedule.consultationFee ?? doctor.consultationFee ?? 500}
              </p>
            </div>
          </div>

          {doctor.bio && (
            <div className="pt-1">
              <span className="text-xs font-semibold text-[#86868b] block mb-1">
                About
              </span>
              <p className="text-xs text-[#1d1d1f] leading-relaxed">
                {doctor.bio}
              </p>
            </div>
          )}
        </AppleCard>

        {/* Multi-Clinic Selector if practicing at multiple clinics */}
        {clinicsList.length > 1 && (
          <div>
            <span className="text-xs font-semibold text-[#86868b] block mb-2 px-1">
              Select Clinic
            </span>
            <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar -mx-4 px-4">
              {clinicsList.map((s: any) => (
                <button
                  key={s.clinicId}
                  type="button"
                  onClick={() => setSelectedClinicId(s.clinicId)}
                  className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                    selectedClinicId === s.clinicId
                      ? 'bg-[#0066cc] text-white border-[#0066cc] font-semibold'
                      : 'bg-white text-[#1d1d1f] border-[#e5e5ea] active:bg-[#f5f5f7]'
                  }`}
                >
                  {s.clinicName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Selector */}
        <div>
          <span className="text-xs font-semibold text-[#86868b] block mb-2 px-1">
            Select Date
          </span>
          <div className="grid grid-cols-3 gap-2">
            {dates.map((d) => (
              <button
                key={d.dateString}
                type="button"
                onClick={() => setSelectedDate(d.dateString)}
                className={`py-2.5 px-2 sm:px-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  selectedDate === d.dateString
                    ? 'bg-[#0066cc] text-white border-[#0066cc] font-semibold'
                    : 'bg-white text-[#1d1d1f] border-[#e5e5ea] active:bg-[#f5f5f7]'
                }`}
              >
                <span className="text-xs font-bold block">{d.dayName}</span>
                <span className={`text-[11px] block mt-0.5 ${selectedDate === d.dateString ? 'text-white/80' : 'text-[#86868b]'}`}>
                  {d.formatted}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Clinic & Shifts */}
        <div>
          <span className="text-xs font-semibold text-[#86868b] block mb-2 px-1">
            Available Shifts
          </span>

          <AppleCard className="space-y-4">
            {/* Clinic Info */}
            <div className="flex items-start gap-2.5 pb-3 border-b border-[#f0f0f2]">
              <MapPin className="w-4 h-4 text-[#0066cc] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#1d1d1f]">
                  {activeSchedule.clinicName}
                </h4>
                <p className="text-xs text-[#86868b] mt-0.5">
                  {[activeSchedule.clinicAddress, activeSchedule.clinicCity].filter(Boolean).join(', ') || 'Consultation Cabin'}
                </p>
              </div>
            </div>

            {/* Slots */}
            <div className="space-y-2.5">
              {activeSchedule.slots.map((slot: DoctorSlot) => {
                const metrics = calculateSlotMetrics(
                  slot.startTime,
                  slot.endTime,
                  slot.maxPatients || 30
                );
                const avgMinutes = slot.avgConsultationMinutes || metrics.avgConsultationMinutes;

                return (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-2xl bg-[#fafafc] border border-[#e5e5ea] space-y-2.5 transition-all hover:border-[#0066cc]/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0066cc]" />
                        <span className="text-xs font-bold text-[#1d1d1f]">
                          {slot.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-full border border-[#0066cc]/20 flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        Queue Token
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#f0f0f2]">
                      <div className="text-[11px] text-[#86868b] flex items-center gap-2">
                        <span>{format12Hour(slot.startTime)} – {format12Hour(slot.endTime)}</span>
                        <span>•</span>
                        <span>Max {slot.maxPatients || 30} cap</span>
                        <span>•</span>
                        <span>~{avgMinutes} min/patient</span>
                      </div>

                      <AppleButton
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          onSelectSlotForBooking({
                            doctor,
                            clinicId: activeSchedule.clinicId,
                            clinicName: activeSchedule.clinicName,
                            slot,
                            date: selectedDate,
                            consultationFee: activeSchedule.consultationFee ?? doctor.consultationFee ?? 500,
                          })
                        }
                      >
                        Book Visit
                      </AppleButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </AppleCard>
        </div>
      </div>
    </div>
  );
};
