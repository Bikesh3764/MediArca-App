import React, { useState, useEffect, useCallback } from 'react';
import { api, Appointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  LogIn,
  Star,
  AlertCircle,
  X,
  MessageSquare,
  Ban,
  Check,
} from 'lucide-react';

interface AppointmentsHistoryScreenProps {
  onOpenAuth: () => void;
  onExplorePress: () => void;
}

export const AppointmentsHistoryScreen: React.FC<AppointmentsHistoryScreenProps> = ({
  onOpenAuth,
  onExplorePress,
}) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Cancel Modal State
  const [cancelModalAppt, setCancelModalAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Review Modal State
  const [reviewModalAppt, setReviewModalAppt] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getPatientAppointments();
      if (res.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.createdAt || b.date || '').getTime() - new Date(a.createdAt || a.date || '').getTime()
        );
        setAppointments(sorted);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCancel = async () => {
    if (!cancelModalAppt) return;
    setCancelling(true);
    try {
      const res = await api.cancelAppointment(cancelModalAppt.id, cancelReason.trim() || 'Patient requested');
      if (res.success) {
        setNotificationMsg({ type: 'success', text: 'Appointment cancelled successfully.' });
        setCancelModalAppt(null);
        setCancelReason('');
        fetchHistory();
      } else {
        setNotificationMsg({ type: 'error', text: res.message || 'Failed to cancel appointment.' });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Failed to cancel appointment.' });
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModalAppt) return;
    setSubmittingReview(true);
    try {
      const res = await api.submitAppointmentReview(reviewModalAppt.id, {
        rating,
        comment: comment.trim() || undefined,
      });
      if (res.success) {
        setNotificationMsg({ type: 'success', text: 'Doctor review submitted. Thank you!' });
        setReviewModalAppt(null);
        setRating(5);
        setComment('');
        fetchHistory();
      } else {
        setNotificationMsg({ type: 'error', text: res.message || 'Failed to submit review.' });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Failed to submit review.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center pb-safe">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#e5e5ea] flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-[#0066cc]" />
        </div>
        <h3 className="text-lg font-bold text-[#1d1d1f]">Visit History</h3>
        <p className="text-xs text-[#86868b] max-w-xs mt-1 mb-5">
          Sign in to view your past consultations, tokens, and prescriptions.
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

  const upcomingAppointments = appointments.filter(
    (a) =>
      a.status === 'WAITING' ||
      a.status === 'IN_CONSULTATION' ||
      a.status === 'PENDING' ||
      a.status === 'PENDING_APPROVAL'
  );

  const pastAppointments = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED' || a.status === 'EXPIRED'
  );

  const displayedList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea] space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1d1d1f]">My Visits</h2>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="bg-[#e5e5ea]/80 p-0.5 rounded-full flex items-center max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-white text-[#1d1d1f] shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <span>Upcoming ({upcomingAppointments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'past'
                ? 'bg-white text-[#1d1d1f] shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <span>Past ({pastAppointments.length})</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {notificationMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-fade-in ${
              notificationMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{notificationMsg.text}</span>
            <button type="button" onClick={() => setNotificationMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-[#e5e5ea] animate-pulse space-y-2"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayedList.length === 0 ? (
          <div className="text-center py-12 px-4 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e5ea] flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-[#86868b]" />
            </div>
            <h4 className="text-base font-bold text-[#1d1d1f]">
              {activeTab === 'upcoming' ? 'No Upcoming Consultations' : 'No Past Visits'}
            </h4>
            <p className="text-xs text-[#86868b] mt-1 mb-5">
              {activeTab === 'upcoming'
                ? 'No upcoming visits scheduled.'
                : 'No past visits found.'}
            </p>
            {activeTab === 'upcoming' && (
              <AppleButton variant="primary" size="md" onClick={onExplorePress}>
                Find a Doctor
              </AppleButton>
            )}
          </div>
        ) : (
          displayedList.map((appt) => {
            const isPending = appt.status === 'PENDING' || appt.status === 'PENDING_APPROVAL';
            const isCompleted = appt.status === 'COMPLETED';
            const isCancelled = appt.status === 'CANCELLED' || appt.status === 'REJECTED';
            const isWaiting = appt.status === 'WAITING';
            const isInCabin = appt.status === 'IN_CONSULTATION';

            const docName =
              appt.doctor?.user?.fullName ||
              (appt as any).doctorName ||
              'Practitioner';

            return (
              <AppleCard key={appt.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black text-[#0066cc]">
                      {isPending ? 'Estimated ' : ''}Token #{String(isPending ? (appt.estimatedQueueNumber || (appt.queueNumber > 0 ? appt.queueNumber : 1)) : appt.queueNumber).padStart(2, '0')}
                    </span>
                    <h4 className="text-sm font-bold text-[#1d1d1f] mt-0.5">
                      {docName.toLowerCase().startsWith('dr.') ? docName : `Dr. ${docName}`}
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      {appt.doctor?.specialty || 'Specialist'}
                    </p>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5ea]'
                        : isCancelled
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : isInCabin
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-[#0066cc] border-blue-200'
                    }`}
                  >
                    {isCompleted
                      ? 'Completed'
                      : isCancelled
                      ? 'Cancelled'
                      : isPending
                      ? 'Pending Payment'
                      : isInCabin
                      ? 'In Cabin'
                      : 'Waiting'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#86868b] pt-2 border-t border-[#f0f0f2]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>{appt.appointmentDate || appt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <User className="w-3.5 h-3.5 text-[#86868b]" />
                    <span>{appt.isForOther ? appt.patientName : 'Myself'}</span>
                  </div>
                </div>

                {(appt.consultationNotes || (appt as any).clinicalNotes) && (
                  <div className="bg-[#fafafc] p-2.5 rounded-xl border border-[#f0f0f2] text-xs">
                    <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-0.5">
                      Doctor's Notes
                    </span>
                    <p className="text-[#1d1d1f] leading-relaxed">
                      {appt.consultationNotes || (appt as any).clinicalNotes}
                    </p>
                  </div>
                )}

                {/* Action Buttons: Cancel (Upcoming) or Review (Past/Completed) */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f0f0f0]">
                  {(isWaiting || appt.status === 'PENDING_APPROVAL') && (
                    <button
                      type="button"
                      onClick={() => setCancelModalAppt(appt)}
                      className="px-3 py-1.5 rounded-full text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-medium transition-colors"
                    >
                      Cancel Token
                    </button>
                  )}

                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => setReviewModalAppt(appt)}
                      className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{appt.review ? 'Update Review' : 'Rate Doctor'}</span>
                    </button>
                  )}
                </div>
              </AppleCard>
            );
          })
        )}
      </div>

      {/* Cancel Appointment Confirmation Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#e5e5ea] animate-slide-up space-y-3.5">
            <div className="flex items-center gap-2 text-rose-600">
              <Ban className="w-5 h-5" />
              <h3 className="font-bold text-base text-[#1d1d1f]">Cancel Appointment</h3>
            </div>
            <p className="text-xs text-[#86868b]">
              Are you sure you want to cancel Token #{cancelModalAppt.queueNumber}? Your position will be released to the next patient in line.
            </p>

            <div>
              <label className="block text-[11px] font-medium text-[#1d1d1f] mb-1">Reason for Cancellation</label>
              <input
                type="text"
                placeholder="e.g. Schedule conflict, feeling better"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
              >
                Keep Token
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-medium hover:bg-rose-700"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-Star Doctor Review Modal */}
      {reviewModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-[#e5e5ea] animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
              <h3 className="font-bold text-base text-[#1d1d1f]">Rate Your Visit</h3>
              <button
                type="button"
                onClick={() => setReviewModalAppt(null)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-[#86868b]">How was your consultation experience with the doctor?</p>
              {/* Star Rating Picker */}
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    className="p-1 cursor-pointer active:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        starVal <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-[#1d1d1f]">
                {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Average (3/5)' : 'Needs Improvement'}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#1d1d1f] mb-1">Feedback Comment (Optional)</label>
              <textarea
                rows={3}
                placeholder="Share your thoughts on waiting time, doctor explanation, and facility..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReviewModalAppt(null)}
                className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="px-5 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium hover:bg-[#0071e3]"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
