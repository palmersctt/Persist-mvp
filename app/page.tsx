'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LandingPage from '../src/components/LandingPage';
import DashboardSkeleton from '../src/components/DashboardSkeleton';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Signed-in visitors are normally redirected by middleware before this
  // renders; if one gets here, hold the dashboard's shape while we redirect.
  if (status === 'authenticated') {
    return <DashboardSkeleton />;
  }

  // Render the landing page straight away (including on the server) rather
  // than waiting on the session check — no blank first paint.
  return <LandingPage />;
}
