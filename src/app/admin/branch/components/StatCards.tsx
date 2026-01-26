"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  suffix: string;
  color: string;
  onClick?: () => void;
}

export function StatCard({ icon: Icon, title, value, suffix, color, onClick }: StatCardProps) {
  const iconBgMap: Record<string, string> = {
    'bg-blue-500': 'bg-blue-50 text-blue-500',
    'bg-green-500': 'bg-emerald-50 text-emerald-500',
    'bg-emerald-500': 'bg-emerald-50 text-emerald-500',
    'bg-purple-500': 'bg-purple-50 text-purple-500',
    'bg-indigo-500': 'bg-indigo-50 text-indigo-500',
    'bg-orange-500': 'bg-orange-50 text-orange-500',
    'bg-amber-500': 'bg-amber-50 text-amber-500'
  };

  const iconStyle = iconBgMap[color] || 'bg-slate-50 text-slate-500';

  return (
    <div
      className={`bg-white rounded-[32px] p-8 border border-[var(--border-light)] shadow-sm hover:shadow-toss group transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-8">
        <div className={`${iconStyle} w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="text-[11px] font-extrabold text-[var(--foreground-subtle)] uppercase tracking-[0.25em]">{title}</div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <div className="text-5xl font-extrabold text-[var(--foreground)] tracking-tighter">
          {value.toLocaleString()}
        </div>
        <div className="text-base font-bold text-[var(--foreground-subtle)] tracking-tight ml-1">{suffix}</div>
      </div>
    </div>
  );
}

interface BEPCardProps {
  title: string;
  progress: number;
  target: number;
  icon: LucideIcon;
  onClick?: () => void;
  helpText?: string;
}

export function BEPCard({ title, progress, target, icon: Icon, onClick, helpText }: BEPCardProps) {
  const isAchieved = progress >= 100;

  return (
    <div
      className={`bg-white rounded-[40px] p-10 shadow-sm border border-[var(--border-light)] group transition-all duration-300 hover:shadow-toss ${onClick ? 'cursor-pointer hover:-translate-y-1.5 active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[var(--background-secondary)] rounded-2xl flex items-center justify-center group-hover:bg-[var(--primary-light-hex)] transition-colors shadow-sm">
            <Icon className="w-7 h-7 text-[var(--primary-hex)]" />
          </div>
          <div>
            <h4 className="font-extrabold text-[var(--foreground)] text-2xl tracking-tight flex items-center gap-2">
              {title}
              {helpText && <HelpTooltip content={helpText} />}
            </h4>
            <p className="text-[11px] font-extrabold text-[var(--foreground-subtle)] uppercase tracking-[0.2em] mt-1">Performance Analysis</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-5xl font-extrabold tracking-tighter ${isAchieved ? 'text-emerald-500' : 'text-[var(--primary-hex)]'}`}>
            {Math.round(progress)}<span className="text-2xl ml-1 opacity-40">%</span>
          </span>
        </div>
      </div>

      <div className="relative w-full h-4 bg-[var(--background-secondary)] rounded-full overflow-hidden mb-8 shadow-inner p-0.5">
        <div
          className={`h-full ${isAchieved ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'} transition-all duration-1000 rounded-full relative`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          <div className="absolute top-0 right-0 w-8 h-full bg-white/20 animate-pulse rounded-full"></div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[var(--background-secondary)]/50 p-5 rounded-[24px] border border-[var(--border-light)]">
        <span className="text-sm font-bold text-[var(--foreground-muted)] uppercase tracking-widest">Target Revenue</span>
        <span className="text-lg font-extrabold text-[var(--foreground-secondary)] tracking-tight">{target.toLocaleString()}<span className="text-xs ml-1 opacity-50 font-bold">만원</span></span>
      </div>
    </div>
  );
}

interface QuickLinkCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

export function QuickLinkCard({ title, description, href, icon: Icon, color }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-[32px] p-10 hover:shadow-toss transition-all duration-300 border border-[var(--border-light)] hover:border-[var(--primary-hex)]/30 relative overflow-hidden active:scale-[0.98]"
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <div className={`${color} w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 shadow-sm border transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
            <Icon className="w-8 h-8" />
          </div>
          <h4 className="font-extrabold text-[var(--foreground)] text-2xl tracking-tight mb-2 group-hover:text-[var(--primary-hex)] transition-colors leading-tight">{title}</h4>
          <p className="text-base font-bold text-[var(--foreground-muted)] leading-relaxed tracking-tight">{description}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[var(--background-secondary)] flex items-center justify-center group-hover:bg-[var(--primary-hex)] transition-all duration-300 shadow-sm">
          <ChevronRight className="w-6 h-6 text-[var(--foreground-subtle)] group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}
