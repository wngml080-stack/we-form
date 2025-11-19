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
  const [isMounted, setIsMounted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  const [newMemberName, setNewMemberName] = useState("");
  const [newClassType, setNewClassType] = useState("PT");
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState("50"); 

  // 내 정보 상태
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [myStaffName, setMyStaffName] = useState<string>("");
  const [myGymName, setMyGymName] = useState<string>(""); // 👈 지점명 추가

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsMounted(true);
    const fetchMyInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 👇 수정된 부분: gyms 테이블의 name도 같이 가져오기 (JOIN)
      const { data: staff, error } = await supabase
        .from("staffs")
        .select(`
          id, 
          gym_id, 
          name,
          gyms ( name )
        `)
        .eq("user_id", user.id)
        .single();

      if (staff) {
        setMyStaffId(staff.id);
        setMyGymId(staff.gym_id);
        setMyStaffName(staff.name);
        // @ts-ignore
        setMyGymName(staff.gyms?.name || "We:form"); // 지점명 저장
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
    setSelectedDate(arg.dateStr);
    setIsAddModalOpen(true);
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
      // 👇 여기서 이름을 조합합니다! (회사명_지점명_강사명)
      // 예: We:form_본점_김강사
      const formattedStaffName = `${myGymName}_${myStaffName}`;

      console.log("🚀 API 호출 시작: /api/n8n");
      
      fetch("/api/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: startTime,
          member_name: newMemberName,
          type: newClassType,
          status: "reserved",
          staff_id: myStaffId,
          staff_name: formattedStaffName, // 👈 조합된 이름 전송
        }),
      });

      setIsAddModalOpen(false);
      setNewMemberName("");
      fetchSchedules(myStaffId);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <header className="bg-[#0F4C5C] p-4 text-white shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex flex-col">
            <h1 className="text-lg font-bold">We:form</h1>
            <span className="text-xs text-white/70">{myGymName}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-[#E0FB4A] font-bold">{myStaffName}</span>
            <Button 
                onClick={() => router.push('/login')} 
                variant="ghost" 
                className="text-xs text-white/70 hover:text-white hover:bg-white/10 h-8 px-2"
            >
                로그아웃
            </Button>
        </div>
      </header>

      <div className="p-2 bg-white pb-24 notranslate">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="listWeek"
          locale={koLocale}
          headerToolbar={{
            left: "prev,next", 
            center: "title",
            right: "timeGridDay,listWeek,dayGridMonth",
          }}
          buttonText={{
            today: '오늘',
            month: '월',
            week: '주',
            day: '일',
            list: '목록'
          }}
          events={schedules}
          dateClick={handleDateClick}
          height="80vh"
          noEventsContent="예정된 수업이 없습니다."
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          eventContent={(eventInfo) => (
            <div className="flex justify-between items-center w-full px-1 overflow-hidden">
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate">{eventInfo.event.title}</span>
                {eventInfo.view.type === 'listWeek' && (
                    <span className="text-xs text-gray-500">
                    {eventInfo.timeText}
                    </span>
                )}
              </div>
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
    </div>
  );
}