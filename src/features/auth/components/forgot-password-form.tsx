'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

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
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { client, handleApiResponse } from '@/lib/xano';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setStatus('loading');
    setError(null);

    try {
      const result = await client.GET(
        '/api:QC35j52Y/reset/request-reset-link',
        {
          params: {
            query: {
              email: data.email,
            },
          },
        }
      );
      handleApiResponse(result);
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Une erreur est survenue. Veuillez réessayer.');
    }
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-center">Email envoy&eacute;</CardTitle>
          <CardDescription className="text-center">
            Si un compte existe avec cette adresse, vous recevrez un email avec
            les instructions pour r&eacute;initialiser votre mot de passe.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Retour &agrave; la connexion
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mot de passe oubli&eacute;</CardTitle>
        <CardDescription>
          Entrez votre email pour recevoir un lien de r&eacute;initialisation
        </CardDescription>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="dr.martin@email.fr"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={status === 'loading'}
          >
            {status === 'loading' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Envoyer le lien
          </Button>

          <Link href="/login" className="text-primary text-sm hover:underline">
            Retour &agrave; la connexion
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
