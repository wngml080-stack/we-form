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
import { Plus, Trash2 } from "lucide-react";
import { formatPhoneNumberOnChange } from "@/lib/utils/phone-format";
import { showSuccess, showError } from "@/lib/utils/error-handler";
import { MembershipProduct } from "@/types/membership";

interface StaffMember {
  id: string;
  name: string;
  job_title: string;
}

interface AddonItem {
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

interface MembershipItem {
  id: string;
  product_id: string;
  membership_type: string;
  membership_name: string;
  registered_at: string;
  start_date: string;
  end_date: string;
  amount: string;
  total_sessions: string;
  days_per_session: string;
  duration_months: string;
  payment_method: string;
}

interface CreateFormData {
  name: string;
  phone: string;
  registered_at: string;
  membership_name: string;
  membership_type: string;
  total_sessions: string;
  membership_amount: string;
  start_date: string;
  end_date: string;
  days_per_session: string;
  duration_months: string;
  payment_method: string;
  registered_by: string;
  trainer_id: string;
  birth_date: string;
  gender: string;
  exercise_goal: string;
  weight: string;
  body_fat_mass: string;
  skeletal_muscle_mass: string;
  memo: string;
}

const INITIAL_CREATE_FORM: CreateFormData = {
  name: "",
  phone: "",
  registered_at: new Date().toISOString().split("T")[0],
  membership_name: "PT 30회",
  membership_type: "PT",
  total_sessions: "30",
  membership_amount: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  days_per_session: "7",
  duration_months: "",
  payment_method: "card",
  registered_by: "",
  trainer_id: "",
  birth_date: "",
  gender: "",
  exercise_goal: "",
  weight: "",
  body_fat_mass: "",
  skeletal_muscle_mass: "",
  memo: "",
};

interface NewMemberCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MembershipProduct[];
  staffList: StaffMember[];
  gymId: string;
  companyId: string;
  myStaffId: string | null;
  onSuccess: () => void;
}

