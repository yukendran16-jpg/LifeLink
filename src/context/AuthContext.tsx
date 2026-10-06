import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../lib/firebase';
import {
  getUserProfile,
  setUserProfile,
  getDonorProfile,
  getHospitalProfile,
  saveDonorProfile,
  saveHospitalProfile,
  seedInitialNetworkData
} from '../lib/dbService';
import {
  UserProfile,
  DonorProfile,
  HospitalProfile,
  UserRole,
  BloodGroup,
  AvailabilityStatus
} from '../types';

export const ADMIN_EMAIL = 'yukendranyukendran475@gmail.com';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  donorProfile: DonorProfile | null;
  hospitalProfile: HospitalProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  activeSimulatedRole: UserRole | null;
  activeSimulatedId: string | null;
  signInWithGoogle: (defaultRole?: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    details?: {
      bloodGroup?: BloodGroup;
      city?: string;
      phone?: string;
      hospitalName?: string;
      licenseNumber?: string;
      address?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  switchSimulatedPersona: (role: UserRole | null, personaId?: string) => void;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [donorProfile, setDonorProfileState] = useState<DonorProfile | null>(null);
  const [hospitalProfile, setHospitalProfileState] = useState<HospitalProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulation persona for swift evaluator walkthrough across roles
  const [activeSimulatedRole, setActiveSimulatedRole] = useState<UserRole | null>(null);
  const [activeSimulatedId, setActiveSimulatedId] = useState<string | null>(null);

  useEffect(() => {
    // Initial connection test
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser);
      } else {
        setUserProfileState(null);
        setDonorProfileState(null);
        setHospitalProfileState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (currentUser: User) => {
    try {
      let profile = await getUserProfile(currentUser.uid);
      const isSystemAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (!profile) {
        // Auto-provision profile
        const assignedRole: UserRole = isSystemAdmin ? 'ADMIN' : 'DONOR';
        profile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          role: assignedRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setUserProfile(profile);
      } else if (isSystemAdmin && profile.role !== 'ADMIN') {
        profile.role = 'ADMIN';
        await setUserProfile(profile);
      }

      setUserProfileState(profile);

      // Seed baseline demo network data if system is freshly provisioned
      await seedInitialNetworkData(currentUser.uid);

      if (profile.role === 'DONOR') {
        let dProfile = await getDonorProfile(currentUser.uid);
        if (!dProfile) {
          // Initialize empty donor record
          const newDonor: DonorProfile = {
            id: currentUser.uid,
            userId: currentUser.uid,
            fullName: profile.displayName || 'Registered Donor',
            email: currentUser.email || '',
            phone: '',
            bloodGroup: 'O+',
            city: 'New York',
            availabilityStatus: 'AVAILABLE',
            totalDonations: 0,
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await saveDonorProfile(newDonor);
          dProfile = newDonor;
        }
        setDonorProfileState(dProfile);
      } else if (profile.role === 'HOSPITAL') {
        let hProfile = await getHospitalProfile(currentUser.uid);
        if (!hProfile) {
          const newHospital: HospitalProfile = {
            id: currentUser.uid,
            userId: currentUser.uid,
            hospitalName: profile.displayName || 'General Medical Facility',
            licenseNumber: 'PENDING-REG',
            email: currentUser.email || '',
            phone: '',
            address: 'City Medical District',
            city: 'New York',
            verificationStatus: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await saveHospitalProfile(newHospital);
          hProfile = newHospital;
        }
        setHospitalProfileState(hProfile);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  const refreshProfiles = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  const signInWithGoogle = async (defaultRole: UserRole = 'DONOR') => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const isSystemAdmin = res.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      let profile = await getUserProfile(res.user.uid);
      if (!profile) {
        profile = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || 'LifeLink Member',
          role: isSystemAdmin ? 'ADMIN' : defaultRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setUserProfile(profile);
      }
      await loadUserData(res.user);
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await loadUserData(res.user);
    } catch (err) {
      console.error('Email sign-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    details?: {
      bloodGroup?: BloodGroup;
      city?: string;
      phone?: string;
      hospitalName?: string;
      licenseNumber?: string;
      address?: string;
    }
  ) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const isSystemAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const actualRole = isSystemAdmin ? 'ADMIN' : role;

      const profile: UserProfile = {
        uid: res.user.uid,
        email,
        displayName,
        role: actualRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setUserProfile(profile);

      if (actualRole === 'DONOR') {
        const donorData: DonorProfile = {
          id: res.user.uid,
          userId: res.user.uid,
          fullName: displayName,
          email,
          phone: details?.phone || '',
          bloodGroup: details?.bloodGroup || 'O+',
          city: details?.city || 'New York',
          availabilityStatus: 'AVAILABLE',
          totalDonations: 0,
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveDonorProfile(donorData);
        setDonorProfileState(donorData);
      } else if (actualRole === 'HOSPITAL') {
        const hospitalData: HospitalProfile = {
          id: res.user.uid,
          userId: res.user.uid,
          hospitalName: details?.hospitalName || displayName,
          licenseNumber: details?.licenseNumber || 'PENDING-REG',
          email,
          phone: details?.phone || '',
          address: details?.address || 'Medical District',
          city: details?.city || 'New York',
          verificationStatus: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveHospitalProfile(hospitalData);
        setHospitalProfileState(hospitalData);
      }

      setUserProfileState(profile);
    } catch (err) {
      console.error('Email sign-up error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setActiveSimulatedRole(null);
    setActiveSimulatedId(null);
    await fbSignOut(auth);
  };

  const switchSimulatedPersona = (role: UserRole | null, personaId?: string) => {
    setActiveSimulatedRole(role);
    setActiveSimulatedId(personaId || null);
  };

  const effectiveRole: UserRole | null = activeSimulatedRole || userProfile?.role || null;
  const isEffectiveAdmin =
    effectiveRole === 'ADMIN' ||
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    userProfile?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        donorProfile,
        hospitalProfile,
        role: effectiveRole,
        isAdmin: isEffectiveAdmin,
        loading,
        activeSimulatedRole,
        activeSimulatedId,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        switchSimulatedPersona,
        refreshProfiles
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
