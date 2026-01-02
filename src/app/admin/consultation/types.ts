// 상담기록지 양식 타입 정의

export interface VisitSource {
  naverPlace: boolean;
  instagram: boolean;
  blog: boolean;
  referral: boolean;
  referralName: string;
  walkIn: boolean;
  other: boolean;
  otherText: string;
  attractionReason: string;
}

export interface ExerciseExperience {
  type: string;
  hasExperience: boolean;
  months: number;
}

export interface DropoutReason {
  noChange: boolean;
  jointPain: boolean;
  dietFailure: boolean;
  noConfidence: boolean;
  noTime: boolean;
  costIssue: boolean;
  trainerMismatch: boolean;
  other: boolean;
  otherText: string;
}

export interface PainArea {
  area: string;
  hasIssue: boolean;
  intensity: number; // 1-5
  diagnosis: string;
}

export interface MedicalHistory {
  hasHistory: boolean;
  diagnosisName: string;
}

export interface CurrentTreatment {
  none: boolean;
  physicalTherapy: boolean;
  manualTherapy: boolean;
  medication: boolean;
  other: boolean;
  otherText: string;
}

export interface LifestylePattern {
  sittingHours: number;
  sleepHours: number;
  drinkingPerWeek: number;
  drinksPerSession: number;
  waterIntake: number;
  smoking: "non" | "smoker";
  smokingAmount: number;
}

export interface MealPattern {
  regular: boolean;
  irregular: boolean;
  skipping: boolean;
  lateNight: boolean;
  binge: boolean;
}

export interface DietGoal {
  selected: boolean;
  currentWeight: number;
  targetWeight: number;
  lossTarget: number;
  targetDate: string;
  pastAttempts: number;
  lightestWeight: number;
  lightestWeightYearsAgo: number;
  preference: "exercise" | "diet" | "both";
}

export interface RehabGoal {
  selected: boolean;
  issues: {
    turtleNeck: boolean;
    roundShoulder: boolean;
    discHernia: boolean;
    pelvicImbalance: boolean;
    scoliosis: boolean;
    kneePain: boolean;
    other: boolean;
    otherText: string;
  };
  hasMedicalDiagnosis: boolean;
  diagnosisName: string;
  dailyLifeImpact: number; // 1-5
  expectation: string;
}

export interface StrengthGoal {
  selected: boolean;
  subGoals: {
    overallFitness: boolean;
    bodyProfile: boolean;
    bigThree: boolean;
    bulkUp: boolean;
    sportsPerformance: boolean;
    other: boolean;
    otherText: string;
  };
  currentSquat: number;
  targetSquat: number;
  currentBench: number;
  targetBench: number;
  currentDeadlift: number;
  targetDeadlift: number;
  exerciseYears: number;
}

export interface HabitGoal {
  selected: boolean;
  subGoals: {
    regularExercise: boolean;
    betterSleep: boolean;
    healthyDiet: boolean;
    stressManagement: boolean;
    postureCorrection: boolean;
    other: boolean;
    otherText: string;
  };
  currentHabit: string;
  targetHabit: string;
}

export interface OtherGoal {
  selected: boolean;
  description: string;
}

export interface GoalMotivation {
  hasEvent: boolean;
  eventDate: string;
  healthWarning: boolean;
  selfEsteem: boolean;
  severePain: boolean;
  lowStamina: boolean;
  other: boolean;
  otherText: string;
  specificReason: string;
}

export interface AvailableTime {
  morning: boolean[]; // 월~일
  afternoon: boolean[];
  evening: boolean[];
  preferredWeeklyCount: number;
}

export interface ConsultationFormData {
  // 기본 정보
  memberName: string;
  phoneNumber: string;
  assignedTrainer: string;
  consultationType: string;
  firstMeetingDate: string;

  // 1. 방문 경로
  visitSource: VisitSource;

  // 2. 운동 경험
  exerciseExperiences: ExerciseExperience[];
  dropoutReasons: DropoutReason;
  trainerMemo: string;

  // 3. 신체 기능 & 생활 습관
  painAreas: PainArea[];
  medicalHistory: MedicalHistory;
  currentTreatment: CurrentTreatment;
  lifestylePattern: LifestylePattern;
  mealPattern: MealPattern;

  // 4. 목표 설정
  dietGoal: DietGoal;
  rehabGoal: RehabGoal;
  strengthGoal: StrengthGoal;
  habitGoal: HabitGoal;
  otherGoal: OtherGoal;
  goalMotivation: GoalMotivation;

