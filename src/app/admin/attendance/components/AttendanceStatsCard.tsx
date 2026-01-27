"use client";

import { CheckCircle2, XCircle, Clock, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttendanceStats } from "../hooks/useAttendanceData";

interface AttendanceStatsCardProps {
  stats: AttendanceStats;
}

export function AttendanceStatsCard({ stats }: AttendanceStatsCardProps) {
  const statItems = [
    {
      label: "전체",
      value: stats.total,
      icon: Users,
      color: "text-slate-700",
      bgColor: "bg-slate-100",
    },
    {
      label: "출석완료",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "노쇼",
      value: stats.noShow,
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
    {
      label: "대기",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "서비스",
      value: stats.service,
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const attendanceRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* 통계 아이템들 */}
      <div className="flex flex-wrap gap-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl",
              item.bgColor
            )}
          >
            <item.icon className={cn("w-4 h-4", item.color)} />
            <span className="text-sm font-medium text-slate-600">{item.label}</span>
            <span className={cn("text-lg font-bold", item.color)}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* 출석률 */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right">
          <div className="text-xs font-medium text-slate-500">출석률</div>
          <div className="text-2xl font-black text-slate-900">{attendanceRate}%</div>
        </div>
        <div className="w-16 h-16 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={attendanceRate >= 80 ? "#10b981" : attendanceRate >= 50 ? "#f59e0b" : "#ef4444"}
              strokeWidth="3"
              strokeDasharray={`${attendanceRate} 100`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
