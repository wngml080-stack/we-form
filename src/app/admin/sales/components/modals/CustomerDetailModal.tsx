"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone, Calendar, User, Clock, X, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

interface CustomerFunnel {
  phone: string;
  name: string;
  inquiry: { id: string; channel: string; channelOther?: string; type: string; typeOther?: string; status: string; content?: string; date: string } | null;
  reservation: { id: string; type: string; status: string; date: string } | null;
  registration: { id: string; membershipName: string; amount: number; visitRoute: string; date: string } | null;
  firstContactDate: string;
  lastActivityDate: string;
  conversionStatus: string;
  funnelStage: string;
}

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerFunnel | null;
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

const STATUS_LABELS: Record<string, string> = {
  new: "신규",
  in_progress: "진행중",
  waiting: "대기중",
  resolved: "완료",
  converted: "전환됨",
  cancelled: "취소",
};

export function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
}: CustomerDetailModalProps) {
  if (!customer) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getChannelLabel = (channel: string, channelOther?: string) => {
    if (channel === "other" && channelOther) {
      return channelOther;
    }
    return CHANNEL_LABELS[channel] || channel;
  };

  const getInquiryTypeLabel = (type: string, typeOther?: string) => {
    if (type === "etc" && typeOther) {
      return typeOther;
    }
    return INQUIRY_TYPE_LABELS[type] || type;
  };

  const getConversionBadge = () => {
    if (customer.registration) {
      return <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-xs px-4 py-1.5 rounded-xl">등록완료</Badge>;
    } else if (customer.reservation) {
      return <Badge className="bg-amber-100 text-amber-600 border-none font-black text-xs px-4 py-1.5 rounded-xl">예약대기</Badge>;
    } else {
      return <Badge className="bg-rose-100 text-rose-600 border-none font-black text-xs px-4 py-1.5 rounded-xl">미전환</Badge>;
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
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black !text-white tracking-tight">{customer.name || "이름 미입력"}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Customer Detail</p>
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

        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[#f8fafc]">
          {/* 전환 상태 및 기본 정보 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {getConversionBadge()}
            <div className="flex items-center gap-3 text-slate-500">
              <Phone className="w-4 h-4" />
              <span className="font-bold">{formatPhoneNumber(customer.phone)}</span>
            </div>
          </div>

          {/* 퍼널 경로 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">퍼널 경로</h4>
            <div className="flex items-center gap-3">
              {customer.inquiry && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-bold text-blue-700">문의</span>
                </div>
              )}
              {customer.inquiry && (customer.reservation || customer.registration) && (
                <ArrowRight className="w-4 h-4 text-slate-300" />
              )}
              {customer.reservation && (
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-bold text-purple-700">예약</span>
                </div>
              )}
              {customer.reservation && customer.registration && (
                <ArrowRight className="w-4 h-4 text-slate-300" />
              )}
              {customer.registration && (
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-emerald-700">등록</span>
                </div>
              )}
            </div>
          </div>

          {/* 문의 정보 */}
          {customer.inquiry && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">문의 정보</h3>
              </div>
              <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">문의 채널</p>
                    <Badge className={cn("text-xs font-bold px-3 py-1 rounded-lg border-none", CHANNEL_COLORS[customer.inquiry.channel] || "bg-gray-100 text-gray-800")}>
                      {getChannelLabel(customer.inquiry.channel, customer.inquiry.channelOther)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">문의 유형</p>
                    <span className="text-sm font-bold text-slate-700">
                      {getInquiryTypeLabel(customer.inquiry.type, customer.inquiry.typeOther)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">문의 상태</p>
                    <span className="text-sm font-bold text-slate-700">
                      {STATUS_LABELS[customer.inquiry.status] || customer.inquiry.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">문의 날짜</p>
                    <span className="text-sm font-bold text-slate-700">
                      {formatShortDate(customer.inquiry.date)}
                    </span>
                  </div>
                </div>
                {customer.inquiry.content && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">문의 내용</p>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                      {customer.inquiry.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 예약 정보 */}
          {customer.reservation && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-purple-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">예약 정보</h3>
              </div>
              <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">예약 유형</p>
                    <span className="text-sm font-bold text-slate-700">
                      {customer.reservation.type === "consultation" ? "상담" : customer.reservation.type === "trial" ? "체험" : customer.reservation.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">예약 상태</p>
                    <Badge className={cn(
                      "text-xs font-bold px-3 py-1 rounded-lg border-none",
                      customer.reservation.status === "confirmed" && "bg-blue-100 text-blue-800",
                      customer.reservation.status === "completed" && "bg-emerald-100 text-emerald-800",
                      customer.reservation.status === "cancelled" && "bg-rose-100 text-rose-800",
                      customer.reservation.status === "pending" && "bg-amber-100 text-amber-800"
                    )}>
                      {customer.reservation.status === "confirmed" ? "확정" :
                       customer.reservation.status === "completed" ? "완료" :
                       customer.reservation.status === "cancelled" ? "취소" :
                       customer.reservation.status === "no_show" ? "노쇼" : "대기"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">예약 날짜</p>
                    <span className="text-sm font-bold text-slate-700">
                      {formatShortDate(customer.reservation.date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 등록 정보 */}
          {customer.registration && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">등록 정보</h3>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 text-white shadow-xl shadow-emerald-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">상품명</p>
                    <span className="text-lg font-black">
                      {customer.registration.membershipName}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">결제 금액</p>
                    <span className="text-lg font-black">
                      {new Intl.NumberFormat("ko-KR").format(customer.registration.amount)}원
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">방문 경로</p>
                    <span className="text-sm font-bold">
                      {customer.registration.visitRoute || "-"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">등록 날짜</p>
                    <span className="text-sm font-bold">
                      {formatShortDate(customer.registration.date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 활동 기록 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-6 border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">활동 기록</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">첫 접촉</p>
                  <p className="text-sm font-bold text-slate-700">{formatShortDate(customer.firstContactDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">최근 활동</p>
                  <p className="text-sm font-bold text-slate-700">{formatShortDate(customer.lastActivityDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-end flex-shrink-0">
          <Button
            onClick={onClose}
            className="h-14 px-12 rounded-[22px] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
