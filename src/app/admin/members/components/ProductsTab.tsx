"use client";

import { toast } from "@/lib/toast";
import React, { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  MembershipProduct,
  ProductFormData,
  ProductInsertData,
  ProductUpdateData,
} from "@/types/membership";
import { ProductTable } from "./ProductTable";
import { ProductModal } from "./ProductModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductsTabProps {
  gymId: string;
}

export function ProductsTab({ gymId }: ProductsTabProps) {
  const [products, setProducts] = useState<MembershipProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MembershipProduct | null>(
    null
  );

  const supabase = createSupabaseClient();

  // 상품 목록 조회
  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("membership_products")
        .select("*")
        .eq("gym_id", gymId)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("상품 조회 실패:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: JSON.stringify(error)
        });
        toast.error(`상품 목록을 불러오는데 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
        return;
      }

      setProducts(data || []);
    } catch (error: any) {
      console.error("상품 조회 오류:", {
        message: error?.message,
        stack: error?.stack,
        full: JSON.stringify(error)
      });
      toast.error(`상품 목록을 불러오는데 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (gymId) {
      fetchProducts();
    }
  }, [gymId]);

  // 상품 등록
  const handleCreate = async (formData: ProductFormData) => {
    try {
      const isPTType = formData.membership_type === 'PT' || formData.membership_type === 'PPT' || formData.membership_type === 'GPT';

      // 새 상품은 마지막 순서로 자동 설정
      const maxOrder = products.length > 0
        ? Math.max(...products.map(p => p.display_order))
        : 0;

      const insertData: ProductInsertData = {
        gym_id: gymId,
        name: formData.name.trim(),
        membership_type: formData.membership_type as any,
        // 모든 타입에서 횟수 입력 가능 (선택사항)
        default_sessions: formData.default_sessions
          ? parseInt(formData.default_sessions)
          : null,
        default_price: parseFloat(formData.default_price),
        // 기타 타입만 유효기간(개월) 사용
        validity_months: !isPTType && formData.validity_months
          ? parseInt(formData.validity_months)
          : null,
        // PT/PPT만 1회당 며칠 사용
        days_per_session: isPTType && formData.days_per_session
          ? parseInt(formData.days_per_session)
          : null,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        display_order: maxOrder + 1,
      };

      console.log("상품 등록 시도:", insertData);

      const { data, error, status, statusText } = await supabase
        .from("membership_products")
        .insert(insertData)
        .select();

      console.log("상품 등록 응답:", { data, error, status, statusText });

      if (error) {
        console.error("상품 등록 실패:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          status,
          statusText,
          full: JSON.stringify(error, null, 2)
        });

        // 중복 상품명 에러 처리
        if (error.code === "23505") {
          toast.error("이미 동일한 이름의 상품이 존재합니다.");
          throw error;
        }
        toast.error(`상품 등록에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("상품이 생성되지 않음 - RLS 정책 확인 필요");
        toast.error("상품 등록 권한이 없습니다. 관리자에게 문의하세요.");
        throw new Error("Insert returned no data - possible RLS issue");
      }

      toast.success("상품이 등록되었습니다.");
      await fetchProducts();
    } catch (error: any) {
      console.error("상품 등록 오류:", {
        message: error?.message,
        stack: error?.stack,
        full: JSON.stringify(error)
      });
      throw error;
    }
  };

  // 상품 수정
  const handleUpdate = async (formData: ProductFormData) => {
    if (!editingProduct) return;

    try {
      const isPTType = formData.membership_type === 'PT' || formData.membership_type === 'PPT' || formData.membership_type === 'GPT';

      const updateData: ProductUpdateData = {
        name: formData.name.trim(),
        membership_type: formData.membership_type as any,
        // 모든 타입에서 횟수 입력 가능 (선택사항)
        default_sessions: formData.default_sessions
          ? parseInt(formData.default_sessions)
          : null,
        default_price: parseFloat(formData.default_price),
        // 기타 타입만 유효기간(개월) 사용
        validity_months: !isPTType && formData.validity_months
          ? parseInt(formData.validity_months)
          : null,
        // PT/PPT만 1회당 며칠 사용
        days_per_session: isPTType && formData.days_per_session
          ? parseInt(formData.days_per_session)
          : null,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        // display_order는 리스트에서 화살표로만 변경 (수정 시 유지)
      };

      const { error } = await supabase
        .from("membership_products")
        .update(updateData)
        .eq("id", editingProduct.id)
        .eq("gym_id", gymId);

      if (error) {
        console.error("상품 수정 실패:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: JSON.stringify(error)
        });

        // 중복 상품명 에러 처리
        if (error.code === "23505") {
          toast.error("이미 동일한 이름의 상품이 존재합니다.");
          throw error;
        }
        toast.error(`상품 수정에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
        throw error;
      }

      toast.success("상품이 수정되었습니다.");
      await fetchProducts();
      setEditingProduct(null);
    } catch (error: any) {
      console.error("상품 수정 오류:", {
        message: error?.message,
        stack: error?.stack,
        full: JSON.stringify(error)
      });
      throw error;
    }
  };

  // 상품 삭제
  const handleDelete = async (product: MembershipProduct) => {
    const confirmed = confirm(
      `"${product.name}" 상품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("membership_products")
        .delete()
        .eq("id", product.id)
        .eq("gym_id", gymId);

      if (error) {
        console.error("상품 삭제 실패:", error);
        toast.error("상품 삭제에 실패했습니다.");
        return;
      }

      toast.success("상품이 삭제되었습니다.");
      await fetchProducts();
    } catch (error) {
      console.error("상품 삭제 오류:", error);
      toast.error("상품 삭제에 실패했습니다.");
    }
  };

  // 순서 위로 이동
  const handleMoveUp = async (product: MembershipProduct, index: number) => {
    if (index === 0) return;

    try {
      const prevProduct = products[index - 1];
      const currentOrder = product.display_order;
      const prevOrder = prevProduct.display_order;

      // 두 상품의 display_order를 서로 바꿈
      const { error: error1 } = await supabase
        .from("membership_products")
        .update({ display_order: prevOrder })
        .eq("id", product.id)
        .eq("gym_id", gymId);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("membership_products")
        .update({ display_order: currentOrder })
        .eq("id", prevProduct.id)
        .eq("gym_id", gymId);

      if (error2) throw error2;

      await fetchProducts();
    } catch (error) {
      console.error("순서 변경 실패:", error);
      toast.error("순서 변경에 실패했습니다.");
    }
  };

  // 순서 아래로 이동
  const handleMoveDown = async (product: MembershipProduct, index: number) => {
    if (index === products.length - 1) return;

    try {
      const nextProduct = products[index + 1];
      const currentOrder = product.display_order;
      const nextOrder = nextProduct.display_order;

      // 두 상품의 display_order를 서로 바꿈
      const { error: error1 } = await supabase
        .from("membership_products")
        .update({ display_order: nextOrder })
        .eq("id", product.id)
        .eq("gym_id", gymId);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("membership_products")
        .update({ display_order: currentOrder })
        .eq("id", nextProduct.id)
        .eq("gym_id", gymId);

      if (error2) throw error2;

      await fetchProducts();
    } catch (error) {
      console.error("순서 변경 실패:", error);
      toast.error("순서 변경에 실패했습니다.");
    }
  };

  // 활성/비활성 토글
  const handleToggleActive = async (product: MembershipProduct) => {
    const newStatus = !product.is_active;
    const statusText = newStatus ? "활성" : "비활성";

    const confirmed = confirm(
      `"${product.name}" 상품을 ${statusText} 상태로 변경하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("membership_products")
        .update({ is_active: newStatus })
        .eq("id", product.id)
        .eq("gym_id", gymId);

      if (error) {
        console.error("상태 변경 실패:", error);
        toast.error("상태 변경에 실패했습니다.");
        return;
      }

      await fetchProducts();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  // 수정 모달 열기
  const openEditModal = (product: MembershipProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // 신규 등록 모달 열기
  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // 폼 제출 핸들러
  const handleSubmit = async (formData: ProductFormData) => {
    if (editingProduct) {
      await handleUpdate(formData);
    } else {
      await handleCreate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">상품 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            매출 등록 시 사용할 회원권 상품을 관리합니다
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          상품 등록
        </Button>
      </div>

      {/* 상품 테이블 */}
      <ProductTable
        products={products}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        isLoading={isLoading}
      />

      {/* 상품 등록/수정 모달 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingProduct={editingProduct}
      />
    </div>
  );
}
