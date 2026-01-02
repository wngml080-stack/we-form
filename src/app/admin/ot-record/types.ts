// OT 수업기록지 양식 타입 정의

// 기본 정보
export interface OTBasicInfo {
  memberName: string;
  phoneNumber: string;
  assignedTrainer: string;
  firstMeetingDate: string;
  goalType: string; // 목표유형
}

// 체성분 측정
export interface BodyComposition {
  weight: number;
  skeletalMuscle: number;
  bodyFat: number;
  bodyFatPercentage: number;
  bmi: number;
  basalMetabolicRate: number;
  visceralFatLevel: number;
  skeletalMuscleStatus: "insufficient" | "normal" | "high" | "";
  bodyFatStatus: "insufficient" | "normal" | "high" | "";
  bodyFatPercentageStatus: "insufficient" | "normal" | "high" | "";
}

export interface MuscleBalance {
  armBalance: "balanced" | "imbalanced" | "";
  legBalance: "balanced" | "imbalanced" | "";
  trunkNote: string;
}

export interface CircumferenceMeasurement {
  chest: number;
  waist: number;
  hip: number;
  thighLeft: number;
  thighRight: number;
  armLeft: number;
  armRight: number;
}

// 자세 평가
export interface PostureAssessment {
  // 정면
  frontNormal: boolean;
  shoulderHeightDiff: boolean;
  shoulderHigherSide: "left" | "right" | "";
  pelvisHeightDiff: boolean;
  kneeAlignment: "normal" | "x-leg" | "o-leg" | "";

  // 후면
  backNormal: boolean;
  scapulaProtrusion: boolean;
  scoliosisSuspect: boolean;

  // 측면
  sideNormal: boolean;
  turtleNeck: boolean;
  roundShoulder: boolean;
  excessiveLumbarLordosis: boolean;
  anteriorPelvicTilt: boolean;
  kneeHyperextension: boolean;
}

// 동적 움직임 스크리닝
export interface OverheadSquatAssessment {
  depth: "full" | "half" | "quarter" | "";
  kneeValgus: boolean;
  buttWink: boolean;
  heelRise: boolean;
  armFallForward: boolean;
  excessiveForwardLean: boolean;
  asymmetry: boolean;
  memo: string;
}

export interface BalanceTest {
  leftFootTime: number;
  rightFootTime: number;
  leftFootStatus: "good" | "unstable" | "";
  rightFootStatus: "good" | "unstable" | "";
}

export interface LungeAssessment {
  normal: boolean;
  kneeValgus: boolean;
  pelvicDrop: boolean;
  balanceUnstable: boolean;
  asymmetry: boolean;
  weakerSide: string;
}

export interface ShoulderMobility {
  overheadLeft: "normal" | "limited" | "";
  overheadRight: "normal" | "limited" | "";
  backReachLeft: "normal" | "limited" | "";
  backReachRight: "normal" | "limited" | "";
}

export interface JointRangeOfMotion {
  shoulder: boolean;
  thoracicSpine: boolean;
  hip: boolean;
  ankle: boolean;
  other: boolean;
  otherText: string;
}

// 커스텀 운동 항목
export interface CustomMovementExercise {
  id: string;
  name: string;
  result: string; // 결과/관찰 내용
  memo: string;
}

export interface MovementAssessment {
  overheadSquat: OverheadSquatAssessment;
  balanceTest: BalanceTest;
  lungeAssessment: LungeAssessment;
  shoulderMobility: ShoulderMobility;
  jointROM: JointRangeOfMotion;
  customExercises: CustomMovementExercise[]; // 커스텀 운동 항목들
  movementMemo: string;
}

// 기초 체력 테스트
export interface UpperBodyStrength {
  pushUpCount: number;
  pushUpStatus: "insufficient" | "normal" | "excellent" | "";
  kneePushUpCount: number;
  plankTime: number;
  plankStatus: "insufficient" | "normal" | "excellent" | "";
}

export interface LowerBodyStrength {
  squatCount: number;
  squatStatus: "insufficient" | "normal" | "excellent" | "";
  lungeLeftCount: number;
  lungeRightCount: number;
  lungeBalance: "balanced" | "imbalanced" | "";
  wallSitTime: number;
  wallSitStatus: "insufficient" | "normal" | "excellent" | "";
}

export interface CardiovascularEndurance {
  burpeeCount: number;
  stairsFloors: number;
  treadmillMinutes: number;
}

export interface Flexibility {
  sitAndReach: number; // cm from toes (+/-)
  sitAndReachStatus: "insufficient" | "normal" | "excellent" | "";
  shoulderFlexibility: boolean; // 등 뒤 손잡기 가능 여부
}

