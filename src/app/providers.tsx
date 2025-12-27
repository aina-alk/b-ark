'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
