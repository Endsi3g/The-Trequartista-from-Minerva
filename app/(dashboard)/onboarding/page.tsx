'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, ArrowRight, User, Briefcase, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { BonsaiPlantLoader } from '@/components/ui/bonsai-plant-loader';
import { LogoMark } from '@/components/shell/Logo';

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Direction & Management');
  const [defaultView, setDefaultView] = useState('/overview');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        } else {
          setFullName(user.email?.split('@')[0] || '');
        }
      }
    })();
  }, []);

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            full_name: fullName,
            email: user.email,
            department,
            approved: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
      setStep(3);
      setTimeout(() => {
        window.location.href = defaultView;
      }, 1200);
    } catch {
      window.location.href = '/overview';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mv-cream flex flex-col justify-between relative overflow-hidden text-mv-ink">
      {/* Top Bar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between z-20 relative bg-mv-surface/60 backdrop-blur-sm border-b border-mv-border/40">
        <LogoMark />
        <div className="flex items-center gap-2 text-xs font-bold text-mv-ink-soft">
          <span>Étape {step} sur 3</span>
        </div>
      </header>

      {/* Main Wizard Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-20 relative my-6">
        <div className="bg-mv-surface border border-mv-border rounded-[16px] shadow-mv-md p-6 sm:p-8 max-w-[500px] w-full relative overflow-hidden">
          {loading && (
            <BonsaiPlantLoader
              title="Un instant !"
              subtitle="Configuration de votre espace…"
            />
          )}

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-mv-green' : 'bg-mv-border'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-mv-green' : 'bg-mv-border'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-mv-green' : 'bg-mv-border'}`} />
          </div>

          {/* Step 1: Personal Profile */}
          {step === 1 && (
            <div className="space-y-6 animate-mv-scale-in">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-extrabold text-mv-ink font-display tracking-tight">
                  Bienvenue dans l&apos;équipe !
                </h1>
                <p className="text-xs text-mv-ink-soft">
                  Configurez votre profil d&apos;utilisateur interne ({userEmail}).
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="fullName" className="block text-xs font-bold text-mv-ink">
                    Nom complet
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Marie Tremblay"
                      className="w-full px-3.5 py-2.5 pl-10 bg-mv-surface border border-mv-border rounded-xl text-sm text-mv-ink placeholder-mv-ink-mute focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all"
                    />
                    <User className="w-4 h-4 text-mv-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="department" className="block text-xs font-bold text-mv-ink">
                    Département / Pôle d&apos;expertise
                  </label>
                  <div className="relative">
                    <select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-10 bg-mv-surface border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all appearance-none"
                    >
                      <option value="Direction & Management">Direction & Management</option>
                      <option value="Design & UX Studio">Design & UX Studio</option>
                      <option value="Achat Média & Growth">Achat Média & Growth</option>
                      <option value="Développement & Tech">Développement & Tech</option>
                      <option value="Gestion de Comptes & ROI">Gestion de Comptes & ROI</option>
                    </select>
                    <Briefcase className="w-4 h-4 text-mv-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 px-4 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Preferences */}
          {step === 2 && (
            <div className="space-y-6 animate-mv-scale-in">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-extrabold text-mv-ink font-display tracking-tight">
                  Préférences de travail
                </h1>
                <p className="text-xs text-mv-ink-soft">
                  Personnalisez votre affichage par défaut.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="defaultView" className="block text-xs font-bold text-mv-ink">
                    Vue initiale au démarrage
                  </label>
                  <div className="relative">
                    <select
                      id="defaultView"
                      value={defaultView}
                      onChange={(e) => setDefaultView(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-10 bg-mv-surface border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green transition-all appearance-none"
                    >
                      <option value="/overview">Vue d&apos;ensemble (Overview Dashboard)</option>
                      <option value="/leads">CRM Leads & Pipeline Sales</option>
                      <option value="/projects">Pipeline Projets & Delivery</option>
                      <option value="/content-planner">Planificateur Vidéo & Reels</option>
                    </select>
                    <Sparkles className="w-4 h-4 text-mv-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-4 bg-mv-surface border border-mv-border text-mv-ink font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="flex-1 py-3 px-4 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Lancer mon espace</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4 animate-mv-scale-in">
              <div className="w-16 h-16 rounded-full bg-mv-green-tint text-mv-green flex items-center justify-center mx-auto mb-2">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h1 className="text-2xl font-extrabold text-mv-ink font-display">
                Configuration réussie !
              </h1>
              <p className="text-xs text-mv-ink-soft max-w-sm mx-auto">
                Bienvenue {fullName}. Redirection automatique vers votre tableau de bord...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Corner Illustrations */}
      <div className="fixed bottom-0 left-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-left.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>
      <div className="fixed bottom-0 right-0 z-10 pointer-events-none select-none">
        <Image src="/leaf-bottom-right.svg" alt="Decoration" width={220} height={260} className="w-44 sm:w-56" />
      </div>
    </div>
  );
}
