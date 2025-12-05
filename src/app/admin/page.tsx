"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Users, DollarSign, Calendar, TrendingUp, UserPlus, CreditCard } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [gymName, setGymName] = useState("");
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: me } = await supabase
      .from("staffs")
      .select("gym_id, company_id, gyms(name)")
      .eq("user_id", user.id)
      .single();

    if (me) {
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      reserved: "예약",
      completed: "출석",
      no_show: "노쇼",
      no_show_deducted: "노쇼(공제)",
      service: "서비스"
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-[#2F80ED] to-[#764ba2] bg-clip-text text-transparent">
          대시보드
        </h1>
        <p className="text-base text-gray-600 mt-2 font-sans">{gymName}</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/members" className="block">
          <div className="card-modern p-6 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 font-sans">전체 회원</span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-[#2F80ED]" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-[#2F80ED] mb-1">{stats.totalMembers}명</div>
            <div className="text-xs text-gray-500 mt-2 font-sans">
              활성 {stats.activeMembers}명
            </div>
          </div>
        </Link>

        <Link href="/admin/sales" className="block">
          <div className="card-modern p-6 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 font-sans">오늘 매출</span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-emerald-600 mb-1">
              {formatCurrency(stats.todaySales)}
            </div>
            <div className="text-xs text-gray-500 mt-2 font-sans">
              이번 달 {formatCurrency(stats.monthSales)}
            </div>
          </div>
        </Link>

        <Link href="/admin/schedule" className="block">
          <div className="card-modern p-6 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600 font-sans">오늘 스케줄</span>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-purple-600 mb-1">{stats.todaySchedules}건</div>
            <div className="text-xs text-gray-500 mt-2 font-sans">
              예정된 수업
            </div>
          </div>
        </Link>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-modern p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-purple-50 border-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-blue-700 font-sans">이번 달 신규 회원</span>
            <div className="p-2 rounded-lg bg-white/50">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-blue-700">{stats.newMembersThisMonth}명</div>
        </div>

        <div className="card-modern p-6 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 border-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-emerald-700 font-sans">회원 활성률</span>
            <div className="p-2 rounded-lg bg-white/50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-emerald-700">
            {stats.totalMembers > 0
              ? ((stats.activeMembers / stats.totalMembers) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      {/* 오늘 스케줄 */}
      <div className="card-modern">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-heading font-bold text-gray-800">오늘의 스케줄</h3>
          <Link href="/admin/schedule">
            <span className="text-sm text-[#2F80ED] hover:underline cursor-pointer font-sans font-medium">
              전체 보기 →
            </span>
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {todaySchedules.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-sans">오늘 예정된 스케줄이 없습니다.</div>
          ) : (
            todaySchedules.slice(0, 5).map((schedule) => (
              <div key={schedule.id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(schedule.status)} group-hover:scale-125 transition-transform`} />
                  <div>
                    <div className="font-heading font-semibold text-gray-800">{schedule.member_name}</div>
                    <div className="text-xs text-gray-500 mt-1 font-sans">
                      {new Date(schedule.start_time).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' '}-{' '}
                      {new Date(schedule.end_time).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-heading font-semibold text-gray-700">{schedule.type}</div>
                  <div className="text-xs text-gray-500 font-sans">{getStatusLabel(schedule.status)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 최근 결제 */}
      <div className="card-modern">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-heading font-bold text-gray-800">최근 결제 내역</h3>
          <Link href="/admin/sales">
            <span className="text-sm text-[#2F80ED] hover:underline cursor-pointer font-sans font-medium">
              전체 보기 →
            </span>
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-sans">최근 결제 내역이 없습니다.</div>
          ) : (
            recentPayments.map((payment) => (
              <div key={payment.id} className="p-5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    {/* @ts-ignore */}
                    <div className="font-heading font-semibold text-gray-800">{payment.members?.name || "-"}</div>
                    <div className="text-xs text-gray-500 mt-1 font-sans">
                      {new Date(payment.paid_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-bold text-[#2F80ED] text-lg">
                    {formatCurrency(parseFloat(payment.amount))}
                  </div>
                  <div className="text-xs text-gray-500 font-sans">{payment.method}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="card-modern p-6">
        <h3 className="text-lg font-heading font-bold text-gray-800 mb-6">빠른 작업</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/members">
            <button className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-[#2F80ED] hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 text-left transition-all group">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 w-fit mb-3 group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6 text-[#2F80ED]" />
              </div>
              <div className="text-sm font-heading font-semibold text-gray-800">회원 등록</div>
            </button>
          </Link>
          <Link href="/admin/schedule">
            <button className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 text-left transition-all group">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 w-fit mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-sm font-heading font-semibold text-gray-800">스케줄 확인</div>
            </button>
          </Link>
          <Link href="/admin/sales">
            <button className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 text-left transition-all group">
              <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 w-fit mb-3 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-sm font-heading font-semibold text-gray-800">매출 현황</div>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}