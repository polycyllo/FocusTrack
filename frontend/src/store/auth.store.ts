import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getUserById } from '../features/auth/repo';
import type { AuthUser, LoginInput, RegisterInput } from '../features/auth/repo';

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (data: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  restoreSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (data) => {
        set({ isLoading: true });
        
        const result = await loginUser(data);
        
        if (result.success && result.user) {
          set({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        }
        
        set({ isLoading: false });
        return {
          success: false,
          error: result.error || 'Error al iniciar sesión',
        };
    },

      register: async (data) => {
        set({ isLoading: true });
        
        const result = await registerUser(data);
        
        set({ isLoading: false });
        
        if (result.success) {
          return { success: true };
        }
        
        return {
          success: false,
          error: result.error || 'Error al registrar usuario',
        };
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      restoreSession: async () => {
        const { user } = get();
        
        if (user && user.studentId) {
          // Verificar si el usuario todavía existe en la BD
          const currentUser = await getUserById(user.studentId);
          
          if (currentUser) {
            set({
              user: currentUser,
              isAuthenticated: true,
            });
          } else {
            // Si el usuario no existe, cerrar sesión
            set({
              user: null,
              isAuthenticated: false,
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);