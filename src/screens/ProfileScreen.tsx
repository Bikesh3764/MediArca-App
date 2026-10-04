import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getFileUrl } from '../services/api';
import { AppleCard } from '../components/ui/AppleCard';
import { AppleButton } from '../components/ui/AppleButton';
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
} from 'lucide-react';

interface ProfileScreenProps {
  onOpenAuth: () => void;
  onOpenDoctorConsole?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenAuth,
  onOpenDoctorConsole,
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-full pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f5f7]/90 backdrop-blur-md px-4 py-3 border-b border-[#e5e5ea]">
        <h2 className="text-lg font-bold text-[#1d1d1f]">Account</h2>
        <p className="text-xs text-[#86868b]">Personal details and active roles</p>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto w-full">
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
                    {user.role}
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

            {/* Doctor Console Switcher */}
            {(user.role === 'DOCTOR' || user.role === 'ADMIN') && onOpenDoctorConsole && (
              <AppleCard
                interactive
                onClick={onOpenDoctorConsole}
                className="flex items-center justify-between border-[#e5e5ea]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f]">
                      Doctor Console
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      Queue caller and cabin status
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#86868b]" />
              </AppleCard>
            )}

            {/* Clinic Admin Card */}
            {user.role === 'CLINIC' && (
              <AppleCard className="space-y-3 border-[#e5e5ea]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f]">
                      Clinic Portal
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      Metropolis Polyclinic
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#f0f0f2] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">Check-in Code</span>
                    <span className="font-mono font-bold text-emerald-700">METRO01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">Status</span>
                    <span className="text-emerald-700 font-semibold">Active</span>
                  </div>
                </div>
              </AppleCard>
            )}

            {/* Receptionist Card */}
            {user.role === 'RECEPTIONIST' && (
              <AppleCard className="space-y-3 border-[#e5e5ea]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f]">
                      Reception Desk
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      Walk-in tokens & desk check-in
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#f0f0f2] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">Location</span>
                    <span className="font-semibold text-[#1d1d1f]">Front Desk</span>
                  </div>
                </div>
              </AppleCard>
            )}

            {/* Admin Card */}
            {user.role === 'ADMIN' && (
              <AppleCard className="space-y-3 border-[#e5e5ea]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f]">
                      Platform Console
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      Administrator Access
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#f0f0f2] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#86868b]">Access Level</span>
                    <span className="font-semibold text-amber-800">Root Admin</span>
                  </div>
                </div>
              </AppleCard>
            )}

            {/* General Info */}
            <AppleCard className="space-y-3">
              <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider block">
                About MediArca
              </span>
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-[#1d1d1f]">Version</span>
                <span className="text-[#86868b]">1.0.0</span>
              </div>
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-[#1d1d1f]">Network Status</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Operational
                </span>
              </div>
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
          </div>
        )}
      </div>
    </div>
  );
};
