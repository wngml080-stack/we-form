"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  CheckSquare,
  MoreVertical,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MEETING_TYPE_LABELS,
  type MeetingListItem,
  type MeetingStatus,
} from "@/types/meeting";
import { cn } from "@/lib/utils";

interface MeetingsListProps {
  meetings: MeetingListItem[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onMeetingClick: (meetingId: string) => void;
  onStatusChange: (meetingId: string, status: MeetingStatus) => void;
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string; bg: string; border: string; icon: typeof Calendar }> = {
  scheduled: { label: "예정", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: Calendar },
  in_progress: { label: "진행중", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: Clock },
  completed: { label: "완료", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle },
  cancelled: { label: "취소", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100", icon: XCircle },
  postponed: { label: "연기", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: Clock },
};

export function MeetingsList({
  meetings,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onMeetingClick,
  onStatusChange,
}: MeetingsListProps) {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-white rounded-[32px] animate-pulse border border-gray-50 shadow-sm"></div>
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
        <div className="w-20 h-20 rounded-[28px] bg-gray-50 flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-[var(--foreground-subtle)] font-bold text-lg">아직 등록된 회의가 없습니다.</p>
        <p className="text-sm text-slate-400 mt-1">새로운 회의 일정을 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {meetings.map((meeting) => {
          const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
          const StatusIcon = status.icon;

          return (
            <div
              key={meeting.id}
              className="group bg-white rounded-[32px] p-8 border border-gray-50 shadow-sm hover:shadow-toss transition-all duration-500 cursor-pointer"
              onClick={() => onMeetingClick(meeting.id)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-[var(--background-secondary)] flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-lg transition-all">
                    <Calendar className="w-8 h-8 text-[var(--foreground-subtle)]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter", status.bg, status.color, status.border)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {MEETING_TYPE_LABELS[meeting.meeting_type]}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight group-hover:text-[var(--primary-hex)] transition-colors">
                      {meeting.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--foreground-subtle)]" />
                        {format(new Date(meeting.scheduled_at), "M월 d일 (EEE) HH:mm", {
                          locale: ko,
                        })}
                      </span>

                      <div className="w-1 h-1 rounded-full bg-[var(--border)]"></div>

                      {meeting.is_online ? (
                        <span className="flex items-center gap-2 text-blue-600">
                          <Video className="w-4 h-4" />
                          온라인 회의
                        </span>
                      ) : meeting.location ? (
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[var(--foreground-subtle)]" />
                          {meeting.location}
                        </span>
                      ) : null}

                      <div className="w-1 h-1 rounded-full bg-[var(--border)]"></div>

                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--foreground-subtle)]" />
                        {meeting.participant_count}명 참여
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 lg:ml-auto">
                  {meeting.action_item_count > 0 && (
                    <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-emerald-700">Action {meeting.action_item_count}</span>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-12 w-12 rounded-2xl hover:bg-slate-50">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]">
                      {meeting.status === "scheduled" && (
                        <DropdownMenuItem
                          className="rounded-xl py-3 font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(meeting.id, "in_progress");
                          }}
                        >
                          <Play className="w-4 h-4 mr-3 text-blue-500" />
                          회의 시작
                        </DropdownMenuItem>
                      )}
                      {meeting.status === "in_progress" && (
                        <DropdownMenuItem
                          className="rounded-xl py-3 font-bold text-emerald-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(meeting.id, "completed");
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-3" />
                          회의 완료
                        </DropdownMenuItem>
                      )}
                      {meeting.status === "scheduled" && (
                        <>
                          <DropdownMenuSeparator className="bg-slate-50" />
                          <DropdownMenuItem
                            className="rounded-xl py-3 font-bold text-rose-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(meeting.id, "cancelled");
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-3" />
                            회의 취소
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[var(--primary-hex)] group-hover:text-white transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-8">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="h-12 px-6 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all"
          >
            이전
          </Button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-black text-[var(--primary-hex)]">{page}</span>
            <span className="text-xs font-bold text-slate-300">/</span>
            <span className="text-sm font-bold text-slate-500">{totalPages}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-12 px-6 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all"
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
