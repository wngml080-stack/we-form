"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Plus, Banknote, Edit, ChevronDown, Calendar, Info, MapPin, Clock, Star, Sparkles, UserCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface Payment {
  id: string;
  member_name: string;
  phone?: string;
  sale_type: string;
  membership_category: string;
  membership_name: string;
  amount: number;
  method: string;
  installment?: number;
  trainer_id?: string;
  trainer_name?: string;
  memo?: string;
  payment_date: string;
  isNew?: boolean;
  // 상세 필드
  service_sessions?: number;
  validity_per_session?: number;
  membership_start_date?: string;
  visit_route?: string;
  expiry_type?: string;
}

interface PaymentsTableProps {
  payments: Payment[];
  staffList: Staff[];
  allSaleTypes: string[];
  allMembershipCategories: string[];
  allMembershipNames: string[];
  allPaymentMethods: string[];
  defaultInstallments: number[];
  editingId: string | null;
  editForm: Partial<Payment>;
  onStartEdit: (payment: Payment) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (id: string) => void;
  onEditFormChange: (field: string, value: string | number) => void;
  onSaveNewRow: () => void;
  onCancelNewRow: () => void;
  onNewRowChange: (field: string, value: string | number) => void;
  onAddOption?: (type: "sale_type" | "membership_category" | "membership_name", name: string) => void;
  onAddNewRow?: () => void;
}

