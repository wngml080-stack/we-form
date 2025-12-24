"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import {
  MembershipProduct,
  ProductFormData,
} from "@/types/membership";
import { ProductTable } from "./ProductTable";
import { ProductModal } from "./ProductModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductsTabProps {
  gymId: string;
  onProductsChange?: () => void; // 상품 변경 시 부모에게 알림
}

export function ProductsTab({ gymId, onProductsChange }: ProductsTabProps) {
  const [products, setProducts] = useState<MembershipProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MembershipProduct | null>(null);

  // 상품 목록 조회
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products?gym_id=${gymId}`);
      const result = await response.json();

      if (!response.ok) {
        toast.error(`상품 목록 조회 실패: ${result.error}`);
        return;
      }

      setProducts(result.data || []);
    } catch (error: any) {
      toast.error(`상품 목록 조회 실패: ${error?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gymId) {
      fetchProducts();
    }
  }, [gymId]);

  // 상품 등록
  const handleCreate = async (formData: ProductFormData) => {
    const isPTType = formData.membership_type === 'PT' || formData.membership_type === 'PPT' || formData.membership_type === 'GPT';
    const maxOrder = products.length > 0 ? Math.max(...products.map(p => p.display_order)) : 0;

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gym_id: gymId,
        name: formData.name.trim(),
        membership_type: formData.membership_type,
        default_sessions: formData.default_sessions ? parseInt(formData.default_sessions) : null,
        default_price: parseFloat(formData.default_price),
        validity_months: !isPTType && formData.validity_months ? parseInt(formData.validity_months) : null,
        days_per_session: isPTType && formData.days_per_session ? parseInt(formData.days_per_session) : null,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
        display_order: maxOrder + 1,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.code === "23505") {
        toast.error("이미 동일한 이름의 상품이 존재합니다.");
      } else {
        toast.error(`상품 등록 실패: ${result.error}`);
      }
      throw new Error(result.error);
    }

    toast.success("상품이 등록되었습니다.");
    await fetchProducts();
    onProductsChange?.(); // 부모 컴포넌트에 알림
  };

  // 상품 수정
  const handleUpdate = async (formData: ProductFormData) => {
    if (!editingProduct) return;

    const isPTType = formData.membership_type === 'PT' || formData.membership_type === 'PPT' || formData.membership_type === 'GPT';

    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingProduct.id,
        gym_id: gymId,
        name: formData.name.trim(),
        membership_type: formData.membership_type,
        default_sessions: formData.default_sessions ? parseInt(formData.default_sessions) : null,
        default_price: parseFloat(formData.default_price),
        validity_months: !isPTType && formData.validity_months ? parseInt(formData.validity_months) : null,
        days_per_session: isPTType && formData.days_per_session ? parseInt(formData.days_per_session) : null,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.code === "23505") {
        toast.error("이미 동일한 이름의 상품이 존재합니다.");
      } else {
        toast.error(`상품 수정 실패: ${result.error}`);
      }
      throw new Error(result.error);
    }

    toast.success("상품이 수정되었습니다.");
    await fetchProducts();
    onProductsChange?.(); // 부모 컴포넌트에 알림
    setEditingProduct(null);
  };

  // 상품 삭제
  const handleDelete = async (product: MembershipProduct) => {
    if (!confirm(`"${product.name}" 상품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

    const response = await fetch(`/api/admin/products?id=${product.id}&gym_id=${gymId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      toast.error(`상품 삭제 실패: ${result.error}`);
      return;
    }

    toast.success("상품이 삭제되었습니다.");
    await fetchProducts();
    onProductsChange?.(); // 부모 컴포넌트에 알림
  };

  // 순서 변경
  const handleMoveUp = async (product: MembershipProduct, index: number) => {
    if (index === 0) return;

    const prevProduct = products[index - 1];

    // 두 상품의 display_order 교환
    await Promise.all([
      fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, gym_id: gymId, display_order: prevProduct.display_order }),
      }),
      fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prevProduct.id, gym_id: gymId, display_order: product.display_order }),
      }),
    ]);

    await fetchProducts();
    onProductsChange?.();
  };

  const handleMoveDown = async (product: MembershipProduct, index: number) => {
    if (index === products.length - 1) return;

    const nextProduct = products[index + 1];

    await Promise.all([
      fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, gym_id: gymId, display_order: nextProduct.display_order }),
      }),
      fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nextProduct.id, gym_id: gymId, display_order: product.display_order }),
      }),
    ]);

    await fetchProducts();
    onProductsChange?.();
  };

  // 활성/비활성 토글
  const handleToggleActive = async (product: MembershipProduct) => {
    const newStatus = !product.is_active;
    if (!confirm(`"${product.name}" 상품을 ${newStatus ? "활성" : "비활성"} 상태로 변경하시겠습니까?`)) return;

    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, gym_id: gymId, is_active: newStatus }),
    });

    if (!response.ok) {
      toast.error("상태 변경에 실패했습니다.");
      return;
    }

    await fetchProducts();
    onProductsChange?.();
  };

  const openEditModal = (product: MembershipProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (formData: ProductFormData) => {
    if (editingProduct) {
      await handleUpdate(formData);
    } else {
      await handleCreate(formData);
    }
  };

  return (
    <div className="space-y-6">
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

      <ProductTable
        products={products}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        isLoading={isLoading}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingProduct={editingProduct}
      />
    </div>
  );
}
