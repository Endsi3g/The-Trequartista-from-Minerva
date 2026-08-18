'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Utensils,
  TrendingDown,
  DollarSign,
  Send,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Percent,
  Calculator,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  generateRestaurantPitchEmail,
  generateGmailComposeUrl,
  sendEmailViaResend,
} from '@/lib/services/email-service';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function RestaurantMarginAuditCard() {
  const [restaurantName, setRestaurantName] = useState('Trattoria Bella Napoli');
  const [recipientEmail, setRecipientEmail] = useState('direction@bellanapoli.ca');
  const [signatureDish, setSignatureDish] = useState('Pizza Margherita Di Bufala');
  const [dineInPrice, setDineInPrice] = useState(19);
  const [deliveryPrice, setDeliveryPrice] = useState(24.5);
  const [platformCommissionPct, setPlatformCommissionPct] = useState(30);
  const [estimatedMonthlyOrders, setEstimatedMonthlyOrders] = useState(220);

  // States for pitch sending
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculations
  const metrics = useMemo(() => {
    const commissionPerOrder = (deliveryPrice * platformCommissionPct) / 100;
    const netReceived = deliveryPrice - commissionPerOrder;
    const marginLossPerDish = dineInPrice - netReceived;
    const monthlyTotalLoss = commissionPerOrder * estimatedMonthlyOrders;
    const annualTotalLoss = monthlyTotalLoss * 12;

    return {
      commissionPerOrder: commissionPerOrder.toFixed(2),
      netReceived: netReceived.toFixed(2),
      marginLossPerDish: marginLossPerDish.toFixed(2),
      monthlyTotalLoss: Math.round(monthlyTotalLoss).toLocaleString('fr-CA'),
      annualTotalLoss: Math.round(annualTotalLoss).toLocaleString('fr-CA'),
    };
  }, [dineInPrice, deliveryPrice, platformCommissionPct, estimatedMonthlyOrders]);

  const demoUrl = `https://minerva-trequista.vercel.app/minerva-flow?resto=${encodeURIComponent(restaurantName)}&dish=${encodeURIComponent(signatureDish)}`;

  const pitchData = useMemo(() => {
    return generateRestaurantPitchEmail({
      restaurantName,
      signatureDish,
      monthlyLossEstimated: `${metrics.monthlyTotalLoss} $`,
      demoUrl,
    });
  }, [restaurantName, signatureDish, metrics, demoUrl]);

  const handleSendResend = async () => {
    if (!recipientEmail.trim()) return;
    setSending(true);
    const result = await sendEmailViaResend({
      to: recipientEmail.trim(),
      subject: pitchData.subject,
      html: pitchData.html,
      text: pitchData.text,
    });
    setSending(false);
    if (result.success) {
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
    }
  };

  const handleOpenGmail = () => {
    const url = generateGmailComposeUrl({
      to: recipientEmail.trim(),
      subject: pitchData.subject,
      body: pitchData.text,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(pitchData.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">
                Calculateur d’Audit Public — Fuite de Marge Restaurant
              </h2>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold" style={MONO}>
                Zéro Friction Prospect
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Diagnostic instantané basé sur les menus publics (Sur place vs Uber Eats / DoorDash).
            </p>
          </div>
        </div>

        <Link
          href="/minerva-flow"
          className="h-7 px-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
        >
          <span>Voir Démo Minerva-Flow</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Input Grid (Données Publiques) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
            Nom du Restaurant
          </label>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full h-8 px-2.5 mt-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
          />
        </div>

        <div>
          <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
            Email de contact du Restaurateur
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="ex: contact@restaurant.ca"
            className="w-full h-8 px-2.5 mt-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono text-[11.5px]"
            style={MONO}
          />
        </div>

        <div>
          <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
            Plat Signature Repéré
          </label>
          <input
            type="text"
            value={signatureDish}
            onChange={(e) => setSignatureDish(e.target.value)}
            className="w-full h-8 px-2.5 mt-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
            Prix Menu Sur Place ($)
          </label>
          <input
            type="number"
            value={dineInPrice}
            onChange={(e) => setDineInPrice(Number(e.target.value))}
            className="w-full h-8 px-2.5 mt-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono"
            style={MONO}
          />
        </div>

        <div>
          <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
            Prix Majoré Uber Eats / DoorDash ($)
          </label>
          <input
            type="number"
            value={deliveryPrice}
            onChange={(e) => setDeliveryPrice(Number(e.target.value))}
            className="w-full h-8 px-2.5 mt-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono"
            style={MONO}
          />
        </div>

        <div>
          <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
            Volume Mensuel Estimé (Commandes)
          </label>
          <input
            type="number"
            value={estimatedMonthlyOrders}
            onChange={(e) => setEstimatedMonthlyOrders(Number(e.target.value))}
            className="w-full h-8 px-2.5 mt-0.5 bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono"
            style={MONO}
          />
        </div>
      </div>

      {/* Calculated Loss Callout Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/80 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-rose-700 font-semibold" style={MONO}>
            Commission plateforme / plat
          </div>
          <div className="text-lg font-bold font-mono text-rose-900" style={MONO}>
            {metrics.commissionPerOrder} $ <span className="text-xs font-normal text-rose-700">({platformCommissionPct}%)</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-zinc-500" style={MONO}>
            Montant Net Reçu / plat
          </div>
          <div className="text-lg font-bold font-mono text-zinc-900" style={MONO}>
            {metrics.netReceived} $
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-amber-800 font-semibold" style={MONO}>
            Perte Mensuelle Estimée
          </div>
          <div className="text-lg font-bold font-mono text-amber-900" style={MONO}>
            {metrics.monthlyTotalLoss} $ / mois
          </div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 space-y-0.5">
          <div className="text-[10px] font-mono uppercase text-emerald-800 font-semibold" style={MONO}>
            Économie Annuelle (Minerva-Flow)
          </div>
          <div className="text-lg font-bold font-mono text-emerald-800" style={MONO}>
            + {metrics.annualTotalLoss} $ / an
          </div>
        </div>
      </div>

      {/* Generated Pitch Message Preview */}
      <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Script & Message d’Approche Personnalisé (Zéro friction de donnée)</span>
          </div>
          <button
            onClick={handleCopyPitch}
            className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-zinc-200"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
          </button>
        </div>

        <div className="p-3 bg-white rounded border border-zinc-200 font-sans text-zinc-700 whitespace-pre-line leading-relaxed text-[11.5px]">
          {pitchData.text}
        </div>
      </div>

      {/* Action Strip: Resend vs Gmail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {sentSuccess ? (
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pitch d’audit expédié avec succès à {recipientEmail} !</span>
          </div>
        ) : (
          <div className="text-[11px] text-zinc-400 font-mono" style={MONO}>
            Lien démo injecté : <span className="text-zinc-600 truncate">{demoUrl}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenGmail}
            className="h-8 px-3 text-xs font-medium border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 text-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
            <span>Ouvrir dans Gmail</span>
          </button>

          <button
            type="button"
            onClick={handleSendResend}
            disabled={sending || !recipientEmail.trim()}
            className="h-8 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Expédition…' : 'Envoyer par Resend'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
