"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronDown, ChevronUp } from "lucide-react";

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
      color: "bg-blue-100 text-blue-800",
    });
  }
  if (typeCount["근무시간 외"]) {
    stats.push({
      key: "type_outside",
      label: "근무시간 외",
      value: `${typeCount["근무시간 외"]}개`,
      color: "bg-purple-100 text-purple-800",
    });
  }
  if (typeCount["주말"]) {
    stats.push({
      key: "type_weekend",
      label: "주말",
      value: `${typeCount["주말"]}개`,
      color: "bg-green-100 text-green-800",
    });
  }
  if (typeCount["휴일"]) {
    stats.push({
      key: "type_holiday",
      label: "휴일",
      value: `${typeCount["휴일"]}개`,
      color: "bg-orange-100 text-orange-800",
    });
  }

  // 상태별 통계
  Object.entries(statusCount).forEach(([status, count]) => {
    stats.push({
      key: `status_${status}`,
      label: status,
      value: `${count}개`,
      color: "bg-gray-100 text-gray-800",
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
    <Card className="p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-md font-semibold">당일 통계</h3>
          <Badge variant="outline">{formattedDate}</Badge>
          {staffName && <Badge variant="secondary">{staffName}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {hiddenStats.size > 0 && (
            <Button variant="ghost" size="sm" onClick={showAllStats}>
              모두 보기 ({hiddenStats.size})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleStats.map((stat) => (
            <div
              key={stat.key}
              className={`p-3 rounded-lg border relative group ${stat.color || "bg-gray-50"}`}
            >
              <button
                onClick={() => hideStat(stat.key)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="이 통계 숨기기"
              >
                <X className="h-3 w-3 text-gray-500 hover:text-gray-700" />
              </button>
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-lg font-semibold">{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
