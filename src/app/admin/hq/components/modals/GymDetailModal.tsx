"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Building2, X, Calendar as CalendarIcon, Ruler, Info, TrendingUp, Users, CreditCard, Banknote, Target, MapPin, Activity } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { BepForm } from "../../hooks/useHqData";
import { cn } from "@/lib/utils";

interface GymDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGymDetail: any | null;
  members: any[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  isEditingBep: boolean;
  setIsEditingBep: (editing: boolean) => void;
  bepForm: BepForm;
  setBepForm: (form: BepForm) => void;
  onUpdateBep: () => void;
}

export function GymDetailModal({
  isOpen,
  onOpenChange,
  selectedGymDetail,
  members,
  selectedMonth,
  setSelectedMonth,
  isEditingBep,
  setIsEditingBep,
  bepForm,
  setBepForm,
  onUpdateBep
}: GymDetailModalProps) {
  if (!selectedGymDetail) return null;

  const gymMembers = members.filter(m => m.gym_id === selectedGymDetail.id);
  const allPayments = gymMembers.flatMap((m: any) => m.payments || []);
  const isPT = (payment: any) => (payment.membership_type || '').toUpperCase().includes('PT');

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const recent3MonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  let filteredPayments = allPayments;
  if (selectedMonth === "current") {
    filteredPayments = allPayments.filter(p => new Date(p.created_at) >= currentMonthStart);
  } else if (selectedMonth === "previous") {
    filteredPayments = allPayments.filter(p => {
      const date = new Date(p.created_at);
      return date >= previousMonthStart && date <= previousMonthEnd;
    });
  } else if (selectedMonth === "recent3") {
    filteredPayments = allPayments.filter(p => new Date(p.created_at) >= recent3MonthsStart);
  }

  const ptPayments = filteredPayments.filter(p => isPT(p));
  const fcPayments = filteredPayments.filter(p => !isPT(p));

  const fcTotalSales = fcPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const fcNewPayments = fcPayments.filter(p => p.registration_type === '신규');
  const fcNewSales = fcNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const fcOnlineCount = fcPayments.filter(p => {
    const route = (p.visit_route || '').toLowerCase();
    return route.includes('인터넷') || route.includes('네이버') || route.includes('온라인');
  }).length;
  const fcWalkinCount = fcPayments.length - fcOnlineCount;
  const fcAvgPrice = fcPayments.length > 0 ? fcTotalSales / fcPayments.length : 0;
  const fcNewRate = fcPayments.length > 0 ? (fcNewPayments.length / fcPayments.length * 100) : 0;

  const ptTotalSales = ptPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const ptNewPayments = ptPayments.filter(p => p.registration_type === '신규');
  const ptRenewPayments = ptPayments.filter(p => p.registration_type === '리뉴');
  const ptNewSales = ptNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const ptRenewSales = ptRenewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const ptAvgPrice = ptPayments.length > 0 ? ptTotalSales / ptPayments.length : 0;
  const ptRenewRate = ptPayments.length > 0 ? (ptRenewPayments.length / ptPayments.length * 100) : 0;

  const fcBEP = isEditingBep ? bepForm.fc_bep : (selectedGymDetail.fc_bep || 75000000);
  const ptBEP = isEditingBep ? bepForm.pt_bep : (selectedGymDetail.pt_bep || 100000000);
  const fcBepRate = fcBEP > 0 ? (fcTotalSales / fcBEP * 100) : 0;
  const ptBepRate = ptBEP > 0 ? (ptTotalSales / ptBEP * 100) : 0;

  const periodText = selectedMonth === "current" ? "이번 달" : selectedMonth === "previous" ? "지난 달" : "최근 3개월";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{selectedGymDetail.name} 상세 현황</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">지점별 매출 및 BEP 달성도 실시간 분석</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">지점 상세 현황을 확인합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 필터 및 컨트롤 바 */}
          <div className="flex items-center justify-between">
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
              {[
                { id: "current", label: "이번 달" },
                { id: "previous", label: "지난 달" },
                { id: "recent3", label: "최근 3개월" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMonth(tab.id)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black transition-all",
                    selectedMonth === tab.id 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!isEditingBep ? (
              <Button
                variant="outline"
                onClick={() => setIsEditingBep(true)}
                className="h-11 px-6 rounded-xl font-black gap-2 border-slate-200"
              >
                <Pencil className="w-4 h-4" />
                BEP 목표 수정
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsEditingBep(false)} className="h-11 px-4 font-bold text-slate-400">취소</Button>
                <Button onClick={onUpdateBep} className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-white">목표 저장</Button>
              </div>
            )}
          </div>

          {/* 지점 기본 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center"><Ruler className="w-5 h-5 text-slate-400" /></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Size</p><p className="text-lg font-black text-slate-900">{selectedGymDetail.size || '-'}평</p></div>
            </div>
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center"><CalendarIcon className="w-5 h-5 text-slate-400" /></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Open Date</p><p className="text-lg font-black text-slate-900">{selectedGymDetail.open_date || '-'}</p></div>
            </div>
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center gap-4 md:col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center"><MapPin className="w-5 h-5 text-slate-400" /></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Categories</p><p className="text-lg font-black text-slate-900 truncate">{selectedGymDetail.category || '-'}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* FC 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">FC 매출 상세 (회원권/부가상품)</h3>
              </div>
              
              <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16"></div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FC BEP Target</p>
                    {isEditingBep ? (
                      <Input type="number" value={bepForm.fc_bep} onChange={(e) => setBepForm({ ...bepForm, fc_bep: Number(e.target.value) })} className="h-12 bg-slate-50 border-none rounded-2xl font-black text-xl focus:ring-2 focus:ring-amber-100" />
                    ) : (
                      <p className="text-2xl font-black text-slate-900">₩{fcBEP.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current FC Sales</p>
                    <p className="text-2xl font-black text-amber-600">₩{fcTotalSales.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Achievement Rate</span>
                    <span className={cn("text-xl font-black", fcBepRate >= 100 ? "text-emerald-500" : "text-amber-500")}>{fcBepRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", fcBepRate >= 100 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${Math.min(fcBepRate, 100)}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-50">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xl font-black text-slate-900">{fcPayments.length}건</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Walk-in</p>
                    <p className="text-xl font-black text-blue-600">{fcWalkinCount}건</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Online</p>
                    <p className="text-xl font-black text-purple-600">{fcOnlineCount}건</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PT 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Activity className="w-5 h-5" /></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">PT 매출 상세 (수업/수강권)</h3>
              </div>
              
              <div className="bg-slate-900 rounded-2xl xs:rounded-3xl sm:rounded-[40px] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
                
                <div className="grid grid-cols-2 gap-8 text-white">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PT BEP Target</p>
                    {isEditingBep ? (
                      <Input type="number" value={bepForm.pt_bep} onChange={(e) => setBepForm({ ...bepForm, pt_bep: Number(e.target.value) })} className="h-12 bg-white/5 border-none rounded-2xl font-black text-xl text-white focus:ring-2 focus:ring-blue-500/30" />
                    ) : (
                      <p className="text-2xl font-black text-white">₩{ptBEP.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current PT Sales</p>
                    <p className="text-2xl font-black text-blue-400">₩{ptTotalSales.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Achievement Rate</span>
                    <span className={cn("text-xl font-black", ptBepRate >= 100 ? "text-emerald-400" : "text-blue-400")}>{ptBepRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", ptBepRate >= 100 ? "bg-emerald-400" : "bg-blue-400")} style={{ width: `${Math.min(ptBepRate, 100)}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-8 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-lg font-black text-white">{ptPayments.length}건</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">New</p>
                    <p className="text-lg font-black text-blue-400">{ptNewPayments.length}건</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Renew</p>
                    <p className="text-lg font-black text-emerald-400">{ptRenewPayments.length}건</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rate</p>
                    <p className="text-lg font-black text-purple-400">{ptRenewRate.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 특이사항 메모 섹션 */}
          {selectedGymDetail.memo && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><Info className="w-5 h-5" /></div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">지점 특이사항 메모</h3>
              </div>
              <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">{selectedGymDetail.memo}</p>
              </div>
            </section>
          )}
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end flex-shrink-0">
          <Button onClick={() => onOpenChange(false)} className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-black font-black text-white shadow-xl shadow-slate-100 hover:-translate-y-1 transition-all">
            대시보드 닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
