"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import * as XLSX from "xlsx";

export default function AdminSchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [gymName, setGymName] = useState("");
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // 뷰 타입 및 날짜
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 월별 통계
  const [monthlyStats, setMonthlyStats] = useState<any>(null);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createSupabaseClient();

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");

        const { data: me, error: meError } = await supabase
          .from("staffs")
          .select("id, gym_id, role, gyms(name)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (meError) {
          console.error("❌ 사용자 정보 조회 에러:", meError);
          alert("사용자 정보를 불러오는 중 오류가 발생했습니다.");
          return;
        }

        if (!me) {
          console.warn("⚠️ 사용자 데이터 없음");
          alert("사용자 정보를 찾을 수 없습니다. 계정이 승인되었는지 확인해주세요.");
          return router.push("/login");
        }

        // @ts-ignore
        setGymName(me.gyms?.name || "센터");
        setMyGymId(me.gym_id);
        setMyStaffId(me.id);
        setUserRole(me.role);

        // 역할에 따라 다르게 처리
        if (me.role === "staff") {
          setSelectedStaffId(me.id);
          fetchSchedules(me.gym_id, me.id);
        } else {
          const { data: staffList } = await supabase
            .from("staffs")
            .select("id, name")
            .eq("gym_id", me.gym_id)
            .order("name", { ascending: true });

          if (staffList) setStaffs(staffList);
          fetchSchedules(me.gym_id, "all");
        }

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
      .select("*")
      .eq("gym_id", gymId);

    if (staffIdFilter !== "all") {
      query = query.eq("staff_id", staffIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("스케줄 조회 실패:", error);
    } else {
      setSchedules(data || []);
      calculateMonthlyStats(data || []);
    }
  };

  // 월별 통계 계산
  const calculateMonthlyStats = (allSchedules: any[]) => {
    const current = new Date(selectedDate);
    const targetYear = current.getFullYear();
    const targetMonth = current.getMonth();

    const monthlySchedules = allSchedules.filter(s => {
      const d = new Date(s.start_time);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const unregistered = monthlySchedules.filter(s => !s.status);

    const stats = {
      PT: 0,
      OT: 0,
      Consulting: 0,
      completed: 0,
      no_show_deducted: 0,
      no_show: 0,
      service: 0,
      unregistered: unregistered.length,
      unregisteredList: unregistered,
      total: monthlySchedules.length
    };

    monthlySchedules.forEach(s => {
      if (s.type === 'PT') stats.PT++;
      else if (s.type === 'OT') stats.OT++;
      else if (s.type === 'Consulting') stats.Consulting++;

      if (s.status === 'completed') stats.completed++;
      else if (s.status === 'no_show_deducted') stats.no_show_deducted++;
      else if (s.status === 'no_show') stats.no_show++;
      else if (s.status === 'service') stats.service++;
    });

    setMonthlyStats(stats);
  };

  // 날짜 변경 시 통계 재계산
  useEffect(() => {
    if (schedules.length > 0) {
      calculateMonthlyStats(schedules);
    }
  }, [selectedDate, schedules]);

  // 날짜 네비게이션
  const handlePrevDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') {
      date.setDate(date.getDate() - 7);
    } else {
      date.setDate(date.getDate() - 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') {
      date.setDate(date.getDate() + 7);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // 필터 변경 시 재조회
  const handleFilterChange = (value: string) => {
    setSelectedStaffId(value);
    if (myGymId) {
      fetchSchedules(myGymId, value);
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    if (schedules.length === 0) {
      alert("다운로드할 스케줄이 없습니다.");
      return;
    }

    const excelData = schedules.map((schedule) => ({
      "날짜": new Date(schedule.start_time).toLocaleDateString('ko-KR'),
      "시작시간": new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      "종료시간": new Date(schedule.end_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      "회원명": schedule.member_name || '-',
      "수업유형": schedule.type || '-',
      "상태": schedule.status || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "스케줄");

    const today = new Date().toISOString().split('T')[0];
    const fileName = `${gymName}_스케줄_${today}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const currentDate = new Date(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 해당 날짜가 그 달의 몇 주차인지 계산
  const getWeekOfMonth = (date: Date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const offsetDate = date.getDate() + firstDayOfWeek - 1;
    return Math.ceil(offsetDate / 7);
  };

  const weekOfMonth = getWeekOfMonth(currentDate);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {userRole === "staff" ? "내 스케줄" : "통합 스케줄"}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">{gymName}의 스케줄을 관리하세요</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* 강사 필터 (관리자만) */}
          {userRole !== "staff" && (
            <Select value={selectedStaffId} onValueChange={handleFilterChange}>
              <SelectTrigger className="h-10 bg-white border-gray-200 rounded-lg hover:border-[#2F80ED] transition-colors">
                <SelectValue placeholder="강사 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체 강사 보기</SelectItem>
                {staffs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* 엑셀 다운로드 */}
          <Button
            onClick={handleExcelDownload}
            className="h-10 bg-[#2F80ED] hover:bg-[#2570d6] text-white font-medium rounded-lg shadow-sm transition-all"
          >
            <span className="mr-2">📊</span> 엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 컨트롤 바 (날짜 + 뷰 전환) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

          {/* 날짜 네비게이션 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-100 rounded-lg"
              onClick={handlePrevDate}
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="relative group flex items-center justify-center min-w-[160px]">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="px-4 py-2 text-sm font-bold text-gray-700 cursor-pointer hover:text-[#2F80ED] transition-colors">
                {viewType === 'day' && `${year}년 ${month}월 ${currentDate.getDate()}일`}
                {viewType === 'week' && `${year}년 ${month}월 ${weekOfMonth}주차`}
                {viewType === 'month' && `${year}년 ${month}월`}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-gray-100 rounded-lg"
              onClick={handleNextDate}
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <Button
              variant="ghost"
              size="sm"
              className="px-3 py-2 text-sm font-bold text-[#2F80ED] hover:bg-blue-50 rounded-lg transition-colors"
              onClick={handleToday}
            >
              오늘
            </Button>
          </div>

          {/* 뷰 전환 버튼 */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {(['day', 'week', 'month'] as const).map((type) => (
              <Button
                key={type}
                onClick={() => setViewType(type)}
                variant="ghost"
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                  viewType === type
                    ? 'bg-white text-[#2F80ED] shadow-sm'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                {type === 'day' ? '일' : type === 'week' ? '주' : '월집계'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 타임테이블 또는 월별 통계 */}
      {viewType === 'month' ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#2F80ED] rounded-full"></div>
                {year}년 {month}월 출석 현황
              </h2>
              <p className="text-xs text-gray-500 mt-1 ml-3.5">이번 달 스케줄 요약 및 출석 통계</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">PT 진행</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.PT || 0}<span className="text-sm text-gray-500 ml-1">회</span></div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">OT 진행</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.OT || 0}<span className="text-sm text-gray-500 ml-1">회</span></div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">상담</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.Consulting || 0}<span className="text-sm text-gray-500 ml-1">건</span></div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-xs text-gray-500 font-medium mb-1">총 일정</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyStats?.total || 0}<span className="text-sm text-gray-500 ml-1">건</span></div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">상세 현황</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">🟢</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">출석 완료</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.completed || 0}회</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">🔴</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">노쇼 (차감)</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.no_show_deducted || 0}회</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">⚪</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">단순 노쇼</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.no_show || 0}회</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">🔵</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">서비스</div>
                    <div className="text-lg font-bold text-gray-900">{monthlyStats?.service || 0}회</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 출석 미등록자 리스트 */}
          {monthlyStats && monthlyStats.unregistered > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  출석 미등록자 리스트
                </h3>
                <div className="text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                  {monthlyStats.unregistered}건
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {monthlyStats.unregisteredList?.map((schedule: any) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        schedule.type === 'PT' ? 'bg-blue-100 text-blue-600' :
                        schedule.type === 'OT' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {schedule.type}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{schedule.member_name || '회원명 없음'}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(schedule.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          {' '}
                          {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          {schedule.trainer_name && ` · ${schedule.trainer_name}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs bg-white hover:bg-yellow-100 border border-yellow-200"
                    >
                      출석 처리
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <WeeklyTimetable
            schedules={schedules}
            onScheduleClick={() => {}}
            onTimeSlotClick={() => {}}
            viewType={viewType}
            selectedDate={selectedDate}
          />
        </div>
      )}
    </div>
  );
}
