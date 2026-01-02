"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ReRegistrationConsultation,
  StageChecklist as StageChecklistType,
  Stage5Checklist,
  recommendedScripts,
} from "../types";

interface Props {
  consultation: ReRegistrationConsultation;
  onUpdate: (updates: Partial<ReRegistrationConsultation>) => void;
}

const stageConfig = [
  {
    stage: 1,
    title: "Stage 1: 신뢰 구축 & 작은 변화 인식",
    range: "100% → 70%",
    color: "green",
    script: recommendedScripts.stage1,
    items: [
      { key: "roadmapShared", label: "OT에서 12주 로드맵 공유 완료" },
      { key: "habitFormation", label: "첫 2주: 운동 습관 형성 집중" },
      { key: "firstInbody", label: "4주차: 첫 번째 인바디 측정" },
      { key: "dataOrganized", label: "변화 데이터 정리 (체중, 체지방, 근육량)" },
      { key: "positiveFeedback", label: "긍정적 변화 피드백 전달" },
    ],
  },
  {
    stage: 2,
    title: "Stage 2: 중간 점검 & 목표 재확인",
    range: "70% → 50%",
    color: "blue",
    script: recommendedScripts.stage2,
    items: [
      { key: "goalProgress", label: "목표 달성도 점검" },
      { key: "satisfaction", label: "프로그램 만족도 확인" },
      { key: "remainingPlan", label: "남은 기간 계획 논의" },
      { key: "goalReset", label: "필요시 목표 재설정" },
      { key: "memberFeedback", label: "회원 피드백 청취" },
    ],
  },
  {
    stage: 3,
    title: "Stage 3: 재등록 상담 시작 (핵심 타이밍)",
    range: "50% → 30%",
    color: "yellow",
    script: recommendedScripts.stage3,
    items: [
      { key: "dataVisualization", label: "전체 변화 데이터 시각화 자료 준비" },
      { key: "beforeAfterPhotos", label: "비포/애프터 사진 정리" },
      { key: "futureRoadmap", label: "향후 3~6개월 로드맵 준비" },
      { key: "promotionCheck", label: "현재 프로모션/이벤트 확인" },
      { key: "consultationDone", label: "재등록 상담 진행" },
      { key: "reactionRecorded", label: "회원 반응 기록" },
    ],
  },
  {
    stage: 4,
    title: "Stage 4: 최종 결정 유도",
    range: "30% → 10%",
    color: "orange",
    script: recommendedScripts.stage4,
    items: [
      { key: "lastBenefit", label: "마지막 혜택 안내" },
      { key: "concernResolved", label: "고민 요인 파악 및 해소" },
      { key: "afterPlan", label: "종료 후 계획 논의" },
      { key: "finalDecision", label: "최종 결정 확인" },
    ],
  },
  {
    stage: 5,
    title: "Stage 5: 종료",
    range: "0%",
    color: "red",
    script: recommendedScripts.stage5Terminated,
    outcomes: [
      { value: "reRegistered", label: "재등록 완료", color: "text-green-600" },
      { value: "paused", label: "휴회", color: "text-yellow-600" },
      { value: "terminated", label: "종료", color: "text-red-600" },
    ],
    itemsByOutcome: {
      reRegistered: [
        { key: "newRegistration", label: "새 등록 정보 업데이트" },
        { key: "nextGoal", label: "다음 단계 목표 설정" },
        { key: "programUpgrade", label: "프로그램 업그레이드 논의" },
      ],
      paused: [
        { key: "pausePeriod", label: "휴회 기간 확인" },
        { key: "returnDate", label: "복귀 예정일 기록" },
        { key: "monthlyContact", label: "월 1회 안부 연락 스케줄" },
      ],
      terminated: [
        { key: "terminationReason", label: "종료 사유 기록" },
        { key: "exerciseGuide", label: "개인 운동 가이드 제공" },
        { key: "futureContact", label: "3개월 후 연락 스케줄 등록" },
      ],
    },
  },
];

