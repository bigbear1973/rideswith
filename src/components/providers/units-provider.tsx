'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UnitSystem = 'metric' | 'imperial';
export type Language = 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'pt';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

interface UnitsContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  // Conversion helpers
  formatDistance: (km: number) => string;
  formatSpeed: (kmh: number) => string;
  formatElevation: (meters: number) => string;
  formatTemperature: (celsius: number) => string;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

const STORAGE_KEY = 'rideswith-units';

interface StoredPreferences {
  unitSystem: UnitSystem;
  language: Language;
  timezone: string;
  temperatureUnit: TemperatureUnit;
}

const defaultPreferences: StoredPreferences = {
  unitSystem: 'metric',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  temperatureUnit: 'celsius',
};

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StoredPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredPreferences>;
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch {
      // Ignore errors
    }
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [preferences, isLoaded]);

  const setUnitSystem = (unitSystem: UnitSystem) => {
    setPreferences((prev) => ({
      ...prev,
      unitSystem,
      // Auto-set temperature unit based on system
      temperatureUnit: unitSystem === 'imperial' ? 'fahrenheit' : 'celsius',
    }));
  };

  const setLanguage = (language: Language) => {
    setPreferences((prev) => ({ ...prev, language }));
  };

  const setTimezone = (timezone: string) => {
    setPreferences((prev) => ({ ...prev, timezone }));
  };

  const setTemperatureUnit = (temperatureUnit: TemperatureUnit) => {
    setPreferences((prev) => ({ ...prev, temperatureUnit }));
  };

  // Conversion helpers
  const formatDistance = (km: number): string => {
    if (preferences.unitSystem === 'imperial') {
      const miles = km * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${km.toFixed(1)} km`;
  };

  const formatSpeed = (kmh: number): string => {
    if (preferences.unitSystem === 'imperial') {
      const mph = kmh * 0.621371;
      return `${mph.toFixed(0)} mph`;
    }
    return `${kmh.toFixed(0)} km/h`;
  };

  const formatElevation = (meters: number): string => {
    if (preferences.unitSystem === 'imperial') {
      const feet = meters * 3.28084;
      return `${Math.round(feet)} ft`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatTemperature = (celsius: number): string => {
    if (preferences.temperatureUnit === 'fahrenheit') {
      const fahrenheit = (celsius * 9) / 5 + 32;
      return `${Math.round(fahrenheit)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  return (
    <UnitsContext.Provider
      value={{
        unitSystem: preferences.unitSystem,
        setUnitSystem,
        language: preferences.language,
        setLanguage,
        timezone: preferences.timezone,
        setTimezone,
        temperatureUnit: preferences.temperatureUnit,
        setTemperatureUnit,
        formatDistance,
        formatSpeed,
        formatElevation,
        formatTemperature,
      }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
}
