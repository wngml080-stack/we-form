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
  Clock, CheckCircle, AlertCircle, User, Settings, Filter, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

// 모달 컴포넌트
import { CreateInquiryModal } from "../../inquiries/components/modals/CreateInquiryModal";
import { InquiryDetailModal } from "../../inquiries/components/modals/InquiryDetailModal";
import { ReservationModal } from "../../inquiries/components/modals/ReservationModal";
import { KakaoChannelSettingsModal } from "../../inquiries/components/modals/KakaoChannelSettingsModal";

// 대시보드 컴포넌트
import { NewMemberDashboard } from "./NewMemberDashboard";
import { NewMemberList } from "./NewMemberList";

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
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
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
      {/* 메인 탭 컨텐츠 */}
      <div className="space-y-6">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <TabsList className="bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl h-auto border border-slate-200/50">
              <TabsTrigger
                value="dashboard"
                className="rounded-xl px-6 py-2 font-black text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all gap-2"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1" />
                대시보드
              </TabsTrigger>
              <TabsTrigger
                value="newMembers"
                className="rounded-xl px-6 py-2 font-black text-xs data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all gap-2"
              >
                신규 회원 관리
              </TabsTrigger>
            </TabsList>

            {/* 액션 버튼 (탭 우측으로 이동 및 크기 조정) */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="h-10 bg-white border-slate-200 text-slate-700 font-black px-4 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-xs"
                onClick={() => setIsKakaoSettingsOpen(true)}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                연동
              </Button>
              <Button 
                variant="outline" 
                className="h-10 w-10 bg-white border-slate-200 text-slate-700 p-0 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                onClick={refetch}
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button 
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black px-5 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 text-xs"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                신규 문의 등록
              </Button>
            </div>
          </div>

          <TabsContent value="dashboard" className="mt-0 animate-in fade-in duration-500">
            <NewMemberDashboard
              selectedGymId={selectedGymId}
              selectedCompanyId={selectedCompanyId}
              isInitialized={isInitialized}
              inquiryStats={stats}
              reservationCount={reservations.length}
            />
          </TabsContent>

          <TabsContent value="newMembers" className="mt-0 animate-in fade-in duration-500">
            <NewMemberList
              selectedGymId={selectedGymId}
              selectedCompanyId={selectedCompanyId}
              isInitialized={isInitialized}
            />
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

      {selectedGymId && selectedCompanyId && (
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
      )}

      {selectedGymId && selectedCompanyId && (
        <KakaoChannelSettingsModal
          isOpen={isKakaoSettingsOpen}
          onClose={() => setIsKakaoSettingsOpen(false)}
          gymId={selectedGymId}
          companyId={selectedCompanyId}
          gymName={gymName}
        />
      )}
    </div>
  );
}

