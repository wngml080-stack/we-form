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
    <Card className="p-8 mt-10 bg-white/40 backdrop-blur-xl border-white/60 rounded-[40px] shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative overflow-hidden group/widget">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[20px] bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-200 group-hover/widget:scale-105 transition-transform duration-500">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">당일 운영 리포트</h3>
              {staffName && (
                <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg shadow-blue-100">
                  {staffName} 코치
                </Badge>
              )}
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hiddenStats.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={showAllStats} 
              className="h-10 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 rounded-xl px-4 border border-blue-100 bg-white/50"
            >
              모두 보기 ({hiddenStats.size})
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="w-12 h-12 rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-90 bg-white/30"
          >
            {isExpanded ? <ChevronUp className="h-6 w-6 text-slate-600" /> : <ChevronDown className="h-6 w-6 text-slate-600" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 relative z-10">
          {visibleStats.map((stat) => (
            <div
              key={stat.key}
              className={`p-6 rounded-[32px] border border-white/60 shadow-sm transition-all group/stat relative overflow-hidden hover:shadow-xl hover:-translate-y-1 ${
                stat.key === 'total_count' ? 'bg-blue-50/50 border-blue-100/50' :
                stat.key === 'total_hours' ? 'bg-indigo-50/50 border-indigo-100/50' :
                stat.color ? `${stat.color.replace('bg-', 'bg-').replace('text-', 'text-')} border-current/5` : 
                "bg-white/60 hover:bg-white"
              }`}
            >
              <button
                onClick={() => hideStat(stat.key)}
                className="absolute top-4 right-4 opacity-0 group-hover/stat:opacity-100 transition-opacity p-2 hover:bg-black/5 rounded-full z-20"
                title="이 통계 숨기기"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
              
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover/stat:text-slate-500 transition-colors">{stat.label}</p>
              <div className="text-2xl font-black text-slate-900 tracking-tightest group-hover/stat:scale-105 origin-left transition-transform duration-500">{stat.value}</div>
              
              {/* Decorative Icons */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover/stat:opacity-[0.08] transition-all duration-700 group-hover/stat:scale-110 group-hover/stat:-rotate-12">
                {stat.key === 'total_count' ? <Calendar className="w-24 h-24" /> : 
                 stat.key === 'total_hours' ? <Clock className="w-24 h-24" /> :
                 <BarChart3 className="w-24 h-24" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
