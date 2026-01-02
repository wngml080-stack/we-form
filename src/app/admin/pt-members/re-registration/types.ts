// 재등록 관리 시스템 타입 정의

// ===== 재등록 단계 정의 =====
export type ReRegistrationStage = 1 | 2 | 3 | 4 | 5;

// Stage 1: 100% -> 70% (신뢰 구축)
export interface Stage1Checklist {
  stage: 1;
  progressRange: "100-70";
  items: {
    roadmapShared: boolean; // OT에서 12주 로드맵 공유 완료
    habitFormation: boolean; // 첫 2주: 운동 습관 형성 집중
    firstInbody: boolean; // 4주차: 첫 번째 인바디 측정
    dataOrganized: boolean; // 변화 데이터 정리 (체중, 체지방, 근육량)
    positiveFeedback: boolean; // 긍정적 변화 피드백 전달
  };
  memo: string;
  completedDate?: string;
}

// Stage 2: 70% -> 50% (중간 점검)
export interface Stage2Checklist {
  stage: 2;
  progressRange: "70-50";
  items: {
    goalProgress: boolean; // 목표 달성도 점검
    satisfaction: boolean; // 프로그램 만족도 확인
    remainingPlan: boolean; // 남은 기간 계획 논의
    goalReset: boolean; // 필요시 목표 재설정
    memberFeedback: boolean; // 회원 피드백 청취
  };
  memo: string;
  completedDate?: string;
}

// Stage 3: 50% -> 30% (재등록 상담 시작 - 핵심)
export interface Stage3Checklist {
  stage: 3;
  progressRange: "50-30";
  items: {
    dataVisualization: boolean; // 전체 변화 데이터 시각화 자료 준비
    beforeAfterPhotos: boolean; // 비포/애프터 사진 정리
    futureRoadmap: boolean; // 향후 3~6개월 로드맵 준비
    promotionCheck: boolean; // 현재 프로모션/이벤트 확인
    consultationDone: boolean; // 재등록 상담 진행
    reactionRecorded: boolean; // 회원 반응 기록
  };
  memo: string;
  completedDate?: string;
}

// Stage 4: 30% -> 10% (최종 결정 유도)
export interface Stage4Checklist {
  stage: 4;
  progressRange: "30-10";
  items: {
    lastBenefit: boolean; // 마지막 혜택 안내
    concernResolved: boolean; // 고민 요인 파악 및 해소
    afterPlan: boolean; // 종료 후 계획 논의
    finalDecision: boolean; // 최종 결정 확인
  };
  memo: string;
  completedDate?: string;
}

// Stage 5: 0% (종료)
export interface Stage5Checklist {
  stage: 5;
  progressRange: "0";
  outcome: "reRegistered" | "paused" | "terminated" | "";
  items: {
    // 재등록 완료 시
    newRegistration: boolean; // 새 등록 정보 업데이트
    nextGoal: boolean; // 다음 단계 목표 설정
    programUpgrade: boolean; // 프로그램 업그레이드 논의
    // 휴회 시
    pausePeriod: boolean; // 휴회 기간 확인
    returnDate: boolean; // 복귀 예정일 기록
    monthlyContact: boolean; // 월 1회 안부 연락 스케줄
    // 종료 시
    terminationReason: boolean; // 종료 사유 기록
    exerciseGuide: boolean; // 개인 운동 가이드 제공
    futureContact: boolean; // 3개월 후 연락 스케줄 등록
  };
  memo: string;
  completedDate?: string;
}

export type StageChecklist =
  | Stage1Checklist
  | Stage2Checklist
  | Stage3Checklist
  | Stage4Checklist
  | Stage5Checklist;

// ===== 회원 반응 =====
export type MemberReaction = "positive" | "considering" | "negative" | "";

// ===== 고민 요인 =====
export interface ConcernFactors {
  cost: boolean; // 비용 부담
  time: boolean; // 시간 부족
  effectDoubt: boolean; // 효과에 대한 의문
  selfTraining: boolean; // 혼자 운동하고 싶음
  otherGym: boolean; // 다른 곳 알아보는 중
  personalReason: boolean; // 개인 사정 (이사, 직장 등)
  other: boolean; // 기타
  otherText: string;
}

// ===== 재등록 상담 기록 =====
export interface ReRegistrationConsultation {
  id: string;
  memberId: string;
  memberName: string;
  consultationDate: string;
  remainingSessions: number;
  totalSessions: number;
  progressPercentage: number;
  assignedTrainer: string;
  memberReaction: MemberReaction;
  concernFactors: ConcernFactors;
  responseStrategy: string; // 대응 전략
  followUpPlan: string; // 후속 계획
  nextContactDate?: string;
  stageChecklists: StageChecklist[];
  currentStage: ReRegistrationStage;
  finalOutcome?: "reRegistered" | "paused" | "terminated";
  createdAt: string;
  updatedAt: string;
}

