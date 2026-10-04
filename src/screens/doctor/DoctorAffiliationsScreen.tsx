import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  DoctorAffiliationsData,
  DoctorAffiliationClinic,
} from '../../services/api';
import {
  ChevronLeft,
  Building2,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DoctorAffiliationsScreenProps {
  onBack: () => void;
}

export const DoctorAffiliationsScreen: React.FC<DoctorAffiliationsScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<DoctorAffiliationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Clinic Modal
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [clinicInput, setClinicInput] = useState('');
  const [addingClinic, setAddingClinic] = useState(false);

  // Add Receptionist Modal
  const [showAddRecModal, setShowAddRecModal] = useState(false);
  const [recEmail, setRecEmail] = useState('');
  const [addingRec, setAddingRec] = useState(false);

  

  const loadAffiliations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDoctorAffiliations();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData({ clinics: [], receptionists: [] });
      }
    } catch {
      setData({ clinics: [], receptionists: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAffiliations();
  }, [loadAffiliations]);

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicInput.trim()) return;

    setAddingClinic(true);
    setError(null);
    try {
      const res = await api.addDoctorClinic({
        clinicEmail: clinicInput.includes('@') ? clinicInput.trim() : undefined,
        clinicId: !clinicInput.includes('@') ? clinicInput.trim() : undefined,
      });

      if (res.success) {
        setSuccessMsg('Clinic affiliation request sent successfully!');
        setClinicInput('');
        setShowAddClinicModal(false);
        loadAffiliations();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.message || 'Failed to affiliate clinic');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to affiliate clinic');
    } finally {
      setAddingClinic(false);
    }
  };

  const handleAddReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recEmail.trim()) return;

    setAddingRec(true);
    setError(null);
    try {
      const res = await api.addDoctorReceptionist({ receptionistEmail: recEmail.trim() });
      if (res.success) {
        setSuccessMsg('Front desk receptionist invited successfully!');
        setRecEmail('');
        setShowAddRecModal(false);
        loadAffiliations();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.message || 'Failed to link receptionist');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link receptionist');
    } finally {
      setAddingRec(false);
    }
  };

  const handleRemoveReceptionist = async (receptionistId: string) => {
    if (!window.confirm('Remove this receptionist access to your queue?')) return;
    try {
      const res = await api.removeDoctorReceptionist(receptionistId);
      if (res.success) {
        setSuccessMsg('Receptionist access revoked.');
        loadAffiliations();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove receptionist');
    }
  };

  const clinics = data?.clinics || [];
  const receptionists = data?.receptionists || [];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 text-[#1d1d1f]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Console</span>
          </button>
          <h1 className="font-semibold text-sm text-[#1d1d1f]">Clinics & Staff Affiliations</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)}><span className="text-sm">×</span></button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)}><span className="text-sm">×</span></button>
          </div>
        )}

        {/* Section 1: Associated Practice Clinics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0066cc]" />
              <h2 className="font-semibold text-sm text-[#1d1d1f]">Affiliated Healthcare Clinics</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddClinicModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#0066cc] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#0071e3] transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Affiliate Clinic</span>
            </button>
          </div>

          {clinics.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#e5e5ea] text-xs text-[#86868b]">
              No clinics linked yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {clinics.map((c) => (
                <div
                  key={c.affiliationId}
                  className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-[#1d1d1f]">{c.clinicName}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5">{c.address}, {c.city}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#86868b] mt-1">
                      <span>Fee: <strong className="text-[#1d1d1f]">₹{c.consultationFee}</strong></span>
                      <span>Consults: <strong className="text-[#1d1d1f]">{c.bookingCount || 0}</strong></span>
                      {c.phone && <span>Phone: {c.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Linked Front Desk Staff */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-sm text-[#1d1d1f]">Front Desk Receptionists</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddRecModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-amber-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-amber-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Staff</span>
            </button>
          </div>

          {receptionists.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#e5e5ea] text-xs text-[#86868b]">
              No front desk staff linked yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {receptionists.map((rec) => (
                <div
                  key={rec.affiliationId}
                  className="bg-white rounded-2xl p-4 border border-[#e5e5ea] shadow-xs flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-[#1d1d1f]">{rec.fullName}</h3>
                    <p className="text-xs text-[#86868b] mt-0.5">{rec.email} {rec.phone ? `• ${rec.phone}` : ''}</p>
                    {rec.clinicName && (
                      <p className="text-[11px] text-[#0066cc] mt-0.5 font-medium">{rec.clinicName}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveReceptionist(rec.receptionistId)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
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

      {/* Add Clinic Modal */}
      {showAddClinicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3 className="font-semibold text-base text-[#1d1d1f]">Link Clinic Facility</h3>
              <button
                type="button"
                onClick={() => setShowAddClinicModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClinic} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Clinic Email or ID</label>
                <input
                  type="text"
                  value={clinicInput}
                  onChange={(e) => setClinicInput(e.target.value)}
                  placeholder="e.g. clinic email or Clinic ID"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinicModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingClinic}
                  className="px-5 py-2 rounded-full bg-[#0066cc] text-white text-xs font-medium"
                >
                  {addingClinic ? 'Linking...' : 'Send Affiliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Receptionist Modal */}
      {showAddRecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3 className="font-semibold text-base text-[#1d1d1f]">Link Front Desk Receptionist</h3>
              <button
                type="button"
                onClick={() => setShowAddRecModal(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReceptionist} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Receptionist Email</label>
                <input
                  type="email"
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  placeholder="e.g. receptionist@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRecModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingRec}
                  className="px-5 py-2 rounded-full bg-amber-600 text-white text-xs font-medium"
                >
                  {addingRec ? 'Linking...' : 'Grant Queue Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
