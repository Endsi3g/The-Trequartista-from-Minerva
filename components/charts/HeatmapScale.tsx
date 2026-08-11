import React from 'react';

interface HeatmapScaleProps {
  level: 1 | 2 | 3 | 4 | 5;
  label?: string;
}

export function HeatmapScale({ level, label }: HeatmapScaleProps) {
  const levels = [1, 2, 3, 4, 5] as const;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-mv-ink-soft">{label}</span>}
      <div className="flex items-center gap-1.5">
        {levels.map((lvl) => {
          const isActive = lvl <= level;
          const bgColors = {
            1: 'bg-mv-heat-1',
            2: 'bg-mv-heat-2',
            3: 'bg-mv-heat-3',
            4: 'bg-mv-heat-4',
            5: 'bg-mv-heat-5',
          };

          return (
            <div
              key={lvl}
              className={`h-3 flex-1 rounded-sm transition-all duration-300 ${
                isActive ? bgColors[lvl] : 'bg-mv-border/40 opacity-40'
              }`}
              title={`Intensité Niveau ${lvl}`}
            />
          );
        })}
      </div>
    </div>
  );
}