// ===== 월간 통계 =====
export interface MonthlyStats {
  month: string; // YYYY-MM
  targetCount: number; // 재등록 대상자 수
  reRegisteredCount: number; // 재등록 완료 수
  pausedCount: number; // 휴회 수
  terminatedCount: number; // 종료 수
  reRegistrationRate: number; // 재등록률 (%)
  targetRate: number; // 목표 재등록률 (기본 80%)
  reasonAnalysis: {
    cost: number;
    time: number;
    effectDoubt: number;
    selfTraining: number;
    otherGym: number;
    personalReason: number;
    other: number;
  };
}

// ===== 주간 루틴 =====
export interface WeeklyRoutine {
  weekStart: string; // YYYY-MM-DD (월요일)
  mondayTasks: {
    checkTargetView: boolean; // 재등록 상담 필요 뷰 확인
    reviewExpiringList: boolean; // 이번 주 만료 예정 회원 리스트업
    scheduleConsultation: boolean; // 각 회원 상담 일정 잡기
    prepareData: boolean; // 변화 데이터 자료 준비
    memo: string;
  };
  fridayTasks: {
    summarizeResults: boolean; // 이번 주 상담 결과 정리
    checkMissed: boolean; // 미상담 회원 체크
    planNextWeek: boolean; // 다음 주 계획 수립
    memo: string;
  };
}

// ===== 전체 재등록 관리 데이터 =====
export interface ReRegistrationData {
  consultations: ReRegistrationConsultation[];
  monthlyStats: MonthlyStats[];
  weeklyRoutines: WeeklyRoutine[];
  lastUpdated: string;
}

// ===== 초기 데이터 =====
export const initialConcernFactors: ConcernFactors = {
  cost: false,
  time: false,
  effectDoubt: false,
  selfTraining: false,
  otherGym: false,
  personalReason: false,
  other: false,
  otherText: "",
};

export const initialStage1Checklist: Stage1Checklist = {
  stage: 1,
  progressRange: "100-70",
  items: {
    roadmapShared: false,
    habitFormation: false,
    firstInbody: false,
    dataOrganized: false,
    positiveFeedback: false,
  },
  memo: "",
};

export const initialStage2Checklist: Stage2Checklist = {
  stage: 2,
  progressRange: "70-50",
  items: {
    goalProgress: false,
    satisfaction: false,
    remainingPlan: false,
    goalReset: false,
    memberFeedback: false,
  },
  memo: "",
};

export const initialStage3Checklist: Stage3Checklist = {
  stage: 3,
  progressRange: "50-30",
  items: {
    dataVisualization: false,
    beforeAfterPhotos: false,
    futureRoadmap: false,
    promotionCheck: false,
    consultationDone: false,
    reactionRecorded: false,
  },
  memo: "",
};

export const initialStage4Checklist: Stage4Checklist = {
  stage: 4,
  progressRange: "30-10",
  items: {
    lastBenefit: false,
    concernResolved: false,
    afterPlan: false,
    finalDecision: false,
  },
  memo: "",
};

export const initialStage5Checklist: Stage5Checklist = {
  stage: 5,
  progressRange: "0",
  outcome: "",
  items: {
    newRegistration: false,
    nextGoal: false,
    programUpgrade: false,
    pausePeriod: false,
    returnDate: false,
    monthlyContact: false,
    terminationReason: false,
    exerciseGuide: false,
    futureContact: false,
  },
  memo: "",
};

export const createInitialConsultation = (): Omit<
  ReRegistrationConsultation,
  "id" | "createdAt" | "updatedAt"
> => ({
  memberId: "",
  memberName: "",
  consultationDate: new Date().toISOString().split("T")[0],
  remainingSessions: 0,
  totalSessions: 0,
  progressPercentage: 0,
  assignedTrainer: "",
  memberReaction: "",
  concernFactors: { ...initialConcernFactors },
  responseStrategy: "",
  followUpPlan: "",
  stageChecklists: [
    { ...initialStage1Checklist },
    { ...initialStage2Checklist },
    { ...initialStage3Checklist },
    { ...initialStage4Checklist },
    { ...initialStage5Checklist },
  ],
  currentStage: 1,
});

export const initialReRegistrationData: ReRegistrationData = {
  consultations: [],
  monthlyStats: [],
  weeklyRoutines: [],
  lastUpdated: "",
};

// ===== 유틸리티 함수 =====

