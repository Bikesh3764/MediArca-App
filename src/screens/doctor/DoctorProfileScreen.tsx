import React, { useState, useEffect, useRef } from 'react';
import {
  api,
  ALL_SPECIALTIES,
  formatDoctorDegrees,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { optimizeAvatarImage } from '../../utils/documentOptimizer';
import { sanitizeIndianPhone, formatIndianPhone } from '../../utils/phoneUtils';
import { AppleButton } from '../../components/ui/AppleButton';
import {
  ChevronLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Building2,
  Save,
  ShieldCheck,
  User as UserIcon,
  ChevronRight,
  Clock,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface DoctorProfileScreenProps {
  onBack: () => void;
  onOpenRoleSwitcher?: () => void;
  onNavigateToAffiliations?: () => void;
  onNavigateToSchedule?: () => void;
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({
  onBack,
  onOpenRoleSwitcher,
  onNavigateToAffiliations,
  onNavigateToSchedule,
}) => {
  const { user, refreshUser, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const initialSpec = user?.doctorProfile?.specialty || 'General Medicine';
  const [specialty, setSpecialty] = useState(initialSpec);
  const [qualifications, setQualifications] = useState(user?.doctorProfile?.qualifications || 'MBBS');
  const [experienceYears, setExperienceYears] = useState(user?.doctorProfile?.experienceYears || 5);
  const [bio, setBio] = useState(user?.doctorProfile?.bio || '');

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
        setSpecialty(user.doctorProfile.specialty || 'General Medicine');
        setQualifications(user.doctorProfile.qualifications || 'MBBS');
        setExperienceYears(user.doctorProfile.experienceYears || 5);
        setBio(user.doctorProfile.bio || '');
      }
    }
  }, [user]);

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setAvatarLoading(true);
    setError(null);
    try {
      const optimized = await optimizeAvatarImage(file);
      const res = await api.uploadAvatar(optimized.file);
      if (res.success) {
        setSuccessMsg('Profile headshot updated successfully!');
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
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setSaving(false);
      return;
    }

    try {
      const res = await api.updateDoctorProfile({
        fullName: fullName.trim(),
        phone: cleanPhone ? formatIndianPhone(cleanPhone) : undefined,
        specialty,
        qualifications: qualifications.trim(),
        experienceYears: Number(experienceYears),
        bio: bio.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg('Doctor professional credentials saved successfully!');
        await refreshUser();
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setError(res.message || 'Failed to update doctor profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update doctor profile');
    } finally {
      setSaving(false);
    }
  };

  const isVerified =
    user?.doctorProfile?.verificationStatus === 'VERIFIED' || user?.doctorProfile?.isVerified;

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24 text-[#1d1d1f]">
      {/* Sticky Apple Top Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-3">
        <div className="max-w-md mx-auto text-center">
          <h1 className="font-bold text-sm text-[#1d1d1f]">Doctor Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {/* Banner Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1 font-medium">{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1">
              <span className="text-sm">×</span>
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-2xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1 font-medium">{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="p-1">
              <span className="text-sm">×</span>
            </button>
          </div>
        )}

        {/* Avatar & Professional Badge Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e5ea] shadow-xs flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80'
              }
              alt={fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#e5e5ea]"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0066cc] text-white flex items-center justify-center shadow-xs hover:bg-[#0071e3] transition-colors cursor-pointer"
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
            <div className="flex items-center gap-2 flex-wrap">
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
            <p className="text-xs text-[#86868b] mt-0.5">
              {specialty} • {formatDoctorDegrees(qualifications)}
            </p>
            <p className="text-[11px] text-[#0066cc] mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Profile Form (Credentials & Professional Identity) */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 border border-[#e5e5ea] shadow-xs space-y-4">
          <div className="border-b border-[#f5f5f7] pb-2">
            <h3 className="font-bold text-sm text-[#1d1d1f]">Professional Identity & Credentials</h3>
            <p className="text-[11px] text-[#86868b]">Displayed to patients across search and discovery</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Full Name & Title *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Dr. Full Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs bg-[#fafafc] focus:bg-white focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Contact Phone (India)
              </label>
              <div className="flex rounded-xl border border-[#e5e5ea] overflow-hidden bg-[#fafafc] focus-within:bg-white focus-within:border-[#0066cc]">
                <span className="inline-flex items-center px-3 border-r border-[#e5e5ea] text-xs font-bold text-[#86868b] bg-[#f5f5f7]">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={sanitizeIndianPhone(phone)}
                  onChange={(e) => {
                    const val = sanitizeIndianPhone(e.target.value);
                    setPhone(val ? `+91 ${val}` : '');
                  }}
                  placeholder="98765 43210"
                  className="w-full px-3 py-2 text-xs bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Medical Specialty *
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs bg-[#fafafc] focus:bg-white focus:outline-none focus:border-[#0066cc]"
              >
                {ALL_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
                Qualifications & Degrees *
              </label>
              <input
                type="text"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. MBBS, MD, DM"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs bg-[#fafafc] focus:bg-white focus:outline-none focus:border-[#0066cc]"
              />
              <p className="text-[10px] text-[#86868b] mt-1 font-mono">
                Preview: {formatDoctorDegrees(qualifications)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
              Years of Clinical Experience
            </label>
            <input
              type="number"
              min="0"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e5ea] text-xs bg-[#fafafc] focus:bg-white focus:outline-none focus:border-[#0066cc]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1">
              Professional Bio & Clinical Philosophy
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your clinical background, areas of expertise, and patient approach..."
              className="w-full p-3 rounded-xl border border-[#e5e5ea] text-xs bg-[#fafafc] focus:bg-white focus:outline-none focus:border-[#0066cc] resize-none"
            />
          </div>

          <div className="pt-2">
            <AppleButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Doctor Profile'}</span>
            </AppleButton>
          </div>
        </form>

        {/* Workspace & Sign Out Section */}
        <div className="space-y-2 pt-2">
          {onOpenRoleSwitcher && (
            <button
              type="button"
              onClick={onOpenRoleSwitcher}
              className="w-full py-2.5 px-4 rounded-2xl bg-white border border-[#e5e5ea] text-[#1d1d1f] text-xs font-semibold flex items-center justify-between hover:bg-[#f5f5f7] active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0066cc]" />
                <span>Switch Platform Workspace</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#86868b]" />
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 border border-rose-200/60 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out of Doctor Account</span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </main>
    </div>
  );
};
