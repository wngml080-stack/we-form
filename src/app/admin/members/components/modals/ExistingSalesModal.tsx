"use client";

import { useState, useMemo } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { MembershipProduct } from "@/types/membership";

interface Member {
  id: string;
  name: string;
  phone: string;
  birth_date?: string;
  gender?: string;
  exercise_goal?: string;
  weight?: number;
  body_fat_mass?: number;
  skeletal_muscle_mass?: number;
  trainer_id?: string;
  activeMembership?: {
    id: string;
    name: string;
    total_sessions: number;
    used_sessions: number;
    end_date?: string;
  };
}

interface AddonItem {
  product_id?: string;
  addon_type: string;
  custom_addon_name: string;
  locker_number: string;
  amount: string;
  duration: string;
  duration_type: "months" | "days";
  start_date: string;
  end_date: string;
  method: string;
}

interface ExistingSalesFormData {
  member_id: string;
  registration_type: string;
  membership_type: string;
  membership_name: string;
  total_sessions: string;
  additional_sessions: string;
  start_date: string;
  end_date: string;
  amount: string;
  total_amount: string;
  installment_count: string;
  installment_current: string;
  method: string;
  visit_route: string;
  memo: string;
  member_name: string;
  member_phone: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  trainer_id: string;
}

const INITIAL_FORM_DATA: ExistingSalesFormData = {
  member_id: "",
  registration_type: "",
  membership_type: "PT",
  membership_name: "PT 30회",
  total_sessions: "30",
  additional_sessions: "0",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  amount: "",
  total_amount: "",
  installment_count: "1",
  installment_current: "1",
  method: "card",
  visit_route: "",
  memo: "",
  member_name: "",
  member_phone: "",
  birth_date: "",
  gender: "",
  exercise_goal: "",
  weight: "",
  body_fat_mass: "",
  skeletal_muscle_mass: "",
  trainer_id: "",
};

interface ExistingSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  products: MembershipProduct[];
  gymId: string;
  companyId: string;
  myStaffId: string | null;
  onSuccess: () => void;
}

