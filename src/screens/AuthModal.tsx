import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { isGoogleConfigured } from '../config/auth';
import { AppleButton } from '../components/ui/AppleButton';
import { AppleInput } from '../components/ui/AppleInput';
import { BrandLogo } from '../components/ui/BrandLogo';
import { User } from '../services/api';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ArrowLeft,
  Eye,
  EyeOff,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user?: User) => void;
  initialRole?: 'PATIENT' | 'DOCTOR';
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'PATIENT',
  initialMode = 'login',
}) => {
  const { login, loginWithGoogle, register, verifyOtp, resendOtp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>(initialMode);
  const [activeRole, setActiveRole] = useState<'PATIENT' | 'DOCTOR'>(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Doctor signup specific fields
  const [specialty, setSpecialty] = useState('General Medicine');
  const [qualifications, setQualifications] = useState('MBBS, MD');
  const [experienceYears, setExperienceYears] = useState('5');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      onSuccess?.(res.user);
      onClose();
    } else if (res.requiresVerification) {
      setMode('otp');
    } else {
      setError(res.message || 'Invalid email or password');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      role: activeRole,
    };

    if (activeRole === 'DOCTOR') {
      payload.specialty = specialty;
      payload.qualifications = qualifications.trim() || 'MBBS, MD';
      payload.experienceYears = Number(experienceYears) || 1;
    }

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      setMode('otp');
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await verifyOtp(email.trim(), otp.trim());
    setLoading(false);

    if (res.success) {
      onSuccess?.(res.user);
      onClose();
    } else {
      setError(res.message || 'Verification failed');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    const res = await resendOtp(email.trim());
    if (res.success) {
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setError(res.message || 'Failed to resend code');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse?.credential) {
      setError('Google sign-in did not return valid credentials.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await loginWithGoogle(credentialResponse.credential, activeRole);
    setLoading(false);
    if (res.success) {
      onSuccess?.(res.user);
      onClose();
    } else {
      setError(res.message || 'Google sign-in failed');
    }
  };

  const isAuthorizedGoogleOrigin =
    typeof window !== 'undefined' &&
    (window.location.origin === 'http://localhost:5173' ||
      window.location.origin === 'https://bikesh3764.github.io');

  const showOfficialGoogleButton = Boolean(isAuthorizedGoogleOrigin && isGoogleConfigured);

  const handleGoogleError = () => {
    if (!isAuthorizedGoogleOrigin) {
      setError(
        'Google Sign-In is only supported on configured web domains. Please sign in using your email and password.'
      );
    } else {
      setError('Google Sign-In was cancelled or popup closed.');
    }
  };

  const handleGoogleUnavailable = () => {
    setError('Google Sign-In is unavailable in this environment. Please sign in with your email and password below.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-[24px] shadow-2xl p-5 sm:p-6 border border-[#e5e5ea] max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ebebee] active:bg-[#e5e5ea] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <BrandLogo variant="icon" size="lg" />
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f] tracking-tight">
            {mode === 'login'
              ? 'Welcome'
              : mode === 'signup'
              ? activeRole === 'DOCTOR'
                ? 'Doctor Sign Up'
                : 'Patient Sign Up'
              : 'Verify Email'}
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            {mode === 'login'
              ? 'Sign in to access your passes and appointments'
              : mode === 'signup'
              ? 'Enter your details to create an account'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Apple HIG Role Switcher (Patient vs Doctor) */}
        {mode !== 'otp' && (
          <div className="flex p-1 bg-[#e5e5ea]/70 rounded-full mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveRole('PATIENT');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer active:scale-95 ${
                activeRole === 'PATIENT'
                  ? 'bg-white text-[#1d1d1f]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('DOCTOR');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer active:scale-95 ${
                activeRole === 'DOCTOR'
                  ? 'bg-white text-[#1d1d1f]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Doctor
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <div className="space-y-4">
            {/* Google Sign-In Container */}
            <div className="space-y-2">
              <div className="flex justify-center w-full min-h-[40px]">
                {showOfficialGoogleButton ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    shape="pill"
                    theme="outline"
                    size="large"
                    text="continue_with"
                    width="100%"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleUnavailable}
                    disabled={loading}
                    className="w-full h-11 px-4 rounded-full border border-[#e5e5ea] bg-white hover:bg-[#fbfbfd] text-[#1d1d1f] text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="relative my-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e5ea]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2.5 text-[#86868b] font-normal">or email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              <AppleInput
                label={activeRole === 'DOCTOR' ? 'Doctor Email' : 'Patient Email'}
                type="email"
                placeholder={activeRole === 'DOCTOR' ? 'dr.sarah@mediarca.com' : 'john.doe@gmail.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
              <AppleInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-[#1d1d1f] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
              <div className="pt-1">
                <AppleButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  type="submit"
                  loading={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </AppleButton>
              </div>
            </form>

            {/* Toggle to Signup */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signup');
                }}
                className="text-xs text-[#0066cc] font-semibold hover:underline cursor-pointer"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </div>
        )}

        {/* SIGNUP MODE */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
            <AppleInput
              label="Full Name"
              type="text"
              placeholder={activeRole === 'DOCTOR' ? 'Dr. Alex Rivera' : 'Alex Rivera'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<UserIcon className="w-4 h-4" />}
              required
            />
            <AppleInput
              label="Mobile Number"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />
            <AppleInput
              label="Email Address"
              type="email"
              placeholder={activeRole === 'DOCTOR' ? 'dr.name@mediarca.com' : 'name@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <AppleInput
              label="Password (min 8 characters)"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:text-[#1d1d1f] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {/* Doctor Specific Fields */}
            {activeRole === 'DOCTOR' && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#86868b] tracking-wider uppercase mb-1.5 ml-1">
                    Specialty
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] text-sm rounded-xl py-3 px-3.5 transition-all outline-none"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="ENT">ENT</option>
                    <option value="Gynecology">Gynecology</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <AppleInput
                    label="Qualifications"
                    type="text"
                    placeholder="MBBS, MD"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                  />
                  <AppleInput
                    label="Experience (Yrs)"
                    type="number"
                    min="1"
                    placeholder="5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <AppleButton
                variant="primary"
                size="lg"
                className="w-full"
                type="submit"
                loading={loading}
              >
                Create Account
              </AppleButton>
            </div>

            {/* Separator */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e5ea]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-[#86868b] font-normal">or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <div className="flex justify-center w-full min-h-[40px]">
              {showOfficialGoogleButton ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  shape="pill"
                  theme="outline"
                  size="large"
                  text="signup_with"
                  width="100%"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleUnavailable}
                  disabled={loading}
                  className="w-full h-11 px-4 rounded-full border border-[#e5e5ea] bg-white hover:bg-[#fbfbfd] text-[#1d1d1f] text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign up with Google</span>
                </button>
              )}
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-xs text-[#0066cc] font-semibold hover:underline cursor-pointer"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}

        {/* OTP VERIFICATION MODE */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center">
              <AppleInput
                label="6-Digit Verification Code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-[0.3em] font-mono"
                required
                autoFocus
              />
            </div>
            <AppleButton
              variant="primary"
              size="lg"
              className="w-full"
              type="submit"
              loading={loading}
              disabled={otp.length !== 6}
            >
              Verify & Complete Sign In
            </AppleButton>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#86868b] hover:text-[#1d1d1f] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-[#0066cc] font-semibold disabled:opacity-50 cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
