import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  api,
  DoctorAffiliationsData,
  DoctorAffiliationClinic,
  ClinicProfile,
  format12Hour,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ClinicQrStandeeModal } from '../../components/common/ClinicQrStandeeModal';
import { AppleButton } from '../../components/ui/AppleButton';
import {
  ChevronLeft,
  Building2,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Clock3,
  MapPin,
  Phone,
  Search,
  IndianRupee,
  QrCode,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface DoctorAffiliationsScreenProps {
  onBack: () => void;
  onManageClinicSchedule?: (clinicId: string) => void;
}

export const DoctorAffiliationsScreen: React.FC<DoctorAffiliationsScreenProps> = ({
  onBack,
  onManageClinicSchedule,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DoctorAffiliationsData | null>(null);
  const [publicClinics, setPublicClinics] = useState<ClinicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicLoading, setPublicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Affiliate Clinic Modal State
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [affiliateTab, setAffiliateTab] = useState<'search' | 'direct'>('search');
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [directClinicInput, setDirectClinicInput] = useState('');
  const [affiliatingId, setAffiliatingId] = useState<string | null>(null);
  const [submittingDirect, setSubmittingDirect] = useState(false);

  // Standee Modal State
  const [standeeClinic, setStandeeClinic] = useState<{
    clinicId: string;
    clinicName: string;
    clinicAddress?: string;
    clinicPhone?: string;
    checkinCode?: string;
  } | null>(null);

  const loadAffiliations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [affRes, pubRes] = await Promise.all([
        api.getDoctorAffiliations(),
        api.getPublicClinics(),
      ]);

      if (affRes.success && affRes.data) {
        setData(affRes.data);
      } else {
        setData({ clinics: [], receptionists: [], incomingRequests: [], outgoingRequests: [] });
      }

      if (pubRes.success && Array.isArray(pubRes.data)) {
        setPublicClinics(pubRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load affiliations:', err);
      setData({ clinics: [], receptionists: [], incomingRequests: [], outgoingRequests: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAffiliations();
  }, [loadAffiliations]);

  // Handle Quick Affiliate with a verified public clinic
  const handleAffiliateClinic = async (clinicId: string) => {
    setAffiliatingId(clinicId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.addDoctorClinic({ clinicId });
      if (res.success) {
        setSuccessMsg(res.message || 'Affiliation request sent to clinic successfully!');
        await loadAffiliations(true);
      } else {
        setError(res.message || 'Failed to affiliate with clinic');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to affiliate with clinic');
    } finally {
      setAffiliatingId(null);
    }
  };

  // Handle Direct Affiliation via Email or ID
  const handleDirectAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directClinicInput.trim()) return;

    setSubmittingDirect(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const isEmail = directClinicInput.includes('@');
      const res = await api.addDoctorClinic({
        clinicEmail: isEmail ? directClinicInput.trim() : undefined,
        clinicId: !isEmail ? directClinicInput.trim() : undefined,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Clinic affiliation request submitted successfully!');
        setDirectClinicInput('');
        setShowAddClinicModal(false);
        await loadAffiliations(true);
      } else {
        setError(res.message || 'Failed to submit clinic affiliation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit clinic affiliation');
    } finally {
      setSubmittingDirect(false);
    }
  };

  // Respond to incoming clinic invitation
  const handleRespondClinicInvitation = async (
    affiliationId: string,
    action: 'ACCEPT' | 'REJECT'
  ) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.respondToClinicAffiliation(affiliationId, action);
      if (res.success) {
        setSuccessMsg(
          res.message || `Clinic affiliation invitation ${action.toLowerCase()}ed successfully.`
        );
        await loadAffiliations(true);
      } else {
        setError(res.message || 'Failed to respond to affiliation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to respond to affiliation');
    }
  };

  // Detach from affiliated clinic
  const handleDetachClinic = async (clinicId: string, clinicName: string) => {
    if (
      !window.confirm(
        `Detach your medical practice from ${clinicName}? Patients will no longer be able to book you at this facility.`
      )
    ) {
      return;
    }

    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.removeDoctorClinic(clinicId);
      if (res.success) {
        setSuccessMsg(`Successfully detached from ${clinicName}.`);
        await loadAffiliations(true);
      } else {
        setError(res.message || 'Failed to detach clinic');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detach clinic');
    }
  };

  // Unlink receptionist
  const handleRemoveReceptionist = async (receptionistId: string, staffName: string) => {
    if (!window.confirm(`Revoke queue management access for ${staffName}?`)) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.removeDoctorReceptionist(receptionistId);
      if (res.success) {
        setSuccessMsg(`Access revoked for ${staffName}.`);
        await loadAffiliations(true);
      } else {
        setError(res.message || 'Failed to unlink receptionist');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlink receptionist');
    }
  };

  const clinics = data?.clinics || [];
  const incomingRequests = data?.incomingRequests || [];
  const outgoingRequests = data?.outgoingRequests || [];
  const receptionists = data?.receptionists || [];

  const totalRevenue = useMemo(() => {
    return clinics.reduce((sum, c) => sum + (c.revenue || 0), 0);
  }, [clinics]);

  // Filter public clinics for search
  const filteredPublicClinics = useMemo(() => {
    const q = clinicSearchQuery.toLowerCase().trim();
    return publicClinics.filter((pc) => {
      if (!pc.isVerified) return false;
      if (!q) return true;
      const name = (pc.clinicName || '').toLowerCase();
      const city = (pc.city || '').toLowerCase();
      const addr = (pc.address || '').toLowerCase();
      return name.includes(q) || city.includes(q) || addr.includes(q);
    });
  }, [publicClinics, clinicSearchQuery]);

  // Sets for quick status lookup
  const affiliatedClinicIds = useMemo(() => new Set(clinics.map((c) => c.clinicId)), [clinics]);
  const outgoingClinicIds = useMemo(
    () => new Set(outgoingRequests.map((c) => c.clinicId)),
    [outgoingRequests]
  );
  const incomingClinicIds = useMemo(
    () => new Set(incomingRequests.map((c) => c.clinicId)),
    [incomingRequests]
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 text-[#1d1d1f]">
      {/* Sticky Apple Top Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Console</span>
          </button>
          <h1 className="font-bold text-sm text-[#1d1d1f]">Clinics & Staff Affiliations</h1>
          <button
            type="button"
            onClick={() => loadAffiliations(false)}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-[#f5f5f7] text-[#0066cc] active:scale-95 transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1 font-medium">{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#86868b]">
              <Building2 className="w-3.5 h-3.5 text-[#0066cc]" />
              <span>Clinics</span>
            </div>
            <div className="text-xl font-bold text-[#1d1d1f] mt-1 tracking-tight">
              {clinics.length}
            </div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Active facilities</div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#86868b]">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Desk Staff</span>
            </div>
            <div className="text-xl font-bold text-[#1d1d1f] mt-1 tracking-tight">
              {receptionists.length}
            </div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Linked receptionists</div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-[#e5e5ea] shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#86868b]">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Revenue</span>
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-1 tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Attributed revenue</div>
          </div>
        </div>

        {/* Incoming Clinic Invitations */}
        {incomingRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#0066cc]/30 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                  Incoming Clinic Invitations ({incomingRequests.length})
                </h3>
                <p className="text-[11px] text-[#86868b]">
                  Verified healthcare clinics that have invited you to practice
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {incomingRequests.map((req) => (
                <div
                  key={req.affiliationId}
                  className="p-3.5 rounded-xl border border-[#0066cc]/20 bg-[#f0f8ff]/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#1d1d1f]">{req.clinicName}</h4>
                      <p className="text-xs text-[#86868b] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#0066cc]" />
                        <span>{req.address}{req.city ? `, ${req.city}` : ''}</span>
                      </p>
                      {req.phone && (
                        <p className="text-[11px] text-[#86868b] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#86868b]" />
                          <span>{req.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#0066cc]/15">
                    <AppleButton
                      size="sm"
                      variant="primary"
                      onClick={() => handleRespondClinicInvitation(req.affiliationId, 'ACCEPT')}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Invitation</span>
                    </AppleButton>

                    <AppleButton
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRespondClinicInvitation(req.affiliationId, 'REJECT')}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </AppleButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Outgoing Clinic Approvals */}
        {outgoingRequests.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Pending Clinic Approvals ({outgoingRequests.length})
              </h3>
            </div>

            <div className="space-y-2">
              {outgoingRequests.map((req) => (
                <div
                  key={req.affiliationId}
                  className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-[#1d1d1f]">{req.clinicName}</h4>
                    <p className="text-[11px] text-[#86868b]">{req.address}{req.city ? `, ${req.city}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Awaiting Clinic
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 1: AFFILIATED CLINICS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0066cc]" />
              <h2 className="font-bold text-sm text-[#1d1d1f]">Affiliated Clinics & Hospitals</h2>
              <span className="text-xs font-semibold px-2 py-0.2 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f]">
                {clinics.length}
              </span>
            </div>

            <AppleButton
              size="sm"
              variant="primary"
              onClick={() => setShowAddClinicModal(true)}
              className="flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Affiliate Clinic</span>
            </AppleButton>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#86868b] bg-white rounded-2xl border border-[#e5e5ea]">
              Loading affiliated clinics...
            </div>
          ) : clinics.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-[#e5e5ea] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0066cc]/8 text-[#0066cc] flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1d1d1f]">No Clinics Affiliated Yet</h3>
                <p className="text-xs text-[#86868b] mt-1 max-w-sm mx-auto">
                  Affiliate your practice with verified clinics to receive appointment bookings, configure shift schedules, and manage token queues.
                </p>
              </div>
              <AppleButton
                size="md"
                variant="primary"
                onClick={() => setShowAddClinicModal(true)}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Search & Affiliate with a Clinic</span>
              </AppleButton>
            </div>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => {
                const shiftCount = clinic.slots?.length || 0;
                const shiftsSummary =
                  clinic.slots && clinic.slots.length > 0
                    ? `${shiftCount} ${shiftCount === 1 ? 'Shift' : 'Shifts'} (${format12Hour(clinic.slots[0].startTime)} – ${format12Hour(clinic.slots[0].endTime)})`
                    : 'Default schedule';

                return (
                  <div
                    key={clinic.affiliationId}
                    className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs space-y-3.5 hover:border-[#0066cc]/30 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center font-bold shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-[#1d1d1f] tracking-tight truncate">
                              {clinic.clinicName}
                            </h3>
                            <span title="Verified Clinic" className="inline-flex">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                            </span>
                          </div>
                          <p className="text-xs text-[#86868b] flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-[#0066cc] shrink-0" />
                            <span className="truncate">{clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDetachClinic(clinic.clinicId, clinic.clinicName)}
                        className="text-[#86868b] hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                        title="Detach from Clinic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#fafafc] border border-[#e5e5ea] text-center">
                      <div>
                        <span className="text-[10px] font-semibold text-[#86868b] block">Consultation Fee</span>
                        <span className="text-sm font-bold text-[#0066cc] mt-0.5 block">
                          ₹{clinic.consultationFee ?? user?.doctorProfile?.consultationFee ?? 500}
                        </span>
                      </div>
                      <div className="border-x border-[#e5e5ea]">
                        <span className="text-[10px] font-semibold text-[#86868b] block">Bookings</span>
                        <span className="text-sm font-bold text-[#1d1d1f] mt-0.5 block">
                          {clinic.bookingCount || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#86868b] block">Revenue</span>
                        <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                          ₹{(clinic.revenue || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Shifts status bar */}
                    <div className="flex items-center justify-between text-xs px-1 text-[#86868b]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
                        <span>Practice Shifts:</span>
                      </span>
                      <span className="font-semibold text-[#1d1d1f] truncate max-w-[200px]">
                        {shiftsSummary}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-[#f5f5f7] flex items-center gap-2">
                      <AppleButton
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (onManageClinicSchedule) {
                            onManageClinicSchedule(clinic.clinicId);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 text-[#0066cc] border-[#0066cc]/30 hover:bg-[#0066cc]/5"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#0066cc]" />
                        <span>Shifts & Fee</span>
                      </AppleButton>

                      <AppleButton
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setStandeeClinic({
                            clinicId: clinic.clinicId,
                            clinicName: clinic.clinicName,
                            clinicAddress: `${clinic.address || ''}${clinic.city ? `, ${clinic.city}` : ''}`,
                            clinicPhone: clinic.phone || '',
                            checkinCode: (clinic as any).checkinCode || '',
                          });
                        }}
                        className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 border border-[#e5e5ea] hover:bg-gray-50 text-[#1d1d1f]"
                        title="View Clinic QR Standee"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#0066cc]" />
                        <span>QR Standee</span>
                      </AppleButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: AUTHORIZED CLINIC DESK STAFF */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-sm text-[#1d1d1f]">Authorized Front Desk Staff</h2>
              <span className="text-xs font-semibold px-2 py-0.2 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f]">
                {receptionists.length}
              </span>
            </div>
          </div>

          {receptionists.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#e5e5ea] text-xs text-[#86868b] space-y-1">
              <Users className="w-8 h-8 text-[#86868b] mx-auto mb-1 opacity-50" />
              <p className="font-semibold text-[#1d1d1f]">No Desk Staff Assigned</p>
              <p className="text-[11px] text-[#86868b]">
                Front desk receptionists are provisioned and assigned by your affiliated clinic administrators.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {receptionists.map((rec) => (
                <div
                  key={rec.affiliationId}
                  className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#1d1d1f] truncate">
                        {rec.fullName}
                      </h4>
                      <p className="text-xs text-[#86868b] truncate">
                        {rec.email} {rec.phone ? `• ${rec.phone}` : ''}
                      </p>
                      {rec.clinicName && (
                        <p className="text-[11px] text-[#0066cc] font-medium mt-0.5 truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span>{rec.clinicName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveReceptionist(rec.receptionistId, rec.fullName)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title="Remove access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* AFFILIATE CLINIC MODAL */}
      {showAddClinicModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#e5e5ea] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1d1d1f]">Affiliate with a Clinic</h3>
                <p className="text-xs text-[#86868b]">Select from verified facilities or submit direct request</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddClinicModal(false);
                  setClinicSearchQuery('');
                  setDirectClinicInput('');
                }}
                className="p-1.5 rounded-full hover:bg-[#f5f5f7] text-[#86868b]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-3 bg-[#f5f5f7] border-b border-[#e5e5ea] flex gap-2">
              <button
                type="button"
                onClick={() => setAffiliateTab('search')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  affiliateTab === 'search'
                    ? 'bg-white text-[#0066cc] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Search Directory ({filteredPublicClinics.length})
              </button>
              <button
                type="button"
                onClick={() => setAffiliateTab('direct')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  affiliateTab === 'direct'
                    ? 'bg-white text-[#0066cc] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                }`}
              >
                Direct Email or ID
              </button>
            </div>

            {/* TAB 1: Search Directory */}
            {affiliateTab === 'search' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clinicSearchQuery}
                    onChange={(e) => setClinicSearchQuery(e.target.value)}
                    placeholder="Search by clinic name or city..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e5e5ea] text-xs bg-[#f5f5f7] focus:bg-white focus:outline-none focus:border-[#0066cc] transition-all"
                  />
                </div>

                {filteredPublicClinics.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#86868b]">
                    No verified clinics matching "{clinicSearchQuery}".
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredPublicClinics.map((c) => {
                      const isAlreadyAffiliated = affiliatedClinicIds.has(c.id);
                      const isPendingOutgoing = outgoingClinicIds.has(c.id);
                      const isIncoming = incomingClinicIds.has(c.id);

                      return (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-2xl border border-[#e5e5ea] bg-white hover:border-[#0066cc]/40 transition-all flex items-start justify-between gap-3 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-[#1d1d1f] truncate">
                                {c.clinicName}
                              </h4>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                            </div>
                            <p className="text-xs text-[#86868b] flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-[#0066cc] shrink-0" />
                              <span className="truncate">{c.address}, {c.city}</span>
                            </p>
                            {c.phone && (
                              <p className="text-[11px] text-[#86868b] mt-0.5">
                                Phone: {c.phone}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 self-center">
                            {isAlreadyAffiliated ? (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Affiliated
                              </span>
                            ) : isPendingOutgoing ? (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Pending
                              </span>
                            ) : isIncoming ? (
                              <AppleButton
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  const req = incomingRequests.find((r) => r.clinicId === c.id);
                                  if (req) {
                                    handleRespondClinicInvitation(req.affiliationId, 'ACCEPT');
                                    setShowAddClinicModal(false);
                                  }
                                }}
                                className="text-xs py-1 px-3"
                              >
                                Accept
                              </AppleButton>
                            ) : (
                              <AppleButton
                                size="sm"
                                variant="primary"
                                disabled={affiliatingId === c.id}
                                onClick={() => handleAffiliateClinic(c.id)}
                                className="text-xs py-1.5 px-3 flex items-center gap-1"
                              >
                                {affiliatingId === c.id ? (
                                  'Sending...'
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Affiliate</span>
                                  </>
                                )}
                              </AppleButton>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Direct ID / Email */}
            {affiliateTab === 'direct' && (
              <form onSubmit={handleDirectAffiliate} className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#1d1d1f]">
                    Clinic Registered Email or Clinic ID
                  </label>
                  <input
                    type="text"
                    value={directClinicInput}
                    onChange={(e) => setDirectClinicInput(e.target.value)}
                    placeholder="e.g. contact@cityclinic.com or Clinic ID"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                  />
                  <p className="text-[11px] text-[#86868b] pt-1">
                    Enter the official MediArca registered email of the facility you are joining.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <AppleButton
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddClinicModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </AppleButton>

                  <AppleButton
                    type="submit"
                    variant="primary"
                    disabled={submittingDirect || !directClinicInput.trim()}
                    className="text-xs px-5"
                  >
                    {submittingDirect ? 'Submitting...' : 'Send Affiliation Request'}
                  </AppleButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Standee Modal */}
      {standeeClinic && (
        <ClinicQrStandeeModal
          isOpen={Boolean(standeeClinic)}
          onClose={() => setStandeeClinic(null)}
          clinicId={standeeClinic.clinicId}
          clinicName={standeeClinic.clinicName}
          clinicAddress={standeeClinic.clinicAddress}
          clinicPhone={standeeClinic.clinicPhone}
          checkinCode={standeeClinic.checkinCode}
        />
      )}
    </div>
  );
};
