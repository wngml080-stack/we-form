"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MonthlyStats } from "../utils/statisticsUtils";

interface MonthlyStatsSectionProps {
  monthlyStats: MonthlyStats | null;
  year: number;
  month: number;
  mySubmissionStatus: "none" | "submitted" | "approved" | "rejected";
  onQuickAttendance: (scheduleId: string) => void;
  onSubmitMonth: () => void;
}

import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

// ... (existing helper functions if any)

export function MonthlyStatsSection({
  monthlyStats,
  year,
  month,
  mySubmissionStatus,
  onQuickAttendance,
  onSubmitMonth,
}: MonthlyStatsSectionProps) {
  const isLocked = mySubmissionStatus === "submitted" || mySubmissionStatus === "approved";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-300">
      {/* 월간 요약 카드 대시보드 */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              {year}년 {month}월 리포트
            </h2>
            <p className="text-slate-500 font-bold text-sm mt-2 ml-5 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              총 {monthlyStats?.total || 0}건의 일정 완료 · 누적 {monthlyStats?.totalHours?.toFixed(1) || 0}시간 수업 진행
            </p>
          </div>
          
          {monthlyStats && monthlyStats.total > 0 && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 min-w-[180px] shadow-xl shadow-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">월간 출석률</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black tracking-tighter">
                  {((monthlyStats.completed / monthlyStats.total) * 100).toFixed(0)}
                </span>
                <span className="text-xl font-bold text-blue-400">%</span>
              </div>
            </div>
          )}
        </div>

        {/* 요약 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { label: "PT 수업", value: monthlyStats?.ptStats?.total || 0, rate: monthlyStats?.ptStats?.attendanceRate, color: "blue", icon: TrendingUp },
            { label: "OT 예약", value: monthlyStats?.otStats?.total || 0, color: "purple", icon: Clock },
            { label: "상담 건수", value: monthlyStats?.consultingStats?.total || 0, color: "emerald", icon: CheckCircle2 },
            { label: "기타 일정", value: monthlyStats?.personalStats?.total || 0, color: "slate", icon: Calendar },
          ].map((item) => (
            <div key={item.label} className="group bg-slate-50/50 hover:bg-white rounded-[24px] p-6 border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
              <div className={`w-12 h-12 rounded-2xl mb-5 flex items-center justify-center transition-colors ${
                item.color === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                item.color === 'purple' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                'bg-slate-200 text-slate-600 group-hover:bg-slate-600 group-hover:text-white'
              }`}>
                <item.icon className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 tracking-tighter">{item.value}</span>
                <span className="text-sm font-bold text-slate-400">건</span>
              </div>
              {item.rate !== undefined && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${item.rate}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-blue-600">{item.rate}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 일자별 상세 집계 - 모던 테이블 */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
            일자별 데이터 상세 집계
          </h2>
          <Badge variant="outline" className="bg-slate-50 text-slate-500 font-bold px-3 py-1 rounded-lg border-gray-100">
            {month}월 전체 내역
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left py-4 px-6 font-bold text-[10px] text-slate-400 uppercase tracking-widest min-w-[120px]">날짜</th>
                <th className="text-left py-4 px-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest min-w-[250px]">PT 세션 상세</th>
                <th className="text-left py-4 px-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest min-w-[180px]">OT / 개인 일정</th>
                <th className="text-center py-4 px-4 font-bold text-[10px] text-slate-400 uppercase tracking-widest w-32">합계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyStats?.dailyStats && Object.keys(monthlyStats.dailyStats).length > 0 ? (
                Object.entries(monthlyStats.dailyStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateKey, dayStats]: [string, any]) => {
                    const date = new Date(dateKey);
                    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const shortDate = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

                    return (
                      <tr key={dateKey} className="group hover:bg-blue-50/30 transition-all">
                        {/* 날짜 */}
                        <td className="py-6 px-6 align-top">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-700">{shortDate}</span>
                            <Badge variant="secondary" className={`px-2 py-0 h-5 text-[10px] font-black rounded-md ${
                              isWeekend ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {dayOfWeek}
                            </Badge>
                          </div>
                        </td>

                        {/* PT 상세 */}
                        <td className="py-6 px-4 align-top">
                          <div className="bg-blue-50/30 rounded-xl p-3 border border-blue-50/50 space-y-2">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-black text-blue-600 uppercase w-6">PT</span>
                              <div className="flex items-center gap-3 text-slate-500">
                                <span className="flex items-center gap-1"><span className="font-bold text-blue-600">근무내</span> {dayStats.PT.inside}회</span>
                                <span className="w-px h-2 bg-slate-200"></span>
                                <span className="flex items-center gap-1"><span className="font-bold text-orange-500">근무외</span> {dayStats.PT.outside}회</span>
                                <span className="w-px h-2 bg-slate-200"></span>
                                <span className="flex items-center gap-1"><span className="font-bold text-purple-600">주말</span> {dayStats.PT.weekend}회</span>
                                <span className="w-px h-2 bg-slate-200"></span>
                                <span className="flex items-center gap-1"><span className="font-bold text-slate-400">서비스</span> {dayStats.PT.service}회</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* OT & 개인 상세 */}
                        <td className="py-6 px-4 align-top">
                          <div className="space-y-2">
                            {/* OT */}
                            <div className="bg-teal-50/30 rounded-xl p-2.5 border border-teal-50/50 flex items-center gap-2 text-[11px]">
                              <span className="font-black text-teal-600 uppercase w-6">OT</span>
                              <div className="flex items-center gap-3 text-slate-500">
                                <span className="flex items-center gap-1"><span className="font-bold text-teal-600">OT</span> {dayStats.OT.ot}회</span>
                                <span className="w-px h-2 bg-slate-200"></span>
                                <span className="flex items-center gap-1"><span className="font-bold text-teal-500">인바디</span> {dayStats.OT.inbody}회</span>
                              </div>
                            </div>
                            {/* 개인 */}
                            <div className="bg-indigo-50/30 rounded-xl p-2.5 border border-indigo-50/50 flex items-center gap-2 text-[11px]">
                              <span className="font-black text-indigo-600 uppercase w-6">개인</span>
                              <div className="flex items-center gap-3 text-slate-500">
                                <span className="flex items-center gap-1"><span className="font-bold text-indigo-600">내</span> {dayStats.Personal.inside.toFixed(1)}h</span>
                                <span className="w-px h-2 bg-slate-200"></span>
                                <span className="flex items-center gap-1"><span className="font-bold text-indigo-400">외</span> {dayStats.Personal.outside.toFixed(1)}h</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 합계 */}
                        <td className="py-6 px-4 text-center align-middle">
                          <div className="inline-flex flex-col items-center bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg shadow-slate-200 group-hover:bg-blue-600 transition-all">
                            <span className="text-base font-black tracking-tighter">{dayStats.total.count}건</span>
                            <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-200 uppercase tracking-widest">{dayStats.total.hours.toFixed(1)}h</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-bold">이번 달 등록된 수업 스케줄이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {monthlyStats?.dailyStats && Object.keys(monthlyStats.dailyStats).length > 0 && (
              <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td className="py-5 px-6 font-black uppercase text-xs tracking-widest text-blue-400">월간 합계</td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4 text-sm font-black">
                      <span className="text-blue-400">PT {monthlyStats.PT}회</span>
                      <span className="w-px h-3 bg-slate-700"></span>
                      <span className="text-slate-300">OT {monthlyStats.OT}회</span>
                      <span className="w-px h-3 bg-slate-700"></span>
                      <span className="text-emerald-400">상담 {monthlyStats.Consulting}건</span>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-4 text-sm font-black text-slate-300">
                      <span>GX {monthlyStats.GX}회</span>
                      <span className="w-px h-3 bg-slate-700"></span>
                      <span>개인 {monthlyStats.Personal}건</span>
                    </div>
                  </td>
                  <td className="text-center py-5 px-4">
                    <div className="inline-flex flex-col">
                      <span className="text-lg font-black tracking-tighter leading-none">{monthlyStats.total}건</span>
                      <span className="text-[10px] font-bold text-blue-400 mt-1 uppercase tracking-tighter">({monthlyStats.totalHours?.toFixed(1)} Hours)</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 출석 미등록 및 제출 영역 - 입체감 있는 디자인 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {monthlyStats && monthlyStats.unregistered > 0 && (
          <div className="bg-amber-50/50 rounded-[32px] p-8 border border-amber-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-amber-900 tracking-tight flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                출석 미등록 리스트
              </h2>
              <Badge className="bg-amber-600 text-white font-black px-3 py-1 rounded-xl">
                {monthlyStats.unregistered}건 대기
              </Badge>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {monthlyStats.unregisteredList?.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 bg-white rounded-[20px] border border-amber-100/50 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] tracking-tighter ${
                      schedule.type === 'PT' ? 'bg-blue-100 text-blue-600' :
                      schedule.type === 'OT' ? 'bg-purple-100 text-purple-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {schedule.type}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{schedule.member_name || '회원명 없음'}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {new Date(schedule.start_time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        {' '}{new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        {schedule.trainer_name && ` · ${schedule.trainer_name} 코치`}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => onQuickAttendance(schedule.id)}
                    disabled={isLocked}
                    className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-100 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  >
                    {isLocked ? "제출됨" : "즉시 출석"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center ${!monthlyStats || monthlyStats.unregistered === 0 ? 'lg:col-span-2 h-64' : ''}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
          
          <div className="relative z-10 text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight">월간 스케줄 확정</h3>
              <p className="text-slate-400 text-sm font-medium">모든 일정이 정리되었다면 관리자에게 스케줄을 전송하세요.</p>
            </div>

            <Button
              disabled={mySubmissionStatus === "submitted" || mySubmissionStatus === "approved"}
              className="w-full max-w-sm h-14 text-base font-black bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 disabled:bg-slate-800 disabled:text-slate-600 rounded-[20px] transition-all mx-auto"
              onClick={onSubmitMonth}
            >
              {mySubmissionStatus === "approved"
                ? "승인 완료 (수정 불가)"
                : mySubmissionStatus === "submitted"
                ? "전송 완료 · 승인 대기 중"
                : "스케줄 리포트 전송하기"}
            </Button>
            
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              Deadline: 매월 1일 ~ 5일 사이 전송 권장
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
