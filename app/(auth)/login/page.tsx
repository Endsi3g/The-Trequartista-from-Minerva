import { Suspense } from 'react';
import AuthSectionOne from '@/components/ui/auth-section-1';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AuthSectionOne initialMode="login" />
    </Suspense>
  );
}