  // 5. 운동 가능 시간
  availableTime: AvailableTime;
}

export const initialFormData: ConsultationFormData = {
  memberName: "",
  phoneNumber: "",
  assignedTrainer: "",
  consultationType: "신규",
  firstMeetingDate: "",

  visitSource: {
    naverPlace: false,
    instagram: false,
    blog: false,
    referral: false,
    referralName: "",
    walkIn: false,
    other: false,
    otherText: "",
    attractionReason: "",
  },

  exerciseExperiences: [
    { type: "헬스장", hasExperience: false, months: 0 },
    { type: "필라테스/요가", hasExperience: false, months: 0 },
    { type: "1:1 PT", hasExperience: false, months: 0 },
    { type: "홈트레이닝", hasExperience: false, months: 0 },
    { type: "기타", hasExperience: false, months: 0 },
    { type: "운동 경험 없음", hasExperience: false, months: 0 },
  ],

  dropoutReasons: {
    noChange: false,
    jointPain: false,
    dietFailure: false,
    noConfidence: false,
    noTime: false,
    costIssue: false,
    trainerMismatch: false,
    other: false,
    otherText: "",
  },

  trainerMemo: "",

  painAreas: [
    { area: "목/어깨 (승모근, 두통)", hasIssue: false, intensity: 0, diagnosis: "" },
    { area: "허리 (디스크, 골반 틀어짐)", hasIssue: false, intensity: 0, diagnosis: "" },
    { area: "무릎/발목 (소리, 통증)", hasIssue: false, intensity: 0, diagnosis: "" },
    { area: "손목/팔꿈치", hasIssue: false, intensity: 0, diagnosis: "" },
    { area: "기타", hasIssue: false, intensity: 0, diagnosis: "" },
  ],

  medicalHistory: {
    hasHistory: false,
    diagnosisName: "",
  },

  currentTreatment: {
    none: true,
    physicalTherapy: false,
    manualTherapy: false,
    medication: false,
    other: false,
    otherText: "",
  },

  lifestylePattern: {
    sittingHours: 0,
    sleepHours: 0,
    drinkingPerWeek: 0,
    drinksPerSession: 0,
    waterIntake: 0,
    smoking: "non",
    smokingAmount: 0,
  },

  mealPattern: {
    regular: false,
    irregular: false,
    skipping: false,
    lateNight: false,
    binge: false,
  },

  dietGoal: {
    selected: false,
    currentWeight: 0,
    targetWeight: 0,
    lossTarget: 0,
    targetDate: "",
    pastAttempts: 0,
    lightestWeight: 0,
    lightestWeightYearsAgo: 0,
    preference: "both",
  },

  rehabGoal: {
    selected: false,
    issues: {
      turtleNeck: false,
      roundShoulder: false,
      discHernia: false,
      pelvicImbalance: false,
      scoliosis: false,
      kneePain: false,
      other: false,
      otherText: "",
    },
    hasMedicalDiagnosis: false,
    diagnosisName: "",
    dailyLifeImpact: 0,
    expectation: "",
  },

  strengthGoal: {
    selected: false,
    subGoals: {
      overallFitness: false,
      bodyProfile: false,
      bigThree: false,
      bulkUp: false,
      sportsPerformance: false,
      other: false,
      otherText: "",
    },
    currentSquat: 0,
    targetSquat: 0,
    currentBench: 0,
    targetBench: 0,
    currentDeadlift: 0,
    targetDeadlift: 0,
    exerciseYears: 0,
  },

  habitGoal: {
    selected: false,
    subGoals: {
      regularExercise: false,
      betterSleep: false,
      healthyDiet: false,
      stressManagement: false,
      postureCorrection: false,
      other: false,
      otherText: "",
    },
    currentHabit: "",
    targetHabit: "",
  },

  otherGoal: {
    selected: false,
    description: "",
  },

  goalMotivation: {
    hasEvent: false,
    eventDate: "",
    healthWarning: false,
    selfEsteem: false,
    severePain: false,
    lowStamina: false,
    other: false,
    otherText: "",
    specificReason: "",
  },

  availableTime: {
    morning: [false, false, false, false, false, false, false],
    afternoon: [false, false, false, false, false, false, false],
    evening: [false, false, false, false, false, false, false],
    preferredWeeklyCount: 0,
  },
};