export function ExistingSalesModal({
  isOpen,
  onClose,
  members,
  products,
  gymId,
  companyId,
  myStaffId,
  onSuccess,
}: ExistingSalesModalProps) {
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExistingSalesFormData>(INITIAL_FORM_DATA);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [addons, setAddons] = useState<AddonItem[]>([]);

  // 부가상품 목록 필터링
  const addonProducts = useMemo(() => {
    return products.filter((p) => p.membership_type === "부가상품" && p.is_active);
  }, [products]);

  // PT/PPT/GPT 타입인지 확인
  const isPTType = (type: string) => ["PT", "PPT", "GPT"].includes(type);

  // 종료일 자동 계산
  const calculateEndDate = (
    startDate: string,
    membershipType: string,
    totalSessions: string,
    daysPerSession: string,
    durationMonths: string
  ): string => {
    if (!startDate) return "";

    const start = new Date(startDate);

    if (isPTType(membershipType)) {
      const sessions = parseInt(totalSessions) || 0;
      const days = parseInt(daysPerSession) || 7;
      const totalDays = sessions * days;
      const end = new Date(start);
      end.setDate(end.getDate() + totalDays - 1);
      return end.toISOString().split("T")[0];
    } else {
      const months = parseInt(durationMonths) || 0;
      if (months <= 0) return "";
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      end.setDate(end.getDate() - 1);
      return end.toISOString().split("T")[0];
    }
  };

  // 부가상품 추가/삭제/수정 헬퍼
  const createEmptyAddon = (): AddonItem => ({
    product_id: "",
    addon_type: "",
    custom_addon_name: "",
    locker_number: "",
    amount: "",
    duration: "",
    duration_type: "months",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    method: "card",
  });

  const addAddon = () => {
    setAddons([...addons, createEmptyAddon()]);
  };

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const updateAddon = (index: number, field: keyof AddonItem, value: string) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };

    // 상품 선택 시 상품명과 가격 자동 입력
    if (field === "product_id" && value) {
      const selectedProduct = addonProducts.find((p) => p.id === value);
      if (selectedProduct) {
        updated[index].addon_type = selectedProduct.name;
        updated[index].amount = selectedProduct.default_price.toString();
      }
    }

    // 기간 변경 시 종료일 자동 계산
    if (field === "duration" || field === "duration_type" || field === "start_date") {
      const addon = updated[index];
      if (addon.duration && addon.start_date) {
        const num = parseInt(addon.duration);
        const startDate = new Date(addon.start_date);
        const endDate = new Date(startDate);
        if (addon.duration_type === "months") {
          endDate.setMonth(endDate.getMonth() + num);
          endDate.setDate(endDate.getDate() - 1);
        } else {
          endDate.setDate(endDate.getDate() + num - 1);
        }
        updated[index].end_date = endDate.toISOString().split("T")[0];
      }
    }
    setAddons(updated);
  };

  // 부가상품 저장
  const saveAddonPayments = async (memberId: string, addonList: AddonItem[], registeredAt: string) => {
    for (const addon of addonList) {
      if (!addon.addon_type || !addon.amount) continue;

      const addonName = addon.addon_type === "기타" ? addon.custom_addon_name : addon.addon_type;
      const memoText = addon.locker_number ? `${addonName} (락커 ${addon.locker_number})` : addonName;

      await supabase.from("member_payments").insert({
        company_id: companyId,
        gym_id: gymId,
        member_id: memberId,
        amount: parseFloat(addon.amount),
        total_amount: parseFloat(addon.amount),
        method: addon.method,
        registration_type: "부가상품",
        memo: memoText,
        paid_at: registeredAt,
      });

      await supabase.from("sales_logs").insert({
        company_id: companyId,
        gym_id: gymId,
        staff_id: myStaffId,
        type: "sale",
        amount: parseFloat(addon.amount),
        method: addon.method,
        memo: `부가상품: ${memoText}`,
        occurred_at: registeredAt,
      });
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setMemberSearch("");
    setSelectedProductId("");
    setSelectedMember(null);
    setAddons([]);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!formData.member_id || !formData.registration_type) {
      toast.warning("회원과 등록 타입을 선택해주세요.");
      return;
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const member = members.find((m) => m.id === formData.member_id);
      if (!member) throw new Error("회원을 찾을 수 없습니다.");

      const registrationType = formData.registration_type;

      if (registrationType === "리뉴") {
        const activeMembership = member.activeMembership;
        if (!activeMembership) {
          toast.warning("활성 회원권이 없습니다. 부가상품으로 등록해주세요.");
          return;
        }

        const additionalSessions = parseInt(formData.additional_sessions || "0");
        const { error: updateError } = await supabase
          .from("member_memberships")
          .update({
            total_sessions: activeMembership.total_sessions + additionalSessions,
            end_date: formData.end_date || activeMembership.end_date,
            status: "active",
          })
          .eq("id", activeMembership.id);

        if (updateError) throw updateError;

        await supabase
          .from("members")
          .update({ status: "active" })
          .eq("id", member.id);
      } else if (registrationType === "기간변경") {
        const activeMembership = member.activeMembership;
        if (!activeMembership) {
          toast.warning("활성 회원권이 없습니다.");
          return;
        }

        const { error: updateError } = await supabase
          .from("member_memberships")
          .update({
            end_date: formData.end_date,
          })
          .eq("id", activeMembership.id);

        if (updateError) throw updateError;
      } else if (registrationType === "부가상품") {
        const { error: membershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: formData.membership_name,
            total_sessions: parseInt(formData.total_sessions),
            used_sessions: 0,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            status: "active",
          });

        if (membershipError) throw membershipError;
      }

      // 결제 내역 등록
      const amount = parseFloat(formData.amount);
      const totalAmount = formData.total_amount ? parseFloat(formData.total_amount) : amount;

      const { error: paymentError } = await supabase.from("member_payments").insert({
        company_id: companyId,
        gym_id: gymId,
        member_id: member.id,
        amount: amount,
        total_amount: totalAmount,
        installment_count: parseInt(formData.installment_count),
        installment_current: parseInt(formData.installment_current),
        method: formData.method,
        membership_type: formData.membership_type,
        registration_type: formData.registration_type,
        visit_route: formData.visit_route || null,
        memo: formData.memo || null,
        paid_at: formData.start_date,
      });

      if (paymentError) throw paymentError;

      // 회원 정보 업데이트
      const memberUpdateData: Record<string, unknown> = {};
      if (formData.member_name) memberUpdateData.name = formData.member_name;
      if (formData.member_phone) memberUpdateData.phone = formData.member_phone;
      if (formData.birth_date) memberUpdateData.birth_date = formData.birth_date;
      if (formData.gender) memberUpdateData.gender = formData.gender;
      if (formData.exercise_goal) memberUpdateData.exercise_goal = formData.exercise_goal;
      if (formData.weight) memberUpdateData.weight = parseFloat(formData.weight);
      if (formData.body_fat_mass) memberUpdateData.body_fat_mass = parseFloat(formData.body_fat_mass);
      if (formData.skeletal_muscle_mass)
        memberUpdateData.skeletal_muscle_mass = parseFloat(formData.skeletal_muscle_mass);
      if (formData.trainer_id) memberUpdateData.trainer_id = formData.trainer_id;

      if (Object.keys(memberUpdateData).length > 0) {
        const { error: memberUpdateError } = await supabase
          .from("members")
          .update(memberUpdateData)
          .eq("id", member.id);

        if (memberUpdateError) throw memberUpdateError;
      }

      // 부가상품 저장
      if (addons.length > 0) {
        await saveAddonPayments(member.id, addons, formData.start_date);
      }

      showSuccess("매출이 등록되었습니다!");
      resetForm();
      onClose();
      onSuccess();
    } catch (error: unknown) {
      showError(error, "매출 등록");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    if (!memberSearch.trim()) return true;
    const searchLower = memberSearch.toLowerCase();
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.phone?.includes(memberSearch)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>기존회원 매출등록</DialogTitle>
          <DialogDescription className="sr-only">
            기존 회원의 매출을 등록합니다
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* 회원 선택 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">회원 선택</h3>
            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">
                회원 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="회원 이름 또는 전화번호 검색..."
                className="mb-2"
              />
              <Select
                value={formData.member_id}
                onValueChange={(v) => {
                  const member = members.find((m) => m.id === v);
                  if (member) {
                    setSelectedMember(member);
                    setFormData({
                      ...formData,
                      member_id: v,
                      member_name: member.name || "",
                      member_phone: member.phone || "",
                      birth_date: member.birth_date || "",
                      gender: member.gender || "",
                      exercise_goal: member.exercise_goal || "",
                      weight: member.weight?.toString() || "",
                      body_fat_mass: member.body_fat_mass?.toString() || "",
                      skeletal_muscle_mass: member.skeletal_muscle_mass?.toString() || "",
                      trainer_id: member.trainer_id || "",
                    });
                  } else {
                    setFormData({ ...formData, member_id: v });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="회원 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  {filteredMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.phone})
                      {member.activeMembership && ` - ${member.activeMembership.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 등록 타입 선택 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">등록 타입</h3>
            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">
                등록 타입 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.registration_type}
                onValueChange={(v) => setFormData({ ...formData, registration_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="리뉴">리뉴 (회원권 갱신)</SelectItem>
                  <SelectItem value="기간변경">기간변경</SelectItem>
                  <SelectItem value="부가상품">부가상품 (새 회원권 추가)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 선택된 회원의 현재 회원권 정보 표시 */}
            {selectedMember && selectedMember.activeMembership && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-semibold text-blue-900 mb-2">현재 활성 회원권</div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• 회원권: {selectedMember.activeMembership.name}</div>
                  <div>
                    • 잔여횟수:{" "}
                    {selectedMember.activeMembership.total_sessions -
                      selectedMember.activeMembership.used_sessions}{" "}
                    / {selectedMember.activeMembership.total_sessions}회
                  </div>
                  {selectedMember.activeMembership.end_date && (
                    <div>
                      • 만료일:{" "}
                      {new Date(selectedMember.activeMembership.end_date).toLocaleDateString("ko-KR")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 리뉴: 상품 선택 및 추가 횟수 입력 */}
          {formData.registration_type === "리뉴" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">리뉴 정보</h3>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">상품 선택</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(productId) => {
                    const product = products.find((p) => p.id === productId);
                    if (product) {
                      setSelectedProductId(productId);
                      const membershipType = product.membership_type || "PT";
                      const totalSessions = product.default_sessions?.toString() || "0";
                      const daysPerSession = product.days_per_session?.toString() || "7";
                      const durationMonths = product.validity_months?.toString() || "";

                      const baseDate =
                        selectedMember?.activeMembership?.end_date || formData.start_date;
                      const endDate = calculateEndDate(
                        baseDate,
                        membershipType,
                        totalSessions,
                        daysPerSession,
                        durationMonths
                      );

                      setFormData({
                        ...formData,
                        membership_type: membershipType,
                        membership_name: product.name,
                        additional_sessions: totalSessions,
                        amount: product.default_price.toString(),
                        total_amount: product.default_price.toString(),
                        end_date: endDate,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px]">
                    {products.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        등록된 상품이 없습니다.
                        <br />
                        상품 관리 탭에서 먼저 상품을 등록해주세요.
                      </div>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.default_sessions || 0}회 /{" "}
                          {product.default_price.toLocaleString()}원
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedProductId && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <div className="text-blue-900 font-medium mb-1">선택한 상품 정보</div>
                    <div className="text-blue-700">
                      추가 횟수: {formData.additional_sessions}회 / 금액:{" "}
                      {parseInt(formData.amount || "0").toLocaleString()}원
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      * 필요시 횟수와 금액을 수정할 수 있습니다.
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">
                    추가 횟수 (회) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.additional_sessions}
                    onChange={(e) =>
                      setFormData({ ...formData, additional_sessions: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">
                    금액 (원) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value,
                        total_amount: e.target.value,
                      })
                    }
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">연장 만료일</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 기간변경: 만료일만 입력 */}
          {formData.registration_type === "기간변경" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">기간 정보</h3>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  새 만료일 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* 부가상품: 새 회원권 정보 입력 */}
          {formData.registration_type === "부가상품" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">회원권 정보</h3>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  회원권명 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(productId) => {
                    const product = products.find((p) => p.id === productId);
                    if (product) {
                      setSelectedProductId(productId);
                      const membershipType = product.membership_type || "PT";
                      const totalSessions = product.default_sessions?.toString() || "0";
                      const daysPerSession = product.days_per_session?.toString() || "7";
                      const durationMonths = product.validity_months?.toString() || "";

                      const endDate = calculateEndDate(
                        formData.start_date,
                        membershipType,
                        totalSessions,
                        daysPerSession,
                        durationMonths
                      );

                      setFormData({
                        ...formData,
                        membership_type: membershipType,
                        membership_name: product.name,
                        total_sessions: totalSessions,
                        amount: product.default_price.toString(),
                        total_amount: product.default_price.toString(),
                        end_date: endDate,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상품을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[200px]">
                    {products.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        등록된 상품이 없습니다.
                        <br />
                        상품 관리 탭에서 먼저 상품을 등록해주세요.
                      </div>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.default_sessions || 0}회 /{" "}
                          {product.default_price.toLocaleString()}원
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedProductId && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <div className="text-blue-900 font-medium mb-1">선택한 상품 정보</div>
                    <div className="text-blue-700">
                      기본 횟수: {formData.total_sessions}회 / 기본 가격:{" "}
                      {parseInt(formData.amount).toLocaleString()}원
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      * 필요시 횟수와 금액을 수정할 수 있습니다.
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">
                    총 횟수 (회) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.total_sessions}
                    onChange={(e) => setFormData({ ...formData, total_sessions: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">시작일</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">만료일</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 결제 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">결제 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  회원권 유형 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.membership_type}
                  onValueChange={(v) => setFormData({ ...formData, membership_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="헬스">헬스</SelectItem>
                    <SelectItem value="필라테스">필라테스</SelectItem>
                    <SelectItem value="PT">PT</SelectItem>
                    <SelectItem value="PPT">PPT</SelectItem>
                    <SelectItem value="GPT">GPT</SelectItem>
                    <SelectItem value="골프">골프</SelectItem>
                    <SelectItem value="GX">GX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  결제 방법 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.method}
                  onValueChange={(v) => setFormData({ ...formData, method: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="card">카드</SelectItem>
                    <SelectItem value="cash">현금</SelectItem>
                    <SelectItem value="transfer">계좌이체</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  이번 결제 금액 (원) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="1000000"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">전체 금액 (원)</Label>
                <Input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  placeholder="분할 시 전체 금액"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">분할 횟수</Label>
                <Input
                  type="number"
                  value={formData.installment_count}
                  onChange={(e) => setFormData({ ...formData, installment_count: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">현재 회차</Label>
                <Input
                  type="number"
                  value={formData.installment_current}
                  onChange={(e) =>
                    setFormData({ ...formData, installment_current: e.target.value })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">방문루트</Label>
                <Input
                  value={formData.visit_route}
                  onChange={(e) => setFormData({ ...formData, visit_route: e.target.value })}
                  placeholder="지인추천, 온라인 등"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#0F4C5C]">메모</Label>
              <Textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="특이사항이나 메모를 입력하세요"
                rows={3}
              />
            </div>
          </div>

          {/* 부가상품 추가 섹션 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold text-sm text-gray-700">부가상품 추가 (선택)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAddon}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                부가상품 추가
              </Button>
            </div>

            {addons.map((addon, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">부가상품 #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAddon(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">부가상품 선택 *</Label>
                    <Select
                      value={addon.product_id}
                      onValueChange={(v) => updateAddon(index, "product_id", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="상품 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {addonProducts.length > 0 ? (
                          addonProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.default_price.toLocaleString()}원)
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            등록된 부가상품이 없습니다
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">금액 *</Label>
                    <Input
                      type="number"
                      value={addon.amount}
                      onChange={(e) => updateAddon(index, "amount", e.target.value)}
                      placeholder="50000"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">결제방법</Label>
                    <Select
                      value={addon.method}
                      onValueChange={(v) => updateAddon(index, "method", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="card">카드</SelectItem>
                        <SelectItem value="cash">현금</SelectItem>
                        <SelectItem value="transfer">계좌이체</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">기간</Label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={addon.duration}
                        onChange={(e) => updateAddon(index, "duration", e.target.value)}
                        placeholder="숫자"
                        className="h-9 flex-1"
                      />
                      <Select
                        value={addon.duration_type}
                        onValueChange={(v) => updateAddon(index, "duration_type", v)}
                      >
                        <SelectTrigger className="h-9 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="months">개월</SelectItem>
                          <SelectItem value="days">일</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {addons.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                {addonProducts.length > 0
                  ? "부가상품을 추가하려면 위의 '부가상품 추가' 버튼을 클릭하세요."
                  : "상품관리에서 부가상품 유형의 상품을 먼저 등록해주세요."}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "등록 중..." : "등록하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
