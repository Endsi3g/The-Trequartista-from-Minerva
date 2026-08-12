'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  Send,
  FileCheck,
  FilePlus,
  Crown,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { fetchProjects, fetchClients } from '@/lib/services/supabase-data';
import type { Project, Client } from '@/lib/types';

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('Joe');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Joe';
          const firstName = rawName.split(/[\s._-]/)[0];
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
        }

        const [projData, clientData] = await Promise.all([fetchProjects(), fetchClients()]);
        setProjects(projData);
        setClients(clientData);
      } catch (err) {
        console.warn('[Overview] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── Dynamic Greeting Header (Image 2) ── */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-mv-ink-soft">{todayDateStr}</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-mv-ink tracking-tight font-display">
          {getGreetingPrefix()}, {userName}.
        </h1>
      </div>

      {/* ── Main 2-Column Grid (Image 2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Timeline Card (Image 2) */}
          <div className="bg-white border border-mv-border rounded-2xl p-6 shadow-mv-sm">
            <h2 className="text-lg font-bold text-mv-ink mb-4 font-display">Project Timeline</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-4 w-1/3">Project</th>
                    <th className="py-3 px-4 text-center">Jan 31</th>
                    <th className="py-3 px-4 text-center text-mv-ink font-extrabold">Today</th>
                    <th className="py-3 px-4 text-center">Feb 28</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mv-border/60">
                  {/* Row 1 */}
                  <tr className="hover:bg-mv-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-mv-ink">Consulting Project</td>
                    <td colSpan={3} className="py-3.5 px-4 relative">
                      <div className="h-1.5 bg-mv-surface rounded-full w-full relative">
                        <div className="absolute left-[15%] right-[25%] top-0 bottom-0 bg-mv-border/80 rounded-full" />
                      </div>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-mv-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-mv-ink">Design Project with...</td>
                    <td colSpan={3} className="py-3.5 px-4 relative">
                      <div className="h-1.5 bg-mv-surface rounded-full w-full relative flex items-center">
                        <div className="absolute left-[30%] right-[10%] top-0 bottom-0 bg-mv-border/80 rounded-full" />
                        <div className="absolute left-[45%] flex items-center -space-x-1.5">
                          <span className="w-6 h-6 rounded-full bg-mv-green text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                            JS
                          </span>
                          <span className="w-6 h-6 rounded-full bg-mv-ink text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                            AT
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-mv-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-mv-ink">Rebranding Project</td>
                    <td colSpan={3} className="py-3.5 px-4 relative">
                      <div className="h-1.5 bg-mv-surface rounded-full w-full relative flex items-center">
                        <div className="absolute left-[10%] right-[40%] top-0 bottom-0 bg-mv-border/80 rounded-full" />
                        <div className="absolute left-[47%] flex items-center">
                          <span className="w-6 h-6 rounded-full bg-mv-ink-soft text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                            <Lock className="w-3 h-3 text-white" />
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Profit & Loss Chart Card (Image 2) */}
          <div className="bg-white border border-mv-border rounded-2xl p-6 shadow-mv-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-mv-ink font-display">Profit & Loss</h2>
              <div className="flex items-center gap-3">
                <button className="px-3 py-1 bg-mv-surface border border-mv-border rounded-full text-xs font-bold text-mv-ink flex items-center gap-1">
                  <span>USD</span>
                  <ChevronDown className="w-3 h-3 text-mv-ink-soft" />
                </button>
                <button className="px-3 py-1 bg-mv-surface border border-mv-border rounded-full text-xs font-bold text-mv-ink flex items-center gap-1">
                  <span>Last 6 Months</span>
                  <ChevronDown className="w-3 h-3 text-mv-ink-soft" />
                </button>
              </div>
            </div>

            {/* Tri-Color Curve Chart SVG matching Image 2 */}
            <div className="w-full h-48 relative pt-4">
              <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                {/* Horizontal Baseline */}
                <line x1="0" y1="120" x2="500" y2="120" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Green Line (Top / Rising) */}
                <path
                  d="M 20 120 C 120 120, 160 30, 210 30 C 260 30, 280 90, 320 90 C 370 90, 420 70, 480 75"
                  fill="none"
                  stroke="#00a800"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Dark Charcoal Line (Middle / Stable) */}
                <path
                  d="M 20 120 C 120 120, 160 65, 210 65 C 260 65, 280 110, 320 110 C 370 110, 420 95, 480 100"
                  fill="none"
                  stroke="#242424"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Amber/Gold Line (Bottom / Dipping) */}
                <path
                  d="M 20 120 C 120 120, 160 145, 210 145 C 260 145, 280 130, 320 130 C 370 130, 420 135, 480 135"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col wide) */}
        <div className="space-y-8">
          {/* Quick Actions 2x2 Grid (Image 2) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Action 1 */}
            <Link
              href="/clients"
              className="bg-white border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-[#00a800] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-xs font-bold text-mv-ink">Send an invoice</span>
            </Link>

            {/* Action 2 */}
            <Link
              href="/leads"
              className="bg-white border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-[#00a800] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-xs font-bold text-mv-ink">Draft a proposal</span>
            </Link>

            {/* Action 3 */}
            <Link
              href="/projects"
              className="bg-white border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-[#00a800] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-xs font-bold text-mv-ink">Create a contract</span>
            </Link>

            {/* Action 4 */}
            <Link
              href="/academy"
              className="bg-white border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-[#00a800] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FilePlus className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-xs font-bold text-mv-ink">Add a form</span>
            </Link>
          </div>

          {/* Workflow Plus Promo Card (Image 2) */}
          <div className="bg-white border border-mv-border rounded-2xl p-6 relative overflow-hidden shadow-mv-sm flex flex-col justify-between min-h-[220px]">
            <div className="space-y-3 z-10 relative pr-12">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-lg font-extrabold text-mv-ink font-display">Workflow Plus</h3>
              </div>
              <p className="text-xs text-mv-ink-soft leading-relaxed">
                Try out automations, white labeling, forms, client portal, and much more.
              </p>
            </div>

            <div className="z-10 relative pt-6">
              <Link
                href="/settings/billing"
                className="text-xs font-extrabold text-[#00a800] hover:underline tracking-wide uppercase flex items-center gap-1"
              >
                <span>START 14-DAY FREE TRIAL →</span>
              </Link>
            </div>

            {/* Green Leaf Graphic in bottom right corner (Image 2) */}
            <div className="absolute bottom-0 right-0 z-0 pointer-events-none select-none">
              <Image src="/workflow-leaf.svg" alt="Leaf" width={100} height={80} className="w-24 h-20 object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
