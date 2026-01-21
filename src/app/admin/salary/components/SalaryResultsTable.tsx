"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calculator, AlertTriangle, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import type { StaffSalaryResult } from "../types";

interface SalaryResultsTableProps {
  results: StaffSalaryResult[];
  isLoading: boolean;
  monthlySalesByTrainer: Record<string, number>;
  onOpenSettings: (staff: StaffSalaryResult) => void;
}

export function SalaryResultsTable({
  results,
  isLoading,
  monthlySalesByTrainer,
  onOpenSettings,
}: SalaryResultsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 animate-pulse">
        <Calculator className="w-12 h-12 text-blue-200 mb-4" />
        <p className="text-slate-400 font-black text-xs uppercase tracking-widest">
          Calculating...
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h4 className="text-lg font-black text-slate-700 tracking-tight mb-2">
          승인된 보고서가 없습니다
        </h4>
        <p className="text-sm font-bold text-slate-400 mb-6">
          급여 정산을 위해 먼저 직원 보고서를 승인해주세요.
        </p>
        <Link href="/admin/reports">
          <Button className="h-10 px-5 bg-[#2F80ED] hover:bg-[#1c6cd7] text-white rounded-xl font-black text-xs shadow-lg shadow-blue-100 flex items-center gap-2 transition-all hover:-translate-y-0.5">
            <ExternalLink className="w-4 h-4" />
            보고서 승인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Table className="border-collapse w-full">
      <TableHeader>
        <TableRow className="bg-slate-50/80 border-b border-gray-100 hover:bg-slate-50/80">
          <TableHead className="px-4 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            직원 정보
          </TableHead>
          <TableHead className="px-2 py-5 text-center text-xs font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">
            PT 세션
          </TableHead>
          <TableHead className="px-2 py-5 text-center text-xs font-black text-teal-600 uppercase tracking-widest whitespace-nowrap">
            OT 세션
          </TableHead>
          <TableHead className="px-2 py-5 text-center text-xs font-black text-indigo-500 uppercase tracking-widest whitespace-nowrap">
            개인 일정
          </TableHead>
          <TableHead className="px-4 py-5 text-center text-xs font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">
            PT 매출액
          </TableHead>
          <TableHead className="px-3 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            기본급
          </TableHead>
          <TableHead className="px-3 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            수업료
          </TableHead>
          <TableHead className="px-3 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            인센티브
          </TableHead>
          <TableHead className="px-3 py-5 text-center text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">
            공제액
          </TableHead>
          <TableHead className="px-6 py-5 text-center text-xs font-black text-[#2F80ED] uppercase tracking-widest whitespace-nowrap">
            실수령액 (예상)
          </TableHead>
          <TableHead className="px-2 py-5 w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow
            key={result.staff_id}
            className="group hover:bg-blue-50/40 transition-all duration-300 border-b border-slate-50"
          >
            {/* 직원 정보 */}
            <TableCell className="px-4 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  {result.staff_name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900 text-sm tracking-tight">
                    {result.staff_name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {result.job_position || "Staff"}
                  </span>
                </div>
              </div>
            </TableCell>

            {/* PT 세션 */}
            <TableCell className="px-2 py-6 text-center">
              <div className="inline-flex flex-col gap-1 bg-blue-50/30 px-3 py-2 rounded-xl border border-blue-50 min-w-[120px]">
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-blue-600 font-black">내</span>
                  <span className="font-black text-slate-700">
                    {result.stats.pt_inside_count}
                  </span>
                  <span className="text-orange-500 font-black ml-1">외</span>
                  <span className="font-black text-slate-700">
                    {result.stats.pt_outside_count}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-purple-600 font-black">주</span>
                  <span className="font-black text-slate-700">
                    {result.stats.pt_weekend_count}
                  </span>
                  <span className="text-slate-400 font-black ml-1">서</span>
                  <span className="font-black text-slate-500">
                    {result.stats.cancelled_pt_count || 0}
                  </span>
                </div>
              </div>
            </TableCell>

            {/* OT 세션 */}
            <TableCell className="px-2 py-6 text-center">
              <div className="inline-flex flex-col gap-1 bg-teal-50/30 px-3 py-2 rounded-xl border border-teal-50 min-w-[80px]">
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-teal-600 font-black">OT</span>
                  <span className="font-black text-slate-700">
                    {result.stats.ot_count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-teal-500 font-black">IB</span>
                  <span className="font-black text-slate-700">
                    {result.stats.ot_inbody_count || 0}
                  </span>
                </div>
              </div>
            </TableCell>

            {/* 개인 일정 */}
            <TableCell className="px-2 py-6 text-center">
              <div className="inline-flex flex-col gap-1 bg-indigo-50/30 px-3 py-2 rounded-xl border border-indigo-50 min-w-[90px]">
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-indigo-500 font-black">내</span>
                  <span className="font-black text-slate-700">
                    {result.stats.personal_inside_count || 0}h
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px]">
                  <span className="text-indigo-400 font-black">외</span>
                  <span className="font-black text-slate-700">
                    {result.stats.personal_outside_count || 0}h
                  </span>
                </div>
              </div>
            </TableCell>

            {/* PT 매출 */}
            <TableCell className="px-4 py-6 text-center">
              <div className="text-sm font-black text-emerald-600">
                {(monthlySalesByTrainer[result.staff_id] || 0).toLocaleString()}
                <span className="text-[10px] font-bold text-emerald-400 ml-0.5">
                  원
                </span>
              </div>
            </TableCell>

            {/* 기본급 */}
            <TableCell className="px-2 py-6 text-center">
              <div className="inline-block px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 font-bold text-slate-500 text-sm min-w-[80px]">
                {result.base_salary.toLocaleString()}
              </div>
            </TableCell>

            {/* 수업료 */}
            <TableCell className="px-2 py-6 text-center">
              <div className="inline-block px-3 py-1.5 bg-emerald-50/50 rounded-lg border border-emerald-100 font-bold text-emerald-600 text-sm min-w-[80px]">
                {result.class_salary.toLocaleString()}
              </div>
            </TableCell>

            {/* 인센티브 */}
            <TableCell className="px-2 py-6 text-center">
              <div className="inline-block px-3 py-1.5 bg-orange-50/50 rounded-lg border border-orange-100 font-bold text-orange-500 text-sm min-w-[80px]">
                {result.incentive_salary.toLocaleString()}
              </div>
            </TableCell>

            {/* 공제액 */}
            <TableCell className="px-2 py-6 text-center text-rose-500 font-bold text-sm">
              {result.tax_deduction > 0
                ? `-${result.tax_deduction.toLocaleString()}`
                : "-"}
            </TableCell>

            {/* 실수령액 */}
            <TableCell className="px-6 py-6 text-center">
              <div className="text-base font-black text-slate-900 tracking-tighter group-hover:text-[#2F80ED] transition-colors">
                {result.net_salary.toLocaleString()}
                <span className="text-[9px] ml-1 opacity-30 font-bold uppercase tracking-widest">
                  KRW
                </span>
              </div>
            </TableCell>

            {/* 설정 버튼 */}
            <TableCell className="px-2 py-6 text-center">
              <Button
                onClick={() => onOpenSettings(result)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
              >
                <Settings className="w-4.5 h-4.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface SalaryTotalFooterProps {
  results: StaffSalaryResult[];
}

export function SalaryTotalFooter({ results }: SalaryTotalFooterProps) {
  if (results.length === 0) return null;

  const totalNet = results.reduce((acc, curr) => acc + curr.net_salary, 0);
  const totalGross = results.reduce((acc, curr) => acc + curr.total_salary, 0);
  const totalDeduction = results.reduce((acc, curr) => acc + curr.tax_deduction, 0);

  return (
    <div className="p-3 xs:p-4 sm:p-6 lg:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-4">
      <p className="text-[10px] xs:text-xs text-slate-400 font-bold leading-relaxed order-2 xs:order-1">
        세금 공제가 반영된 실수령액입니다.
        <br className="hidden xs:block" />
        <span className="xs:hidden"> </span>정산 확정 시 각 직원의 실적으로
        반영됩니다.
      </p>
      <div className="space-y-0.5 xs:space-y-1 text-right order-1 xs:order-2 w-full xs:w-auto">
        <p className="text-[8px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Total Net Payroll (실수령 합계)
        </p>
        <div className="text-xl xs:text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
          {totalNet.toLocaleString()}
          <span className="text-xs xs:text-sm sm:text-base ml-1 opacity-30 font-bold uppercase tracking-widest">
            KRW
          </span>
        </div>
        {totalDeduction > 0 && (
          <div className="flex items-center justify-end gap-2 xs:gap-3 text-[10px] xs:text-xs font-bold text-slate-400 mt-1">
            <span>세전: {totalGross.toLocaleString()}원</span>
            <span className="text-red-500">
              공제: -{totalDeduction.toLocaleString()}원
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
