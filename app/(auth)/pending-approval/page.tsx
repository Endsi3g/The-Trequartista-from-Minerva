import Link from 'next/link';
import { Shield, Clock, Mail } from 'lucide-react';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-mv-cream text-mv-ink flex items-center justify-center p-4 font-sans">
      <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-mv-lg max-w-md w-full p-8 space-y-6 text-center animate-mv-scale-in">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-mv-amber/10 border border-mv-amber/40 flex items-center justify-center mx-auto text-mv-amber">
          <Clock className="w-7 h-7" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-mv-ink font-display">
            Compte en Attente
          </h1>
          <p className="text-sm text-mv-ink-soft leading-relaxed">
            Votre compte <span className="font-bold text-mv-ink">Minerva Trequartista</span> a bien été créé.
            Un administrateur doit approuver votre accès avant de pouvoir vous connecter.
          </p>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-xl bg-mv-amber/5 border border-mv-amber/20 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-mv-amber uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Processus d&apos;Approbation
          </div>
          <ol className="space-y-2 text-xs text-mv-ink-soft">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-mv-green text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
              <span>Compte créé avec succès (@minervaflow.com)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-mv-amber/30 text-mv-amber flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
              <span className="font-semibold text-mv-ink">En attente de validation par un Admin Minerva</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-mv-border text-mv-ink-faint flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
              <span>Accès complet à l'application</span>
            </li>
          </ol>
        </div>

        {/* Contact */}
        <div className="flex items-center justify-center gap-2 text-xs text-mv-ink-soft">
          <Mail className="w-3.5 h-3.5 text-mv-green" />
          <span>Contactez votre admin :</span>
          <a href="mailto:admin@minervaflow.com" className="font-bold text-mv-green hover:underline">
            admin@minervaflow.com
          </a>
        </div>

        {/* Back Link */}
        <Link
          href="/login"
          className="block text-xs text-mv-ink-mute hover:text-mv-ink transition-colors"
        >
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
