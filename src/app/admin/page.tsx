"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { 
  Users, DollarSign, Calendar, TrendingUp, UserPlus, 
  CreditCard, Settings, Plus, Bell, Search, CheckCircle2 
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [gymName, setGymName] = useState("");
  const [userName, setUserName] = useState("관리자");
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    todaySchedules: 0,
    todaySales: 0,
    monthSales: 0,
    newMembersThisMonth: 0
  });
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createSupabaseClient();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: me } = await supabase
      .from("staffs")
      .select("name, gym_id, company_id, gyms(name)")
      .eq("user_id", user.id)
      .single();

    if (me) {
      setUserName(me.name);
      // @ts-ignore
      setGymName(me.gyms?.name ?? "We:form");
      await fetchDashboardData(me.gym_id, me.company_id);
    }
    setIsLoading(false);
  };

  const fetchDashboardData = async (gymId: string, companyId: string) => {
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

    // 2. 오늘 스케줄
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

    // 5. 최근 결제 내역
    const { data: payments } = await supabase
      .from("member_payments")
      .select(`
        id,
        amount,
        method,
        paid_at,
        members (name)
      `)
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .order("paid_at", { ascending: false })
      .limit(5);

    setRecentPayments(payments || []);

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

      {/* 2. Quick Actions (아이콘 메뉴) */}
      <div className="flex gap-4 md:gap-8 overflow-x-auto pb-4 scrollbar-hide">
        <QuickAction icon={UserPlus} label="신규회원 매출등록" href="/admin/members?type=new" color="bg-blue-100 text-blue-600" />
        <QuickAction icon={Users} label="기존회원 매출등록" href="/admin/members?type=existing" color="bg-indigo-100 text-indigo-600" />
        <QuickAction icon={Calendar} label="스케줄 관리" href="/admin/schedule" color="bg-purple-100 text-purple-600" />
        <QuickAction icon={CheckCircle2} label="출석 체크" href="/admin/attendance" color="bg-orange-100 text-orange-600" />
        <QuickAction icon={Plus} label="추가 메뉴" href="#" color="bg-gray-100 text-gray-500" />
      </div>

      {/* 3. Banner Widget */}
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
        <button className="relative z-10 px-6 py-3 bg-white text-[#2F80ED] rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap">
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
                <h3 className="font-bold text-gray-800 text-lg">채팅 방</h3>
                <span className="text-xs text-gray-400">2개 안읽음</span>
             </div>
             <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-[#2F80ED] flex items-center justify-center text-white font-bold">W</div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">We:form 공지방</div>
                    <div className="text-xs text-gray-500 truncate">이번 주 시스템 점검 안내입니다.</div>
                  </div>
                  <div className="ml-auto text-xs text-gray-400">오후 2:40</div>
                </div>
             </div>
          </div>
        </div>

        {/* Center Column: 예정된 업무 (오늘 스케줄) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="text-[#2F80ED] text-2xl">●</span>
              오늘 예정된 수업 <span className="text-[#2F80ED]">{todaySchedules.length}</span>
            </h3>
            <Link href="/admin/schedule">
               <span className="text-xs font-bold text-gray-400 hover:text-[#2F80ED] cursor-pointer border px-2 py-1 rounded-md">전체보기</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto space-y-3 custom-scrollbar pr-2">
            {todaySchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p>오늘 예정된 수업이 없습니다.</p>
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

        {/* Right Column: 일정 (미니 캘린더) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-gray-800 text-lg">일정</h3>
             <button className="text-gray-400 hover:text-gray-600"><Settings className="w-4 h-4" /></button>
          </div>
          
          {/* Simple Mini Calendar UI (Mockup) */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="font-bold text-gray-800">2025년 12월</span>
              <div className="flex gap-2">
                 <span className="text-gray-400 cursor-pointer hover:text-gray-600">&lt;</span>
                 <span className="text-gray-400 cursor-pointer hover:text-gray-600">&gt;</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-2 text-gray-400">
              <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
              {/* Days (Mock) */}
              {[...Array(5)].map((_, i) => <div key={`prev-${i}`} className="text-gray-200 py-2"></div>)}
              {[...Array(31)].map((_, i) => {
                 const day = i + 1;
                 const isToday = day === 5; // Mock today
                 return (
                   <div key={day} className={`py-2 rounded-lg cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-[#2F80ED] text-white shadow-md shadow-blue-200' : 'text-gray-600'}`}>
                     {day}
                     {/* Dot indicator */}
                     {[5, 8, 12, 20].includes(day) && !isToday && (
                       <div className="w-1 h-1 bg-[#2F80ED] rounded-full mx-auto mt-1"></div>
                     )}
                   </div>
                 );
              })}
            </div>
          </div>

          <div className="mt-auto bg-blue-50 rounded-xl p-4">
             <div className="flex items-center gap-2 mb-2">
               <Calendar className="w-4 h-4 text-[#2F80ED]" />
               <span className="text-sm font-bold text-[#2F80ED]">오늘의 주요 일정</span>
             </div>
             <div className="text-xs text-gray-600 space-y-1">
               <p>• 오후 2:00 전체 강사 회의</p>
               <p>• 오후 5:00 시설 점검</p>
             </div>
          </div>
        </div>

      </div>
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
