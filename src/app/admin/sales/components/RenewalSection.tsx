"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Plus, RefreshCw, FileUp, Download,
  User, Calendar, Phone, AlertCircle, CheckCircle2,
  Trash2, Mail, MessageCircle, MoreVertical, BarChart3, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";
import { RenewalDetailModal } from "./modals/RenewalDetailModal";
import { RenewalDashboard } from "./RenewalDashboard";

interface RenewalMember {
  id: string;
  name: string;
  phone: string;
  membershipName: string;
  endDate: string;
  trainerName: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  lastContactDate?: string;
  memo?: string;
}

export function RenewalSection({
  selectedGymId,
  selectedCompanyId,
  gymName,
  isInitialized
}: {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  gymName: string;
  isInitialized: boolean;
}) {
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<RenewalMember | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // 가상의 데이터 (추후 DB 연동 필요)
  const [members, setMembers] = useState<RenewalMember[]>([
    {
      id: "1",
      name: "김민수",
      phone: "010-1234-5678",
      membershipName: "헬스 3개월 (오전권)",
      endDate: "2026-01-20",
      trainerName: "이강사",
      status: "pending",
      memo: "전화 필요"
    },
    {
      id: "2",
      name: "이지연",
      phone: "010-9876-5432",
      membershipName: "PT 20회",
      endDate: "2026-01-15",
      trainerName: "박코치",
      status: "contacted",
      lastContactDate: "2026-01-10",
      memo: "재등록 고민 중"
    }
  ]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.includes(searchQuery) || 
      m.phone.includes(searchQuery) ||
      m.membershipName.includes(searchQuery)
    );
  }, [members, searchQuery]);

  const handleExcelUpload = () => {
    // 엑셀 업로드 로직 구현 예정
    alert("엑셀 업로드 기능은 준비 중입니다. (라이브러리 추가 필요)");
  };

  const handleDownloadTemplate = () => {
    // ... (기존 코드)
  };

  const handleUpdateMember = (updatedMember: RenewalMember) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    // 추후 DB 업데이트 로직 추가 가능
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    // 추후 DB 삭제 로직 추가 가능
  };

  const getStatusBadge = (status: RenewalMember['status']) => {
    switch (status) {
      case 'pending': return <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px]">미연락</Badge>;
      case 'contacted': return <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px]">연락완료</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px]">재등록완료</Badge>;
      case 'cancelled': return <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[10px]">포기/만료</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 탭 네비게이션 */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <TabsList className="bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl h-auto border border-slate-200/50">
            <TabsTrigger
              value="dashboard"
              className="rounded-xl px-6 py-2 font-black text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all gap-2"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              대시보드
            </TabsTrigger>
            <TabsTrigger
              value="targets"
              className="rounded-xl px-6 py-2 font-black text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all gap-2"
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              리뉴 대상자
            </TabsTrigger>
          </TabsList>

          {activeSubTab === "targets" && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                className="flex-1 md:flex-none h-12 bg-white border-slate-200 text-slate-700 font-black px-6 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                양식 다운로드
              </Button>
              <Button
                className="flex-1 md:flex-none h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2"
                onClick={handleExcelUpload}
              >
                <FileUp className="h-5 w-5" />
                엑셀 업로드
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="dashboard" className="mt-0 animate-in fade-in duration-500">
          <RenewalDashboard
            selectedGymId={selectedGymId}
            selectedCompanyId={selectedCompanyId}
            isInitialized={isInitialized}
          />
        </TabsContent>

        <TabsContent value="targets" className="mt-0 animate-in fade-in duration-500">
          {/* 액션바 */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex-1 flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="이름, 전화번호, 회원권 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-11 pr-4 rounded-2xl bg-white border-slate-200 focus:ring-blue-500 font-bold text-sm shadow-sm"
                />
              </div>
              <Button
                variant="outline"
                className="h-12 w-12 bg-white border-slate-200 text-slate-700 p-0 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                onClick={() => {}}
              >
                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* 리뉴 대상자 목록 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white/60 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                <th className="py-5 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">대상 회원</th>
                <th className="py-5 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">만료 회원권</th>
                <th className="py-5 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">만료일</th>
                <th className="py-5 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">담당자</th>
                <th className="py-5 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">메모</th>
                <th className="py-5 px-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">리뉴 대상자가 없습니다</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                <tr 
                  key={member.id} 
                  className="group hover:bg-blue-50/40 transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setSelectedMember(member);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <td className="py-6 px-8">
                    {getStatusBadge(member.status)}
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-slate-900 leading-none tracking-tightest">{member.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{formatPhoneNumber(member.phone)}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-xs font-bold text-slate-600">{member.membershipName}</span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-black">{member.endDate}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-slate-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{member.trainerName}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <p className="text-xs font-bold text-slate-500 line-clamp-1 max-w-[150px]">{member.memo || "-"}</p>
                  </td>
                  <td className="py-6 px-8" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 text-blue-600"
                        title="상담/메시지 보내기"
                        onClick={() => {
                          setSelectedMember(member);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400"
                        title="상세 설정 (수정/삭제/상태변경)"
                        onClick={() => {
                          setSelectedMember(member);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
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
      </Tabs>

      {/* 상세 관리 모달 */}
      <RenewalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        member={selectedMember}
        onUpdate={handleUpdateMember}
        onDelete={handleDeleteMember}
      />
    </div>
  );
}

