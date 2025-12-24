"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { DEFAULT_MEMBERSHIP_TYPES, DEFAULT_PAYMENT_METHODS } from "../../hooks/useSalesPageData";

interface SalesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMembershipTypes: any[];
  customPaymentMethods: any[];
  newMembershipType: string;
  newPaymentMethod: { name: string; code: string };
  onNewMembershipTypeChange: (value: string) => void;
  onNewPaymentMethodChange: (value: { name: string; code: string }) => void;
  onAddMembershipType: () => void;
  onAddPaymentMethod: () => void;
  onDeleteMembershipType: (id: string) => void;
  onDeletePaymentMethod: (id: string) => void;
}

export function SalesSettingsModal({
  isOpen, onClose,
  customMembershipTypes, customPaymentMethods,
  newMembershipType, newPaymentMethod,
  onNewMembershipTypeChange, onNewPaymentMethodChange,
  onAddMembershipType, onAddPaymentMethod,
  onDeleteMembershipType, onDeletePaymentMethod
}: SalesSettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">매출 설정</DialogTitle>
          <DialogDescription className="text-gray-500">회원권 유형과 결제방법을 관리합니다</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 회원권 유형 관리 */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-800">회원권 유형</Label>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">기본 항목</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_MEMBERSHIP_TYPES.map((type) => (
                  <Badge key={type.name} className={`${type.color} px-3 py-1.5`}>
                    {type.name}
                  </Badge>
                ))}
              </div>
              {customMembershipTypes.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-3">추가 항목</p>
                  <div className="flex flex-wrap gap-2">
                    {customMembershipTypes.map((type: any) => (
                      <Badge key={type.id} className="bg-gray-100 text-gray-700 px-3 py-1.5 flex items-center gap-2">
                        {type.name}
                        <button onClick={() => onDeleteMembershipType(type.id)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="새 회원권 유형 이름"
                value={newMembershipType}
                onChange={(e) => onNewMembershipTypeChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddMembershipType()}
              />
              <Button onClick={onAddMembershipType} size="sm" className="bg-[#2F80ED] text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 결제방법 관리 */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-800">결제방법</Label>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">기본 항목</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PAYMENT_METHODS.map((method) => (
                  <Badge key={method.code} className={`${method.color} px-3 py-1.5`}>
                    {method.name}
                  </Badge>
                ))}
              </div>
              {customPaymentMethods.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-3">추가 항목</p>
                  <div className="flex flex-wrap gap-2">
                    {customPaymentMethods.map((method: any) => (
                      <Badge key={method.id} className="bg-gray-100 text-gray-700 px-3 py-1.5 flex items-center gap-2">
                        {method.name}
                        <button onClick={() => onDeletePaymentMethod(method.id)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="새 결제방법 이름"
                value={newPaymentMethod.name}
                onChange={(e) => onNewPaymentMethodChange({ ...newPaymentMethod, name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="코드 (영문)"
                value={newPaymentMethod.code}
                onChange={(e) => onNewPaymentMethodChange({ ...newPaymentMethod, code: e.target.value })}
                className="w-32"
              />
              <Button onClick={onAddPaymentMethod} size="sm" className="bg-[#2F80ED] text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">코드는 내부 식별용이며, 비워두면 이름을 기반으로 자동 생성됩니다.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
