// PT 회원 관리 양식 타입 정의

// 기본 정보
export interface PTBasicInfo {
  memberName: string;
  phoneNumber: string;
  assignedTrainer: string;
  firstMeetingDate: string;
  memberType: string; // PT, 그룹 등
  goalTypes: string[]; // 다중 선택: 다이어트, 재활/체형, 근력, 체력증진, 기타
}

// 회원 등록 정보
export interface PTRegistrationInfo {
  totalSessions: number;
  remainingSessions: number;
  expiryDate: string;
}

// 인바디 측정
export interface PTInBodyMeasurement {
  weight: number;
  skeletalMuscle: number;
  bodyFat: number;
  bodyFatPercentage: number;
  bmi: number;
  basalMetabolicRate: number;
}

// 둘레 측정
export interface PTCircumferenceMeasurement {
  chest: number;
  waist: number;
  hip: number;
  thighLeft: number;
  thighRight: number;
}

// 기초 체력
export interface PTBasicFitness {
  pushUpCount: number;
  plankTime: number; // 초
  squatCount: number;
  squatNote: string; // 예: 맨몸, 바벨 등
}

// 세션 기록
export interface PTSessionRecord {
  id: string;
  date: string;
  sessionNumber: number;
  exerciseContent: string;
  trainerNote: string;
  memberFeedback: string;
}

// 비포 사진
export interface PTBeforePhoto {
  id: string;
  date: string;
  photoUrl: string;
  note: string;
}

// 전체 PT 폼 데이터
export interface PTFormData {
  // 기본 정보
  basicInfo: PTBasicInfo;

  // 회원 등록 정보
  registrationInfo: PTRegistrationInfo;

  // 처음 만난 날 측정
  initialInBody: PTInBodyMeasurement;
  initialCircumference: PTCircumferenceMeasurement;
  initialFitness: PTBasicFitness;

  // 세션 기록
  sessionRecords: PTSessionRecord[];

  // 비포 사진
  beforePhotos: PTBeforePhoto[];

  // 댓글
  comments: string;
}

export const initialPTFormData: PTFormData = {
  basicInfo: {
    memberName: "",
    phoneNumber: "",
    assignedTrainer: "",
    firstMeetingDate: "",
    memberType: "PT",
    goalTypes: [],
  },

  registrationInfo: {
    totalSessions: 0,
    remainingSessions: 0,
    expiryDate: "",
  },

  initialInBody: {
    weight: 0,
    skeletalMuscle: 0,
    bodyFat: 0,
    bodyFatPercentage: 0,
    bmi: 0,
    basalMetabolicRate: 0,
  },

  initialCircumference: {
    chest: 0,
    waist: 0,
    hip: 0,
    thighLeft: 0,
    thighRight: 0,
  },

  initialFitness: {
    pushUpCount: 0,
    plankTime: 0,
    squatCount: 0,
    squatNote: "맨몸",
  },

  sessionRecords: [],

  beforePhotos: [],

  comments: "",
};

// 목표 유형 옵션
export const goalTypeOptions = [
  { value: "다이어트", label: "다이어트", color: "bg-yellow-100 text-yellow-800" },
  { value: "재활/체형", label: "재활/체형", color: "bg-purple-100 text-purple-800" },
  { value: "근력", label: "근력", color: "bg-orange-100 text-orange-800" },
  { value: "체력증진", label: "체력증진", color: "bg-green-100 text-green-800" },
  { value: "기타", label: "기타", color: "bg-gray-100 text-gray-800" },
];

// 완료율 계산 함수
export function calculatePTFormCompletion(data: PTFormData): number {
  let filledFields = 0;
  let totalFields = 0;

  // 기본 정보 (5 fields)
  totalFields += 5;
  if (data.basicInfo.memberName) filledFields++;
  if (data.basicInfo.phoneNumber) filledFields++;
  if (data.basicInfo.assignedTrainer) filledFields++;
  if (data.basicInfo.firstMeetingDate) filledFields++;
  if (data.basicInfo.goalTypes.length > 0) filledFields++;

  // 등록 정보 (3 fields)
  totalFields += 3;
  if (data.registrationInfo.totalSessions > 0) filledFields++;
  if (data.registrationInfo.remainingSessions > 0) filledFields++;
  if (data.registrationInfo.expiryDate) filledFields++;

  // 인바디 측정 (4 주요 항목)
  totalFields += 4;
  if (data.initialInBody.weight > 0) filledFields++;
  if (data.initialInBody.skeletalMuscle > 0) filledFields++;
  if (data.initialInBody.bodyFat > 0) filledFields++;
  if (data.initialInBody.bodyFatPercentage > 0) filledFields++;

  // 둘레 측정 (3 주요 항목)
  totalFields += 3;
  if (data.initialCircumference.waist > 0) filledFields++;
  if (data.initialCircumference.hip > 0) filledFields++;
  if (data.initialCircumference.thighLeft > 0 || data.initialCircumference.thighRight > 0) filledFields++;

  // 기초 체력 (3 항목)
  totalFields += 3;
  if (data.initialFitness.pushUpCount > 0) filledFields++;
  if (data.initialFitness.plankTime > 0) filledFields++;
  if (data.initialFitness.squatCount > 0) filledFields++;

  return Math.round((filledFields / totalFields) * 100);
}
