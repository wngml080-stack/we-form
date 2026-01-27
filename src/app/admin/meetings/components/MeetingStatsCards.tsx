"use client";

import { Calendar, CheckCircle, Clock, Activity } from "lucide-react";
import type { MeetingListItem } from "@/types/meeting";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MeetingStatsCardsProps {
  meetings: MeetingListItem[];
}

export function MeetingStatsCards({ meetings }: MeetingStatsCardsProps) {
  const stats = {
    total: meetings.length,
    scheduled: meetings.filter((m) => m.status === "scheduled").length,
    inProgress: meetings.filter((m) => m.status === "in_progress").length,
    completed: meetings.filter((m) => m.status === "completed").length,
  };

  const cards = [
    {
      label: "전체 회의",
      value: stats.total,
      icon: Calendar,
      color: "text-slate-600",
      bg: "bg-slate-50",
      hoverIcon: "group-hover:bg-slate-600",
    },
    {
      label: "예정",
      value: stats.scheduled,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
      hoverIcon: "group-hover:bg-blue-600",
    },
    {
      label: "진행중",
      value: stats.inProgress,
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-50",
      hoverIcon: "group-hover:bg-amber-600",
    },
    {
      label: "완료",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      hoverIcon: "group-hover:bg-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.label} className="group overflow-hidden rounded-[32px] border-none shadow-sm hover:shadow-toss transition-all duration-500 bg-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest">{card.label}</p>
                <p className={cn("text-3xl font-extrabold tracking-tight", card.color)}>{card.value}<span className="text-sm font-bold ml-1 opacity-60">건</span></p>
              </div>
              <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-500", card.bg, card.color, card.hoverIcon, "group-hover:text-white")}>
                <card.icon className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
