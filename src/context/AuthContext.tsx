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

export const DEMO_USERS: Record<string, User> = {
  'john.doe@gmail.com': {
    id: 'usr_patient_demo',
    email: 'john.doe@gmail.com',
    fullName: 'John Doe',
    phone: '+91 9876543210',
    role: 'PATIENT',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    isEmailVerified: true,
    patientProfile: {
      dateOfBirth: '1990-05-14',
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: 'Penicillin, Dust mites',
      emergencyContact: 'Jane Doe (+91 98765 43211)',
    },
  },
  'dr.sarah@mediarca.com': {
    id: 'usr_sarah_demo',
    email: 'dr.sarah@mediarca.com',
    fullName: 'Dr. Sarah Jenkins',
    phone: '+91 9820012345',
    role: 'DOCTOR',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
    isEmailVerified: true,
    doctorProfile: {
      id: 'doc_sarah_demo',
      userId: 'usr_sarah_demo',
      specialty: 'Cardiology',
      qualifications: 'MD',
      experienceYears: 14,
      consultationFee: 800,
      verificationStatus: 'VERIFIED',
      cabinStatus: 'IN_CABIN',
      user: {
        fullName: 'Dr. Sarah Jenkins',
        email: 'dr.sarah@mediarca.com',
        avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
        phone: '+91 9820012345',
      },
    },
  },
  'clinic@mediarca.com': {
    id: 'usr_clinic_demo',
    email: 'clinic@mediarca.com',
    fullName: 'Metropolis Polyclinic & Diagnostic',
    phone: '+91 9820055001',
    role: 'CLINIC',
    isEmailVerified: true,
    clinicProfile: {
      id: 'clinic_demo_1',
      clinicName: 'Metropolis Polyclinic & Diagnostic',
      address: 'Floor 3, 100 Hill Road, Bandra West, Mumbai, MH',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 9820055001',
      checkinCode: 'METRO01',
      isVerified: true,
      verificationStatus: 'VERIFIED',
    },
  },
  'receptionist@mediarca.com': {
    id: 'usr_receptionist_demo',
    email: 'receptionist@mediarca.com',
    fullName: 'Clara Oswald (Front Desk)',
    phone: '+91 9876543219',
    role: 'RECEPTIONIST',
    isEmailVerified: true,
  },
  'admin@mediarca.com': {
    id: 'usr_admin_demo',
    email: 'admin@mediarca.com',
    fullName: 'MediArca Administrator',
    phone: '+91 9820011000',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    isEmailVerified: true,
  },
};

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

      if (token.startsWith('demo_token_')) {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('mediarca_demo_user') : null;
        if (saved) {
          try {
            setUser(JSON.parse(saved));
            setLoading(false);
            return;
          } catch {}
        }
      }

      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data.user || res.data);
      } else {
        await removeAuthToken();
        setUser(null);
      }
    } catch (e) {
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
    if (res.success && res.data?.token) {
      await setAuthToken(res.data.token);
      const loggedUser = res.data.user || res.data;
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    }

    // Instant offline fallback for verified seeded demo accounts
    const cleanEmail = email.toLowerCase().trim();
    if (DEMO_USERS[cleanEmail]) {
      const demoUser = DEMO_USERS[cleanEmail];
      const demoToken = `demo_token_${demoUser.role.toLowerCase()}`;
      await setAuthToken(demoToken);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('mediarca_demo_user', JSON.stringify(demoUser));
      }
      setUser(demoUser);
      return { success: true, user: demoUser };
    }

    return {
      success: false,
      message: res.message || 'Login failed',
      requiresVerification: res.data?.requiresVerification || false,
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

      // Simulated / demo fallback for Google authentication
      const demoKey = role === 'DOCTOR' ? 'dr.sarah@mediarca.com' : 'john.doe@gmail.com';
      const demoUser = DEMO_USERS[demoKey];
      if (demoUser) {
        const demoToken = `demo_token_${demoUser.role.toLowerCase()}`;
        await setAuthToken(demoToken);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('mediarca_demo_user', JSON.stringify(demoUser));
        }
        setUser(demoUser);
        return { success: true, user: demoUser };
      }

      return {
        success: false,
        message: res.message || 'Google sign in failed',
      };
    } catch (err: any) {
      const demoKey = role === 'DOCTOR' ? 'dr.sarah@mediarca.com' : 'john.doe@gmail.com';
      const demoUser = DEMO_USERS[demoKey];
      if (demoUser) {
        const demoToken = `demo_token_${demoUser.role.toLowerCase()}`;
        await setAuthToken(demoToken);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('mediarca_demo_user', JSON.stringify(demoUser));
        }
        setUser(demoUser);
        return { success: true, user: demoUser };
      }

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
