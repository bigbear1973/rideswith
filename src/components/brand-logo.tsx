'use client';

import { useTheme } from '@/components/providers/theme-provider';

interface BrandLogoProps {
  logo?: string | null;
  logoDark?: string | null;
  name: string;
  primaryColor?: string | null;
  className?: string;
}

export function BrandLogo({ logo, logoDark, name, primaryColor, className = "h-12 w-12" }: BrandLogoProps) {
  const { resolvedTheme } = useTheme();

  // Use dark logo when in dark mode if available, otherwise fall back to regular logo
  const displayLogo = resolvedTheme === 'dark' && logoDark ? logoDark : logo;

  if (displayLogo) {
    return (
      <img
        src={displayLogo}
        alt={name}
        className={`${className} object-contain rounded`}
      />
    );
  }

  // Fallback to initial letter with brand color
  return (
    <div
      className={`${className} rounded flex items-center justify-center text-white font-bold text-lg`}
      style={{
        backgroundColor: primaryColor || "#00D26A",
      }}
    >
      {name.charAt(0)}
    </div>
  );
}
