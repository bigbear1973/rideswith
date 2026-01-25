'use client';

import { useUserSettingsStore } from '@/store/user-settings';

export function useUserSettings() {
  const store = useUserSettingsStore();

  return {
    ...store,
    isMetric: store.unitSystem === 'metric',
    isImperial: store.unitSystem === 'imperial',
  };
}
