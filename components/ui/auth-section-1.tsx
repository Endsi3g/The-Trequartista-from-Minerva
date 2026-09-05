"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle, ArrowUpRight, Check } from "lucide-react";
import { Logo } from "@/components/shell/Logo";

interface AuthSectionOneProps {
  initialMode?: "login" | "signup";
}

export default function AuthSectionOne({ initialMode = "login" }: AuthSectionOneProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [optInUpdates, setOptInUpdates] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams?.get("next");
  const redirectTo = explicitRedirect || "/overview";
  const supabase = createClient();

  const handleGoogleSso = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: { hd: "minervaflow.com" },
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      }
    } catch {
      setErrorMessage("Erreur lors de l'authentification Google SSO.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setErrorMessage("Veuillez renseigner votre email et mot de passe.");
      setLoading(false);
      return;
    }

    if (mode === "signup" && !acceptedTerms) {
      setErrorMessage("Vous devez accepter les conditions d'utilisation.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErrorMessage("Identifiants incorrects. Vérifiez votre email et mot de passe.");
          } else {
            setErrorMessage(error.message);
          }
          setLoading(false);
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName || undefined,
              opt_in_updates: optInUpdates,
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          router.push(redirectTo);
          router.refresh();
        } else {
          setSuccessMessage("Compte créé avec succès. Vérifiez vos emails pour confirmer votre adresse.");
          setLoading(false);
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Une erreur inattendue est survenue.");
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#ffffff] p-3 text-[#000000] font-sans antialiased">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr] max-w-[1536px] mx-auto">
        {/* Panneau Formulaire - Blanc Monastique avec rayon de carte 16px */}
        <div className="flex min-h-[720px] items-start rounded-2xl border border-[#f2f2f2] bg-[#ffffff] px-6 py-10 sm:px-10 lg:min-h-0 lg:px-14 lg:py-16 xl:px-20 shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
          <div className="mx-auto w-full max-w-[540px]">
            {/* Header Brand */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <Logo size={28} />
              </Link>
              <div className="text-xs text-[#71717a]">
                {mode === "login" ? (
                  <>
                    Pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setErrorMessage(null);
                      }}
                      className="font-medium text-[#000000] underline underline-offset-4 hover:text-[#0c8c5e] transition-colors"
                    >
                      Créer un compte
                    </button>
                  </>
                ) : (
                  <>
                    Déjà inscrit ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrorMessage(null);
                      }}
                      className="font-medium text-[#000000] underline underline-offset-4 hover:text-[#0c8c5e] transition-colors"
                    >
                      Se connecter
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#0c8c5e]">
                Minerva Trequartista OS
              </span>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl text-[#000000]">
                {mode === "login" ? "Connexion à l'espace" : "Créer votre compte"}
              </h1>
              <p className="mt-2 text-base leading-relaxed text-[#71717a]">
                {mode === "login"
                  ? "Accédez aux opérations, CRM leads, gestion client et infrastructure."
                  : "Rejoignez le système d'exploitation et pilotez l'agence en temps réel."}
              </p>
            </div>

            {/* Boutons Sociaux SSO */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <SocialButton
                onClick={handleGoogleSso}
                disabled={loading}
                icon={<GoogleIcon />}
                label="Google Workspace"
              />
              <SocialButton
                onClick={() => {
                  setErrorMessage("L'authentification Apple est réservée aux appareils certifiés MDM.");
                }}
                disabled={loading}
                icon={<AppleIcon />}
                label="Apple ID"
              />
            </div>

            <div className="relative my-8 text-center text-xs font-medium text-[#a1a1aa]">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#f2f2f2]" />
              </div>
              <span className="relative bg-[#ffffff] px-4">ou avec votre email professionnel</span>
            </div>

            {/* Alertes d'état */}
            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 rounded border border-red-200 bg-red-50/60 p-3.5 text-xs text-red-800">
                <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                <p className="flex-1 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 flex items-start gap-3 rounded border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-800">
                <Check className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                <p className="flex-1 leading-relaxed">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#71717a]">Prénom</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                      className="w-full h-11 px-3.5 text-sm rounded border border-[#dddddd] bg-[#ffffff] text-[#000000] placeholder:text-[#a1a1aa] focus:border-[#0c8c5e] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#71717a]">Nom</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                      className="w-full h-11 px-3.5 text-sm rounded border border-[#dddddd] bg-[#ffffff] text-[#000000] placeholder:text-[#a1a1aa] focus:border-[#0c8c5e] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#71717a]">Email professionnel</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@minervaflow.com"
                  className="w-full h-11 px-3.5 text-sm rounded border border-[#dddddd] bg-[#ffffff] text-[#000000] placeholder:text-[#a1a1aa] focus:border-[#0c8c5e] focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#71717a]">Mot de passe</label>
                  {mode === "login" && (
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#71717a] hover:text-[#0c8c5e] underline underline-offset-2 transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-3.5 pr-10 text-sm rounded border border-[#dddddd] bg-[#ffffff] text-[#000000] placeholder:text-[#a1a1aa] focus:border-[#0c8c5e] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-[#000000] transition-colors"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs leading-relaxed text-[#71717a]">
                <CheckboxLine
                  checked={optInUpdates}
                  onChange={(checked) => setOptInUpdates(checked)}
                >
                  Recevoir les mises à jour opérationnelles et changelogs de Minerva OS.
                </CheckboxLine>
                {mode === "signup" && (
                  <CheckboxLine
                    checked={acceptedTerms}
                    onChange={(checked) => setAcceptedTerms(checked)}
                  >
                    J&apos;accepte les{" "}
                    <Link href="/terms" className="font-medium text-[#000000] underline hover:text-[#0c8c5e]">
                      Conditions Générales
                    </Link>{" "}
                    et la{" "}
                    <Link href="/privacy" className="font-medium text-[#000000] underline hover:text-[#0c8c5e]">
                      Politique de Confidentialité
                    </Link>.
                  </CheckboxLine>
                )}
              </div>

              {/* Bouton Primaire Ink Black #08090a avec rayon 4px */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-11 w-full items-center justify-center rounded bg-[#08090a] text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Traitement en cours...
                  </span>
                ) : mode === "login" ? (
                  "Se connecter"
                ) : (
                  "Créer le compte"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Panneau Droit - Shader GrainGradient Hero Teal Mintlify */}
        <div className="relative flex min-h-[580px] overflow-hidden rounded-2xl bg-[#053323] p-8 text-white sm:p-12 lg:min-h-0 border border-[#0c8c5e]/20">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.6}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#0c8c5e", "#075037", "#053323"]}
            colorBack="#053323"
            className="absolute inset-0 bg-[#053323]"
          />

          {/* Scrim subtil pour garantir une lisibilité absolue */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#053323]/90 via-transparent to-[#053323]/40 pointer-events-none" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <Logo variant="light" size={28} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] px-2.5 py-1 rounded bg-white/10 text-white border border-white/15 backdrop-blur-sm">
                Minerva Reach Companion
              </span>
            </div>

            <div className="max-w-[560px] my-auto py-12">
              <h2 className="text-4xl sm:text-5xl lg:text-[52px] font-semibold tracking-[-0.03em] text-white leading-[1.05]">
                Penser vite,
                <br />
                Bâtir plus vite.
              </h2>
              <p className="mt-4 text-base text-white/80 leading-relaxed max-w-md">
                L&apos;outil d&apos;exploitation interne qui garde l&apos;équipe, les livrables et la qualité alignés en continu.
              </p>
            </div>

            {/* Action Compagnon : Minerva Reach Desktop */}
            <a
              href="https://minerva-os-lite-desktop.vercel.app/today"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 max-w-max items-center gap-2.5 rounded border border-white/30 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 hover:border-white/50"
            >
              <span>Accéder à Minerva Reach Desktop</span>
              <ArrowUpRight className="size-4 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 items-center justify-center gap-2.5 rounded border border-[#dddddd] bg-[#ffffff] px-3.5 text-xs font-medium text-[#000000] transition-colors hover:bg-[#f2f2f2] disabled:opacity-50"
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function CheckboxLine({
  children,
  checked,
  onChange,
}: {
  children: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <span className="relative mt-0.5 size-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-full appearance-none rounded border border-[#dddddd] bg-[#ffffff] checked:border-[#08090a] checked:bg-[#08090a] transition-colors"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-xs text-[#71717a]">{children}</span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 12.54c-.03-3.02 2.47-4.47 2.58-4.54-1.41-2.06-3.6-2.34-4.38-2.37-1.86-.19-3.64 1.1-4.58 1.1-.95 0-2.42-1.07-3.98-1.04-2.05.03-3.94 1.19-4.99 3.02-2.13 3.69-.54 9.16 1.53 12.15 1.01 1.46 2.22 3.1 3.81 3.04 1.53-.06 2.11-.99 3.96-.99s2.37.99 3.99.96c1.65-.03 2.69-1.49 3.69-2.96 1.16-1.69 1.64-3.33 1.66-3.41-.04-.02-3.2-1.23-3.24-4.87ZM14.03 3.66c.84-1.02 1.41-2.43 1.25-3.84-1.21.05-2.68.81-3.55 1.83-.78.9-1.46 2.34-1.28 3.72 1.35.1 2.73-.69 3.58-1.71Z" />
    </svg>
  );
}
