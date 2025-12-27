import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="bg-muted/50 flex min-h-screen items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
