'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut as fbSignOut, 
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isSuper = currentUser.email === 'tonmoymbm@gmail.com';
        // Immediate baseline profile from Google Auth
        const baselineProfile: UserProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || (isSuper ? 'Super Admin' : 'ব্যবহারকারী'),
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          role: isSuper ? 'superadmin' : 'user',
          notifPrefs: { match: true, sight: true, digest: false, remind: true },
        };
        setProfile(baselineProfile);

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (isSuper && data.role !== 'superadmin') {
              try { await setDoc(userDocRef, { role: 'superadmin' }, { merge: true }); } catch {}
              data.role = 'superadmin';
            }
            setProfile({
              ...baselineProfile,
              ...data,
              displayName: data.displayName || currentUser.displayName || baselineProfile.displayName,
              photoURL: data.photoURL || currentUser.photoURL || baselineProfile.photoURL,
              role: isSuper ? 'superadmin' : (data.role || 'user'),
            });
          } else {
            const newProfile: UserProfile = {
              ...baselineProfile,
              createdAt: serverTimestamp(),
            };
            try { await setDoc(userDocRef, newProfile); } catch {}
            setProfile(newProfile);
          }
        } catch (err) {
          console.warn('Firestore user fetch notice (using auth baseline):', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const isSuper = res.user.email === 'tonmoymbm@gmail.com';
    const baselineProfile: UserProfile = {
      uid: res.user.uid,
      displayName: res.user.displayName || (isSuper ? 'Super Admin' : 'ব্যবহারকারী'),
      email: res.user.email || '',
      photoURL: res.user.photoURL || '',
      role: isSuper ? 'superadmin' : 'user',
      notifPrefs: { match: true, sight: true, digest: false, remind: true },
    };
    setProfile(baselineProfile);

    try {
      const userDocRef = doc(db, 'users', res.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          ...baselineProfile,
          createdAt: serverTimestamp(),
        };
        try { await setDoc(userDocRef, newProfile); } catch {}
        setProfile(newProfile);
      } else {
        const data = userDoc.data() as UserProfile;
        if (isSuper && data.role !== 'superadmin') {
          try { await setDoc(userDocRef, { role: 'superadmin' }, { merge: true }); } catch {}
          data.role = 'superadmin';
        }
        setProfile({
          ...baselineProfile,
          ...data,
          displayName: data.displayName || res.user.displayName || baselineProfile.displayName,
          photoURL: data.photoURL || res.user.photoURL || baselineProfile.photoURL,
          role: isSuper ? 'superadmin' : (data.role || 'user'),
        });
      }
    } catch (err) {
      console.warn('Google sign in firestore sync notice:', err);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    const newProfile: UserProfile = {
      uid: res.user.uid,
      displayName: name,
      email: email,
      role: 'user',
      notifPrefs: { match: true, sight: true, digest: false, remind: true },
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', res.user.uid), newProfile);
    setProfile(newProfile);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, data, { merge: true });
    setProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
