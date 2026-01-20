"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, FileText, Heart, RefreshCw, Book, Bot, Package, Filter, Search, Copy, Trash2, X, Users, Dumbbell, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConsultationFormModal } from "./ConsultationFormModal";
import { ConsultationFormData } from "@/app/admin/consultation/types";
import { OTFormModal } from "@/app/admin/ot-record/components/OTFormModal";
import { OTFormData, calculateOTFormCompletion } from "@/app/admin/ot-record/types";
import { PTFormModal } from "@/app/admin/pt-record/components/PTFormModal";
import { PTFormData, calculatePTFormCompletion } from "@/app/admin/pt-record/types";
import { MemberManualModal } from "./MemberManualModal";
import { PTPreparationGuideModal } from "./PTPreparationGuideModal";
import { ConsultationResultModal } from "./modals/ConsultationResultModal";
import { OTResultShareModal } from "./modals/OTResultShareModal";

// 선택된 목표 유형 가져오기
function getSelectedGoalType(data?: ConsultationFormData): string {
  if (!data) return "";
  if (data.dietGoal.selected) return "다이어트형";
  if (data.rehabGoal.selected) return "재활/체형교정형";
  if (data.strengthGoal.selected) return "근력/퍼포먼스형";
  if (data.habitGoal.selected) return "습관개선형";
  if (data.otherGoal.selected) return "기타";
  return "";
}

// 폼 완료율 계산
function calculateFormCompletion(data?: ConsultationFormData): number {
  if (!data) return 0;

  let filled = 0;
  let total = 0;

  // 기본 정보 (5개 필드)
  total += 5;
  if (data.memberName) filled++;
  if (data.phoneNumber) filled++;
  if (data.assignedTrainer) filled++;
  if (data.consultationType) filled++;
  if (data.firstMeetingDate) filled++;

  // 방문 경로 (최소 1개 선택 여부)
  total += 1;
  const hasVisitSource = data.visitSource.naverPlace || data.visitSource.instagram ||
    data.visitSource.blog || data.visitSource.referral || data.visitSource.walkIn || data.visitSource.other;
  if (hasVisitSource) filled++;

  // 운동 경험 (최소 1개 선택 여부)
  total += 1;
  const hasExperience = data.exerciseExperiences.some(exp => exp.hasExperience);
  if (hasExperience) filled++;

  // 목표 설정 (1개 선택 필수)
  total += 1;
  const hasGoal = data.dietGoal.selected || data.rehabGoal.selected ||
    data.strengthGoal.selected || data.habitGoal.selected || data.otherGoal.selected;
  if (hasGoal) filled++;

  // 운동 가능 시간 (주 몇 회 선택)
  total += 1;
  if (data.availableTime.preferredWeeklyCount > 0) filled++;

  return Math.round((filled / total) * 100);
}

interface BoardCard {
  id: string;
  title: string;
  icon?: string;
  memberName?: string;
  progress?: string;
  isTemplate?: boolean;
  isEditing?: boolean;
  consultationData?: ConsultationFormData;
  otFormData?: OTFormData;
  ptFormData?: PTFormData;
}

interface BoardColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  cards: BoardCard[];
}

const BASE_STORAGE_KEY = "pt-members-kanban-data";

// staff별 storage key 생성 (staff는 본인 ID 포함, 관리자는 기본 키 사용)
const getStorageKey = (userRole: string, userId?: string): string => {
  if (userRole === "staff" && userId) {
    return `${BASE_STORAGE_KEY}-${userId}`;
  }
  return BASE_STORAGE_KEY;
};

