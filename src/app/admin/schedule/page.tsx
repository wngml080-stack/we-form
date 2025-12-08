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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

export default function AdminSchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [gymName, setGymName] = useState("");
  const [myGymId, setMyGymId] = useState<string | null>(null); // 지점 ID 상태 관리 추가
  
  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [statusToUpdate, setStatusToUpdate] = useState<string>("");

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
        id, start_time, end_time, type, status, member_name, memo,
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
        extendedProps: {
          status: sch.status,
          staff_name: sch.staffs?.name,
          member_name: sch.member_name,
          type: sch.type,
          memo: sch.memo
        }
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

  // 이벤트 클릭 핸들러
  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      status: props.status,
      staff_name: props.staff_name,
      member_name: props.member_name,
      type: props.type,
      memo: props.memo
    });
    setStatusToUpdate(props.status); // 초기값 설정
    setIsModalOpen(true);
  };

  // 상태 변경 저장
  const handleSaveChanges = async () => {
    if (!selectedEvent || !statusToUpdate) return;

    try {
      // API 호출: 상태 업데이트 + 출석 기록 + 횟수 차감
      const response = await fetch("/api/schedule/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: selectedEvent.id,
          newStatus: statusToUpdate
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "업데이트 실패");
      }

      alert("상태가 변경되었습니다. (출석부 반영 완료)");
      setIsModalOpen(false);
      
      // 목록 새로고침
      if (myGymId) fetchSchedules(myGymId, selectedStaffId);

    } catch (error: any) {
      console.error("상태 업데이트 실패:", error);
      alert("오류가 발생했습니다: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#F2994A"; // Point Orange (출석완료)
      case "no_show_deducted": return "#EF4444"; // Red (노쇼-공제)
      case "no_show": return "#9CA3AF"; // Gray (단순 노쇼)
      case "service": return "#3B82F6"; // Blue (서비스)
      case "cancelled": return "#000000"; // Black (취소)
      default: return "#2F80ED"; // Primary Blue (예약됨)
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "예약됨 (수업 전)";
      case "completed": return "출석 완료 (횟수 차감)";
      case "no_show_deducted": return "노쇼 (횟수 차감)";
      case "no_show": return "노쇼 (차감 없음)";
      case "service": return "서비스 수업";
      case "cancelled": return "취소됨";
      default: return status;
    }
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = () => {
    if (schedules.length === 0) {
      alert("다운로드할 스케줄이 없습니다.");
      return;
    }

    // 엑셀용 데이터 변환
    const excelData = schedules.map((event) => ({
      "날짜": new Date(event.start).toLocaleDateString('ko-KR'),
      "시작시간": new Date(event.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      "종료시간": new Date(event.end).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      "강사명": event.extendedProps.staff_name || '-',
      "회원명": event.extendedProps.member_name || '-',
      "수업유형": event.extendedProps.type || '-',
      "상태": getStatusLabel(event.extendedProps.status),
      "메모": event.extendedProps.memo || ''
    }));

    // 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "스케줄");

    // 파일명 생성 (센터명_스케줄_날짜)
    const today = new Date().toISOString().split('T')[0];
    const fileName = `${gymName}_스케줄_${today}.xlsx`;

    // 다운로드
    XLSX.writeFile(workbook, fileName);
  };

  if (isLoading) return <div className="p-10">일정을 불러오는 중...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-4xl font-heading font-bold text-[#2F80ED]">{gymName} 통합 스케줄</h2>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
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

          {/* 엑셀 다운로드 버튼 */}
          <Button
            onClick={handleExcelDownload}
            className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
          >
            📊 엑셀 다운로드
          </Button>
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
          eventClick={handleEventClick} // 클릭 이벤트 연결
        />
      </div>

      {/* 스케줄 상세 & 상태 변경 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>수업 상세 정보</DialogTitle>
            <DialogDescription>
              수업 상태를 변경하면 출석부에 반영됩니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-gray-500">강사</Label>
                <div className="col-span-3 font-medium">{selectedEvent.staff_name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-gray-500">회원</Label>
                <div className="col-span-3 font-medium">{selectedEvent.member_name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-gray-500">수업유형</Label>
                <div className="col-span-3">
                  <Badge variant="outline">{selectedEvent.type}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-gray-500">시간</Label>
                <div className="col-span-3 text-sm">
                  {new Date(selectedEvent.start).toLocaleString('ko-KR', { 
                    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              {selectedEvent.memo && (
                 <div className="grid grid-cols-4 items-center gap-4">
                 <Label className="text-right font-bold text-gray-500">메모</Label>
                 <div className="col-span-3 text-sm text-gray-600">{selectedEvent.memo}</div>
               </div>
              )}

              <div className="border-t my-2"></div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right font-bold text-blue-600">상태 변경</Label>
                <div className="col-span-3">
                  <Select value={statusToUpdate} onValueChange={setStatusToUpdate}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">예약됨 (수업 전)</SelectItem>
                      <SelectItem value="completed">출석 완료 (✅ 횟수 차감)</SelectItem>
                      <SelectItem value="no_show_deducted">노쇼 (⛔️ 횟수 차감)</SelectItem>
                      <SelectItem value="no_show">단순 노쇼 (차감 안함)</SelectItem>
                      <SelectItem value="cancelled">수업 취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>닫기</Button>
            <Button onClick={handleSaveChanges} className="bg-[#2F80ED] hover:bg-blue-600 text-white">
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
