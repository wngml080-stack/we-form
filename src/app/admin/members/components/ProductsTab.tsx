"use client";

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
        alert(`상품 목록을 불러오는데 실패했습니다.\n에러: ${error?.message || '알 수 없는 오류'}`);
        return;
      }

      setProducts(data || []);
    } catch (error: any) {
      console.error("상품 조회 오류:", {
        message: error?.message,
        stack: error?.stack,
        full: JSON.stringify(error)
      });
      alert(`상품 목록을 불러오는데 실패했습니다.\n에러: ${error?.message || '알 수 없는 오류'}`);
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
      const isPTType = formData.membership_type === 'PT' || formData.membership_type === 'PPT';

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
        display_order: parseInt(formData.display_order) || 0,
      };

      const { error } = await supabase
        .from("membership_products")
        .insert(insertData);

      if (error) {
        console.error("상품 등록 실패:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: JSON.stringify(error)
        });

        // 중복 상품명 에러 처리
        if (error.code === "23505") {
          alert("이미 동일한 이름의 상품이 존재합니다.");
          throw error;
        }
        alert(`상품 등록에 실패했습니다.\n에러: ${error?.message || '알 수 없는 오류'}`);
        throw error;
      }

      alert("상품이 등록되었습니다.");
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
      const isPTType = formData.membership_type === 'PT' || formData.membership_type === 'PPT';

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
        display_order: parseInt(formData.display_order) || 0,
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
          alert("이미 동일한 이름의 상품이 존재합니다.");
          throw error;
        }
        alert(`상품 수정에 실패했습니다.\n에러: ${error?.message || '알 수 없는 오류'}`);
        throw error;
      }

      alert("상품이 수정되었습니다.");
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
        alert("상품 삭제에 실패했습니다.");
        return;
      }

      alert("상품이 삭제되었습니다.");
      await fetchProducts();
    } catch (error) {
      console.error("상품 삭제 오류:", error);
      alert("상품 삭제에 실패했습니다.");
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
        alert("상태 변경에 실패했습니다.");
        return;
      }

      await fetchProducts();
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경에 실패했습니다.");
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