// 추가 기능이 있는 Select 컴포넌트
function SelectWithAdd({
  value,
  options,
  placeholder,
  onChange,
  onAdd,
  className = "h-8 w-20 text-xs",
  triggerClassName = ""
}: {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  onAdd: (name: string) => void;
  className?: string;
  triggerClassName?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(newValue.trim());
      onChange(newValue.trim());
      setNewValue("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="flex gap-1 items-center bg-white p-1 rounded-xl border border-blue-200 shadow-sm animate-in zoom-in-95 duration-200">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="새 항목"
          className="h-8 flex-1 text-xs border-none focus-visible:ring-0"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") setIsAdding(false);
          }}
        />
        <Button size="sm" variant="ghost" onClick={handleAdd} className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 rounded-lg">
          <Save className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-50 rounded-lg">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={(v) => {
      if (v === "__add_new__") {
        setIsAdding(true);
      } else {
        onChange(v);
      }
    }}>
      <SelectTrigger className={cn(className, triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-1">
        {options.map(opt => (
          <SelectItem key={opt} value={opt} className="text-xs rounded-xl focus:bg-slate-50 font-medium">{opt}</SelectItem>
        ))}
        <SelectItem value="__add_new__" className="text-xs text-blue-600 font-black border-t border-slate-50 mt-1 pt-2 rounded-none">
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> 새 항목 추가
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function PaymentsTable({
  payments,
  staffList,
  allSaleTypes,
  allMembershipCategories,
  allMembershipNames,
  allPaymentMethods,
  defaultInstallments,
  editingId,
  editForm,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onEditFormChange,
  onSaveNewRow,
  onCancelNewRow,
  onNewRowChange,
  onAddOption,
  onAddNewRow
}: PaymentsTableProps) {
  const methodLabels: Record<string, string> = {
    card: "카드",
    cash: "현금",
    transfer: "계좌이체"
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}.${day}`;
  };

  const getSaleTypeColor = (type: string) => {
    switch (type) {
      case "신규": return "bg-blue-50 text-blue-600 border-blue-100";
      case "재등록": 
      case "리뉴": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "부가상품": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500 delay-500">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[120px]">Date</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[160px]">Member Info</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[140px]">Sale Type</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[240px]">Product Details</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[140px]">Amount</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[140px]">Payment</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[140px]">Staff</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[160px]">Memo</th>
              <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {payments.map((payment) => {
              const isEditing = editingId === payment.id || payment.isNew;
              const currentData = isEditing ? editForm : payment;
              
              const isPT = currentData.membership_category?.toUpperCase().includes("PT");
              const isNewSale = currentData.sale_type === "신규";
              const isRenewal = currentData.sale_type === "재등록" || currentData.sale_type === "리뉴";

              if (isEditing) {
                const onChangeHandler = payment.isNew ? onNewRowChange : onEditFormChange;
                const saveHandler = payment.isNew ? onSaveNewRow : onSaveEdit;
                const cancelHandler = payment.isNew ? onCancelNewRow : onCancelEdit;

                return (
                  <tr key={payment.id} className={cn("bg-slate-50/50 border-l-4", payment.isNew ? "border-l-blue-500" : "border-l-amber-500")}>
                    <td className="px-4 py-6">
                      <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          type="date"
                          value={editForm.payment_date || ""}
                          onChange={(e) => onChangeHandler("payment_date", e.target.value)}
                          className="h-11 pl-9 w-full text-xs border-none bg-white rounded-2xl font-black shadow-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="space-y-2">
                        <div className="relative group">
                          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                          <Input
                            value={editForm.member_name || ""}
                            onChange={(e) => onChangeHandler("member_name", e.target.value)}
                            placeholder="성함"
                            className="h-9 pl-9 w-full text-xs border-none bg-white rounded-xl font-black shadow-sm"
                          />
                        </div>
                        <Input
                          value={editForm.phone || ""}
                          onChange={(e) => onChangeHandler("phone", e.target.value)}
                          placeholder="연락처"
                          className="h-9 w-full text-xs border-none bg-white rounded-xl font-bold shadow-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="space-y-3">
                        <SelectWithAdd
                          value={editForm.sale_type || ""}
                          options={allSaleTypes}
                          onChange={(v) => onChangeHandler("sale_type", v)}
                          onAdd={(name) => onAddOption?.("sale_type", name)}
                          className="h-11 w-full text-xs bg-white rounded-2xl border-none shadow-sm font-black"
                        />
                        
                        {(isNewSale || isRenewal) && (
                          <div className="p-3 bg-white/80 rounded-2xl border border-slate-100 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
                            {isNewSale && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 ml-1">
                                  <MapPin className="w-3 h-3 text-blue-500" />
                                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Visit Route</Label>
                                </div>
                                <Select
                                  value={editForm.visit_route || "워크인"}
                                  onValueChange={(v) => onChangeHandler("visit_route", v)}
                                >
                                  <SelectTrigger className="h-9 w-full text-[11px] bg-slate-50 border-none rounded-xl text-slate-700 font-bold">
                                    <SelectValue placeholder="방문 경로 선택" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl">
                                    {["워크인", "인터넷", "지인추천", "인스타그램", "네이버", "전화상담", "기타"].map(route => (
                                      <SelectItem key={route} value={route} className="text-[11px] font-medium">{route}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {isRenewal && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 ml-1">
                                  <Clock className="w-3 h-3 text-emerald-500" />
                                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Expiry Status</Label>
                                </div>
                                <Select
                                  value={editForm.expiry_type || "60일 이내"}
                                  onValueChange={(v) => onChangeHandler("expiry_type", v)}
                                >
                                  <SelectTrigger className="h-9 w-full text-[11px] bg-slate-50 border-none rounded-xl text-slate-700 font-bold">
                                    <SelectValue placeholder="만기 구분 선택" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl">
                                    {["60일 이내", "60일 이외"].map(type => (
                                      <SelectItem key={type} value={type} className="text-[11px] font-medium">{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <SelectWithAdd
                            value={editForm.membership_category || ""}
                            options={allMembershipCategories}
                            placeholder="분류 선택"
                            onChange={(v) => onChangeHandler("membership_category", v)}
                            onAdd={(name) => onAddOption?.("membership_category", name)}
                            className="h-11 flex-1 text-xs bg-white rounded-2xl border-none shadow-sm font-black"
                          />
                          <SelectWithAdd
                            value={editForm.membership_name || ""}
                            options={allMembershipNames}
                            placeholder="상품명"
                            onChange={(v) => onChangeHandler("membership_name", v)}
                            onAdd={(name) => onAddOption?.("membership_name", name)}
                            className="h-11 flex-[1.5] text-xs bg-white rounded-2xl border-none shadow-sm font-black"
                          />
                        </div>
                        
                        {isPT && (
                          <div className="p-4 bg-white/80 rounded-[24px] border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Star className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">PT Special Options</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-tighter">Service sessions</Label>
                                <div className="relative group">
                                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                  <Input
                                    type="number"
                                    value={editForm.service_sessions || 0}
                                    onChange={(e) => onChangeHandler("service_sessions", parseInt(e.target.value) || 0)}
                                    className="h-9 pl-8 text-[11px] border-none bg-slate-50 rounded-xl font-black focus:bg-white transition-colors"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-tighter">Validity (Days)</Label>
                                <div className="relative group">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                                  <Input
                                    type="number"
                                    value={editForm.validity_per_session || 0}
                                    onChange={(e) => onChangeHandler("validity_per_session", parseInt(e.target.value) || 0)}
                                    className="h-9 pl-8 text-[11px] border-none bg-slate-50 rounded-xl font-black focus:bg-white transition-colors"
                                  />
                                </div>
                              </div>
                              <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-tighter">Membership Start Date</Label>
                                <div className="relative group">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                  <Input
                                    type="date"
                                    value={editForm.membership_start_date || ""}
                                    onChange={(e) => onChangeHandler("membership_start_date", e.target.value)}
                                    className="h-9 pl-9 text-[11px] border-none bg-slate-50 rounded-xl font-black focus:bg-white transition-colors"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="relative group">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <Input
                          type="number"
                          value={editForm.amount || ""}
                          onChange={(e) => onChangeHandler("amount", parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="h-11 pl-9 w-full text-sm border-none bg-white rounded-2xl font-black text-right shadow-sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="space-y-2">
                        <Select value={editForm.method || "card"} onValueChange={(v) => onChangeHandler("method", v)}>
                          <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-none shadow-sm font-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-1">
                            {allPaymentMethods.map(method => (
                              <SelectItem key={method} value={method} className="text-xs rounded-xl">{methodLabels[method] || method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={String(editForm.installment || 1)} onValueChange={(v) => onChangeHandler("installment", parseInt(v))}>
                          <SelectTrigger className="h-9 w-full text-xs bg-white rounded-xl border-none shadow-sm font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-1">
                            {defaultInstallments.map(num => (
                              <SelectItem key={num} value={String(num)} className="text-xs rounded-xl">{num === 1 ? "일시불" : `${num}개월`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <Select value={editForm.trainer_id || "none"} onValueChange={(v) => onChangeHandler("trainer_id", v === "none" ? "" : v)}>
                        <SelectTrigger className="h-11 w-full text-xs bg-white rounded-2xl border-none shadow-sm font-black">
                          <SelectValue placeholder="직원 선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-1">
                          <SelectItem value="none" className="text-xs font-black text-slate-300">없음</SelectItem>
                          {staffList.map(staff => (
                            <SelectItem key={staff.id} value={staff.id} className="text-xs font-bold rounded-xl">{staff.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-6">
                      <Input
                        value={editForm.memo || ""}
                        onChange={(e) => onChangeHandler("memo", e.target.value)}
                        placeholder="특이사항 입력"
                        className="h-11 w-full text-xs border-none bg-white rounded-2xl shadow-sm"
                      />
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={saveHandler} 
                          className={cn(
                            "h-10 w-10 p-0 rounded-xl shadow-lg transition-all",
                            payment.isNew ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                          )}
                        >
                          <Save className="w-5 h-5 text-white" />
                        </Button>
                        <Button variant="ghost" onClick={cancelHandler} className="h-10 w-10 p-0 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr 
                  key={payment.id} 
                  className="hover:bg-blue-50/20 transition-all cursor-pointer group" 
                  onDoubleClick={() => onStartEdit(payment)}
                >
                  <td className="px-6 py-6 text-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{formatDate(payment.payment_date)}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-black text-slate-900 leading-tight mb-1">{payment.member_name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{payment.phone || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Badge variant="outline" className={cn("rounded-xl px-3 py-1 font-black text-[10px] border-none shadow-sm uppercase tracking-widest", getSaleTypeColor(payment.sale_type))}>
                        {payment.sale_type}
                      </Badge>
                      {payment.sale_type === "신규" && payment.visit_route && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100/50">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">{payment.visit_route}</span>
                        </div>
                      )}
                      {(payment.sale_type === "재등록" || payment.sale_type === "리뉴") && payment.expiry_type && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">{payment.expiry_type}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{payment.membership_category}</span>
                      <span className="text-sm font-bold text-slate-700">{payment.membership_name}</span>
                      {payment.membership_category.toUpperCase().includes("PT") && (
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                          {payment.service_sessions ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100/50">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span className="text-[9px] font-black">SVC {payment.service_sessions}</span>
                            </div>
                          ) : null}
                          {payment.validity_per_session ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200">
                              <Clock className="w-2.5 h-2.5" />
                              <span className="text-[9px] font-black">{payment.validity_per_session}D/CLS</span>
                            </div>
                          ) : null}
                          {payment.membership_start_date ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded-md shadow-sm">
                              <Calendar className="w-2.5 h-2.5 text-blue-400" />
                              <span className="text-[9px] font-black uppercase tracking-tighter">{payment.membership_start_date}</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(payment.amount)}</span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{methodLabels[payment.method] || payment.method}</span>
                      <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none text-[9px] font-black px-2 py-0 rounded-md uppercase">
                        {payment.installment === 1 ? "Full Payment" : `${payment.installment} Months`}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                      <div className="w-7 h-7 rounded-xl bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {payment.trainer_name?.charAt(0) || "TR"}
                      </div>
                      <span className="text-xs font-black text-slate-600">{payment.trainer_name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-xs font-bold text-slate-400 truncate max-w-[140px] block mx-auto leading-relaxed">{payment.memo || "-"}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onStartEdit(payment); }} className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(payment.id); }} className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {payments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-32 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6 relative">
                      <Banknote className="w-10 h-10 text-slate-200" />
                      <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">기록된 매출 내역이 없습니다</h3>
                    <p className="text-slate-400 font-bold text-sm mt-2 max-w-xs mx-auto leading-relaxed">지점의 매출 성과를 실시간으로 기록하고 관리해보세요.</p>
                    <Button onClick={onAddNewRow} className="mt-10 h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 gap-2 transition-all hover:-translate-y-1">
                      <Plus className="w-5 h-5" />
                      첫 매출 기록 시작하기
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 하단 매출 추가 버튼 */}
      <div className="border-t border-slate-50 bg-slate-50/20 p-6">
        <button
          onClick={onAddNewRow}
          className="group w-full py-5 flex items-center justify-center gap-3 text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50/50 rounded-[24px] border-2 border-dashed border-slate-100 hover:border-blue-200 transition-all font-black text-sm shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center transition-all">
            <Plus className="w-4 h-4 group-hover:text-white" />
          </div>
          새로운 매출 행 추가하기 (실시간 자동 저장)
        </button>
      </div>
    </div>
  );
}