// 초기 컬럼 데이터
const getInitialColumns = (): BoardColumn[] => [
  {
    id: "new",
    title: "신규",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    cards: [
      { id: "1", title: "신규 상담기록지 양식", icon: "file", isTemplate: true },
    ],
  },
  {
    id: "ot",
    title: "OT",
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50",
    cards: [
      { id: "3", title: "OT 수업 기록지 양식", icon: "file", isTemplate: true },
    ],
  },
  {
    id: "pt",
    title: "PT",
    color: "bg-pink-500",
    bgColor: "bg-pink-50",
    cards: [
      { id: "5", title: "PT 회원 관리 양식", icon: "file", isTemplate: true },
    ],
  },
  {
    id: "template",
    title: "관리 템플릿",
    color: "bg-green-500",
    bgColor: "bg-green-50",
    cards: [
      { id: "8", title: "회원 관리 노션 매뉴얼", icon: "book", isTemplate: true },
      { id: "9", title: "첫 상담 후 상담 결과 (트레이너)", icon: "bot", isTemplate: true },
      { id: "10", title: "PT 전 준비물 안내 (회원 전달용)", icon: "package", isTemplate: true },
    ],
  },
];

// localStorage에서 데이터 로드
function loadFromStorage(storageKey: string): BoardColumn[] | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      // "만료" 컬럼 제거
      return data.filter((col: BoardColumn) => col.id !== "expired");
    }
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
  }
  return null;
}

