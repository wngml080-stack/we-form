"use client";

import { Button } from "@/components/ui/button";
import { Calculator, AlertTriangle, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import type { StaffSalaryResult } from "../types";

interface SalaryMobileCardsProps {
  results: StaffSalaryResult[];
  isLoading: boolean;
  monthlySalesByTrainer: Record<string, number>;
  onOpenSettings: (staff: StaffSalaryResult) => void;
}

export function SalaryMobileCards({
  results,
  isLoading,
  monthlySalesByTrainer,
  onOpenSettings,
}: SalaryMobileCardsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Calculator className="w-10 h-10 text-blue-200 mb-3" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
          Calculating...
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <h4 className="text-sm font-black text-slate-700 tracking-tight mb-1.5 text-center">
          승인된 보고서가 없습니다
        </h4>
        <p className="text-xs font-bold text-slate-400 mb-4 text-center">
          급여 정산을 위해 먼저 직원 보고서를 승인해주세요.
        </p>
        <Link href="/admin/reports">
          <Button className="h-9 px-4 bg-[#2F80ED] hover:bg-[#1c6cd7] text-white rounded-lg font-black text-[10px] shadow-lg shadow-blue-100 flex items-center gap-1.5 transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
            보고서 승인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 py-4">
      {results.map((result) => (
        <div
          key={result.staff_id}
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all"
        >
          {/* 헤더: 이름 + 설정 버튼 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
                {result.staff_name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">
                  {result.staff_name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {result.job_position || "Staff"}
                </p>
              </div>
            </div>
            <Button
              onClick={() => onOpenSettings(result)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* 실수령액 강조 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 mb-3">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">
              실수령액 (예상)
            </p>
            <p className="text-xl font-black text-slate-900 tracking-tighter">
              {result.net_salary.toLocaleString()}
              <span className="text-[10px] font-bold text-slate-400 ml-1">원</span>
            </p>
          </div>

          {/* PT/OT 세션 정보 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-50/50 rounded-lg p-2 text-center">
              <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">
                PT
              </p>
              <p className="text-sm font-black text-slate-700">
                {result.stats.pt_inside_count + result.stats.pt_outside_count + result.stats.pt_weekend_count}
                <span className="text-[9px] font-bold text-slate-400 ml-0.5">회</span>
              </p>
            </div>
            <div className="bg-teal-50/50 rounded-lg p-2 text-center">
              <p className="text-[8px] font-black text-teal-400 uppercase mb-0.5">
                OT
              </p>
              <p className="text-sm font-black text-slate-700">
                {result.stats.ot_count || 0}
                <span className="text-[9px] font-bold text-slate-400 ml-0.5">회</span>
              </p>
            </div>
            <div className="bg-emerald-50/50 rounded-lg p-2 text-center">
              <p className="text-[8px] font-black text-emerald-400 uppercase mb-0.5">
                매출
              </p>
              <p className="text-[11px] font-black text-slate-700">
                {((monthlySalesByTrainer[result.staff_id] || 0) / 10000).toFixed(0)}
                <span className="text-[9px] font-bold text-slate-400 ml-0.5">만</span>
              </p>
            </div>
          </div>

          {/* 급여 상세 */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-slate-50 rounded-lg p-1.5 xs:p-2">
              <p className="text-[7px] xs:text-[8px] font-black text-slate-400 mb-0.5">
                기본급
              </p>
              <p className="text-[10px] xs:text-[11px] font-bold text-slate-600">
                {result.base_salary.toLocaleString()}
                <span className="text-[7px] ml-0.5">원</span>
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-1.5 xs:p-2">
              <p className="text-[7px] xs:text-[8px] font-black text-emerald-400 mb-0.5">
                수업료
              </p>
              <p className="text-[10px] xs:text-[11px] font-bold text-emerald-500">
                {result.class_salary.toLocaleString()}
                <span className="text-[7px] ml-0.5">원</span>
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-1.5 xs:p-2">
              <p className="text-[7px] xs:text-[8px] font-black text-orange-400 mb-0.5">
                인센티브
              </p>
              <p className="text-[10px] xs:text-[11px] font-bold text-orange-500">
                {result.incentive_salary.toLocaleString()}
                <span className="text-[7px] ml-0.5">원</span>
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-1.5 xs:p-2">
              <p className="text-[7px] xs:text-[8px] font-black text-red-400 mb-0.5">
                공제
              </p>
              <p className="text-[10px] xs:text-[11px] font-bold text-red-500">
                {result.tax_deduction > 0
                  ? `-${result.tax_deduction.toLocaleString()}원`
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
