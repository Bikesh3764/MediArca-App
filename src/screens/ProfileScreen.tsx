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
        <h2 className="text-lg font-bold text-[#1d1d1f]">Account & Profile</h2>
        <p className="text-xs text-[#86868b]">Personal details and settings</p>
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
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">
                    {user.fullName}
                  </h3>
                  <p className="text-xs text-[#86868b]">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc]">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#f0f0f0] space-y-2 text-xs">
                {user.phone && (
                  <div className="flex items-center gap-2 text-[#7a7a7a]">
                    <Phone className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#7a7a7a]">
                  <Mail className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span>{user.email}</span>
                </div>
              </div>
            </AppleCard>

            {/* Doctor Console Switcher (if doctor or demo testing) */}
            {(user.role === 'DOCTOR' || user.role === 'ADMIN') && onOpenDoctorConsole && (
              <AppleCard
                interactive
                onClick={onOpenDoctorConsole}
                className="flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-blue-200/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0066cc] text-white flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f]">
                      Doctor Cabin Console
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      Live queue caller & cabin status
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#0066cc]" />
              </AppleCard>
            )}

            {/* General Info */}
            <AppleCard className="space-y-3">
              <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider block">
                MediArca Platform
              </span>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-[#1d1d1f]">Cloud Database</span>
                <span className="text-emerald-600 font-semibold">Supabase Connected</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-[#1d1d1f]">Backend Engine</span>
                <span className="text-emerald-600 font-semibold">Render API Live</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-[#1d1d1f]">Design Philosophy</span>
                <span className="text-[#0066cc] font-semibold">Apple HIG Clean</span>
              </div>
            </AppleCard>

            {/* Sign Out */}
            <div className="pt-2">
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
            <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-[#e5e5ea] flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-[#86868b]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f]">Guest User</h3>
              <p className="text-xs text-[#86868b] max-w-xs mx-auto mt-1">
                Sign in to manage your appointments, view live queue tokens, and access doctor consoles.
              </p>
            </div>
            <AppleButton
              variant="primary"
              size="lg"
              className="w-full"
              icon={<LogIn className="w-4 h-4" />}
              onClick={onOpenAuth}
            >
              Sign In / Register
            </AppleButton>
          </div>
        )}
      </div>
    </div>
  );
};