// localStorage에 데이터 저장
function saveToStorage(storageKey: string, columns: BoardColumn[]) {
  if (typeof window === "undefined") return;
  try {
    // "만료" 컬럼 제외하고 저장
    const filteredColumns = columns.filter((col) => col.id !== "expired");
    localStorage.setItem(storageKey, JSON.stringify(filteredColumns));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export function MemberKanbanBoard() {
  const { user } = useAuth();
  const userRole = user?.role || "";
  const userId = user?.id;

  // staff별 storage key 계산
  const storageKey = useMemo(() => getStorageKey(userRole, userId), [userRole, userId]);

  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isOTModalOpen, setIsOTModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<{ name: string; cardId: string; consultationData?: ConsultationFormData } | null>(null);
  const [selectedMemberForOTModal, setSelectedMemberForOTModal] = useState<{ name: string; phone?: string; cardId: string; otFormData?: OTFormData } | null>(null);
  const [isPTModalOpen, setIsPTModalOpen] = useState(false);
  const [selectedMemberForPTModal, setSelectedMemberForPTModal] = useState<{ name: string; phone?: string; cardId: string; ptFormData?: PTFormData } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isConsultationResultModalOpen, setIsConsultationResultModalOpen] = useState(false);
  const [isPreparationGuideModalOpen, setIsPreparationGuideModalOpen] = useState(false);
  const [isOTResultShareModalOpen, setIsOTResultShareModalOpen] = useState(false);
  const [selectedOTDataForShare, setSelectedOTDataForShare] = useState<{ otData: OTFormData; memberName: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<BoardColumn[]>(getInitialColumns);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["new", "ot", "pt"]);
  const [selectedGoalTypes, setSelectedGoalTypes] = useState<string[]>([]);
  const [progressFilter, setProgressFilter] = useState<string>("all"); // all, low (0-50), medium (51-80), high (81-100)

  // 컴포넌트 마운트 시 localStorage에서 데이터 로드 (storageKey가 준비된 후)
  useEffect(() => {
    if (!storageKey) return;

    const savedData = loadFromStorage(storageKey);
    if (savedData) {
      // "만료" 컬럼 제거
      const filteredData = savedData.filter((col) => col.id !== "expired");
      setColumns(filteredData);
    } else {
      // 저장된 데이터가 없으면 초기 데이터 설정
      setColumns(getInitialColumns());
    }
    setIsLoaded(true);
  }, [storageKey]);

  // columns 변경 시 localStorage에 저장
  useEffect(() => {
    if (isLoaded && storageKey) {
      saveToStorage(storageKey, columns);
    }
  }, [columns, isLoaded, storageKey]);

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case "file":
        return <FileText className="w-5 h-5" />;
      case "heart":
        return <Heart className="w-5 h-5" />;
      case "refresh":
        return <RefreshCw className="w-5 h-5" />;
      case "book":
        return <Book className="w-5 h-5" />;
      case "bot":
        return <Bot className="w-5 h-5" />;
      case "package":
        return <Package className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getIconColor = (iconType?: string) => {
    switch (iconType) {
      case "file":
        return "text-yellow-500";
      case "heart":
        return "text-red-400";
      case "refresh":
        return "text-blue-500";
      case "book":
        return "text-green-500";
      case "bot":
        return "text-purple-500";
      case "package":
        return "text-cyan-500";
      default:
        return "text-gray-500";
    }
  };

  // 편집 중인 카드에 포커스
  useEffect(() => {
    if (editingCardId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCardId]);

  const handleCardClick = (card: BoardCard, columnId: string) => {
    // 회원 관리 노션 매뉴얼 클릭 시 매뉴얼 모달 열기
    if (card.id === "8" && card.title === "회원 관리 노션 매뉴얼") {
      setIsManualModalOpen(true);
      return;
    }

    // 첫 상담 후 상담 결과 (트레이너) 클릭 시 모달 열기
    if (card.id === "9" && card.title === "첫 상담 후 상담 결과 (트레이너)") {
      setIsConsultationResultModalOpen(true);
      return;
    }

    // PT 전 준비물 안내 클릭 시 모달 열기
    if (card.id === "10" && card.title === "PT 전 준비물 안내 (회원 전달용)") {
      setIsPreparationGuideModalOpen(true);
      return;
    }

    // 신규 상담기록지 양식 클릭 시 모달 열기 (새 회원용)
    if (card.id === "1" && card.title === "신규 상담기록지 양식") {
      setSelectedMemberForModal(null); // 새 회원이므로 null
      setIsConsultationModalOpen(true);
      return;
    }

    // OT 수업 기록지 양식 클릭 시 모달 열기 (새 OT 기록용)
    if (card.id === "3" && card.title === "OT 수업 기록지 양식") {
      setSelectedMemberForOTModal(null);
      setIsOTModalOpen(true);
      return;
    }

    // OT 컬럼의 회원 카드 클릭 시 OT 모달 열기
    if (columnId === "ot" && !card.isTemplate && !card.isEditing && card.memberName) {
      setSelectedMemberForOTModal({
        name: card.memberName,
        cardId: card.id,
        otFormData: card.otFormData,
      });
      setIsOTModalOpen(true);
      return;
    }

    // PT 회원 관리 양식 클릭 시 모달 열기 (새 PT 기록용)
    if (card.id === "5" && card.title === "PT 회원 관리 양식") {
      setSelectedMemberForPTModal(null);
      setIsPTModalOpen(true);
      return;
    }

    // PT 컬럼의 회원 카드 클릭 시 PT 모달 열기
    if (columnId === "pt" && !card.isTemplate && !card.isEditing && card.memberName) {
      setSelectedMemberForPTModal({
        name: card.memberName,
        cardId: card.id,
        ptFormData: card.ptFormData,
      });
      setIsPTModalOpen(true);
      return;
    }

    // 편집 중이 아닌 회원 카드 클릭 시 상담 모달 열기
    if (!card.isTemplate && !card.isEditing && card.memberName) {
      setSelectedMemberForModal({ name: card.memberName, cardId: card.id, consultationData: card.consultationData });
      setIsConsultationModalOpen(true);
    }
  };

  // 새 카드 생성 함수
  const handleCreateNewCard = (columnId: string) => {
    const newCardId = Date.now().toString();
    const newCard: BoardCard = {
      id: newCardId,
      title: "",
      icon: "heart",
      isEditing: true,
    };

    // 템플릿 카드 바로 아래에 새 카드 추가
    setColumns(
      columns.map((col) => {
        if (col.id === columnId) {
          // 컬럼에 맞는 템플릿 ID 찾기
          const templateId = columnId === "ot" ? "3" : columnId === "pt" ? "5" : "1";
          const templateIndex = col.cards.findIndex((c) => c.id === templateId);
          const newCards = [...col.cards];
          newCards.splice(templateIndex + 1, 0, newCard);
          return { ...col, cards: newCards };
        }
        return col;
      })
    );
    setEditingCardId(newCardId);
  };

  // 복제 아이콘 클릭 시 새 카드 생성
  const handleDuplicateCard = (e: React.MouseEvent, columnId: string) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    handleCreateNewCard(columnId);
  };

  // 카드 제목 변경
  const handleTitleChange = (cardId: string, newTitle: string) => {
    setColumns(
      columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId ? { ...card, title: newTitle } : card
        ),
      }))
    );
  };

  // 카드 편집 완료
  const handleTitleSave = (cardId: string) => {
    setColumns(
      columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) => {
          if (card.id === cardId) {
            const memberName = card.title.trim() || "새 회원";
            return {
              ...card,
              title: `${memberName} (0%)`,
              memberName: memberName,
              progress: "0%",
              isEditing: false,
            };
          }
          return card;
        }),
      }))
    );
    setEditingCardId(null);
  };

  // 상담기록지 저장 완료 시
  const handleSaveConsultation = (formData: ConsultationFormData) => {
    const memberName = formData.memberName;
    const completionRate = calculateFormCompletion(formData);

    if (selectedMemberForModal) {
      // 기존 카드 업데이트
      setColumns(
        columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) =>
            card.id === selectedMemberForModal.cardId
              ? {
                  ...card,
                  memberName,
                  title: `${memberName} (${completionRate}%)`,
                  progress: `${completionRate}%`,
                  consultationData: formData
                }
              : card
          ),
        }))
      );
    } else {
      // 새 회원 카드 추가 (신규 상담기록지 양식 클릭 후 저장 시)
      const newCard: BoardCard = {
        id: Date.now().toString(),
        title: `${memberName} (${completionRate}%)`,
        icon: "heart",
        memberName: memberName,
        progress: `${completionRate}%`,
        consultationData: formData,
      };
      setColumns(
        columns.map((col) => {
          if (col.id === "new") {
            const templateIndex = col.cards.findIndex(c => c.id === "1");
            const newCards = [...col.cards];
            newCards.splice(templateIndex + 1, 0, newCard);
            return { ...col, cards: newCards };
          }
          return col;
        })
      );
    }
    setIsConsultationModalOpen(false);
    setSelectedMemberForModal(null);
  };

  // OT 기록지 저장 완료 시
  const handleSaveOTForm = (formData: OTFormData) => {
    const memberName = formData.basicInfo.memberName;
    const completionRate = calculateOTFormCompletion(formData);

    if (selectedMemberForOTModal) {
      // 기존 카드 업데이트
      setColumns(
        columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) =>
            card.id === selectedMemberForOTModal.cardId
              ? {
                  ...card,
                  memberName,
                  title: `${memberName} (${completionRate}%)`,
                  progress: `${completionRate}%`,
                  otFormData: formData,
                }
              : card
          ),
        }))
      );
    } else {
      // 새 OT 카드 추가 (OT 수업 기록지 양식 클릭 후 저장 시)
      const newCard: BoardCard = {
        id: Date.now().toString(),
        title: `${memberName} (${completionRate}%)`,
        icon: "heart",
        memberName: memberName,
        progress: `${completionRate}%`,
        otFormData: formData,
      };
      setColumns(
        columns.map((col) => {
          if (col.id === "ot") {
            const templateIndex = col.cards.findIndex((c) => c.id === "3");
            const newCards = [...col.cards];
            newCards.splice(templateIndex + 1, 0, newCard);
            return { ...col, cards: newCards };
          }
          return col;
        })
      );
    }
    setIsOTModalOpen(false);
    setSelectedMemberForOTModal(null);
  };

  // PT 기록지 저장 완료 시
  const handleSavePTForm = (formData: PTFormData) => {
    const memberName = formData.basicInfo.memberName;
    const completionRate = calculatePTFormCompletion(formData);

    if (selectedMemberForPTModal) {
      // 기존 카드 업데이트
      setColumns(
        columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) =>
            card.id === selectedMemberForPTModal.cardId
              ? {
                  ...card,
                  memberName,
                  title: `${memberName} (${completionRate}%)`,
                  progress: `${completionRate}%`,
                  ptFormData: formData,
                }
              : card
          ),
        }))
      );
    } else {
      // 새 PT 카드 추가 (PT 회원 관리 양식 클릭 후 저장 시)
      const newCard: BoardCard = {
        id: Date.now().toString(),
        title: `${memberName} (${completionRate}%)`,
        icon: "heart",
        memberName: memberName,
        progress: `${completionRate}%`,
        ptFormData: formData,
      };
      setColumns(
        columns.map((col) => {
          if (col.id === "pt") {
            const templateIndex = col.cards.findIndex((c) => c.id === "5");
            const newCards = [...col.cards];
            newCards.splice(templateIndex + 1, 0, newCard);
            return { ...col, cards: newCards };
          }
          return col;
        })
      );
    }
    setIsPTModalOpen(false);
    setSelectedMemberForPTModal(null);
  };

  // 카드 삭제 (템플릿 카드와 관리 템플릿 컬럼의 카드는 삭제 불가)
  const handleDeleteCard = (e: React.MouseEvent, cardId: string, columnId: string) => {
    e.stopPropagation();

    if (confirm("정말 삭제하시겠습니까?")) {
      setColumns(
        columns.map((col) =>
          col.id === columnId
            ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
            : col
        )
      );
    }
  };

  // 카드 필터링 함수
  const filterCard = (card: BoardCard, columnId: string): boolean => {
    // 템플릿 카드는 항상 표시
    if (card.isTemplate) return true;

    // 컬럼 필터
    if (!selectedColumns.includes(columnId) && columnId !== "template") {
      return false;
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        card.memberName?.toLowerCase().includes(query) ||
        card.title.toLowerCase().includes(query) ||
        getSelectedGoalType(card.consultationData).toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // 목표 유형 필터
    if (selectedGoalTypes.length > 0) {
      const goalType = getSelectedGoalType(card.consultationData);
      if (!selectedGoalTypes.includes(goalType) && goalType !== "") {
        return false;
      }
    }

    // 완료율 필터
    if (progressFilter !== "all" && card.progress) {
      const progress = parseInt(card.progress.replace("%", ""));
      if (progressFilter === "low" && progress > 50) return false;
      if (progressFilter === "medium" && (progress <= 50 || progress > 80)) return false;
      if (progressFilter === "high" && progress <= 80) return false;
    }

    return true;
  };

  // 필터링된 컬럼 데이터 (관리 템플릿 제외)
  const filteredColumns = columns
    .filter((column) => column.id !== "template")
    .map((column) => ({
      ...column,
      cards: column.cards.filter((card) => filterCard(card, column.id)),
    }));

  // 관리 템플릿 컬럼 (페이지 하단에 별도 배치)
  const templateColumn = columns.find((col) => col.id === "template");
  const filteredTemplateColumn = templateColumn
    ? {
        ...templateColumn,
        cards: templateColumn.cards.filter((card) => filterCard(card, templateColumn.id)),
      }
    : null;

  // 필터 초기화
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedColumns(["new", "ot", "pt"]);
    setSelectedGoalTypes([]);
    setProgressFilter("all");
  };

  // 필터 활성화 여부 확인
  const hasActiveFilters = 
    searchQuery.trim() !== "" ||
    selectedColumns.length < 3 ||
    selectedGoalTypes.length > 0 ||
    progressFilter !== "all";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 상단 섹션 - 헤더 및 액션 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">회원 코칭현황</h2>
              <p className="text-sm text-slate-500 mt-0.5">상담부터 PT까지 코칭 프로세스를 관리하세요</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-gray-100/80 backdrop-blur-sm rounded-xl p-1.5 flex-1 sm:flex-none">
              {/* 필터 버튼 */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className={`p-2 hover:bg-white rounded-lg transition-all relative group ${
                      hasActiveFilters ? "bg-white shadow-sm" : ""
                    }`}
                    title="필터"
                  >
                    <Filter className={`w-4.5 h-4.5 ${hasActiveFilters ? "text-blue-600" : "text-slate-500 group-hover:text-blue-600"}`} />
                    {hasActiveFilters && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white border-gray-100 shadow-2xl rounded-2xl p-5" align="end">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">상세 필터</h3>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-md transition-colors"
                        >
                          초기화
                        </button>
                      )}
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* 컬럼 필터 */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">단계별 보기</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "new", label: "신규" },
                          { id: "ot", label: "OT" },
                          { id: "pt", label: "PT" },
                        ].map((col) => (
                          <div 
                            key={col.id} 
                            onClick={() => {
                              if (selectedColumns.includes(col.id)) {
                                setSelectedColumns(selectedColumns.filter((id) => id !== col.id));
                              } else {
                                setSelectedColumns([...selectedColumns, col.id]);
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                              selectedColumns.includes(col.id) 
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" 
                                : "bg-gray-50 border-gray-100 text-slate-500"
                            }`}
                          >
                            <Checkbox
                              id={`column-${col.id}`}
                              checked={selectedColumns.includes(col.id)}
                              className="border-gray-300 data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-sm">{col.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 완료율 필터 */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">작성 완료율</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "all", label: "전체" },
                          { value: "low", label: "0-50%" },
                          { value: "medium", label: "51-80%" },
                          { value: "high", label: "81-100%" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setProgressFilter(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              progressFilter === option.value
                                ? "bg-slate-900 border-slate-900 text-white"
                                : "bg-white border-gray-200 text-slate-600 hover:border-gray-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* 검색 버튼 및 입력창 */}
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-blue-100 animate-in slide-in-from-right-2 duration-300">
                  <Search className="w-4 h-4 text-blue-500" />
                  <Input
                    type="text"
                    placeholder="회원명 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-40 sm:w-56 text-sm border-none shadow-none focus-visible:ring-0 p-0 font-medium"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-2 hover:bg-white rounded-lg transition-all group ${
                    searchQuery.trim() ? "bg-white shadow-sm text-blue-600" : "text-slate-500 group-hover:text-blue-600"
                  }`}
                  title="검색"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#2F80ED] hover:bg-[#1c60b8] text-white gap-2 h-11 px-5 rounded-xl shadow-lg shadow-blue-100 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="w-5 h-5" />
                  <span>새로 만들기</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-100 shadow-2xl rounded-2xl p-2">
                <DropdownMenuItem onClick={() => handleCreateNewCard("new")} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-blue-50 focus:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-bold text-slate-700">신규 상담 카드</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateNewCard("ot")} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-amber-50 focus:bg-amber-50 transition-colors">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-bold text-slate-700">OT 기록 카드</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateNewCard("pt")} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-pink-50 focus:bg-pink-50 transition-colors">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-pink-600" />
                  </div>
                  <span className="font-bold text-slate-700">PT 기록 카드</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 칸반 보드 메인 그리드 */}
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="grid grid-cols-3 gap-6 min-w-[900px]">
            {filteredColumns.map((column) => (
              <div
                key={column.id}
                className="flex flex-col min-w-0"
              >
                {/* 컬럼 헤더 - 더 입체적인 디자인 */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      column.id === 'new' ? 'bg-blue-500' : column.id === 'ot' ? 'bg-amber-500' : 'bg-pink-500'
                    }`}></div>
                    <h3 className="font-bold text-slate-800 tracking-tight">{column.title}</h3>
                    <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {column.cards.length}
                    </span>
                  </div>
                </div>

                {/* 카드 리스트 */}
                <div className="space-y-3 flex-1 min-h-[400px] p-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  {column.cards.map((card) => {
                    const goalType = getSelectedGoalType(card.consultationData);
                    const progressValue = card.progress ? parseInt(card.progress.replace("%", "")) : 0;
                    
                    return (
                      <div
                        key={card.id}
                        onClick={() => !card.isEditing && handleCardClick(card, column.id)}
                        className={`group bg-white rounded-2xl p-4 shadow-sm border transition-all relative ${
                          card.isEditing
                            ? "border-blue-400 ring-4 ring-blue-50"
                            : "border-gray-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 hover:-translate-y-1 cursor-pointer"
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                card.isTemplate ? "bg-slate-50 text-slate-400" : `bg-white border border-gray-100 ${getIconColor(card.icon)}`
                              }`}>
                                {getIcon(card.icon)}
                              </div>
                              <div className="min-w-0">
                                {card.isEditing ? (
                                  <input
                                    ref={card.id === editingCardId ? inputRef : null}
                                    type="text"
                                    value={card.title}
                                    onChange={(e) => handleTitleChange(card.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleTitleSave(card.id);
                                      else if (e.key === "Escape") {
                                        setColumns(columns.map((col) => ({
                                          ...col,
                                          cards: col.cards.filter((c) => c.id !== card.id),
                                        })));
                                        setEditingCardId(null);
                                      }
                                    }}
                                    onBlur={() => handleTitleSave(card.id)}
                                    className="w-full text-sm font-bold text-slate-800 bg-transparent border-none outline-none"
                                    placeholder="회원명 입력..."
                                  />
                                ) : (
                                  <div className="text-sm font-bold text-slate-800 truncate leading-tight">
                                    {card.isTemplate ? card.title : card.memberName}
                                  </div>
                                )}
                                {!card.isTemplate && !card.isEditing && (
                                  <div className="text-[11px] font-bold text-blue-600/70 mt-0.5 truncate uppercase tracking-tighter">
                                    {goalType || "목표 미설정"}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex items-center gap-0.5">
                              {card.isTemplate ? (
                                (card.id === "1" || card.id === "3" || card.id === "5") && (
                                  <button
                                    onClick={(e) => handleDuplicateCard(e, column.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"
                                    title="복제하기"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )
                              ) : (
                                !card.isEditing && (
                                  <>
                                    {/* OT 데이터가 있는 경우 상담결과 공유 버튼 */}
                                    {column.id === "ot" && card.otFormData && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedOTDataForShare({
                                            otData: card.otFormData!,
                                            memberName: card.memberName || ""
                                          });
                                          setIsOTResultShareModalOpen(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-500"
                                        title="상담결과 공유"
                                      >
                                        <Share2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => handleDeleteCard(e, card.id, column.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                                      title="삭제하기"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )
                              )}
                            </div>
                          </div>

                          {/* 카드 하단 - 프로그레스 정보 */}
                          {!card.isTemplate && !card.isEditing && (
                            <div className="mt-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">작성 진행률</span>
                                <span className={`text-[10px] font-bold ${
                                  progressValue === 100 ? "text-emerald-600" : "text-blue-600"
                                }`}>{card.progress}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    progressValue === 100 ? "bg-emerald-500" : "bg-blue-500"
                                  }`}
                                  style={{ width: card.progress }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {card.isTemplate && (
                            <div className="flex items-center justify-end mt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md uppercase tracking-tighter">Template</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 리소스 라이브러리 섹션 (기존 관리 템플릿) */}
      {filteredTemplateColumn && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">리소스 라이브러리</h3>
              <p className="text-sm text-slate-500 mt-0.5">코칭에 필요한 각종 매뉴얼과 가이드를 활용하세요</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTemplateColumn.cards.map((card) => (
              <div
                key={card.id}
                onClick={() => !card.isEditing && handleCardClick(card, filteredTemplateColumn.id)}
                className="group bg-slate-50 hover:bg-emerald-50 rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                
                <div className="flex flex-col gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                    card.icon === 'book' ? 'bg-amber-100 text-amber-600' : 
                    card.icon === 'bot' ? 'bg-purple-100 text-purple-600' : 'bg-cyan-100 text-cyan-600'
                  }`}>
                    {getIcon(card.icon)}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-800 leading-snug group-hover:text-emerald-900 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {card.id === "8" ? "센터 운영 및 회원 관리 표준화 프로세스" :
                       card.id === "9" ? "OT 기록을 바탕으로 회원님께 공유할 맞춤 상담 결과" :
                       "회원이 첫 수업 전 준비해야 할 체크리스트"}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                    <span>자세히 보기</span>
                    <Plus className="w-3 h-3 rotate-45" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 신규 상담기록지 모달 */}
      <ConsultationFormModal
        isOpen={isConsultationModalOpen}
        onClose={() => {
          setIsConsultationModalOpen(false);
          setSelectedMemberForModal(null);
        }}
        onSave={handleSaveConsultation}
        memberName={selectedMemberForModal?.name}
        existingData={selectedMemberForModal?.consultationData}
      />

      {/* OT 수업 기록지 모달 */}
      <OTFormModal
        isOpen={isOTModalOpen}
        onClose={() => {
          setIsOTModalOpen(false);
          setSelectedMemberForOTModal(null);
        }}
        onSave={handleSaveOTForm}
        memberName={selectedMemberForOTModal?.name}
        memberPhone={selectedMemberForOTModal?.phone}
        existingData={selectedMemberForOTModal?.otFormData}
      />

      {/* PT 회원 관리 모달 */}
      <PTFormModal
        isOpen={isPTModalOpen}
        onClose={() => {
          setIsPTModalOpen(false);
          setSelectedMemberForPTModal(null);
        }}
        onSave={handleSavePTForm}
        memberName={selectedMemberForPTModal?.name}
        memberPhone={selectedMemberForPTModal?.phone}
        existingData={selectedMemberForPTModal?.ptFormData}
      />

      {/* 회원 관리 노션 매뉴얼 모달 */}
      <MemberManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      {/* 첫 상담 후 상담 결과 모달 */}
      <ConsultationResultModal
        isOpen={isConsultationResultModalOpen}
        onClose={() => setIsConsultationResultModalOpen(false)}
        membersWithData={[
          // 신규 회원 (상담 데이터)
          ...(columns
            .find(col => col.id === "new")
            ?.cards
            .filter(card => !card.isTemplate && card.consultationData && card.memberName)
            .map(card => ({
              id: card.id,
              memberName: card.memberName!,
              type: "consultation" as const,
              consultationData: card.consultationData!,
            })) || []),
          // OT 회원 (OT 데이터)
          ...(columns
            .find(col => col.id === "ot")
            ?.cards
            .filter(card => !card.isTemplate && card.otFormData && card.memberName)
            .map(card => ({
              id: card.id,
              memberName: card.memberName!,
              type: "ot" as const,
              otFormData: card.otFormData!,
            })) || []),
        ]}
        gymName="We:form"
      />

      {/* PT 전 준비물 안내 모달 */}
      <PTPreparationGuideModal
        isOpen={isPreparationGuideModalOpen}
        onClose={() => setIsPreparationGuideModalOpen(false)}
      />

      {/* OT 상담결과 공유 모달 */}
      <OTResultShareModal
        isOpen={isOTResultShareModalOpen}
        onClose={() => {
          setIsOTResultShareModalOpen(false);
          setSelectedOTDataForShare(null);
        }}
        otData={selectedOTDataForShare?.otData || null}
        gymName="We:form"
      />
    </div>
  );
}
