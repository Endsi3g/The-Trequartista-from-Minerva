'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, Send, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { submitUserFeedback } from '@/lib/services/supabase-data';

export function UserFeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<'Bug' | 'Idée Fonctionnalité' | 'Général'>('Général');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toastSuccess, toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await submitUserFeedback({
        rating,
        category,
        message,
        user_name: 'Équipe Minerva',
        user_email: 'team@minervaflow.com',
      });

      if (res) {
        toastSuccess('Feedback envoyé !', 'Merci pour votre retour, il a été enregistré dans Supabase.');
        setIsOpen(false);
        setMessage('');
        setRating(5);
      } else {
        toastError('Erreur', 'Impossible d’enregistrer le feedback.');
      }
    } catch {
      toastError('Erreur réseau', 'Veuillez réessayer plus tard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 left-5 z-40 px-3.5 py-2 rounded-full bg-mv-ink text-mv-surface border border-mv-border/20 shadow-mv-lg flex items-center gap-2 hover:bg-mv-green transition-all cursor-pointer text-xs font-extrabold group"
        title="Donner votre avis ou signaler un bug"
      >
        <MessageSquare className="w-4 h-4 text-mv-warm group-hover:text-white transition-colors" />
        <span>💬 Feedback</span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-mv-lg animate-mv-scale-in">
            <div className="flex items-center justify-between border-b border-mv-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-mv-green" />
                <h3 className="text-base font-extrabold text-mv-ink">Votre Feedback Minerva</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="font-bold text-mv-ink">Votre Évaluation de l'App</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'text-mv-amber fill-mv-amber' : 'text-mv-border'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-mv-ink ml-2">{rating} / 5</span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-bold text-mv-ink">Catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Général', 'Bug', 'Idée Fonctionnalité'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-mv-green text-white border-mv-green shadow-mv-sm'
                          : 'bg-mv-cream-soft border-mv-border text-mv-ink-soft hover:text-mv-ink'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="font-bold text-mv-ink">Vos Commentaires & Remarques</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Partagez vos impressions, signalez un bug ou proposez une amélioration..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-mv-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Envoi...' : 'Envoyer Feedback'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
