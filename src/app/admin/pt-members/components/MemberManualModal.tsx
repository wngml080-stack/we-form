"use client";

import { useState } from "react";
import { X, Book, FileText, Dumbbell, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Clock, Target, Activity, Users, Calendar, ClipboardList, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SectionId = "consultation" | "ot" | "pt" | "workflow" | "tips";

interface Section {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  color: string;
}

const sections: Section[] = [
  { id: "consultation", title: "상담 기록지 작성", icon: <FileText className="w-5 h-5" />, color: "blue" },
  { id: "ot", title: "OT 수업 기록", icon: <Dumbbell className="w-5 h-5" />, color: "amber" },
  { id: "pt", title: "PT 회원 관리", icon: <Activity className="w-5 h-5" />, color: "rose" },
  { id: "workflow", title: "회원 관리 흐름", icon: <RefreshCw className="w-5 h-5" />, color: "emerald" },
  { id: "tips", title: "기록 작성 팁", icon: <ClipboardList className="w-5 h-5" />, color: "indigo" },
];

export function MemberManualModal({ isOpen, onClose }: Props) {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>("consultation");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <Book className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900">회원 관리 매뉴얼</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            return (
              <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg text-white", 
                      section.color === "blue" ? "bg-blue-500" :
                      section.color === "amber" ? "bg-amber-500" :
                      section.color === "rose" ? "bg-rose-500" :
                      section.color === "emerald" ? "bg-emerald-500" : "bg-indigo-500"
                    )}>
                      {section.icon}
                    </div>
                    <span className="font-bold text-slate-800">{section.title}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">작성 중인 가이드 내용입니다...</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}
