"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import Spinner from '@/components/ui/spinner';

export default function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('infinito_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const data = await api.get('/auth/me');
        // The backend auth/me typically returns the user object directly, or wrapped in a profile property.
        const user = data.profile || data;

        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            router.replace('/admin');
          } else if (user.role === 'CAMPUS_AMBASSADOR') {
            router.replace('/dashboard/ca');
          } else {
            router.replace('/dashboard');
          }
          return;
        }

        setIsAuthorized(true);
      } catch {
        // Clear invalid token
        localStorage.removeItem('infinito_token');
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router, pathname, allowedRoles]);

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-primary)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
