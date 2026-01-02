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
  { id: "consultation", title: "신규 회원 상담 기록지", icon: <FileText className="w-5 h-5" />, color: "blue" },
  { id: "ot", title: "OT 수업 기록지", icon: <Dumbbell className="w-5 h-5" />, color: "amber" },
  { id: "pt", title: "PT 회원 관리 기록지", icon: <Activity className="w-5 h-5" />, color: "rose" },
  { id: "workflow", title: "회원 관리 흐름", icon: <RefreshCw className="w-5 h-5" />, color: "emerald" },
  { id: "tips", title: "기록 작성 팁", icon: <ClipboardList className="w-5 h-5" />, color: "indigo" },
];

export function MemberManualModal({ isOpen, onClose }: Props) {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>("consultation");

  if (!isOpen) return null;

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; light: string; shadow: string }> = {
      blue: { bg: "bg-blue-500", text: "text-blue-600", border: "border-blue-100", light: "bg-blue-50", shadow: "shadow-blue-100" },
      amber: { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-100", light: "bg-amber-50", shadow: "shadow-amber-100" },
      rose: { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-100", light: "bg-rose-50", shadow: "shadow-rose-100" },
      emerald: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-100", light: "bg-emerald-50", shadow: "shadow-emerald-100" },
      indigo: { bg: "bg-indigo-500", text: "text-indigo-600", border: "border-indigo-100", light: "bg-indigo-50", shadow: "shadow-indigo-100" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-10 py-8 border-b bg-slate-900 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Book className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-tight">회원 관리 매뉴얼</h2>
                <div className="px-3 py-1 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                  <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Professional Guide
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-400 font-bold mt-1">신규/OT/PT 기록지 작성의 정석</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group relative z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-[#f8fafc]">
          <div className="grid grid-cols-1 gap-4">
            {sections.map((section) => {
              const colors = getColorClasses(section.color);
              const isExpanded = expandedSection === section.id;

              return (
                <div 
                  key={section.id} 
                  className={cn(
                    "rounded-[32px] overflow-hidden transition-all duration-300",
                    isExpanded 
                      ? "bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100" 
                      : "bg-slate-50 border border-transparent hover:bg-white hover:border-slate-100"
                  )}
                >
                  {/* 섹션 헤더 */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-8 py-6 transition-all",
                      isExpanded ? "bg-white" : ""
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300",
                        colors.bg,
                        isExpanded && "scale-110"
                      )}>
                        {section.icon}
                      </div>
                      <span className={cn(
                        "text-lg font-black tracking-tight transition-colors",
                        isExpanded ? "text-slate-900" : "text-slate-500"
                      )}>{section.title}</span>
                    </div>
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center transition-all",
                      isExpanded ? "bg-slate-900 rotate-180" : ""
                    )}>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-white" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* 섹션 내용 */}
                  <div className={cn(
                    "transition-all duration-500 ease-in-out",
                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  )}>
                    <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="h-px bg-slate-50" />
                      {section.id === "consultation" && <ConsultationGuide />}
                      {section.id === "ot" && <OTGuide />}
                      {section.id === "pt" && <PTGuide />}
                      {section.id === "workflow" && <WorkflowGuide />}
                      {section.id === "tips" && <TipsGuide />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-10 py-8 border-t bg-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-300" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Version 2.0 • Last Updated: Jan 2026</p>
          </div>
          <Button 
            onClick={onClose} 
            variant="outline"
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            매뉴얼 닫기
          </Button>
        </div>
      </div>
    </div>
  );
}

// 서브섹션 컴포넌트
function SubSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-50 hover:border-slate-100 transition-all shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
          {icon}
        </div>
        <h4 className="font-black text-slate-800 tracking-tight">{title}</h4>
      </div>
      <div className="pl-11">
        {children}
      </div>
    </div>
  );
}

// 신규 회원 상담 기록지 가이드
function ConsultationGuide() {
  return (
    <div className="space-y-6 text-sm">
      <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 mb-8">
        <p className="text-lg font-bold leading-relaxed">
          "첫 상담은 회원을 가르치는 시간이 아닙니다.<br />
          회원의 과거를 이해하고 미래를 함께 설계하는 과정입니다."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubSection title="1. 기본 정보 & 히스토리" icon={<Users className="w-4 h-4" />}>
          <ul className="space-y-2 text-slate-500 font-bold">
            <li className="flex items-center gap-2">• 회원명, 연락처, 담당 트레이너</li>
            <li className="flex items-center gap-2">• 상담 유형 (신규/재등록/이관)</li>
            <li className="flex items-center gap-2 text-blue-600">• 최초 미팅의 분위기 기록</li>
          </ul>
        </SubSection>

        <SubSection title="2. 방문 경로 분석" icon={<Target className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-2">
            {["네이버 플레이스", "인스타그램", "블로그", "지인 소개", "워크인"].map(tag => (
              <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-black">{tag}</span>
            ))}
          </div>
          <p className="mt-4 text-xs font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-xl inline-block">
            Tip: "저희 센터의 어떤 점이 마음에 드셨나요?" 질문 필수
          </p>
        </SubSection>

        <SubSection title="3. 정교한 목표 설정" icon={<Activity className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { name: "다이어트", desc: "목표 체중/지방" },
              { name: "재활/체형", desc: "불균형/통증 케어" },
              { name: "근력 강화", desc: "3대 중량/근육량" },
              { name: "생활 습관", desc: "규칙적 운동/식단" },
            ].map((goal) => (
              <div key={goal.name} className="p-3 bg-slate-50 rounded-2xl">
                <p className="font-black text-slate-800 text-xs">{goal.name}</p>
                <p className="text-slate-400 text-[10px] font-bold">{goal.desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="4. 생활 습관 스크리닝" icon={<Clock className="w-4 h-4" />}>
          <ul className="space-y-2 text-slate-500 font-bold text-xs">
            <li className="flex items-center gap-2">• 목/어깨, 허리, 무릎 통증 부위</li>
            <li className="flex items-center gap-2">• 수면 패턴 & 음주/흡연</li>
            <li className="flex items-center gap-2">• 식사 규칙성 및 종류</li>
          </ul>
        </SubSection>
      </div>
    </div>
  );
}

// OT 수업 기록지 가이드
function OTGuide() {
  return (
    <div className="space-y-6 text-sm">
      <div className="bg-amber-500 rounded-3xl p-8 text-white shadow-xl shadow-amber-100 mb-8">
        <p className="text-lg font-bold leading-relaxed">
          "데이터는 거짓말을 하지 않습니다.<br />
          객관적인 측정 결과로 회원의 신뢰를 얻으세요."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubSection title="1. 체성분 & 둘레 측정" icon={<Activity className="w-4 h-4" />}>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-xs font-black text-amber-700 mb-2 uppercase tracking-widest">InBody Check</p>
            <p className="text-slate-600 font-bold text-xs leading-relaxed">
              체중, 근육량, 지방량 뿐만 아니라 가슴/허리/엉덩이/허벅지 둘레를 꼼꼼히 기록하세요.
            </p>
          </div>
        </SubSection>

        <SubSection title="2. 3차원 자세 평가" icon={<Users className="w-4 h-4" />}>
          <div className="grid grid-cols-3 gap-2">
            {["정면(어깨/골반)", "측면(거북목/요추)", "후면(견갑/측만)"].map(pos => (
              <div key={pos} className="p-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 text-center">{pos}</div>
            ))}
          </div>
        </SubSection>

        <SubSection title="3. 동적 움직임 (FMS)" icon={<Dumbbell className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="font-black text-slate-800 text-xs">오버헤드 스쿼트</p>
              <p className="text-slate-400 text-[10px] font-bold">무릎 Valgus, 버트윙크 체크</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="font-black text-slate-800 text-xs">밸런스 & 가동성</p>
              <p className="text-slate-400 text-[10px] font-bold">외발 서기, 어깨 가동성 확인</p>
            </div>
          </div>
        </SubSection>

        <SubSection title="4. 기초 체력 테스트" icon={<Sparkles className="w-4 h-4" />}>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-[10px] font-bold">
              <tr className="bg-slate-50">
                <th className="p-2 text-slate-400">구분</th>
                <th className="p-2 text-slate-400">종목</th>
              </tr>
              <tr><td className="p-2 border-t">상체</td><td className="p-2 border-t text-blue-600">푸쉬업 / 플랭크</td></tr>
              <tr><td className="p-2 border-t">하체</td><td className="p-2 border-t text-blue-600">스쿼트 / 월싯</td></tr>
            </table>
          </div>
        </SubSection>
      </div>
    </div>
  );
}

// PT 회원 관리 기록지 가이드
function PTGuide() {
  return (
    <div className="space-y-6 text-sm">
      <div className="bg-rose-500 rounded-3xl p-8 text-white shadow-xl shadow-rose-100 mb-8">
        <p className="text-lg font-bold leading-relaxed">
          "변화는 기록에서 시작됩니다.<br />
          매 세션의 작은 성취를 회원과 공유하세요."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubSection title="1. 세션 대시보드" icon={<Calendar className="w-4 h-4" />}>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-rose-50 rounded-2xl text-center">
              <p className="text-[10px] font-black text-rose-400 mb-1">총 세션</p>
              <p className="text-lg font-black text-slate-900">30회</p>
            </div>
            <div className="flex-1 p-3 bg-rose-50 rounded-2xl text-center border-2 border-rose-200">
              <p className="text-[10px] font-black text-rose-400 mb-1">잔여</p>
              <p className="text-lg font-black text-rose-600">8회</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] font-black text-rose-600 text-center uppercase tracking-widest animate-pulse">
            ⚠️ 10회 미만: 재등록 상담 타이밍
          </p>
        </SubSection>

        <SubSection title="2. 매 세션 기록 (Log)" icon={<ClipboardList className="w-4 h-4" />}>
          <ul className="space-y-2 text-slate-500 font-bold text-xs">
            <li className="flex items-center gap-2">• 주요 운동 종목 & 중량/횟수</li>
            <li className="flex items-center gap-2">• 컨디션 변화 및 통증 체크</li>
            <li className="flex items-center gap-2">• 회원 피드백 & 트레이너 코멘트</li>
          </ul>
        </SubSection>
      </div>
    </div>
  );
}

// 회원 관리 흐름 가이드
function WorkflowGuide() {
  return (
    <div className="space-y-8 text-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
        {[
          { step: "상담", icon: <FileText />, color: "bg-blue-500" },
          { step: "OT", icon: <Dumbbell />, color: "bg-amber-500" },
          { step: "PT", icon: <Activity />, color: "bg-rose-500" },
          { step: "재등록", icon: <RefreshCw />, color: "bg-emerald-500" },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 group">
            <div className="flex flex-col items-center gap-2">
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-slate-100 transition-transform group-hover:-translate-y-1", item.color)}>
                {item.icon}
              </div>
              <span className="text-xs font-black text-slate-900">{item.step}</span>
            </div>
            {idx !== 3 && <div className="hidden md:block w-12 h-0.5 bg-slate-100 rounded-full" />}
          </div>
        ))}
      </div>

      <div className="bg-emerald-50 rounded-[32px] p-8 border border-emerald-100">
        <h4 className="font-black text-emerald-900 text-lg mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> 권장 관리 주기
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "기록 작성", period: "매 수업 직후" },
            { label: "인바디/둘레", period: "4주 마다" },
            { label: "눈바디(사진)", period: "4주 마다" },
            { label: "체력 테스트", period: "8주 마다" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
              <p className="text-[10px] font-black text-slate-400 mb-1">{item.label}</p>
              <p className="text-sm font-black text-emerald-600">{item.period}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 기록 작성 팁 가이드
function TipsGuide() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { 
          title: "상담 기록 팁", 
          icon: <MessageSquare />, 
          color: "blue",
          tips: ["회원의 말을 인용해서 기록하세요", "포기 이유를 정교하게 파악하세요", "현실적인 목표를 합의하세요"]
        },
        { 
          title: "OT/PT 기록 팁", 
          icon: <Dumbbell />, 
          color: "amber",
          tips: ["숫자 위주로 명확히 기록하세요", "이동/보정 시 사진을 활용하세요", "체크리스트를 매번 확인하세요"]
        },
        { 
          title: "마인드셋 팁", 
          icon: <Sparkles />, 
          color: "rose",
          tips: ["누락 방지를 위해 즉시 기록하세요", "부정적 피드백도 솔직히 기록하세요", "다음 수업 계획을 미리 적으세요"]
        },
      ].map((section, idx) => (
        <div key={idx} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg",
            section.color === "blue" ? "bg-blue-500 shadow-blue-100" :
            section.color === "amber" ? "bg-amber-500 shadow-amber-100" :
            "bg-rose-500 shadow-rose-100"
          )}>
            {section.icon}
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-6">{section.title}</h3>
          <ul className="space-y-4">
            {section.tips.map((tip, tIdx) => (
              <li key={tIdx} className="flex items-start gap-3">
                <CheckCircle2 className={cn(
                  "w-4 h-4 mt-1 shrink-0",
                  section.color === "blue" ? "text-blue-500" :
                  section.color === "amber" ? "text-amber-500" :
                  "text-rose-500"
                )} />
                <span className="text-sm font-bold text-slate-500 leading-tight">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