export function NewMemberCreateModal({
  isOpen,
  onClose,
  products,
  staffList,
  gymId,
  companyId,
  myStaffId,
  onSuccess,
}: NewMemberCreateModalProps) {
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({
    ...INITIAL_CREATE_FORM,
    registered_by: myStaffId || "",
    trainer_id: myStaffId || "",
  });
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [newMemberAddons, setNewMemberAddons] = useState<AddonItem[]>([]);
  const [newMemberMemberships, setNewMemberMemberships] = useState<MembershipItem[]>([]);

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

  // 회원권 헬퍼 함수
  const createEmptyMembership = (): MembershipItem => ({
    id: crypto.randomUUID(),
    product_id: "",
    membership_type: "PT",
    membership_name: "",
    registered_at: new Date().toISOString().split("T")[0],
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    amount: "",
    total_sessions: "",
    days_per_session: "7",
    duration_months: "",
    payment_method: "card",
  });

  const addNewMemberMembership = () => {
    setNewMemberMemberships([...newMemberMemberships, createEmptyMembership()]);
  };

  const removeNewMemberMembership = (index: number) => {
    setNewMemberMemberships(newMemberMemberships.filter((_, i) => i !== index));
  };

  const updateNewMemberMembership = (
    index: number,
    field: keyof MembershipItem,
    value: string
  ) => {
    const updated = [...newMemberMemberships];
    updated[index] = { ...updated[index], [field]: value };

    const m = updated[index];
    if (
      field === "start_date" ||
      field === "total_sessions" ||
      field === "days_per_session" ||
      field === "duration_months" ||
      field === "membership_type"
    ) {
      updated[index].end_date = calculateEndDate(
        m.start_date,
        m.membership_type,
        m.total_sessions,
        m.days_per_session,
        m.duration_months
      );
    }

    setNewMemberMemberships(updated);
  };

  // 부가상품 헬퍼 함수
  const createEmptyAddon = (): AddonItem => ({
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

  const addNewMemberAddon = () => {
    setNewMemberAddons([...newMemberAddons, createEmptyAddon()]);
  };

  const removeNewMemberAddon = (index: number) => {
    setNewMemberAddons(newMemberAddons.filter((_, i) => i !== index));
  };

  const updateNewMemberAddon = (
    index: number,
    field: keyof AddonItem,
    value: string
  ) => {
    const updated = [...newMemberAddons];
    updated[index] = { ...updated[index], [field]: value };

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
    setNewMemberAddons(updated);
  };

  // 부가상품 저장
  const saveAddonPayments = async (
    memberId: string,
    addons: AddonItem[],
    registeredAt: string
  ) => {
    for (const addon of addons) {
      if (!addon.addon_type || !addon.amount) continue;

      const addonName =
        addon.addon_type === "기타" ? addon.custom_addon_name : addon.addon_type;
      const memoText = addon.locker_number
        ? `${addonName} (락커 ${addon.locker_number})`
        : addonName;

      await supabase.from("member_payments").insert({
        company_id: companyId,
        gym_id: gymId,
        member_id: memberId,
        amount: parseFloat(addon.amount),
        total_amount: parseFloat(addon.amount),
        method: addon.method,
        membership_type: "부가상품",
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

  // 폼 리셋
  const resetForm = () => {
    setCreateForm({
      ...INITIAL_CREATE_FORM,
      registered_by: myStaffId || "",
      trainer_id: myStaffId || "",
    });
    setSelectedProductId("");
    setNewMemberAddons([]);
    setNewMemberMemberships([]);
  };

  // 모달 닫기
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  // 회원 등록
  const handleCreateMember = async () => {
    if (!createForm.name || !createForm.phone) {
      toast.warning("필수 항목을 모두 입력해주세요. (회원명, 연락처)");
      return;
    }

    if (selectedProductId || createForm.membership_amount) {
      if (!createForm.registered_at || !createForm.membership_amount) {
        toast.warning("회원권 등록 시 등록날짜와 등록금액을 입력해주세요.");
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
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          name: createForm.name,
          phone: createForm.phone,
          birth_date: createForm.birth_date || null,
          gender: createForm.gender || null,
          registered_by: createForm.registered_by || myStaffId,
          trainer_id: createForm.trainer_id || null,
          exercise_goal: createForm.exercise_goal || null,
          weight: createForm.weight ? parseFloat(createForm.weight) : null,
          body_fat_mass: createForm.body_fat_mass
            ? parseFloat(createForm.body_fat_mass)
            : null,
          skeletal_muscle_mass: createForm.skeletal_muscle_mass
            ? parseFloat(createForm.skeletal_muscle_mass)
            : null,
          memo: createForm.memo || null,
          status: "active",
          created_at: createForm.registered_at,
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. 기본 회원권 등록
      if (selectedProductId || createForm.membership_amount) {
        const { data: membership, error: membershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: createForm.membership_name,
            membership_type: createForm.membership_type,
            total_sessions: parseInt(createForm.total_sessions) || 0,
            used_sessions: 0,
            start_date: createForm.start_date || createForm.registered_at,
            end_date: createForm.end_date || null,
            status: "active",
          })
          .select()
          .single();

        if (membershipError) throw membershipError;

        // 3. 결제 정보 등록
        const amount = parseFloat(createForm.membership_amount);
        const { error: paymentError } = await supabase
          .from("member_payments")
          .insert({
            company_id: companyId,
            gym_id: gymId,
            member_id: member.id,
            membership_id: membership.id,
            amount: amount,
            total_amount: amount,
            method: createForm.payment_method,
            membership_type: createForm.membership_type,
            registration_type: "신규",
            memo: `${createForm.membership_name} 신규 등록`,
            paid_at: createForm.registered_at,
          });

        if (paymentError) throw paymentError;

        // 4. 매출 로그
        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          staff_id: myStaffId,
          type: "sale",
          amount: amount,
          method: createForm.payment_method,
          memo: `${createForm.name} - ${createForm.membership_name} 신규 등록`,
          occurred_at: createForm.registered_at,
        });
      }

      // 5. 추가 회원권 등록
      for (const additionalMembership of newMemberMemberships) {
        if (!additionalMembership.product_id || !additionalMembership.amount) continue;

        const { data: addMembership, error: addMembershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id: gymId,
            member_id: member.id,
            name: additionalMembership.membership_name,
            membership_type: additionalMembership.membership_type,
            total_sessions: parseInt(additionalMembership.total_sessions) || 0,
            used_sessions: 0,
            start_date:
              additionalMembership.start_date || additionalMembership.registered_at,
            end_date: additionalMembership.end_date || null,
            status: "active",
          })
          .select()
          .single();

        if (addMembershipError) {
          console.error("추가 회원권 등록 실패:", addMembershipError);
          continue;
        }

        const addAmount = parseFloat(additionalMembership.amount);
        await supabase.from("member_payments").insert({
          company_id: companyId,
          gym_id: gymId,
          member_id: member.id,
          membership_id: addMembership.id,
          amount: addAmount,
          total_amount: addAmount,
          method: additionalMembership.payment_method,
          membership_type: additionalMembership.membership_type,
          registration_type: "신규",
          memo: `${additionalMembership.membership_name} 신규 등록 (추가)`,
          paid_at: additionalMembership.registered_at,
        });

        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          staff_id: myStaffId,
          type: "sale",
          amount: addAmount,
          method: additionalMembership.payment_method,
          memo: `${createForm.name} - ${additionalMembership.membership_name} 신규 등록 (추가)`,
          occurred_at: additionalMembership.registered_at,
        });
      }

      // 6. 부가상품 저장
      if (newMemberAddons.length > 0) {
        await saveAddonPayments(member.id, newMemberAddons, createForm.registered_at);
      }

      showSuccess("회원이 등록되었습니다!");
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      showError(error, "회원 등록");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신규 회원 등록</DialogTitle>
          <DialogDescription className="sr-only">
            신규 회원을 등록합니다
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* 1. 필수 정보 섹션 */}
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
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">
                  연락처 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      phone: formatPhoneNumberOnChange(e.target.value),
                    })
                  }
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">생년월일</Label>
                <Input
                  type="date"
                  value={createForm.birth_date}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, birth_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">성별</Label>
                <Select
                  value={createForm.gender}
                  onValueChange={(v) =>
                    setCreateForm({ ...createForm, gender: v })
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
          </div>

          {/* 2. 회원권 섹션 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold text-sm text-gray-700">회원권</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewMemberMembership}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                회원권 추가
              </Button>
            </div>

            {/* 기본 회원권 */}
            <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">기본 회원권</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">
                  회원권명 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(productId) => {
                    const product = products.find((p) => p.id === productId);
                    if (product) {
                      setSelectedProductId(productId);
                      setCreateForm({
                        ...createForm,
                        membership_name: product.name,
                        membership_type: product.membership_type || "PT",
                        total_sessions: product.default_sessions?.toString() || "0",
                        membership_amount: product.default_price.toString(),
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
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
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">회원권 유형</Label>
                  <Select
                    value={createForm.membership_type}
                    onValueChange={(v) => {
                      const newEndDate = calculateEndDate(
                        createForm.start_date,
                        v,
                        createForm.total_sessions,
                        createForm.days_per_session,
                        createForm.duration_months
                      );
                      setCreateForm({
                        ...createForm,
                        membership_type: v,
                        end_date: newEndDate,
                      });
                    }}
                  >
                    <SelectTrigger className="h-9">
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
                <div className="space-y-1">
                  <Label className="text-xs">등록날짜</Label>
                  <Input
                    type="date"
                    value={createForm.registered_at}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, registered_at: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    등록금액 (원) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={createForm.membership_amount}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        membership_amount: e.target.value,
                      })
                    }
                    placeholder="1000000"
                    className="h-9"
                  />
                </div>
              </div>

              {/* PT/PPT/GPT 타입 */}
              {isPTType(createForm.membership_type) ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      등록세션 (회) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={createForm.total_sessions}
                      onChange={(e) => {
                        const newEndDate = calculateEndDate(
                          createForm.start_date,
                          createForm.membership_type,
                          e.target.value,
                          createForm.days_per_session,
                          createForm.duration_months
                        );
                        setCreateForm({
                          ...createForm,
                          total_sessions: e.target.value,
                          end_date: newEndDate,
                        });
                      }}
                      placeholder="30"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">1회당 유효일수</Label>
                    <Input
                      type="number"
                      value={createForm.days_per_session}
                      onChange={(e) => {
                        const newEndDate = calculateEndDate(
                          createForm.start_date,
                          createForm.membership_type,
                          createForm.total_sessions,
                          e.target.value,
                          createForm.duration_months
                        );
                        setCreateForm({
                          ...createForm,
                          days_per_session: e.target.value,
                          end_date: newEndDate,
                        });
                      }}
                      placeholder="7"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      시작날짜 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={createForm.start_date}
                      onChange={(e) => {
                        const newEndDate = calculateEndDate(
                          e.target.value,
                          createForm.membership_type,
                          createForm.total_sessions,
                          createForm.days_per_session,
                          createForm.duration_months
                        );
                        setCreateForm({
                          ...createForm,
                          start_date: e.target.value,
                          end_date: newEndDate,
                        });
                      }}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">종료일 (자동계산)</Label>
                    <Input
                      type="date"
                      value={createForm.end_date}
                      readOnly
                      className="h-9 bg-gray-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      개월수 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={createForm.duration_months}
                      onChange={(e) => {
                        const newEndDate = calculateEndDate(
                          createForm.start_date,
                          createForm.membership_type,
                          createForm.total_sessions,
                          createForm.days_per_session,
                          e.target.value
                        );
                        setCreateForm({
                          ...createForm,
                          duration_months: e.target.value,
                          end_date: newEndDate,
                        });
                      }}
                      placeholder="3"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      시작날짜 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={createForm.start_date}
                      onChange={(e) => {
                        const newEndDate = calculateEndDate(
                          e.target.value,
                          createForm.membership_type,
                          createForm.total_sessions,
                          createForm.days_per_session,
                          createForm.duration_months
                        );
                        setCreateForm({
                          ...createForm,
                          start_date: e.target.value,
                          end_date: newEndDate,
                        });
                      }}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">종료일 (자동계산)</Label>
                    <Input
                      type="date"
                      value={createForm.end_date}
                      readOnly
                      className="h-9 bg-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">세션 (선택)</Label>
                    <Input
                      type="number"
                      value={createForm.total_sessions}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, total_sessions: e.target.value })
                      }
                      placeholder="횟수 제한 시 입력"
                      className="h-9"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">결제방법</Label>
                <Select
                  value={createForm.payment_method}
                  onValueChange={(v) =>
                    setCreateForm({ ...createForm, payment_method: v })
                  }
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
            </div>

            {/* 추가 회원권 */}
            {newMemberMemberships.map((membership, index) => (
              <div
                key={membership.id}
                className="border rounded-lg p-4 bg-gray-50 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    추가 회원권 #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNewMemberMembership(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    회원권명 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={membership.product_id}
                    onValueChange={(productId) => {
                      const product = products.find((p) => p.id === productId);
                      if (product) {
                        updateNewMemberMembership(index, "product_id", productId);
                        updateNewMemberMembership(index, "membership_name", product.name);
                        updateNewMemberMembership(
                          index,
                          "membership_type",
                          product.membership_type || "PT"
                        );
                        updateNewMemberMembership(
                          index,
                          "total_sessions",
                          product.default_sessions?.toString() || "0"
                        );
                        updateNewMemberMembership(
                          index,
                          "amount",
                          product.default_price.toString()
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="상품을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.default_sessions || 0}회 /{" "}
                          {product.default_price.toLocaleString()}원
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">회원권 유형</Label>
                    <Select
                      value={membership.membership_type}
                      onValueChange={(v) =>
                        updateNewMemberMembership(index, "membership_type", v)
                      }
                    >
                      <SelectTrigger className="h-9">
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
                  <div className="space-y-1">
                    <Label className="text-xs">등록날짜</Label>
                    <Input
                      type="date"
                      value={membership.registered_at}
                      onChange={(e) =>
                        updateNewMemberMembership(index, "registered_at", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      등록금액 (원) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={membership.amount}
                      onChange={(e) =>
                        updateNewMemberMembership(index, "amount", e.target.value)
                      }
                      placeholder="1000000"
                      className="h-9"
                    />
                  </div>
                </div>

                {isPTType(membership.membership_type) ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        등록세션 (회) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={membership.total_sessions}
                        onChange={(e) =>
                          updateNewMemberMembership(
                            index,
                            "total_sessions",
                            e.target.value
                          )
                        }
                        placeholder="30"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">1회당 유효일수</Label>
                      <Input
                        type="number"
                        value={membership.days_per_session}
                        onChange={(e) =>
                          updateNewMemberMembership(
                            index,
                            "days_per_session",
                            e.target.value
                          )
                        }
                        placeholder="7"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        시작날짜 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={membership.start_date}
                        onChange={(e) =>
                          updateNewMemberMembership(index, "start_date", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">종료일 (자동계산)</Label>
                      <Input
                        type="date"
                        value={membership.end_date}
                        readOnly
                        className="h-9 bg-gray-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        개월수 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        value={membership.duration_months}
                        onChange={(e) =>
                          updateNewMemberMembership(
                            index,
                            "duration_months",
                            e.target.value
                          )
                        }
                        placeholder="3"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        시작날짜 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={membership.start_date}
                        onChange={(e) =>
                          updateNewMemberMembership(index, "start_date", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">종료일 (자동계산)</Label>
                      <Input
                        type="date"
                        value={membership.end_date}
                        readOnly
                        className="h-9 bg-gray-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">세션 (선택)</Label>
                      <Input
                        type="number"
                        value={membership.total_sessions}
                        onChange={(e) =>
                          updateNewMemberMembership(
                            index,
                            "total_sessions",
                            e.target.value
                          )
                        }
                        placeholder="횟수 제한 시 입력"
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">결제방법</Label>
                  <Select
                    value={membership.payment_method}
                    onValueChange={(v) =>
                      updateNewMemberMembership(index, "payment_method", v)
                    }
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
              </div>
            ))}
          </div>

          {/* 3. 부가상품 섹션 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold text-sm text-gray-700">
                부가상품 추가 (선택)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewMemberAddon}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                부가상품 추가
              </Button>
            </div>

            {newMemberAddons.map((addon, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    부가상품 #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNewMemberAddon(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">상품 유형 *</Label>
                    <Select
                      value={addon.addon_type}
                      onValueChange={(v) =>
                        updateNewMemberAddon(index, "addon_type", v)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="개인락커">개인락커</SelectItem>
                        <SelectItem value="물품락커">물품락커</SelectItem>
                        <SelectItem value="운동복">운동복</SelectItem>
                        <SelectItem value="양말">양말</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {addon.addon_type === "기타" && (
                    <div className="space-y-1">
                      <Label className="text-xs">상품명 *</Label>
                      <Input
                        value={addon.custom_addon_name}
                        onChange={(e) =>
                          updateNewMemberAddon(
                            index,
                            "custom_addon_name",
                            e.target.value
                          )
                        }
                        placeholder="상품명"
                        className="h-9"
                      />
                    </div>
                  )}

                  {(addon.addon_type === "개인락커" ||
                    addon.addon_type === "물품락커") && (
                    <div className="space-y-1">
                      <Label className="text-xs">락커 번호</Label>
                      <Input
                        value={addon.locker_number}
                        onChange={(e) =>
                          updateNewMemberAddon(index, "locker_number", e.target.value)
                        }
                        placeholder="예: 15"
                        className="h-9"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">금액 *</Label>
                    <Input
                      type="number"
                      value={addon.amount}
                      onChange={(e) =>
                        updateNewMemberAddon(index, "amount", e.target.value)
                      }
                      placeholder="50000"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">결제방법</Label>
                    <Select
                      value={addon.method}
                      onValueChange={(v) =>
                        updateNewMemberAddon(index, "method", v)
                      }
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
                        onChange={(e) =>
                          updateNewMemberAddon(index, "duration", e.target.value)
                        }
                        placeholder="숫자"
                        className="h-9 flex-1"
                      />
                      <Select
                        value={addon.duration_type}
                        onValueChange={(v) =>
                          updateNewMemberAddon(index, "duration_type", v)
                        }
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

            {newMemberAddons.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                락커, 운동복 등 부가상품을 함께 등록할 수 있습니다.
              </p>
            )}
          </div>

          {/* 4. 담당자 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
              담당자 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">등록자</Label>
                <Select
                  value={createForm.registered_by}
                  onValueChange={(v) =>
                    setCreateForm({ ...createForm, registered_by: v })
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
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">담당트레이너</Label>
                <Select
                  value={createForm.trainer_id}
                  onValueChange={(v) =>
                    setCreateForm({ ...createForm, trainer_id: v })
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
          </div>

          {/* 5. 인바디 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
              인바디 정보 (선택)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">몸무게 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={createForm.weight}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, weight: e.target.value })
                  }
                  placeholder="70.5"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">체지방량 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={createForm.body_fat_mass}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, body_fat_mass: e.target.value })
                  }
                  placeholder="15.2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">골격근량 (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={createForm.skeletal_muscle_mass}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      skeletal_muscle_mass: e.target.value,
                    })
                  }
                  placeholder="32.1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">운동목적</Label>
                <Input
                  value={createForm.exercise_goal}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, exercise_goal: e.target.value })
                  }
                  placeholder="다이어트, 근력강화 등"
                />
              </div>
            </div>
          </div>

          {/* 6. 메모 섹션 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">메모</h3>

            <div className="space-y-2">
              <Textarea
                value={createForm.memo}
                onChange={(e) =>
                  setCreateForm({ ...createForm, memo: e.target.value })
                }
                placeholder="특이사항이나 메모를 입력하세요"
                rows={3}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateMember}
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
