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

export function MonthlyStatsSection({
  monthlyStats,
  year,
  month,
  mySubmissionStatus,
  onQuickAttendance,
  onSubmitMonth,
}: MonthlyStatsSectionProps) {
  return (
    <div className="space-y-6">
      {/* 월간 요약 + 출석 현황 통합 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#2F80ED] rounded-full"></div>
              {year}년 {month}월 현황
            </h2>
            <p className="text-xs text-gray-500 mt-1 ml-3.5">
              총 {monthlyStats?.total || 0}건 · {monthlyStats?.totalHours?.toFixed(1) || 0}시간
            </p>
          </div>
          {/* 출석률 */}
          {monthlyStats && monthlyStats.total > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-500">출석률</div>
              <div className="text-2xl font-bold text-[#2F80ED]">
                {((monthlyStats.completed / monthlyStats.total) * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        {/* 계층 구조 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PT 예약 */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-800">PT 예약</span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-blue-600">{monthlyStats?.ptStats?.total || 0}건</span>
                {monthlyStats?.ptStats?.total && monthlyStats.ptStats.total > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    출석률 {monthlyStats?.ptStats?.attendanceRate || 0}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">수업완료 {monthlyStats?.ptStats?.completed || 0}</span>
              <span className="px-2 py-1 bg-red-50 text-red-600 rounded">노쇼(차감) {monthlyStats?.ptStats?.no_show_deducted || 0}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">노쇼 {monthlyStats?.ptStats?.no_show || 0}</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">서비스 {monthlyStats?.ptStats?.service || 0}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">취소 {monthlyStats?.ptStats?.cancelled || 0}</span>
            </div>
          </div>

          {/* OT 예약 */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-800">OT 예약</span>
              <span className="text-xl font-bold text-purple-600">{monthlyStats?.otStats?.total || 0}건</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">수업완료 {monthlyStats?.otStats?.completed || 0}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">노쇼 {monthlyStats?.otStats?.no_show || 0}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">취소 {monthlyStats?.otStats?.cancelled || 0}</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">PT전환 {monthlyStats?.otStats?.converted || 0}</span>
            </div>
          </div>

          {/* 상담 */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-800">상담</span>
              <span className="text-xl font-bold text-emerald-600">{monthlyStats?.consultingStats?.total || 0}건</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded">세일즈 {monthlyStats?.consultingStats?.sales || 0}</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">안내상담 {monthlyStats?.consultingStats?.info || 0}</span>
              <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded">현황상담 {monthlyStats?.consultingStats?.status || 0}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">기타 {monthlyStats?.consultingStats?.other || 0}</span>
            </div>
          </div>

          {/* 개인일정 */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-800">개인일정</span>
              <span className="text-xl font-bold text-gray-600">{monthlyStats?.personalStats?.total || 0}건</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">식사 {monthlyStats?.personalStats?.meal || 0}</span>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded">회의 {monthlyStats?.personalStats?.conference || 0}</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">미팅 {monthlyStats?.personalStats?.meeting || 0}</span>
              <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded">휴식 {monthlyStats?.personalStats?.rest || 0}</span>
              <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded">운동 {monthlyStats?.personalStats?.workout || 0}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">기타 {monthlyStats?.personalStats?.other || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 일자별 상세 집계 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gray-400 rounded-full"></div>
            일자별 상세 집계
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">날짜</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">PT</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">OT</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">상담</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">GX</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">개인</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">기타</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">합계</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats?.dailyStats && Object.keys(monthlyStats.dailyStats).length > 0 ? (
                Object.entries(monthlyStats.dailyStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateKey, dayStats]: [string, any]) => {
                    const date = new Date(dateKey);
                    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const shortDate = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

                    return (
                      <tr key={dateKey} className={`border-b border-gray-100 hover:bg-gray-50 ${isWeekend ? 'bg-gray-50' : ''}`}>
                        <td className="py-2 px-3">
                          <span className="font-medium text-gray-800">{shortDate}</span>
                          <span className={`ml-1 text-xs ${isWeekend ? 'text-red-500' : 'text-gray-400'}`}>({dayOfWeek})</span>
                        </td>
                        <td className="text-center py-2 px-3 text-gray-700">
                          {dayStats.PT.count > 0 ? `${dayStats.PT.count}회 (${dayStats.PT.hours.toFixed(1)}h)` : '-'}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-700">
                          {dayStats.OT.count > 0 ? `${dayStats.OT.count}회 (${dayStats.OT.hours.toFixed(1)}h)` : '-'}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-700">
                          {dayStats.Consulting.count > 0 ? `${dayStats.Consulting.count}건 (${dayStats.Consulting.hours.toFixed(1)}h)` : '-'}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-700">
                          {dayStats.GX.count > 0 ? `${dayStats.GX.count}회 (${dayStats.GX.hours.toFixed(1)}h)` : '-'}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-700">
                          {dayStats.Personal.count > 0 ? `${dayStats.Personal.count}건 (${dayStats.Personal.hours.toFixed(1)}h)` : '-'}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-700">
                          {dayStats.Other.count > 0 ? `${dayStats.Other.count}건 (${dayStats.Other.hours.toFixed(1)}h)` : '-'}
                        </td>
                        <td className="text-center py-2 px-3 font-semibold text-gray-900">
                          {dayStats.total.count}건 ({dayStats.total.hours.toFixed(1)}h)
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    이번 달 스케줄이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
            {/* 합계 행 */}
            {monthlyStats?.dailyStats && Object.keys(monthlyStats.dailyStats).length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                  <td className="py-2 px-3 text-gray-800">월 합계</td>
                  <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.PT}회</td>
                  <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.OT}회</td>
                  <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.Consulting}건</td>
                  <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.GX}회</td>
                  <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.Personal}건</td>
                  <td className="text-center py-2 px-3 text-gray-800">{monthlyStats.Other}건</td>
                  <td className="text-center py-2 px-3 text-gray-900 font-bold">
                    {monthlyStats.total}건 ({monthlyStats.totalHours?.toFixed(1)}h)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 출석 미등록자 리스트 */}
      {monthlyStats && monthlyStats.unregistered > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <div className="w-1.5 h-6 bg-yellow-500 rounded-full"></div>
              출석 미등록자 리스트
            </h2>
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
                  onClick={() => onQuickAttendance(schedule.id)}
                >
                  출석 처리
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 제출 버튼 영역 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <Button
          disabled={mySubmissionStatus === "submitted" || mySubmissionStatus === "approved"}
          className="w-full h-14 text-lg font-bold bg-[#2F80ED] hover:bg-[#1c6cd7] shadow-lg shadow-blue-200 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all"
          onClick={onSubmitMonth}
        >
          {mySubmissionStatus === "approved"
            ? "승인 완료 (수정 불가)"
            : mySubmissionStatus === "submitted"
            ? "승인 대기 중 (수정 불가)"
            : "관리자에게 스케줄 전송 (마감)"}
        </Button>
        <p className="text-xs text-gray-400 text-center mt-3">
          * 매월 1일 ~ 5일 사이에 전송해주세요. 전송 후에는 수정이 불가능합니다.
        </p>
      </div>
    </div>
  );
}
