"use client";

import { useState } from "react";
import { Plus, Search, Filter, Zap, Maximize2, MoreHorizontal, FileText, Heart, RefreshCw, Book, Bot, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BoardCard {
  id: string;
  title: string;
  icon?: string;
  memberName?: string;
  progress?: string;
}

interface BoardColumn {
  id: string;
  title: string;
  color: string;
  cards: BoardCard[];
}

export default function MembersBoardPage() {
  const [columns, setColumns] = useState<BoardColumn[]>([
    {
      id: "new",
      title: "신규",
      color: "bg-blue-500",
      cards: [
        { id: "1", title: "신규 상담기록지 양식", icon: "file" },
        { id: "2", title: "[예시] ○○○회원님 (00%)", icon: "heart", memberName: "○○○회원님", progress: "00%" },
      ],
    },
    {
      id: "ot",
      title: "OT",
      color: "bg-yellow-500",
      cards: [
        { id: "3", title: "OT 수업 기록지 양식", icon: "file" },
        { id: "4", title: "[예시] ○○○회원님 (00%)", icon: "heart", memberName: "○○○회원님", progress: "00%" },
      ],
    },
    {
      id: "pt",
      title: "PT",
      color: "bg-pink-500",
      cards: [
        { id: "5", title: "PT 회원 관리 양식", icon: "file" },
        { id: "6", title: "[예시] ○○○회원님", icon: "heart", memberName: "○○○회원님" },
      ],
    },
    {
      id: "expired",
      title: "만료",
      color: "bg-gray-500",
      cards: [
        { id: "7", title: "재등록 관리 시스템", icon: "refresh" },
      ],
    },
    {
      id: "template",
      title: "관리 템플릿",
      color: "bg-green-500",
      cards: [
        { id: "8", title: "회원 관리 노션 매뉴얼", icon: "book" },
        { id: "9", title: "첫 상담 후 상담 결과 (트레이너)", icon: "bot" },
        { id: "10", title: "PT 전 준비물 안내 (회원 전달용)", icon: "package" },
      ],
    },
  ]);

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
        return "text-red-500";
      case "refresh":
        return "text-blue-500";
      case "book":
        return "text-green-500";
      case "bot":
        return "text-purple-500";
      case "package":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const handleAddCard = (columnId: string) => {
    // 새 카드 추가 로직 (사용자가 양식을 만들 예정)
    const newCard: BoardCard = {
      id: Date.now().toString(),
      title: "새 페이지",
      icon: "file",
    };
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
      )
    );
  };

  const handleAddGroup = () => {
    // 새 그룹 추가 로직
    const newGroup: BoardColumn = {
      id: `group-${Date.now()}`,
      title: "새 그룹",
      color: "bg-slate-500",
      cards: [],
    };
    setColumns([...columns, newGroup]);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">관리중인 회원 리스트</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Zap className="w-4 h-4 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Search className="w-4 h-4 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Maximize2 className="w-4 h-4 text-slate-500" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" />
            새로 만들기
          </Button>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-slate-50 rounded-lg p-4"
          >
            {/* 컬럼 헤더 */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`${column.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                {column.title}
              </span>
              <span className="text-sm text-slate-500">{column.cards.length}</span>
            </div>

            {/* 카드들 */}
            <div className="space-y-3 mb-4">
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 ${getIconColor(card.icon)}`}>
                      {getIcon(card.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">
                        {card.title}
                      </div>
                      {card.memberName && (
                        <div className="text-xs text-slate-500 mt-1">
                          {card.memberName}
                          {card.progress && ` (${card.progress})`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 새 페이지 추가 버튼 */}
            <button
              onClick={() => handleAddCard(column.id)}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 페이지
            </button>
          </div>
        ))}

        {/* 신규 그룹 추가 버튼 */}
        <button
          onClick={handleAddGroup}
          className="flex-shrink-0 w-80 bg-slate-50 rounded-lg p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
        >
          <span className="text-sm text-slate-500">+ 신규 그룹</span>
        </button>
      </div>
    </div>
  );
}

