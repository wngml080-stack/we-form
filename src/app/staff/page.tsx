"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
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

export default function StaffPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 상태 변경 모달
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    memberName: string;
    timeLabel: string;
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  const [newMemberName, setNewMemberName] = useState("");
  const [newClassType, setNewClassType] = useState("PT");
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState("50"); 

  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myGymId, setMyGymId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchMyInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: staff } = await supabase
        .from("staffs")
        .select("id, gym_id")
        .eq("user_id", user.id)
        .single();

      if (staff) {
        setMyStaffId(staff.id);
        setMyGymId(staff.gym_id);
        fetchSchedules(staff.id);
      }
    };
    fetchMyInfo();
  }, []);

  const fetchSchedules = async (staffId: string) => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("staff_id", staffId);

    if (error) {
      console.error("스케줄 로딩 실패:", error);
    } else {
      const events = data.map((sch) => ({
        id: sch.id,
        title: `${sch.member_name} (${sch.type})`,
        start: sch.start_time,
        end: sch.end_time,
        backgroundColor: getStatusColor(sch.status),
        borderColor: getStatusColor(sch.status),
        extendedProps: {
          status: sch.status,
          type: sch.type,
          memberName: sch.member_name,
        },
      }));
      setSchedules(events);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#E0FB4A";
      case "no_show_deducted": return "#EF4444";
      case "no_show": return "#9CA3AF";
      case "service": return "#3B82F6";
      default: return "#0F4C5C";
    }
  };

  const handleDateClick = (arg: any) => {
    // 월간 뷰나 주간 뷰의 빈 공간을 클릭했을 때
    setSelectedDate(arg.dateStr);
    setIsAddModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    const memberName =
      (event.extendedProps && event.extendedProps.memberName) ||
      event.title ||
      "수업";

    const formatTime = (date: Date | null) =>
      date
        ? date.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

    const startLabel = formatTime(event.start);
    const endLabel = formatTime(event.end);
    const timeLabel =
      startLabel && endLabel ? `${startLabel} ~ ${endLabel}` : startLabel;

    setSelectedEvent({
      id: event.id,
      memberName,
      timeLabel,
    });
    setIsStatusModalOpen(true);
  };

  const handleFabClick = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  const handleAddClass = async () => {
    if (!newMemberName || !myStaffId || !myGymId) return;

    const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
    const durationMin = parseInt(duration);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);

    const { error } = await supabase.from("schedules").insert({
      gym_id: myGymId,
      staff_id: myStaffId,
      member_name: newMemberName,
      type: newClassType,
      status: "reserved",
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      title: `${newMemberName} (${newClassType})`,
    });

    if (error) {
      alert("등록 실패!");
      console.error(error);
    } else {
      setIsAddModalOpen(false);
      setNewMemberName("");
      fetchSchedules(myStaffId);

      // n8n 웹훅으로 알림 전송 (실패해도 사용자에게는 알리지 않음)
      try {
        await fetch("/api/n8n", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: selectedDate,
            time: startTime,
            member_name: newMemberName,
            type: newClassType,
            status: "reserved",
            staff_id: myStaffId,
          }),
        });
      } catch (n8nError) {
        console.error("n8n 알림 전송 실패:", n8nError);
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent || !myStaffId) return;

    const { error } = await supabase
      .from("schedules")
      .update({ status: newStatus })
      .eq("id", selectedEvent.id)
      .eq("staff_id", myStaffId);

    if (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    setIsStatusModalOpen(false);
    setSelectedEvent(null);
    fetchSchedules(myStaffId);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <header className="bg-[#0F4C5C] p-4 text-white shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold">We:form 스케줄러</h1>
        <Button 
            onClick={() => router.push('/login')} 
            variant="ghost" 
            className="text-xs text-white/70 hover:text-white hover:bg-white/10"
        >
            로그아웃
        </Button>
      </header>

      <div className="p-2 bg-white pb-24">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="listWeek" // 기본은 리스트 뷰
          locale={koLocale}
          
          // 👇 여기가 변경된 부분입니다! (뷰 전환 버튼 추가)
          headerToolbar={{
            left: "prev,next", 
            center: "title",
            right: "timeGridDay,listWeek,dayGridMonth", // 일, 주, 월 순서
          }}
          // 버튼 텍스트를 짧게 커스텀 (모바일 공간 절약)
          buttonText={{
            today: '오늘',
            month: '월',
            week: '주',
            day: '일',
            list: '목록'
          }}
          
          events={schedules}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="80vh"
          noEventsContent="예정된 수업이 없습니다."
          
          // 시간표(TimeGrid) 뷰에서 시간 표시 형식
          slotMinTime="06:00:00" // 새벽 6시부터
          slotMaxTime="23:00:00" // 밤 11시까지 표시
          
          eventContent={(eventInfo) => (
            <div className="flex justify-between items-center w-full px-1 overflow-hidden">
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate">{eventInfo.event.title}</span>
                {/* 리스트 뷰일 때만 시간 표시 */}
                {eventInfo.view.type === 'listWeek' && (
                    <span className="text-xs text-gray-500">
                    {eventInfo.timeText}
                    </span>
                )}
              </div>
              {/* 리스트 뷰일 때만 색상 원 표시 */}
              {eventInfo.view.type === 'listWeek' && (
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 ml-1" 
                    style={{backgroundColor: eventInfo.event.backgroundColor}}
                  />
              )}
            </div>
          )}
        />
      </div>

      <button
        onClick={handleFabClick}
        className="fixed bottom-6 right-6 bg-[#E0FB4A] text-black p-4 rounded-full shadow-xl hover:bg-[#d4f030] transition-all active:scale-95 z-50 flex items-center justify-center"
      >
        <Plus className="w-8 h-8 stroke-[3px]" />
      </button>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>수업 등록 ({selectedDate})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
                <Label>날짜 변경</Label>
                <Input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>
            <div className="space-y-2">
              <Label>회원명</Label>
              <Input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="예: 김철수"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>시작 시간</Label>
                    <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>진행 시간</Label>
                    <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                            <SelectValue placeholder="시간 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30분 (OT)</SelectItem>
                            <SelectItem value="50">50분 (기본)</SelectItem>
                            <SelectItem value="60">60분</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
              <Label>수업 종류</Label>
              <Select value={newClassType} onValueChange={setNewClassType}>
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="OT">OT</SelectItem>
                  <SelectItem value="Consulting">상담</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
                onClick={handleAddClass} 
                className="bg-[#0F4C5C] hover:bg-[#09313b] text-white w-full h-12 text-lg font-bold"
            >
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상태 변경 모달 */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="space-y-1">
              <div className="text-base font-bold">
                {selectedEvent?.memberName ?? "수업"}
              </div>
              {selectedEvent?.timeLabel && (
                <div className="text-xs text-gray-500">
                  {selectedEvent.timeLabel}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3 text-sm">
            <button
              type="button"
              onClick={() => handleStatusChange("completed")}
              className="w-full rounded-lg bg-[#E0FB4A] px-3 py-2 text-sm font-bold text-black shadow-sm hover:bg-[#d4f030]"
            >
              🟢 출석 완료
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("no_show_deducted")}
              className="w-full rounded-lg bg-[#EF4444] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#dc2626]"
            >
              🔴 노쇼 (차감)
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("no_show")}
              className="w-full rounded-lg bg-[#9CA3AF] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#6b7280]"
            >
              ⚪ 단순 노쇼
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("service")}
              className="w-full rounded-lg bg-[#3B82F6] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2563eb]"
            >
              🔵 서비스
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}