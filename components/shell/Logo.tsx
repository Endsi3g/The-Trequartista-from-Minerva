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

export function Logo({ size = 28, collapsed = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <LogoMark size={size} className="shrink-0" />
      {!collapsed && (
        <span className="truncate font-extrabold text-[13.5px] tracking-tight text-mv-ink font-display">
          MINERVA <span className="text-mv-green">TREQUARTISTA</span>
        </span>
      )}
    </div>
  );
}
