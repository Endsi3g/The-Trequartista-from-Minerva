import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col justify-between hover:border-mv-green/40 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-mv-ink-soft uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-mv-green-tint text-mv-green group-hover:scale-110 transition-transform">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-3xl font-extrabold text-mv-ink tracking-tight font-sans">
          {value}
        </div>

        {(change || subtitle) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {change && (
              <span
                className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${
                  changeType === 'positive'
                    ? 'text-mv-green bg-mv-green-tint'
                    : changeType === 'negative'
                    ? 'text-mv-red bg-mv-red-bg'
                    : 'text-mv-ink-soft bg-mv-cream-soft'
                }`}
              >
                {changeType === 'positive' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                {changeType === 'negative' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {change}
              </span>
            )}
            {subtitle && <span className="text-mv-ink-soft">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
