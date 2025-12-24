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
  const bgColorMap: Record<string, string> = {
    'bg-blue-500': 'bg-blue-50',
    'bg-green-500': 'bg-green-50',
    'bg-purple-500': 'bg-purple-50',
    'bg-orange-500': 'bg-orange-50'
  };

  const iconColorMap: Record<string, string> = {
    'bg-blue-500': 'text-blue-600',
    'bg-green-500': 'text-green-600',
    'bg-purple-500': 'text-purple-600',
    'bg-orange-500': 'text-orange-600'
  };

  const cardBgColor = bgColorMap[color] || 'bg-gray-50';
  const iconColor = iconColorMap[color] || 'text-gray-600';

  return (
    <div
      className={`${cardBgColor} rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconColor} p-3 rounded-xl bg-white shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-xs text-gray-500">{title}</div>
      </div>
      <div className="text-3xl md:text-4xl font-bold text-gray-900">
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600 mt-1">{suffix}</div>
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
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#2F80ED]" />
          <h4 className="font-bold text-gray-900">{title}</h4>
          {helpText && <HelpTooltip content={helpText} />}
        </div>
        <span className={`text-2xl font-bold ${isAchieved ? 'text-green-600' : 'text-[#2F80ED]'}`}>
          {Math.round(progress)}%
        </span>
      </div>

      <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${isAchieved ? 'bg-green-500' : 'bg-[#2F80ED]'} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <p className="text-sm text-gray-500">
        목표: <span className="font-semibold text-gray-700">{target.toLocaleString()}만원</span>
      </p>
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
      className="group bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-all border border-gray-100 hover:border-gray-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`${color} p-2 rounded-lg inline-flex mb-3`}>
            <Icon className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </Link>
  );
}
