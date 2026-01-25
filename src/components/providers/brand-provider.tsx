'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from './theme-provider';

interface BrandInfo {
  organizerId: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface BrandContextType {
  brand: BrandInfo | null;
  isLoading: boolean;
  clearBrand: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { setBrandColors, resetBrand } = useTheme();

  useEffect(() => {
    const organizerId = searchParams.get('org') || searchParams.get('organizer');
    const ref = searchParams.get('ref');

    // Check if coming from an invite link with organizer context
    if (organizerId || ref) {
      loadBrandInfo(organizerId || ref);
    }
  }, [searchParams]);

  const loadBrandInfo = async (id: string | null) => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch organizer brand info from API
      const response = await fetch(`/api/organizers/${id}/brand`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setBrand(data.data);

          // Apply brand colors to theme
          if (data.data.primaryColor) {
            setBrandColors({
              primary: data.data.primaryColor,
              secondary: data.data.secondaryColor || undefined,
              organizerName: data.data.name,
              logoUrl: data.data.logoUrl,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load brand info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearBrand = () => {
    setBrand(null);
    resetBrand();
  };

  return (
    <BrandContext.Provider value={{ brand, isLoading, clearBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within BrandProvider');
  }
  return context;
}
