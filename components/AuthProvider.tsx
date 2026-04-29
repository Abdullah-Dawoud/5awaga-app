'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

// Wraps the app so any client component can call useSession()
export default function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
