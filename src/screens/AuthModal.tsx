import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppleButton } from '../components/ui/AppleButton';
import { AppleInput } from '../components/ui/AppleInput';
import { X, Mail, Lock, User, Phone, CheckCircle, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { login, register, verifyOtp, resendOtp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      onSuccess?.();
      onClose();
    } else if (res.requiresVerification) {
      setMode('otp');
    } else {
      setError(res.message || 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register({
      email,
      password,
      fullName,
      phone,
      role: 'PATIENT',
    });
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

    const res = await verifyOtp(email, otp);
    setLoading(false);

    if (res.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(res.message || 'Verification failed');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    const res = await resendOtp(email);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-6 border border-[#e5e5ea]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] active:bg-[#e5e5ea]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#0066cc] to-[#10b981] flex items-center justify-center shadow-md">
            <span className="text-xl font-bold text-white tracking-tight">M</span>
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f]">
            {mode === 'login'
              ? 'Welcome to MediArca'
              : mode === 'signup'
              ? 'Create Account'
              : 'Verify Email'}
          </h2>
          <p className="text-xs text-[#86868b] mt-1">
            {mode === 'login'
              ? 'Sign in to access your queue passes & visits'
              : mode === 'signup'
              ? 'Join to book appointments and track queues'
              : `Enter 6-digit code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <AppleInput
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <AppleInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <div className="pt-2">
              <AppleButton
                variant="primary"
                size="lg"
                className="w-full"
                type="submit"
                loading={loading}
              >
                Sign In
              </AppleButton>
            </div>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('signup');
                }}
                className="text-xs text-[#0066cc] font-medium"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
            <AppleInput
              label="Full Name"
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
            />
            <AppleInput
              label="Phone Number"
              type="tel"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />
            <AppleInput
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <AppleInput
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
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
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-xs text-[#0066cc] font-medium"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}

        {/* OTP Verification Form */}
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
              Verify Code
            </AppleButton>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#86868b] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-[#0066cc] font-medium disabled:opacity-50"
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
