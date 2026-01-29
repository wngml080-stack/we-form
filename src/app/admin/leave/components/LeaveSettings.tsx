"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, Info } from "lucide-react";

export default function LeaveSettings() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-toss transition-all duration-500">
          <CardContent className="p-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Zap className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">휴가 유형 관리</h4>
              <p className="text-sm font-bold text-[var(--foreground-muted)] leading-relaxed">
                연차, 반차, 병가 등 센터 운영 정책에 맞는<br />다양한 휴가 유형을 설정할 수 있습니다.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Under Development
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-toss transition-all duration-500">
          <CardContent className="p-8 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">연차 부여 관리</h4>
              <p className="text-sm font-bold text-[var(--foreground-muted)] leading-relaxed">
                입사일 기준 또는 회계연도 기준으로<br />직원별 연차를 자동/수동 부여합니다.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Under Development
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[28px] border border-slate-100">
        <Info className="w-6 h-6 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-900">정책 설정 안내</p>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            상세 정책 설정 기능은 현재 개발 중입니다. 기본 연차 정책은 근로기준법을 준수하며, 센터별 커스텀 정책은 다음 업데이트에서 제공될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
