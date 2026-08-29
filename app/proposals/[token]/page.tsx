'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Download,
  AlertCircle,
  Lock,
  ExternalLink,
  Calendar,
  PenTool,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchProposalByToken } from '@/lib/services/proposals';
import type { CommercialProposal } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function PublicProposalPage() {
  const params = useParams();
  const token = params?.token as string;
  const { toastSuccess, toastError } = useToast();

  const [proposal, setProposal] = useState<CommercialProposal | null>(null);
  const [loading, setLoading] = useState(true);

  // Signature state
  const [signerName, setSignerName] = useState('');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/proposals/${token}`);
        if (res.ok) {
          const data = await res.json();
          setProposal(data.proposal);
          if (data.proposal?.status === 'signed' || data.proposal?.status === 'paid') {
            setSignedSuccess(true);
          }
        } else {
          const fallback = await fetchProposalByToken(token);
          setProposal(fallback);
          if (fallback?.status === 'signed') setSignedSuccess(true);
        }
      } catch {
        const fallback = await fetchProposalByToken(token);
        setProposal(fallback);
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#059669'; // Emerald
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      toastError('Nom requis', 'Veuillez saisir votre nom complet.');
      return;
    }
    if (!agreedTerms) {
      toastError('Conditions', 'Veuillez accepter les conditions de la proposition.');
      return;
    }

    let signatureDataUrl = '';
    if (signatureMode === 'draw' && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL();
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signatureDataUrl,
        }),
      });

      if (res.ok) {
        setSubmitting(false);
        setSignedSuccess(true);
        toastSuccess('Proposition signée !', 'Votre acceptation et acompte ont été validés avec succès.');
      } else {
        setSubmitting(false);
        toastError('Erreur', 'Impossible de valider la signature.');
      }
    } catch {
      setSubmitting(false);
      toastError('Erreur réseau', 'Échec de transmission de la signature.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mv-cream p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-mv-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-mv-ink-soft">Chargement de votre proposition commerciale…</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-mv-cream p-8 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4 bg-mv-surface border-mv-border shadow-mv-md">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-mv-ink">Proposition Introuvable</h2>
          <p className="text-xs text-mv-ink-soft">Ce lien de proposition est invalide ou a expiré.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mv-cream text-mv-ink font-sans pb-24">
      {/* ── Public Brand Header ── */}
      <header className="border-b border-mv-border bg-mv-surface/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mv-green flex items-center justify-center text-white shadow-sm font-bold text-xs">
              MV
            </div>
            <div>
              <span className="font-extrabold text-sm text-mv-ink tracking-tight font-display block">
                MINERVA STUDIO & FLOW
              </span>
              <span className="text-[10px] text-mv-ink-soft uppercase tracking-wider font-semibold">
                Proposition Commerciale Officielle • {proposal.proposal_number}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={signedSuccess ? 'green' : 'amber'}>
              {signedSuccess ? '● Proposition Signée' : '● En Attente de Signature'}
            </Badge>
          </div>
        </div>
      </header>

      {/* ── Main Document Container ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Proposal Header Card */}
        <Card className="p-6 sm:p-8 bg-mv-surface border-mv-border shadow-mv-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-mv-border pb-6">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-mv-green uppercase tracking-wider">
                Proposition de Prestation & Partenariat
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-mv-ink font-display">
                {proposal.title}
              </h1>
              <p className="text-xs text-mv-ink-soft">
                Préparé pour : <strong className="text-mv-ink font-semibold">{proposal.client_name}</strong>
                {proposal.client_company ? ` • ${proposal.client_company}` : ''}
              </p>
            </div>

            <div className="bg-mv-cream-soft p-4 rounded-xl border border-mv-border text-right shrink-0">
              <span className="text-[10.5px] uppercase font-bold text-mv-ink-soft block">Montant Total TTC</span>
              <div className="font-mono text-2xl font-extrabold text-mv-green" style={MONO}>
                {proposal.total_setup_cad.toLocaleString('fr-CA')} $
              </div>
              <span className="text-[10.5px] text-mv-ink-faint block mt-0.5">
                Acompte 50% : {proposal.deposit_amount_cad.toLocaleString('fr-CA')} $
              </span>
            </div>
          </div>

          {/* Scope & Phases Timeline */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-mv-ink font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-mv-green" />
              <span>Méthodologie & Calendrier de Déploiement</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {proposal.scope_phases.map((phase) => (
                <div
                  key={phase.phase_number}
                  className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-mv-green">Phase 0{phase.phase_number}</span>
                    <span className="text-mv-ink-soft font-mono">{phase.duration_weeks} sem.</span>
                  </div>
                  <h4 className="font-bold text-xs text-mv-ink">{phase.title}</h4>
                  <p className="text-[11.5px] text-mv-ink-soft leading-relaxed">{phase.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables & Pricing Breakdown */}
          <div className="space-y-4 pt-4 border-t border-mv-border">
            <h2 className="text-base font-extrabold text-mv-ink font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Détail des Livrables & Investissement</span>
            </h2>

            <div className="border border-mv-border rounded-xl overflow-hidden divide-y divide-mv-border">
              {proposal.deliverables.map((del, idx) => (
                <div key={idx} className="p-4 bg-mv-surface flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-mv-ink">{del.title}</span>
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                        {del.category}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-mv-ink-soft">{del.description}</p>
                  </div>
                  <span className="font-mono font-bold text-sm text-mv-ink shrink-0" style={MONO}>
                    {del.price_cad.toLocaleString('fr-CA')} $
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary Table */}
            <div className="bg-mv-cream-soft p-5 rounded-xl border border-mv-border space-y-2 text-xs max-w-sm ml-auto">
              <div className="flex justify-between text-mv-ink-soft">
                <span>Sous-total HT :</span>
                <span className="font-mono font-bold text-mv-ink">{proposal.subtotal_setup_cad.toFixed(2)} $ CAD</span>
              </div>
              <div className="flex justify-between text-mv-ink-soft">
                <span>TPS Québec (5%) :</span>
                <span className="font-mono">{proposal.tax_tps_cad.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-mv-ink-soft">
                <span>TVQ Québec (9.975%) :</span>
                <span className="font-mono">{proposal.tax_tvq_cad.toFixed(2)} $</span>
              </div>
              <div className="pt-2 border-t border-mv-border flex justify-between font-extrabold text-sm text-mv-ink">
                <span>Total TTC :</span>
                <span className="font-mono text-mv-green">{proposal.total_setup_cad.toFixed(2)} $ CAD</span>
              </div>
              <div className="pt-1.5 border-t border-emerald-300 flex justify-between font-extrabold text-xs text-emerald-800">
                <span>Acompte 50% à la signature :</span>
                <span className="font-mono">{proposal.deposit_amount_cad.toFixed(2)} $ CAD</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Signature & Payment Box ── */}
        <Card className="p-6 sm:p-8 bg-mv-surface border-mv-green/40 shadow-mv-lg space-y-6">
          <div className="flex items-center justify-between border-b border-mv-border pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-mv-ink font-display flex items-center gap-2">
                <PenTool className="w-5 h-5 text-mv-green" />
                <span>Signature Électronique & Validation</span>
              </h3>
              <p className="text-xs text-mv-ink-soft mt-0.5">
                Signez numériquement cette proposition pour lancer les travaux et activer vos accès.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Horodatage Certifié</span>
            </div>
          </div>

          {signedSuccess ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-lg text-emerald-950 font-display">
                  Proposition Signée & Validée !
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Votre acompte de {proposal.deposit_amount_cad.toLocaleString('fr-CA')} $ CAD a été enregistré et vos prestations sont programmées.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mv-surface border border-mv-border text-mv-ink text-xs font-bold hover:bg-zinc-50 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le Reçu PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignSubmit} className="space-y-6">
              {/* Signer Name Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1">
                    Nom et Prénom du Signataire Autorisé
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean Tremblay"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1">
                    Date & Horodatage
                  </label>
                  <input
                    type="text"
                    disabled
                    value={new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 border border-mv-border text-sm text-zinc-600"
                  />
                </div>
              </div>

              {/* Signature Mode Toggle & Canvas Pad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-mv-ink">Tracé de la signature</label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-mv-green hover:underline cursor-pointer text-xs font-semibold"
                  >
                    Effacer le tracé
                  </button>
                </div>

                <div className="border border-mv-border rounded-xl bg-white p-2 relative overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 bg-white cursor-crosshair touch-none"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-zinc-300 text-xs font-semibold">
                      Signez ici avec votre doigt ou la souris…
                    </div>
                  )}
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-mv-ink cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 accent-mv-green cursor-pointer w-4 h-4"
                />
                <span className="leading-relaxed">
                  Je confirme avoir lu et accepté les conditions de la proposition commerciale, et j'autorise le lancement des travaux avec règlement de l'acompte de 50% ({proposal.deposit_amount_cad.toFixed(2)} $ CAD).
                </span>
              </label>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="w-full justify-center py-3.5 text-sm font-bold bg-mv-green hover:bg-emerald-600 shadow-md"
              >
                {submitting ? (
                  'Validation & Traitement en cours…'
                ) : (
                  <>
                    <span>Signer la Proposition & Payer l'Acompte 50% ({proposal.deposit_amount_cad.toFixed(2)} $)</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
