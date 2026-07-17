"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Adjust these imports based on your actual file structure
// import api from '@/lib/api'; 
import Spinner from '@/components/ui/spinner';

export default function DashboardDispatcher() {
  const router = useRouter();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        // Hit the endpoint specified in the routing table
        // const response = await api.get('/ca/me');
        
        // TODO: Replace this mock logic with your actual response evaluation.
        // If the backend returns a 200 with the CA profile, they are a CA.
        const isCampusAmbassador = true; 

        if (isCampusAmbassador) {
          // Use replace() instead of push() so the dispatcher page isn't left in the browser history back-stack
          router.replace('/dashboard/ca');
        } else {
          // Route standard users to the default event dashboard
          router.replace('/dashboard/general'); 
        }
      } catch (error: any) {
        // If the endpoint throws a 403 (Not a CA) or 401 (Unauthorized)
        if (error.response?.status === 401) {
          router.replace('/login');
        } else {
          // Standard user fallback if /ca/me strictly rejects non-CAs
          router.replace('/dashboard/general');
        }
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
      {/* Reusing your existing Spinner primitive as mandated by the design rules */}
      <Spinner size="lg" />
    </div>
  );
}