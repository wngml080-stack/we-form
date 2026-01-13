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
import { Phone, MessageSquare } from "lucide-react";

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            문의 등록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 채널 선택 */}
          <div className="space-y-2">
            <Label>문의 채널 *</Label>
            <Select
              value={formData.channel}
              onValueChange={(value) => setFormData({ ...formData, channel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="채널 선택" />
              </SelectTrigger>
              <SelectContent>
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

          {/* 고객 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                placeholder="홍길동"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>전화번호</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="010-0000-0000"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: formatPhoneInput(e.target.value) })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* 문의 유형 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>문의 유형 *</Label>
              <Select
                value={formData.inquiry_type}
                onValueChange={(value) => setFormData({ ...formData, inquiry_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="normal">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-2">
            <Label>문의 내용</Label>
            <Textarea
              placeholder="문의 내용을 입력하세요..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
