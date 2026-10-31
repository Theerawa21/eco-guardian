import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseEnvConfigured, isEmulatorEnabled } from '../services/firebase/firebase';
import { UserProfile, UserRole } from '../types';
import { getAllUsers, getUserProfile, saveUserProfile } from '../services/firestore/ecoDataService';
import { ensureSystemMasterData } from '../services/firestore/seedService';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  studentCode?: string;
  role: UserRole;
  classId?: string;
  gradeLevel?: string;
  room?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  registerWithEmail: (input: RegisterInput) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  sendResetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_PREF_KEY = 'eco_guardian_ui_session_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await ensureSystemMasterData();
        const savedUid = sessionStorage.getItem(SESSION_PREF_KEY);
        if (savedUid && mounted) {
          const profile = await getUserProfile(savedUid);
          if (profile) {
            setUser(profile);
          }
        }
      } catch (err) {
        console.warn('Bootstrap warning:', err);
      } finally {
        if (mounted && !(isFirebaseEnvConfigured || isEmulatorEnabled)) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;
      try {
        if (fbUser) {
          let profile = await getUserProfile(fbUser.uid);
          if (!profile && fbUser.email) {
            const all = await getAllUsers(true);
            profile =
              all.find((u) => u.email.toLowerCase() === fbUser.email?.toLowerCase()) ||
              null;
          }
          if (!profile) {
            const now = new Date().toISOString();
            const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'ผู้ใช้งาน';
            const parts = displayName.split(' ');
            profile = await saveUserProfile({
              uid: fbUser.uid,
              email: fbUser.email || '',
              studentCode: null,
              firstName: parts[0] || displayName,
              lastName: parts.slice(1).join(' ') || '',
              displayName,
              role: 'student',
              classId: 'class-m2-1',
              gradeLevel: 'ม.2',
              room: '1',
              avatarUrl: fbUser.photoURL || null,
              active: true,
              createdAt: now,
              updatedAt: now,
            });
          }
          setUser(profile);
          sessionStorage.setItem(SESSION_PREF_KEY, profile.uid);
        }
      } catch (err) {
        console.warn('onAuthStateChanged profile lookup error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<UserProfile> => {
    await ensureSystemMasterData();
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseEnvConfigured || isEmulatorEnabled) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const profile = await getUserProfile(cred.user.uid);
        if (profile) {
          if (!profile.active) {
            throw new Error('บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว');
          }
          setUser(profile);
          sessionStorage.setItem(SESSION_PREF_KEY, profile.uid);
          return profile;
        }
      } catch (err: any) {
        // Check if matching seeded demo account in Firestore
        const allUsers = await getAllUsers(true);
        const matchedDemo = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
        if (!matchedDemo) {
          throw new Error(
            err?.message?.includes('auth/')
              ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
              : err?.message || 'ไม่สามารถเข้าสู่ระบบได้'
          );
        }
      }
    }

    const allUsers = await getAllUsers(true);
    const matched = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!matched || password.length < 6) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง (ตรวจสอบบัญชีหรือใช้บัญชีตัวอย่างด้านล่าง)');
    }
    if (!matched.active) {
      throw new Error('บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว');
    }
    setUser(matched);
    sessionStorage.setItem(SESSION_PREF_KEY, matched.uid);
    return matched;
  };

  const registerWithEmail = async (input: RegisterInput): Promise<UserProfile> => {
    await ensureSystemMasterData();
    const cleanEmail = input.email.trim().toLowerCase();
    let uid = `user_${Date.now()}`;

    if (isFirebaseEnvConfigured || isEmulatorEnabled) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, input.password);
        uid = cred.user.uid;
      } catch (err: any) {
        if (err?.code === 'auth/email-already-in-use') {
          throw new Error('อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ');
        }
      }
    } else {
      const existingUsers = await getAllUsers(true);
      if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        throw new Error('อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาเข้าสู่ระบบ');
      }
    }

    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid,
      email: cleanEmail,
      studentCode: input.studentCode?.trim() || null,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      displayName: `${input.firstName.trim()} ${input.lastName.trim()}`,
      role: input.role,
      classId: input.classId || (input.role === 'student' ? 'class-m2-1' : null),
      gradeLevel: input.gradeLevel || 'ม.2',
      room: input.room || '1',
      avatarUrl: null,
      active: true,
      demo: false,
      createdAt: now,
      updatedAt: now,
    };

    await saveUserProfile(profile);
    setUser(profile);
    sessionStorage.setItem(SESSION_PREF_KEY, profile.uid);
    return profile;
  };

  // Section 2: ออกแบบโครงสร้างไว้ให้เพิ่ม Google Sign-in ภายหลังได้
  const loginWithGoogle = async (): Promise<UserProfile> => {
    if (!(isFirebaseEnvConfigured || isEmulatorEnabled)) {
      throw new Error('กรุณาตั้งค่า VITE_FIREBASE_API_KEY ในไฟล์ .env.local เพื่อเปิดใช้งาน Google Sign-in');
    }
    const cred = await signInWithPopup(auth, googleProvider);
    let profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      const now = new Date().toISOString();
      const displayName = cred.user.displayName || 'ผู้ใช้งาน Google';
      const parts = displayName.split(' ');
      profile = await saveUserProfile({
        uid: cred.user.uid,
        email: cred.user.email || '',
        studentCode: null,
        firstName: parts[0] || displayName,
        lastName: parts.slice(1).join(' ') || '',
        displayName,
        role: 'student',
        classId: 'class-m2-1',
        gradeLevel: 'ม.2',
        room: '1',
        avatarUrl: cred.user.photoURL || null,
        active: true,
        demo: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    setUser(profile);
    sessionStorage.setItem(SESSION_PREF_KEY, profile.uid);
    return profile;
  };

  const sendResetPassword = async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    if (isFirebaseEnvConfigured || isEmulatorEnabled) {
      await sendPasswordResetEmail(auth, cleanEmail);
      return;
    }
    const allUsers = await getAllUsers(true);
    const exists = allUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (!exists) {
      throw new Error('ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลอีกครั้ง');
    }
  };

  const logout = async (): Promise<void> => {
    sessionStorage.removeItem(SESSION_PREF_KEY);
    setUser(null);
    if (isFirebaseEnvConfigured || isEmulatorEnabled) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('SignOut warning:', err);
      }
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    const latest = await getUserProfile(user.uid);
    if (latest) setUser(latest);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendResetPassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}