export interface HeartRateResponse {
  restingHR: number;
  postExerciseHR: number;
  recoveryHR: number; // 1분 후
}

export interface FitnessTest {
  upperBody: UpperBodyStrength;
  lowerBody: LowerBodyStrength;
  cardiovascular: CardiovascularEndurance;
  flexibility: Flexibility;
  heartRate: HeartRateResponse;
}

// 운동 강도 적응도
export interface ExerciseIntensityAdaptation {
  averageRPE: number; // 1-10
  recoverySpeed: "fast" | "normal" | "slow" | "";
  sweatResponse: "minimal" | "moderate" | "heavy" | "";
  breathingControl: "good" | "easily_winded" | "";
}

// OT 회차별 수업 기록
export interface OTSessionRecord {
  id: string;
  sessionNumber: number; // 1회차, 2회차...
  date: string;
  dayOfWeek: string; // 월, 화, 수...
  completed: boolean; // 진행여부
  exerciseContent: string; // 운동 내용
  trainerMemo: string; // 트레이너 메모 (특이사항, 주의사항)
}

// 프로그램 설계 - SMART 목표
export interface SMARTGoal {
  specific: string; // 구체적 목표
  measurable: string; // 측정 가능한 지표
  achievable: "possible" | "needsAdjustment" | ""; // 달성 가능 여부
  relevant: "high" | "medium" | ""; // 목표와의 연관성
  timeBound: {
    week4: string; // 4주 목표
    week8: string; // 8주 목표
    week12: string; // 12주 목표
  };
}

// 프로그램 설계 - 주간 운동 계획
export interface WeeklyPlan {
  weeklyCount: number; // 주당 운동 횟수
  splitType: "fullBody" | "upperLower" | "bodyPart" | "pushPullLeg" | "other" | "";
  splitTypeOther: string;
  dailyPlan: {
    monday: { pt: boolean; personal: boolean; rest: boolean; focus: string };
    tuesday: { pt: boolean; personal: boolean; rest: boolean; focus: string };
    wednesday: { pt: boolean; personal: boolean; rest: boolean; focus: string };
    thursday: { pt: boolean; personal: boolean; rest: boolean; focus: string };
    friday: { pt: boolean; personal: boolean; rest: boolean; focus: string };
    saturday: { pt: boolean; personal: boolean; rest: boolean; focus: string };
    sunday: { pt: boolean; personal: boolean; rest: boolean; focus: string };
  };
}

// 프로그램 설계 - 우선순위
export interface Priority {
  rank: number; // 1, 2, 3
  content: string;
  reason: string;
}

// 프로그램 설계 - 주의사항
export interface Precautions {
  avoidExercises: string; // 피해야 할 운동
  cautionExercises: string; // 주의해서 해야 할 운동
  specialConsiderations: string; // 특별 고려사항
}

// 프로그램 설계 - 로드맵 Phase
export interface RoadmapPhase {
  phaseName: string; // Phase 1, 2, 3
  weekRange: string; // 1-4주, 5-8주, 9-12주
  goal: string;
  mainExercises: string;
  expectedChanges: string;
}

// 프로그램 설계 - 회원 피드백
export interface MemberFeedback {
  otFeeling: string; // OT 수업 후 느낌
  expectationReality: "asExpected" | "easierThanExpected" | "harderThanExpected" | "other" | "";
  expectationRealityOther: string;
  additionalRequests: string;
}

// 프로그램 설계 - 트레이너 종합 평가
export interface TrainerEvaluation {
  memberStrengths: string; // 회원의 강점
  memberWeaknesses: string; // 회원의 약점/개선점
  coachingNotes: string; // 코칭 시 유의할 점
  anticipatedChallenges: string; // 예상되는 어려움과 대응 전략
}

// 프로그램 설계 - OT 완료 체크리스트
export interface OTChecklist {
  inBodyComplete: boolean;
  circumferenceComplete: boolean;
  beforePhotoComplete: boolean;
  movementScreeningComplete: boolean;
  fitnessTestComplete: boolean;
  goalAgreed: boolean;
  roadmapExplained: boolean;
  centerGuideComplete: boolean;
  nextSessionBooked: boolean;
  nextSessionDateTime: string;
  homeworkAssigned: boolean;
  homeworkContent: string;
}

