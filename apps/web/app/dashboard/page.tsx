"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Spinner from '@/components/ui/spinner';

export default function DashboardDispatcher() {
  const router = useRouter();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        const res = await api.get('/auth/me');
        const user = res.data;

        if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
          router.replace('/admin');
        } else if (user?.role === 'CAMPUS_AMBASSADOR') {
          router.replace('/dashboard/ca');
        } else {
          // Standard user dashboard
          router.replace('/dashboard/events'); 
        }
      } catch {
        // Any error fetching profile indicates invalid session
        router.replace('/login');
      }
    };

    checkRoleAndRedirect();
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100%', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg-primary)' 
    }}>
      <Spinner size="lg" />
    </div>
  );
}