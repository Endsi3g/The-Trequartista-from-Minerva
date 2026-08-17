import { cn } from '@/lib/utils';

/**
 * Slow-drifting organic gradient blobs for the auth screens' dark panel.
 * Pure CSS (Tailwind keyframes) -- no canvas/JS, so it renders on the server
 * and costs nothing on the client. Respects prefers-reduced-motion.
 */
export function AnimatedMeshBackground({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-mv-green-darker', className)}>
      <div
        className="absolute -left-1/4 -top-1/4 h-[70%] w-[70%] rounded-full blur-3xl animate-mv-mesh-drift-1 motion-reduce:animate-none"
        style={{ background: 'radial-gradient(circle, #059669 0%, rgba(5,150,105,0) 70%)', opacity: 0.55 }}
      />
      <div
        className="absolute -right-1/4 -bottom-1/4 h-[75%] w-[75%] rounded-full blur-3xl animate-mv-mesh-drift-2 motion-reduce:animate-none"
        style={{ background: 'radial-gradient(circle, #a7f3d0 0%, rgba(167,243,208,0) 70%)', opacity: 0.28 }}
      />
      <div
        className="absolute left-1/3 top-1/2 h-[55%] w-[55%] rounded-full blur-3xl animate-mv-mesh-drift-3 motion-reduce:animate-none"
        style={{ background: 'radial-gradient(circle, #2563eb 0%, rgba(37,99,235,0) 70%)', opacity: 0.18 }}
      />
    </div>
  );
}
