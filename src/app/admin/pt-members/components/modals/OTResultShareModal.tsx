"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import {
  Copy,
  Download,
  Share2,
  CheckCircle2,
  Activity,
  Target,
  TrendingUp,
  AlertCircle,
  Heart,
  Dumbbell,
  X
} from "lucide-react";
import { OTFormData } from "@/app/admin/ot-record/types";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  otData: OTFormData | null;
  gymName?: string;
  trainerName?: string;
}

export function OTResultShareModal({ isOpen, onClose, otData, gymName = "We:form", trainerName }: Props) {
  const [isCopying, setIsCopying] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  if (!otData) return null;

  const { basicInfo, bodyComposition, postureAssessment, fitnessTest, programDesign } = otData;

  // 자세 문제점 추출
  const postureIssues: string[] = [];
  if (postureAssessment.shoulderHeightDiff) postureIssues.push("어깨 높이 차이");
  if (postureAssessment.pelvisHeightDiff) postureIssues.push("골반 높이 차이");
  if (postureAssessment.kneeAlignment === "x-leg") postureIssues.push("X자 다리");
  if (postureAssessment.kneeAlignment === "o-leg") postureIssues.push("O자 다리");
  if (postureAssessment.turtleNeck) postureIssues.push("거북목");
  if (postureAssessment.roundShoulder) postureIssues.push("라운드 숄더");
  if (postureAssessment.anteriorPelvicTilt) postureIssues.push("골반 전방경사");
  if (postureAssessment.scapulaProtrusion) postureIssues.push("날개뼈 돌출");

  // 체성분 상태 판정
  const getStatusText = (status: string) => {
    switch (status) {
      case "insufficient": return "부족";
      case "normal": return "정상";
      case "high": return "과다";
      case "excellent": return "우수";
      default: return "-";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "insufficient": return "text-amber-600";
      case "normal": return "text-emerald-600";
      case "high": return "text-rose-600";
      case "excellent": return "text-blue-600";
      default: return "text-slate-400";
    }
  };

  // 텍스트 형식으로 변환
  const generateTextContent = () => {
    const date = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

    let text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏋️ ${gymName} 첫 상담 결과지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 회원님: ${basicInfo.memberName}
📅 상담일: ${date}
${trainerName ? `🧑‍🏫 담당 트레이너: ${trainerName}` : ""}

`;

    // 체성분 정보
    if (bodyComposition.weight > 0) {
      text += `━━━ 📊 체성분 분석 결과 ━━━

• 체중: ${bodyComposition.weight}kg
• 골격근량: ${bodyComposition.skeletalMuscle}kg ${bodyComposition.skeletalMuscleStatus ? `(${getStatusText(bodyComposition.skeletalMuscleStatus)})` : ""}
• 체지방량: ${bodyComposition.bodyFat}kg ${bodyComposition.bodyFatStatus ? `(${getStatusText(bodyComposition.bodyFatStatus)})` : ""}
• 체지방률: ${bodyComposition.bodyFatPercentage}% ${bodyComposition.bodyFatPercentageStatus ? `(${getStatusText(bodyComposition.bodyFatPercentageStatus)})` : ""}
• BMI: ${bodyComposition.bmi}
• 기초대사량: ${bodyComposition.basalMetabolicRate}kcal

`;
    }

    // 자세 평가
    if (postureIssues.length > 0) {
      text += `━━━ 🧍 자세 평가 결과 ━━━

발견된 특이사항:
${postureIssues.map(issue => `  ⚠️ ${issue}`).join("\n")}

`;
    } else {
      text += `━━━ 🧍 자세 평가 결과 ━━━

✅ 특별한 자세 이상이 발견되지 않았습니다.

`;
    }

    // 체력 테스트
    text += `━━━ 💪 기초 체력 테스트 ━━━

`;
    if (fitnessTest.upperBody.pushUpCount > 0) {
      text += `• 푸쉬업: ${fitnessTest.upperBody.pushUpCount}회 ${fitnessTest.upperBody.pushUpStatus ? `(${getStatusText(fitnessTest.upperBody.pushUpStatus)})` : ""}
`;
    }
    if (fitnessTest.upperBody.plankTime > 0) {
      text += `• 플랭크: ${fitnessTest.upperBody.plankTime}초 ${fitnessTest.upperBody.plankStatus ? `(${getStatusText(fitnessTest.upperBody.plankStatus)})` : ""}
`;
    }
    if (fitnessTest.lowerBody.squatCount > 0) {
      text += `• 스쿼트: ${fitnessTest.lowerBody.squatCount}회 ${fitnessTest.lowerBody.squatStatus ? `(${getStatusText(fitnessTest.lowerBody.squatStatus)})` : ""}
`;
    }
    if (fitnessTest.flexibility.sitAndReach !== 0) {
      const sign = fitnessTest.flexibility.sitAndReach >= 0 ? "+" : "";
      text += `• 유연성(좌전굴): ${sign}${fitnessTest.flexibility.sitAndReach}cm ${fitnessTest.flexibility.sitAndReachStatus ? `(${getStatusText(fitnessTest.flexibility.sitAndReachStatus)})` : ""}
`;
    }

    // 우선순위 목표
    const priorities = programDesign.priorities.filter(p => p.content);
    if (priorities.length > 0) {
      text += `
━━━ 🎯 우선 개선 목표 ━━━

`;
      priorities.forEach((p, i) => {
        text += `${i + 1}. ${p.content}
   └ ${p.reason || ""}
`;
      });
    }

    // 로드맵
    const phases = programDesign.roadmap.filter(p => p.goal);
    if (phases.length > 0) {
      text += `
━━━ 📈 운동 로드맵 ━━━

`;
      phases.forEach(phase => {
        text += `【${phase.phaseName}】 (${phase.weekRange})
  목표: ${phase.goal}
  주요 운동: ${phase.mainExercises || "-"}

`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 회원님의 건강한 변화를 위해
${gymName}이 함께 하겠습니다!

문의: ${basicInfo.phoneNumber ? `상담 전화 연결 가능` : "센터로 문의해주세요"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return text;
  };

  // 클립보드 복사
  const handleCopyText = async () => {
    setIsCopying(true);
    try {
      const text = generateTextContent();
      await navigator.clipboard.writeText(text);
      toast.success("상담 결과가 클립보드에 복사되었습니다!");
    } catch (err) {
      console.error("복사 실패:", err);
      toast.error("복사에 실패했습니다.");
    } finally {
      setIsCopying(false);
    }
  };

  // 이미지로 저장
  const handleDownloadImage = async () => {
    if (!resultRef.current) return;

    try {
      // html2canvas 동적 로드
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${basicInfo.memberName}_상담결과_${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("이미지로 저장되었습니다!");
    } catch (err) {
      console.error("이미지 저장 실패:", err);
      toast.error("이미지 저장에 실패했습니다. 텍스트 복사를 이용해주세요.");
    }
  };

  // 공유하기 (Web Share API)
  const handleShare = async () => {
    const text = generateTextContent();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${basicInfo.memberName}님 상담 결과`,
          text: text,
        });
      } catch (err) {
        // 취소한 경우 무시
        if ((err as Error).name !== "AbortError") {
          console.error("공유 실패:", err);
        }
      }
    } else {
      // Web Share API 미지원 시 클립보드 복사
      handleCopyText();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white p-0 border-none rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">{basicInfo.memberName} 상담 결과</DialogTitle>
        <DialogDescription className="sr-only">회원님께 전송할 상담 결과입니다.</DialogDescription>

        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">상담 결과 공유</h2>
                <p className="text-white/70 text-xs font-medium mt-0.5">회원님께 전송할 상담 결과입니다</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 결과 카드 (이미지 캡처용) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            ref={resultRef}
            className="bg-gradient-to-br from-slate-50 to-white rounded-[24px] p-6 space-y-5 border border-slate-100"
          >
            {/* 상단 헤더 */}
            <div className="text-center pb-4 border-b border-slate-100">
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-black uppercase tracking-widest mb-2">
                {gymName}
              </Badge>
              <h3 className="text-2xl font-black text-slate-900">{basicInfo.memberName}님</h3>
              <p className="text-slate-500 text-sm mt-1">첫 상담 분석 결과</p>
              <p className="text-slate-400 text-xs mt-1">
                {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* 체성분 요약 */}
            {bodyComposition.weight > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-black text-slate-800">체성분 분석</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">체중</p>
                    <p className="text-lg font-black text-slate-900">{bodyComposition.weight}<span className="text-xs font-medium">kg</span></p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">골격근량</p>
                    <p className={cn("text-lg font-black", getStatusColor(bodyComposition.skeletalMuscleStatus))}>
                      {bodyComposition.skeletalMuscle}<span className="text-xs font-medium">kg</span>
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">체지방률</p>
                    <p className={cn("text-lg font-black", getStatusColor(bodyComposition.bodyFatPercentageStatus))}>
                      {bodyComposition.bodyFatPercentage}<span className="text-xs font-medium">%</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 자세 평가 결과 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-black text-slate-800">자세 평가</h4>
              </div>
              {postureIssues.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {postureIssues.map((issue, i) => (
                    <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold">
                      {issue}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <p className="text-sm font-medium">특별한 이상 없음</p>
                </div>
              )}
            </div>

            {/* 체력 테스트 결과 */}
            {(fitnessTest.upperBody.pushUpCount > 0 || fitnessTest.lowerBody.squatCount > 0) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-black text-slate-800">체력 테스트</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {fitnessTest.upperBody.pushUpCount > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <p className="text-xs text-slate-500">푸쉬업</p>
                      <p className="text-base font-black text-slate-900">
                        {fitnessTest.upperBody.pushUpCount}회
                        <span className={cn("text-xs ml-1", getStatusColor(fitnessTest.upperBody.pushUpStatus))}>
                          ({getStatusText(fitnessTest.upperBody.pushUpStatus)})
                        </span>
                      </p>
                    </div>
                  )}
                  {fitnessTest.lowerBody.squatCount > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100">
                      <p className="text-xs text-slate-500">스쿼트</p>
                      <p className="text-base font-black text-slate-900">
                        {fitnessTest.lowerBody.squatCount}회
                        <span className={cn("text-xs ml-1", getStatusColor(fitnessTest.lowerBody.squatStatus))}>
                          ({getStatusText(fitnessTest.lowerBody.squatStatus)})
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 우선 개선 목표 */}
            {programDesign.priorities.some(p => p.content) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-600" />
                  <h4 className="text-sm font-black text-slate-800">우선 개선 목표</h4>
                </div>
                <div className="space-y-2">
                  {programDesign.priorities.filter(p => p.content).map((priority, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-slate-100">
                      <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 text-xs font-black flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{priority.content}</p>
                        {priority.reason && (
                          <p className="text-xs text-slate-500 mt-0.5">{priority.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 운동 로드맵 */}
            {programDesign.roadmap.some(p => p.goal) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-black text-slate-800">운동 로드맵</h4>
                </div>
                <div className="space-y-2">
                  {programDesign.roadmap.filter(p => p.goal).map((phase, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-indigo-100 text-indigo-700 border-none text-[10px] font-bold">
                          {phase.weekRange}
                        </Badge>
                        <p className="text-xs font-bold text-slate-600">{phase.phaseName}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{phase.goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 하단 메시지 */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
                <Heart className="w-4 h-4" />
                <p className="text-sm font-bold">건강한 변화를 함께 만들어가요!</p>
              </div>
              <p className="text-xs text-slate-400">{gymName}</p>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-500">카카오톡, 문자 등으로 공유해보세요</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadImage}
              className="h-10 px-4 rounded-xl text-sm font-bold border-slate-200 hover:bg-slate-100"
            >
              <Download className="w-4 h-4 mr-1.5" />
              이미지 저장
            </Button>
            <Button
              onClick={handleCopyText}
              disabled={isCopying}
              className="h-10 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              <Copy className="w-4 h-4 mr-1.5" />
              {isCopying ? "복사 중..." : "텍스트 복사"}
            </Button>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <Button
                onClick={handleShare}
                className="h-10 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                공유
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
