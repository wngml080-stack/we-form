"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { BepForm } from "../../hooks/useHqData";

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

  // 회원 데이터 필터링
  const gymMembers = members.filter(m => m.gym_id === selectedGymDetail.id);

  // 해당 지점의 모든 결제 데이터 가져오기
  const allPayments = gymMembers.flatMap((m: any) => m.payments || []);

  // PT 여부 확인 함수 (membership_type에 PT가 포함되어 있으면 PT)
  const isPT = (payment: any) => {
    const membershipType = payment.membership_type || '';
    return membershipType.toUpperCase().includes('PT');
  };

  // 날짜 계산
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const recent3MonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  // 월별로 결제 데이터 필터링
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

  // PT와 FC로 결제 데이터 분류
  const ptPayments = filteredPayments.filter(p => isPT(p));
  const fcPayments = filteredPayments.filter(p => !isPT(p));

  // FC 통계
  const fcTotalSales = fcPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const fcNewPayments = fcPayments.filter(p => p.registration_type === '신규');
  const fcRenewPayments = fcPayments.filter(p => p.registration_type === '리뉴');
  const fcNewSales = fcNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // visit_route로 워크인/비대면 구분
  const fcOnlineCount = fcPayments.filter(p => {
    const route = (p.visit_route || '').toLowerCase();
    return route.includes('인터넷') || route.includes('네이버') || route.includes('온라인');
  }).length;
  const fcWalkinCount = fcPayments.length - fcOnlineCount;
  const fcAvgPrice = fcPayments.length > 0 ? fcTotalSales / fcPayments.length : 0;
  const fcNewRate = fcPayments.length > 0 ? (fcNewPayments.length / fcPayments.length * 100) : 0;

  // PT 통계
  const ptTotalSales = ptPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const ptNewPayments = ptPayments.filter(p => p.registration_type === '신규');
  const ptRenewPayments = ptPayments.filter(p => p.registration_type === '리뉴');
  const ptNewSales = ptNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const ptRenewSales = ptRenewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const ptAvgPrice = ptPayments.length > 0 ? ptTotalSales / ptPayments.length : 0;
  const ptRenewRate = ptPayments.length > 0 ? (ptRenewPayments.length / ptPayments.length * 100) : 0;

  // BEP
  const fcBEP = isEditingBep ? bepForm.fc_bep : (selectedGymDetail.fc_bep || 75000000);
  const ptBEP = isEditingBep ? bepForm.pt_bep : (selectedGymDetail.pt_bep || 100000000);
  const fcBepRate = fcBEP > 0 ? (fcTotalSales / fcBEP * 100) : 0;
  const ptBepRate = ptBEP > 0 ? (ptTotalSales / ptBEP * 100) : 0;

  // 기간 표시 텍스트
  const periodText = selectedMonth === "current" ? "이번 달" :
                    selectedMonth === "previous" ? "지난 달" :
                    "최근 3개월";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{selectedGymDetail.name} 상세 현황</DialogTitle>
            <DialogDescription className="sr-only">지점 상세 현황을 확인합니다</DialogDescription>
            {!isEditingBep ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingBep(true)}
                className="text-xs"
              >
                <Pencil className="w-3 h-3 mr-1" /> BEP 수정
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingBep(false);
                    setBepForm({
                      fc_bep: selectedGymDetail.fc_bep || 75000000,
                      pt_bep: selectedGymDetail.pt_bep || 100000000
                    });
                  }}
                  className="text-xs"
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={onUpdateBep}
                  className="text-xs bg-[#2F80ED] hover:bg-[#1c6cd7]"
                >
                  저장
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* 기간 선택 탭 */}
          <div className="flex items-center gap-2 border-b pb-3">
            <span className="text-sm font-semibold text-gray-700 mr-2">기간:</span>
            <div className="flex gap-2">
              <Button
                variant={selectedMonth === "current" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth("current")}
                className={selectedMonth === "current" ? "bg-[#2F80ED]" : ""}
              >
                이번 달
              </Button>
              <Button
                variant={selectedMonth === "previous" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth("previous")}
                className={selectedMonth === "previous" ? "bg-[#2F80ED]" : ""}
              >
                지난 달
              </Button>
              <Button
                variant={selectedMonth === "recent3" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth("recent3")}
                className={selectedMonth === "recent3" ? "bg-[#2F80ED]" : ""}
              >
                최근 3개월
              </Button>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              ({periodText} 데이터)
            </div>
          </div>

          {/* BEP 설정 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">BEP (손익분기점) 설정</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600 mb-1">FC BEP</Label>
                {isEditingBep ? (
                  <Input
                    type="number"
                    value={bepForm.fc_bep}
                    onChange={(e) => setBepForm({ ...bepForm, fc_bep: Number(e.target.value) })}
                    className="h-9"
                  />
                ) : (
                  <div className="text-xl font-bold text-gray-900">
                    ₩{fcBEP.toLocaleString()}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1">PT BEP</Label>
                {isEditingBep ? (
                  <Input
                    type="number"
                    value={bepForm.pt_bep}
                    onChange={(e) => setBepForm({ ...bepForm, pt_bep: Number(e.target.value) })}
                    className="h-9"
                  />
                ) : (
                  <div className="text-xl font-bold text-gray-900">
                    ₩{ptBEP.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">기본 정보</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">평수</div>
                <div className="font-medium text-gray-900">{selectedGymDetail.size || '-'}평</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">오픈일</div>
                <div className="font-medium text-gray-900">{selectedGymDetail.open_date || '-'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">운영 종목</div>
                <div className="font-medium text-gray-900 text-xs">
                  {selectedGymDetail.category ? selectedGymDetail.category.split(", ").join(", ") : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* FC 상세 DATA */}
          <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-sm">FC</span>
              회원권 / 부가상품 상세 DATA
            </h3>

            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="bg-white rounded-lg p-3 border border-amber-300">
                <div className="text-xs text-gray-600 mb-1">FC BEP</div>
                <div className="text-lg font-bold text-gray-900">₩{fcBEP.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-300">
                <div className="text-xs text-gray-600 mb-1">FC 총 매출</div>
                <div className="text-lg font-bold text-blue-600">₩{fcTotalSales.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-300">
                <div className="text-xs text-gray-600 mb-1">BEP 달성률</div>
                <div className={`text-lg font-bold ${fcBepRate >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {fcBepRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-300">
                <div className="text-xs text-gray-600 mb-1 flex items-center">FC 객단가<HelpTooltip content="1건당 평균 결제 금액" iconClassName="w-3 h-3" /></div>
                <div className="text-lg font-bold text-gray-900">₩{Math.round(fcAvgPrice).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                <div className="text-xs text-gray-600 mb-1">총 등록</div>
                <div className="text-xl font-bold text-gray-900">{fcPayments.length}</div>
                <div className="text-xs text-gray-500">건</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                <div className="text-xs text-gray-600 mb-1 flex items-center justify-center">워크인<HelpTooltip content="직접 방문 등록" iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-blue-600">{fcWalkinCount}</div>
                <div className="text-xs text-gray-500">건</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                <div className="text-xs text-gray-600 mb-1 flex items-center justify-center">비대면<HelpTooltip content="온라인/인터넷 등록" iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-purple-600">{fcOnlineCount}</div>
                <div className="text-xs text-gray-500">건</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                <div className="text-xs text-gray-600 mb-1 flex items-center justify-center">FC 리뉴얼<HelpTooltip content="기존 회원 재등록" iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-emerald-600">{fcRenewPayments.length}</div>
                <div className="text-xs text-gray-500">건</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                <div className="text-xs text-gray-600 mb-1 flex items-center justify-center">신규율<HelpTooltip content="신규 회원 비율" iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-orange-600">{fcNewRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-3 bg-white rounded-lg p-3 border border-amber-300">
              <div className="text-xs text-gray-600 mb-1">FC 신규매출 ({periodText})</div>
              <div className="text-2xl font-bold text-green-600">₩{fcNewSales.toLocaleString()}</div>
            </div>
          </div>

          {/* PT 상세 DATA */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-sm">PT</span>
              PT / PPT 상세 DATA
            </h3>

            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="text-xs text-gray-600 mb-1">PT BEP</div>
                <div className="text-lg font-bold text-gray-900">₩{ptBEP.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="text-xs text-gray-600 mb-1">PT 총 매출</div>
                <div className="text-lg font-bold text-blue-600">₩{ptTotalSales.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="text-xs text-gray-600 mb-1">BEP 달성률</div>
                <div className={`text-lg font-bold ${ptBepRate >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {ptBepRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="text-xs text-gray-600 mb-1 flex items-center">PT 객단가<HelpTooltip content="PT 1건당 평균 결제 금액" iconClassName="w-3 h-3" /></div>
                <div className="text-lg font-bold text-gray-900">₩{Math.round(ptAvgPrice).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                <div className="text-xs text-gray-600 mb-1">PT 총 등록</div>
                <div className="text-xl font-bold text-gray-900">{ptPayments.length}</div>
                <div className="text-xs text-gray-500">건</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                <div className="text-xs text-gray-600 mb-1">PT 신규</div>
                <div className="text-xl font-bold text-blue-600">{ptNewPayments.length}</div>
                <div className="text-xs text-gray-500">건</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                <div className="text-xs text-gray-600 mb-1">PT 재등록</div>
                <div className="text-xl font-bold text-emerald-600">{ptRenewPayments.length}</div>
                <div className="text-xs text-gray-500">건</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                <div className="text-xs text-gray-600 mb-1 flex items-center justify-center">재등록률<HelpTooltip content="기존 회원 재등록 비율" iconClassName="w-3 h-3" /></div>
                <div className="text-xl font-bold text-purple-600">
                  {ptRenewRate.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="text-xs text-gray-600 mb-1">신규 등록 매출</div>
                <div className="text-xl font-bold text-green-600">₩{ptNewSales.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-300">
                <div className="text-xs text-gray-600 mb-1">재등록 매출</div>
                <div className="text-xl font-bold text-emerald-600">₩{ptRenewSales.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 메모 */}
          {selectedGymDetail.memo && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">메모</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                {selectedGymDetail.memo}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
