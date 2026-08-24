'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  Volume2,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface MessageLine {
  id: string;
  sender: 'alex' | 'prospect';
  text: string;
  time: string;
}

const SIMULATED_DIALOGUE: { sender: 'alex' | 'prospect'; text: string; delay: number }[] = [
  {
    sender: 'alex',
    text: "Bonjour ! C'est Alex de chez Minerva. J'ai vu que vous vous intéressiez à la digitalisation de vos commandes sans commission. Est-ce que vous avez 2 minutes ?",
    delay: 1500,
  },
  {
    sender: 'prospect',
    text: "Oui bonjour Alex. Effectivement, UberEats et DoorDash nous prennent près de 30% sur chaque commande, c'est intenable sur nos marges.",
    delay: 4000,
  },
  {
    sender: 'alex',
    text: "C'est exactement le problème qu'on règle. Avec Minerva-Flow, vous gardez 100% de vos marges avec commande directe, QR codes en cuisine et encaissement direct Stripe 0%.",
    delay: 8000,
  },
  {
    sender: 'prospect',
    text: "Et combien de temps prend l'installation en cuisine ? On ne veut pas bloquer le service du midi.",
    delay: 12000,
  },
  {
    sender: 'alex',
    text: "Moins de 14 jours clé en main, et le protocole de formation cuisine se fait en 5 minutes chrono sans changer votre matériel existant.",
    delay: 16000,
  },
  {
    sender: 'prospect',
    text: "Parfait, envoyez-moi une proposition détaillée avec la démo !",
    delay: 20000,
  },
];

interface VoiceSimulationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadConverted?: (leadName: string) => void;
}

