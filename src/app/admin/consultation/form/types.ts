export interface ConsultationFormData {
  // 기본 정보
  name: string;
  phone: string;
  gender: string;
  birthDate: string;

  // 방문 경로
  visitSource: string;
  visitSourceDetail: string;

  // 운동 경험
  exerciseExperience: string;
  exerciseTypes: string[];
  exerciseFrequency: string;

  // 신체 기능 & 생활 습관
  healthConditions: string[];
  painAreas: string[];
  sleepQuality: string;
  stressLevel: string;

  // 목표 설정
  primaryGoal: string;
  secondaryGoals: string[];
  targetPeriod: string;

  // 운동 가능 시간
  availableDays: string[];
  preferredTime: string;
  sessionDuration: string;
}

export const initialFormData: ConsultationFormData = {
  name: "",
  phone: "",
  gender: "",
  birthDate: "",
  visitSource: "",
  visitSourceDetail: "",
  exerciseExperience: "",
  exerciseTypes: [],
  exerciseFrequency: "",
  healthConditions: [],
  painAreas: [],
  sleepQuality: "",
  stressLevel: "",
  primaryGoal: "",
  secondaryGoals: [],
  targetPeriod: "",
  availableDays: [],
  preferredTime: "",
  sessionDuration: "",
};
