import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Stethoscope,
  Building2,
  UserCheck,
  Shield,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole?: (role: 'PATIENT' | 'DOCTOR' | 'CLINIC' | 'RECEPTIONIST' | 'ADMIN') => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  const { user, login } = useAuth();

  if (!isOpen) return null;

  const roles = [
    {
      id: 'PATIENT' as const,
      title: 'Patient Portal',
      subtitle: 'Explore doctors, live queue pass, visit history',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      demoEmail: 'john.doe@gmail.com',
      demoName: 'John Doe',
    },
    {
      id: 'DOCTOR' as const,
      title: 'Doctor Console',
      subtitle: 'Live cabin, shift schedules, consultation desk',
      icon: Stethoscope,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      demoEmail: 'dr.sarah@mediarca.com',
      demoName: 'Dr. Sarah Jenkins',
    },
    {
      id: 'CLINIC' as const,
      title: 'Clinic Operations',
      subtitle: 'Revenue KPIs, doctor roster, receptionist desks, QR standee',
      icon: Building2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      demoEmail: 'clinic@mediarca.com',
      demoName: 'Metropolis Polyclinic',
    },
    {
      id: 'RECEPTIONIST' as const,
      title: 'Receptionist Desk',
      subtitle: 'Walk-in tokens, live queue, approvals, doctor presence',
      icon: UserCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      demoEmail: 'receptionist@mediarca.com',
      demoName: 'Clara Oswald (Front Desk)',
    },
    {
      id: 'ADMIN' as const,
      title: 'Admin Governance',
      subtitle: 'Platform KPIs, doctor verifications, clinic inspection, inbox',
      icon: Shield,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      demoEmail: 'admin@mediarca.com',
      demoName: 'MediArca Admin',
    },
  ];

  const handleSwitch = async (role: typeof roles[number]) => {
    // If user is logged in with this role already, simply switch view
    if (user?.role === role.id) {
      if (onSelectRole) onSelectRole(role.id);
      onClose();
      return;
    }

    // Switch to seeded verified account for instant testing
    await login(role.demoEmail, 'password123');
    if (onSelectRole) onSelectRole(role.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0]">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0066cc]" />
              <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Switch Workspace</h3>
            </div>
            <p className="text-xs text-[#86868b] mt-0.5">Explore any of MediArca’s 5 specialized platform portals</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Info */}
        {user && (
          <div className="my-3 px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#86868b]">Active Session: </span>
              <span className="font-semibold text-[#1d1d1f]">{user.fullName}</span>
            </div>
            <span className="font-medium text-[#0066cc] uppercase tracking-wider text-[10px] px-2 py-0.5 bg-white rounded-full border border-[#e5e5ea]">
              {user.role}
            </span>
          </div>
        )}

        {/* Roles List */}
        <div className="space-y-2 mt-3 max-h-[60vh] overflow-y-auto pr-1">
          {roles.map((r) => {
            const Icon = r.icon;
            const isCurrent = user?.role === r.id;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSwitch(r)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                  isCurrent
                    ? 'border-[#0066cc] bg-[#0066cc]/5 shadow-sm ring-1 ring-[#0066cc]/20'
                    : 'border-[#e5e5ea] hover:border-[#0066cc]/40 hover:bg-[#f5f5f7]'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl ${r.bgColor} ${r.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1d1d1f]">{r.title}</span>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0066cc] text-white font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#86868b] line-clamp-1 mt-0.5">{r.subtitle}</p>
                  <p className="text-[11px] text-[#0066cc] mt-0.5 font-medium">Demo: {r.demoName}</p>
                </div>
                {isCurrent && <Check className="w-5 h-5 text-[#0066cc] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-[#86868b] mt-4">
          Seamless 1-tap role switching for demonstration and verification.
        </p>
      </div>
    </div>
  );
};
