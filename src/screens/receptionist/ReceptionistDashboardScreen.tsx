import React, { useEffect, useState, useCallback } from 'react';
import {
  api,
  ReceptionistDashboardData,
  ReceptionistQueueItem,
  Appointment,
  QueuePreview,
  getLocalDateString,
  AppNotification,
} from '../../services/api';
import { sanitizeIndianPhone, isValidIndianPhone, formatDisplayPhone } from '../../utils/phoneUtils';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Copy,
  Check,
  Building2,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  Lock,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  Bell,
  LogOut,
  Ticket,
  ChevronRight,
} from 'lucide-react';

export type ReceptionistTab = 'walkin' | 'queue' | 'pending' | 'cabin' | 'notifications';

interface ReceptionistDashboardScreenProps {
  onOpenRoleSwitcher?: () => void;
  activeTab?: ReceptionistTab;
  onTabChange?: (tab: ReceptionistTab) => void;
}

export const ReceptionistDashboardScreen: React.FC<ReceptionistDashboardScreenProps> = ({
  onOpenRoleSwitcher,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const { logout } = useAuth();
  const [data, setData] = useState<ReceptionistDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab: 'walkin' | 'queue' | 'pending' | 'cabin' | 'notifications'
  const [localActiveTab, setLocalActiveTab] = useState<ReceptionistTab>('walkin');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = (tab: ReceptionistTab) => {
    setLocalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  // Selected Doctor for Walk-in and Queue
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(getLocalDateString());

  // Walk-In Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [patientAge, setPatientAge] = useState('');
  const [slotId, setSlotId] = useState<string>('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [issuingToken, setIssuingToken] = useState(false);

  // Live Token Preview
  const [walkinPreview, setWalkinPreview] = useState<QueuePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Issued Token Pass Modal
  const [issuedPass, setIssuedPass] = useState<{
    queueNumber: number;
    patientName: string;
    doctorName: string;
    estimatedTime: string;
    checkingWindow: string;
    date: string;
    clinicName: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Live Queue Desk State
  const [queueItems, setQueueItems] = useState<ReceptionistQueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');

  // Pending Approvals State
  const [pendingList, setPendingList] = useState<Appointment[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Reschedule / Shift Date Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    id: string;
    patientName: string;
    doctorName: string;
    currentDate: string;
    slotId?: string;
    doctorId?: string;
  } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlotId, setRescheduleSlotId] = useState<string>('');
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Cabin Presence State
  const [updatingCabin, setUpdatingCabin] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  

  const loadReceptionistData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await api.getMyReceptionist();
      if (res.success && res.data) {
        setData(res.data);
        if (res.data.doctors && res.data.doctors.length > 0) {
          setSelectedDoctorId(res.data.doctors[0].doctorId);
        }
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        setUnreadNotifCount(res.data.unreadCount ?? notifs.filter((n: any) => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnreadNotifCount(0);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch {}
  };

  useEffect(() => {
    loadReceptionistData();
    fetchNotifications();
  }, [loadReceptionistData, fetchNotifications]);

  // Load Queue when doctor or date changes
  const loadDoctorQueue = useCallback(async () => {
    if (!selectedDoctorId) return;
    setQueueLoading(true);
    try {
      const res = await api.getReceptionistDoctorQueue(selectedDoctorId, appointmentDate);
      if (res.success && res.data?.appointments) {
        setQueueItems(res.data.appointments);
      } else {
        setQueueItems([]);
      }
    } catch {
      setQueueItems([]);
    } finally {
      setQueueLoading(false);
    }
  }, [selectedDoctorId, appointmentDate]);

  useEffect(() => {
    if (activeTab === 'queue') {
      loadDoctorQueue();
    }
  }, [activeTab, loadDoctorQueue]);

  // Load Live Preview when slot / doctor changes for walkin
  useEffect(() => {
    if (!selectedDoctorId) return;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await api.getQueuePreview(selectedDoctorId, appointmentDate, slotId || undefined);
        if (res.success && res.data) {
          setWalkinPreview(res.data);
          if (!slotId && res.data.selectedSlotId) {
            setSlotId(res.data.selectedSlotId);
          }
        }
      } catch {
        // non-blocking
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreview();
  }, [selectedDoctorId, appointmentDate, slotId]);

  // Load Pending Approvals
  const loadPendingApprovals = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await api.getPendingAppointments();
      if (res.success && Array.isArray(res.data)) {
        setPendingList(res.data);
      } else {
        setPendingList([]);
      }
    } catch {
      setPendingList([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingApprovals();
    }
  }, [activeTab, loadPendingApprovals]);

  const handleIssueWalkinToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }

    const cleanPhone = sanitizeIndianPhone(patientPhone);
    if (!cleanPhone || !isValidIndianPhone(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setIssuingToken(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.bookWalkinAppointment({
        doctorId: selectedDoctorId,
        patientName: patientName.trim(),
        patientPhone: cleanPhone,
        gender,
        patientAge: patientAge.trim() || undefined,
        appointmentDate,
        slotId: slotId || undefined,
        reasonForVisit: reasonForVisit.trim() || undefined,
        clinicId: data?.clinic?.id,
      });

      const nextNum = walkinPreview?.nextQueueNumber || 4;
      const targetDoc = data?.doctors?.find((d) => d.doctorId === selectedDoctorId);

      setIssuedPass({
        queueNumber: res.data?.queueNumber || nextNum,
        patientName: patientName.trim(),
        doctorName: targetDoc?.fullName || 'Doctor',
        estimatedTime: walkinPreview?.estimatedTime || '09:45 AM',
        checkingWindow: walkinPreview?.checkingWindow || 'Morning Shift',
        date: appointmentDate,
        clinicName: data?.clinic?.clinicName || 'Clinic',
      });

      setSuccessMsg(`Token #${res.data?.queueNumber || nextNum} generated successfully!`);
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setReasonForVisit('');
    } catch (err: any) {
      setError(err.message || 'Failed to issue token');
    } finally {
      setIssuingToken(false);
    }
  };

  const handleCheckInDirect = async (apptId: string, isCheckedIn = true) => {
    try {
      const res = await api.checkInAppointmentDirect(apptId, isCheckedIn);
      if (res.success) {
        setQueueItems((prev) =>
          prev.map((item) => (item.id === apptId ? { ...item, isCheckedIn } : item))
        );
        setSuccessMsg(isCheckedIn ? 'Patient arrival marked as Checked In' : 'Check-in status removed');
        setTimeout(() => setSuccessMsg(null), 2500);
      } else {
        setError(res.message || 'Failed to update check-in status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update check-in status');
    }
  };

  const handleUpdateStatus = async (apptId: string, status: string) => {
    try {
      if (status === 'IN_CONSULTATION') {
        const currentItem = queueItems.find((q) => q.id === apptId);
        if (currentItem && !currentItem.isCheckedIn) {
          await api.checkInAppointmentDirect(apptId, true);
        }
      }
      const res = await api.updateAppointmentStatus(apptId, status);
      if (res.success) {
        setQueueItems((prev) =>
          prev.map((item) => (item.id === apptId ? { ...item, status, ...(status === 'IN_CONSULTATION' ? { isCheckedIn: true } : {}) } : item))
        );
        setSuccessMsg(`Token marked as ${status}`);
        setTimeout(() => setSuccessMsg(null), 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleApproveAppointment = async (apptId: string) => {
    try {
      const res = await api.approveAppointment(apptId);
      if (res.success) {
        setPendingList((prev) => prev.filter((item) => item.id !== apptId));
        setSuccessMsg('Appointment approved and token assigned!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve appointment');
    }
  };

  const handleRejectAppointment = async (apptId: string) => {
    const reason = window.prompt('Reason for rejecting appointment:');
    if (reason === null) return;

    try {
      const res = await api.rejectAppointment(apptId, reason);
      if (res.success) {
        setPendingList((prev) => prev.filter((item) => item.id !== apptId));
        setSuccessMsg('Appointment rejected.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject appointment');
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      const res = await api.rescheduleAppointment(rescheduleTarget.id, {
        newDate: rescheduleDate,
        newSlotId: rescheduleSlotId || undefined,
      });
      if (res.success) {
        setPendingList((prev) => prev.filter((p) => p.id !== rescheduleTarget.id));
        setRescheduleTarget(null);
        setSuccessMsg('Appointment shifted successfully to new date!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setRescheduleError(res.message || 'Failed to shift appointment date');
      }
    } catch (err: any) {
      setRescheduleError(err.message || 'Error updating appointment date');
    } finally {
      setRescheduling(false);
    }
  };

  const handleUpdateDoctorCabin = async (
    status: 'IN_CABIN' | 'STEPPED_OUT' | 'NOT_IN_CABIN',
    mins?: number
  ) => {
    setUpdatingCabin(true);
    try {
      const res = await api.updateDoctorCabinStatus({
        status,
        doctorId: selectedDoctorId,
        returnEstimateMinutes: mins,
      });
      if (res.success) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            doctors: prev.doctors.map((d) =>
              d.doctorId === selectedDoctorId ? { ...d, cabinStatus: status } : d
            ),
          };
        });
        setSuccessMsg(`Doctor cabin status updated to ${status.replace('_', ' ')}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update cabin presence');
    } finally {
      setUpdatingCabin(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('Please provide current and new passwords.');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await api.changeReceptionistPassword({ currentPassword, newPassword });
      if (res.success) {
        setSuccessMsg('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setError(res.message || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCopyPass = () => {
    if (!issuedPass) return;
    const text = `🏥 ${issuedPass.clinicName}\n🎫 Token #${issuedPass.queueNumber}\n👨‍⚕️ ${issuedPass.doctorName}\n👤 Patient: ${issuedPass.patientName}\n⏰ Estimated Time: ${issuedPass.estimatedTime}\n📅 Date: ${issuedPass.date}\nShift: ${issuedPass.checkingWindow}`;
    navigator.clipboard?.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const doctors = data?.doctors || [];
  const currentDoctor = doctors.find((d) => d.doctorId === selectedDoctorId) || doctors[0];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 text-[#1d1d1f]">
      {/* Sub Bar */}
      <div className="bg-white border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base text-[#1d1d1f] tracking-tight">Front Desk</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0066cc] font-medium border border-blue-200/60">
                  {data?.clinic?.clinicName || 'Clinic Desk'}
                </span>
              </div>
              <p className="text-xs text-[#86868b]">{data?.receptionist?.fullName || 'Clara Oswald'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadReceptionistData(true);
              }}
              disabled={refreshing}
              className="p-2 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)}><X className="w-4 h-4 text-rose-600" /></button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)}><X className="w-4 h-4 text-emerald-600" /></button>
          </div>
        )}

        {/* Doctor Selector & Cabin Status Presence Widget */}
        {currentDoctor && (
          <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentDoctor.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80'}
                  alt={currentDoctor.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-[#e5e5ea] shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="font-bold text-sm text-[#1d1d1f] bg-transparent focus:outline-none cursor-pointer"
                    >
                      {doctors.map((d) => (
                        <option key={d.doctorId} value={d.doctorId}>
                          {d.fullName} ({d.specialty})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      currentDoctor.cabinStatus === 'IN_CABIN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : currentDoctor.cabinStatus === 'STEPPED_OUT'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {currentDoctor.cabinStatus === 'IN_CABIN' ? 'In Cabin' : currentDoctor.cabinStatus === 'STEPPED_OUT' ? 'Stepped Out' : 'Out of Clinic'}
                    </span>
                    <span className="text-xs text-[#86868b]">Fee: ₹{currentDoctor.consultationFee}</span>
                  </div>
                </div>
              </div>

              {/* Quick Cabin Presence Controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  disabled={updatingCabin}
                  onClick={() => handleUpdateDoctorCabin('IN_CABIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    currentDoctor.cabinStatus === 'IN_CABIN'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  In Cabin
                </button>
                <button
                  type="button"
                  disabled={updatingCabin}
                  onClick={() => handleUpdateDoctorCabin('STEPPED_OUT', 15)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    currentDoctor.cabinStatus === 'STEPPED_OUT'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Stepped Out (15m)
                </button>
                <button
                  type="button"
                  disabled={updatingCabin}
                  onClick={() => handleUpdateDoctorCabin('NOT_IN_CABIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    currentDoctor.cabinStatus === 'NOT_IN_CABIN'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#e5e5ea]/60 rounded-2xl overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('walkin')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'walkin'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Token Desk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'queue'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Live Queue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'pending'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Approvals ({pendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cabin')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'cabin'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Cabin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 min-w-[75px] py-2 px-2 rounded-xl transition-all text-center ${
              activeTab === 'notifications'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Alerts {unreadNotifCount > 0 ? `(${unreadNotifCount})` : ''}
          </button>
        </div>

        {/* TAB 1: WALK-IN TOKEN DESK */}
        {activeTab === 'walkin' && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e5e5ea] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base text-[#1d1d1f]">Issue Walk-In Token</h2>
              </div>
              {walkinPreview && (
                <div className="bg-blue-50 border border-blue-200/60 rounded-2xl px-3.5 py-2 text-right">
                  <div className="text-[10px] text-[#86868b] font-medium">NEXT TOKEN</div>
                  <div className="text-base font-bold text-[#0066cc]">#{walkinPreview.nextQueueNumber}</div>
                  <div className="text-[10px] text-[#86868b]">Est: {walkinPreview.estimatedTime}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleIssueWalkinToken} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Mobile Phone (10-Digit) *</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e5e5ea] text-sm bg-white focus:outline-none focus:border-[#0066cc]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 34"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e5e5ea] text-sm bg-white focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>

              {/* Slot Selector */}
              {currentDoctor.slots && currentDoctor.slots.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Doctor Shift / Slot</label>
                  <select
                    value={slotId}
                    onChange={(e) => setSlotId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm bg-white focus:outline-none focus:border-[#0066cc]"
                  >
                    {currentDoctor.slots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Cap: {s.maxPatients})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Reason for Visit / Symptoms</label>
                <input
                  type="text"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="e.g. High blood pressure checkup, routine consultation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <button
                type="submit"
                disabled={issuingToken}
                className="w-full py-3.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>{issuingToken ? 'Generating Token Slip...' : 'Issue Live Token Slip'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: LIVE QUEUE DESK */}
        {activeTab === 'queue' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <h2 className="text-sm font-semibold text-[#1d1d1f]">Live Patient Queue ({queueItems.length})</h2>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
                <input
                  type="text"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Search patient name..."
                  className="pl-8 pr-3 py-1.5 rounded-full border border-[#e5e5ea] text-xs bg-white focus:outline-none focus:border-[#0066cc] w-48"
                />
              </div>
            </div>

            {queueLoading ? (
              <div className="p-8 text-center text-xs text-[#86868b]">Loading queue...</div>
            ) : queueItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#e5e5ea]">
                <Clock className="w-10 h-10 text-[#86868b] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[#1d1d1f]">Queue is clear</p>
                <p className="text-xs text-[#86868b] mt-1">No patients waiting for this shift.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queueItems
                  .filter((item) =>
                    queueSearch ? item.patientName.toLowerCase().includes(queueSearch.toLowerCase()) : true
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center font-bold text-sm text-[#0066cc] shrink-0">
                          #{item.queueNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm text-[#1d1d1f]">{item.patientName}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'IN_CONSULTATION'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                            {item.isCheckedIn ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Checked In
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCheckInDirect(item.id, true)}
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer transition-colors"
                              >
                                Mark Arrived
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-[#86868b] mt-0.5">
                            {item.patientPhone} • {item.checkingWindow} • Est: {item.estimatedTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {item.status === 'WAITING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'IN_CONSULTATION')}
                            className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0066cc] text-xs font-medium transition-colors"
                          >
                            Call Inside
                          </button>
                        )}
                        {item.status === 'IN_CONSULTATION' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                            className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'CANCELLED')}
                            className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ONLINE APPROVALS */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f]">
                  Pending Approvals ({pendingList.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={loadPendingApprovals}
                className="px-3 py-1.5 rounded-full bg-white border border-[#e5e5ea] text-xs font-semibold text-[#0066cc] hover:bg-[#f5f5f7] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {pendingLoading ? (
              <div className="p-10 text-center text-xs text-[#86868b] bg-white rounded-3xl border border-[#e5e5ea]">
                Loading incoming requests...
              </div>
            ) : pendingList.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#e5e5ea]">
                <ShieldCheck className="w-12 h-12 text-[#0066cc] mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-[#1d1d1f]">No Pending Bookings</p>
                <p className="text-xs text-[#86868b] mt-1">
                  Online bookings awaiting confirmation will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingList.map((item) => {
                  const docName = item.doctor?.user?.fullName || 'Doctor';
                  const specialty = item.doctor?.specialty || 'General Practitioner';
                  const fee = (item as any).fee || (item as any).consultationFee || item.doctor?.consultationFee || 500;
                  const patientPhone = item.patientPhone || (item.patient as any)?.phone || '';
                  const estToken = item.estimatedQueueNumber || (item.queueNumber > 0 ? item.queueNumber : 1);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-4 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Demographics & Token */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-[#1d1d1f]">
                              {item.patientName || 'Patient'}
                            </h4>
                            <span className="text-xs font-bold text-[#0066cc] bg-[#0066cc]/10 px-2.5 py-0.5 rounded-full border border-[#0066cc]/20">
                              Estimated Token #{estToken}
                            </span>
                          </div>

                          <p className="text-xs text-[#86868b]">
                            {item.patientAge ? `${item.patientAge} yrs` : ''}
                            {item.patientAge && item.patientGender ? ' · ' : ''}
                            {item.patientGender || (item as any).gender || 'Not specified'}
                          </p>

                          {patientPhone && (
                            <a
                              href={`tel:${patientPhone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1.5 text-xs text-[#0066cc] font-semibold hover:underline mt-0.5"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{formatDisplayPhone(patientPhone)}</span>
                            </a>
                          )}
                        </div>

                        {/* Fee Badge */}
                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[#f0f0f2]">
                          <span className="text-base font-black text-[#1d1d1f]">₹{fee}</span>
                          <span className="text-[11px] text-[#86868b] font-medium">Fee to Collect</span>
                        </div>
                      </div>

                      {/* Doctor & Slot Details */}
                      <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#1d1d1f]">
                          Dr. {docName} ({specialty})
                        </span>
                        <span className="text-[#86868b]">
                          {item.appointmentDate} · {item.checkingWindow || 'Scheduled Shift'}
                        </span>
                      </div>

                      {/* Reason & Symptoms */}
                      {(item.reasonForVisit || item.symptoms) && (
                        <div className="text-xs text-[#48484a] space-y-0.5">
                          {item.reasonForVisit && (
                            <p>
                              <strong className="text-[#1d1d1f]">Reason:</strong> {item.reasonForVisit}
                            </p>
                          )}
                          {item.symptoms && (
                            <p>
                              <strong className="text-[#1d1d1f]">Symptoms:</strong> {item.symptoms}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-[#f0f0f2]">
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleTarget({
                              id: item.id,
                              patientName: item.patientName || 'Patient',
                              doctorName: docName,
                              currentDate: item.appointmentDate,
                              slotId: item.slotId,
                              doctorId: item.doctorId,
                            });
                            setRescheduleDate(item.appointmentDate);
                            setRescheduleSlotId(item.slotId || '');
                            setRescheduleError(null);
                          }}
                          className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#0066cc] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Shift Date</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectAppointment(item.id)}
                          className="px-4 py-2.5 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApproveAppointment(item.id)}
                          className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#0066cc] hover:bg-[#0071e3] transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm & Issue Token (₹{fee})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOCTOR CABIN CONTROLS */}
        {activeTab === 'cabin' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                <div>
                  <h3 className="font-semibold text-base text-[#1d1d1f]">Doctor Cabin Controls</h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-700">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>

              {doctors.length === 0 ? (
                <p className="text-xs text-[#86868b] py-4 text-center">No affiliated doctors found for this desk.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">Select Doctor</label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm bg-white focus:outline-none focus:border-[#0066cc]"
                    >
                      {doctors.map((d) => (
                        <option key={d.doctorId} value={d.doctorId}>
                          {d.fullName} ({d.specialty}) — Current: {d.cabinStatus === 'IN_CABIN' ? 'In Cabin' : d.cabinStatus === 'STEPPED_OUT' ? 'Stepped Out' : 'Out'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentDoctor && (
                    <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={currentDoctor.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80'}
                          alt={currentDoctor.fullName}
                          className="w-12 h-12 rounded-full object-cover border border-[#e5e5ea]"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-[#1d1d1f]">{currentDoctor.fullName}</h4>
                          <p className="text-xs text-[#86868b]">{currentDoctor.specialty} • Consultation Fee: ₹{currentDoctor.consultationFee}</p>
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              currentDoctor.cabinStatus === 'IN_CABIN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : currentDoctor.cabinStatus === 'STEPPED_OUT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {currentDoctor.cabinStatus === 'IN_CABIN' ? 'In Cabin (Ready for Next Patient)' : currentDoctor.cabinStatus === 'STEPPED_OUT' ? 'Stepped Out on Break' : 'Out of Clinic'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#e5e5ea] grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={updatingCabin}
                          onClick={() => handleUpdateDoctorCabin('IN_CABIN')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentDoctor.cabinStatus === 'IN_CABIN'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          In Cabin
                        </button>
                        <button
                          type="button"
                          disabled={updatingCabin}
                          onClick={() => handleUpdateDoctorCabin('STEPPED_OUT', 15)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentDoctor.cabinStatus === 'STEPPED_OUT'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          Step Out (15m)
                        </button>
                        <button
                          type="button"
                          disabled={updatingCabin}
                          onClick={() => handleUpdateDoctorCabin('NOT_IN_CABIN')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentDoctor.cabinStatus === 'NOT_IN_CABIN'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          Off Duty
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DESK NOTIFICATIONS & SECURITY */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {/* Live Notifications Box */}
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#0066cc]" />
                  <h3 className="font-semibold text-sm text-[#1d1d1f]">Front Desk Alerts</h3>
                  {unreadNotifCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {unreadNotifCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotifsRead}
                    className="text-xs text-[#0066cc] font-medium hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-[#86868b] py-6 text-center">No alerts logged for this desk yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkNotifRead(notif.id)}
                      className={`p-3 rounded-2xl border transition-all text-xs cursor-pointer ${
                        notif.isRead
                          ? 'bg-[#f5f5f7] border-[#e5e5ea] opacity-80'
                          : 'bg-blue-50/60 border-blue-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1d1d1f]">{notif.title}</span>
                        <span className="text-[10px] text-[#86868b]">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[#48484a] mt-1">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change Desk Password Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f0f0f0]">
                <Lock className="w-4 h-4 text-[#0066cc]" />
                <h3 className="font-semibold text-sm text-[#1d1d1f]">Update Desk Password</h3>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  {changingPassword ? 'Updating...' : 'Save New Password'}
                </button>
              </form>
            </div>

            {/* Sign Out Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3">
              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out of Desk Account</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Issued Token Pass Modal */}
      {issuedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#86868b]">MediArca Clinical Token</span>
              <h2 className="text-4xl font-extrabold text-[#0066cc] mt-1">#{issuedPass.queueNumber}</h2>
              <p className="text-xs font-semibold text-[#1d1d1f] mt-1">{issuedPass.patientName}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs space-y-1.5 text-left font-mono">
              <div><strong className="text-[#86868b]">Doctor:</strong> {issuedPass.doctorName}</div>
              <div><strong className="text-[#86868b]">Clinic:</strong> {issuedPass.clinicName}</div>
              <div><strong className="text-[#86868b]">Est. Time:</strong> {issuedPass.estimatedTime}</div>
              <div><strong className="text-[#86868b]">Shift:</strong> {issuedPass.checkingWindow}</div>
              <div><strong className="text-[#86868b]">Date:</strong> {issuedPass.date}</div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={handleCopyPass}
                className="px-4 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium flex items-center gap-1.5"
              >
                {copiedPass ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPass ? 'Copied Slip' : 'Copy Slip Details'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIssuedPass(null)}
                className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Date / Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[24px] p-5 sm:p-6 shadow-2xl border border-[#e5e5ea] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f2]">
              <div>
                <h3 className="text-base font-bold text-[#1d1d1f]">Shift Appointment Date</h3>
                <p className="text-xs text-[#86868b]">{rescheduleTarget.patientName} · {rescheduleTarget.doctorName}</p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="p-1.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                  Select New Consultation Date
                </label>
                <input
                  type="date"
                  min={getLocalDateString()}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#e5e5ea] text-xs font-medium bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all cursor-pointer"
                />
              </div>

              {(() => {
                const doc = doctors.find((d) => d.doctorId === rescheduleTarget.doctorId) || doctors[0];
                if (!doc || !doc.slots || doc.slots.length === 0) return null;
                return (
                  <div>
                    <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
                      Select Shift
                    </label>
                    <select
                      value={rescheduleSlotId}
                      onChange={(e) => setRescheduleSlotId(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#e5e5ea] text-xs bg-[#f5f5f7] text-[#1d1d1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all cursor-pointer"
                    >
                      {doc.slots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.startTime} – {s.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 py-2.5 rounded-full bg-[#f5f5f7] text-xs font-semibold text-[#1d1d1f] hover:bg-[#e5e5ea] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rescheduling || !rescheduleDate}
                onClick={handleConfirmReschedule}
                className="flex-1 py-2.5 rounded-full bg-[#0066cc] text-xs font-bold text-white hover:bg-[#0071e3] transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {rescheduling ? 'Shifting...' : 'Confirm Shift Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
