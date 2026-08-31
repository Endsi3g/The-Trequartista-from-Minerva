import { useState, useRef, useCallback } from 'react';
import type { NotionAiStreamRequest } from '@/lib/services/ai-stream';

export interface UseNotionAiStreamReturn {
  streamText: string;
  isStreaming: boolean;
  error: string | null;
  startStream: (req: NotionAiStreamRequest, onDone?: (finalText: string) => void) => Promise<string>;
  stopStream: () => void;
  resetStream: () => void;
}

export function useNotionAiStream(): UseNotionAiStreamReturn {
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const resetStream = useCallback(() => {
    stopStream();
    setStreamText('');
    setError(null);
  }, [stopStream]);

  const startStream = useCallback(
    async (req: NotionAiStreamRequest, onDone?: (finalText: string) => void): Promise<string> => {
      stopStream();
      setStreamText('');
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulated = '';

      try {
        const response = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error || `Erreur serveur (${response.status})`;
          setError(errMsg);
          setIsStreaming(false);
          return '';
        }

        if (!response.body) {
          setError('Flux de réponse non disponible.');
          setIsStreaming(false);
          return '';
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.replace(/^data:\s*/, '');
              try {
                const data = JSON.parse(jsonStr);
                if (data.error) {
                  setError(data.error);
                } else if (data.text) {
                  accumulated += data.text;
                  setStreamText(accumulated);
                }
                if (data.done) {
                  break;
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }

        setIsStreaming(false);
        if (onDone) {
          onDone(accumulated);
        }
        return accumulated;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Normal abort
          setIsStreaming(false);
          return accumulated;
        }
        const msg = err instanceof Error ? err.message : 'Erreur de connexion IA.';
        setError(msg);
        setIsStreaming(false);
        return '';
      }
    },
    [stopStream]
  );

  return {
    streamText,
    isStreaming,
    error,
    startStream,
    stopStream,
    resetStream,
  };
}
