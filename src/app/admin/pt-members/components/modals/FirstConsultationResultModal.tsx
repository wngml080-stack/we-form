"use client";

import { useState } from "react";
import {
  Save,
  X,
  ClipboardCheck,
  Target,
  Calendar as CalendarIcon,
  MapPin,
  CircleDollarSign,
  Info,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FirstConsultationResultModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState({
    impression: "",
    barriers: "",
    motivationType: [] as string[],
    probability: "",
    expectedProduct: "",
    concerns: [] as string[],
    otherConcern: "",
    checklist: {
      tour: false,
      pricing: false,
      refundPolicy: false,
      otBooked: false,
      otDateTime: "",
      contactSaved: false,
    },
    consultationDateTime: new Date().toISOString().slice(0, 16),
    nextStepOtDateTime: "",
  });

  const motivationOptions = [
    { id: "praise", label: "칭찬형 (긍정적 피드백에 반응)", emoji: "👏" },
    { id: "challenge", label: "도전형 (목표 제시에 동기부여)", emoji: "🏆" },
    { id: "data", label: "데이터형 (숫자와 변화에 관심)", emoji: "📊" },
    { id: "empathy", label: "공감형 (감정적 지지 필요)", emoji: "🤝" },
    { id: "strict", label: "엄격형 (규율 있는 관리 선호)", emoji: "⚖️" },
  ];

  const probabilityOptions = [
    { id: "high", label: "높음 (80% 이상)", color: "bg-emerald-500" },
    { id: "medium", label: "보통 (50-80%)", color: "bg-amber-500" },
    { id: "low", label: "낮음 (50% 미만)", color: "bg-rose-500" },
  ];

  const concernOptions = [
    { id: "price", label: "가격" },
    { id: "time", label: "시간" },
    { id: "effect", label: "효과에 대한 의심" },
    { id: "comparison", label: "다른 곳과 비교 중" },
    { id: "other", label: "기타" },
  ];

  const toggleMotivation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      motivationType: prev.motivationType.includes(id)
        ? prev.motivationType.filter(t => t !== id)
        : [...prev.motivationType, id]
    }));
  };

  const toggleConcern = (id: string) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(id)
        ? prev.concerns.filter(c => c !== id)
        : [...prev.concerns, id]
    }));
  };

  type ChecklistKey = keyof typeof formData.checklist;
  type ChecklistValue<K extends ChecklistKey> = typeof formData.checklist[K];

  const updateChecklist = <K extends ChecklistKey>(key: K, value: ChecklistValue<K>) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: value }
    }));
  };

  const handleSave = () => {
    alert("상담 결과가 임시 저장되었습니다 (데모용)");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        {/* 헤더 */}
        <DialogHeader className="px-10 py-8 border-b bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="sr-only">첫 상담 후 상담 결과 (트레이너)</DialogTitle>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ClipboardCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white !text-white tracking-tight" style={{ color: 'white' }}>첫 상담 후 상담 결과</h2>
                <p className="text-sm text-emerald-400/80 font-bold mt-1 uppercase tracking-widest">
                  Trainer Management Template
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </DialogHeader>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 섹션 1: 상담 메모 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">1</div>
              📝 상담 메모
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  첫인상 / 커뮤니케이션 스타일
                </Label>
                <Textarea
                  value={formData.impression}
                  onChange={(e) => setFormData(prev => ({ ...prev, impression: e.target.value }))}
                  placeholder="예: 조용한 편이나 목표가 뚜렷함, 운동 지식은 많으나 실천이 부족해 보임"
                  className="min-h-[120px] bg-slate-50 border-none rounded-2xl font-bold p-5 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  예상되는 장애물
                </Label>
                <Textarea
                  value={formData.barriers}
                  onChange={(e) => setFormData(prev => ({ ...prev, barriers: e.target.value }))}
                  placeholder="예: 잦은 야근으로 인한 고정 시간 확보 어려움, 무릎 통증에 대한 트라우마"
                  className="min-h-[120px] bg-slate-50 border-none rounded-2xl font-bold p-5 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                이 회원에게 효과적인 동기부여 방식
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {motivationOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleMotivation(option.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      formData.motivationType.includes(option.id)
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                        : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-[11px] font-black text-center leading-tight">
                      {option.label.split(" (")[0]}
                      <br />
                      <span className="font-medium text-[9px] opacity-70">
                        {option.label.split(" (")[1]?.replace(")", "")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 섹션 2: 등록 예측 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">2</div>
              📊 등록 예측
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  등록 가능성
                </Label>
                <div className="space-y-2">
                  {probabilityOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFormData(prev => ({ ...prev, probability: option.id }))}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group",
                        formData.probability === option.id
                          ? "bg-white border-blue-500 shadow-md"
                          : "bg-slate-50 border-transparent hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", option.color)} />
                        <span className={cn("text-sm font-bold", formData.probability === option.id ? "text-blue-600" : "text-slate-600")}>
                          {option.label}
                        </span>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        formData.probability === option.id ? "border-blue-500 bg-blue-500" : "border-slate-300"
                      )}>
                        {formData.probability === option.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  예상 등록 상품
                </Label>
                <div className="relative group">
                  <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    value={formData.expectedProduct}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedProduct: e.target.value }))}
                    placeholder="예: PT 30회 + 헬스 6개월"
                    className="h-12 pl-11 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  등록 고민 요인
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {concernOptions.map((option) => (
                    <label 
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                        formData.concerns.includes(option.id)
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-500"
                      )}
                    >
                      <Checkbox 
                        checked={formData.concerns.includes(option.id)}
                        onCheckedChange={() => toggleConcern(option.id)}
                        className="border-slate-300 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                      />
                      <span className="text-xs font-bold">{option.label}</span>
                    </label>
                  ))}
                  {formData.concerns.includes("other") && (
                    <Input
                      value={formData.otherConcern}
                      onChange={(e) => setFormData(prev => ({ ...prev, otherConcern: e.target.value }))}
                      placeholder="상세 내용을 입력하세요"
                      className="h-10 bg-white border-slate-200 rounded-xl font-bold mt-1"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 섹션 3: 상담 완료 체크리스트 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">3</div>
              ✅ 상담 완료 체크리스트
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "tour", label: "센터 시설 투어 완료", icon: MapPin },
                { key: "pricing", label: "가격표 안내 완료", icon: CircleDollarSign },
                { key: "refundPolicy", label: "환불 규정 설명 완료", icon: Info },
                { key: "contactSaved", label: "연락처 저장 완료", icon: Save },
              ].map((item) => (
                <label 
                  key={item.key}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all",
                    formData.checklist[item.key as keyof typeof formData.checklist]
                      ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                      : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-500"
                  )}
                >
                  <Checkbox 
                    checked={formData.checklist[item.key as keyof typeof formData.checklist] as boolean}
                    onCheckedChange={(checked) => updateChecklist(item.key as ChecklistKey, checked as boolean)}
                    className="w-5 h-5 rounded-lg border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                  <item.icon className="w-5 h-5 opacity-50" />
                  <span className="text-sm font-bold">{item.label}</span>
                </label>
              ))}
              
              <div className={cn(
                "col-span-full flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl border-2 transition-all",
                formData.checklist.otBooked
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                  : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-500"
              )}>
                <label className="flex items-center gap-4 flex-1 cursor-pointer">
                  <Checkbox 
                    checked={formData.checklist.otBooked}
                    onCheckedChange={(checked) => updateChecklist("otBooked", checked)}
                    className="w-5 h-5 rounded-lg border-slate-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                  <CalendarIcon className="w-5 h-5 opacity-50" />
                  <span className="text-sm font-bold">OT 예약 완료</span>
                </label>
                {formData.checklist.otBooked && (
                  <Input
                    type="datetime-local"
                    value={formData.checklist.otDateTime}
                    onChange={(e) => updateChecklist("otDateTime", e.target.value)}
                    className="md:w-64 h-10 bg-white border-indigo-200 rounded-xl font-bold"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 푸터 기록 */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between px-2">
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">상담 완료 일시</Label>
              <div className="relative w-64 group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  type="datetime-local"
                  value={formData.consultationDateTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, consultationDateTime: e.target.value }))}
                  className="h-12 pl-11 bg-white border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">다음 단계 (OT 예정)</Label>
              <div className="relative w-64 group">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  type="datetime-local"
                  value={formData.nextStepOtDateTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextStepOtDateTime: e.target.value }))}
                  className="h-12 pl-11 bg-white border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-10 py-8 border-t bg-white flex justify-end gap-3 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black gap-3 shadow-xl shadow-emerald-100 hover:-translate-y-1 transition-all"
          >
            <Save className="w-5 h-5" />
            상담 결과 저장하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

