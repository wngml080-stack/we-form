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
  MessageSquare, CheckCircle, AlertCircle, Sparkles, Loader2, X
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

const CHANNEL_COLORS: Record<string, string> = {
  kakao: "bg-yellow-100 text-yellow-800",
  naver: "bg-green-100 text-green-800",
  phone: "bg-blue-100 text-blue-800",
  walk_in: "bg-purple-100 text-purple-800",
  website: "bg-slate-100 text-slate-800",
  instagram: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
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
      <DialogContent className="w-full max-w-2xl bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px] [&>button]:hidden">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center justify-between relative z-10">
            <DialogTitle className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black !text-white tracking-tight">문의 상세 정보</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Inquiry Detailed View</p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="h-12 w-12 p-0 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all"
                onClick={onCreateReservation}
              >
                <CalendarPlus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                className="h-12 w-12 p-0 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-500 transition-all"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group active:scale-90"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[#f8fafc]">
          {/* 상태 및 기본 태그 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border-none shadow-sm", CHANNEL_COLORS[inquiry.channel])}>
                {CHANNEL_LABELS[inquiry.channel] || inquiry.channel}
              </Badge>
              <Badge className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl bg-white text-slate-600 border-slate-100 shadow-sm">
                {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}
              </Badge>
              {inquiry.ai_responded && (
                <Badge className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl bg-purple-100 text-purple-700 border-none animate-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI 응답 완료
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Status</span>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-10 w-32 rounded-[14px] border-none bg-slate-50 font-black text-xs focus:ring-blue-500 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                  <SelectItem value="new">신규</SelectItem>
                  <SelectItem value="in_progress">진행중</SelectItem>
                  <SelectItem value="waiting">대기중</SelectItem>
                  <SelectItem value="resolved">완료</SelectItem>
                  <SelectItem value="converted">전환됨</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 고객 정보 카드 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-white shadow-xl shadow-slate-200/50 relative overflow-hidden group/customer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover/customer:scale-110 duration-700"></div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">{inquiry.customer_name || "이름 미입력"}</h4>
                  <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 font-bold px-2 py-0">Customer</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm">
                      {inquiry.customer_phone ? formatPhoneNumber(inquiry.customer_phone) : "전화번호 미입력"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-xs">{formatDate(inquiry.created_at)} 등록</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 문의 내용 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">문의 내용</h3>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm min-h-[150px]">
                <p className="text-sm font-bold text-slate-600 leading-relaxed">
                  {inquiry.content || "상세 내용이 없습니다."}
                </p>
              </div>
            </div>

            {/* AI 응답 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-black text-slate-900">AI 권장 응답</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                  className="h-9 px-4 rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-all font-black text-xs gap-2"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {aiResponse ? "다시 생성" : "응답 생성"}
                </Button>
              </div>
              <div className={cn(
                "rounded-3xl p-6 border transition-all min-h-[150px] flex flex-col justify-center",
                aiResponse ? "bg-purple-50/50 border-purple-100 shadow-purple-50 shadow-inner" : "bg-white border-slate-100 shadow-sm"
              )}>
                {aiResponse ? (
                  <p className="text-sm font-bold text-purple-900 leading-relaxed italic">
                    "{aiResponse}"
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-400 text-center">
                    AI 응답을 생성하려면<br/>버튼을 클릭하세요.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 예약 정보 (있는 경우) */}
          {inquiry.reservation && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 text-white shadow-xl shadow-blue-200 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-black text-lg">상담/체험 예약 정보</h4>
                </div>
                <Badge className="bg-white/20 text-white border-none px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Linked Reservation</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-lg font-black">
                    {new Date(inquiry.reservation.scheduled_date).toLocaleDateString("ko-KR", { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="bg-white/20 rounded-2xl p-4 text-center border border-white/20">
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Time</p>
                  <p className="text-lg font-black">{inquiry.reservation.scheduled_time.slice(0, 5)}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center flex items-center justify-center">
                  <Badge
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-none shadow-md",
                      inquiry.reservation.status === "confirmed" && "bg-blue-500 text-white",
                      inquiry.reservation.status === "completed" && "bg-emerald-500 text-white",
                      inquiry.reservation.status === "cancelled" && "bg-rose-500 text-white",
                      "bg-white text-slate-900"
                    )}
                  >
                    {inquiry.reservation.status === "confirmed" ? "확정" :
                     inquiry.reservation.status === "completed" ? "완료" :
                     inquiry.reservation.status === "cancelled" ? "취소" :
                     inquiry.reservation.status === "no_show" ? "노쇼" : "대기"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* 관리자 메모 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-slate-400 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">관리자 메모</h3>
              </div>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 rounded-lg text-blue-600 hover:bg-blue-50 font-bold text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  메모 수정
                </Button>
              )}
            </div>
            
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm">
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="상담 결과나 특이사항을 기록하세요..."
                    rows={4}
                    className="rounded-2xl border-slate-100 focus:ring-blue-500 font-bold text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotes(inquiry.notes || "");
                        setIsEditing(false);
                      }}
                      className="rounded-xl h-10 px-6 font-black text-xs"
                    >
                      취소
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveNotes}
                      className="rounded-xl h-10 px-8 font-black text-xs bg-slate-900"
                    >
                      메모 저장
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={cn(
                  "text-sm font-bold leading-relaxed min-h-[60px]",
                  notes ? "text-slate-600" : "text-slate-300 italic"
                )}>
                  {notes || "아직 기록된 메모가 없습니다."}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Data Sync Enabled</p>
          </div>
          <Button
            onClick={onClose}
            className="h-14 px-12 rounded-[22px] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            확인 및 닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
