import { create } from 'zustand';
import api from '@/lib/api';

interface Athlete {
  _id: string;
  email: string;
  sport?: string;
  experienceLevel?: string;
  history?: any[];
  workouts?: any[];
}

interface CycleInfo {
  currentCycleDay: number | null;
  predictedNextPeriodStart: string | null;
  currentPhase: string | null;
  physiologicalContext?: string;
  averageCycleLength?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  athlete: Athlete | null;
  cycleInfo: CycleInfo | null;
  currentPlan: any | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; sport: string; experienceLevel: string }) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchCycleInfo: () => Promise<void>;
  setCurrentPlan: (plan: any) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  athlete: null,
  cycleInfo: null,
  currentPlan: null,
  loading: false,

  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    set({ isAuthenticated: true });
    // Token is set via HttpOnly cookie
  },

  register: async (formData) => {
    await api.post('/api/auth/register', formData);
    set({ isAuthenticated: true });
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/api/athlete/me');
      set({
        athlete: data.athlete,
        isAuthenticated: true,
        cycleInfo: {
          currentCycleDay: data.currentCycleDay,
          predictedNextPeriodStart: data.predictedNextPeriodStart,
          currentPhase: null,
          physiologicalContext: undefined,
        },
      });
    } catch {
      set({ isAuthenticated: false, athlete: null });
    }
  },

  fetchCycleInfo: async () => {
    try {
      const { data } = await api.get('/api/periods');
      set({
        cycleInfo: {
          currentCycleDay: data.currentCycleDay,
          predictedNextPeriodStart: data.predictedNextPeriodStart,
          currentPhase: data.currentPhase,
          physiologicalContext: data.physiologicalContext,
          averageCycleLength: data.averageCycleLength,
        },
      });
    } catch {
      // silent
    }
  },

  setCurrentPlan: (plan) => set({ currentPlan: plan }),

  logout: () => {
    set({ isAuthenticated: false, athlete: null, cycleInfo: null, currentPlan: null });
  },
}));

export default useAuthStore;
