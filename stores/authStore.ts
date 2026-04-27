import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import api from "@/lib/api";
import type { UserRole, AppUser } from "@/types/user";

interface AuthState {
  user: User | null;
  profile: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadPersistedAuth: () => Promise<void>;
  setProfile: (profile: AppUser) => void;
  refreshProfile: () => Promise<void>;
}

const flattenProfile = (user: any): AppUser => {
  const { patient, doctor, lab, ...base } = user;
  const profile = patient || doctor || lab || {};
  return { ...base, ...profile, patient, doctor, lab };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  initialized: false,

  setProfile: (profile: AppUser) => {
    set({ profile, role: profile.role });
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      // Fetch profile from NestJS
      const profileRes = await api.get('/users/me');
      const profile = flattenProfile(profileRes.data);
      
      await AsyncStorage.setItem("userRole", profile.role);
      set({ user: res.user, profile, role: profile.role, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      await AsyncStorage.multiRemove(["userRole", "userProfile"]);
      set({ user: null, profile: null, role: null, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const profileRes = await api.get('/users/me');
      const profile = flattenProfile(profileRes.data);
      set({ profile, role: profile.role });
    } catch (err) {
      console.error("Failed to refresh profile", err);
    }
  },

  loadPersistedAuth: async () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const profileRes = await api.get('/users/me');
            const profile = flattenProfile(profileRes.data);
            set({
              user,
              profile,
              role: profile.role,
              loading: false,
              initialized: true,
            });
          } catch {
            set({ user, loading: false, initialized: true });
          }
        } else {
          set({
            user: null,
            profile: null,
            role: null,
            loading: false,
            initialized: true,
          });
        }
        resolve();
      });
    });
  },
}));

export async function registerUser(
  email: string,
  password: string,
  userData: Omit<AppUser, "uid" | "createdAt">,
): Promise<User> {
  // 1. Create in Firebase Auth
  const res = await createUserWithEmailAndPassword(auth, email, password);
  
  // 2. Sync with NestJS (which creates the PG record)
  // We use the ID token to authenticate the sync call
  const token = await res.user.getIdToken();
  await api.post('/users/sync', userData, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.user;
}
