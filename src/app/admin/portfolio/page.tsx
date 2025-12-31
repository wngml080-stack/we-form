"use client";

import { useState } from "react";
import { AboutMeSection } from "./components/AboutMeSection";
import { RecommendationSection } from "./components/RecommendationSection";
import { TaglineSection } from "./components/TaglineSection";
import { BeforeAfterSection } from "./components/BeforeAfterSection";
import { MembersBoardSection } from "./components/MembersBoardSection";

// 임시 데이터 (나중에 DB에서 가져올 예정)
const mockTrainerData = {
  name: "OOO",
  gymType: "BOUTIQUE GYM",
  career: [
    "전 ) 센스짐 트레이너",
    "전 ) 엔오짐 트레이너",
    "전 ) 부티크짐 병점점 트레이너",
    "현 ) 부티크짐 정자점 트레이너",
  ],
  licenses: [
    "NSCA 영양코치 Lv.2 (상급)",
    "운동처방사 1급",
    "카이로프랙틱 고급과정 수료",
    "WTS 웨이트 트레이닝 수료",
    "응급처치 및 심폐소생술 수료",
    "IFBB Pro 트레이너 자격",
    "IASTM 근막이완 컨디셔닝 수료",
  ],
  contact: "010-0000-0000",
  instagram: "",
  blog: "블로그 바로가기",
  location: "OOO 피트니스 센터",
  certifications: [
    { title: "생활스포츠지도사 2급 (보디빌딩)", icon: "trophy" },
    { title: "", icon: "trophy" },
    { title: "", icon: "trophy" },
    { title: "", icon: "trophy" },
  ],
  careerHistory: [
    { period: "2015 ~ 현재", content: "OOO 피트니스 센터 대표 트레이너 (10년)" },
    { period: "2018 ~ 현재", content: "OOO 피트니스 아카데미 강사" },
    { period: "2016 ~ 2020", content: "연예인 및 전문 운동선수 PT 담당" },
    { period: "2016 ~ 2020", content: "연예인 및 전문 운동선수 PT 담당" },
    { period: "2016 ~ 2020", content: "연예인 및 전문 운동선수 PT 담당" },
    { period: "2016 ~ 2020", content: "연예인 및 전문 운동선수 PT 담당" },
  ],
  recommendations: [
    { id: "1", label: "운동해도 효과가 없었던 분", checked: false },
    { id: "2", label: "다이어트 요요가 반복되는 분", checked: false },
    { id: "3", label: "체형 불균형이 고민인 분", checked: false },
  ],
  tagline: {
    main: '"안전하게, 정확하게, 당신에게 맞게"',
    sub: "10년간 10,000시간의 PT 경험으로\n당신만을 위한 운동을 설계합니다.",
    tip: "상담 시 목표와 상황에 맞는 프로그램을 추천드려요!",
  },
  specialties: [
    "여성전문 다이어트",
    "라이프스타일개선",
    "체질,체력개선",
    "선수육성",
  ],
  beforeAfterReviews: [
    {
      id: "1",
      goal: "결혼 전 다이어트",
      result: "체중 -8kg, 체지방률 -7%",
      review: "출근 전 아침 PT로 12주 동안 8kg을 뺐어요! 무리한 식단 없이 운동만으로 이렇게 바뀔 수 있다니 신기해요.\n특히 생리주기에 맞춰서 운동 강도를 조절해주시는 게 너무 좋았어요. 컨디션 안 좋은 날도 억지로 하는 게 아니라 그날에 맞는 운동을 해주셔서 지치지 않고 꾸준히 할 수 있었어요.\n웨딩드레스 입을 때 자신감 생겼어요! 감사합니다 💕",
      memberInfo: "김OO님 (30대/직장인/12주)",
    },
    {
      id: "2",
      goal: "거북목 & 골반 교정",
      result: "체중 -3kg, 거북목/골반 개선",
      review: "오래 앉아서 일하다 보니 거북목이 심했는데, 8주 만에 많이 개선됐어요. 필라테스와 웨이트 트레이닝을 병행하면서 자세도 좋아지고 어깨 통증도 사라졌어요!",
      memberInfo: "이○○님 (20대/대학생/8주)",
    },
  ],
};

export default function PortfolioPage() {
  const [trainerData, setTrainerData] = useState(mockTrainerData);
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [beforeAfterReviews, setBeforeAfterReviews] = useState(mockTrainerData.beforeAfterReviews);

  const handleAboutMeUpdate = (data: {
    contact: string;
    instagram: string;
    blog: string;
    location: string;
    certifications: Array<{ title: string; icon: string }>;
    specialties: string[];
    careerHistory: Array<{ period: string; content: string }>;
  }) => {
    setTrainerData({
      ...trainerData,
      contact: data.contact,
      instagram: data.instagram,
      blog: data.blog,
      location: data.location,
      certifications: data.certifications,
      specialties: data.specialties,
      careerHistory: data.careerHistory,
    });
  };

  const handleRecommendationsUpdate = (recommendations: Array<{ id: string; label: string; checked: boolean }>) => {
    setTrainerData({
      ...trainerData,
      recommendations,
    });
  };

  const handleTaglineUpdate = (tagline: { main: string; sub: string; tip: string }) => {
    setTrainerData({
      ...trainerData,
      tagline,
    });
  };

  const handleBeforeAfterUpdate = (reviews: Array<{
    id: string;
    goal: string;
    result: string;
    review: string;
    memberInfo: string;
    beforeImage?: string;
    afterImage?: string;
  }>) => {
    setBeforeAfterReviews(reviews);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">포트폴리오</h1>
      </div>

      {/* 메인 컨텐츠 */}
      <AboutMeSection
        name={trainerData.name}
        contact={trainerData.contact}
        instagram={trainerData.instagram}
        blog={trainerData.blog}
        location={trainerData.location}
        certifications={trainerData.certifications}
        specialties={trainerData.specialties}
        careerHistory={trainerData.careerHistory}
        imageUrl={profileImage}
        onImageChange={setProfileImage}
        onUpdate={handleAboutMeUpdate}
      />

      {/* 하단 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationSection 
          recommendations={trainerData.recommendations}
          onUpdate={handleRecommendationsUpdate}
        />
        <TaglineSection 
          tagline={trainerData.tagline}
          onUpdate={handleTaglineUpdate}
        />
      </div>

      {/* Before/After 후기 섹션 */}
      <BeforeAfterSection
        reviews={beforeAfterReviews}
        onUpdate={handleBeforeAfterUpdate}
      />

      {/* 관리중인 회원 리스트 보드 */}
      <MembersBoardSection />
    </div>
  );
}
