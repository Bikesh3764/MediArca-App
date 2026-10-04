import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; user?: User }>;
  loginWithGoogle: (credential: string, role?: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; role?: string }) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  resendOtp: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await api.getMe();
      if (res.success && res.data) {
        setUser((res.data as any).user || res.data);
      } else {
        await removeAuthToken();
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    const token = res.token || (res.data as any)?.token;
    if (res.success && token) {
      await setAuthToken(token);
      const loggedUser = (res.data as any)?.user || res.user || res.data;
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    }

    return {
      success: false,
      message: res.message || 'Invalid email or password',
      requiresVerification: (res as any).requiresVerification || (res.data as any)?.requiresVerification || false,
    };
  };

  const loginWithGoogle = async (credential: string, role = 'PATIENT') => {
    try {
      const res = await api.googleAuth(credential, role);
      if (res.success && res.data?.token) {
        await setAuthToken(res.data.token);
        const loggedUser = res.data.user || res.data;
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      }

      return {
        success: false,
        message: res.message || 'Google sign in failed',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Google sign in failed',
      };
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string; role?: string }) => {
    const res = await api.register(data);
    return {
      success: res.success,
      message: res.message || 'Registration failed',
    };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.verifyOtp(email, otp);
    if (res.success && res.data?.token) {
      await setAuthToken(res.data.token);
      const loggedUser = res.data.user || res.data;
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    }
    return {
      success: false,
      message: res.message || 'Verification failed',
    };
  };

  const resendOtp = async (email: string) => {
    const res = await api.resendOtp(email);
    return {
      success: res.success,
      message: res.message || 'Failed to resend code',
    };
  };

  const logout = async () => {
    await removeAuthToken();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('mediarca_demo_user');
      localStorage.removeItem('mediarca_token');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
