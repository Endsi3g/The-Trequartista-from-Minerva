import React from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon-512.png"
      alt="Minerva"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
      className={className}
    />
  );
}

interface LogoProps {
  size?: number;
  collapsed?: boolean;
}

export function Logo({ size = 30, collapsed = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      <LogoMark size={size} />
      {!collapsed && (
        <div className="flex flex-col whitespace-nowrap leading-tight">
          <span className="font-extrabold text-sm tracking-tight text-mv-ink font-display">
            MINERVA{' '}
            <span className="text-mv-green">TREQUARTISTA</span>
          </span>
          <span className="text-[10px] font-semibold text-mv-ink-faint tracking-widest uppercase">
            Internal Suite
          </span>
        </div>
      )}
    </div>
  );
}
