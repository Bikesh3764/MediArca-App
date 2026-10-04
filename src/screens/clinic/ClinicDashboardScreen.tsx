import React, { useEffect, useState, useCallback } from 'react';
import {
  api,
  ClinicDashboardData,
  ClinicReceptionistItem,
  Doctor,
  formatDoctorDegrees,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_STATES } from '../../utils/indiaStates';
import {
  Users,
  IndianRupee,
  CalendarCheck,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  QrCode,
  Copy,
  Check,
  Building2,
  RefreshCw,
  Clock,
  Sparkles,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  LogOut,
  Save,
  Phone,
  MapPin,
  User,
  Shield,
  Building,
} from 'lucide-react';

export type ClinicTab = 'kpi' | 'doctors' | 'receptionists' | 'standee' | 'profile';

interface ClinicDashboardScreenProps {
  onOpenRoleSwitcher?: () => void;
  activeTab?: ClinicTab;
  onTabChange?: (tab: ClinicTab) => void;
}

export const ClinicDashboardScreen: React.FC<ClinicDashboardScreenProps> = ({
  onOpenRoleSwitcher,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const { user, refreshUser, logout } = useAuth();
  const [data, setData] = useState<ClinicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab: 'kpi' | 'doctors' | 'receptionists' | 'standee' | 'profile'
  const [localActiveTab, setLocalActiveTab] = useState<ClinicTab>('kpi');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = (tab: ClinicTab) => {
    setLocalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Clinic Profile State
  const [clinicName, setClinicName] = useState(
    user?.clinicProfile?.clinicName || user?.fullName || ''
  );
  const [clinicPhone, setClinicPhone] = useState(user?.clinicProfile?.phone || '');
  const [clinicAddress, setClinicAddress] = useState(
    user?.clinicProfile?.address || ''
  );
  const [clinicCity, setClinicCity] = useState(user?.clinicProfile?.city || '');
  const [clinicState, setClinicState] = useState(user?.clinicProfile?.state || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Doctor Onboarding Modal
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);

  // Receptionist Provisioning Modal
  const [showRecModal, setShowRecModal] = useState(false);
  const [recFullName, setRecFullName] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recPassword, setRecPassword] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recDoctorIds, setRecDoctorIds] = useState<string[]>([]);
  const [provisioning, setProvisioning] = useState(false);

  // Receptionist Credentials Handover Modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  

  const loadClinicData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await api.getMyClinic();
      if (res.success && res.data) {
        setData(res.data);
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

  useEffect(() => {
    loadClinicData();
  }, [loadClinicData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadClinicData(true);
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorEmail.trim()) return;

    setAddingDoctor(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.addDoctorToClinic({ doctorEmail: doctorEmail.trim() });
      if (res.success) {
        setSuccessMsg(res.message || 'Doctor onboarded successfully!');
        setDoctorEmail('');
        setShowDoctorModal(false);
        loadClinicData(true);
      } else {
        setError(res.message || 'Could not onboard doctor');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to onboard doctor');
    } finally {
      setAddingDoctor(false);
    }
  };

  const handleDetachDoctor = async (doctorId: string, docName: string) => {
    if (!window.confirm(`Detach Dr. ${docName} from your clinic roster? Existing consultation records remain safe.`)) {
      return;
    }
    try {
      const res = await api.removeDoctorFromClinic(doctorId);
      if (res.success) {
        setSuccessMsg(`Dr. ${docName} detached from clinic.`);
        loadClinicData(true);
      } else {
        setError(res.message || 'Failed to detach doctor');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detach doctor');
    }
  };

  const handleProvisionReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recFullName.trim() || !recEmail.trim() || !recPassword.trim()) {
      setError('Please provide staff name, login email, and password.');
      return;
    }

    setProvisioning(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.addClinicReceptionist({
        fullName: recFullName.trim(),
        email: recEmail.trim(),
        password: recPassword.trim(),
        phone: recPhone.trim() || undefined,
        doctorIds: recDoctorIds,
      });

      if (res.success) {
        setCreatedCredentials({
          fullName: recFullName.trim(),
          email: recEmail.trim(),
          password: recPassword.trim(),
        });
        setSuccessMsg('Receptionist account created successfully!');
        setRecFullName('');
        setRecEmail('');
        setRecPassword('');
        setRecPhone('');
        setRecDoctorIds([]);
        setShowRecModal(false);
        loadClinicData(true);
      } else {
        setError(res.message || 'Failed to provision receptionist');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to provision receptionist');
    } finally {
      setProvisioning(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `MediArca Front Desk Access:\nName: ${createdCredentials.fullName}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}\nLogin URL: https://mediarca-mdwk.onrender.com/`;
    navigator.clipboard?.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleCopyCheckinCode = () => {
    const code = data?.clinic?.checkinCode || 'CLINIC01';
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveClinicProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.updateClinicProfile({
        clinicName: clinicName.trim(),
        phone: clinicPhone.trim(),
        address: clinicAddress.trim(),
        city: clinicCity.trim(),
        state: clinicState.trim(),
      });
      if (res.success) {
        setSuccessMsg('Clinic profile saved successfully.');
        await refreshUser();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.message || 'Failed to update clinic profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update clinic profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const clinic = data?.clinic || {
    id: '',
    clinicName: user?.clinicProfile?.clinicName || user?.fullName || 'My Clinic',
    address: user?.clinicProfile?.address || '',
    city: user?.clinicProfile?.city || '',
    state: user?.clinicProfile?.state || '',
    phone: user?.clinicProfile?.phone || '',
    checkinCode: user?.clinicProfile?.checkinCode || '',
    isVerified: Boolean(user?.clinicProfile?.isVerified),
    verificationStatus: user?.clinicProfile?.verificationStatus || 'PENDING',
  };
  const doctors = data?.doctors || [];
  const receptionists = data?.receptionists || [];
  const appointments = data?.recentAppointments || [];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 text-[#1d1d1f]">
      {/* Sub Bar */}
      <div className="bg-white border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base text-[#1d1d1f] tracking-tight">{clinic.clinicName}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {clinic.verificationStatus || 'VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-[#86868b]">{clinic.city || 'Mumbai'}, {clinic.state || 'Maharashtra'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {onOpenRoleSwitcher && (
              <button
                type="button"
                onClick={onOpenRoleSwitcher}
                className="px-3 py-1.5 rounded-full bg-[#0066cc]/10 hover:bg-[#0066cc]/20 text-[#0066cc] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Switch Role</span>
              </button>
            )}
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

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-[#e5e5ea]/60 rounded-2xl overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('kpi')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition-all text-center ${
              activeTab === 'kpi'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Operations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition-all text-center ${
              activeTab === 'doctors'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Doctors ({doctors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receptionists')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition-all text-center ${
              activeTab === 'receptionists'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Desks ({receptionists.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('standee')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition-all text-center ${
              activeTab === 'standee'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Standee
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition-all text-center ${
              activeTab === 'profile'
                ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Profile
          </button>
        </div>

        {/* TAB 1: OPERATIONS KPI & REVENUE */}
        {activeTab === 'kpi' && (
          <div className="space-y-4">
            {/* Clinic KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs">
                <div className="flex items-center gap-2 text-[#86868b] text-xs">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>Doctors</span>
                </div>
                <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">{data?.totalDoctors || doctors.length}</div>
                <div className="text-[10px] text-teal-700 font-medium mt-0.5">Active Roster</div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs">
                <div className="flex items-center gap-2 text-[#86868b] text-xs">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Bookings</span>
                </div>
                <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">{data?.totalBookings || 71}</div>
                <div className="text-[10px] text-blue-700 font-medium mt-0.5">Total Consults</div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs">
                <div className="flex items-center gap-2 text-[#86868b] text-xs">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Revenue</span>
                </div>
                <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">₹{(data?.totalRevenue || 52450).toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Gross Clinical</div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs">
                <div className="flex items-center gap-2 text-[#86868b] text-xs">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Desks</span>
                </div>
                <div className="text-xl font-bold text-[#1d1d1f] mt-1.5">{receptionists.length}</div>
                <div className="text-[10px] text-amber-700 font-medium mt-0.5">Front Staff</div>
              </div>
            </div>

            {/* Check-In Code Quick Card */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/50 flex items-center justify-center text-[#0066cc]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[#86868b]">Clinic Fast Check-In Code</div>
                  <div className="text-base font-bold text-[#1d1d1f] tracking-wider">{clinic.checkinCode || 'CLINIC01'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCheckinCode}
                className="px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5ea] text-xs font-medium text-[#1d1d1f] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Doctor Revenue Breakdown Table */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1d1d1f]">Doctor Performance & Revenue</h3>
                <span className="text-xs text-[#86868b]">{doctors.length} Doctors</span>
              </div>

              {doctors.length === 0 ? (
                <p className="text-xs text-[#86868b] py-3 text-center">No doctor records available.</p>
              ) : (
                <div className="space-y-2">
                  {doctors.map((doc) => (
                    <div
                      key={doc.doctorId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#1d1d1f]">{doc.fullName}</div>
                        <div className="text-[#86868b] text-[11px]">{doc.specialty} • Fee: ₹{doc.consultationFee}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-700">₹{(doc.revenue || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-[#86868b]">{doc.completedCount || 0} visits done</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Clinic Visits Ledger */}
            <div className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1d1d1f]">Today’s Visits Ledger</h3>
                <span className="text-xs text-[#86868b]">{appointments.length} Consults</span>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#86868b]">
                  No appointments logged today yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-3 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-[#0066cc] font-bold flex items-center justify-center text-[11px]">
                          #{appt.queueNumber}
                        </div>
                        <div>
                          <div className="font-semibold text-[#1d1d1f]">{appt.patientName}</div>
                          <div className="text-[11px] text-[#86868b]">{appt.doctorName} • {appt.estimatedTime}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          appt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {appt.status}
                        </span>
                        <div className="font-bold text-[#1d1d1f] mt-0.5">₹{appt.fee}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DOCTORS ROSTER */}
        {activeTab === 'doctors' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1d1d1f]">Practitioner Roster</h2>
              <button
                type="button"
                onClick={() => setShowDoctorModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Onboard Doctor</span>
              </button>
            </div>

            {doctors.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#e5e5ea]">
                <Stethoscope className="w-10 h-10 text-[#86868b] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[#1d1d1f]">No doctors affiliated yet</p>
                <p className="text-xs text-[#86868b] mt-1 mb-4">Onboard your first physician using their MediArca email.</p>
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(true)}
                  className="px-4 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium"
                >
                  Onboard Doctor
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {doctors.map((doc) => (
                  <div
                    key={doc.doctorId}
                    className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={doc.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80'}
                        alt={doc.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-[#e5e5ea] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-[#1d1d1f]">{doc.fullName}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#0066cc] font-medium border border-blue-200/50">
                            {doc.specialty}
                          </span>
                        </div>
                        <p className="text-xs text-[#86868b] mt-0.5">
                          {formatDoctorDegrees(doc.qualifications)} • {doc.experienceYears} yrs experience
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#86868b] mt-1">
                          <span>Fee: <strong className="text-[#1d1d1f]">₹{doc.consultationFee}</strong></span>
                          <span>Consults: <strong className="text-[#1d1d1f]">{doc.bookingCount}</strong></span>
                          <span>Rev: <strong className="text-emerald-700">₹{doc.revenue.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleDetachDoctor(doc.doctorId, doc.fullName)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Detach Doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECEPTIONIST DESKS */}
        {activeTab === 'receptionists' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1d1d1f]">Front Desk Receptionists</h2>
              <button
                type="button"
                onClick={() => setShowRecModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Provision Desk</span>
              </button>
            </div>

            {receptionists.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#e5e5ea]">
                <Users className="w-10 h-10 text-[#86868b] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[#1d1d1f]">No receptionist desks provisioned</p>
                <p className="text-xs text-[#86868b] mt-1 mb-4">Create front-desk credentials so staff can issue tokens and manage queues.</p>
                <button
                  type="button"
                  onClick={() => setShowRecModal(true)}
                  className="px-4 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium"
                >
                  Provision Desk
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {receptionists.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[#1d1d1f]">{rec.fullName}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                          Active Desk
                        </span>
                      </div>
                      <p className="text-xs text-[#86868b] mt-0.5">{rec.email} {rec.phone ? `• ${rec.phone}` : ''}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[11px] text-[#86868b]">Assigned Doctors:</span>
                        {rec.doctors && rec.doctors.length > 0 ? (
                          rec.doctors.map((d) => (
                            <span
                              key={d.id}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea]"
                            >
                              {d.fullName}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-amber-700 italic">All clinic doctors</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs text-[#86868b]">Provisioned {rec.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QR STANDEE GENERATOR */}
        {activeTab === 'standee' && (
          <div className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-xs text-center space-y-4">
            <div className="max-w-sm mx-auto p-6 rounded-2xl bg-linear-to-b from-blue-50 to-white border-2 border-dashed border-[#0066cc]/30 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0066cc] text-white flex items-center justify-center mx-auto shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1d1d1f]">{clinic.clinicName}</h3>
                <p className="text-xs text-[#86868b]">{clinic.address}</p>
              </div>

              {/* Render visual QR Code standee placeholder */}
              <div className="bg-white p-4 rounded-2xl border border-[#e5e5ea] shadow-xs inline-block mx-auto">
                <div className="w-44 h-44 bg-[#1d1d1f] p-2 rounded-xl flex items-center justify-center text-white">
                  <div className="w-full h-full border-4 border-white flex flex-col items-center justify-center p-2 text-center">
                    <QrCode className="w-16 h-16 text-white mb-1" />
                    <span className="text-[10px] font-mono tracking-widest uppercase">SCAN TO CHECK IN</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#f5f5f7] py-2 px-4 rounded-full inline-block text-xs font-mono font-bold text-[#1d1d1f]">
                CODE: {clinic.checkinCode || 'CLINIC01'}
              </div>

              <p className="text-[11px] text-[#86868b]">
                Patients scan this standee on entry with MediArca App to automatically confirm presence and claim their queue position.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyCheckinCode}
                className="px-5 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-xs"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedCode ? 'Code Copied!' : 'Copy Fast Check-In Code'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: CLINIC PROFILE & ACCOUNT SETTINGS */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Clinic Info Header Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-[#1d1d1f] truncate">{clinicName}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shrink-0">
                    {clinic.verificationStatus || 'VERIFIED'}
                  </span>
                </div>
                <p className="text-xs text-[#86868b] mt-0.5">{clinicCity}, {clinicState}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#0066cc]">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Check-In Code: <strong>{clinic.checkinCode || 'CLINIC01'}</strong></span>
                </div>
              </div>
            </div>

            {/* Clinic Details Form */}
            <form onSubmit={handleSaveClinicProfile} className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
                <h3 className="font-semibold text-sm text-[#1d1d1f]">Facility Information</h3>
                <span className="text-xs text-[#86868b]">Clinical Operations</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Clinical Facility Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Street Address</label>
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">City</label>
                  <input
                    type="text"
                    value={clinicCity}
                    onChange={(e) => setClinicCity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1">State / UT</label>
                  <select
                    value={clinicState}
                    onChange={(e) => setClinicState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm bg-white focus:outline-none focus:border-[#0066cc]"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving...' : 'Save Facility Details'}</span>
                </button>
              </div>
            </form>

            {/* Quick Actions & Logout Card */}
            <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs space-y-3">
              <h3 className="font-semibold text-xs text-[#86868b] uppercase tracking-wider">Workspace & Account</h3>
              
              {onOpenRoleSwitcher && (
                <button
                  type="button"
                  onClick={onOpenRoleSwitcher}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Switch Platform Workspace</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#86868b]" />
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out of Clinic Account</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Onboard Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3 className="font-semibold text-base text-[#1d1d1f]">Onboard Physician</h3>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Doctor Email</label>
                <input
                  type="email"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  placeholder="e.g. doctor@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
                <p className="text-[11px] text-[#86868b] mt-1">
                  Physician must have a verified MediArca Doctor account.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDoctor}
                  className="px-5 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium hover:bg-[#0071e3] transition-colors"
                >
                  {addingDoctor ? 'Onboarding...' : 'Send Affiliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Receptionist Modal */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3 className="font-semibold text-base text-[#1d1d1f]">Provision Front Desk Staff</h3>
              <button
                type="button"
                onClick={() => setShowRecModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionReceptionist} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Staff Full Name</label>
                <input
                  type="text"
                  value={recFullName}
                  onChange={(e) => setRecFullName(e.target.value)}
                  placeholder="e.g. Clara Oswald"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Login Email</label>
                <input
                  type="email"
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="e.g. frontdesk@clinic.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Temporary Password</label>
                <input
                  type="text"
                  value={recPassword}
                  onChange={(e) => setRecPassword(e.target.value)}
                  placeholder="e.g. FrontDesk@2026"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={recPhone}
                  onChange={(e) => setRecPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              {doctors.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">Assign Doctors</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {doctors.map((d) => (
                      <label key={d.doctorId} className="flex items-center gap-2 text-xs text-[#1d1d1f] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={recDoctorIds.includes(d.doctorId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRecDoctorIds([...recDoctorIds, d.doctorId]);
                            } else {
                              setRecDoctorIds(recDoctorIds.filter((id) => id !== d.doctorId));
                            }
                          }}
                          className="rounded text-[#0066cc] focus:ring-0"
                        />
                        <span>{d.fullName} ({d.specialty})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisioning}
                  className="px-5 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium hover:bg-[#0071e3] transition-colors"
                >
                  {provisioning ? 'Creating...' : 'Provision Desk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Handover Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-semibold text-base text-[#1d1d1f]">Desk Credentials Ready</h3>
            </div>
            <p className="text-xs text-[#86868b]">
              Copy and hand over these access details to your front desk staff.
            </p>

            <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] font-mono text-xs space-y-1.5">
              <div><strong className="text-[#86868b]">Name:</strong> {createdCredentials.fullName}</div>
              <div><strong className="text-[#86868b]">Email:</strong> {createdCredentials.email}</div>
              <div><strong className="text-[#86868b]">Password:</strong> {createdCredentials.password}</div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="px-4 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium flex items-center gap-1.5"
              >
                {copiedCreds ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCreds ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
