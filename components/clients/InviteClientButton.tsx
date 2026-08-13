'use client';

import React, { useState } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { createClientInvite } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';

export function InviteClientButton({ clientId }: { clientId: string }) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toastSuccess, toastError } = useToast();

  const handleInvite = async () => {
    setGenerating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setGenerating(false);
      return;
    }

    const invite = await createClientInvite(clientId, user.id);
    setGenerating(false);

    if (!invite) {
      toastError('Erreur', "Impossible de générer le lien d'invitation.");
      return;
    }

    const url = `${window.location.origin}/portal/join?token=${invite.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toastSuccess('Lien copié', 'Envoyez-le à votre client — valide 14 jours.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleInvite} disabled={generating} icon={copied ? <Check className="w-3.5 h-3.5 text-mv-green" /> : <UserPlus className="w-3.5 h-3.5" />}>
      {generating ? 'Génération…' : copied ? 'Lien copié' : 'Inviter au portail'}
    </Button>
  );
}
