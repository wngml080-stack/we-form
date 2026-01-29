"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Phone, 
  Calendar, 
  ClipboardList, 
  UserCheck, 
  MessageSquare,
  X,
  CheckCircle2,
  Trash2
} from "lucide-react";

interface RenewalMember {
  id: string;
  name: string;
  phone: string;
  membershipName: string;
  endDate: string;
  status: string;
  memo?: string;
}

interface RenewalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: RenewalMember | null;
  onUpdate: (updatedMember: RenewalMember) => void;
  onDelete: (id: string) => void;
}

export function RenewalDetailModal({
  isOpen,
  onClose,
  member,
  onUpdate,
  onDelete,
}: RenewalDetailModalProps) {
  const [formData, setFormData] = useState<Partial<RenewalMember>>({});

  useEffect(() => {
    if (member) {
      setFormData({ ...member });
    }
  }, [member]);

  const handleSubmit = () => {
    if (formData.id) {
      onUpdate(formData as RenewalMember);
    }
    onClose();
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px] [&>button]:hidden">
        {/* 헤더 */}
        <DialogHeader className="px-6 sm:px-8 py-5 sm:py-6 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <DialogTitle className="!text-white flex items-center gap-3 text-lg sm:text-xl font-black">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            리뉴 대상자 상세 관리
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute top-5 sm:top-6 right-6 sm:right-8 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-white" />
          </button>
        </DialogHeader>

        {/* 본문 */}
        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 bg-[#f8fafc] max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* 기본 정보 섹션 */}
          <div className="bg-white rounded-[24px] sm:rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 sm:h-5 bg-emerald-500 rounded-full"></div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">회원 정보 수정</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이름</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 sm:h-12 pl-11 rounded-xl sm:rounded-2xl border-slate-100 font-bold bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">연락처</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11 sm:h-12 pl-11 rounded-xl sm:rounded-2xl border-slate-100 font-bold bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">만료 회원권</Label>
              <div className="relative">
                <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  value={formData.membershipName || ""}
                  onChange={(e) => setFormData({ ...formData, membershipName: e.target.value })}
                  className="h-11 sm:h-12 pl-11 rounded-xl sm:rounded-2xl border-slate-100 font-bold bg-slate-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">만료일</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    type="date"
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="h-11 sm:h-12 pl-11 rounded-xl sm:rounded-2xl border-slate-100 font-bold bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">관리 상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-slate-100 font-bold bg-slate-50/50 focus:bg-white transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    <SelectItem value="pending" className="rounded-xl font-bold py-3">미연락</SelectItem>
                    <SelectItem value="contacted" className="rounded-xl font-bold py-3">연락완료</SelectItem>
                    <SelectItem value="completed" className="rounded-xl font-bold py-3">재등록완료</SelectItem>
                    <SelectItem value="cancelled" className="rounded-xl font-bold py-3">포기/만료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 코멘트 섹션 */}
          <div className="bg-white rounded-[24px] sm:rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 sm:h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">상담 코멘트</h3>
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
              <Textarea
                placeholder="상담 내용이나 특이사항을 기록하세요..."
                value={formData.memo || ""}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="min-h-[100px] sm:min-h-[120px] pl-11 pt-4 rounded-xl sm:rounded-2xl border-slate-100 font-bold text-sm resize-none focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <DialogFooter className="px-6 sm:px-8 py-5 sm:py-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("정말 이 회원을 관리 목록에서 삭제하시겠습니까?")) {
                onDelete(member.id);
                onClose();
              }
            }}
            className="h-12 sm:h-14 px-6 w-full sm:w-auto rounded-xl sm:rounded-2xl font-black text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            삭제
          </Button>

          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-12 sm:h-14 flex-1 sm:flex-none px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-12 sm:h-14 flex-2 sm:flex-none px-8 sm:px-12 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              저장
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

