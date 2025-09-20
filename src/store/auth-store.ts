import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  healthConditions: string[];
  createdAt: string;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    fullName: string;
    healthConditions: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: true,

      initializeAuth: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              // Get ID token and send to backend
              const idToken = await firebaseUser.getIdToken();
              const response = await authAPI.login(idToken);
              
              if (response.success) {
                const userData = response.data.user;
                set({
                  user: {
                    id: userData.uid,
                    email: userData.email,
                    fullName: userData.fullName,
                    healthConditions: userData.healthConditions,
                    createdAt: userData.createdAt,
                  },
                  firebaseUser,
                  isAuthenticated: true,
                  isInitializing: false,
                });
              }
            } catch (error) {
              console.error('Failed to authenticate with backend:', error);
              set({
                user: null,
                firebaseUser: null,
                isAuthenticated: false,
                isInitializing: false,
              });
            }
          } else {
            set({
              user: null,
              firebaseUser: null,
              isAuthenticated: false,
              isInitializing: false,
            });
          }
        });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // Sign in with Firebase
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Get ID token and authenticate with backend
          const idToken = await firebaseUser.getIdToken();
          const response = await authAPI.login(idToken);
          
          if (response.success) {
            const userData = response.data.user;
            set({
              user: {
                id: userData.uid,
                email: userData.email,
                fullName: userData.fullName,
                healthConditions: userData.healthConditions,
                createdAt: userData.createdAt,
              },
              firebaseUser,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Login failed');
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        
        try {
          // Create user with Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            userData.email, 
            userData.password
          );
          const firebaseUser = userCredential.user;
          
          // Register with backend
          const response = await authAPI.register(userData);
          
          if (response.success) {
            const backendUserData = response.data;
            set({
              user: {
                id: backendUserData.uid,
                email: backendUserData.email,
                fullName: backendUserData.fullName,
                healthConditions: backendUserData.healthConditions,
                createdAt: backendUserData.createdAt,
              },
              firebaseUser,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // If backend registration fails, delete the Firebase user
            await firebaseUser.delete();
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Registration failed');
        }
      },

      logout: async () => {
        try {
          // Logout from backend (for logging purposes)
          try {
            await authAPI.logout();
          } catch (error) {
            // Don't fail logout if backend call fails
            console.warn('Backend logout failed:', error);
          }
          
          // Sign out from Firebase
          await signOut(auth);
          
          set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'vital-circle-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
