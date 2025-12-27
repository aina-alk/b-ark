'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { client, handleApiResponse, setXanoToken } from '@/lib/xano';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
    confirm_password: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const magicToken = searchParams.get('magic_token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<
    'validating' | 'ready' | 'loading' | 'error'
  >('validating');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirm_password: '',
    },
  });

  useEffect(() => {
    async function validateMagicToken() {
      if (!magicToken || !email) {
        setStatus('error');
        setError('Lien invalide ou expiré');
        return;
      }

      try {
        const result = await client.POST(
          '/api:QC35j52Y/reset/magic-link-login',
          {
            body: {
              magic_token: magicToken,
              email: email,
            },
          }
        );
        const data = handleApiResponse(result);
        if (data?.authToken) {
          setXanoToken(data.authToken);
          setStatus('ready');
        } else {
          setStatus('error');
          setError('Le lien a expiré ou est invalide.');
        }
      } catch {
        setStatus('error');
        setError('Le lien a expiré ou est invalide.');
      }
    }

    validateMagicToken();
  }, [magicToken, email]);

  async function onSubmit(data: ResetPasswordInput) {
    setStatus('loading');
    setError(null);

    try {
      const result = await client.POST('/api:QC35j52Y/reset/update_password', {
        body: {
          password: data.password,
          confirm_password: data.confirm_password,
        },
      });
      handleApiResponse(result);
      router.push('/login?message=password_reset');
    } catch {
      setStatus('error');
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
  }

  if (status === 'validating') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === 'error' && !form.formState.isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>
            {error || 'Ce lien de réinitialisation est invalide ou a expiré.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() => router.push('/forgot-password')}
            className="w-full"
          >
            Demander un nouveau lien
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>Choisissez votre nouveau mot de passe</CardDescription>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmer</Label>
            <Input
              id="confirm_password"
              type="password"
              {...form.register('confirm_password')}
            />
            {form.formState.errors.confirm_password && (
              <p className="text-destructive text-sm">
                {form.formState.errors.confirm_password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={status === 'loading'}
          >
            {status === 'loading' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Réinitialiser
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
