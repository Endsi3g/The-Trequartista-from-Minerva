'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Mic, MicOff, PhoneOff, Loader2, Volume2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

function VoiceAgentPanel() {
  const { toastError } = useToast();
  const [starting, setStarting] = useState(false);
  const conversation = useConversation({
    onError: (message) => toastError('Erreur agent vocal', typeof message === 'string' ? message : 'Erreur inconnue.'),
  });

  const isActive = conversation.status === 'connected' || conversation.status === 'connecting';

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/voice/conversation-token');
      const data = await res.json();
      if (!res.ok || !data.token) {
        toastError('Agent vocal indisponible', data.error || 'Impossible de démarrer la session.');
        return;
      }
      conversation.startSession({ conversationToken: data.token, connectionType: 'webrtc' });
    } catch {
      toastError('Erreur réseau', "Impossible de contacter le serveur.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-mv-ink">Assistant vocal Minerva (Alex)</h3>
          <p className="text-xs text-mv-ink-soft mt-0.5">
            Teste en direct l&apos;agent de qualification vocal utilisé pour les appels entrants.
          </p>
        </div>
        <div className="relative shrink-0">
          <motion.div
            animate={
              conversation.isSpeaking
                ? { scale: [1, 1.15, 1] }
                : conversation.isListening
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 1, repeat: conversation.isSpeaking || conversation.isListening ? Infinity : 0 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
              isActive ? 'bg-mv-green-tint border-mv-green text-mv-green' : 'bg-mv-cream-soft border-mv-border text-mv-ink-faint'
            }`}
          >
            <Volume2 className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-mv-ink-soft">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mv-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-mv-green" />
              </span>
              {conversation.status === 'connecting'
                ? 'Connexion…'
                : conversation.isSpeaking
                ? 'Alex parle…'
                : conversation.isListening
                ? "À l'écoute…"
                : 'En conversation'}
            </div>
            {conversation.message && (
              <p className="text-xs text-mv-ink bg-mv-cream-soft rounded-lg p-3 leading-relaxed">{conversation.message}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => conversation.setMuted(!conversation.isMuted)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/40 transition-colors"
              >
                {conversation.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {conversation.isMuted ? 'Micro coupé' : 'Micro actif'}
              </button>
              <button
                onClick={() => conversation.endSession()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mv-red-bg border border-mv-red/30 text-xs font-bold text-mv-red hover:bg-mv-red/10 transition-colors"
              >
                <PhoneOff className="w-3.5 h-3.5" /> Terminer
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleStart}
            disabled={starting}
            className="w-full py-3 rounded-xl bg-mv-green hover:bg-mv-green-dark text-white text-sm font-bold shadow-mv-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            {starting ? 'Connexion…' : "Démarrer l'appel test"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MinervaVoiceAgent() {
  return (
    <ConversationProvider>
      <VoiceAgentPanel />
    </ConversationProvider>
  );
}
