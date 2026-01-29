"use client";

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Users, Phone, UserCheck, CheckCircle2, AlertCircle, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// 활동 상태 타입
type ActivityStatus = 'absent' | 'rejected' | 'will_register' | 'considering' | 'contacted' | 'other';

// 활동 기록 타입
interface ActivityRecord {
  date: string;
  content: string;
  status?: ActivityStatus;
  staffName?: string;
  reason?: string;
  expectedDate?: string;
}

// 리뉴 대상자 인터페이스
interface RenewalMember {
  id: string;
  name: string;
  phone: string;
  membershipName: string;
  endDate: string;
  trainerName: string;
  memo?: string;
  activity1?: ActivityRecord;
  activity2?: ActivityRecord;
  activity3?: ActivityRecord;
  activity4?: ActivityRecord;
}

// 만기 분류 타입
type ExpiryType = 'this_month' | 'next_month' | 'after_next_month' | 'expired';

interface RenewalDashboardProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  isInitialized: boolean;
  members?: RenewalMember[];
}

// 만기 분류 함수
function getExpiryType(endDate: string): ExpiryType {
  const today = new Date();
  const end = new Date(endDate);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  if (end < thisMonthStart) return 'expired';
  if (end >= thisMonthStart && end <= thisMonthEnd) return 'this_month';
  if (end >= nextMonthStart && end <= nextMonthEnd) return 'next_month';
  return 'after_next_month';
}

// 활동 진행 상태 계산
function getActivityProgress(member: RenewalMember): string {
  if (member.activity4?.content) return '4차 완료';
  if (member.activity3?.content) return '3차 완료';
  if (member.activity2?.content) return '2차 완료';
  if (member.activity1?.content) return '1차 완료';
  return '미연락';
}

// 마지막 활동 결과 가져오기
function getLastActivityStatus(member: RenewalMember): ActivityStatus | null {
  if (member.activity4?.status) return member.activity4.status;
  if (member.activity3?.status) return member.activity3.status;
  if (member.activity2?.status) return member.activity2.status;
  if (member.activity1?.status) return member.activity1.status;
  return null;
}

const EXPIRY_COLORS = {
  this_month: '#EF4444',
  next_month: '#F59E0B',
  after_next_month: '#3B82F6',
  expired: '#94A3B8'
};

const PROGRESS_COLORS = {
  '미연락': '#94A3B8',
  '1차 완료': '#8B5CF6',
  '2차 완료': '#F59E0B',
  '3차 완료': '#3B82F6',
  '4차 완료': '#10B981'
};

const STATUS_COLORS = {
  absent: '#94A3B8',
  rejected: '#EF4444',
  will_register: '#10B981',
  considering: '#F59E0B',
  contacted: '#3B82F6',
  other: '#8B5CF6'
};

const STATUS_LABELS: Record<ActivityStatus, string> = {
  absent: '부재',
  rejected: '거절',
  will_register: '등록예정',
  considering: '고민중',
  contacted: '연락완료',
  other: '기타'
};

