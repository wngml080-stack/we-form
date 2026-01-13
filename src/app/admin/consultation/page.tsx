"use client";

import { useState, use } from "react";
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  RefreshCcw,
  Calendar,
  ChevronRight,
  Target,
  Users,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAdminFilter } from "@/contexts/AdminFilterContext";

// 상담 문의 데이터 타입
interface Consultation {
  id: string;
  channel: "naver" | "phone" | "instagram" | "visit" | "etc";
  name: string;
  phone: string;
  type: "PT" | "헬스" | "필라테스" | "기타";
  content: string;
  status: "pending" | "scheduled" | "completed" | "canceled";
  assignee?: string;
  created_at: string;
}

export default function ConsultationPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  use(props.params);
  use(props.searchParams);

  const { gymName } = useAdminFilter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChannel, setActiveChannel] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");

  // 임시 데이터
  const consultations: Consultation[] = [];

  const stats = [
    { label: "오늘 문의", value: "0", subValue: "+0", icon: Clock, color: "blue" },
    { label: "이번 주", value: "0", subValue: "+0", icon: Calendar, color: "indigo" },
    { label: "미처리 문의", value: "0", icon: AlertCircle, color: "rose" },
    { label: "상담 전환율", value: "0%", icon: Target, color: "emerald" },
  ];

  const channels = [
    { id: "all", label: "전체 채널" },
    { id: "naver", label: "네이버" },
    { id: "phone", label: "전화" },
    { id: "instagram", label: "인스타그램" },
    { id: "visit", label: "방문" },
  ];

  const statuses = [
    { id: "all", label: "전체 상태" },
    { id: "pending", label: "대기중" },
    { id: "scheduled", label: "예약됨" },
    { id: "completed", label: "상담완료" },
    { id: "canceled", label: "취소됨" },
  ];

  return (
    <div className="p-6 space-y-8 animate-fade-in-up">
      {/* 3D 프리미엄 헤더 */}
      <div className="header-3d flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-2">
                문의 관리
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/70 text-sm font-bold">{gymName || "전체 지점"}</span>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-white/70 text-sm font-medium">잠재 고객 리드 최적화</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <button className="btn-3d btn-3d-white px-5 py-3 gap-2 text-sm">
            <RefreshCcw className="w-4 h-4" />
            새로고침
          </button>
          <button className="btn-3d btn-3d-accent px-6 py-3 gap-2 text-sm flex-1 md:flex-none">
            <Plus className="w-5 h-5" />
            신규 문의 등록
          </button>
        </div>
      </div>

      {/* 3D 통계 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.label} 
            className="stat-card-3d group"
            style={{ 
              animationDelay: `${index * 100}ms`,
              '--gradient-primary': stat.color === 'blue' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                                   stat.color === 'indigo' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' :
                                   stat.color === 'rose' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' :
                                   'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            } as any}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "icon-box-3d",
                stat.color === "blue" && "icon-box-3d-primary",
                stat.color === "indigo" && "bg-indigo-50 text-indigo-600",
                stat.color === "rose" && "bg-rose-50 text-rose-600",
                stat.color === "emerald" && "bg-emerald-50 text-emerald-600",
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.subValue && (
                <span className="badge-3d badge-3d-primary bg-slate-100 text-slate-600 text-[10px]">
                  {stat.subValue}
                </span>
              )}
            </div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value mt-1">{stat.value}</p>
            
            {/* 호버 시 나타나는 배경 장식 */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100 -z-10" />
          </div>
        ))}
      </div>

      {/* 메인 콘텐츠 영역 - 3D 테이블 스타일 */}
      <div className="table-3d flex flex-col min-h-[600px] animate-fade-in animation-delay-300">
        {/* 글래스모피즘 필터 바 */}
        <div className="p-8 border-b-2 border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">문의 목록</h2>
                <span className="badge-3d bg-blue-600 text-white py-0.5 px-2">LIVE</span>
              </div>
              <p className="text-sm font-bold text-slate-400">실시간으로 인입되는 고객 문의를 확인하세요</p>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="문의자 이름, 연락처, 내용 검색..." 
                  className="input-3d w-full pl-12 pr-4 text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn-3d btn-3d-white p-3 lg:hidden">
                <Filter className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <div className="neumorphic-inset flex p-1.5 gap-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-black transition-all",
                    activeChannel === channel.id 
                      ? "bg-white text-blue-600 shadow-md transform scale-105" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  {channel.label}
                </button>
              ))}
            </div>
            
            <div className="neumorphic-inset flex p-1.5 gap-1">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setActiveStatus(status.id)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-black transition-all",
                    activeStatus === status.id 
                      ? "bg-slate-900 text-white shadow-md transform scale-105" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 테이블 본문 */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {consultations.length > 0 ? (
            <table className="w-full border-collapse min-w-[1100px]">
              <thead>
                <tr>
                  <th>채널</th>
                  <th>문의자 정보</th>
                  <th>관심 유형</th>
                  <th>문의 내용</th>
                  <th>현재 상태</th>
                  <th>담당 매니저</th>
                  <th>인입 일시</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {/* 데이터 연동 시 렌더링 영역 */}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center animate-fade-in">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center animate-bounce-soft border border-slate-100 shadow-inner">
                  <MessageSquare className="w-12 h-12 text-slate-200" />
                </div>
                <div className="absolute -right-2 -top-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Search className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">등록된 문의가 없습니다</h3>
              <p className="text-slate-400 font-bold text-base max-w-sm leading-relaxed mb-10">
                현재 조건에 맞는 상담 문의가 없습니다.<br />
                채널별 마케팅을 통해 새로운 리드를 확보해보세요.
              </p>
              <button className="btn-3d btn-3d-primary px-10 py-4 text-base gap-3">
                <Plus className="w-6 h-6" />
                첫 번째 문의 직접 등록하기
              </button>
            </div>
          )}
        </div>

        {/* 하단 푸터 */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-black text-slate-500 tracking-wider uppercase">
              Total <span className="text-slate-900">0</span> consultations found
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-3d btn-3d-white p-2 text-slate-400 disabled:opacity-30" disabled>
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button className="btn-3d btn-3d-white p-2 text-slate-400 disabled:opacity-30" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
