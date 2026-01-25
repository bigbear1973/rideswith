'use client';

import { ReactNode, Suspense } from 'react';
import { ThemeProvider } from './theme-provider';
import { BrandProvider } from './brand-provider';
import { AuthProvider } from './auth-provider';
import { UnitsProvider } from './units-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UnitsProvider>
          <Suspense fallback={null}>
            <BrandProvider>
              {children}
            </BrandProvider>
          </Suspense>
        </UnitsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