export function RenewalDashboard({
  selectedGymId,
  selectedCompanyId: _selectedCompanyId,
  isInitialized,
  members = []
}: RenewalDashboardProps) {

  // 만기 유형별 통계
  const expiryStats = useMemo(() => {
    const stats = {
      this_month: 0,
      next_month: 0,
      after_next_month: 0,
      expired: 0
    };
    members.forEach(m => {
      const type = getExpiryType(m.endDate);
      stats[type]++;
    });
    return [
      { name: '당월만기', value: stats.this_month, color: EXPIRY_COLORS.this_month },
      { name: '익월만기', value: stats.next_month, color: EXPIRY_COLORS.next_month },
      { name: '익월이외', value: stats.after_next_month, color: EXPIRY_COLORS.after_next_month },
      { name: '만료자', value: stats.expired, color: EXPIRY_COLORS.expired },
    ];
  }, [members]);

  // 활동 진행 현황 통계
  const progressStats = useMemo(() => {
    const stats: Record<string, number> = {
      '미연락': 0,
      '1차 완료': 0,
      '2차 완료': 0,
      '3차 완료': 0,
      '4차 완료': 0
    };
    members.forEach(m => {
      const progress = getActivityProgress(m);
      stats[progress]++;
    });
    return Object.entries(stats).map(([name, value]) => ({
      name,
      value,
      color: PROGRESS_COLORS[name as keyof typeof PROGRESS_COLORS]
    }));
  }, [members]);

  // 활동 결과 현황 통계
  const statusStats = useMemo(() => {
    const stats: Record<ActivityStatus, number> = {
      absent: 0,
      rejected: 0,
      will_register: 0,
      considering: 0,
      contacted: 0,
      other: 0
    };
    members.forEach(m => {
      const status = getLastActivityStatus(m);
      if (status) {
        stats[status]++;
      }
    });
    return (Object.keys(stats) as ActivityStatus[]).map(key => ({
      name: STATUS_LABELS[key],
      value: stats[key],
      color: STATUS_COLORS[key]
    })).filter(s => s.value > 0);
  }, [members]);

  // 담당자별 통계
  const staffStats = useMemo(() => {
    const stats: Record<string, { total: number; contacted: number; willRegister: number }> = {};
    members.forEach(m => {
      const staff = m.trainerName || '미지정';
      if (!stats[staff]) {
        stats[staff] = { total: 0, contacted: 0, willRegister: 0 };
      }
      stats[staff].total++;
      const status = getLastActivityStatus(m);
      if (status && status !== 'absent') {
        stats[staff].contacted++;
      }
      if (status === 'will_register') {
        stats[staff].willRegister++;
      }
    });
    return Object.entries(stats).map(([name, data]) => ({
      name,
      총대상자: data.total,
      연락완료: data.contacted,
      등록예정: data.willRegister,
      연락률: data.total > 0 ? Math.round((data.contacted / data.total) * 100) : 0
    })).sort((a, b) => b.총대상자 - a.총대상자);
  }, [members]);

  // 긴급 대상자 (당월만기 중 미연락)
  const urgentMembers = useMemo(() => {
    return members.filter(m => {
      const type = getExpiryType(m.endDate);
      const progress = getActivityProgress(m);
      return type === 'this_month' && progress === '미연락';
    });
  }, [members]);

  // 등록 예정자
  const willRegisterMembers = useMemo(() => {
    return members.filter(m => getLastActivityStatus(m) === 'will_register');
  }, [members]);

  if (!isInitialized || !selectedGymId) {
    return null;
  }

  const totalMembers = members.length;
  const contactedMembers = members.filter(m => getActivityProgress(m) !== '미연락').length;
  const contactRate = totalMembers > 0 ? Math.round((contactedMembers / totalMembers) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 총 대상자 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-emerald-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">총 대상자</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalMembers}명</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">리뉴 관리 대상</p>
        </div>

        {/* 연락 완료 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-blue-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">연락 완료</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{contactedMembers}명</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${contactRate}%` }}
              />
            </div>
            <span className="text-xs font-black text-blue-600">{contactRate}%</span>
          </div>
        </div>

        {/* 긴급 대상 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-rose-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">긴급 대상</p>
          </div>
          <p className="text-3xl font-black text-rose-600">{urgentMembers.length}명</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">당월만기 + 미연락</p>
        </div>

        {/* 등록 예정 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-8 -mt-8 bg-amber-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">등록 예정</p>
          </div>
          <p className="text-3xl font-black text-amber-600">{willRegisterMembers.length}명</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">재등록 확정</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 만기 유형별 현황 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">만기 유형별 현황</h3>
          {expiryStats.some(s => s.value > 0) ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expiryStats.filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expiryStats.filter(s => s.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}명`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {expiryStats.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{item.value}명</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* 활동 진행 현황 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">활동 진행 현황</h3>
          {progressStats.some(s => s.value > 0) ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={progressStats.filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {progressStats.filter(s => s.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}명`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {progressStats.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{item.value}명</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* 활동 결과 현황 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">활동 결과 현황</h3>
          {statusStats.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}명`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {statusStats.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900">{item.value}명</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
              활동 데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 담당자별 현황 */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">담당자별 활동 현황</h3>
        </div>
        {staffStats.length > 0 ? (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {staffStats.map((staff) => (
              <div
                key={staff.name}
                className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-200/50 hover:shadow-md transition-all"
              >
                {/* 담당자 이름 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-white text-xs font-black">{staff.name.charAt(0)}</span>
                  </div>
                  <span className="font-black text-slate-900 text-sm">{staff.name}</span>
                </div>

                {/* 통계 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">대상자</span>
                    <span className="text-sm font-black text-slate-700">{staff.총대상자}명</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">연락완료</span>
                    <span className="text-sm font-black text-blue-600">{staff.연락완료}명</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">등록예정</span>
                    <span className="text-sm font-black text-emerald-600">{staff.등록예정}명</span>
                  </div>
                </div>

                {/* 연락률 프로그레스 바 */}
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-medium">연락률</span>
                    <span className={cn(
                      "text-xs font-black",
                      staff.연락률 >= 80 ? "text-emerald-600" :
                      staff.연락률 >= 50 ? "text-amber-600" : "text-rose-600"
                    )}>{staff.연락률}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        staff.연락률 >= 80 ? "bg-emerald-500" :
                        staff.연락률 >= 50 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${staff.연락률}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            담당자 데이터가 없습니다
          </div>
        )}
      </div>

      {/* 긴급 대상자 목록 & 등록 예정자 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 긴급 대상자 */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-black text-slate-900">긴급 대상자</h3>
            </div>
            <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[10px]">
              {urgentMembers.length}명
            </Badge>
          </div>
          {urgentMembers.length > 0 ? (
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {urgentMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.membershipName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-600">만료: {member.endDate}</p>
                      <p className="text-[10px] text-slate-400">{member.trainerName || '담당자 미지정'}</p>
                    </div>
                  </div>
                </div>
              ))}
              {urgentMembers.length > 5 && (
                <div className="p-3 text-center text-xs text-slate-400">
                  외 {urgentMembers.length - 5}명 더보기
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
              긴급 대상자가 없습니다
            </div>
          )}
        </div>

        {/* 등록 예정자 */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-black text-slate-900">등록 예정자</h3>
            </div>
            <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px]">
              {willRegisterMembers.length}명
            </Badge>
          </div>
          {willRegisterMembers.length > 0 ? (
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {willRegisterMembers.slice(0, 5).map((member) => {
                const lastActivity = member.activity4 || member.activity3 || member.activity2 || member.activity1;
                return (
                  <div key={member.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.membershipName}</p>
                      </div>
                      <div className="text-right">
                        {lastActivity?.expectedDate && (
                          <p className="text-xs font-bold text-emerald-600">예정: {lastActivity.expectedDate}</p>
                        )}
                        <p className="text-[10px] text-slate-400">{lastActivity?.staffName || member.trainerName}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {willRegisterMembers.length > 5 && (
                <div className="p-3 text-center text-xs text-slate-400">
                  외 {willRegisterMembers.length - 5}명 더보기
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              등록 예정자가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
