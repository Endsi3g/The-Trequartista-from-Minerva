'use client';

import React, { useState } from 'react';
import { Camera, Check, Handshake, Users2, Mic } from 'lucide-react';
import { LogoMark } from '@/components/shell/Logo';
import { SECTOR_OPTIONS, CONTACT_PREFERRED_METHOD_OPTIONS } from '@/lib/constants/contacts';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green transition-colors';

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-xs font-bold text-mv-ink mb-1">
      {children}
      {optional && <span className="ml-1.5 font-medium text-mv-ink-faint normal-case">(optionnel)</span>}
    </label>
  );
}

export default function ReseauPage() {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [sector, setSector] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [metAtEvent, setMetAtEvent] = useState('');
  const [metAtLocation, setMetAtLocation] = useState('');
  const [howCanIHelp, setHowCanIHelp] = useState('');
  const [biggestProblem, setBiggestProblem] = useState('');
  const [openToCollaborate, setOpenToCollaborate] = useState<'true' | 'false' | ''>('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('');
  const [hpField, setHpField] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || (!email.trim() && !phone.trim())) {
      setErrorMsg('Le nom et au moins un moyen de vous joindre (courriel ou téléphone) sont requis.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    const form = new FormData();
    form.set('full_name', fullName.trim());
    form.set('company', company.trim());
    form.set('role_title', roleTitle.trim());
    form.set('sector', sector);
    form.set('email', email.trim());
    form.set('phone', phone.trim());
    form.set('linkedin_url', linkedinUrl.trim());
    form.set('instagram_url', instagramUrl.trim());
    form.set('facebook_url', facebookUrl.trim());
    form.set('website_url', websiteUrl.trim());
    form.set('met_at_event', metAtEvent.trim());
    form.set('met_at_location', metAtLocation.trim());
    form.set('how_can_i_help', howCanIHelp.trim());
    form.set('biggest_problem', biggestProblem.trim());
    if (openToCollaborate) form.set('open_to_collaborate', openToCollaborate);
    if (preferredContactMethod) form.set('preferred_contact_method', preferredContactMethod);
    form.set('hp_field', hpField);
    if (photo) form.set('photo', photo);

    try {
      const res = await fetch('/api/network-contacts/submit', { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error || "Impossible d'enregistrer vos informations. Réessayez.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-mv-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4 bg-mv-surface border border-mv-border rounded-2xl p-8 shadow-mv-md">
          <LogoMark size={40} className="mx-auto" />
          <Check className="w-10 h-10 text-mv-green mx-auto" />
          <h1 className="text-xl font-extrabold text-mv-ink font-display">Merci, à bientôt !</h1>
          <p className="text-sm text-mv-ink-soft">
            Vos informations ont bien été ajoutées à notre réseau. On vous recontacte bientôt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mv-cream flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <LogoMark size={40} className="mx-auto" />
          <h1 className="text-xl font-extrabold text-mv-ink text-center tracking-tight font-display mb-1">
            Rejoignez le réseau Minerva
          </h1>
          <p className="text-xs text-mv-ink-soft max-w-sm mx-auto">
            Ajoutez-vous à notre carnet de contacts entrepreneurs : réseautage, aide personnalisée,
            possibilité de meeting ou d&apos;une entrevue pour du contenu Minerva.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-mv-surface border border-mv-border rounded-xl p-3 space-y-1">
            <Handshake className="w-4 h-4 text-mv-green mx-auto" />
            <p className="text-[10.5px] font-semibold text-mv-ink-soft leading-tight">On peut s&apos;aider mutuellement</p>
          </div>
          <div className="bg-mv-surface border border-mv-border rounded-xl p-3 space-y-1">
            <Users2 className="w-4 h-4 text-mv-green mx-auto" />
            <p className="text-[10.5px] font-semibold text-mv-ink-soft leading-tight">Possibilité de meeting</p>
          </div>
          <div className="bg-mv-surface border border-mv-border rounded-xl p-3 space-y-1">
            <Mic className="w-4 h-4 text-mv-green mx-auto" />
            <p className="text-[10.5px] font-semibold text-mv-ink-soft leading-tight">Entrevue Minerva possible</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-mv-red-bg border border-mv-red/30 text-mv-red text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-md">
          {/* Honeypot -- hidden from real visitors, left empty by them */}
          <input
            type="text"
            name="hp_field"
            value={hpField}
            onChange={(e) => setHpField(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Photo */}
          <div className="flex items-center gap-3">
            <label className="relative shrink-0 w-16 h-16 rounded-full bg-mv-cream-soft border border-mv-border flex items-center justify-center overflow-hidden cursor-pointer group">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-5 h-5 text-mv-ink-faint" />
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
            <div className="text-xs text-mv-ink-soft">
              <p className="font-bold text-mv-ink">Photo de profil <span className="font-medium text-mv-ink-faint">(optionnel)</span></p>
              <p>Cliquez sur le cercle pour en ajouter une.</p>
            </div>
          </div>

          {/* Identité */}
          <div className="space-y-3">
            <div>
              <FieldLabel>Nom complet</FieldLabel>
              <input type="text" required autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Marie Tremblay" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel optional>Entreprise</FieldLabel>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
              </div>
              <div>
                <FieldLabel optional>Poste</FieldLabel>
                <input type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <FieldLabel optional>Secteur d&apos;activité</FieldLabel>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className={cn(inputClass, 'cursor-pointer appearance-none')}>
                <option value="">Sélectionner…</option>
                {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Courriel</FieldLabel>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Téléphone</FieldLabel>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="514 555-0100" />
            </div>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint -mt-2">Au moins un des deux est requis.</p>

          {/* Réseaux sociaux */}
          <div>
            <FieldLabel optional>Réseaux sociaux</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="LinkedIn" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Site web / WhatsApp / autre" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Comment on s'est rencontré */}
          <div>
            <FieldLabel optional>Comment nous nous sommes rencontrés</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Événement" value={metAtEvent} onChange={(e) => setMetAtEvent(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Lieu" value={metAtLocation} onChange={(e) => setMetAtLocation(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Réseautage */}
          <div className="space-y-3 pt-1 border-t border-mv-border">
            <p className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest pt-3">Réseautage <span className="font-medium normal-case text-mv-ink-faint">(optionnel)</span></p>
            <div>
              <FieldLabel optional>Comment pourrais-je t&apos;aider ?</FieldLabel>
              <textarea rows={2} value={howCanIHelp} onChange={(e) => setHowCanIHelp(e.target.value)} className={cn(inputClass, 'resize-none')} />
            </div>
            <div>
              <FieldLabel optional>Quel est ton plus gros problème en ce moment ?</FieldLabel>
              <textarea rows={2} value={biggestProblem} onChange={(e) => setBiggestProblem(e.target.value)} className={cn(inputClass, 'resize-none')} />
            </div>
            <div>
              <FieldLabel optional>Prêt à travailler ensemble / réseauter sur de nouvelles idées ?</FieldLabel>
              <div className="flex gap-2">
                {(['true', 'false'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setOpenToCollaborate(openToCollaborate === v ? '' : v)}
                    className={cn(
                      'flex-1 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer',
                      openToCollaborate === v ? 'bg-mv-green text-white border-mv-green' : 'bg-mv-cream-soft border-mv-border text-mv-ink-soft hover:border-mv-green/40'
                    )}
                  >
                    {v === 'true' ? 'Oui' : 'Pas pour l’instant'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel optional>Comment préfères-tu qu&apos;on te recontacte ?</FieldLabel>
              <select
                value={preferredContactMethod}
                onChange={(e) => setPreferredContactMethod(e.target.value)}
                className={cn(inputClass, 'cursor-pointer appearance-none')}
              >
                <option value="">Sélectionner…</option>
                {CONTACT_PREFERRED_METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : 'Rejoindre le réseau'}
          </button>
        </form>
      </div>
    </div>
  );
}