export function VoiceSimulationDrawer({ isOpen, onClose, onLeadConverted }: VoiceSimulationDrawerProps) {
  const { toastSuccess, toastInfo } = useToast();
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'completed'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<MessageLine[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setCallState('idle');
      setSeconds(0);
      setMessages([]);
      setIsMuted(false);
    }
  }, [isOpen]);

  const startSimulation = () => {
    setCallState('connecting');
    setSeconds(0);
    setMessages([]);

    setTimeout(() => {
      setCallState('connected');
      toastInfo('Appel connecté', 'Simulation vocale active avec Alex (IA Minerva).');

      // Run dialogue simulation
      SIMULATED_DIALOGUE.forEach((item, index) => {
        setTimeout(() => {
          setCallState((current) => {
            if (current !== 'connected') return current;

            setIsSpeaking(item.sender === 'alex');
            const now = new Date();
            const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${index}-${Date.now()}`,
                sender: item.sender,
                text: item.text,
                time: timeStr,
              },
            ]);

            // If last message, wrap up
            if (index === SIMULATED_DIALOGUE.length - 1) {
              setTimeout(() => {
                setIsSpeaking(false);
              }, 2500);
            }
            return current;
          });
        }, item.delay);
      });
    }, 1200);
  };

  const endCall = () => {
    setCallState('completed');
    setIsSpeaking(false);
    toastSuccess('Appel terminé', 'Analyse IA, scoring de qualification et transcription générés.');
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-zinc-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* ── Drawer Header ── */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900">Assistant Vocal Minerva (Alex)</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Flash v2.5
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Console de test & qualification vocale des leads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Drawer Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-zinc-50/30">

          {/* 1. Waveform / Audio State Strip */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    callState === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : callState === 'connecting'
                      ? 'bg-amber-500 animate-ping'
                      : callState === 'completed'
                      ? 'bg-blue-500'
                      : 'bg-zinc-300'
                  )}
                />
                <span className="text-xs font-semibold text-zinc-900">
                  {callState === 'idle' && 'Prêt pour la simulation'}
                  {callState === 'connecting' && 'Établissement du flux WebRTC…'}
                  {callState === 'connected' && (isSpeaking ? 'Alex parle…' : 'À l’écoute du prospect…')}
                  {callState === 'completed' && 'Appel terminé — Analyse générée'}
                </span>
              </div>

              {callState === 'connected' && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 font-mono text-xs font-bold text-zinc-800" style={MONO}>
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>{formatTimer(seconds)}</span>
                </div>
              )}
            </div>

            {/* Visualizer bars */}
            <div className="h-10 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-center gap-1 px-4 overflow-hidden">
              {[...Array(24)].map((_, i) => {
                const isPulse = callState === 'connected';
                return (
                  <motion.div
                    key={i}
                    animate={
                      isPulse
                        ? {
                            height: isSpeaking ? [8, 28, 12, 32, 14][i % 5] : [4, 10, 6][i % 3],
                            backgroundColor: isSpeaking ? '#059669' : '#10b981',
                          }
                        : { height: 4, backgroundColor: '#e4e4e7' }
                    }
                    transition={{
                      duration: 0.4 + (i % 5) * 0.1,
                      repeat: isPulse ? Infinity : 0,
                      repeatType: 'reverse',
                    }}
                    className="w-1.5 rounded-full"
                  />
                );
              })}
            </div>

            {/* Action buttons inside visualizer card */}
            <div className="pt-2 flex items-center gap-2">
              {callState === 'idle' ? (
                <Button onClick={startSimulation} variant="primary" className="w-full h-8 text-xs font-bold gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Lancer l&apos;appel de qualification
                </Button>
              ) : callState === 'connecting' ? (
                <Button disabled variant="secondary" className="w-full h-8 text-xs">
                  Connexion en cours…
                </Button>
              ) : callState === 'connected' ? (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    variant="secondary"
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5" />}
                    {isMuted ? 'Micro coupé' : 'Micro actif'}
                  </Button>
                  <Button
                    onClick={endCall}
                    variant="danger"
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Raccrocher
                  </Button>
                </div>
              ) : (
                <Button onClick={startSimulation} variant="secondary" className="w-full h-8 text-xs gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Recommencer une simulation
                </Button>
              )}
            </div>
          </div>

          {/* 2. Live Synchronized Verbatim Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Transcription en direct</span>
              <span className="font-mono text-[10px]">{messages.length} répliques</span>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-3.5 min-h-[180px] max-h-[240px] overflow-y-auto space-y-3 shadow-2xs">
              {messages.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-400 space-y-1">
                  <Volume2 className="w-5 h-5 text-zinc-300" />
                  <p className="text-xs">Le verbatim de l&apos;appel apparaîtra ici en temps réel.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAlex = m.sender === 'alex';
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'flex gap-2.5 text-xs',
                        isAlex ? 'items-start' : 'items-start flex-row-reverse'
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                          isAlex ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-800'
                        )}
                      >
                        {isAlex ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      </div>

                      <div
                        className={cn(
                          'p-2.5 rounded-xl max-w-[80%] space-y-1',
                          isAlex
                            ? 'bg-emerald-50/60 border border-emerald-200/60 text-zinc-900 rounded-tl-none'
                            : 'bg-zinc-100 text-zinc-900 rounded-tr-none'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 font-mono" style={MONO}>
                          <span className="font-bold text-zinc-700">{isAlex ? 'Alex (IA)' : 'Prospect (Vous)'}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 3. Post-Call AI Assessment Card (Revealed when completed) */}
          {callState === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-white border border-emerald-200/80 shadow-xs space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Fiche de Qualification IA Post-Appel</span>
                </div>
                <Badge variant="green">Chaud / Prêt à signer</Badge>
              </div>

              {/* Score & Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">Score IA</div>
                  <div className="text-base font-extrabold text-emerald-700 font-mono" style={MONO}>9.2 / 10</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">Urgence</div>
                  <div className="text-xs font-bold text-zinc-900 mt-1">&lt; 14 jours</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <div className="text-[10px] text-zinc-500 uppercase font-semibold">Budget Est.</div>
                  <div className="text-xs font-bold text-zinc-900 mt-1 font-mono" style={MONO}>5 500 $ CAD</div>
                </div>
              </div>

              {/* Objections & Recommendation */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-zinc-700">Objections identifiées :</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10.5px] font-medium border border-zinc-200">
                      Commission 30% plateformes tierces
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10.5px] font-medium border border-zinc-200">
                      Continuité du service cuisine
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-zinc-700">Proposition recommandée :</span>
                  <p className="text-[11.5px] text-zinc-600 mt-0.5 leading-relaxed bg-zinc-50 p-2 rounded border border-zinc-100">
                    Déploiement Minerva-Flow (Commande en ligne directe 0% + Intégration QR Cuisine & Passerelle Stripe).
                  </p>
                </div>
              </div>

              {/* CTA convert */}
              <Button
                onClick={() => {
                  if (onLeadConverted) onLeadConverted('Bistro Le Saint-Sauveur');
                  toastSuccess('Lead qualifié transféré', 'Lead synchronisé avec le CRM et fiche audit générée.');
                  onClose();
                }}
                variant="primary"
                className="w-full h-8 text-xs font-bold gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Convertir en Lead CRM & Générer Audit
              </Button>
            </motion.div>
          )}

        </div>

        {/* ── Drawer Footer ── */}
        <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono text-[10.5px]">Agent : Minerva-Voice-Alex-v2</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
