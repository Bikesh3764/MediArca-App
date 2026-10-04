import React from 'react';
import { Appointment, getFileUrl } from '../../services/api';
import { DoctorPresenceBadge } from '../ui/DoctorPresenceBadge';
import { AppleButton } from '../ui/AppleButton';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RefreshCw,
  User,
  XCircle,
} from 'lucide-react';

interface LiveQueuePassProps {
  appointment: Appointment;
  onRefresh?: () => void;
  onCheckInPress?: () => void;
  onCancelPress?: () => void;
  isRefreshing?: boolean;
}

export const LiveQueuePass: React.FC<LiveQueuePassProps> = ({
  appointment,
  onRefresh,
  onCheckInPress,
  onCancelPress,
  isRefreshing = false,
}) => {
  const isCallingNow = appointment.status === 'IN_CONSULTATION';
  const isWaiting = appointment.status === 'WAITING';
  const isCompleted = appointment.status === 'COMPLETED';
  const isCancelled = appointment.status === 'CANCELLED';

  const doctorName = appointment.doctor?.user?.fullName || 'Doctor';
  const specialty = appointment.doctor?.specialty || 'General Practitioner';
  const doctorAvatar = appointment.doctor?.user?.avatarUrl;
  const cabinStatus = appointment.doctor?.cabinStatus || 'NOT_IN_CABIN';
  const steppedOutUntil = appointment.doctor?.steppedOutUntil;

  return (
    <div className="relative w-full max-w-sm mx-auto select-none transition-all duration-200">
      {/* Top Header Card — Wallet Pass Header */}
      <div
        className={`relative overflow-hidden rounded-t-[24px] p-6 text-white transition-colors duration-300 ${
          isCallingNow
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-[0_10px_30px_rgba(16,185,129,0.35)]'
            : isCancelled
            ? 'bg-gradient-to-br from-gray-700 to-gray-800'
            : isCompleted
            ? 'bg-gradient-to-br from-slate-700 to-slate-800'
            : 'bg-gradient-to-br from-[#0066cc] to-[#004f9e] shadow-[0_10px_30px_rgba(0,102,204,0.25)]'
        }`}
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand & Live status bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              MediArca Live Pass
            </span>
            {isCallingNow && (
              <span className="animate-pulse flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-emerald-700">
                ● Your Turn!
              </span>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-full bg-white/10 active:bg-white/20 transition-all text-white/90 hover:text-white"
              title="Refresh queue"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Token Number & Doctor Info */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/80">Token</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-4xl font-extrabold tracking-tight">
                #{String(appointment.queueNumber).padStart(2, '0')}
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1 font-medium">
              {appointment.isForOther ? `${appointment.patientName} (Family)` : 'Myself'}
            </p>
          </div>

          <div className="flex flex-col items-end text-right">
            <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-full border-2 border-white/30 overflow-hidden bg-white/10 mb-1.5 flex items-center justify-center shrink-0">
              {doctorAvatar ? (
                <img
                  src={getFileUrl(doctorAvatar)}
                  alt={doctorName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <User className="w-6 h-6 text-white/70" />
              )}
            </div>
            <h4 className="text-sm font-semibold text-white leading-tight">
              {doctorName.toLowerCase().startsWith('dr.') ? doctorName : `Dr. ${doctorName}`}
            </h4>
            <p className="text-[11px] text-white/80">{specialty}</p>
          </div>
        </div>
      </div>

      {/* Perforation / Notched Divider (Apple Wallet Ticket Style) */}
      <div className="relative bg-white flex items-center justify-between px-3 py-2 border-x border-[#e5e5ea]">
        <div className="w-5 h-6 bg-[#f5f5f7] rounded-r-full -ml-3 border-r border-[#e5e5ea]" />
        <div className="flex-1 border-b-2 border-dashed border-[#e5e5ea] mx-2" />
        <div className="w-5 h-6 bg-[#f5f5f7] rounded-l-full -mr-3 border-l border-[#e5e5ea]" />
      </div>

      {/* Bottom Pass Body */}
      <div className="bg-white rounded-b-[24px] border-b border-x border-[#e5e5ea] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-4">
        {/* Cabin Status & Shift Info */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <div>
            <span className="text-[11px] text-[#86868b] block font-medium uppercase tracking-wider">
              Cabin
            </span>
            <div className="mt-1">
              <DoctorPresenceBadge
                status={cabinStatus}
                steppedOutUntil={steppedOutUntil}
                size="sm"
              />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[#86868b] block font-medium uppercase tracking-wider">
              Date & Slot
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#1d1d1f] mt-1 justify-end">
              <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>
                {appointment.date} • {appointment.slotName || 'Shift'}
              </span>
            </div>
          </div>
        </div>

        {/* Clinic Venue Location */}
        {appointment.clinic && (
          <div className="flex items-start gap-2.5 text-xs text-[#1d1d1f] bg-[#fafafc] p-3 rounded-xl border border-[#f0f0f2]">
            <MapPin className="w-4 h-4 text-[#0066cc] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#1d1d1f]">
                {appointment.clinic.name}
              </p>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                {appointment.clinic.address}, {appointment.clinic.city}
              </p>
            </div>
          </div>
        )}

        {/* Check-In Status */}
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-[#86868b] font-medium">Arrival</span>
          {appointment.isCheckedIn ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" /> Desk Check-In Pending
            </span>
          )}
        </div>

        {/* Interactive Action Buttons */}
        {isWaiting && (
          <div className="pt-2 flex flex-col gap-2">
            {!appointment.isCheckedIn && onCheckInPress && (
              <AppleButton
                variant="primary"
                size="md"
                className="w-full"
                icon={<QrCode className="w-4 h-4" />}
                onClick={onCheckInPress}
              >
                Scan QR to Check In
              </AppleButton>
            )}

            {onCancelPress && (
              <button
                type="button"
                onClick={onCancelPress}
                className="text-xs text-[#ff3b30] hover:text-[#d63026] font-medium py-1.5 transition-colors text-center w-full cursor-pointer"
              >
                Cancel Token
              </button>
            )}
          </div>
        )}

        {isCallingNow && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
            <p className="text-sm font-bold text-emerald-800">
              Your Turn!
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Please enter the doctor cabin.
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
            <p className="text-xs font-semibold text-slate-700">
              Consultation Completed
            </p>
            {appointment.consultationNotes && (
              <p className="text-xs text-slate-500 mt-1 italic">
                "{appointment.consultationNotes}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
