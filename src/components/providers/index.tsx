'use client';

import { ReactNode, Suspense } from 'react';
import { ThemeProvider } from './theme-provider';
import { BrandProvider } from './brand-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <BrandProvider>
          {children}
        </BrandProvider>
      </Suspense>
    </ThemeProvider>
  );
}
