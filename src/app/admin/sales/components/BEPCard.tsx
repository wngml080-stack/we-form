"use client";

import { LucideIcon } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";

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
