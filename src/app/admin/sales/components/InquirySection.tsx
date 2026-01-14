"use client";

import { useState } from "react";
import { useInquiriesData } from "../../inquiries/hooks/useInquiriesData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Calendar, Search, Plus, RefreshCw,
  Clock, CheckCircle, AlertCircle, User, Settings, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

// 모달 컴포넌트
import { CreateInquiryModal } from "../../inquiries/components/modals/CreateInquiryModal";
import { InquiryDetailModal } from "../../inquiries/components/modals/InquiryDetailModal";
import { ReservationModal } from "../../inquiries/components/modals/ReservationModal";
import { KakaoChannelSettingsModal } from "../../inquiries/components/modals/KakaoChannelSettingsModal";

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
  website: "bg-gray-100 text-gray-800",
  instagram: "bg-pink-100 text-pink-800",
  other: "bg-slate-100 text-slate-800",
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

interface InquirySectionProps {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  gymName: string;
  isInitialized: boolean;
}

export function InquirySection({
  selectedGymId,
  selectedCompanyId,
  gymName,
  isInitialized
}: InquirySectionProps) {
  const [activeSubTab, setActiveSubTab] = useState("inquiries");
  const [isKakaoSettingsOpen, setIsKakaoSettingsOpen] = useState(false);

  const {
    inquiries,
    reservations,
    stats,
    isLoading,
    statusFilter,
    setStatusFilter,
    channelFilter,
    setChannelFilter,
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    isReservationModalOpen,
    setIsReservationModalOpen,
    selectedInquiry,
    selectedReservation,
    setSelectedReservation,
    createInquiry,
    updateInquiry,
    deleteInquiry,
    createReservation,
    updateReservation,
    openDetailModal,
    openReservationFromInquiry,
    refetch,
  } = useInquiriesData({
    selectedGymId,
    selectedCompanyId,
    filterInitialized: isInitialized,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);

    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 액션바 & 통계 요약 */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* 통계 카드 그리드 */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "오늘", value: stats.today, icon: MessageSquare, color: "blue" },
            { label: "이번 주", value: stats.week, icon: Calendar, color: "emerald" },
            { label: "미처리", value: stats.pending, icon: AlertCircle, color: "orange", isAlert: true },
            { label: "전환율", value: `${stats.conversionRate}%`, icon: CheckCircle, color: "indigo" },
            { label: "예약", value: reservations.length, icon: Calendar, color: "purple" },
          ].map((item) => (
            <div key={item.label} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className={cn(
                "absolute top-0 right-0 w-16 h-16 rounded-full -mr-6 -mt-6 blur-xl opacity-5 transition-transform group-hover:scale-150 duration-700",
                item.color === "blue" ? "bg-blue-500" :
                item.color === "emerald" ? "bg-emerald-500" :
                item.color === "orange" ? "bg-orange-500" :
                item.color === "indigo" ? "bg-indigo-500" : "bg-purple-500"
              )}></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className={cn(
                "text-2xl font-black tracking-tight mt-1",
                item.isAlert ? "text-orange-600" : "text-slate-900"
              )}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-12 bg-white border-slate-200 text-slate-700 font-black px-5 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"
            onClick={() => setIsKakaoSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            연동
          </Button>
          <Button 
            variant="outline" 
            className="h-12 w-12 bg-white border-slate-200 text-slate-700 p-0 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"
            onClick={refetch}
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
          <Button 
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            문의 등록
          </Button>
        </div>
      </div>

      {/* 메인 탭 컨텐츠 */}
      <div className="space-y-6">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <TabsList className="bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl h-auto border border-slate-200/50">
              <TabsTrigger 
                value="inquiries" 
                className="rounded-xl px-6 py-2 font-black text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all gap-2"
              >
                문의 목록
              </TabsTrigger>
              <TabsTrigger 
                value="reservations" 
                className="rounded-xl px-6 py-2 font-black text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all gap-2"
              >
                예약 현황
              </TabsTrigger>
            </TabsList>

            {activeSubTab === "inquiries" && (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="이름, 전화번호 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-11 pr-4 rounded-xl bg-white border-slate-200 focus:ring-blue-500 font-bold text-xs shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <Filter className="w-4 h-4 text-slate-400" />
                  </div>
                  <Select value={channelFilter} onValueChange={setChannelFilter}>
                    <SelectTrigger className="h-10 w-28 rounded-xl bg-white border-slate-200 font-bold text-xs shadow-sm">
                      <SelectValue placeholder="채널" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                      <SelectItem value="all">전체 채널</SelectItem>
                      <SelectItem value="kakao">카카오</SelectItem>
                      <SelectItem value="naver">네이버</SelectItem>
                      <SelectItem value="phone">전화</SelectItem>
                      <SelectItem value="walk_in">방문</SelectItem>
                      <SelectItem value="instagram">인스타그램</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 w-28 rounded-xl bg-white border-slate-200 font-bold text-xs shadow-sm">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                      <SelectItem value="all">전체 상태</SelectItem>
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
            )}
          </div>

          <TabsContent value="inquiries" className="mt-0 animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">채널</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">문의자</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">유형</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">내용</th>
                      <th className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">담당자</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Inquiries...</p>
                          </div>
                        </td>
                      </tr>
                    ) : inquiries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-slate-200" />
                            <p className="text-xs font-bold text-slate-400">문의 내역이 없습니다</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      inquiries.map((inquiry) => (
                        <tr
                          key={inquiry.id}
                          className="group hover:bg-blue-50/40 cursor-pointer transition-all duration-300"
                          onClick={() => openDetailModal(inquiry)}
                        >
                          <td className="py-5 px-6">
                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border-none", CHANNEL_COLORS[inquiry.channel])}>
                              {CHANNEL_LABELS[inquiry.channel] || inquiry.channel}
                            </Badge>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-sm">{inquiry.customer_name || "미입력"}</span>
                              {inquiry.customer_phone && <span className="text-[10px] font-bold text-slate-400">{formatPhoneNumber(inquiry.customer_phone)}</span>}
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-xs font-bold text-slate-600">{INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}</span>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-xs font-bold text-slate-500 line-clamp-1 max-w-[180px] group-hover:text-slate-900 transition-colors">
                              {inquiry.content || inquiry.subject || "-"}
                            </p>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border-none", STATUS_COLORS[inquiry.status])}>
                              {STATUS_LABELS[inquiry.status] || inquiry.status}
                            </Badge>
                          </td>
                          <td className="py-5 px-6">
                            {inquiry.assigned_staff ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                  <User className="h-3 w-3 text-slate-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">{inquiry.assigned_staff.name}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">미배정</span>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(inquiry.created_at)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="mt-0 animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">날짜</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">시간</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">예약자</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">유형</th>
                      <th className="py-4 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">담당자</th>
                      <th className="py-4 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reservations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Calendar className="w-8 h-8 text-slate-200" />
                            <p className="text-xs font-bold text-slate-400">예약 내역이 없습니다</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reservations.map((reservation) => (
                        <tr
                          key={reservation.id}
                          className="group hover:bg-blue-50/40 cursor-pointer transition-all duration-300"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setIsReservationModalOpen(true);
                          }}
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                                {new Date(reservation.scheduled_date).getDate()}
                              </div>
                              <span className="font-black text-slate-900 text-sm">
                                {new Date(reservation.scheduled_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <Badge variant="outline" className="h-7 px-2.5 rounded-lg border-slate-200 bg-white font-black text-blue-600 text-[10px]">
                              {reservation.scheduled_time.slice(0, 5)}
                            </Badge>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-sm">{reservation.customer_name}</span>
                              <span className="text-[10px] font-bold text-slate-400">{formatPhoneNumber(reservation.customer_phone)}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <Badge className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border-none px-2.5 py-0.5 rounded-lg">
                              {reservation.reservation_type === "consultation" && "상담"}
                              {reservation.reservation_type === "trial" && "체험"}
                              {reservation.reservation_type === "ot" && "OT"}
                              {reservation.reservation_type === "pt_consultation" && "PT 상담"}
                              {reservation.reservation_type === "tour" && "견학"}
                              {reservation.reservation_type === "other" && "기타"}
                            </Badge>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="h-3 w-3" />
                              </div>
                              <span className="text-xs font-bold text-slate-700">{reservation.staff?.name || "-"}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border-none shadow-sm",
                              reservation.status === "confirmed" && "bg-blue-500 text-white",
                              reservation.status === "completed" && "bg-emerald-500 text-white",
                              reservation.status === "no_show" && "bg-rose-500 text-white",
                              reservation.status === "cancelled" && "bg-slate-400 text-white",
                              reservation.status === "pending" && "bg-amber-500 text-white",
                              reservation.status === "rescheduled" && "bg-indigo-500 text-white"
                            )}>
                              {reservation.status === "pending" && "대기"}
                              {reservation.status === "confirmed" && "확정"}
                              {reservation.status === "completed" && "완료"}
                              {reservation.status === "no_show" && "노쇼"}
                              {reservation.status === "cancelled" && "취소"}
                              {reservation.status === "rescheduled" && "변경됨"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 모달 */}
      <CreateInquiryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createInquiry}
      />

      {selectedInquiry && (
        <InquiryDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          inquiry={selectedInquiry}
          onUpdate={updateInquiry}
          onDelete={deleteInquiry}
          onCreateReservation={() => openReservationFromInquiry(selectedInquiry)}
        />
      )}

      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
        inquiry={selectedInquiry}
        onCreate={createReservation}
        onUpdate={updateReservation}
        gymId={selectedGymId}
        companyId={selectedCompanyId}
      />

      <KakaoChannelSettingsModal
        isOpen={isKakaoSettingsOpen}
        onClose={() => setIsKakaoSettingsOpen(false)}
        gymId={selectedGymId}
        companyId={selectedCompanyId}
        gymName={gymName}
      />
    </div>
  );
}

