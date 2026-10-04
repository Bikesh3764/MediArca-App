import React, { useState, useEffect, useRef } from 'react';
import {
  api,
  ALL_SPECIALTIES,
  formatDoctorDegrees,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { optimizeAvatarImage } from '../../utils/documentOptimizer';
import { sanitizeIndianPhone, formatIndianPhone } from '../../utils/phoneUtils';
import {
  ChevronLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  IndianRupee,
  MapPin,
  Building2,
  Save,
  Check,
  ShieldCheck,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface DoctorProfileScreenProps {
  onBack: () => void;
  onOpenRoleSwitcher?: () => void;
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({
  onBack,
  onOpenRoleSwitcher,
}) => {
  const { user, refreshUser, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const initialSpec = user?.doctorProfile?.specialty || 'Cardiology';
  const [specialty, setSpecialty] = useState(initialSpec);
  const [qualifications, setQualifications] = useState(user?.doctorProfile?.qualifications || 'MD, DM');
  const [experienceYears, setExperienceYears] = useState(user?.doctorProfile?.experienceYears || 14);
  const [consultationFee, setConsultationFee] = useState(user?.doctorProfile?.consultationFee || 800);
  const [bio, setBio] = useState(user?.doctorProfile?.bio || '');
  const [clinicAddress, setClinicAddress] = useState(user?.doctorProfile?.clinicAddress || '');

  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      if (user.doctorProfile) {
        setSpecialty(user.doctorProfile.specialty || 'Cardiology');
        setQualifications(user.doctorProfile.qualifications || 'MD, DM');
        setExperienceYears(user.doctorProfile.experienceYears || 14);
        setConsultationFee(user.doctorProfile.consultationFee || 800);
        setBio(user.doctorProfile.bio || '');
        setClinicAddress(user.doctorProfile.clinicAddress || '');
      }
    }
  }, [user]);

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image (JPEG, PNG, WebP).');
      return;
    }

    setAvatarLoading(true);
    setError(null);
    try {
      const optimized = await optimizeAvatarImage(file);
      const res = await api.uploadAvatar(optimized.file);
      if (res.success) {
        setSuccessMsg('Profile photo updated successfully!');
        await refreshUser();
      } else {
        setError(res.message || 'Failed to upload photo');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const cleanPhone = sanitizeIndianPhone(phone);

    try {
      const res = await api.updateDoctorProfile({
        fullName: fullName.trim(),
        phone: cleanPhone ? formatIndianPhone(cleanPhone) : undefined,
        specialty,
        qualifications: qualifications.trim(),
        experienceYears: Number(experienceYears),
        consultationFee: Number(consultationFee),
        bio: bio.trim() || undefined,
        clinicAddress: clinicAddress.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg('Doctor profile saved successfully!');
        await refreshUser();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.message || 'Failed to update doctor profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update doctor profile');
    } finally {
      setSaving(false);
    }
  };

  const isVerified = user?.doctorProfile?.verificationStatus === 'VERIFIED' || user?.doctorProfile?.isVerified;

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
          <h1 className="font-semibold text-sm text-[#1d1d1f]">Doctor Professional Profile</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
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

        {/* Avatar & Verification Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#e5e5ea] shadow-xs flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80'}
              alt={fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#e5e5ea]"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0066cc] text-white flex items-center justify-center shadow-xs hover:bg-[#0071e3] transition-colors"
              title="Change Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelected}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-[#1d1d1f] truncate">{fullName}</h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Doctor
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200 shrink-0">
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs text-[#86868b] mt-0.5">{specialty} • {formatDoctorDegrees(qualifications)}</p>
            <p className="text-[11px] text-[#0066cc] mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-[#e5e5ea] shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Doctor Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Primary Specialty (32 Specialties)</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm bg-white focus:outline-none focus:border-[#0066cc]"
              >
                {ALL_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Recognized Qualifications (Degrees)</label>
              <input
                type="text"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. MBBS, MD, DM"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
              />
              <p className="text-[10px] text-[#86868b] mt-1 font-mono">Recognized: {formatDoctorDegrees(qualifications)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Primary Clinic Address</label>
            <input
              type="text"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              placeholder="e.g. City Heart & Vascular Institute, Bandra West, Mumbai"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-sm focus:outline-none focus:border-[#0066cc]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Doctor Biography & Experience Summary</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your clinical background, areas of expertise, and patient approach..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Details'}</span>
          </button>
        </form>

        {/* Workspace Switcher & Sign Out */}
        <div className="space-y-3 pt-4">
          {onOpenRoleSwitcher && (
            <div
              onClick={onOpenRoleSwitcher}
              className="bg-white p-4 rounded-2xl border border-[#e5e5ea] flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-2xs hover:bg-[#f5f5f7]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1d1d1f]">Switch Workspace</span>
                    <span className="text-[10px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-1.5 py-0.5 rounded-full">
                      4 Roles
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    Patient App, Clinic Operations, Reception Desk
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className="w-full py-3 rounded-full bg-[#fee2e2] text-[#dc2626] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  );
};
