"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import FullCalendar, {
  EventClickArg,
  EventInput,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import koLocale from "@fullcalendar/core/locales/ko";
import { LayoutDashboard, CalendarRange, Users2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ScheduleStatus = "reserved" | "completed" | "no_show_deducted" | "no_show" | "service";

type StaffOption = {
  id: string;
  name: string;
};

type ScheduleRow = {
  id: string;
  staff_id: string;
  member_name: string | null;
  type: string | null;
  status: ScheduleStatus;
  start_time: string;
  end_time: string;
  staffs?: {
    name: string;
  } | null;
};

function getStatusColor(status: ScheduleStatus) {
  switch (status) {
    case "completed":
      return "#22c55e"; // Lime/Green
    case "no_show_deducted":
      return "#ef4444"; // Red
    case "no_show":
      return "#9ca3af"; // Gray
    case "service":
      return "#3b82f6"; // Blue
    case "reserved":
    default:
      return "#0F4C5C"; // Deep Teal
  }
}

export default function AdminSchedulePage() {
  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);
  const [gymName, setGymName] = useState<string>("We:form");
  const [adminName, setAdminName] = useState<string>("");

  const [staffs, setStaffs] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");

  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 상세/수정 모달 상태
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    staffName: string;
    memberName: string;
    type: string;
    status: ScheduleStatus;
    start: string;
    end: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // 내 staff + gym 정보 가져오기
        const { data: staff, error: staffError } = await supabase
          .from("staffs")
          .select(
            `
            id,
            gym_id,
            name,
            gyms ( name )
          `
          )
          .eq("user_id", user.id)
          .single();

        if (staffError || !staff) {
          console.error("관리자 정보 로딩 실패:", staffError);
          return;
        }

        setGymId(staff.gym_id);
        setAdminName(staff.name);
        // @ts-ignore
        setGymName(staff.gyms?.name ?? "We:form");

        // 같은 gym의 모든 staff 목록
        const { data: staffRows } = await supabase
          .from("staffs")
          .select("id, name")
          .eq("gym_id", staff.gym_id)
          .order("name", { ascending: true });

        setStaffs(
          (staffRows ?? []).map((s) => ({
            id: s.id,
            name: s.name,
          }))
        );

        await fetchSchedules(staff.gym_id);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const fetchSchedules = async (gymIdValue: string) => {
    const { data, error } = await supabase
      .from("schedules")
      .select(
        `
        id,
        staff_id,
        member_name,
        type,
        status,
        start_time,
        end_time,
        staffs ( name )
      `
      )
      .eq("gym_id", gymIdValue)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("스케줄 로딩 실패:", error);
      return;
    }

    const mapped: EventInput[] = (data as ScheduleRow[]).map((row) => {
      const staffName = row.staffs?.name ?? "미지정 강사";
      const title = `[${staffName}] ${row.member_name ?? "회원"} (${row.type ?? ""})`;
      const color = getStatusColor(row.status);

      return {
        id: row.id,
        title,
        start: row.start_time,
        end: row.end_time,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          staffId: row.staff_id,
          staffName,
          memberName: row.member_name,
          type: row.type,
          status: row.status,
        },
      };
    });

    setEvents(mapped);
  };

  const filteredEvents =
    selectedStaffId === "all"
      ? events
      : events.filter(
          (ev) => (ev.extendedProps as any)?.staffId === selectedStaffId
        );

  const handleEventClick = (arg: EventClickArg) => {
    const ev = arg.event;
    const ext = ev.extendedProps as any;

    setSelectedEvent({
      id: ev.id as string,
      staffName: ext.staffName ?? "미지정 강사",
      memberName: ext.memberName ?? "회원",
      type: ext.type ?? "",
      status: ext.status as ScheduleStatus,
      start: ev.start?.toISOString() ?? "",
      end: ev.end?.toISOString() ?? "",
    });
    setIsDetailOpen(true);
  };

  const handleStatusUpdate = async (newStatus: ScheduleStatus) => {
    if (!selectedEvent) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("schedules")
        .update({ status: newStatus })
        .eq("id", selectedEvent.id);

      if (error) {
        console.error("상태 변경 실패:", error);
        return;
      }

      if (gymId) {
        await fetchSchedules(gymId);
      }

      setSelectedEvent((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
      setIsDetailOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* 왼쪽 사이드바 */}
      <aside className="flex w-64 flex-col gap-6 bg-[#0F4C5C] px-6 py-8 text-slate-50">
        <div className="flex items-center gap-2 text-xl font-bold">
          <CalendarRange className="h-6 w-6 text-[#E0FB4A]" />
          <span>We:form</span>
        </div>
        <div className="text-xs text-slate-200/80">{gymName}</div>

        <nav className="mt-4 space-y-2 text-sm">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-slate-200/80 hover:bg-white/10"
            onClick={() => router.push("/admin")}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <div className="flex w-full items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-left font-semibold">
            <CalendarRange className="h-4 w-4 text-[#E0FB4A]" />
            <span>스케줄</span>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-slate-200/80 hover:bg-white/10"
          >
            <Users2 className="h-4 w-4" />
            <span>직원 관리</span>
          </button>
        </nav>

        <div className="mt-auto flex items-center justify-between text-xs text-slate-200/80">
          <span>{adminName}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 border-slate-200/40 bg-transparent px-2 py-1 text-[11px] text-slate-50 hover:bg-white/10"
          >
            <LogOut className="h-3 w-3" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* 오른쪽 메인 영역 */}
      <main className="flex flex-1 flex-col bg-white">
        {/* 상단 필터 영역 */}
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              통합 스케줄
            </h1>
            <p className="text-xs text-slate-500">
              센터 전체 강사 스케줄을 한 번에 조회하고 관리할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">강사 선택</span>
            <Select
              value={selectedStaffId}
              onValueChange={(value) => setSelectedStaffId(value)}
            >
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="전체 강사 보기" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 강사 보기</SelectItem>
                {staffs.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* FullCalendar 영역 */}
        <section className="notranslate flex-1 p-4">
          <div className="h-full rounded-xl border border-slate-200 bg-slate-50/80 p-2">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              locale={koLocale}
              height="100%"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "오늘",
                month: "월",
                week: "주",
                day: "일",
              }}
              events={filteredEvents}
              eventClick={handleEventClick}
              eventDisplay="block"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
            />
            {isLoading && (
              <p className="mt-2 text-center text-xs text-slate-400">
                스케줄을 불러오는 중입니다...
              </p>
            )}
          </div>
        </section>
      </main>

      {/* 상세 / 수정 모달 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-xl bg-white">
          <DialogHeader>
            <DialogTitle className="space-y-1">
              <div className="text-sm font-semibold text-slate-500">
                {selectedEvent?.staffName}
              </div>
              <div className="text-lg font-bold text-slate-900">
                {selectedEvent?.memberName ?? "수업 상세"}
              </div>
              <div className="text-xs text-slate-500">
                {selectedEvent?.type && `종류: ${selectedEvent.type} · `}
                {selectedEvent?.start &&
                  new Date(selectedEvent.start).toLocaleString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                ~{" "}
                {selectedEvent?.end &&
                  new Date(selectedEvent.end).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm">
            <p className="text-xs text-slate-500">
              관리자 권한으로 이 수업의 상태를 변경할 수 있습니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => handleStatusUpdate("completed")}
                disabled={isUpdating}
                className="h-9 w-full bg-[#E0FB4A] px-3 text-xs font-bold text-black hover:bg-[#d4f030]"
              >
                🟢 출석 완료
              </Button>
              <Button
                type="button"
                onClick={() => handleStatusUpdate("no_show_deducted")}
                disabled={isUpdating}
                className="h-9 w-full bg-[#EF4444] px-3 text-xs font-semibold text-white hover:bg-[#dc2626]"
              >
                🔴 노쇼 (차감)
              </Button>
              <Button
                type="button"
                onClick={() => handleStatusUpdate("no_show")}
                disabled={isUpdating}
                className="h-9 w-full bg-[#9CA3AF] px-3 text-xs font-semibold text-white hover:bg-[#6b7280]"
              >
                ⚪ 단순 노쇼
              </Button>
              <Button
                type="button"
                onClick={() => handleStatusUpdate("service")}
                disabled={isUpdating}
                className="h-9 w-full bg-[#3B82F6] px-3 text-xs font-semibold text-white hover:bg-[#2563eb]"
              >
                🔵 서비스
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs text-slate-600"
              onClick={() => setIsDetailOpen(false)}
              disabled={isUpdating}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