// 전체 프로그램 설계
export interface ProgramDesign {
  isCompleted: boolean; // 진행여부
  smartGoal: SMARTGoal;
  weeklyPlan: WeeklyPlan;
  priorities: Priority[];
  precautions: Precautions;
  roadmap: RoadmapPhase[];
  memberFeedback: MemberFeedback;
  trainerEvaluation: TrainerEvaluation;
  checklist: OTChecklist;
}

// 전체 OT 폼 데이터
export interface OTFormData {
  // 기본 정보
  basicInfo: OTBasicInfo;

  // 1. 체성분 측정
  bodyComposition: BodyComposition;
  muscleBalance: MuscleBalance;
  circumference: CircumferenceMeasurement;

  // 2. 자세 & 움직임 평가
  postureAssessment: PostureAssessment;
  movementAssessment: MovementAssessment;

  // 3. 기초 체력 테스트
  fitnessTest: FitnessTest;

  // 4. 운동 강도 적응도
  intensityAdaptation: ExerciseIntensityAdaptation;

  // 5. OT 회차별 수업 기록
  sessionRecords: OTSessionRecord[];

  // 6. 수업 프로그램 설계
  programDesign: ProgramDesign;

  // 댓글
  comments: string;
}

export const initialOTFormData: OTFormData = {
  basicInfo: {
    memberName: "",
    phoneNumber: "",
    assignedTrainer: "",
    firstMeetingDate: "",
    goalType: "",
  },

  bodyComposition: {
    weight: 0,
    skeletalMuscle: 0,
    bodyFat: 0,
    bodyFatPercentage: 0,
    bmi: 0,
    basalMetabolicRate: 0,
    visceralFatLevel: 0,
    skeletalMuscleStatus: "",
    bodyFatStatus: "",
    bodyFatPercentageStatus: "",
  },

  muscleBalance: {
    armBalance: "",
    legBalance: "",
    trunkNote: "",
  },

  circumference: {
    chest: 0,
    waist: 0,
    hip: 0,
    thighLeft: 0,
    thighRight: 0,
    armLeft: 0,
    armRight: 0,
  },

  postureAssessment: {
    frontNormal: false,
    shoulderHeightDiff: false,
    shoulderHigherSide: "",
    pelvisHeightDiff: false,
    kneeAlignment: "",
    backNormal: false,
    scapulaProtrusion: false,
    scoliosisSuspect: false,
    sideNormal: false,
    turtleNeck: false,
    roundShoulder: false,
    excessiveLumbarLordosis: false,
    anteriorPelvicTilt: false,
    kneeHyperextension: false,
  },

  movementAssessment: {
    overheadSquat: {
      depth: "",
      kneeValgus: false,
      buttWink: false,
      heelRise: false,
      armFallForward: false,
      excessiveForwardLean: false,
      asymmetry: false,
      memo: "",
    },
    balanceTest: {
      leftFootTime: 0,
      rightFootTime: 0,
      leftFootStatus: "",
      rightFootStatus: "",
    },
    lungeAssessment: {
      normal: false,
      kneeValgus: false,
      pelvicDrop: false,
      balanceUnstable: false,
      asymmetry: false,
      weakerSide: "",
    },
    shoulderMobility: {
      overheadLeft: "",
      overheadRight: "",
      backReachLeft: "",
      backReachRight: "",
    },
    jointROM: {
      shoulder: false,
      thoracicSpine: false,
      hip: false,
      ankle: false,
      other: false,
      otherText: "",
    },
    customExercises: [],
    movementMemo: "",
  },

  fitnessTest: {
    upperBody: {
      pushUpCount: 0,
      pushUpStatus: "",
      kneePushUpCount: 0,
      plankTime: 0,
      plankStatus: "",
    },
    lowerBody: {
      squatCount: 0,
      squatStatus: "",
      lungeLeftCount: 0,
      lungeRightCount: 0,
      lungeBalance: "",
      wallSitTime: 0,
      wallSitStatus: "",
    },
    cardiovascular: {
      burpeeCount: 0,
      stairsFloors: 0,
      treadmillMinutes: 0,
    },
    flexibility: {
      sitAndReach: 0,
      sitAndReachStatus: "",
      shoulderFlexibility: false,
    },
    heartRate: {
      restingHR: 0,
      postExerciseHR: 0,
      recoveryHR: 0,
    },
  },

  intensityAdaptation: {
    averageRPE: 0,
    recoverySpeed: "",
    sweatResponse: "",
    breathingControl: "",
  },

  sessionRecords: [],

  programDesign: {
    isCompleted: false,
    smartGoal: {
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: {
        week4: "",
        week8: "",
        week12: "",
      },
    },
    weeklyPlan: {
      weeklyCount: 0,
      splitType: "",
      splitTypeOther: "",
      dailyPlan: {
        monday: { pt: false, personal: false, rest: false, focus: "" },
        tuesday: { pt: false, personal: false, rest: false, focus: "" },
        wednesday: { pt: false, personal: false, rest: false, focus: "" },
        thursday: { pt: false, personal: false, rest: false, focus: "" },
        friday: { pt: false, personal: false, rest: false, focus: "" },
        saturday: { pt: false, personal: false, rest: false, focus: "" },
        sunday: { pt: false, personal: false, rest: false, focus: "" },
      },
    },
    priorities: [
      { rank: 1, content: "", reason: "" },
      { rank: 2, content: "", reason: "" },
      { rank: 3, content: "", reason: "" },
    ],
    precautions: {
      avoidExercises: "",
      cautionExercises: "",
      specialConsiderations: "",
    },
    roadmap: [
      { phaseName: "Phase 1: 기초 형성기", weekRange: "1-4주", goal: "", mainExercises: "", expectedChanges: "" },
      { phaseName: "Phase 2: 강화기", weekRange: "5-8주", goal: "", mainExercises: "", expectedChanges: "" },
      { phaseName: "Phase 3: 최적화기", weekRange: "9-12주", goal: "", mainExercises: "", expectedChanges: "" },
    ],
    memberFeedback: {
      otFeeling: "",
      expectationReality: "",
      expectationRealityOther: "",
      additionalRequests: "",
    },
    trainerEvaluation: {
      memberStrengths: "",
      memberWeaknesses: "",
      coachingNotes: "",
      anticipatedChallenges: "",
    },
    checklist: {
      inBodyComplete: false,
      circumferenceComplete: false,
      beforePhotoComplete: false,
      movementScreeningComplete: false,
      fitnessTestComplete: false,
      goalAgreed: false,
      roadmapExplained: false,
      centerGuideComplete: false,
      nextSessionBooked: false,
      nextSessionDateTime: "",
      homeworkAssigned: false,
      homeworkContent: "",
    },
  },

  comments: "",
};

