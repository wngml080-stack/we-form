"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  CalendarCheck2,
  LogOut,
  Smartphone,
  PlusCircle,
  Sparkles,
  CircleCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import FullCalendar, {
  DateClickArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

import { Button } from "@/components/ui/button";

const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

type ScheduleStatus = "completed" | "no_show_deducted" | "no_show" | "service";

type ScheduleRow = {
  id: string;
  staff_id: string;
  gym_id?: string;
  member_id: string | null;
  type: string | null;
  status: ScheduleStatus;
  start_time: string;
  end_time: string;
};

type StaffInfo = {
  id: string;
  gym_id?: string;
};

function statusColors(status: ScheduleStatus) {
  switch (status) {
    case "completed":
      return {
        backgroundColor: "#22c55e",
        borderColor: "#16a34a",
        textColor: "white",
      };
    case "no_show_deducted":
      return {
        backgroundColor: "#ef4444",
        borderColor: "#b91c1c",
        textColor: "white",
      };
    case "no_show":
      return {
        backgroundColor: "#9ca3af",
        borderColor: "#6b7280",
        textColor: "white",
      };
    case "service":
      return {
        backgroundColor: "#3b82f6",
        borderColor: "#1d4ed8",
        textColor: "white",
      };
    default:
      return {};
  }
}

export default function StaffPage() {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 수업 추가 모달 상태
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [classType, setClassType] = useState<"PT" | "OT">("PT");
  const [startTimeInput, setStartTimeInput] = useState("10:00");
  const [endTimeInput, setEndTimeInput] = useState("11:00");
  const [isSaving, setIsSaving] = useState(false);

  // 상태 변경 모달 상태
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 내 staff 정보 + 스케줄 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingEvents(true);
        setFetchError(null);
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setFetchError("로그인이 필요합니다. 다시 로그인해 주세요.");
          return;
        }

        const { data: staff, error: staffError } = await supabase
          .from("staffs")
          .select("id, gym_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (staffError || !staff) {
          setFetchError(
            "staffs 테이블에서 내 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요."
          );
          return;
        }

        const staffInfoData: StaffInfo = {
          id: staff.id,
          gym_id: staff.gym_id,
        };
        setStaffInfo(staffInfoData);

        let query = supabase
          .from("schedules")
          .select(
            "id, staff_id, gym_id, member_id, type, status, start_time, end_time"
          )
          .eq("staff_id", staff.id)
          .order("start_time", { ascending: true });

        if (staff.gym_id) {
          query = query.eq("gym_id", staff.gym_id);
        }

        const { data: schedules, error: schedulesError } = await query;

        if (schedulesError) {
          setFetchError("스케줄을 불러오는 중 오류가 발생했습니다.");
          console.error(schedulesError);
          return;
        }

        const mappedEvents: EventInput[] =
          (schedules as ScheduleRow[]).map((row) => {
            const colors = statusColors(row.status);
            return {
              id: row.id,
              title: `${row.member_id ?? "회원"} • ${row.type ?? ""}`,
              start: row.start_time,
              end: row.end_time,
              ...colors,
              extendedProps: {
                status: row.status,
              },
            };
          }) ?? [];

        setEvents(mappedEvents);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchData();
  }, []);

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(arg.dateStr);
    setIsAddOpen(true);
  };

  const handleAddClick = () => {
    const today = new Date().toISOString().slice(0, 10);
    setSelectedDate(today);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!staffInfo || !selectedDate) return;

    setIsSaving(true);
    try {
      const supabase = createClient();

      const start = `${selectedDate}T${startTimeInput}`;
      const end = `${selectedDate}T${endTimeInput}`;

      const { data, error } = await supabase
        .from("schedules")
        .insert({
          gym_id: staffInfo.gym_id,
          staff_id: staffInfo.id,
          member_id: memberName,
          type: classType,
          status: "completed" as ScheduleStatus,
          start_time: start,
          end_time: end,
        })
        .select(
          "id, staff_id, gym_id, member_id, type, status, start_time, end_time"
        )
        .maybeSingle();

      if (error || !data) {
        console.error(error);
        return;
      }

      const row = data as ScheduleRow;
      const colors = statusColors(row.status);
      setEvents((prev) => [
        ...prev,
        {
          id: row.id,
          title: `${row.member_id ?? "회원"} • ${row.type ?? ""}`,
          start: row.start_time,
          end: row.end_time,
          ...colors,
          extendedProps: {
            status: row.status,
          },
        },
      ]);

      setIsAddOpen(false);
      setMemberName("");
      setClassType("PT");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedEventId(arg.event.id as string);
    setIsStatusOpen(true);
  };

  const updateStatus = async (newStatus: ScheduleStatus) => {
    if (!selectedEventId || !staffInfo) return;

    setIsUpdatingStatus(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("schedules")
        .update({ status: newStatus })
        .eq("id", selectedEventId)
        .eq("staff_id", staffInfo.id);

      if (error) {
        console.error(error);
        return;
      }

      const colors = statusColors(newStatus);

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedEventId
            ? {
                ...ev,
                ...colors,
                extendedProps: {
                  ...(ev.extendedProps ?? {}),
                  status: newStatus,
                },
              }
            : ev
        )
      );

      setIsStatusOpen(false);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-slate-100 px-4 py-6">
      {/* 모바일 기준 최대 너비 430px */}
      <div className="flex w-full max-w-[430px] flex-col justify-between gap-4 rounded-2xl bg-white p-4 shadow-lg">
        {/* 상단 영역 */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[#0F4C5C]" />
              <span className="text-xs font-semibold uppercase text-slate-500">
                We:form Staff
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              className="flex items-center gap-1 border-slate-300 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <PlusCircle className="h-3 w-3 text-[#0F4C5C]" />
              수업 추가
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-[#0F4C5C]" />
            <h1 className="text-xl font-semibold tracking-tight">
              오늘의 스케줄
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            오늘 배정된 수업과 근무 일정을 한눈에 확인해 주세요.
          </p>
        </header>

        {/* 스케줄 영역 - FullCalendar */}
        <main className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs">
          {fetchError ? (
            <p className="text-center text-xs text-red-500">{fetchError}</p>
          ) : (
            <FullCalendar
              plugins={[
                listPlugin,
                interactionPlugin,
                dayGridPlugin,
                timeGridPlugin,
              ]}
              initialView="listWeek"
              height="auto"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              buttonText={{
                today: "오늘",
              }}
              locale="ko"
              events={events}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventDisplay="block"
              contentHeight="auto"
              displayEventTime
              progressiveEventRendering
              views={{
                listWeek: {
                  listDayFormat: { weekday: "short", month: "numeric", day: "numeric" },
                },
              }}
              dayHeaderClassNames="bg-[#0F4C5C] text-white"
            />
          )}
          {isLoadingEvents && !fetchError && (
            <p className="mt-2 text-center text-[11px] text-slate-400">
              스케줄을 불러오는 중입니다...
            </p>
          )}
        </main>

        {/* 하단 로그아웃 버튼 */}
        <footer className="pt-1">
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center justify-center gap-2 bg-[#0F4C5C] text-sm font-semibold text-white hover:bg-[#0d404e]"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </footer>

        {/* 수업 추가 모달 */}
        {isAddOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#0F4C5C]" />
                <h2 className="text-base font-semibold">수업 추가</h2>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">날짜</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={selectedDate ?? ""}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">회원명</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                    placeholder="회원명을 입력해 주세요"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-slate-500">시작 시간</label>
                    <input
                      type="time"
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-slate-500">종료 시간</label>
                    <input
                      type="time"
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={endTimeInput}
                      onChange={(e) => setEndTimeInput(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">수업 타입</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setClassType("PT")}
                      className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium ${
                        classType === "PT"
                          ? "border-[#0F4C5C] bg-[#0F4C5C] text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      PT
                    </button>
                    <button
                      type="button"
                      onClick={() => setClassType("OT")}
                      className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium ${
                        classType === "OT"
                          ? "border-[#0F4C5C] bg-[#0F4C5C] text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      OT
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 border-slate-300 px-3 text-[11px] text-slate-600"
                    onClick={() => setIsAddOpen(false)}
                    disabled={isSaving}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0F4C5C] px-3 text-[11px] font-semibold text-white hover:bg-[#0d404e]"
                    disabled={isSaving}
                  >
                    {isSaving ? "저장 중..." : "수업 저장"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 상태 변경 모달 */}
        {isStatusOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <CalendarCheck2 className="h-5 w-5 text-[#0F4C5C]" />
                <h2 className="text-base font-semibold">상태 변경</h2>
              </div>
              <p className="mb-3 text-xs text-slate-500">
                수업 상태를 선택해 주세요. 버튼을 누르면 바로 저장됩니다.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => updateStatus("completed")}
                  disabled={isUpdatingStatus}
                  className="flex items-center justify-center gap-1 rounded-lg bg-[#22c55e] px-2 py-2 font-semibold text-white shadow-sm"
                >
                  <CircleCheck className="h-4 w-4" />
                  출석 완료
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus("no_show_deducted")}
                  disabled={isUpdatingStatus}
                  className="flex items-center justify-center gap-1 rounded-lg bg-[#ef4444] px-2 py-2 font-semibold text-white shadow-sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  노쇼 차감
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus("no_show")}
                  disabled={isUpdatingStatus}
                  className="flex items-center justify-center gap-1 rounded-lg bg-[#9ca3af] px-2 py-2 font-semibold text-white shadow-sm"
                >
                  <XCircle className="h-4 w-4" />
                  단순 노쇼
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus("service")}
                  disabled={isUpdatingStatus}
                  className="flex items-center justify-center gap-1 rounded-lg bg-[#3b82f6] px-2 py-2 font-semibold text-white shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  서비스
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-300 px-3 text-[11px] text-slate-600"
                  onClick={() => setIsStatusOpen(false)}
                  disabled={isUpdatingStatus}
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

