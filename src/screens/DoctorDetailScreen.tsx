import React, { useState } from 'react';
import { DoctorProfile, DoctorSlot, getFileUrl } from '../services/api';
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
      dateString: d.toISOString().split('T')[0],
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].dateString);

  // Fallback schedules if empty
  const schedules = doctor.schedules && doctor.schedules.length > 0
    ? doctor.schedules
    : [
        {
          clinicId: 'cln_default_01',
          clinicName: 'MediArca Central Clinic',
          clinicAddress: 'Medical Enclave, Main Road',
          clinicCity: 'City Centre',
          consultationFee: doctor.consultationFee || 500,
          daysOfWeek: [1, 2, 3, 4, 5, 6],
          slots: [
            {
              id: 'slot_morn_01',
              name: 'Morning Shift',
              startTime: '09:00 AM',
              endTime: '12:00 PM',
              maxPatients: 30,
            },
            {
              id: 'slot_eve_02',
              name: 'Evening Shift',
              startTime: '05:00 PM',
              endTime: '08:00 PM',
              maxPatients: 30,
            },
          ],
        },
      ];

  const [selectedClinicId, setSelectedClinicId] = useState(schedules[0].clinicId);
  const activeSchedule = schedules.find((s: any) => s.clinicId === selectedClinicId) || schedules[0];

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea] flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f] active:bg-[#f0f0f0]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-[#1d1d1f]">Doctor Profile</span>
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
              <div className="mt-2">
                <DoctorPresenceBadge
                  status={doctor.cabinStatus}
                  steppedOutUntil={doctor.steppedOutUntil}
                  size="sm"
                />
              </div>
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
                ₹{doctor.consultationFee || 500}
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
                className={`py-2.5 px-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  selectedDate === d.dateString
                    ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-xs font-semibold'
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
                  {activeSchedule.clinicAddress}, {activeSchedule.clinicCity}
                </p>
              </div>
            </div>

            {/* Slots */}
            <div className="space-y-2.5">
              {activeSchedule.slots.map((slot: DoctorSlot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#fafafc] border border-[#e5e5ea]"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0066cc]" />
                    <div>
                      <p className="text-xs font-bold text-[#1d1d1f]">
                        {slot.name}
                      </p>
                      <p className="text-[11px] text-[#86868b]">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
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
                      })
                    }
                  >
                    Book
                  </AppleButton>
                </div>
              ))}
            </div>
          </AppleCard>
        </div>
      </div>
    </div>
  );
};
