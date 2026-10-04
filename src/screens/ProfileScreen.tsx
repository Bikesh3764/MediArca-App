import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getFileUrl } from '../services/api';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
import { CompanyInfoModal } from './company/CompanyInfoModal';
import {
  User,
  Mail,
  Phone,
  Shield,
  Stethoscope,
  LogOut,
  LogIn,
  ChevronRight,
  Heart,
  Info,
  Building,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Save,
} from 'lucide-react';

interface ProfileScreenProps {
  onOpenAuth: () => void;
  onOpenDoctorConsole?: () => void;
  onOpenRoleSwitcher?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenAuth,
  onOpenDoctorConsole,
  onOpenRoleSwitcher,
}) => {
  const { user, login, logout, refreshUser } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  // Personal Profile Fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [gender, setGender] = useState('Male');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');

  const [savingDetails, setSavingDetails] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Company Info Modal
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyModalTab, setCompanyModalTab] = useState<'about' | 'contact' | 'faq' | 'terms' | 'privacy'>('about');

  useEffect(() => {
    if (user?.patientProfile) {
      setDateOfBirth(user.patientProfile.dateOfBirth || '');
      setBloodGroup(user.patientProfile.bloodGroup || 'O+');
      setGender(user.patientProfile.gender || 'Male');
      setEmergencyContact(user.patientProfile.emergencyContact || '');
      setAllergies(user.patientProfile.allergies || '');
    }
  }, [user]);

  const handleSavePatientDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.updateProfile({
        patientProfile: {
          dateOfBirth,
          bloodGroup,
          gender,
          emergencyContact: emergencyContact.trim() || undefined,
          allergies: allergies.trim() || undefined,
        },
      });

      if (res.success) {
        setSuccessMsg('Personal health details saved.');
        await refreshUser();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'Failed to update details');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update details');
    } finally {
      setSavingDetails(false);
    }
  };

  const openCompanyModal = (tab: 'about' | 'contact' | 'faq' | 'terms' | 'privacy') => {
    setCompanyModalTab(tab);
    setCompanyModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1d1d1f]">Account</h2>
        </div>
        {onOpenRoleSwitcher && (
          <button
            type="button"
            onClick={onOpenRoleSwitcher}
            className="px-3 py-1.5 rounded-full bg-[#0066cc]/10 hover:bg-[#0066cc]/20 text-[#0066cc] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Switch Role</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
        {/* Banner Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {user ? (
          <>
            {/* User Identity Card */}
            <AppleCard className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-full overflow-hidden bg-[#0066cc] flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={getFileUrl(user.avatarUrl)}
                      alt={user.fullName}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{user.fullName ? user.fullName[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1d1d1f] truncate">
                    {user.fullName}
                  </h3>
                  <p className="text-xs text-[#86868b] truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5ea]">
                    Role: {user.role}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f0f0f2] space-y-2 text-xs">
                {user.phone && (
                  <div className="flex items-center gap-2 text-[#86868b]">
                    <Phone className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span className="text-[#1d1d1f]">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#86868b]">
                  <Mail className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span className="text-[#1d1d1f] truncate">{user.email}</span>
                </div>
              </div>
            </AppleCard>

            {/* Editable Health Demographics */}
            <AppleCard className="space-y-3.5">
              <div className="flex items-center gap-2 text-[#0066cc]">
                <Heart className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                  Personal Health Profile
                </h4>
              </div>

              <form onSubmit={handleSavePatientDetails} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] text-xs bg-white focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] text-xs bg-white focus:outline-none focus:border-[#0066cc]"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] text-xs bg-white focus:outline-none focus:border-[#0066cc]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">Emergency Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#86868b] mb-1">Allergies / Chronic Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Dust, Hypertension"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingDetails}
                  className="w-full py-2 rounded-full bg-[#0066cc] text-white text-xs font-semibold hover:bg-[#0071e3] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingDetails ? 'Saving...' : 'Save Health Details'}</span>
                </button>
              </form>
            </AppleCard>

            {/* Switch Workspace 1-Tap Trigger */}
            {onOpenRoleSwitcher && (
              <div
                role="button"
                tabIndex={0}
                onClick={onOpenRoleSwitcher}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenRoleSwitcher(); }}
                className="w-full p-4 rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#0066cc]/40 active:scale-[0.98] transition-all flex items-center justify-between text-left shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 text-[#0066cc]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight group-hover:text-[#0066cc] transition-colors">
                        Switch Workspace
                      </h4>
                      <span className="text-[10px] font-semibold text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-full border border-[#0066cc]/20">
                        4 Roles
                      </span>
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5 truncate">
                      Patient • Doctor • Clinic Partner • Receptionist
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#f5f5f7] group-hover:bg-[#0066cc]/10 group-hover:text-[#0066cc] flex items-center justify-center text-[#86868b] shrink-0 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Company & Support Information */}
            <AppleCard className="space-y-2 p-3">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider block px-1">
                Company & Support
              </span>

              <button
                type="button"
                onClick={() => openCompanyModal('about')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f5f5f7] text-left text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 text-[#1d1d1f]">
                  <Info className="w-4 h-4 text-[#0066cc]" />
                  <span>About MediArca</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
              </button>

              <button
                type="button"
                onClick={() => openCompanyModal('contact')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f5f5f7] text-left text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 text-[#1d1d1f]">
                  <Mail className="w-4 h-4 text-[#0066cc]" />
                  <span>Contact & Support Desk</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
              </button>

              <button
                type="button"
                onClick={() => openCompanyModal('faq')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f5f5f7] text-left text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 text-[#1d1d1f]">
                  <HelpCircle className="w-4 h-4 text-[#0066cc]" />
                  <span>Frequently Asked Questions (FAQ)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
              </button>

              <button
                type="button"
                onClick={() => openCompanyModal('terms')}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f5f5f7] text-left text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5 text-[#1d1d1f]">
                  <FileText className="w-4 h-4 text-[#0066cc]" />
                  <span>Terms of Service & Privacy</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
              </button>
            </AppleCard>

            {/* Sign Out */}
            <div className="pt-1">
              <AppleButton
                variant="danger"
                size="md"
                className="w-full"
                icon={<LogOut className="w-4 h-4" />}
                onClick={logout}
              >
                Sign Out
              </AppleButton>
            </div>
          </>
        ) : (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-white border border-[#e5e5ea] flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-[#86868b]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f]">Guest Account</h3>
              <p className="text-xs text-[#86868b] max-w-xs mx-auto mt-1 leading-relaxed">
                Sign in to manage visits, live queue passes, and account settings.
              </p>
            </div>
            <AppleButton
              variant="primary"
              size="lg"
              className="w-full"
              icon={<LogIn className="w-4 h-4" />}
              onClick={onOpenAuth}
            >
              Sign In
            </AppleButton>

            {/* 1-Click Instant Demo Access */}
            <div className="pt-2 text-left">
              <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-2 px-0.5">
                <span className="flex items-center gap-1.5 font-bold text-[#1d1d1f]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
                  Instant Demo Access
                </span>
                <span className="text-[10px] text-[#86868b]">1-Tap Login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={demoLoading}
                  onClick={async () => {
                    setDemoLoading(true);
                    await login('john.doe@gmail.com', 'patient123');
                    setDemoLoading(false);
                  }}
                  className="p-3 rounded-2xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] active:scale-[0.98] transition-all text-left cursor-pointer group shadow-2xs disabled:opacity-60"
                >
                  <div className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                    Demo Patient
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate mt-0.5">john.doe@gmail.com</div>
                </button>
                <button
                  type="button"
                  disabled={demoLoading}
                  onClick={async () => {
                    setDemoLoading(true);
                    await login('dr.sarah@mediarca.com', 'doctor123');
                    setDemoLoading(false);
                  }}
                  className="p-3 rounded-2xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] active:scale-[0.98] transition-all text-left cursor-pointer group shadow-2xs disabled:opacity-60"
                >
                  <div className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                    Demo Doctor
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate mt-0.5">dr.sarah@mediarca.com</div>
                </button>
                <button
                  type="button"
                  disabled={demoLoading}
                  onClick={async () => {
                    setDemoLoading(true);
                    await login('clinic@mediarca.com', 'clinic123');
                    setDemoLoading(false);
                  }}
                  className="p-3 rounded-2xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] active:scale-[0.98] transition-all text-left cursor-pointer group shadow-2xs disabled:opacity-60"
                >
                  <div className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                    Demo Clinic
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate mt-0.5">clinic@mediarca.com</div>
                </button>
                <button
                  type="button"
                  disabled={demoLoading}
                  onClick={async () => {
                    setDemoLoading(true);
                    await login('receptionist@mediarca.com', 'receptionist123');
                    setDemoLoading(false);
                  }}
                  className="p-3 rounded-2xl border border-[#e5e5ea] bg-white hover:bg-[#f5f5f7] active:scale-[0.98] transition-all text-left cursor-pointer group shadow-2xs disabled:opacity-60"
                >
                  <div className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                    Demo Receptionist
                  </div>
                  <div className="text-[10px] text-[#86868b] truncate mt-0.5">receptionist@mediarca.com</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Company Info Modal */}
      <CompanyInfoModal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        initialTab={companyModalTab}
      />
    </div>
  );
};
