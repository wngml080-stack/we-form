"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Plus, RefreshCw, FileUp, Download, AlertCircle,
  Trash2, BarChart3, Users,
  X, Save, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";
import { RenewalDashboard } from "./RenewalDashboard";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import type { ActivityStatus, ActivityRecord, RenewalMember, ExpiryType } from "../types/renewal";
import {
  activityStatusLabels,
  activityStatusColors,
  getExpiryType,
  getDday,
} from "../utils/renewal";

// 만기 분류 뱃지 색상
function getExpiryTypeBadge(type: ExpiryType) {
  switch (type) {
    case 'this_month':
      return <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[10px]">당월만기</Badge>;
    case 'next_month':
      return <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[10px]">익월만기</Badge>;
    case 'after_next_month':
      return <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[10px]">익월이외</Badge>;
    case 'expired':
      return <Badge className="bg-slate-200 text-slate-500 border-none font-black text-[10px]">만료자</Badge>;
  }
}

// 현재 활동 상태 계산 (content 기반 - utils 버전과 다름)
function getCurrentActivityStatus(member: RenewalMember): { label: string; color: string } {
  if (member.activity4?.content) {
    return { label: '4차 완료', color: 'bg-emerald-100 text-emerald-600' };
  }
  if (member.activity3?.content) {
    return { label: '3차 완료', color: 'bg-blue-100 text-blue-600' };
  }
  if (member.activity2?.content) {
    return { label: '2차 완료', color: 'bg-amber-100 text-amber-600' };
  }
  if (member.activity1?.content) {
    return { label: '1차 완료', color: 'bg-violet-100 text-violet-600' };
  }
  return { label: '미연락', color: 'bg-slate-100 text-slate-500' };
}

