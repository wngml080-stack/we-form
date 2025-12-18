"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  Users, DollarSign, Calendar, TrendingUp, UserPlus,
  CreditCard, Settings, Plus, Bell, Search, CheckCircle2, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const [gymName, setGymName] = useState("");
  const [userName, setUserName] = useState("관리자");
  const [myStaffId, setMyStaffId] = useState<string>("");
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    todaySchedules: 0,
    todaySales: 0,
    monthSales: 0,
    newMembersThisMonth: 0
  });
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 달력 관련 상태
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const supabase = createSupabaseClient();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: me } = await supabase
      .from("staffs")
      .select("id, name, gym_id, company_id, gyms(name)")
      .eq("user_id", user.id)
      .single();

    if (me) {
      setMyStaffId(me.id);
      setUserName(me.name);
      // @ts-ignore
      setGymName(me.gyms?.name ?? "We:form");
      await fetchDashboardData(me.gym_id, me.company_id, me.id);
    }
    setIsLoading(false);
  };

  const fetchDashboardData = async (gymId: string, companyId: string, staffId: string) => {
    if (!gymId || !companyId) return;

    // 1. 회원 통계
    const { data: members } = await supabase
      .from("members")
      .select("id, status, created_at")
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => m.status === 'active').length || 0;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newMembersThisMonth = members?.filter(m =>
      new Date(m.created_at) >= thisMonthStart
    ).length || 0;

    // 2. 오늘 나의 스케줄 (본인 담당 수업만)
    const today = new Date().toISOString().split('T')[0];
    const { data: schedules } = await supabase
      .from("schedules")
      .select(`
        id,
        member_name,
        type,
        status,
        start_time,
        end_time,
        staffs (name)
      `)
      .eq("gym_id", gymId)
      .eq("staff_id", staffId)
      .gte("start_time", `${today}T00:00:00`)
      .lte("start_time", `${today}T23:59:59`)
      .order("start_time", { ascending: true });

    setTodaySchedules(schedules || []);

    // 3. 오늘 매출
    const { data: todayPayments } = await supabase
      .from("member_payments")
      .select("amount")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .gte("paid_at", `${today}T00:00:00`);

    const todaySales = todayPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    // 4. 이번 달 매출
    const monthStart = thisMonthStart.toISOString();
    const { data: monthPayments } = await supabase
      .from("member_payments")
      .select("amount")
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .gte("paid_at", monthStart);

    const monthSales = monthPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    // 5. 공지사항 조회 (활성, 최근 5개)
    const { data: announcementsData } = await supabase
      .from("announcements")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .or(`gym_id.is.null,gym_id.eq.${gymId}`)
      .lte("start_date", today)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    setAnnouncements(announcementsData || []);

    // 6. 이번 달 회사 행사 조회
    const monthEnd = new Date(thisMonthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const monthEndStr = monthEnd.toISOString().split('T')[0];

    const { data: eventsData } = await supabase
      .from("company_events")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .or(`gym_id.is.null,gym_id.eq.${gymId}`)
      .gte("event_date", today)
      .lte("event_date", monthEndStr)
      .order("event_date", { ascending: true });

    setCompanyEvents(eventsData || []);

    setStats({
      totalMembers,
      activeMembers,
      todaySchedules: schedules?.length || 0,
      todaySales,
      monthSales,
      newMembersThisMonth
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reserved: "bg-blue-500",
      completed: "bg-emerald-500",
      no_show: "bg-gray-400",
      no_show_deducted: "bg-red-500",
      service: "bg-sky-500"
    };
    return colors[status] || "bg-gray-300";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  const todayDate = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  });

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {userName}님 즐거운 오후입니다. <span className="text-yellow-500">😊</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
             오늘도 <span className="text-[#2F80ED] font-bold">{gymName}</span>의 성장을 응원합니다!
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm font-medium text-gray-500 mb-2">{todayDate}</div>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 ml-auto shadow-sm">
            <Settings className="w-4 h-4" /> 위젯 설정
          </button>
        </div>
      </div>

      {/* 업데이트 공지 배너 */}
      {announcements.filter(a => a.priority === 'urgent').length > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 md:p-5 text-white shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-3 flex-1">
            <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">🔔 중요 공지</div>
              <p className="text-sm opacity-90">{announcements.filter(a => a.priority === 'urgent')[0]?.title}</p>
            </div>
            <button
              onClick={() => {
                const urgentAnn = announcements.filter(a => a.priority === 'urgent')[0];
                if (urgentAnn) {
                  alert(`${urgentAnn.title}\n\n${urgentAnn.content}`);
                }
              }}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors whitespace-nowrap"
            >
              자세히 보기
            </button>
          </div>
        </div>
      )}

      {/* 2. Quick Actions (아이콘 메뉴) */}
      <div className="flex gap-4 md:gap-8 overflow-x-auto pb-4 scrollbar-hide">
        <QuickAction icon={UserPlus} label="신규회원 매출등록" href="/admin/members?type=new" color="bg-blue-100 text-blue-600" />
        <QuickAction icon={Users} label="기존회원 매출등록" href="/admin/members?type=existing" color="bg-indigo-100 text-indigo-600" />
        <QuickAction icon={Calendar} label="스케줄 관리" href="/admin/schedule" color="bg-purple-100 text-purple-600" />
        <QuickAction icon={CheckCircle2} label="출석 체크" href="/admin/attendance" color="bg-orange-100 text-orange-600" />
        <QuickAction icon={Plus} label="추가 메뉴" href="#" color="bg-gray-100 text-gray-500" />
      </div>

      {/* 3. Banner Widget - Google Calendar 연동 */}
      <div className="bg-gradient-to-r from-[#2F80ED] to-[#56CCF2] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-blue-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">Notice</span>
            <span className="font-medium opacity-90">새로운 기능 업데이트</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">
            Google Calendar 연동 기능이 추가되었습니다!
          </h3>
          <p className="opacity-90 text-sm md:text-base">이제 외부 캘린더와 스케줄을 동기화하여 더 편리하게 관리하세요.</p>
        </div>
        <button
          onClick={() => {
            // TODO: Google Calendar 연동 페이지로 이동 또는 모달 열기
            alert("Google Calendar 연동 기능은 곧 출시됩니다!");
          }}
          className="relative z-10 px-6 py-3 bg-white text-[#2F80ED] rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
        >
          지금 연동하기
        </button>

        {/* Deco Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
      </div>

      {/* 4. Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Column: 현황 카드 */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#2F80ED] rounded-full"></div>
                센터 현황
              </h3>
              <button className="text-gray-400 hover:text-gray-600"><Settings className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-4">
              <StatRow 
                icon={Users} 
                label="전체 회원" 
                value={`${stats.totalMembers}명`} 
                subValue={`신규 ${stats.newMembersThisMonth}명`}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
              <StatRow 
                icon={TrendingUp} 
                label="활성 회원" 
                value={`${stats.activeMembers}명`} 
                subValue={`${stats.totalMembers > 0 ? ((stats.activeMembers/stats.totalMembers)*100).toFixed(0) : 0}% 활성`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
              />
              <StatRow 
                icon={DollarSign} 
                label="이번 달 매출" 
                value={formatCurrency(stats.monthSales)} 
                subValue="목표 대비 85%"
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#2F80ED]" />
                  공지사항
                </h3>
                <span className="text-xs text-gray-400">{announcements.length}개</span>
             </div>
             <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <Bell className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">등록된 공지사항이 없습니다.</p>
                  </div>
                ) : (
                  announcements.map((announcement) => {
                    const priorityColors: Record<string, string> = {
                      urgent: "bg-red-100 text-red-600",
                      normal: "bg-blue-100 text-blue-600",
                      low: "bg-gray-100 text-gray-600"
                    };
                    const priorityLabels: Record<string, string> = {
                      urgent: "긴급",
                      normal: "일반",
                      low: "참고"
                    };

                    return (
                      <div key={announcement.id} className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-gray-100">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityColors[announcement.priority]}`}>
                            {priorityLabels[announcement.priority]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm truncate">{announcement.title}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{announcement.content}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        </div>

        {/* Center Column: 예정된 업무 (오늘 나의 스케줄) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="text-[#2F80ED] text-2xl">●</span>
              나의 오늘 수업 <span className="text-[#2F80ED]">{todaySchedules.length}</span>
            </h3>
            <Link href="/admin/schedule">
               <span className="text-xs font-bold text-gray-400 hover:text-[#2F80ED] cursor-pointer border px-2 py-1 rounded-md">전체보기</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto space-y-3 custom-scrollbar pr-2">
            {todaySchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p>오늘 담당하신 수업이 없습니다.</p>
              </div>
            ) : (
              todaySchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all group cursor-pointer">
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className="text-xs font-bold text-[#2F80ED] bg-blue-100 px-2 py-1 rounded-md mb-1">
                      {schedule.type}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      {schedule.member_name} 회원님
                      {schedule.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(schedule.status)}`}></div>
                      {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 시작
                      <span className="text-gray-300">|</span>
                      {schedule.staffs?.name} 강사
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg group-hover:text-[#2F80ED] group-hover:border-blue-200 transition-colors">
                    상세
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: 회사 행사 일정 - 미니 달력 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
               <Calendar className="w-5 h-5 text-[#2F80ED]" />
               회사 행사
             </h3>
             <span className="text-xs text-gray-400">{companyEvents.length}개</span>
          </div>

          {/* 달력 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonth(prev);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {format(currentMonth, "yyyy년 M월", { locale: ko })}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonth(next);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 미니 달력 */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {(() => {
              const monthStart = startOfMonth(currentMonth);
              const monthEnd = endOfMonth(currentMonth);
              const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
              const startDayOfWeek = monthStart.getDay();

              // 날짜별 행사 맵 생성
              const eventsByDate: Record<string, any[]> = {};
              companyEvents.forEach((event) => {
                const dateKey = event.event_date;
                if (!eventsByDate[dateKey]) {
                  eventsByDate[dateKey] = [];
                }
                eventsByDate[dateKey].push(event);
              });

              const eventTypeColors: Record<string, string> = {
                general: "bg-blue-500",
                training: "bg-purple-500",
                meeting: "bg-orange-500",
                holiday: "bg-red-500",
                celebration: "bg-pink-500"
              };

              return (
                <div>
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                      <div
                        key={day}
                        className={cn(
                          "text-center text-xs font-semibold py-1",
                          idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-gray-600"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 날짜 그리드 */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* 빈 칸 */}
                    {Array.from({ length: startDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}

                    {/* 날짜 */}
                    {daysInMonth.map((date) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      const dayEvents = eventsByDate[dateKey] || [];
                      const isToday = isSameDay(date, new Date());
                      const isCurrentMonth = isSameMonth(date, currentMonth);

                      return (
                        <div
                          key={dateKey}
                          className={cn(
                            "aspect-square p-1 rounded-lg cursor-pointer transition-all relative",
                            isToday && "bg-blue-100 ring-2 ring-blue-500",
                            !isToday && dayEvents.length > 0 && "hover:bg-gray-100",
                            !isToday && dayEvents.length === 0 && "hover:bg-gray-50"
                          )}
                          onClick={() => {
                            setSelectedDate(date);
                            if (dayEvents.length > 0) {
                              setIsEventModalOpen(true);
                            }
                          }}
                        >
                          <div className={cn(
                            "text-xs font-medium text-center",
                            isToday ? "text-blue-700 font-bold" : "text-gray-700",
                            !isCurrentMonth && "text-gray-300"
                          )}>
                            {format(date, "d")}
                          </div>
                          {dayEvents.length > 0 && (
                            <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                              {dayEvents.slice(0, 3).map((event, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "w-1 h-1 rounded-full",
                                    eventTypeColors[event.event_type] || "bg-gray-400"
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* 선택한 날짜의 행사 모달 */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })} 행사
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedDate && (() => {
              const dateKey = format(selectedDate, "yyyy-MM-dd");
              const dayEvents = companyEvents.filter(event => event.event_date === dateKey);

              const eventTypeColors: Record<string, string> = {
                general: "bg-blue-100 text-blue-600",
                training: "bg-purple-100 text-purple-600",
                meeting: "bg-orange-100 text-orange-600",
                holiday: "bg-red-100 text-red-600",
                celebration: "bg-pink-100 text-pink-600"
              };

              const eventTypeLabels: Record<string, string> = {
                general: "일반",
                training: "교육",
                meeting: "회의",
                holiday: "휴무",
                celebration: "행사"
              };

              if (dayEvents.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">이 날짜에 등록된 행사가 없습니다.</p>
                  </div>
                );
              }

              return dayEvents.map((event) => (
                <div key={event.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${eventTypeColors[event.event_type]}`}>
                      {eventTypeLabels[event.event_type]}
                    </span>
                    {event.gym_id ? (
                      <span className="text-xs text-gray-500">특정 지점</span>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold">전사</span>
                    )}
                  </div>
                  <div className="font-bold text-gray-800 mb-2">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{event.description}</div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {event.start_time && (
                      <span>🕐 {event.start_time.substring(0, 5)}</span>
                    )}
                    {event.location && (
                      <span>📍 {event.location}</span>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEventModalOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub Components

function QuickAction({ icon: Icon, label, href, color }: { icon: any, label: string, href: string, color: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 min-w-[80px] group">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-gray-600 group-hover:text-[#2F80ED] transition-colors">{label}</span>
    </Link>
  );
}

function StatRow({ icon: Icon, label, value, subValue, iconBg, iconColor }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
           {subValue}
        </div>
      </div>
    </div>
  );
}
