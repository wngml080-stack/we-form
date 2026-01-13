"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone, Calendar, User, Clock, Trash2, Edit, CalendarPlus,
  MessageSquare, CheckCircle, AlertCircle, Sparkles, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

interface Inquiry {
  id: string;
  channel: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  inquiry_type: string;
  subject?: string;
  content?: string;
  status: string;
  priority: string;
  assigned_staff?: { id: string; name: string } | null;
  ai_responded: boolean;
  ai_response_content?: string;
  notes?: string;
  reservation?: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
  } | null;
  created_at: string;
}

interface InquiryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: Inquiry;
  onUpdate: (id: string, data: Partial<Inquiry>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreateReservation: () => void;
}

const CHANNEL_LABELS: Record<string, string> = {
  kakao: "카카오",
  naver: "네이버",
  phone: "전화",
  walk_in: "방문",
  website: "웹사이트",
  instagram: "인스타그램",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  new: "신규",
  in_progress: "진행중",
  waiting: "대기중",
  resolved: "완료",
  converted: "전환됨",
  cancelled: "취소",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  waiting: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  converted: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  price: "가격 문의",
  schedule: "일정 문의",
  location: "위치/교통",
  trial: "체험 신청",
  membership: "회원권",
  pt: "PT 문의",
  cancel: "해지/환불",
  etc: "기타",
  other: "기타",
};

export function InquiryDetailModal({
  isOpen,
  onClose,
  inquiry,
  onUpdate,
  onDelete,
  onCreateReservation,
}: InquiryDetailModalProps) {
  const [status, setStatus] = useState(inquiry.status);
  const [notes, setNotes] = useState(inquiry.notes || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(inquiry.ai_response_content || "");

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await onUpdate(inquiry.id, { status: newStatus });
  };

  const handleSaveNotes = async () => {
    await onUpdate(inquiry.id, { notes });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("이 문의를 삭제하시겠습니까?")) {
      setIsDeleting(true);
      await onDelete(inquiry.id);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGenerateAI = async () => {
    if (!inquiry.content && !inquiry.subject) {
      alert("문의 내용이 없습니다.");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/inquiry-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiry_id: inquiry.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiResponse(data.response);
      } else {
        alert(data.error || "AI 응답 생성 실패");
      }
    } catch (error) {
      alert("AI 응답 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              문의 상세
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateReservation}
              >
                <CalendarPlus className="h-4 w-4 mr-1" />
                예약 등록
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 상태 및 기본 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">
                {CHANNEL_LABELS[inquiry.channel] || inquiry.channel}
              </Badge>
              <Badge variant="outline">
                {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}
              </Badge>
              {inquiry.ai_responded && (
                <Badge className="bg-purple-100 text-purple-800">
                  AI 응답
                </Badge>
              )}
            </div>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">신규</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="waiting">대기중</SelectItem>
                <SelectItem value="resolved">완료</SelectItem>
                <SelectItem value="converted">전환됨</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 고객 정보 */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">고객 정보</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{inquiry.customer_name || "이름 미입력"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>
                  {inquiry.customer_phone
                    ? formatPhoneNumber(inquiry.customer_phone)
                    : "전화번호 미입력"}
                </span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatDate(inquiry.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* 문의 내용 */}
          {inquiry.content && (
            <div>
              <h4 className="font-medium mb-2">문의 내용</h4>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                {inquiry.content}
              </p>
            </div>
          )}

          {/* AI 응답 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI 응답
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    {aiResponse ? "다시 생성" : "AI 응답 생성"}
                  </>
                )}
              </Button>
            </div>
            {aiResponse ? (
              <p className="text-sm bg-purple-50 text-purple-900 rounded-lg p-3">
                {aiResponse}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                AI 응답을 생성하려면 버튼을 클릭하세요.
              </p>
            )}
          </div>

          {/* 예약 정보 */}
          {inquiry.reservation && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                예약 정보
              </h4>
              <div className="flex items-center gap-4">
                <span className="text-sm">
                  {new Date(inquiry.reservation.scheduled_date).toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </span>
                <span className="text-sm">
                  {inquiry.reservation.scheduled_time.slice(0, 5)}
                </span>
                <Badge
                  className={cn(
                    "text-xs",
                    inquiry.reservation.status === "confirmed" && "bg-blue-100 text-blue-800",
                    inquiry.reservation.status === "completed" && "bg-green-100 text-green-800",
                    inquiry.reservation.status === "cancelled" && "bg-red-100 text-red-800"
                  )}
                >
                  {inquiry.reservation.status === "confirmed" && "확정"}
                  {inquiry.reservation.status === "completed" && "완료"}
                  {inquiry.reservation.status === "cancelled" && "취소"}
                  {inquiry.reservation.status === "no_show" && "노쇼"}
                </Badge>
              </div>
            </div>
          )}

          {/* 메모 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">메모</h4>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  수정
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNotes(inquiry.notes || "");
                      setIsEditing(false);
                    }}
                  >
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSaveNotes}>
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 min-h-[60px]">
                {notes || "메모가 없습니다"}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