export function RenewalSection({
  selectedGymId,
  selectedCompanyId,
  gymName: _gymName,
  isInitialized
}: {
  selectedGymId: string | null;
  selectedCompanyId: string | null;
  gymName: string;
  isInitialized: boolean;
}) {
  // 직원 목록 가져오기
  const { staffs } = useAdminFilter();

  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, _setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<ExpiryType | 'all'>('all');

  // 인라인 수정 관련 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RenewalMember>>({});

  // 새 행 추가 관련 상태
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMember, setNewMember] = useState<Partial<RenewalMember>>({
    name: '',
    phone: '',
    membershipName: '',
    endDate: '',
    trainerName: '',
    memo: ''
  });

  // 활동 기록 편집 상태 (모달용)
  const [editingActivity, setEditingActivity] = useState<{
    memberId: string;
    activityNum: 1 | 2 | 3 | 4;
    isEdit?: boolean; // 수정 모드인지
  } | null>(null);
  const [activityForm, setActivityForm] = useState<{
    content: string;
    status: ActivityStatus;
    staffName: string;
    reason: string;
    expectedDate: string;
  }>({
    content: '',
    status: 'contacted',
    staffName: '',
    reason: '',
    expectedDate: ''
  });

  // 가상의 데이터 (추후 DB 연동 필요)
  const [members, setMembers] = useState<RenewalMember[]>([
    {
      id: "1",
      name: "김민수",
      phone: "010-1234-5678",
      membershipName: "헬스 3개월 (오전권)",
      endDate: "2026-01-25",
      trainerName: "이강사",
      memo: "전화 필요",
      activity1: { date: "2026-01-10", content: "전화 연락 - 부재중", status: "absent", staffName: "이강사" },
      activity2: { date: "2026-01-15", content: "재연락 - 등록하겠다고 함", status: "will_register", staffName: "이강사", expectedDate: "2026-01-28" }
    },
    {
      id: "2",
      name: "이지연",
      phone: "010-9876-5432",
      membershipName: "PT 20회",
      endDate: "2026-01-20",
      trainerName: "박코치",
      memo: "재등록 고민 중",
      activity1: { date: "2026-01-08", content: "전화 연락 - 다음주 결정 예정", status: "considering", staffName: "박코치", reason: "다른 센터와 비교 중" },
      activity2: { date: "2026-01-12", content: "카톡 발송 - 확인함", status: "contacted", staffName: "박코치" }
    },
    {
      id: "3",
      name: "박서준",
      phone: "010-5555-1234",
      membershipName: "헬스+락커 6개월",
      endDate: "2026-01-28",
      trainerName: "김트레이너",
      memo: ""
    },
    {
      id: "4",
      name: "최유리",
      phone: "010-7777-8888",
      membershipName: "필라테스 30회",
      endDate: "2026-02-10",
      trainerName: "정코치",
      memo: "해외 출장 예정",
      activity1: { date: "2026-01-18", content: "등록 확정", status: "will_register", staffName: "정코치", expectedDate: "2026-02-05" }
    },
    {
      id: "5",
      name: "한도현",
      phone: "010-2222-3333",
      membershipName: "헬스 1개월",
      endDate: "2025-12-31",
      trainerName: "이강사",
      memo: "연락 두절",
      activity1: { date: "2025-12-20", content: "전화 연락 - 부재", status: "absent", staffName: "이강사" },
      activity2: { date: "2025-12-25", content: "문자 발송 - 무응답", status: "absent", staffName: "이강사" },
      activity3: { date: "2025-12-28", content: "재등록 안 한다고 함", status: "rejected", staffName: "이강사", reason: "이사 예정" }
    },
    // 긴급 대상자 - 당월만기 + 미연락
    {
      id: "6",
      name: "정수현",
      phone: "010-3333-4444",
      membershipName: "헬스 3개월",
      endDate: "2026-01-22",
      trainerName: "박코치",
      memo: "긴급 연락 필요"
    },
    {
      id: "7",
      name: "강민정",
      phone: "010-4444-5555",
      membershipName: "PT 10회",
      endDate: "2026-01-30",
      trainerName: "김트레이너",
      memo: ""
    },
    {
      id: "8",
      name: "윤서영",
      phone: "010-5555-6666",
      membershipName: "요가 1개월",
      endDate: "2026-01-24",
      trainerName: "이강사",
      memo: "오전 연락 선호"
    },
    // 등록 예정자
    {
      id: "9",
      name: "임재현",
      phone: "010-6666-7777",
      membershipName: "헬스+PT 패키지",
      endDate: "2026-02-05",
      trainerName: "박코치",
      memo: "6개월 재등록 예정",
      activity1: { date: "2026-01-15", content: "상담 완료 - 6개월 등록 예정", status: "will_register", staffName: "박코치", expectedDate: "2026-02-01" }
    },
    {
      id: "10",
      name: "송지우",
      phone: "010-7777-8888",
      membershipName: "필라테스 20회",
      endDate: "2026-02-20",
      trainerName: "정코치",
      memo: "",
      activity1: { date: "2026-01-18", content: "연락 완료", status: "contacted", staffName: "정코치" },
      activity2: { date: "2026-01-19", content: "재등록 확정", status: "will_register", staffName: "정코치", expectedDate: "2026-02-15" }
    }
  ]);

  // 필터링된 회원 목록
  const filteredMembers = useMemo(() => {
    let result = members.filter(m =>
      m.name.includes(searchQuery) ||
      m.phone.includes(searchQuery) ||
      m.membershipName.includes(searchQuery)
    );

    if (filterType !== 'all') {
      result = result.filter(m => getExpiryType(m.endDate) === filterType);
    }

    // 만료일 기준 정렬 (가까운 날짜 먼저)
    return result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  }, [members, searchQuery, filterType]);

  // 각 분류별 카운트
  const typeCounts = useMemo(() => {
    const counts = { this_month: 0, next_month: 0, after_next_month: 0, expired: 0 };
    members.forEach(m => {
      const type = getExpiryType(m.endDate);
      counts[type]++;
    });
    return counts;
  }, [members]);

  const handleExcelUpload = () => {
    alert("엑셀 업로드 기능은 준비 중입니다.");
  };

  const handleDownloadTemplate = () => {
    // 엑셀 템플릿 생성 및 다운로드
    import('xlsx').then((XLSX) => {
      // 템플릿 데이터 (헤더만)
      const templateData = [
        ['이름', '연락처', '회원권명', '만료일', '담당자', '메모'],
      ];

      // 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // 열 너비 설정
      ws['!cols'] = [
        { wch: 10 },  // 이름
        { wch: 15 },  // 연락처
        { wch: 20 },  // 회원권명
        { wch: 12 },  // 만료일
        { wch: 12 },  // 담당자
        { wch: 30 },  // 메모
      ];

      // 워크북 생성
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '리뉴대상자');

      // 파일 다운로드
      XLSX.writeFile(wb, '리뉴대상자_업로드양식.xlsx');
    });
  };

  // 수기 등록 처리
  const handleAddNewMember = () => {
    if (!newMember.name || !newMember.phone || !newMember.membershipName || !newMember.endDate) {
      alert("이름, 연락처, 회원권, 만료일은 필수입니다.");
      return;
    }

    const newId = `new-${Date.now()}`;
    setMembers(prev => [...prev, {
      id: newId,
      name: newMember.name!,
      phone: newMember.phone!,
      membershipName: newMember.membershipName!,
      endDate: newMember.endDate!,
      trainerName: newMember.trainerName || '',
      memo: newMember.memo || ''
    }]);

    setNewMember({
      name: '',
      phone: '',
      membershipName: '',
      endDate: '',
      trainerName: '',
      memo: ''
    });
    setIsAddingNew(false);
  };

  // 더블클릭 편집 시작
  const handleStartEdit = (member: RenewalMember) => {
    setEditingId(member.id);
    setEditForm({ ...member });
  };

  // 편집 저장
  const handleSaveEdit = () => {
    if (editingId && editForm) {
      setMembers(prev => prev.map(m => m.id === editingId ? { ...m, ...editForm } as RenewalMember : m));
      setEditingId(null);
      setEditForm({});
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 삭제 처리
  const handleDeleteMember = (id: string) => {
    if (confirm("정말 이 회원을 삭제하시겠습니까?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  // 활동 기록 저장
  const handleSaveActivity = (memberId: string, activityNum: 1 | 2 | 3 | 4) => {
    if (!activityForm.status) {
      alert('상태를 선택해주세요.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const activityKey = `activity${activityNum}` as keyof RenewalMember;

    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          [activityKey]: {
            date: today,
            content: activityForm.content || activityStatusLabels[activityForm.status],
            status: activityForm.status,
            staffName: activityForm.staffName,
            reason: activityForm.reason,
            expectedDate: activityForm.expectedDate
          }
        };
      }
      return m;
    }));

    setEditingActivity(null);
    setActivityForm({
      content: '',
      status: 'contacted',
      staffName: '',
      reason: '',
      expectedDate: ''
    });
  };

  // 활동 모달 열기
  const openActivityModal = (memberId: string, activityNum: 1 | 2 | 3 | 4, existingActivity?: ActivityRecord) => {
    setEditingActivity({ memberId, activityNum, isEdit: !!existingActivity });
    if (existingActivity) {
      setActivityForm({
        content: existingActivity.content || '',
        status: existingActivity.status || 'contacted',
        staffName: existingActivity.staffName || '',
        reason: existingActivity.reason || '',
        expectedDate: existingActivity.expectedDate || ''
      });
    } else {
      setActivityForm({
        content: '',
        status: 'contacted',
        staffName: '',
        reason: '',
        expectedDate: ''
      });
    }
  };

  // 활동 모달 닫기
  const closeActivityModal = () => {
    setEditingActivity(null);
    setActivityForm({
      content: '',
      status: 'contacted',
      staffName: '',
      reason: '',
      expectedDate: ''
    });
  };

  // 다음 활동 번호 계산
  const getNextActivityNum = (member: RenewalMember): 1 | 2 | 3 | 4 | null => {
    if (!member.activity1?.content) return 1;
    if (!member.activity2?.content) return 2;
    if (!member.activity3?.content) return 3;
    if (!member.activity4?.content) return 4;
    return null; // 모든 활동 완료
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent, action: 'save' | 'cancel') => {
    if (e.key === 'Enter' && action === 'save') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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
                variant="outline"
                className="flex-1 md:flex-none h-12 bg-white border-slate-200 text-slate-700 font-black px-6 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                onClick={handleExcelUpload}
              >
                <FileUp className="h-4 w-4 mr-2" />
                엑셀 업로드
              </Button>
              <Button
                className="flex-1 md:flex-none h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="h-5 w-5" />
                수기 등록
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="dashboard" className="mt-0 animate-in fade-in duration-500">
          <RenewalDashboard
            selectedGymId={selectedGymId}
            selectedCompanyId={selectedCompanyId}
            isInitialized={isInitialized}
            members={members}
          />
        </TabsContent>

        <TabsContent value="targets" className="mt-0 animate-in fade-in duration-500">
          {/* 필터 및 검색바 */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            {/* 분류 필터 탭 */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                className={cn(
                  "h-10 px-4 rounded-xl font-bold text-xs transition-all",
                  filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'
                )}
                onClick={() => setFilterType('all')}
              >
                전체 ({members.length})
              </Button>
              <Button
                variant={filterType === 'this_month' ? 'default' : 'outline'}
                className={cn(
                  "h-10 px-4 rounded-xl font-bold text-xs transition-all",
                  filterType === 'this_month' ? 'bg-rose-500 text-white' : 'bg-white text-rose-500 border-rose-200 hover:bg-rose-50'
                )}
                onClick={() => setFilterType('this_month')}
              >
                당월만기 ({typeCounts.this_month})
              </Button>
              <Button
                variant={filterType === 'next_month' ? 'default' : 'outline'}
                className={cn(
                  "h-10 px-4 rounded-xl font-bold text-xs transition-all",
                  filterType === 'next_month' ? 'bg-amber-500 text-white' : 'bg-white text-amber-500 border-amber-200 hover:bg-amber-50'
                )}
                onClick={() => setFilterType('next_month')}
              >
                익월만기 ({typeCounts.next_month})
              </Button>
              <Button
                variant={filterType === 'after_next_month' ? 'default' : 'outline'}
                className={cn(
                  "h-10 px-4 rounded-xl font-bold text-xs transition-all",
                  filterType === 'after_next_month' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50'
                )}
                onClick={() => setFilterType('after_next_month')}
              >
                익월이외 ({typeCounts.after_next_month})
              </Button>
              <Button
                variant={filterType === 'expired' ? 'default' : 'outline'}
                className={cn(
                  "h-10 px-4 rounded-xl font-bold text-xs transition-all",
                  filterType === 'expired' ? 'bg-slate-500 text-white' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
                onClick={() => setFilterType('expired')}
              >
                만료자 ({typeCounts.expired})
              </Button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
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
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-slate-200/50 border border-white/60 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[70px]">상태</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[120px]">회원</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[160px]">회원권</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[70px]">유형</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[100px]">만료일</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[80px]">담당자</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[120px]">메모</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[200px]">활동 관리</th>
                    <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[60px]">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* 새 행 추가 폼 */}
                  {isAddingNew && (
                    <tr className="bg-emerald-50/50 border-b-2 border-emerald-200">
                      <td className="py-3 px-3 text-center">
                        <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px]">신규</Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col gap-1">
                          <Input
                            placeholder="이름"
                            value={newMember.name || ''}
                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            className="h-7 text-xs rounded-lg border-slate-200 text-center"
                          />
                          <Input
                            placeholder="연락처"
                            value={newMember.phone || ''}
                            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                            className="h-7 text-xs rounded-lg border-slate-200 text-center"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Input
                          placeholder="회원권명"
                          value={newMember.membershipName || ''}
                          onChange={(e) => setNewMember({ ...newMember, membershipName: e.target.value })}
                          className="h-7 text-xs rounded-lg border-slate-200 text-center"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] text-slate-400">자동</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Input
                          type="date"
                          value={newMember.endDate || ''}
                          onChange={(e) => setNewMember({ ...newMember, endDate: e.target.value })}
                          className="h-7 text-xs rounded-lg border-slate-200"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Input
                          placeholder="담당자"
                          value={newMember.trainerName || ''}
                          onChange={(e) => setNewMember({ ...newMember, trainerName: e.target.value })}
                          className="h-7 text-xs rounded-lg border-slate-200 text-center"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Input
                          placeholder="메모"
                          value={newMember.memo || ''}
                          onChange={(e) => setNewMember({ ...newMember, memo: e.target.value })}
                          className="h-7 text-xs rounded-lg border-slate-200 text-center"
                        />
                      </td>
                      <td className="py-3 px-3 text-center" colSpan={2}>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            onClick={handleAddNewMember}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-3 rounded-lg text-slate-500 hover:text-slate-700 font-bold text-xs"
                            onClick={() => {
                              setIsAddingNew(false);
                              setNewMember({});
                            }}
                          >
                            취소
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">리뉴 대상자가 없습니다</p>
                          <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => setIsAddingNew(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            수기 등록하기
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const isEditing = editingId === member.id;
                      const expiryType = getExpiryType(member.endDate);
                      const dday = getDday(member.endDate);
                      const activityStatus = getCurrentActivityStatus(member);
                      const nextActivity = getNextActivityNum(member);
                      const _isEditingThisActivity = editingActivity?.memberId === member.id;

                      return (
                        <tr
                          key={member.id}
                          className={cn(
                            "group transition-all duration-300",
                            isEditing ? "bg-blue-50/50" : "hover:bg-slate-50/50",
                            expiryType === 'expired' && "opacity-60"
                          )}
                          onDoubleClick={() => !isEditing && handleStartEdit(member)}
                        >
                          {/* 상태 (활동 진행 상태) */}
                          <td className="py-3 px-3 text-center">
                            <Badge className={cn("border-none font-black text-[10px]", activityStatus.color)}>
                              {activityStatus.label}
                            </Badge>
                          </td>

                          {/* 대상 회원 */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <Input
                                  value={editForm.name || ''}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  onKeyDown={(e) => handleKeyDown(e, 'save')}
                                  className="h-7 text-xs rounded-lg border-blue-300 focus:border-blue-500 text-center"
                                  autoFocus
                                />
                                <Input
                                  value={editForm.phone || ''}
                                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                  onKeyDown={(e) => handleKeyDown(e, 'save')}
                                  className="h-7 text-xs rounded-lg border-blue-300 focus:border-blue-500 text-center"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5 cursor-pointer items-center">
                                <span className="font-black text-slate-900 leading-none tracking-tightest">{member.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">{formatPhoneNumber(member.phone)}</span>
                              </div>
                            )}
                          </td>

                          {/* 만료 회원권 */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <Input
                                value={editForm.membershipName || ''}
                                onChange={(e) => setEditForm({ ...editForm, membershipName: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, 'save')}
                                className="h-8 text-xs rounded-lg border-blue-300 focus:border-blue-500 text-center"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-600">{member.membershipName}</span>
                            )}
                          </td>

                          {/* 회원권유형 (자동분류) */}
                          <td className="py-3 px-3 text-center">
                            {getExpiryTypeBadge(expiryType)}
                          </td>

                          {/* 만료일 + D-day */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editForm.endDate || ''}
                                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, 'save')}
                                className="h-8 text-xs rounded-lg border-blue-300 focus:border-blue-500"
                              />
                            ) : (
                              <div className="flex flex-col gap-0.5 items-center">
                                <span className="text-xs font-bold text-slate-600">{member.endDate}</span>
                                <span className={cn("text-[10px] font-black", dday.color)}>{dday.text}</span>
                              </div>
                            )}
                          </td>

                          {/* 담당자 */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <Input
                                value={editForm.trainerName || ''}
                                onChange={(e) => setEditForm({ ...editForm, trainerName: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, 'save')}
                                className="h-8 text-xs rounded-lg border-blue-300 focus:border-blue-500 text-center"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-700">{member.trainerName || '-'}</span>
                            )}
                          </td>

                          {/* 메모 */}
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <Input
                                value={editForm.memo || ''}
                                onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, 'save')}
                                className="h-8 text-xs rounded-lg border-blue-300 focus:border-blue-500 text-center"
                              />
                            ) : (
                              <p className="text-xs font-bold text-slate-500 line-clamp-2">{member.memo || "-"}</p>
                            )}
                          </td>

                          {/* 활동 관리 */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                                  onClick={handleSaveEdit}
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  저장
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-3 rounded-lg text-slate-500 hover:text-slate-700 font-bold text-xs"
                                  onClick={handleCancelEdit}
                                >
                                  취소
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {/* 활동 버튼들 - 더블클릭으로 상세 입력 */}
                                {([1, 2, 3, 4] as const).map((num) => {
                                  const activityKey = `activity${num}` as keyof RenewalMember;
                                  const activity = member[activityKey] as ActivityRecord | undefined;
                                  const isCompleted = !!activity?.content;
                                  const isNext = num === nextActivity;

                                  return (
                                    <Button
                                      key={num}
                                      size="sm"
                                      variant="ghost"
                                      className={cn(
                                        "h-7 w-10 p-0 rounded-lg text-[10px] font-black transition-all",
                                        isCompleted
                                          ? activity?.status ? activityStatusColors[activity.status] : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                          : isNext
                                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200 ring-2 ring-blue-300"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                      )}
                                      onClick={() => openActivityModal(member.id, num, activity)}
                                      onDoubleClick={() => openActivityModal(member.id, num, activity)}
                                      title={activity?.content
                                        ? `${activity.date}: ${activity.status ? activityStatusLabels[activity.status] : ''} - ${activity.content}${activity.staffName ? ` (${activity.staffName})` : ''}`
                                        : `${num}차 활동 입력 (클릭)`}
                                    >
                                      {isCompleted && activity?.status ? activityStatusLabels[activity.status].slice(0, 2) : `${num}차`}
                                    </Button>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* 삭제 */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 mx-auto"
                              onClick={() => handleDeleteMember(member.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
            <span className="font-bold">TIP:</span>
            <span>행을 더블클릭하면 회원 정보를 수정할 수 있습니다. 활동 버튼을 클릭하면 상세 활동 내용을 입력할 수 있습니다.</span>
          </div>
        </TabsContent>
      </Tabs>

      {/* 활동 상세 입력 모달 */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg">
                      {editingActivity.activityNum}차 활동 기록
                    </h3>
                    <p className="text-white text-xs font-medium">
                      {members.find(m => m.id === editingActivity.memberId)?.name} 회원
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
                  onClick={closeActivityModal}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-5">
              {/* 활동 담당자 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  활동 담당자
                </label>
                <Select
                  value={activityForm.staffName}
                  onValueChange={(value) => setActivityForm({ ...activityForm, staffName: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 font-medium">
                    <SelectValue placeholder="담당자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffs.map((staff) => (
                      <SelectItem key={staff.id} value={staff.name}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staff.name}</span>
                          {staff.job_title && (
                            <span className="text-xs text-slate-400">({staff.job_title})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 활동 상태 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  활동 결과 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(activityStatusLabels) as ActivityStatus[]).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 rounded-xl font-bold text-xs transition-all",
                        activityForm.status === status
                          ? cn(activityStatusColors[status], "ring-2 ring-offset-1 ring-current")
                          : "bg-white hover:bg-slate-50"
                      )}
                      onClick={() => setActivityForm({ ...activityForm, status })}
                    >
                      {activityStatusLabels[status]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 상태별 추가 필드 */}
              {activityForm.status === 'rejected' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    거절 사유
                  </label>
                  <Input
                    placeholder="왜 거절했나요? (예: 가격이 비싸서, 시간이 안 맞아서)"
                    value={activityForm.reason}
                    onChange={(e) => setActivityForm({ ...activityForm, reason: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 focus:border-rose-500 font-medium"
                  />
                </div>
              )}

              {activityForm.status === 'will_register' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    등록 예정일
                  </label>
                  <Input
                    type="date"
                    value={activityForm.expectedDate}
                    onChange={(e) => setActivityForm({ ...activityForm, expectedDate: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 font-medium"
                  />
                </div>
              )}

              {activityForm.status === 'considering' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    고민 사유
                  </label>
                  <Input
                    placeholder="왜 고민하나요? (예: 다른 센터와 비교 중, 일정 조율 중)"
                    value={activityForm.reason}
                    onChange={(e) => setActivityForm({ ...activityForm, reason: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 focus:border-amber-500 font-medium"
                  />
                </div>
              )}

              {activityForm.status === 'absent' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    부재 상세
                  </label>
                  <Input
                    placeholder="부재 상황 (예: 전화 안 받음, 문자만 확인)"
                    value={activityForm.reason}
                    onChange={(e) => setActivityForm({ ...activityForm, reason: e.target.value })}
                    className="h-11 rounded-xl border-slate-200 focus:border-slate-500 font-medium"
                  />
                </div>
              )}

              {/* 활동 내용 메모 */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                  활동 내용 메모
                </label>
                <textarea
                  placeholder="상세 활동 내용을 입력하세요..."
                  value={activityForm.content}
                  onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
                  className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium text-sm resize-none outline-none transition-all"
                />
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                className="h-11 px-6 rounded-xl font-bold text-slate-600 hover:text-slate-900"
                onClick={closeActivityModal}
              >
                취소
              </Button>
              <Button
                className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200"
                onClick={() => handleSaveActivity(editingActivity.memberId, editingActivity.activityNum)}
              >
                <Save className="w-4 h-4 mr-2" />
                저장하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
