import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UnitSystem, UserSettings } from '@/types';

interface UserSettingsState extends UserSettings {
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  setPreferredLocation: (location: string, lat?: number, lng?: number) => void;
  setTimezone: (timezone: string) => void;
  setUnitSystem: (unit: UnitSystem) => void;
  setPushEnabled: (enabled: boolean) => void;
  setEmailEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const initialState: UserSettings = {
  sessionId: generateSessionId(),
  email: undefined,
  name: undefined,
  preferredLocation: undefined,
  locationLatitude: undefined,
  locationLongitude: undefined,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  unitSystem: 'metric',
  pushEnabled: false,
  emailEnabled: true,
};

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      setEmail: (email) => set({ email }),

      setName: (name) => set({ name }),

      setPreferredLocation: (location, lat, lng) =>
        set({
          preferredLocation: location,
          locationLatitude: lat,
          locationLongitude: lng,
        }),

      setTimezone: (timezone) => set({ timezone }),

      setUnitSystem: (unitSystem) => set({ unitSystem }),

      setPushEnabled: (pushEnabled) => set({ pushEnabled }),

      setEmailEnabled: (emailEnabled) => set({ emailEnabled }),

      reset: () => set({ ...initialState, sessionId: generateSessionId() }),
    }),
    {
      name: 'user-settings',
    }
  )
);
