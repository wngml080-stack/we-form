"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp, BarChart3, Clock, Calendar } from "lucide-react";

interface Schedule {
  id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  schedule_type?: string | null;
  status?: string | null;
}

interface DailyStatsWidgetProps {
  selectedDate: string; // "YYYY-MM-DD"
  schedules: Schedule[];
  staffName?: string;
}

interface StatItem {
  key: string;
  label: string;
  value: string | number;
  color?: string;
}

function calculateDailyStats(date: string, schedules: Schedule[]): StatItem[] {
  const dateStr = date.split("T")[0];
  const daySchedules = schedules.filter((s) => {
    const scheduleDate = s.start_time.split("T")[0];
    return scheduleDate === dateStr;
  });

  if (daySchedules.length === 0) {
    return [];
  }

  const stats: StatItem[] = [];

  // 스케줄 타입별 카운트
  const typeCount: Record<string, number> = {};
  const statusCount: Record<string, number> = {};
  let totalMinutes = 0;

  daySchedules.forEach((schedule) => {
    const type = schedule.schedule_type || "기타";
    const status = schedule.status || "미정";
    typeCount[type] = (typeCount[type] || 0) + 1;
    statusCount[status] = (statusCount[status] || 0) + 1;

    const start = new Date(schedule.start_time);
    const end = new Date(schedule.end_time);
    const diffMs = end.getTime() - start.getTime();
    totalMinutes += diffMs / (1000 * 60);
  });

  // 총 스케줄 수
  stats.push({
    key: "total_count",
    label: "총 스케줄",
    value: `${daySchedules.length}개`,
  });

  // 총 근무시간
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  stats.push({
    key: "total_hours",
    label: "총 시간",
    value: `${hours}시간 ${minutes}분`,
  });

  // 타입별 통계
  if (typeCount["근무시간 내"]) {
    stats.push({
      key: "type_inside",
      label: "근무시간 내",
      value: `${typeCount["근무시간 내"]}개`,
      color: "bg-blue-50 text-blue-700",
    });
  }
  if (typeCount["근무시간 외"]) {
    stats.push({
      key: "type_outside",
      label: "근무시간 외",
      value: `${typeCount["근무시간 외"]}개`,
      color: "bg-purple-50 text-purple-700",
    });
  }
  if (typeCount["주말"]) {
    stats.push({
      key: "type_weekend",
      label: "주말",
      value: `${typeCount["주말"]}개`,
      color: "bg-emerald-50 text-emerald-700",
    });
  }
  if (typeCount["휴일"]) {
    stats.push({
      key: "type_holiday",
      label: "휴일",
      value: `${typeCount["휴일"]}개`,
      color: "bg-rose-50 text-rose-700",
    });
  }

  // 상태별 통계
  Object.entries(statusCount).forEach(([status, count]) => {
    stats.push({
      key: `status_${status}`,
      label: status,
      value: `${count}개`,
      color: "bg-slate-50 text-slate-700",
    });
  });

  return stats;
}

export function DailyStatsWidget({ selectedDate, schedules, staffName }: DailyStatsWidgetProps) {
  const [hiddenStats, setHiddenStats] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  const stats = calculateDailyStats(selectedDate, schedules);
  const visibleStats = stats.filter((stat) => !hiddenStats.has(stat.key));

  const hideStat = (key: string) => {
    setHiddenStats((prev) => new Set([...prev, key]));
  };

  const showAllStats = () => {
    setHiddenStats(new Set());
  };

  if (stats.length === 0) {
    return null;
  }

  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Card className="p-6 mt-6 bg-white/50 backdrop-blur-md border-slate-100 rounded-[32px] shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">당일 운영 통계</h3>
              {staffName && <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase tracking-widest">{staffName} 코치</Badge>}
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hiddenStats.size > 0 && (
            <Button variant="ghost" size="sm" onClick={showAllStats} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-xl px-3">
              모두 보기 ({hiddenStats.size})
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="w-10 h-10 rounded-xl hover:bg-slate-100 transition-all">
            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleStats.map((stat) => (
            <div
              key={stat.key}
              className={`p-5 rounded-[24px] border border-transparent transition-all group relative overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] ${stat.color || "bg-slate-50 hover:bg-white hover:border-slate-100"}`}
            >
              <button
                onClick={() => hideStat(stat.key)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 rounded-full z-10"
                title="이 통계 숨기기"
              >
                <X className="h-3 w-3 text-slate-500" />
              </button>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
              <div className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</div>
              
              {/* Subtle background icon for the first two stats */}
              {(stat.key === 'total_count' || stat.key === 'total_hours') && (
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  {stat.key === 'total_count' ? <Calendar className="w-16 h-16" /> : <Clock className="w-16 h-16" />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
