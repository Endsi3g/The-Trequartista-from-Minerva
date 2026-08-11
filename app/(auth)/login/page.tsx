import { Suspense } from 'react';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-mv-cream p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="w-full max-w-sm animate-pulse h-64 bg-mv-surface rounded-2xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
