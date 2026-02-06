'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface BrandColors {
  primary?: string;
  secondary?: string;
  organizerName?: string;
  logoUrl?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  brandColors: BrandColors | null;
  setBrandColors: (colors: BrandColors | null) => void;
  resetBrand: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    return savedTheme || 'system';
  });
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [brandColors, setBrandColorsState] = useState<BrandColors | null>(null);
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    root.classList.add(resolvedTheme);
    localStorage.setItem('theme', theme);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (!brandColors?.primary) return;

    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brandColors.primary);
    if (brandColors.secondary) {
      root.style.setProperty('--brand-secondary', brandColors.secondary);
    }
  }, [brandColors]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      const resolved = e.matches ? 'dark' : 'light';
      root.classList.add(resolved);
      setSystemTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setBrandColors = (colors: BrandColors | null) => {
    setBrandColorsState(colors);
  };

  const resetBrand = () => {
    setBrandColorsState(null);
    const root = document.documentElement;
    root.style.removeProperty('--brand-primary');
    root.style.removeProperty('--brand-secondary');
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, resolvedTheme, brandColors, setBrandColors, resetBrand }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
