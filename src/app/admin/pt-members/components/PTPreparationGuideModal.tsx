"use client";

import { useState } from "react";
import { X, Copy, Check, ChevronLeft, ChevronRight, Package, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type StyleType = "A" | "B" | "C" | "D";

interface StyleOption {
  id: StyleType;
  name: string;
  description: string;
}

const styleOptions: StyleOption[] = [
  { id: "A", name: "친근한 편지 스타일", description: "따뜻한 말투로 회원과 소통" },
  { id: "B", name: "카드 스타일", description: "깔끔하게 정리된 정보 카드" },
  { id: "C", name: "이모지 포인트", description: "짧고 굵은 핵심 요약" },
  { id: "D", name: "Q&A 스타일", description: "친절한 질문-답변 형식" },
];

export function PTPreparationGuideModal({ isOpen, onClose }: Props) {
  const [selectedStyle, setSelectedStyle] = useState<StyleType>("A");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const content = getPlainTextContent(selectedStyle);
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handlePrevStyle = () => {
    const currentIndex = styleOptions.findIndex((s) => s.id === selectedStyle);
    const prevIndex = (currentIndex - 1 + styleOptions.length) % styleOptions.length;
    setSelectedStyle(styleOptions[prevIndex].id);
  };

  const handleNextStyle = () => {
    const currentIndex = styleOptions.findIndex((s) => s.id === selectedStyle);
    const nextIndex = (currentIndex + 1) % styleOptions.length;
    setSelectedStyle(styleOptions[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-10 py-8 border-b bg-slate-900">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">PT 전 준비물 안내</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">회원 전달용 가이드 스타일링</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* 스타일 선택 영역 */}
        <div className="px-10 py-6 border-b bg-slate-50/50 flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Style Select</span>
          </div>
          
          <div className="flex-1 flex items-center justify-between gap-4">
            <button
              onClick={handlePrevStyle}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap border-2",
                    selectedStyle === style.id
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 -translate-y-0.5"
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                  )}
                >
                  {style.name}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleNextStyle}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 본문 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
          <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm min-h-full">
            {selectedStyle === "A" && <StyleAContent />}
            {selectedStyle === "B" && <StyleBContent />}
            {selectedStyle === "C" && <StyleCContent />}
            {selectedStyle === "D" && <StyleDContent />}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-10 py-8 border-t bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Selected</span>
              <span className="text-sm font-black text-slate-900">{styleOptions.find(s => s.id === selectedStyle)?.name}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline"
              className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
            >
              닫기
            </Button>
            <Button
              onClick={handleCopy}
              className={cn(
                "h-14 px-10 rounded-2xl font-black gap-3 transition-all shadow-xl hover:-translate-y-1",
                copied ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  복사 완료!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  전체 내용 복사
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 스타일 A: 친근한 편지 스타일
function StyleAContent() {
  return (
    <div className="space-y-10 text-slate-800 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black tracking-widest uppercase">First Step</span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">첫 PT 전, 이것만 알고 오세요!</h2>
        <p className="text-slate-500 font-bold leading-relaxed text-lg">
          안녕하세요, 회원님! 첫 수업이 다가오고 있네요.<br />
          설레기도 하고 긴장도 되시죠? 걱정 마세요!<br />
          아래 내용만 확인하시면 완벽한 첫 수업이 될 거예요.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-md transition-all">
          <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-slate-900">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">👟</div>
            신발이 제일 중요해요!
          </h3>
          <p className="text-slate-600 font-bold leading-relaxed mb-4">
            운동화 바닥이 <span className="text-blue-600 font-black underline underline-offset-4">평평한 게 좋아요.</span><br />
            반스, 컨버스 같은 신발이나 웨이트 전용화를 추천드려요.
          </p>
          <div className="bg-red-50/50 border border-red-100 text-red-700 p-5 rounded-2xl text-sm font-bold space-y-2">
            <p className="flex items-center gap-2">❌ 슬리퍼, 크록스, 맨발은 다칠 수 있어요!</p>
            <p className="flex items-center gap-2">❌ 너무 푹신한 런닝화는 무릎이 흔들릴 수 있어요.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-md transition-all">
            <h3 className="text-lg font-black mb-3 flex items-center gap-3 text-slate-900">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-sm">👕</div>
              편한 운동복
            </h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              움직이기 편한 옷이면 뭐든 괜찮아요.<br />
              센터에도 구비되어 있으니 걱정 마세요 :)
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-md transition-all">
            <h3 className="text-lg font-black mb-3 flex items-center gap-3 text-slate-900">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-sm">💧</div>
              개인 텀블러
            </h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              운동 중 수분 섭취는 정말 중요해요!<br />
              물통 하나 챙겨오시면 딱이에요.
            </p>
          </div>
        </div>

        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100">
          <h3 className="text-xl font-black mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">🤝</div>
            우리의 작은 약속
          </h3>
          <div className="space-y-4 font-bold text-blue-50">
            <div className="p-4 bg-white/10 rounded-2xl">
              <p className="text-white font-black mb-1">수업 변경은 24시간 전에!</p>
              <p className="text-sm opacity-80">당일 취소는 아쉽지만 수업이 차감돼요 😢</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl">
              <p className="text-white font-black mb-1">5분만 일찍 와주세요</p>
              <p className="text-sm opacity-80">옷 갈아입고 준비하는 시간 생각하면 딱 좋아요!</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-2xl font-black text-blue-600 pt-6 animate-bounce">
        그럼 수업에서 만나요! 💪
      </p>
    </div>
  );
}

// 스타일 B: 카드 스타일
function StyleBContent() {
  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">🏋️ PT 첫 수업 가이드</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { icon: "👟", title: "신발", desc: "밑창이 평평한 운동화", color: "blue", tags: ["✅ 반스, 컨버스, 웨이트화", "❌ 슬리퍼, 크록스"] },
          { icon: "👕", title: "복장", desc: "편한 운동복이면 OK", color: "amber", tip: "💡 센터 운동복 구비 완료" },
          { icon: "💧", title: "수분", desc: "개인 물통 지참", color: "cyan", tip: "환경과 건강을 지켜요" },
          { icon: "🍽️", title: "식사", desc: "수업 1-2시간 전", color: "orange", tip: "🍌 바나나, 고구마 추천" },
          { icon: "😴", title: "컨디션", desc: "6시간 이상 숙면", color: "purple", tags: ["⚠️ 과음/밤샘 금지"] },
          { icon: "⏰", title: "시간", desc: "5분 전 도착 필수", color: "emerald", tags: ["📌 취소는 24시간 전", "⚠️ 10분 지각 시 단축수업"] },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className={cn(
              "w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform",
              item.color === "blue" ? "bg-blue-50 shadow-blue-50" :
              item.color === "amber" ? "bg-amber-50 shadow-amber-50" :
              item.color === "cyan" ? "bg-cyan-50 shadow-cyan-50" :
              item.color === "orange" ? "bg-orange-50 shadow-orange-50" :
              item.color === "purple" ? "bg-purple-50 shadow-purple-50" : "bg-emerald-50 shadow-emerald-50"
            )}>
              {item.icon}
            </div>
            <h3 className="font-black text-xl text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-500 font-bold mb-4">{item.desc}</p>
            {item.tags && (
              <div className="space-y-1.5">
                {item.tags.map((tag, tIdx) => (
                  <p key={tIdx} className={cn(
                    "text-xs font-black px-3 py-1 rounded-lg inline-block mr-2",
                    tag.startsWith("✅") ? "bg-emerald-50 text-emerald-600" :
                    tag.startsWith("❌") ? "bg-red-50 text-red-600" :
                    "bg-slate-50 text-slate-500"
                  )}>{tag}</p>
                ))}
              </div>
            )}
            {item.tip && (
              <p className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block">
                {item.tip}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 스타일 C: 이모지 포인트 + 짧고 굵게
function StyleCContent() {
  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h2 className="text-3xl font-black text-center text-slate-900 tracking-tight">🔥 PT 수업 핵심 가이드</h2>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {[
          { emoji: "👟", label: "신발", value: "평평한 밑창 (반스, 컨버스 OK)" },
          { emoji: "👕", label: "복장", value: "편한 운동복 (센터 대여 가능)" },
          { emoji: "💧", label: "수분", value: "개인 물통 챙기기" },
          { emoji: "🍌", label: "식사", value: "1-2시간 전 가볍게 섭취" },
          { emoji: "😴", label: "수면", value: "전날 6시간 이상 충분히" },
          { emoji: "⏰", label: "약속", value: "24시간 전 변경 | 5분 전 도착" },
        ].map((item, idx) => (
          <div key={idx} className={cn(
            "flex items-center gap-6 p-8 transition-all hover:bg-slate-50",
            idx !== 5 && "border-b border-slate-50"
          )}>
            <div className="text-4xl">{item.emoji}</div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{item.label}</h3>
              <p className="text-xl font-black text-slate-800 tracking-tight">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 스타일 D: 회원 친화적 Q&A 스타일
function StyleDContent() {
  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <h2 className="text-3xl font-black text-center text-slate-900 tracking-tight mb-10">🙋 PT 첫 수업, 무엇이든 물어보세요!</h2>

      <div className="grid grid-cols-1 gap-6">
        {[
          { q: "신발은 뭘 신고 가야 하나요?", a: "밑창이 평평한 운동화면 돼요! 반스나 컨버스처럼요. 런닝화는 쿠션이 너무 푹신해서 스쿼트할 때 흔들릴 수 있어요. 슬리퍼나 맨발은 절대 금지!", color: "blue" },
          { q: "운동복은 꼭 가져가야 하나요?", a: "아니요! 센터에 운동복이 있어서 빈손으로 오셔도 괜찮아요. 물론 개인 운동복을 입으시면 더 열정적인 운동이 가능하겠죠? :)", color: "indigo" },
          { q: "밥 먹고 가도 되나요?", a: "수업 1-2시간 전에 가볍게 드시는 게 베스트! 공복이면 어지럽고, 직전에 드시면 울렁거릴 수 있거든요. 바나나나 고구마 추천합니다.", color: "orange" },
          { q: "전날 술 마셔도 괜찮을까요?", a: "가능하면 피해주세요! 과음하거나 밤을 새면 운동 효과가 뚝 떨어지고 부상 위험도 커져요. 우리 건강을 위해 6시간은 꼭 주무세요!", color: "purple" },
          { q: "몇 분 전에 가면 되나요?", a: "5분 전에 오시면 딱 좋습니다! 옷 갈아입고 마음의 준비를 하기에 가장 적당한 시간이에요. 늦으시면 수업 시간이 짧아져서 너무 아쉬우니까요 😢", color: "emerald" },
        ].map((item, idx) => (
          <div key={idx} className="group">
            <div className={cn(
              "p-8 rounded-[32px] border-2 transition-all hover:shadow-xl",
              item.color === "blue" ? "bg-blue-50/30 border-blue-100 hover:bg-blue-50" :
              item.color === "indigo" ? "bg-indigo-50/30 border-indigo-100 hover:bg-indigo-50" :
              item.color === "orange" ? "bg-orange-50/30 border-orange-100 hover:bg-orange-50" :
              item.color === "purple" ? "bg-purple-50/30 border-purple-100 hover:bg-purple-50" :
              "bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50"
            )}>
              <div className="flex items-start gap-4 mb-4">
                <span className={cn(
                  "px-3 py-1 rounded-lg text-xs font-black text-white shadow-sm",
                  item.color === "blue" ? "bg-blue-500" :
                  item.color === "indigo" ? "bg-indigo-500" :
                  item.color === "orange" ? "bg-orange-500" :
                  item.color === "purple" ? "bg-purple-500" :
                  "bg-emerald-500"
                )}>QUESTION</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.q}</h3>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-slate-300 font-black text-sm mt-1">ANSWER</span>
                <p className="text-slate-600 font-bold leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-2xl font-black text-blue-600 pt-8">
        그럼 수업에서 뵐게요! 화이팅! 💪
      </p>
    </div>
  );
}

// 각 스타일별 일반 텍스트 반환 (복사용)
function getPlainTextContent(style: StyleType): string {
  switch (style) {
    case "A":
      return `💌 첫 PT 전, 이것만 알고 오세요!

안녕하세요, 회원님! 🙌

첫 수업이 다가오고 있네요. 설레기도 하고 긴장도 되시죠?
걱정 마세요! 아래 내용만 확인하시면 완벽한 첫 수업이 될 거예요.

👟 신발이 제일 중요해요!
운동화 바닥이 평평한 게 좋아요.
반스, 컨버스 같은 신발이나 웨이트 전용화를 추천드려요.

❌ 슬리퍼, 크록스, 맨발은 다칠 수 있어서 안 돼요!
❌ 너무 푹신한 런닝화는 스쿼트할 때 무릎이 흔들릴 수 있어요.

👕 운동복은 편하게!
움직이기 편한 옷이면 뭐든 괜찮아요.
혹시 못 챙기셔도 센터에 운동복이 있으니 걱정 마세요 😊

💧 물은 꼭 챙겨오세요
운동하면서 물 마시는 거 정말 중요해요!
텀블러나 물통 하나 챙겨오시면 딱이에요.

🍌 밥은 미리 드세요
• 공복으로 오시면 → 어지러워서 힘들어요 😵
• 직전에 드시면 → 속이 울렁거릴 수 있어요 🤢

꿀팁! 수업 1~2시간 전에 바나나, 고구마, 식빵 같은 가벼운 거 드세요!

😴 전날은 푹 주무세요
밤새거나 과음하고 오시면 운동 효과가 거의 없고, 다칠 수도 있어요.
최소 6시간은 주무시고 오세요!

🤝 우리의 작은 약속
• 수업 변경은 24시간 전에 말씀해주세요
  당일 취소는 아쉽지만 수업이 차감돼요 😢

• 5분만 일찍 와주세요
  옷 갈아입고 준비하는 시간 생각하면 딱 좋아요!
  10분 늦으시면 40분밖에 못 해드려서 너무 아쉽거든요.

그럼 수업에서 만나요! 💪`;

    case "B":
      return `🏋️ PT 첫 수업 가이드

👟 신발
밑창이 평평한 운동화로 오세요!
✅ 반스, 컨버스, 웨이트화
❌ 슬리퍼, 크록스, 맨발

👕 복장
편한 운동복이면 OK!
💡 센터에 운동복 구비되어 있어요

💧 물
개인 물통 챙겨오세요
환경도 지키고, 수업 흐름도 안 끊겨요

🍽️ 식사
수업 1-2시간 전에 가볍게!
🍌 바나나, 🍠 고구마, 🍞 식빵 추천

😴 컨디션
전날 6시간 이상 수면
과음/밤샘 = 운동효과 0, 부상위험 ↑

⏰ 시간 약속
📌 변경/취소는 24시간 전까지
📌 5분 전 도착 (착장 시간 포함)
⚠️ 10분 지각 시 40분 수업`;

    case "C":
      return `🔥 PT 수업 준비 가이드

👟 신발
평평한 밑창 운동화 (반스, 컨버스 OK)

👕 복장
편한 운동복 (센터 구비 있음)

💧 물
개인 물통 챙기기

🍌 식사
1-2시간 전 가볍게


😴 수면
전날 6시간 이상

⏰ 약속
변경은 24시간 전 | 5분 전 도착`;

    case "D":
      return `🙋 PT 첫 수업, 뭘 준비하면 되나요?

Q. 신발은 뭘 신고 가야 하나요?
밑창이 평평한 운동화면 돼요! 반스나 컨버스처럼요.
런닝화는 쿠션이 너무 푹신해서 스쿼트할 때 흔들릴 수 있어요.
슬리퍼나 맨발은 다칠 수 있어서 안 돼요!

Q. 운동복은 꼭 가져가야 하나요?
아니요! 센터에 운동복이 있어서 빈손으로 오셔도 괜찮아요.
물론 개인 운동복 입으셔도 되고요 😊

Q. 밥 먹고 가도 되나요?
수업 1-2시간 전에 가볍게 드시는 게 좋아요.
공복이면 어지럽고, 직전에 드시면 속이 안 좋을 수 있거든요.
바나나나 고구마 같은 가벼운 탄수화물 추천!

Q. 전날 술 마셔도 괜찮을까요?
가능하면 피해주세요! 😅
과음하거나 밤새고 오시면 운동 효과가 거의 없고, 다칠 위험도 있어요.
최소 6시간은 주무시고 오세요.

Q. 예약 변경하고 싶으면요?
24시간 전까지 말씀해주시면 언제든 조정 가능해요!
당일 취소는 아쉽지만 수업 1회가 차감돼요.

Q. 몇 분 전에 가면 되나요?
5분 전에 오시면 딱 좋아요!
옷 갈아입는 시간 생각하면요.
10분 이상 늦으시면 뒷 타임 때문에 수업을 짧게 해드릴 수밖에 없어서요 😢

그럼 수업에서 뵐게요! 화이팅! 💪`;

    default:
      return "";
  }
}