// 진행률에 따른 현재 단계 계산
export function calculateCurrentStage(
  progressPercentage: number
): ReRegistrationStage {
  if (progressPercentage > 70) return 1;
  if (progressPercentage > 50) return 2;
  if (progressPercentage > 30) return 3;
  if (progressPercentage > 10) return 4;
  return 5;
}

// 상담 완료율 계산
export function calculateConsultationCompletion(
  data: ReRegistrationConsultation
): number {
  let filled = 0;
  let total = 0;

  // 기본 정보 (5 fields)
  total += 5;
  if (data.memberName) filled++;
  if (data.consultationDate) filled++;
  if (data.assignedTrainer) filled++;
  if (data.memberReaction) filled++;
  if (data.remainingSessions > 0) filled++;

  // 고민 요인 (최소 1개 선택)
  total += 1;
  const hasConcern = Object.entries(data.concernFactors).some(
    ([key, value]) => key !== "otherText" && value === true
  );
  if (hasConcern) filled++;

  // 대응 전략
  total += 1;
  if (data.responseStrategy.trim()) filled++;

  // 후속 계획
  total += 1;
  if (data.followUpPlan.trim()) filled++;

  return Math.round((filled / total) * 100);
}

// 월간 통계 계산
export function calculateMonthlyStats(
  consultations: ReRegistrationConsultation[],
  month: string
): MonthlyStats {
  const monthConsultations = consultations.filter(
    (c) => c.createdAt.startsWith(month) || c.updatedAt.startsWith(month)
  );

  const completed = monthConsultations.filter((c) => c.finalOutcome);
  const reRegistered = completed.filter(
    (c) => c.finalOutcome === "reRegistered"
  ).length;
  const paused = completed.filter((c) => c.finalOutcome === "paused").length;
  const terminated = completed.filter(
    (c) => c.finalOutcome === "terminated"
  ).length;

  const reasonAnalysis = {
    cost: 0,
    time: 0,
    effectDoubt: 0,
    selfTraining: 0,
    otherGym: 0,
    personalReason: 0,
    other: 0,
  };

  monthConsultations.forEach((c) => {
    if (c.concernFactors.cost) reasonAnalysis.cost++;
    if (c.concernFactors.time) reasonAnalysis.time++;
    if (c.concernFactors.effectDoubt) reasonAnalysis.effectDoubt++;
    if (c.concernFactors.selfTraining) reasonAnalysis.selfTraining++;
    if (c.concernFactors.otherGym) reasonAnalysis.otherGym++;
    if (c.concernFactors.personalReason) reasonAnalysis.personalReason++;
    if (c.concernFactors.other) reasonAnalysis.other++;
  });

  return {
    month,
    targetCount: monthConsultations.length,
    reRegisteredCount: reRegistered,
    pausedCount: paused,
    terminatedCount: terminated,
    reRegistrationRate:
      monthConsultations.length > 0
        ? Math.round((reRegistered / monthConsultations.length) * 100)
        : 0,
    targetRate: 80,
    reasonAnalysis,
  };
}

// 추천 멘트
export const recommendedScripts = {
  stage1:
    '"회원님, 벌써 한 달이 됐네요! 체지방 1.2kg 빠지고 근육량 0.5kg 늘었어요. 꾸준히 오신 보람이 있죠?"',
  stage2:
    '"절반 왔어요! 지금 페이스면 목표 충분히 달성 가능해요. 남은 기간 어떤 부분에 더 집중할까요?"',
  stage3:
    '"회원님, 지금까지 정말 잘 오셨어요. 이 페이스로 3개월만 더 하시면 목표 체중 충분히 가능해요. 마침 이번 달 재등록 이벤트가 있는데, 어차피 계속하실 거라면 혜택 챙기시는 게 합리적이에요!"',
  stage4:
    '"이번 주까지 재등록하시면 2회 추가 혜택이 있어요. 혹시 고민되시는 부분 있으시면 말씀해주세요!"',
  stage5Terminated:
    '"그동안 정말 수고하셨어요. 혼자 운동하실 때 참고하시라고 루틴 정리해드릴게요. 언제든 다시 오시면 환영해요!"',
};

// 고민 요인별 대응 전략
export const concernResponses = {
  cost: '"장기 등록하시면 회당 단가가 낮아져요. 3개월보다 6개월이 회당 OO원 저렴해요."',
  time: '"주 2회가 부담되시면 주 1회로 조정해볼까요? 페이스 유지하는 게 중요해요."',
  effectDoubt:
    '"지금까지 OOkg 빠지셨잖아요. 여기서 멈추면 요요 올 수 있어서, 유지 기간이 필요해요."',
};
