"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const bgColorMap: Record<string, string> = {
    'bg-blue-500': 'bg-white shadow-blue-100/50',
    'bg-green-500': 'bg-white shadow-emerald-100/50',
    'bg-emerald-500': 'bg-white shadow-emerald-100/50',
    'bg-purple-500': 'bg-white shadow-indigo-100/50',
    'bg-indigo-500': 'bg-white shadow-indigo-100/50',
    'bg-orange-500': 'bg-white shadow-amber-100/50',
    'bg-amber-500': 'bg-white shadow-amber-100/50'
  };

  const iconBgMap: Record<string, string> = {
    'bg-blue-500': 'bg-blue-50 text-blue-600',
    'bg-green-500': 'bg-emerald-50 text-emerald-600',
    'bg-emerald-500': 'bg-emerald-50 text-emerald-600',
    'bg-purple-500': 'bg-indigo-50 text-indigo-600',
    'bg-indigo-500': 'bg-indigo-50 text-indigo-600',
    'bg-orange-500': 'bg-amber-50 text-amber-600',
    'bg-amber-500': 'bg-amber-50 text-amber-600'
  };

  const cardShadow = bgColorMap[color] || 'bg-white shadow-slate-100/50';
  const iconStyle = iconBgMap[color] || 'bg-slate-50 text-slate-600';

  return (
    <div
      className={`bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl ${cardShadow} group transition-all duration-500 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`${iconStyle} w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <div className="text-4xl font-black text-slate-900 tracking-tighter">
          {value.toLocaleString()}
        </div>
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">{suffix}</div>
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
      className={`bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100/50 border border-gray-100 group transition-all duration-500 hover:shadow-2xl ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <Icon className="w-6 h-6 text-[#2F80ED]" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-2">
              {title}
              {helpText && <HelpTooltip content={helpText} />}
            </h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Performance Analysis</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-black tracking-tighter ${isAchieved ? 'text-emerald-500' : 'text-[#2F80ED]'}`}>
            {Math.round(progress)}<span className="text-xl ml-0.5 opacity-40">%</span>
          </span>
        </div>
      </div>

      <div className="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden mb-6 shadow-inner p-1">
        <div
          className={`h-full ${isAchieved ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-100' : 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg shadow-blue-100'} transition-all duration-1000 rounded-full relative`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          <div className="absolute top-0 right-0 w-4 h-full bg-white/20 animate-pulse"></div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Revenue</span>
        <span className="font-black text-slate-700">{target.toLocaleString()}<span className="text-[10px] ml-1 opacity-50">만원</span></span>
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
      className="group bg-white rounded-[32px] p-8 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 border border-slate-50 hover:border-blue-100 relative overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-150"></div>
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg`}>
            <Icon className="w-7 h-7" />
          </div>
          <h4 className="font-black text-slate-900 text-xl tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{title}</h4>
          <p className="text-sm font-bold text-slate-400 leading-relaxed">{description}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500">
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}
