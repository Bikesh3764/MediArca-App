import React from 'react';
import { Appointment, getFileUrl } from '../../services/api';
import { formatDisplayPhone } from '../../utils/phoneUtils';
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
  Phone,
  ShieldAlert,
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
  const isPending = appointment.status === 'PENDING' || appointment.status === 'PENDING_APPROVAL';
  const isCallingNow = appointment.status === 'IN_CONSULTATION';
  const isWaiting = appointment.status === 'WAITING';
  const isCompleted = appointment.status === 'COMPLETED';
  const isCancelled = appointment.status === 'CANCELLED';

  const doctorName = appointment.doctor?.user?.fullName || 'Doctor';
  const specialty = appointment.doctor?.specialty || 'General Practitioner';
  const doctorAvatar = appointment.doctor?.user?.avatarUrl;
  const cabinStatus = appointment.doctor?.cabinStatus || 'NOT_IN_CABIN';
  const steppedOutUntil = appointment.doctor?.steppedOutUntil;

  // Resolve Desk Contact Info
  const deskPhone =
    (appointment.doctor as any)?.receptionists?.[0]?.phone ||
    (appointment.clinic as any)?.phone ||
    '+91 98765 43210';
  const deskName =
    (appointment.doctor as any)?.receptionists?.[0]?.name || 'Clinic Reception Desk';
  const fee =
    (appointment as any).fee ||
    appointment.doctor?.consultationFee ||
    500;

  const displayToken = isPending
    ? appointment.estimatedQueueNumber || (appointment.queueNumber > 0 ? appointment.queueNumber : 1)
    : appointment.queueNumber;

  return (
    <div className="relative w-full max-w-sm mx-auto select-none transition-all duration-200">
      {/* Top Header Card — Apple Wallet Pass Header */}
      <div
        className={`relative overflow-hidden rounded-t-[28px] p-5 sm:p-6 text-white transition-colors duration-300 ${
          isCallingNow
            ? 'bg-[#059669]'
            : isPending
            ? 'bg-[#b45309]'
            : isCancelled
            ? 'bg-[#3a3a3c]'
            : isCompleted
            ? 'bg-[#272729]'
            : 'bg-[#0066cc]'
        }`}
      >
        {/* Brand & Live status bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              {isPending ? 'Request' : 'Live Pass'}
            </span>
            {isCallingNow && (
              <span className="animate-pulse flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#059669]">
                ● Calling Now
              </span>
            )}
            {isPending && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                Payment Pending
              </span>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-full bg-white/10 active:scale-95 active:bg-white/20 transition-all text-white/90 hover:text-white cursor-pointer"
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
            <p className="text-xs font-semibold text-white/80">
              {isPending ? 'Estimated Token' : 'Token'}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-4xl font-black tracking-tight">
                #{String(displayToken).padStart(2, '0')}
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1 font-semibold">
              {appointment.isForOther ? `${appointment.patientName} (Family)` : 'Myself'}
            </p>
          </div>

          <div className="flex flex-col items-end text-right">
            <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-full border border-white/40 overflow-hidden bg-white/10 mb-1.5 flex items-center justify-center shrink-0">
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
            <h4 className="text-sm font-bold text-white leading-tight">
              {doctorName.toLowerCase().startsWith('dr.') ? doctorName : `Dr. ${doctorName}`}
            </h4>
            <p className="text-[11px] text-white/80 font-medium">{specialty}</p>
          </div>
        </div>
      </div>

      {/* Perforation / Notched Divider (Apple Wallet Ticket Style) */}
      <div className="relative bg-white flex items-center justify-between px-3 py-2 border-x border-[#e5e5ea]">
        <div className="w-5 h-6 bg-[#f5f5f7] rounded-r-full -ml-3 border-r border-[#e5e5ea]" />
        <div className="flex-1 border-b border-dashed border-[#e5e5ea] mx-2" />
        <div className="w-5 h-6 bg-[#f5f5f7] rounded-l-full -mr-3 border-l border-[#e5e5ea]" />
      </div>

      {/* Bottom Pass Body */}
      <div className="bg-white rounded-b-[28px] border-b border-x border-[#e5e5ea] p-5 space-y-4">
        {/* Cabin Status & Shift Info */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
          <div>
            <span className="text-[11px] text-[#86868b] block font-semibold uppercase tracking-wider">
              Cabin Status
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
            <span className="text-[11px] text-[#86868b] block font-semibold uppercase tracking-wider">
              Date & Window
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#1d1d1f] mt-1 justify-end">
              <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>
                {appointment.appointmentDate || appointment.date} •{' '}
                {appointment.checkingWindow || appointment.slotName || 'Shift'}
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
                {appointment.clinic.clinicName || appointment.clinic.name}
              </p>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                {appointment.clinic.address}
                {appointment.clinic.city ? `, ${appointment.clinic.city}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* PENDING STATE CARD (Pay Receptionist to Confirm) */}
        {isPending && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                  Pay Receptionist to Confirm
                </span>
                <h5 className="text-sm font-bold text-[#1d1d1f] mt-0.5">{deskName}</h5>
                <p className="text-[11px] text-[#86868b]">
                  Fee to Pay: <strong className="text-[#1d1d1f]">₹{fee}</strong>
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 shrink-0">
                Pending Approval
              </span>
            </div>

            <p className="text-[11px] text-amber-950/80 leading-relaxed border-t border-amber-200/60 pt-2">
              Your token will be officially assigned by the receptionist upon payment. If another
              patient pays earlier, their token will be confirmed before yours.
            </p>

            {deskPhone && (
              <a
                href={`tel:${deskPhone.replace(/\s+/g, '')}`}
                className="w-full h-10 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Receptionist: {formatDisplayPhone(deskPhone)}</span>
              </a>
            )}
          </div>
        )}

        {/* Check-In Status (Waiting) */}
        {!isPending && (
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[#86868b] font-normal">Arrival</span>
            {appointment.isCheckedIn ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" /> Desk Check-In Pending
              </span>
            )}
          </div>
        )}

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
                className="text-xs text-[#ff3b30] hover:text-[#d63026] font-semibold py-1.5 transition-colors text-center w-full cursor-pointer active:scale-95"
              >
                Cancel Token
              </button>
            )}
          </div>
        )}

        {isPending && onCancelPress && (
          <button
            type="button"
            onClick={onCancelPress}
            className="text-xs text-[#86868b] hover:text-[#ff3b30] font-semibold py-1 transition-colors text-center w-full cursor-pointer active:scale-95"
          >
            Cancel Booking Request
          </button>
        )}

        {isCallingNow && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
            <p className="text-sm font-bold text-emerald-800">Calling Inside</p>
            <p className="text-xs text-emerald-700 mt-0.5">Please proceed to doctor cabin.</p>
          </div>
        )}

        {isCompleted && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
            <p className="text-xs font-semibold text-slate-700">Consultation Completed</p>
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
