'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GalleryVerticalEnd, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSso = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/overview`,
          queryParams: { hd: 'minervaflow.com' },
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch {
      setErrorMsg('Erreur lors de l’initialisation Google SSO.');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.split('@')[1];
    const ALLOWED_EXPLICIT = ['kbelceus776@gmail.com'];
    const isAllowedDomain = domain === 'minervaflow.com' || domain === 'minerva.com';
    const isExplicitAllowed = ALLOWED_EXPLICIT.includes(normalizedEmail);

    if (!isAllowedDomain && !isExplicitAllowed) {
      setErrorMsg('Accès restreint aux adresses @minervaflow.com, @minerva.com ou autorisées');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg('Compte créé. Redirection vers l’application...');
      setTimeout(() => {
        router.push('/pending-approval');
        router.refresh();
      }, 1000);
    } catch {
      setErrorMsg('Erreur de création de compte.');
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSignup}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium text-mv-ink"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-mv-green text-mv-warm shadow-mv-sm">
                <GalleryVerticalEnd className="size-5" />
              </div>
              <span className="sr-only">Minerva Centurions</span>
            </a>
            <h1 className="text-xl font-bold text-mv-ink font-display">
              Bienvenue chez Minerva Centurions
            </h1>
            <FieldDescription>
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="font-bold text-mv-green hover:underline">
                Se connecter
              </Link>
            </FieldDescription>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-mv-green-tint border border-mv-green/30 text-mv-green text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email">Courriel professionnel</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="vous@minervaflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </Field>

          <Field>
            <Button type="submit" disabled={loading} className="w-full bg-mv-green text-white font-bold hover:bg-mv-green/90">
              {loading ? 'Création...' : 'Créer un compte'}
            </Button>
          </Field>

          <FieldSeparator>Ou</FieldSeparator>

          <Field className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button" onClick={handleGoogleSso} disabled={loading}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-1 size-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button" onClick={handleGoogleSso} disabled={loading}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-1 size-4">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Apple
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        En continuant, vous acceptez nos{' '}
        <a href="#">Conditions d’utilisation</a> et notre{' '}
        <a href="#">Politique de confidentialité</a>.
      </FieldDescription>
    </div>
  );
}
