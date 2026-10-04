import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AppRole,
  APP_ROLES,
  saveSelectedRole,
} from '../screens/RoleGatewayScreen';
import { X, Check, Sparkles } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole?: AppRole | null;
  onSelectRole: (role: AppRole) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
}) => {
  const { user, login } = useAuth();

  if (!isOpen) return null;

  const handleSwitch = async (role: AppRole) => {
    await saveSelectedRole(role);
    onSelectRole(role);
    onClose();
  };

  const activeRole = currentRole || (user?.role as AppRole) || 'PATIENT';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#e5e5ea] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f2]">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0066cc]" />
              <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                Switch Workspace
              </h3>
            </div>
            <p className="text-xs text-[#86868b] mt-0.5">
              Select any of MediArca’s specialized portals
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Account Indicator */}
        {user && (
          <div className="my-3 px-3.5 py-2.5 rounded-2xl bg-[#f5f5f7] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#86868b]">Logged in as: </span>
              <span className="font-semibold text-[#1d1d1f]">{user.fullName}</span>
            </div>
            <span className="font-semibold text-[#0066cc] uppercase tracking-wider text-[10px] px-2 py-0.5 bg-white rounded-full border border-[#e5e5ea]">
              {user.role}
            </span>
          </div>
        )}

        {/* Roles List */}
        <div className="space-y-2.5 mt-3 max-h-[60vh] overflow-y-auto pr-0.5">
          {APP_ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = activeRole === r.id;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSwitch(r.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer active:scale-98 ${
                  isSelected
                    ? 'border-[#0066cc] bg-[#0066cc]/5 shadow-xs ring-1 ring-[#0066cc]/20'
                    : 'border-[#e5e5ea] hover:border-[#0066cc]/40 hover:bg-[#f5f5f7]'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${r.badgeBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1d1d1f]">
                      {r.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0066cc] text-white font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#86868b] line-clamp-1 mt-0.5">
                    {r.subtitle}
                  </p>
                </div>
                {isSelected && <Check className="w-5 h-5 text-[#0066cc] shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Instant Demo Accounts Quick Switch */}
        <div className="mt-4 pt-3.5 border-t border-[#f0f0f2]">
          <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-2 px-0.5">
            <span className="flex items-center gap-1.5 font-bold text-[#1d1d1f]">
              <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
              Instant Demo Logins
            </span>
            <span className="text-[10px] text-[#86868b]">1-Tap Switch</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                await login('john.doe@gmail.com', 'patient123');
                handleSwitch('PATIENT');
              }}
              className="p-2.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] hover:bg-[#ebebee] active:scale-[0.98] transition-all text-left cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                Demo Patient
              </div>
              <div className="text-[10px] text-[#86868b] truncate">john.doe@gmail.com</div>
            </button>
            <button
              type="button"
              onClick={async () => {
                await login('dr.sarah@mediarca.com', 'doctor123');
                handleSwitch('DOCTOR');
              }}
              className="p-2.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] hover:bg-[#ebebee] active:scale-[0.98] transition-all text-left cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                Demo Doctor
              </div>
              <div className="text-[10px] text-[#86868b] truncate">dr.sarah@mediarca.com</div>
            </button>
            <button
              type="button"
              onClick={async () => {
                await login('clinic@mediarca.com', 'clinic123');
                handleSwitch('CLINIC');
              }}
              className="p-2.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] hover:bg-[#ebebee] active:scale-[0.98] transition-all text-left cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                Demo Clinic
              </div>
              <div className="text-[10px] text-[#86868b] truncate">clinic@mediarca.com</div>
            </button>
            <button
              type="button"
              onClick={async () => {
                await login('receptionist@mediarca.com', 'receptionist123');
                handleSwitch('RECEPTIONIST');
              }}
              className="p-2.5 rounded-xl border border-[#e5e5ea] bg-[#f5f5f7] hover:bg-[#ebebee] active:scale-[0.98] transition-all text-left cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#1d1d1f] group-hover:text-[#0066cc] truncate">
                Demo Receptionist
              </div>
              <div className="text-[10px] text-[#86868b] truncate">receptionist@mediarca.com</div>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center text-[#86868b] mt-3">
          Your selected workspace is remembered across app launches.
        </p>
      </div>
    </div>
  );
};
