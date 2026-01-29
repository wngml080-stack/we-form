"use client";

import { useState } from "react";
import { 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function InitialConsultationTemplateModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState({
    impression: "",
    obstacles: "",
    motivationType: [] as string[],
    probability: "",
    expectedProduct: "",
    concerns: [] as string[],
    otherConcern: "",
    checklist: {
      tour: false,
      price: false,
      refund: false,
      otBooked: false,
      contactSaved: false,
    },
    otDateTime: "",
    consultationTime: new Date().toLocaleString(),
  });

  const motivationOptions = [
    { id: "praise", label: "칭찬형", desc: "긍정적 피드백에 반응" },
    { id: "challenge", label: "도전형", desc: "목표 제시에 동기부여" },
    { id: "data", label: "데이터형", desc: "숫자와 변화에 관심" },
    { id: "empathy", label: "공감형", desc: "감정적 지지 필요" },
    { id: "strict", label: "엄격형", desc: "규율 있는 관리 선호" },
  ];

  const probabilityOptions = [
    { value: "high", label: "높음", range: "80% 이상", color: "bg-emerald-500" },
    { value: "medium", label: "보통", range: "50-80%", color: "bg-amber-500" },
    { value: "low", label: "낮음", range: "50% 미만", color: "bg-slate-400" },
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

  const toggleChecklist = (key: keyof typeof formData.checklist) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !prev.checklist[key] }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-10 py-8 border-b bg-emerald-600 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">첫 상담 후 상담 결과 (트레이너)</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold text-emerald-50 uppercase tracking-widest">관리 템플릿</span>
                  <p className="text-sm text-emerald-50 font-medium">상담 결과를 바탕으로 한 맞춤형 관리 로드맵</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          {/* 섹션 1: 상담 메모 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">1</div>
              📝 상담 메모
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">첫인상 / 커뮤니케이션 스타일</Label>
                <Textarea 
                  value={formData.impression}
                  onChange={(e) => setFormData(prev => ({ ...prev, impression: e.target.value }))}
                  placeholder="예: 차분하고 논리적인 편, 운동 경험은 많지만 기초 부족"
                  className="min-h-[120px] bg-slate-50 border-none rounded-2xl font-bold p-5 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">예상되는 장애물</Label>
                <Textarea 
                  value={formData.obstacles}
                  onChange={(e) => setFormData(prev => ({ ...prev, obstacles: e.target.value }))}
                  placeholder="예: 잦은 야근으로 인한 스케줄 변동, 허리 통증으로 인한 심리적 위축"
                  className="min-h-[120px] bg-slate-50 border-none rounded-2xl font-bold p-5 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">이 회원에게 효과적인 동기부여 방식</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {motivationOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleMotivation(opt.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                      formData.motivationType.includes(opt.id)
                        ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-100 -translate-y-1"
                        : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <span className={cn("text-sm font-black", formData.motivationType.includes(opt.id) ? "text-emerald-700" : "text-slate-500")}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-medium leading-tight opacity-70">
                      {opt.desc}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">등록 가능성</Label>
                <div className="flex gap-2">
                  {probabilityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, probability: opt.value }))}
                      className={cn(
                        "flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all",
                        formData.probability === opt.value
                          ? cn("border-blue-500 bg-blue-50", opt.color.replace("bg-", "text-"))
                          : "border-transparent bg-slate-50 text-slate-400"
                      )}
                    >
                      <span className="text-sm font-black">{opt.label}</span>
                      <span className="text-[10px] font-bold opacity-60">{opt.range}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">예상 등록 상품</Label>
                <Input 
                  value={formData.expectedProduct}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedProduct: e.target.value }))}
                  placeholder="예: 1:1 PT 30회 + 헬스 3개월"
                  className="h-14 bg-slate-50 border-none rounded-2xl font-bold px-6 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">등록 고민 요인 (복수 선택)</Label>
              <div className="flex flex-wrap gap-2">
                {concernOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleConcern(opt.id)}
                    className={cn(
                      "px-5 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                      formData.concerns.includes(opt.id)
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                        : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {formData.concerns.includes("other") && (
                <Input 
                  value={formData.otherConcern}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherConcern: e.target.value }))}
                  placeholder="기타 고민 요인을 입력하세요"
                  className="h-12 bg-slate-50 border-none rounded-xl font-bold mt-2"
                />
              )}
            </div>
          </div>

          {/* 섹션 3: 체크리스트 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
            <h3 className="flex items-center gap-3 text-lg font-black text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-sm">3</div>
              ✅ 상담 완료 체크리스트
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "tour", label: "센터 시설 투어 완료" },
                { key: "price", label: "가격표 안내 완료" },
                { key: "refund", label: "환불 규정 설명 완료" },
                { key: "contactSaved", label: "연락처 저장 완료" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl cursor-pointer hover:bg-orange-50/50 transition-colors group">
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    formData.checklist[item.key as keyof typeof formData.checklist] 
                      ? "bg-orange-500 border-orange-500" 
                      : "border-slate-300 bg-white"
                  )}>
                    {formData.checklist[item.key as keyof typeof formData.checklist] && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={formData.checklist[item.key as keyof typeof formData.checklist]}
                    onChange={() => toggleChecklist(item.key as keyof typeof formData.checklist)}
                  />
                  <span className="font-bold text-slate-700">{item.label}</span>
                </label>
              ))}
              
              <div className="col-span-full space-y-4 p-6 bg-orange-50/50 rounded-[24px] border border-orange-100">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      formData.checklist.otBooked ? "bg-orange-500 border-orange-500" : "border-slate-300 bg-white"
                    )}>
                      {formData.checklist.otBooked && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.checklist.otBooked}
                      onChange={() => toggleChecklist("otBooked")}
                    />
                    <span className="font-black text-orange-900 text-lg">OT 예약 완료</span>
                  </label>
                  {formData.checklist.otBooked && (
                    <div className="flex items-center gap-3 animate-in slide-in-from-right-2">
                      <Label className="text-xs font-black text-orange-600 uppercase tracking-widest">일시:</Label>
                      <Input 
                        type="datetime-local"
                        value={formData.otDateTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, otDateTime: e.target.value }))}
                        className="h-10 bg-white border-orange-200 rounded-xl font-bold w-64 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-100 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              상담 완료 일시: {formData.consultationTime}
            </div>
          </div>
        </div>

        <div className="px-10 py-8 border-t bg-white flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="h-14 px-8 rounded-2xl font-black">취소</Button>
          <Button className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black gap-3 shadow-xl shadow-emerald-100">
            <Save className="w-5 h-5" />
            기록 저장하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