// 완료율 계산 함수
export function calculateOTFormCompletion(data: OTFormData): number {
  let filledFields = 0;
  let totalFields = 0;

  // 기본 정보 (5 fields)
  totalFields += 5;
  if (data.basicInfo.memberName) filledFields++;
  if (data.basicInfo.phoneNumber) filledFields++;
  if (data.basicInfo.assignedTrainer) filledFields++;
  if (data.basicInfo.firstMeetingDate) filledFields++;
  if (data.basicInfo.goalType) filledFields++;

  // 체성분 주요 항목 (4 fields)
  totalFields += 4;
  if (data.bodyComposition.weight > 0) filledFields++;
  if (data.bodyComposition.skeletalMuscle > 0) filledFields++;
  if (data.bodyComposition.bodyFat > 0) filledFields++;
  if (data.bodyComposition.bodyFatPercentage > 0) filledFields++;

  // 자세 평가 (3 views)
  totalFields += 3;
  if (data.postureAssessment.frontNormal || data.postureAssessment.shoulderHeightDiff || data.postureAssessment.pelvisHeightDiff) filledFields++;
  if (data.postureAssessment.backNormal || data.postureAssessment.scapulaProtrusion || data.postureAssessment.scoliosisSuspect) filledFields++;
  if (data.postureAssessment.sideNormal || data.postureAssessment.turtleNeck || data.postureAssessment.roundShoulder) filledFields++;

  // 움직임 평가 (2 main)
  totalFields += 2;
  if (data.movementAssessment.overheadSquat.depth) filledFields++;
  if (data.movementAssessment.balanceTest.leftFootTime > 0 || data.movementAssessment.balanceTest.rightFootTime > 0) filledFields++;

  // 체력 테스트 (4 categories)
  totalFields += 4;
  if (data.fitnessTest.upperBody.pushUpCount > 0 || data.fitnessTest.upperBody.plankTime > 0) filledFields++;
  if (data.fitnessTest.lowerBody.squatCount > 0) filledFields++;
  if (data.fitnessTest.cardiovascular.burpeeCount > 0 || data.fitnessTest.cardiovascular.treadmillMinutes > 0) filledFields++;
  if (data.fitnessTest.flexibility.sitAndReach !== 0 || data.fitnessTest.flexibility.shoulderFlexibility) filledFields++;

  // 운동 강도 적응도 (2 main)
  totalFields += 2;
  if (data.intensityAdaptation.averageRPE > 0) filledFields++;
  if (data.intensityAdaptation.recoverySpeed) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}
