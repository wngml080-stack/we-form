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
  const [myGymId, setMyGymId] = useState<string | null>(null); // 지점 ID 상태 관리 추가
  
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
        // .single()은 결과가 0개면 에러를 뱉으므로 .maybeSingle()로 변경하여 안전하게 처리
        const { data: me, error: meError } = await supabase
          .from("staffs")
          .select("id, gym_id, role, gyms(name)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (meError) {
          console.error("❌ 관리자 정보 조회 에러:", meError);
          alert("관리자 정보를 불러오는 중 오류가 발생했습니다.");
          return;
        }

        if (!me) {
          console.warn("⚠️ 관리자 데이터 없음 (staffs 테이블 확인 필요)");
          alert("관리자 정보를 찾을 수 없습니다. 계정이 승인되었는지 확인해주세요.");
          return router.push("/login");
        }

        // @ts-ignore
        setGymName(me.gyms?.name || "센터");
        setMyGymId(me.gym_id); // 상태에 저장

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

  // 필터 변경 시 재조회 (새로고침 없이 처리)
  const handleFilterChange = (value: string) => {
    setSelectedStaffId(value);
    if (myGymId) {
      fetchSchedules(myGymId, value);
    }
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
    <div className="space-y-6 h-full flex flex-col p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-4xl font-heading font-bold text-[#2F80ED]">{gymName} 통합 스케줄</h2>
        
        {/* 강사 필터 */}
        <div className="w-full md:w-[200px]">
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
      <div className="flex-1 bg-white p-2 md:p-4 rounded-lg shadow notranslate overflow-hidden">
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