export function StageChecklist({ consultation, onUpdate }: Props) {
  const [expandedStages, setExpandedStages] = useState<number[]>([
    consultation.currentStage,
  ]);

  const toggleStage = (stage: number) => {
    setExpandedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const getStageData = (stage: number): StageChecklistType | undefined => {
    return consultation.stageChecklists.find((s) => s.stage === stage);
  };

  const updateStageChecklist = (
    stage: number,
    key: string,
    value: boolean | string
  ) => {
    const newChecklists = consultation.stageChecklists.map((s) => {
      if (s.stage === stage) {
        if (key === "memo") {
          return { ...s, memo: value as string };
        }
        if (key === "outcome" && stage === 5) {
          return { ...s, outcome: value as Stage5Checklist["outcome"] };
        }
        return {
          ...s,
          items: { ...s.items, [key]: value },
        };
      }
      return s;
    });

    onUpdate({ stageChecklists: newChecklists as StageChecklistType[] });
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> =
      {
        green: {
          bg: "bg-green-50",
          border: "border-green-300",
          text: "text-green-700",
        },
        blue: {
          bg: "bg-blue-50",
          border: "border-blue-300",
          text: "text-blue-700",
        },
        yellow: {
          bg: "bg-yellow-50",
          border: "border-yellow-300",
          text: "text-yellow-700",
        },
        orange: {
          bg: "bg-orange-50",
          border: "border-orange-300",
          text: "text-orange-700",
        },
        red: {
          bg: "bg-red-50",
          border: "border-red-300",
          text: "text-red-700",
        },
      };
    return isActive
      ? colors[color]
      : { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-500" };
  };

  const getCompletionCount = (
    stageData: StageChecklistType | undefined,
    config: (typeof stageConfig)[number]
  ): [number, number] => {
    if (!stageData) return [0, 0];

    if (config.stage === 5) {
      const s5 = stageData as Stage5Checklist;
      const outcome = s5.outcome;
      if (!outcome) return [0, 0];

      const items = config.itemsByOutcome?.[outcome] || [];
      const completed = items.filter(
        (item) => s5.items[item.key as keyof typeof s5.items]
      ).length;
      return [completed, items.length];
    }

    const items = Object.values(stageData.items);
    const completed = items.filter((v) => v === true).length;
    return [completed, items.length];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-gray-900">
          {consultation.memberName} 님의 재등록 체크리스트
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          현재 Stage {consultation.currentStage} (진행률{" "}
          {consultation.progressPercentage}%)
        </p>
      </div>

      <div className="divide-y">
        {stageConfig.map((config) => {
          const stageData = getStageData(config.stage);
          const isCurrentStage = config.stage === consultation.currentStage;
          const isPastStage = config.stage < consultation.currentStage;
          const isExpanded = expandedStages.includes(config.stage);
          const colors = getColorClasses(
            config.color,
            isCurrentStage || isPastStage
          );
          const [completed, total] = getCompletionCount(stageData, config);

          return (
            <div
              key={config.stage}
              className={isCurrentStage ? colors.bg : ""}
            >
              {/* 스테이지 헤더 */}
              <button
                onClick={() => toggleStage(config.stage)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isPastStage
                        ? "bg-green-500 text-white"
                        : isCurrentStage
                          ? `${colors.bg} ${colors.text} border-2 ${colors.border}`
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isPastStage ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {config.stage}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p
                      className={`font-medium ${isCurrentStage ? colors.text : "text-gray-700"}`}
                    >
                      {config.title}
                    </p>
                    <p className="text-xs text-gray-500">{config.range}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {total > 0 && (
                    <span className="text-sm text-gray-500">
                      {completed}/{total}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* 체크리스트 아이템 */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* 추천 멘트 */}
                  {config.script && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg ml-11">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          추천 멘트
                        </p>
                        <p className="text-sm text-blue-700 italic">
                          {config.script}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stage 5: 결과 선택 */}
                  {config.stage === 5 && config.outcomes && (
                    <div className="ml-11 mb-3">
                      <Label className="text-xs text-gray-500 mb-2 block">
                        결과 선택
                      </Label>
                      <Select
                        value={
                          (stageData as Stage5Checklist)?.outcome || undefined
                        }
                        onValueChange={(value) =>
                          updateStageChecklist(5, "outcome", value)
                        }
                      >
                        <SelectTrigger className="w-48 h-9">
                          <SelectValue placeholder="결과 선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {config.outcomes.map((outcome) => (
                            <SelectItem
                              key={outcome.value}
                              value={outcome.value}
                            >
                              <span className={outcome.color}>
                                {outcome.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 일반 Stage 아이템들 */}
                  {config.stage !== 5 &&
                    config.items?.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-start gap-3 pl-11"
                      >
                        <Checkbox
                          id={`${config.stage}-${item.key}`}
                          checked={
                            Boolean(stageData?.items?.[
                              item.key as keyof typeof stageData.items
                            ]) ?? false
                          }
                          onCheckedChange={(checked) =>
                            updateStageChecklist(
                              config.stage,
                              item.key,
                              !!checked
                            )
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`${config.stage}-${item.key}`}
                          className="text-sm text-gray-700 cursor-pointer leading-tight"
                        >
                          {item.label}
                        </Label>
                      </div>
                    ))}

                  {/* Stage 5: 결과별 아이템들 */}
                  {config.stage === 5 &&
                    (stageData as Stage5Checklist)?.outcome &&
                    config.itemsByOutcome?.[
                      (stageData as Stage5Checklist).outcome as keyof typeof config.itemsByOutcome
                    ]?.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-start gap-3 pl-11"
                      >
                        <Checkbox
                          id={`5-${item.key}`}
                          checked={
                            ((stageData as Stage5Checklist)?.items?.[
                              item.key as keyof Stage5Checklist["items"]
                            ] as boolean) ?? false
                          }
                          onCheckedChange={(checked) =>
                            updateStageChecklist(5, item.key, !!checked)
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`5-${item.key}`}
                          className="text-sm text-gray-700 cursor-pointer leading-tight"
                        >
                          {item.label}
                        </Label>
                      </div>
                    ))}

                  {/* 메모 */}
                  <div className="pl-11 pt-2">
                    <Label className="text-xs text-gray-500">메모</Label>
                    <Textarea
                      placeholder="이 단계에 대한 메모를 작성하세요"
                      value={stageData?.memo ?? ""}
                      onChange={(e) =>
                        updateStageChecklist(config.stage, "memo", e.target.value)
                      }
                      className="mt-1 min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
