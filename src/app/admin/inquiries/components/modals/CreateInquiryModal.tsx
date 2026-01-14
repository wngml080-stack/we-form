"use client";

import { useState } from "react";
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
import { Phone, MessageSquare, X, Plus, CheckCircle2 } from "lucide-react";

interface CreateInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => Promise<boolean>;
}

export function CreateInquiryModal({
  isOpen,
  onClose,
  onCreate,
}: CreateInquiryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    channel: "phone",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    inquiry_type: "price",
    subject: "",
    content: "",
    priority: "normal",
  });

  const handleSubmit = async () => {
    if (!formData.channel || !formData.inquiry_type) {
      alert("채널과 문의 유형을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    const success = await onCreate(formData);
    setIsSubmitting(false);

    if (success) {
      setFormData({
        channel: "phone",
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        inquiry_type: "price",
        subject: "",
        content: "",
        priority: "normal",
      });
    }
  };

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px] [&>button]:hidden">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">새 문의 등록</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Create New Inquiry</p>
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group active:scale-90"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[#f8fafc]">
          {/* 문의 채널 및 유형 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">문의 채널</h3>
              </div>
              <Select
                value={formData.channel}
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm font-bold text-slate-700 focus:ring-blue-500">
                  <SelectValue placeholder="채널 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                  <SelectItem value="phone">전화</SelectItem>
                  <SelectItem value="kakao">카카오</SelectItem>
                  <SelectItem value="naver">네이버</SelectItem>
                  <SelectItem value="walk_in">방문</SelectItem>
                  <SelectItem value="instagram">인스타그램</SelectItem>
                  <SelectItem value="website">웹사이트</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">문의 유형</h3>
              </div>
              <Select
                value={formData.inquiry_type}
                onValueChange={(value) => setFormData({ ...formData, inquiry_type: value })}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm font-bold text-slate-700 focus:ring-blue-500">
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                  <SelectItem value="price">가격 문의</SelectItem>
                  <SelectItem value="schedule">일정 문의</SelectItem>
                  <SelectItem value="location">위치/교통</SelectItem>
                  <SelectItem value="trial">체험 신청</SelectItem>
                  <SelectItem value="membership">회원권</SelectItem>
                  <SelectItem value="pt">PT 문의</SelectItem>
                  <SelectItem value="cancel">해지/환불</SelectItem>
                  <SelectItem value="etc">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 고객 정보 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">고객 정보</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">고객 이름</Label>
                <Input
                  placeholder="홍길동"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-blue-500 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">전화번호</Label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="010-0000-0000"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: formatPhoneInput(e.target.value) })}
                    className="h-14 pl-14 rounded-2xl bg-slate-50 border-none focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 문의 내용 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900">문의 상세 내용</h3>
            </div>
            <Textarea
              placeholder="상담 내용을 자세히 입력해주세요..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="rounded-[32px] bg-white border-slate-100 shadow-sm p-6 font-bold text-slate-600 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between flex-shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-14 px-10 rounded-[22px] font-black text-slate-400 hover:text-slate-900 transition-all"
          >
            취소하기
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-14 px-12 rounded-[22px] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            문의 등록 완료
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
