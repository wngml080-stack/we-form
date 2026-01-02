"use client";

import { useState } from "react";
import { X, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-cyan-500 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">PT 전 준비물 안내</h2>
              <p className="text-sm text-white/80">회원 전달용 - 원하는 스타일을 선택하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 스타일 선택 탭 */}
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
          <button
            onClick={handlePrevStyle}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex gap-2 overflow-x-auto">
            {styleOptions.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedStyle === style.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border"
                }`}
              >
                스타일 {style.id}: {style.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleNextStyle}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-xl p-6 border">
            {selectedStyle === "A" && <StyleAContent />}
            {selectedStyle === "B" && <StyleBContent />}
            {selectedStyle === "C" && <StyleCContent />}
            {selectedStyle === "D" && <StyleDContent />}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            선택한 스타일: <span className="font-medium text-gray-700">스타일 {selectedStyle}</span>
          </p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
            <Button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  텍스트 복사
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
    <div className="space-y-6 text-gray-800">
      <h2 className="text-2xl font-bold text-center">첫 PT 전, 이것만 알고 오세요!</h2>

      <p className="text-center text-gray-600">
        안녕하세요, 회원님!<br />
        첫 수업이 다가오고 있네요. 설레기도 하고 긴장도 되시죠?<br />
        걱정 마세요! 아래 내용만 확인하시면 완벽한 첫 수업이 될 거예요.
      </p>

      <div className="space-y-5">
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span>👟</span> 신발이 제일 중요해요!
          </h3>
          <p className="text-gray-700 mb-2">
            운동화 바닥이 <strong>평평한 게 좋아요.</strong><br />
            반스, 컨버스 같은 신발이나 웨이트 전용화를 추천드려요.
          </p>
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm space-y-1">
            <p>❌ 슬리퍼, 크록스, 맨발은 다칠 수 있어서 안 돼요!</p>
            <p>❌ 너무 푹신한 런닝화는 스쿼트할 때 무릎이 흔들릴 수 있어요.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span>👕</span> 운동복은 편하게!
          </h3>
          <p className="text-gray-700">
            움직이기 편한 옷이면 뭐든 괜찮아요.<br />
            혹시 못 챙기셔도 센터에 운동복이 있으니 걱정 마세요 :)
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span>💧</span> 물은 꼭 챙겨오세요
          </h3>
          <p className="text-gray-700">
            운동하면서 물 마시는 거 정말 중요해요!<br />
            텀블러나 물통 하나 챙겨오시면 딱이에요.
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span>🍌</span> 밥은 미리 드세요
          </h3>
          <table className="w-full text-sm mb-2">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium">공복으로 오시면</td>
                <td className="py-2 text-gray-600">어지러워서 힘들어요 😵</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">직전에 드시면</td>
                <td className="py-2 text-gray-600">속이 울렁거릴 수 있어요 🤢</td>
              </tr>
            </tbody>
          </table>
          <p className="text-blue-700 bg-blue-50 p-2 rounded text-sm">
            <strong>꿀팁!</strong> 수업 1~2시간 전에 바나나, 고구마, 식빵 같은 가벼운 거 드세요!
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span>😴</span> 전날은 푹 주무세요
          </h3>
          <p className="text-gray-700">
            밤새거나 과음하고 오시면 운동 효과가 거의 없고, 다칠 수도 있어요.<br />
            최소 6시간은 주무시고 오세요!
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span>🤝</span> 우리의 작은 약속
          </h3>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>수업 변경은 24시간 전에 말씀해주세요</strong><br />
              당일 취소는 아쉽지만 수업이 차감돼요 😢
            </p>
            <p>
              <strong>5분만 일찍 와주세요</strong><br />
              옷 갈아입고 준비하는 시간 생각하면 딱 좋아요!<br />
              10분 늦으시면 40분밖에 못 해드려서 너무 아쉽거든요.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-lg font-bold text-blue-600">
        그럼 수업에서 만나요! 💪
      </p>
    </div>
  );
}

// 스타일 B: 카드 스타일
function StyleBContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">🏋️ PT 첫 수업 가이드</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
          <div className="text-2xl mb-2">👟</div>
          <h3 className="font-bold text-lg mb-2">신발</h3>
          <p className="text-gray-600 mb-3">밑창이 평평한 운동화로 오세요!</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">✅ 반스, 컨버스, 웨이트화</p>
            <p className="text-red-600">❌ 슬리퍼, 크록스, 맨발</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-yellow-100">
          <div className="text-2xl mb-2">👕</div>
          <h3 className="font-bold text-lg mb-2">복장</h3>
          <p className="text-gray-600 mb-3">편한 운동복이면 OK!</p>
          <p className="text-sm text-blue-600">💡 센터에 운동복 구비되어 있어요</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-cyan-100">
          <div className="text-2xl mb-2">💧</div>
          <h3 className="font-bold text-lg mb-2">물</h3>
          <p className="text-gray-600 mb-3">개인 물통 챙겨오세요</p>
          <p className="text-sm text-gray-500">환경도 지키고, 수업 흐름도 안 끊겨요</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-orange-100">
          <div className="text-2xl mb-2">🍽️</div>
          <h3 className="font-bold text-lg mb-2">식사</h3>
          <p className="text-gray-600 mb-3">수업 <strong>1-2시간 전</strong>에 가볍게!</p>
          <p className="text-sm text-gray-500">🍌 바나나, 🍠 고구마, 🍞 식빵 추천</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-purple-100">
          <div className="text-2xl mb-2">😴</div>
          <h3 className="font-bold text-lg mb-2">컨디션</h3>
          <p className="text-gray-600 mb-3">전날 <strong>6시간 이상</strong> 수면</p>
          <p className="text-sm text-red-500">과음/밤샘 = 운동효과 0, 부상위험 ↑</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-green-100">
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="font-bold text-lg mb-2">시간 약속</h3>
          <div className="space-y-1 text-sm">
            <p>📌 변경/취소는 <strong>24시간 전</strong>까지</p>
            <p>📌 <strong>5분 전</strong> 도착 (착장 시간 포함)</p>
            <p className="text-orange-600">⚠️ 10분 지각 시 40분 수업</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 스타일 C: 이모지 포인트 + 짧고 굵게
function StyleCContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">🔥 PT 수업 준비 가이드</h2>

      <div className="bg-white rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b">
          <span className="text-3xl">👟</span>
          <div>
            <h3 className="font-bold text-lg">신발</h3>
            <p className="text-gray-600">평평한 밑창 운동화 (반스, 컨버스 OK)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pb-4 border-b">
          <span className="text-3xl">👕</span>
          <div>
            <h3 className="font-bold text-lg">복장</h3>
            <p className="text-gray-600">편한 운동복 (센터 구비 있음)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pb-4 border-b">
          <span className="text-3xl">💧</span>
          <div>
            <h3 className="font-bold text-lg">물</h3>
            <p className="text-gray-600">개인 물통 챙기기</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pb-4 border-b">
          <span className="text-3xl">🍌</span>
          <div>
            <h3 className="font-bold text-lg">식사</h3>
            <p className="text-gray-600">1-2시간 전 가볍게</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pb-4 border-b">
          <span className="text-3xl">😴</span>
          <div>
            <h3 className="font-bold text-lg">수면</h3>
            <p className="text-gray-600">전날 6시간 이상</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-3xl">⏰</span>
          <div>
            <h3 className="font-bold text-lg">약속</h3>
            <p className="text-gray-600">변경은 24시간 전 | 5분 전 도착</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 스타일 D: 회원 친화적 Q&A 스타일
function StyleDContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">🙋 PT 첫 수업, 뭘 준비하면 되나요?</h2>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="font-bold text-blue-700 mb-2">Q. 신발은 뭘 신고 가야 하나요?</p>
          <p className="text-gray-700">
            밑창이 평평한 운동화면 돼요! 반스나 컨버스처럼요.<br />
            런닝화는 쿠션이 너무 푹신해서 스쿼트할 때 흔들릴 수 있어요.<br />
            슬리퍼나 맨발은 다칠 수 있어서 안 돼요!
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="font-bold text-blue-700 mb-2">Q. 운동복은 꼭 가져가야 하나요?</p>
          <p className="text-gray-700">
            아니요! 센터에 운동복이 있어서 빈손으로 오셔도 괜찮아요.<br />
            물론 개인 운동복 입으셔도 되고요 :)
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="font-bold text-blue-700 mb-2">Q. 밥 먹고 가도 되나요?</p>
          <p className="text-gray-700">
            수업 1-2시간 전에 가볍게 드시는 게 좋아요.<br />
            공복이면 어지럽고, 직전에 드시면 속이 안 좋을 수 있거든요.<br />
            바나나나 고구마 같은 가벼운 탄수화물 추천!
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="font-bold text-blue-700 mb-2">Q. 전날 술 마셔도 괜찮을까요?</p>
          <p className="text-gray-700">
            가능하면 피해주세요!<br />
            과음하거나 밤새고 오시면 운동 효과가 거의 없고, 다칠 위험도 있어요.<br />
            최소 6시간은 주무시고 오세요.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="font-bold text-blue-700 mb-2">Q. 예약 변경하고 싶으면요?</p>
          <p className="text-gray-700">
            24시간 전까지 말씀해주시면 언제든 조정 가능해요!<br />
            당일 취소는 아쉽지만 수업 1회가 차감돼요.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <p className="font-bold text-blue-700 mb-2">Q. 몇 분 전에 가면 되나요?</p>
          <p className="text-gray-700">
            5분 전에 오시면 딱 좋아요!<br />
            옷 갈아입는 시간 생각하면요.<br />
            10분 이상 늦으시면 뒷 타임 때문에 수업을 짧게 해드릴 수밖에 없어서요 😢
          </p>
        </div>
      </div>

      <p className="text-center text-lg font-bold text-blue-600 pt-4">
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
