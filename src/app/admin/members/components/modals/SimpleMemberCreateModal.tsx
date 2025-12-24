"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { MembershipProduct } from "@/types/membership";

interface StaffMember {
  id: string;
  name: string;
  job_title: string;
}

interface SimpleMemberFormData {
  name: string;
  phone: string;
  birth_date: string;
  gender: string;
  trainer_id: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  memo: string;
  membership_product_id: string;
  membership_start_date: string;
  membership_end_date: string;
}

const INITIAL_FORM_DATA: SimpleMemberFormData = {
  name: "",
  phone: "",
  birth_date: "",
  gender: "",
  trainer_id: "",
  exercise_goal: "",
  weight: "",
  body_fat_mass: "",
  skeletal_muscle_mass: "",
  memo: "",
  membership_product_id: "",
  membership_start_date: "",
  membership_end_date: "",
};

interface SimpleMemberCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MembershipProduct[];
  staffList: StaffMember[];
  gymId: string;
  companyId: string;
  onSuccess: () => void;
}

export function SimpleMemberCreateModal({
  isOpen,
  onClose,
  products,
  staffList,
  gymId,
  companyId,
  onSuccess,
}: SimpleMemberCreateModalProps) {
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SimpleMemberFormData>(INITIAL_FORM_DATA);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // 폼 초기화
  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedProductId("");
  };

  // 모달 닫기
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  // 회원 등록 처리
  const handleSubmit = async () => {
    // 필수 항목 검증
    if (!formData.name || !formData.phone) {
      toast.warning("필수 항목을 모두 입력해주세요. (회원명, 연락처)");
      return;
    }

    // 회원권 선택 시 시작일/종료일 필수
    if (formData.membership_product_id) {
      if (!formData.membership_start_date || !formData.membership_end_date) {
        toast.warning("회원권 시작일과 종료일을 입력해주세요.");
        return;
      }
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 회원 등록
      const { data: newMember, error: memberError } = await supabase
        .from("members")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          name: formData.name,
          phone: formData.phone,
          birth_date: formData.birth_date || null,
          gender: formData.gender || null,
          trainer_id: formData.trainer_id || null,
          exercise_goal: formData.exercise_goal || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          body_fat_mass: formData.body_fat_mass ? parseFloat(formData.body_fat_mass) : null,
          skeletal_muscle_mass: formData.skeletal_muscle_mass ? parseFloat(formData.skeletal_muscle_mass) : null,
          memo: formData.memo || null,
          status: "active",
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. 회원권이 선택된 경우 회원권 생성
      if (formData.membership_product_id && newMember) {
        const selectedProduct = products.find((p) => p.id === formData.membership_product_id);

        if (selectedProduct) {
          const { error: membershipError } = await supabase
            .from("member_memberships")
            .insert({
              gym_id: gymId,
              member_id: newMember.id,
              name: selectedProduct.name,
              total_sessions: selectedProduct.default_sessions,
              used_sessions: 0,
              start_date: formData.membership_start_date,
              end_date: formData.membership_end_date,
              status: "active",
            });

          if (membershipError) throw membershipError;
        }
      }

      showSuccess(
        formData.membership_product_id
          ? "회원과 회원권이 등록되었습니다!"
          : "회원이 등록되었습니다!"
      );
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("회원 등록 오류:", error);
      showError(error.message || "회원 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>수기회원등록</DialogTitle>
          <DialogDescription className="sr-only">
            회원 정보를 등록합니다
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* 필수 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
              필수 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  회원명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  연락처 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: formatPhoneNumberOnChange(e.target.value),
                    })
                  }
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">담당 트레이너</Label>
              <Select
                value={formData.trainer_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, trainer_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.job_title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 기본 정보 (선택) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
              기본 정보 (선택)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">생년월일</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">성별</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) =>
                    setFormData({ ...formData, gender: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="male">남성</SelectItem>
                    <SelectItem value="female">여성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">운동 목표</Label>
              <Input
                value={formData.exercise_goal}
                onChange={(e) =>
                  setFormData({ ...formData, exercise_goal: e.target.value })
                }
                placeholder="체중 감량, 근력 강화 등"
              />
            </div>
          </div>

          {/* 인바디 정보 (선택) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
              인바디 정보 (선택)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">체중 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  placeholder="70.0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">체지방량 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.body_fat_mass}
                  onChange={(e) =>
                    setFormData({ ...formData, body_fat_mass: e.target.value })
                  }
                  placeholder="15.0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">골격근량 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.skeletal_muscle_mass}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skeletal_muscle_mass: e.target.value,
                    })
                  }
                  placeholder="30.0"
                />
              </div>
            </div>
          </div>

          {/* 회원권 정보 (선택) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
              회원권 정보 (선택)
            </h3>

            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">상품 선택</Label>
              <Select
                value={selectedProductId || "none"}
                onValueChange={(productId) => {
                  if (productId === "none") {
                    setSelectedProductId("");
                    setFormData({
                      ...formData,
                      membership_product_id: "",
                      membership_start_date: "",
                      membership_end_date: "",
                    });
                  } else {
                    const product = products.find((p) => p.id === productId);
                    if (product) {
                      setSelectedProductId(productId);
                      setFormData({
                        ...formData,
                        membership_product_id: productId,
                      });
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="회원권을 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  <SelectItem value="none">선택 안 함</SelectItem>
                  {products
                    .filter((p) => p.is_active)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.membership_type})
                        {product.default_sessions &&
                          ` - ${product.default_sessions}회`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductId && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#0F4C5C]">
                      시작일 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.membership_start_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          membership_start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F4C5C]">
                      종료일 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.membership_end_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          membership_end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* 선택된 상품 정보 표시 */}
                {(() => {
                  const selectedProduct = products.find(
                    (p) => p.id === selectedProductId
                  );
                  return selectedProduct ? (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-sm text-blue-900 font-medium mb-1">
                        선택한 회원권 정보
                      </div>
                      <div className="text-sm text-blue-700">
                        회원권 유형: {selectedProduct.membership_type}
                        {selectedProduct.default_sessions &&
                          ` | 기본 횟수: ${selectedProduct.default_sessions}회`}
                        {selectedProduct.validity_months &&
                          ` | 유효기간: ${selectedProduct.validity_months}개월`}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        * 회원권은 등록 후 회원 상세 정보에서 확인할 수 있습니다.
                      </div>
                    </div>
                  ) : null;
                })()}
              </>
            )}
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label className="text-[#0F4C5C]">메모</Label>
            <Textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              placeholder="추가 메모사항이 있으면 입력하세요"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "등록 중..." : "등록하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
