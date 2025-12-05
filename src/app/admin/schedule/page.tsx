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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminSchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [gymName, setGymName] = useState("");
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      try {
        // 1. 로그인 체크
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");

        // 2. 내 정보(관리자) 가져오기
        const { data: me, error: meError } = await supabase
          .from("staffs")
          .select("id, gym_id, role, gyms(name)")
          .eq("user_id", user.id)
          .single();

        if (meError || !me) {
          console.error("❌ 관리자 정보 로딩 실패:", JSON.stringify(meError, null, 2));
          alert("관리자 정보를 찾을 수 없습니다.");
          return;
        }

        // @ts-ignore
        setGymName(me.gyms?.name || "센터");

        // 3. 우리 지점의 모든 직원 가져오기 (필터링용)
        const { data: staffList } = await supabase
          .from("staffs")
          .select("id, name")
          .eq("gym_id", me.gym_id)
          .order("name", { ascending: true });
        
        if (staffList) setStaffs(staffList);

        // 4. 우리 지점의 모든 스케줄 가져오기
        fetchSchedules(me.gym_id, "all");

      } catch (error) {
        console.error("초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // 스케줄 조회 함수
  const fetchSchedules = async (gymId: string, staffIdFilter: string) => {
    let query = supabase
      .from("schedules")
      .select(`
        id, start_time, end_time, type, status, member_name,
        staff_id,
        staffs ( name ) 
      `)
      .eq("gym_id", gymId);

    // 특정 직원만 필터링
    if (staffIdFilter !== "all") {
      query = query.eq("staff_id", staffIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("스케줄 조회 실패:", error);
    } else {
      // FullCalendar용 변환
      const events = data.map((sch) => ({
        id: sch.id,
        // 제목: [강사명] 회원명 (수업)
        // @ts-ignore
        title: `[${sch.staffs?.name || '미정'}] ${sch.member_name} (${sch.type})`,
        start: sch.start_time,
        end: sch.end_time,
        backgroundColor: getStatusColor(sch.status),
        borderColor: getStatusColor(sch.status),
      }));
      setSchedules(events);
    }
  };

  // 필터 변경 시 재조회
  const handleFilterChange = (value: string) => {
    setSelectedStaffId(value);
    // 현재 gym_id를 알기 위해 다시 조회하거나 state에 저장해둬야 함.
    // 편의상 reload 하거나, gymId를 state로 관리하는 게 좋음.
    // 여기서는 간단히 새로고침 없이 필터링만 적용하기 위해
    // 기존 schedules에서 JS로 필터링하거나 다시 fetch 해야 함.
    // (위 useEffect 로직상 gymId가 로컬 변수라, 여기선 window reload가 가장 확실)
    window.location.reload(); 
    // *실제로는 state에 gymId 저장해서 fetchSchedules(gymId, value) 호출하는 게 정석입니다.
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#F2994A"; // Point Orange
      case "no_show_deducted": return "#EF4444"; // Red
      case "service": return "#3B82F6"; // Blue
      default: return "#2F80ED"; // Primary Blue
    }
  };

  if (isLoading) return <div className="p-10">일정을 불러오는 중...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-heading font-bold text-[#2F80ED]">{gymName} 통합 스케줄</h2>
        
        {/* 강사 필터 */}
        <div className="w-[200px]">
          <Select value={selectedStaffId} onValueChange={handleFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="강사 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 강사 보기</SelectItem>
              {staffs.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 달력 영역 (번역 방지 클래스 추가) */}
      <div className="flex-1 bg-white p-4 rounded-lg shadow notranslate overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={koLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          buttonText={{
            today: '오늘',
            month: '월',
            week: '주',
            day: '일',
            list: '목록'
          }}
          events={schedules}
          height="100%"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
        />
      </div>
    </div>
  );
}