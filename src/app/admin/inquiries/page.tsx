"use client";

import { useState, use } from "react";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { useInquiriesData } from "./hooks/useInquiriesData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Phone, Search, Plus, RefreshCw, Calendar,
  Clock, CheckCircle, AlertCircle, User, TrendingUp, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

// 모달 컴포넌트 (lazy 로딩)
import { CreateInquiryModal } from "./components/modals/CreateInquiryModal";
import { InquiryDetailModal } from "./components/modals/InquiryDetailModal";
import { ReservationModal } from "./components/modals/ReservationModal";
import { KakaoChannelSettingsModal } from "./components/modals/KakaoChannelSettingsModal";

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

export default function InquiriesPage(props: {
  params: Promise<unknown>;
  searchParams: Promise<unknown>;
}) {
  use(props.params);
  use(props.searchParams);

  const { selectedGymId, gymName, selectedCompanyId, isInitialized } = useAdminFilter();
  const [activeTab, setActiveTab] = useState("inquiries");
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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">문의 관리</h1>
          <p className="text-muted-foreground">{gymName || "지점을 선택해주세요"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsKakaoSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-1" />
            카카오 연동
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-1" />
            새로고침
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            문의 등록
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">오늘</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">이번 주</p>
                <p className="text-2xl font-bold">{stats.week}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">이번 달</p>
                <p className="text-2xl font-bold">{stats.month}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">미처리</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전환율</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.conversionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inquiries">
            <MessageSquare className="h-4 w-4 mr-1" />
            문의 목록
          </TabsTrigger>
          <TabsTrigger value="reservations">
            <Calendar className="h-4 w-4 mr-1" />
            예약 ({reservations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름, 전화번호, 내용 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="채널" />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
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

          {/* 문의 목록 */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">채널</th>
                    <th className="text-left p-3 font-medium">문의자</th>
                    <th className="text-left p-3 font-medium">유형</th>
                    <th className="text-left p-3 font-medium">내용</th>
                    <th className="text-left p-3 font-medium">상태</th>
                    <th className="text-left p-3 font-medium">담당자</th>
                    <th className="text-left p-3 font-medium">일시</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </td>
                    </tr>
                  ) : inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        문의가 없습니다
                      </td>
                    </tr>
                  ) : (
                    inquiries.map((inquiry) => (
                      <tr
                        key={inquiry.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => openDetailModal(inquiry)}
                      >
                        <td className="p-3">
                          <Badge className={cn("text-xs", CHANNEL_COLORS[inquiry.channel])}>
                            {CHANNEL_LABELS[inquiry.channel] || inquiry.channel}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {inquiry.customer_name || "미입력"}
                            </span>
                            {inquiry.customer_phone && (
                              <span className="text-xs text-muted-foreground">
                                {formatPhoneNumber(inquiry.customer_phone)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">
                            {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                            {inquiry.content || inquiry.subject || "-"}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge className={cn("text-xs", STATUS_COLORS[inquiry.status])}>
                            {STATUS_LABELS[inquiry.status] || inquiry.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {inquiry.assigned_staff ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="text-sm">{inquiry.assigned_staff.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">미배정</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(inquiry.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          {/* 예약 목록 */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">날짜</th>
                    <th className="text-left p-3 font-medium">시간</th>
                    <th className="text-left p-3 font-medium">예약자</th>
                    <th className="text-left p-3 font-medium">유형</th>
                    <th className="text-left p-3 font-medium">담당자</th>
                    <th className="text-left p-3 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        예약이 없습니다
                      </td>
                    </tr>
                  ) : (
                    reservations.map((reservation) => (
                      <tr
                        key={reservation.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setIsReservationModalOpen(true);
                        }}
                      >
                        <td className="p-3 font-medium">
                          {new Date(reservation.scheduled_date).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </td>
                        <td className="p-3">
                          {reservation.scheduled_time.slice(0, 5)}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span>{reservation.customer_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatPhoneNumber(reservation.customer_phone)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {reservation.reservation_type === "consultation" && "상담"}
                            {reservation.reservation_type === "trial" && "체험"}
                            {reservation.reservation_type === "ot" && "OT"}
                            {reservation.reservation_type === "pt_consultation" && "PT 상담"}
                            {reservation.reservation_type === "tour" && "견학"}
                            {reservation.reservation_type === "other" && "기타"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {reservation.staff?.name || "-"}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={cn(
                              "text-xs",
                              reservation.status === "confirmed" && "bg-blue-100 text-blue-800",
                              reservation.status === "completed" && "bg-green-100 text-green-800",
                              reservation.status === "no_show" && "bg-red-100 text-red-800",
                              reservation.status === "cancelled" && "bg-gray-100 text-gray-800"
                            )}
                          >
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
          </Card>
        </TabsContent>
      </Tabs>

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
