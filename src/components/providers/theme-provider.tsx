'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BrandTheme {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  organizerName?: string;
  logoUrl?: string;
}

const DEFAULT_THEME: BrandTheme = {
  primary: '#0ea5e9', // Sky blue - cycling/outdoor feel
  primaryForeground: '#ffffff',
  secondary: '#1e293b', // Slate
  secondaryForeground: '#f8fafc',
  accent: '#22c55e', // Green - go/action
};

interface ThemeContextType {
  theme: BrandTheme;
  setTheme: (theme: Partial<BrandTheme>) => void;
  resetTheme: () => void;
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getContrastColor(hex: string): string {
  const { l } = hexToHsl(hex);
  return l > 50 ? '#0f172a' : '#ffffff';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<BrandTheme>(DEFAULT_THEME);
  const [isDark, setIsDark] = useState(true); // Default to dark for sustainability

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);

    // Check for saved preference
    const saved = localStorage.getItem('theme-mode');
    if (saved) {
      setIsDark(saved === 'dark');
    }
  }, []);

  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement;
    const primary = hexToHsl(theme.primary);
    const secondary = hexToHsl(theme.secondary);
    const accent = hexToHsl(theme.accent);

    root.style.setProperty('--primary', `${primary.h} ${primary.s}% ${primary.l}%`);
    root.style.setProperty('--primary-foreground', theme.primaryForeground);
    root.style.setProperty('--secondary', `${secondary.h} ${secondary.s}% ${secondary.l}%`);
    root.style.setProperty('--secondary-foreground', theme.secondaryForeground);
    root.style.setProperty('--accent', `${accent.h} ${accent.s}% ${accent.l}%`);

    // Set dark/light mode
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
  }, [theme, isDark]);

  const setTheme = (newTheme: Partial<BrandTheme>) => {
    setThemeState(prev => {
      const updated = { ...prev, ...newTheme };
      // Auto-calculate foreground colors for accessibility
      if (newTheme.primary) {
        updated.primaryForeground = getContrastColor(newTheme.primary);
      }
      if (newTheme.secondary) {
        updated.secondaryForeground = getContrastColor(newTheme.secondary);
      }
      return updated;
    });
  };

  const resetTheme = () => setThemeState(DEFAULT_THEME);

  const toggleDark = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, isDark, toggleDark }}>
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
