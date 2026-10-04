import React from 'react';
import { Preferences } from '@capacitor/preferences';
import { BrandLogo } from '../components/ui/BrandLogo';
import {
  User,
  Stethoscope,
  Building2,
  Users,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

export type AppRole = 'PATIENT' | 'DOCTOR' | 'CLINIC' | 'RECEPTIONIST';

export const ROLE_PREFERENCE_KEY = 'mediarca_selected_role';

export interface RoleOption {
  id: AppRole;
  title: string;
  badge: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  iconColor: string;
}

export const APP_ROLES: RoleOption[] = [
  {
    id: 'PATIENT',
    title: 'Patient',
    badge: 'Appointments & Pass',
    subtitle: 'Book appointments, live queue pass',
    icon: User,
    accentColor: '#0066cc',
    badgeBg: 'bg-blue-50 text-[#0066cc] border-blue-200/60',
    iconColor: 'text-[#0066cc]',
  },
  {
    id: 'DOCTOR',
    title: 'Doctor',
    badge: 'Clinical Console',
    subtitle: 'Clinical cabin, schedule, live queue',
    icon: Stethoscope,
    accentColor: '#5856d6',
    badgeBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/60',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'CLINIC',
    title: 'Clinic Partner',
    badge: 'Operations Desk',
    subtitle: 'Doctor roster, reception desks, standee QR',
    icon: Building2,
    accentColor: '#0d9488',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/60',
    iconColor: 'text-teal-700',
  },
  {
    id: 'RECEPTIONIST',
    title: 'Receptionist',
    badge: 'Front-Desk Terminal',
    subtitle: 'Front-desk walk-ins, arrival check-in, queue control',
    icon: Users,
    accentColor: '#d97706',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/60',
    iconColor: 'text-amber-700',
  },
];

export const saveSelectedRole = async (role: AppRole): Promise<void> => {
  try {
    await Preferences.set({ key: ROLE_PREFERENCE_KEY, value: role });
  } catch {}
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(ROLE_PREFERENCE_KEY, role);
  }
};

export const getStoredSelectedRole = async (): Promise<AppRole | null> => {
  try {
    const { value } = await Preferences.get({ key: ROLE_PREFERENCE_KEY });
    if (value && ['PATIENT', 'DOCTOR', 'CLINIC', 'RECEPTIONIST'].includes(value)) {
      return value as AppRole;
    }
  } catch {}
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem(ROLE_PREFERENCE_KEY);
    if (stored && ['PATIENT', 'DOCTOR', 'CLINIC', 'RECEPTIONIST'].includes(stored)) {
      return stored as AppRole;
    }
  }
  return null;
};

interface RoleGatewayScreenProps {
  currentRole?: AppRole | null;
  onSelectRole: (role: AppRole) => void;
  onCancel?: () => void;
  isSwitching?: boolean;
}

export const RoleGatewayScreen: React.FC<RoleGatewayScreenProps> = ({
  currentRole,
  onSelectRole,
  onCancel,
  isSwitching = false,
}) => {
  const handleSelect = async (role: AppRole) => {
    await saveSelectedRole(role);
    onSelectRole(role);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-between max-w-md mx-auto relative px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] antialiased selection:bg-[#0066cc]/20">
      {/* Top Bar with Brand Logo and optional Cancel button */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-4">
          <BrandLogo variant="full" size="md" />
          {isSwitching && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-white border border-[#e5e5ea] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] active:scale-95 transition-all shadow-2xs cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hero Apple Header */}
        <div className="mt-4 mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[11px] font-semibold mb-3 tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Healthcare Workspaces</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">
            Who are you?
          </h1>
          <p className="text-sm text-[#86868b] mt-1.5 leading-relaxed">
            Select your role to open your dedicated workspace.
          </p>
        </div>

        {/* 4 Apple Role Cards */}
        <div className="space-y-3">
          {APP_ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = currentRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleSelect(role.id)}
                className={`w-full text-left p-4 rounded-2xl bg-white border transition-all duration-200 flex items-center gap-4 cursor-pointer select-none group active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#0066cc] shadow-md ring-2 ring-[#0066cc]/20'
                    : 'border-[#e5e5ea] hover:border-[#0066cc]/40 shadow-xs hover:shadow-sm'
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${role.badgeBg} border`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">
                      {role.title}
                    </h2>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0066cc] text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#86868b] mt-0.5 line-clamp-1 leading-normal">
                    {role.subtitle}
                  </p>
                </div>

                {/* Right Arrow */}
                <div className="w-7 h-7 rounded-full bg-[#f5f5f7] group-hover:bg-[#0066cc]/10 group-hover:text-[#0066cc] flex items-center justify-center text-[#86868b] transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean Apple HIG Footer */}
      <footer className="pt-6 text-center text-xs text-[#86868b]">
        <p>You can switch roles anytime from your Account settings.</p>
        <p className="text-[11px] text-[#86868b]/70 mt-1">
          MediArca Patient & Clinical Operations Network
        </p>
      </footer>
    </div>
  );
};
