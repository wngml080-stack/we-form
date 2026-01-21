"use client";

import { useState, useRef } from "react";
import { X, ClipboardList, Check, User, Copy, Download, Share2, ChevronRight, Search, Activity, Target, TrendingUp, Dumbbell, FileText, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OTFormData } from "@/app/admin/ot-record/types";
import { ConsultationFormData } from "@/app/admin/consultation/types";
import { cn } from "@/lib/utils";

// 신규 회원 또는 OT 회원 타입
interface MemberWithData {
  id: string;
  memberName: string;
  type: "consultation" | "ot";
  consultationData?: ConsultationFormData;
  otFormData?: OTFormData;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  membersWithData?: MemberWithData[];
  gymName?: string;
}

// 이름에서 "님", "회원님" 등 접미사 제거
const cleanMemberName = (name: string) => {
  return name.replace(/회원님$/, "").replace(/님$/, "").trim();
};

export function ConsultationResultModal({ isOpen, onClose, membersWithData = [], gymName = "We:form" }: Props) {
  const [selectedMember, setSelectedMember] = useState<MemberWithData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const filteredMembers = membersWithData.filter(m =>
    m.memberName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    setSelectedMember(null);
  };

  const handleClose = () => {
    setSelectedMember(null);
    setSearchQuery("");
    onClose();
  };

  // 신규 상담 데이터에서 목표 추출
  const getConsultationGoals = (data: ConsultationFormData) => {
    const goals: string[] = [];
    if (data.dietGoal.selected) goals.push("다이어트");
    if (data.rehabGoal.selected) goals.push("재활/체형교정");
    if (data.strengthGoal.selected) goals.push("근력/퍼포먼스 향상");
    if (data.habitGoal.selected) goals.push("습관 개선");
    if (data.otherGoal.selected && data.otherGoal.description) {
      goals.push(data.otherGoal.description);
    }
    return goals;
  };

  // 텍스트 복사 기능 - 신규 상담용
  const generateConsultationShareText = (data: ConsultationFormData) => {
    const memberName = cleanMemberName(data.memberName || "회원");
    let text = `━━━━━━━━━━━━━━━━━━━━━━
🏋️ ${gymName} 첫 상담 결과
━━━━━━━━━━━━━━━━━━━━━━

안녕하세요 ${memberName}님! 👋
오늘 상담에 참석해 주셔서 감사합니다.

`;

    // 목표
    const goals = getConsultationGoals(data);
    if (goals.length > 0) {
      text += `🎯 회원님의 목표\n`;
      goals.forEach(goal => {
        text += `  ✓ ${goal}\n`;
      });
      text += `\n`;
    }

    // 다이어트 목표 상세
    if (data.dietGoal.selected) {
      if (data.dietGoal.currentWeight || data.dietGoal.targetWeight) {
        text += `📊 체중 목표\n`;
        if (data.dietGoal.currentWeight) text += `  • 현재 체중: ${data.dietGoal.currentWeight}kg\n`;
        if (data.dietGoal.targetWeight) text += `  • 목표 체중: ${data.dietGoal.targetWeight}kg\n`;
        if (data.dietGoal.lossTarget) text += `  • 감량 목표: ${data.dietGoal.lossTarget}kg\n`;
        if (data.dietGoal.targetDate) text += `  • 목표 날짜: ${data.dietGoal.targetDate}\n`;
        text += `\n`;
      }
    }

    // 재활/체형교정 목표
    if (data.rehabGoal.selected) {
      const issues: string[] = [];
      if (data.rehabGoal.issues.turtleNeck) issues.push("거북목");
      if (data.rehabGoal.issues.roundShoulder) issues.push("굽은 어깨");
      if (data.rehabGoal.issues.discHernia) issues.push("디스크");
      if (data.rehabGoal.issues.pelvicImbalance) issues.push("골반 불균형");
      if (data.rehabGoal.issues.scoliosis) issues.push("척추측만");
      if (data.rehabGoal.issues.kneePain) issues.push("무릎 통증");
      if (data.rehabGoal.issues.other && data.rehabGoal.issues.otherText) {
        issues.push(data.rehabGoal.issues.otherText);
      }
      if (issues.length > 0) {
        text += `🧍 교정이 필요한 부분\n`;
        issues.forEach(issue => {
          text += `  • ${issue}\n`;
        });
        if (data.rehabGoal.expectation) {
          text += `  📝 기대사항: ${data.rehabGoal.expectation}\n`;
        }
        text += `\n`;
      }
    }

    // 근력/퍼포먼스 목표
    if (data.strengthGoal.selected) {
      const subGoals: string[] = [];
      if (data.strengthGoal.subGoals.overallFitness) subGoals.push("전반적인 체력 향상");
      if (data.strengthGoal.subGoals.bodyProfile) subGoals.push("바디프로필");
      if (data.strengthGoal.subGoals.bigThree) subGoals.push("3대 중량 향상");
      if (data.strengthGoal.subGoals.bulkUp) subGoals.push("벌크업");
      if (data.strengthGoal.subGoals.sportsPerformance) subGoals.push("스포츠 퍼포먼스");
      if (data.strengthGoal.subGoals.other && data.strengthGoal.subGoals.otherText) {
        subGoals.push(data.strengthGoal.subGoals.otherText);
      }
      if (subGoals.length > 0) {
        text += `💪 근력/퍼포먼스 목표\n`;
        subGoals.forEach(goal => {
          text += `  • ${goal}\n`;
        });
        if (data.strengthGoal.currentSquat > 0 || data.strengthGoal.currentBench > 0 || data.strengthGoal.currentDeadlift > 0) {
          text += `  📈 3대 중량:\n`;
          if (data.strengthGoal.currentSquat > 0) text += `    스쿼트: ${data.strengthGoal.currentSquat}kg → ${data.strengthGoal.targetSquat || "?"}kg\n`;
          if (data.strengthGoal.currentBench > 0) text += `    벤치: ${data.strengthGoal.currentBench}kg → ${data.strengthGoal.targetBench || "?"}kg\n`;
          if (data.strengthGoal.currentDeadlift > 0) text += `    데드: ${data.strengthGoal.currentDeadlift}kg → ${data.strengthGoal.targetDeadlift || "?"}kg\n`;
        }
        text += `\n`;
      }
    }

    // 습관 개선 목표
    if (data.habitGoal.selected) {
      const subGoals: string[] = [];
      if (data.habitGoal.subGoals.regularExercise) subGoals.push("규칙적인 운동");
      if (data.habitGoal.subGoals.betterSleep) subGoals.push("수면 개선");
      if (data.habitGoal.subGoals.healthyDiet) subGoals.push("건강한 식단");
      if (data.habitGoal.subGoals.stressManagement) subGoals.push("스트레스 관리");
      if (data.habitGoal.subGoals.postureCorrection) subGoals.push("자세 교정");
      if (data.habitGoal.subGoals.other && data.habitGoal.subGoals.otherText) {
        subGoals.push(data.habitGoal.subGoals.otherText);
      }
      if (subGoals.length > 0) {
        text += `❤️ 습관 개선 목표\n`;
        subGoals.forEach(goal => {
          text += `  • ${goal}\n`;
        });
        if (data.habitGoal.currentHabit) text += `  현재: ${data.habitGoal.currentHabit}\n`;
        if (data.habitGoal.targetHabit) text += `  목표: ${data.habitGoal.targetHabit}\n`;
        text += `\n`;
      }
    }

    // 기타 목표
    if (data.otherGoal.selected && data.otherGoal.description) {
      text += `📝 기타 목표\n`;
      text += `  ${data.otherGoal.description}\n\n`;
    }

    // 통증 부위
    const painAreas = data.painAreas.filter(p => p.hasIssue);
    if (painAreas.length > 0) {
      text += `⚠️ 주의가 필요한 부위\n`;
      painAreas.forEach(pain => {
        text += `  • ${pain.area}`;
        if (pain.intensity) text += ` (강도: ${pain.intensity}/5)`;
        text += `\n`;
      });
      text += `\n`;
    }

    // 운동 가능 시간
    if (data.availableTime.preferredWeeklyCount > 0) {
      text += `📅 운동 계획\n`;
      text += `  • 권장 운동 횟수: 주 ${data.availableTime.preferredWeeklyCount}회\n`;
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━
🏠 ${gymName}
📞 궁금한 점은 언제든 문의해 주세요!
━━━━━━━━━━━━━━━━━━━━━━`;

    return text;
  };

  // 텍스트 복사 기능 - OT용
  const generateOTShareText = (otData: OTFormData) => {
    const { basicInfo, bodyComposition, postureAssessment, fitnessTest, programDesign } = otData;
    const memberName = cleanMemberName(basicInfo.memberName || "회원");

    let text = `━━━━━━━━━━━━━━━━━━━━━━
🏋️ ${gymName} 첫 상담 결과
━━━━━━━━━━━━━━━━━━━━━━

안녕하세요 ${memberName}님! 👋
오늘 상담에 참석해 주셔서 감사합니다.

`;

    // 체성분 분석
    if (bodyComposition) {
      const hasData = bodyComposition.weight || bodyComposition.skeletalMuscle || bodyComposition.bodyFatPercentage;
      if (hasData) {
        text += `📊 체성분 분석 결과\n`;
        if (bodyComposition.weight) text += `  • 체중: ${bodyComposition.weight}kg\n`;
        if (bodyComposition.skeletalMuscle) text += `  • 골격근량: ${bodyComposition.skeletalMuscle}kg\n`;
        if (bodyComposition.bodyFatPercentage) text += `  • 체지방률: ${bodyComposition.bodyFatPercentage}%\n`;
        if (bodyComposition.bmi) text += `  • BMI: ${bodyComposition.bmi}\n`;
        if (bodyComposition.basalMetabolicRate) text += `  • 기초대사량: ${bodyComposition.basalMetabolicRate}kcal\n`;
        text += `\n`;
      }
    }

    // 자세 분석
    if (postureAssessment) {
      const hasPostureIssues = postureAssessment.turtleNeck ||
        postureAssessment.roundShoulder ||
        postureAssessment.anteriorPelvicTilt ||
        postureAssessment.kneeAlignment ||
        postureAssessment.shoulderHeightDiff ||
        postureAssessment.scapulaProtrusion;

      if (hasPostureIssues) {
        text += `🧍 자세 분석 결과\n`;
        if (postureAssessment.turtleNeck) text += `  • 거북목: 있음\n`;
        if (postureAssessment.roundShoulder) text += `  • 굽은 어깨: 있음\n`;
        if (postureAssessment.anteriorPelvicTilt) text += `  • 골반 전방 기울임: 있음\n`;
        if (postureAssessment.kneeAlignment && postureAssessment.kneeAlignment !== "normal") {
          text += `  • 무릎 정렬: ${postureAssessment.kneeAlignment === "x-leg" ? "X자형" : "O자형"}\n`;
        }
        if (postureAssessment.shoulderHeightDiff) {
          text += `  • 어깨 높이 차이: ${postureAssessment.shoulderHigherSide === "left" ? "좌측 높음" : "우측 높음"}\n`;
        }
        if (postureAssessment.scapulaProtrusion) text += `  • 날개뼈 돌출: 있음\n`;
        text += `\n`;
      }
    }

    // 체력 테스트
    if (fitnessTest) {
      const { upperBody, lowerBody, cardiovascular, flexibility } = fitnessTest;
      const hasTestResults = upperBody.pushUpCount || upperBody.plankTime ||
        lowerBody.squatCount || cardiovascular.burpeeCount ||
        flexibility.sitAndReach;

      if (hasTestResults) {
        text += `💪 체력 테스트 결과\n`;
        if (upperBody.pushUpCount) text += `  • 푸쉬업: ${upperBody.pushUpCount}회 (${getStatusText(upperBody.pushUpStatus)})\n`;
        if (upperBody.plankTime) text += `  • 플랭크: ${upperBody.plankTime}초 (${getStatusText(upperBody.plankStatus)})\n`;
        if (lowerBody.squatCount) text += `  • 스쿼트: ${lowerBody.squatCount}회 (${getStatusText(lowerBody.squatStatus)})\n`;
        if (cardiovascular.burpeeCount) text += `  • 버피: ${cardiovascular.burpeeCount}회\n`;
        if (flexibility.sitAndReach) text += `  • 유연성(윗몸앞으로굽히기): ${flexibility.sitAndReach}cm\n`;
        text += `\n`;
      }
    }

    // 목표 유형
    if (basicInfo.goalType) {
      text += `🎯 회원님의 목표\n`;
      text += `  ✓ ${basicInfo.goalType}\n\n`;
    }

    // 맞춤 로드맵
    if (programDesign && programDesign.roadmap && programDesign.roadmap.length > 0) {
      const hasRoadmap = programDesign.roadmap.some(phase => phase.goal || phase.mainExercises);
      if (hasRoadmap) {
        text += `📋 맞춤 운동 로드맵\n`;
        programDesign.roadmap.forEach(phase => {
          if (phase.goal || phase.mainExercises) {
            text += `  ▸ ${phase.phaseName} (${phase.weekRange})\n`;
            if (phase.goal) text += `    목표: ${phase.goal}\n`;
            if (phase.mainExercises) text += `    주요운동: ${phase.mainExercises}\n`;
          }
        });
        text += `\n`;
      }
    }

    // 트레이너 종합 평가
    if (programDesign?.trainerEvaluation?.memberStrengths || programDesign?.trainerEvaluation?.coachingNotes) {
      text += `💬 트레이너 종합 피드백\n`;
      if (programDesign.trainerEvaluation.memberStrengths) {
        text += `회원님의 강점: ${programDesign.trainerEvaluation.memberStrengths}\n`;
      }
      if (programDesign.trainerEvaluation.coachingNotes) {
        text += `${programDesign.trainerEvaluation.coachingNotes}\n`;
      }
      text += `\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━
🏠 ${gymName}
📞 궁금한 점은 언제든 문의해 주세요!
━━━━━━━━━━━━━━━━━━━━━━`;

    return text;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "insufficient": return "개선 필요";
      case "normal": return "보통";
      case "excellent": return "우수";
      default: return "-";
    }
  };

  const handleCopyText = async () => {
    if (!selectedMember) return;

    const text = selectedMember.type === "consultation" && selectedMember.consultationData
      ? generateConsultationShareText(selectedMember.consultationData)
      : selectedMember.otFormData
        ? generateOTShareText(selectedMember.otFormData)
        : "";

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
      alert("텍스트 복사에 실패했습니다.");
    }
  };

  // 이미지 다운로드 기능
  const handleDownloadImage = async () => {
    if (!resultRef.current || !selectedMember) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${selectedMember.memberName}_상담결과_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "").replace(/ /g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error("이미지 생성 실패:", err);
      alert("이미지 다운로드에 실패했습니다.");
    }
  };

  // 공유 기능 (모바일)
  const handleShare = async () => {
    if (!selectedMember) return;

    const text = selectedMember.type === "consultation" && selectedMember.consultationData
      ? generateConsultationShareText(selectedMember.consultationData)
      : selectedMember.otFormData
        ? generateOTShareText(selectedMember.otFormData)
        : "";

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${selectedMember.memberName}님 상담 결과`,
          text: text,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("공유 실패:", err);
        }
      }
    } else {
      handleCopyText();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "insufficient":
        return <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-md text-xs font-bold">개선 필요</span>;
      case "normal":
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md text-xs font-bold">보통</span>;
      case "excellent":
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-xs font-bold">우수</span>;
      default:
        return null;
    }
  };

  // 신규 상담 결과 렌더링
  const renderConsultationResult = (data: ConsultationFormData) => {
    const goals = getConsultationGoals(data);
    const painAreas = data.painAreas.filter(p => p.hasIssue);

    return (
      <>
        {/* 헤더 */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{gymName}</h3>
          <p className="text-blue-600 font-bold text-sm mt-1">
            {cleanMemberName(data.memberName)}님 첫 상담 결과
          </p>
          <p className="text-slate-400 text-xs mt-2">
            {data.firstMeetingDate || new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* 목표 */}
        {goals.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-black text-slate-900">
              <Target className="w-5 h-5 text-emerald-500" />
              회원님의 목표
            </h4>
            <div className="flex flex-wrap gap-2">
              {goals.map((goal, idx) => (
                <span key={idx} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 다이어트 목표 */}
        {data.dietGoal.selected && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-black text-slate-900">
              <Activity className="w-5 h-5 text-blue-500" />
              체중 목표
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {(data.dietGoal.currentWeight > 0 || data.dietGoal.targetWeight > 0) ? (
                <>
                  {data.dietGoal.currentWeight > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">현재 체중</p>
                      <p className="text-lg font-black text-slate-900">{data.dietGoal.currentWeight}kg</p>
                    </div>
                  )}
                  {data.dietGoal.targetWeight > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">목표 체중</p>
                      <p className="text-lg font-black text-emerald-600">{data.dietGoal.targetWeight}kg</p>
                    </div>
                  )}
                  {data.dietGoal.lossTarget > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">감량 목표</p>
                      <p className="text-lg font-black text-blue-600">-{data.dietGoal.lossTarget}kg</p>
                    </div>
                  )}
                  {data.dietGoal.targetDate && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">목표 날짜</p>
                      <p className="text-lg font-black text-slate-900">{data.dietGoal.targetDate}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-2 bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500">다이어트 목표가 설정되어 있습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 재활/체형교정 */}
        {data.rehabGoal.selected && (
          (() => {
            const issues: string[] = [];
            if (data.rehabGoal.issues.turtleNeck) issues.push("거북목");
            if (data.rehabGoal.issues.roundShoulder) issues.push("굽은 어깨");
            if (data.rehabGoal.issues.discHernia) issues.push("디스크");
            if (data.rehabGoal.issues.pelvicImbalance) issues.push("골반 불균형");
            if (data.rehabGoal.issues.scoliosis) issues.push("척추측만");
            if (data.rehabGoal.issues.kneePain) issues.push("무릎 통증");
            if (data.rehabGoal.issues.other && data.rehabGoal.issues.otherText) {
              issues.push(data.rehabGoal.issues.otherText);
            }

            return (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-black text-slate-900">
                  <User className="w-5 h-5 text-amber-500" />
                  교정이 필요한 부분
                </h4>
                <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                  {issues.length > 0 ? (
                    issues.map((issue, idx) => (
                      <p key={idx} className="text-sm text-slate-700">• {issue}</p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">재활/체형교정 목표가 설정되어 있습니다</p>
                  )}
                  {data.rehabGoal.expectation && (
                    <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-amber-100">
                      기대사항: {data.rehabGoal.expectation}
                    </p>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* 근력/퍼포먼스 목표 */}
        {data.strengthGoal.selected && (
          (() => {
            const subGoals: string[] = [];
            if (data.strengthGoal.subGoals.overallFitness) subGoals.push("전반적인 체력 향상");
            if (data.strengthGoal.subGoals.bodyProfile) subGoals.push("바디프로필");
            if (data.strengthGoal.subGoals.bigThree) subGoals.push("3대 중량 향상");
            if (data.strengthGoal.subGoals.bulkUp) subGoals.push("벌크업");
            if (data.strengthGoal.subGoals.sportsPerformance) subGoals.push("스포츠 퍼포먼스");
            if (data.strengthGoal.subGoals.other && data.strengthGoal.subGoals.otherText) {
              subGoals.push(data.strengthGoal.subGoals.otherText);
            }

            const hasBigThree = data.strengthGoal.currentSquat > 0 ||
              data.strengthGoal.currentBench > 0 ||
              data.strengthGoal.currentDeadlift > 0;

            return (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-black text-slate-900">
                  <Dumbbell className="w-5 h-5 text-orange-500" />
                  근력/퍼포먼스 목표
                </h4>
                <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                  {subGoals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subGoals.map((goal, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white text-orange-600 rounded-lg text-xs font-bold border border-orange-100">
                          {goal}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">근력/퍼포먼스 향상 목표가 설정되어 있습니다</p>
                  )}
                  {hasBigThree && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-orange-100">
                      {data.strengthGoal.currentSquat > 0 && (
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-bold">스쿼트</p>
                          <p className="text-sm font-bold text-slate-700">
                            {data.strengthGoal.currentSquat}kg → {data.strengthGoal.targetSquat || "?"}kg
                          </p>
                        </div>
                      )}
                      {data.strengthGoal.currentBench > 0 && (
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-bold">벤치</p>
                          <p className="text-sm font-bold text-slate-700">
                            {data.strengthGoal.currentBench}kg → {data.strengthGoal.targetBench || "?"}kg
                          </p>
                        </div>
                      )}
                      {data.strengthGoal.currentDeadlift > 0 && (
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 font-bold">데드</p>
                          <p className="text-sm font-bold text-slate-700">
                            {data.strengthGoal.currentDeadlift}kg → {data.strengthGoal.targetDeadlift || "?"}kg
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* 습관 개선 목표 */}
        {data.habitGoal.selected && (
          (() => {
            const subGoals: string[] = [];
            if (data.habitGoal.subGoals.regularExercise) subGoals.push("규칙적인 운동");
            if (data.habitGoal.subGoals.betterSleep) subGoals.push("수면 개선");
            if (data.habitGoal.subGoals.healthyDiet) subGoals.push("건강한 식단");
            if (data.habitGoal.subGoals.stressManagement) subGoals.push("스트레스 관리");
            if (data.habitGoal.subGoals.postureCorrection) subGoals.push("자세 교정");
            if (data.habitGoal.subGoals.other && data.habitGoal.subGoals.otherText) {
              subGoals.push(data.habitGoal.subGoals.otherText);
            }

            return (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-black text-slate-900">
                  <Heart className="w-5 h-5 text-pink-500" />
                  습관 개선 목표
                </h4>
                <div className="bg-pink-50 rounded-xl p-4 space-y-3">
                  {subGoals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subGoals.map((goal, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white text-pink-600 rounded-lg text-xs font-bold border border-pink-100">
                          {goal}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">습관 개선 목표가 설정되어 있습니다</p>
                  )}
                  {(data.habitGoal.currentHabit || data.habitGoal.targetHabit) && (
                    <div className="pt-2 border-t border-pink-100 text-sm text-slate-600">
                      {data.habitGoal.currentHabit && (
                        <p>현재: {data.habitGoal.currentHabit}</p>
                      )}
                      {data.habitGoal.targetHabit && (
                        <p>목표: {data.habitGoal.targetHabit}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* 기타 목표 */}
        {data.otherGoal.selected && data.otherGoal.description && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-black text-slate-900">
              <FileText className="w-5 h-5 text-slate-500" />
              기타 목표
            </h4>
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-sm text-slate-700">{data.otherGoal.description}</p>
            </div>
          </div>
        )}

        {/* 통증 부위 */}
        {painAreas.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-black text-slate-900">
              ⚠️ 주의가 필요한 부위
            </h4>
            <div className="bg-red-50 rounded-xl p-4 space-y-2">
              {painAreas.map((pain, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <p className="text-sm text-slate-700">• {pain.area}</p>
                  {pain.intensity > 0 && (
                    <span className="text-xs font-bold text-red-500">강도 {pain.intensity}/5</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 운동 계획 */}
        {data.availableTime.preferredWeeklyCount > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-black text-slate-900">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              운동 계획
            </h4>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm text-slate-700">
                권장 운동 횟수: <span className="font-bold text-purple-600">주 {data.availableTime.preferredWeeklyCount}회</span>
              </p>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center pt-6 border-t border-slate-100">
          <p className="text-slate-400 text-xs">
            궁금한 점은 언제든 문의해 주세요! 😊
          </p>
          <p className="text-blue-600 font-bold text-sm mt-1">{gymName}</p>
        </div>
      </>
    );
  };

  // OT 결과 렌더링
  const renderOTResult = (otData: OTFormData) => {
    return (
      <>
        {/* 헤더 */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900">{gymName}</h3>
          <p className="text-emerald-600 font-bold text-sm mt-1">
            {cleanMemberName(otData.basicInfo.memberName)}님 OT 상담 결과
          </p>
          <p className="text-slate-400 text-xs mt-2">
            {otData.basicInfo.firstMeetingDate || new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* 체성분 분석 */}
        {otData.bodyComposition && (
          (() => {
            const bc = otData.bodyComposition;
            const hasData = bc.weight || bc.skeletalMuscle || bc.bodyFatPercentage;
            if (!hasData) return null;
            return (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-black text-slate-900">
                  <Activity className="w-5 h-5 text-blue-500" />
                  체성분 분석 결과
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {bc.weight > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">체중</p>
                      <p className="text-lg font-black text-slate-900">{bc.weight}kg</p>
                    </div>
                  )}
                  {bc.skeletalMuscle > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold">골격근량</p>
                        {getStatusBadge(bc.skeletalMuscleStatus)}
                      </div>
                      <p className="text-lg font-black text-slate-900">{bc.skeletalMuscle}kg</p>
                    </div>
                  )}
                  {bc.bodyFatPercentage > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold">체지방률</p>
                        {getStatusBadge(bc.bodyFatPercentageStatus)}
                      </div>
                      <p className="text-lg font-black text-slate-900">{bc.bodyFatPercentage}%</p>
                    </div>
                  )}
                  {bc.bmi > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">BMI</p>
                      <p className="text-lg font-black text-slate-900">{bc.bmi}</p>
                    </div>
                  )}
                  {bc.basalMetabolicRate > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">기초대사량</p>
                      <p className="text-lg font-black text-slate-900">{bc.basalMetabolicRate}kcal</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* 자세 분석 */}
        {otData.postureAssessment && (
          (() => {
            const pa = otData.postureAssessment;
            const issues: string[] = [];
            if (pa.turtleNeck) issues.push("거북목");
            if (pa.roundShoulder) issues.push("굽은 어깨");
            if (pa.anteriorPelvicTilt) issues.push("골반 전방 기울임");
            if (pa.kneeAlignment && pa.kneeAlignment !== "normal") {
              issues.push(pa.kneeAlignment === "x-leg" ? "X자형 무릎" : "O자형 무릎");
            }
            if (pa.shoulderHeightDiff) {
              issues.push(`어깨 높이 차이 (${pa.shoulderHigherSide === "left" ? "좌측 높음" : "우측 높음"})`);
            }
            if (pa.scapulaProtrusion) issues.push("날개뼈 돌출");
            if (pa.kneeHyperextension) issues.push("무릎 과신전");
            if (pa.excessiveLumbarLordosis) issues.push("과도한 요추 전만");

            if (issues.length === 0) return null;

            return (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-black text-slate-900">
                  <User className="w-5 h-5 text-amber-500" />
                  자세 분석 결과
                </h4>
                <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                  {issues.map((issue, idx) => (
                    <p key={idx} className="text-sm text-slate-700">• {issue}</p>
                  ))}
                </div>
              </div>
            );
          })()
        )}

        {/* 체력 테스트 */}
        {otData.fitnessTest && (
          (() => {
            const ft = otData.fitnessTest;
            const hasData = ft.upperBody.pushUpCount > 0 || ft.upperBody.plankTime > 0 ||
              ft.lowerBody.squatCount > 0 || ft.cardiovascular.burpeeCount > 0;

            if (!hasData) return null;

            return (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-black text-slate-900">
                  💪 체력 테스트 결과
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {ft.upperBody.pushUpCount > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold">푸쉬업</p>
                        {getStatusBadge(ft.upperBody.pushUpStatus)}
                      </div>
                      <p className="text-lg font-black text-slate-900">{ft.upperBody.pushUpCount}회</p>
                    </div>
                  )}
                  {ft.upperBody.plankTime > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold">플랭크</p>
                        {getStatusBadge(ft.upperBody.plankStatus)}
                      </div>
                      <p className="text-lg font-black text-slate-900">{ft.upperBody.plankTime}초</p>
                    </div>
                  )}
                  {ft.lowerBody.squatCount > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold">스쿼트</p>
                        {getStatusBadge(ft.lowerBody.squatStatus)}
                      </div>
                      <p className="text-lg font-black text-slate-900">{ft.lowerBody.squatCount}회</p>
                    </div>
                  )}
                  {ft.cardiovascular.burpeeCount > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-400 font-bold">버피 테스트</p>
                      <p className="text-lg font-black text-slate-900">{ft.cardiovascular.burpeeCount}회</p>
                    </div>
                  )}
                  {ft.flexibility.sitAndReach !== 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-bold">유연성</p>
                        {getStatusBadge(ft.flexibility.sitAndReachStatus)}
                      </div>
                      <p className="text-lg font-black text-slate-900">{ft.flexibility.sitAndReach}cm</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* 목표 유형 */}
        {otData.basicInfo.goalType && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-black text-slate-900">
              <Target className="w-5 h-5 text-emerald-500" />
              회원님의 목표
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                {otData.basicInfo.goalType}
              </span>
            </div>
          </div>
        )}

        {/* 맞춤 로드맵 */}
        {otData.programDesign?.roadmap && (
          (() => {
            const roadmap = otData.programDesign.roadmap;
            const hasContent = roadmap.some(phase => phase.goal || phase.mainExercises);
            if (!hasContent) return null;

            return (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 font-black text-slate-900">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  맞춤 운동 로드맵
                </h4>
                <div className="bg-purple-50 rounded-xl p-4 space-y-4">
                  {roadmap.map((phase, idx) => (
                    (phase.goal || phase.mainExercises) && (
                      <div key={idx} className="border-l-2 border-purple-300 pl-4">
                        <p className="text-xs text-purple-500 font-bold">{phase.phaseName} ({phase.weekRange})</p>
                        {phase.goal && (
                          <p className="text-sm text-slate-700 font-medium mt-1">목표: {phase.goal}</p>
                        )}
                        {phase.mainExercises && (
                          <p className="text-sm text-slate-700 font-medium mt-1">주요 운동: {phase.mainExercises}</p>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })()
        )}

        {/* 트레이너 종합 평가 */}
        {otData.programDesign?.trainerEvaluation && (
          (() => {
            const te = otData.programDesign.trainerEvaluation;
            if (!te.memberStrengths && !te.coachingNotes) return null;

            return (
              <div className="space-y-3">
                <h4 className="font-black text-slate-900">💬 트레이너 피드백</h4>
                <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                  {te.memberStrengths && (
                    <div>
                      <p className="text-xs text-slate-500 font-bold mb-1">회원님의 강점</p>
                      <p className="text-sm text-slate-700">{te.memberStrengths}</p>
                    </div>
                  )}
                  {te.coachingNotes && (
                    <div>
                      <p className="text-xs text-slate-500 font-bold mb-1">코칭 포인트</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{te.coachingNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* 푸터 */}
        <div className="text-center pt-6 border-t border-slate-100">
          <p className="text-slate-400 text-xs">
            궁금한 점은 언제든 문의해 주세요! 😊
          </p>
          <p className="text-emerald-600 font-bold text-sm mt-1">{gymName}</p>
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[32px]">
        <DialogHeader className="px-8 py-6 border-b bg-emerald-600 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white tracking-tight">
                  {selectedMember ? `${cleanMemberName(selectedMember.memberName)}님 상담 결과` : "첫 상담 후 상담 결과"}
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs font-bold mt-0.5">
                  {selectedMember ? "회원님께 전달할 맞춤 피드백" : "상담 기록이 있는 회원을 선택하세요"}
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {!selectedMember ? (
            // 회원 선택 화면
            <div className="p-6 space-y-4">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="회원 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 bg-white border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* 회원 목록 */}
              {filteredMembers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold mb-2">
                    {searchQuery ? "검색 결과가 없습니다" : "상담 기록이 있는 회원이 없습니다"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {searchQuery ? "다른 이름으로 검색해 보세요" : "먼저 상담기록지 또는 OT 기록지를 작성해 주세요"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    총 {filteredMembers.length}명의 회원
                  </p>
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all group text-left"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                        member.type === "consultation" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {member.memberName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{member.memberName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            member.type === "consultation" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {member.type === "consultation" ? "신규 상담" : "OT 기록"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // 상담 결과 표시 화면
            <div className="p-6 space-y-6">
              {/* 뒤로 가기 버튼 */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                회원 다시 선택
              </button>

              {/* 상담 결과 카드 */}
              <div ref={resultRef} className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm space-y-6">
                {selectedMember.type === "consultation" && selectedMember.consultationData
                  ? renderConsultationResult(selectedMember.consultationData)
                  : selectedMember.otFormData
                    ? renderOTResult(selectedMember.otFormData)
                    : null
                }
              </div>

              {/* 공유 버튼들 */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCopyText}
                  variant="outline"
                  className={cn(
                    "flex-1 h-14 rounded-xl font-black gap-2 transition-all",
                    copySuccess ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "border-slate-200"
                  )}
                >
                  {copySuccess ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copySuccess ? "복사 완료!" : "텍스트 복사"}
                </Button>
                <Button
                  onClick={handleDownloadImage}
                  variant="outline"
                  className={cn(
                    "flex-1 h-14 rounded-xl font-black gap-2 transition-all",
                    downloadSuccess ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "border-slate-200"
                  )}
                >
                  {downloadSuccess ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                  {downloadSuccess ? "저장 완료!" : "이미지 저장"}
                </Button>
                <Button
                  onClick={handleShare}
                  className="h-14 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black gap-2 shadow-lg shadow-emerald-100"
                >
                  <Share2 className="w-5 h-5" />
                  공유
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

