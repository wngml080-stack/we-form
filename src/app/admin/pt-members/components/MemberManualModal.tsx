"use client";

import { useState } from "react";
import { X, Book, FileText, Dumbbell, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Clock, Target, Activity, Users, Calendar, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SectionId = "consultation" | "ot" | "pt" | "workflow" | "tips";

interface Section {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  color: string;
}

const sections: Section[] = [
  { id: "consultation", title: "신규 회원 상담 기록지", icon: <FileText className="w-5 h-5" />, color: "blue" },
  { id: "ot", title: "OT 수업 기록지", icon: <Dumbbell className="w-5 h-5" />, color: "yellow" },
  { id: "pt", title: "PT 회원 관리 기록지", icon: <Activity className="w-5 h-5" />, color: "pink" },
  { id: "workflow", title: "회원 관리 흐름", icon: <RefreshCw className="w-5 h-5" />, color: "green" },
  { id: "tips", title: "기록 작성 팁", icon: <ClipboardList className="w-5 h-5" />, color: "purple" },
];

export function MemberManualModal({ isOpen, onClose }: Props) {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>("consultation");

  if (!isOpen) return null;

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; light: string }> = {
      blue: { bg: "bg-blue-500", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50" },
      yellow: { bg: "bg-yellow-500", text: "text-yellow-600", border: "border-yellow-200", light: "bg-yellow-50" },
      pink: { bg: "bg-pink-500", text: "text-pink-600", border: "border-pink-200", light: "bg-pink-50" },
      green: { bg: "bg-green-500", text: "text-green-600", border: "border-green-200", light: "bg-green-50" },
      purple: { bg: "bg-purple-500", text: "text-purple-600", border: "border-purple-200", light: "bg-purple-50" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-500 to-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">회원 관리 노션 매뉴얼</h2>
              <p className="text-sm text-white/80">신규/OT/PT 기록지 작성 가이드</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {sections.map((section) => {
            const colors = getColorClasses(section.color);
            const isExpanded = expandedSection === section.id;

            return (
              <div key={section.id} className={`border rounded-xl overflow-hidden ${colors.border}`}>
                {/* 섹션 헤더 */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${colors.light} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center text-white`}>
                      {section.icon}
                    </div>
                    <span className="font-semibold text-gray-800">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* 섹션 내용 */}
                {isExpanded && (
                  <div className="p-4 bg-white space-y-4">
                    {section.id === "consultation" && <ConsultationGuide />}
                    {section.id === "ot" && <OTGuide />}
                    {section.id === "pt" && <PTGuide />}
                    {section.id === "workflow" && <WorkflowGuide />}
                    {section.id === "tips" && <TipsGuide />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">마지막 업데이트: 2025년 1월</p>
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 서브섹션 컴포넌트
function SubSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-500">{icon}</span>
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  );
}

// 신규 회원 상담 기록지 가이드
function ConsultationGuide() {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-gray-600">첫 상담 시 회원의 배경 정보와 목표를 파악하기 위한 기록지입니다.</p>

      <div className="space-y-3">
        <SubSection title="1. 기본 정보" icon={<Users className="w-4 h-4" />}>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>회원명, 연락처, 담당 트레이너</li>
            <li>상담 유형 (신규/재등록/이관)</li>
            <li>최초 미팅일</li>
          </ul>
        </SubSection>

        <SubSection title="2. 방문 경로" icon={<Target className="w-4 h-4" />}>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>네이버 플레이스 / 인스타그램 / 블로그</li>
            <li>지인 소개 (소개자 이름 기록)</li>
            <li>워크인 / 기타</li>
            <li className="text-blue-600 font-medium">추가 질문: 저희 센터의 어떤 점이 마음에 드셨나요?</li>
          </ul>
        </SubSection>

        <SubSection title="3. 운동 경험" icon={<Dumbbell className="w-4 h-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">운동 유형</th>
                  <th className="border px-2 py-1 text-center">경험 여부</th>
                  <th className="border px-2 py-1 text-center">기간(개월)</th>
                </tr>
              </thead>
              <tbody>
                {["헬스장", "필라테스/요가", "1:1 PT", "홈트레이닝", "기타"].map((type) => (
                  <tr key={type}>
                    <td className="border px-2 py-1">{type}</td>
                    <td className="border px-2 py-1 text-center">-</td>
                    <td className="border px-2 py-1 text-center">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="4. 중도 포기 이유 (해당 시)" icon={<Clock className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-2">
            {["변화 없음", "관절 통증", "다이어트 실패", "자신감 부족", "시간 부족", "비용 문제", "트레이너 안 맞음"].map((reason) => (
              <span key={reason} className="px-2 py-1 bg-gray-100 rounded text-xs">{reason}</span>
            ))}
          </div>
        </SubSection>

        <SubSection title="5. 신체 기능 & 생활 습관" icon={<Activity className="w-4 h-4" />}>
          <div className="space-y-2">
            <p className="font-medium text-gray-700">통증 부위 체크</p>
            <div className="flex flex-wrap gap-2">
              {["목/어깨", "허리", "무릎/발목", "손목/팔꿈치"].map((area) => (
                <span key={area} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">{area}</span>
              ))}
            </div>
            <p className="font-medium text-gray-700 mt-2">생활 패턴</p>
            <ul className="list-disc list-inside text-gray-600 text-xs space-y-0.5">
              <li>앉아있는 시간, 수면 시간</li>
              <li>음주 횟수/량, 물 섭취량</li>
              <li>흡연 여부</li>
              <li>식사 패턴 (규칙적/불규칙/결식/야식/폭식)</li>
            </ul>
          </div>
        </SubSection>

        <SubSection title="6. 목표 설정" icon={<Target className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "다이어트", desc: "체중, 목표체중, 감량목표, 선호방법" },
              { name: "재활/체형", desc: "거북목, 라운드숄더, 골반불균형 등" },
              { name: "근력", desc: "3대운동 현재/목표 중량" },
              { name: "습관 형성", desc: "규칙적 운동, 수면, 식단 개선" },
            ].map((goal) => (
              <div key={goal.name} className="p-2 bg-gray-50 rounded">
                <p className="font-medium text-gray-800 text-xs">{goal.name}</p>
                <p className="text-gray-500 text-xs">{goal.desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="7. 운동 가능 시간" icon={<Calendar className="w-4 h-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">시간대</th>
                  {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                    <th key={day} className="border px-2 py-1">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["오전 (6-12시)", "오후 (12-18시)", "저녁 (18-22시)"].map((time) => (
                  <tr key={time}>
                    <td className="border px-2 py-1 text-xs">{time}</td>
                    {[...Array(7)].map((_, i) => (
                      <td key={i} className="border px-2 py-1 text-center">-</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-1">주당 희망 운동 횟수: __회</p>
        </SubSection>
      </div>
    </div>
  );
}

// OT 수업 기록지 가이드
function OTGuide() {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-gray-600">OT(Orientation Training) 진행 시 회원의 신체 상태를 종합적으로 평가하고 프로그램을 설계하는 기록지입니다.</p>

      <div className="space-y-3">
        <SubSection title="1. 체성분 측정 (InBody)" icon={<Activity className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-yellow-50 rounded">
              <p className="font-medium">인바디 수치</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>체중, 골격근량, 체지방량</li>
                <li>체지방률, BMI, 기초대사량</li>
                <li>내장지방레벨</li>
              </ul>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <p className="font-medium">둘레 측정</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>가슴, 허리, 엉덩이</li>
                <li>허벅지 (좌/우)</li>
                <li>팔 (좌/우)</li>
              </ul>
            </div>
          </div>
        </SubSection>

        <SubSection title="2. 자세 평가" icon={<Users className="w-4 h-4" />}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <p className="font-medium text-gray-800">정면</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>어깨 높이 차이</li>
                <li>골반 높이 차이</li>
                <li>X다리/O다리</li>
              </ul>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="font-medium text-gray-800">후면</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>견갑골 돌출</li>
                <li>척추측만 의심</li>
              </ul>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="font-medium text-gray-800">측면</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>거북목, 라운드숄더</li>
                <li>요추 전만, 골반 전방경사</li>
                <li>무릎 과신전</li>
              </ul>
            </div>
          </div>
        </SubSection>

        <SubSection title="3. 동적 움직임 스크리닝" icon={<Dumbbell className="w-4 h-4" />}>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <p className="font-medium">오버헤드 스쿼트</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {["스쿼트 깊이", "무릎 Valgus", "버트윙크", "발뒤꿈치 들림", "과도한 전방경사"].map((item) => (
                  <span key={item} className="px-1.5 py-0.5 bg-white border rounded">{item}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">밸런스 테스트</p>
                <p className="text-gray-600">외발 서기 (좌/우)</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">런지 평가</p>
                <p className="text-gray-600">좌우 비대칭 확인</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">어깨 가동성</p>
                <p className="text-gray-600">오버헤드/등뒤 손닿기</p>
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection title="4. 기초 체력 테스트" icon={<Activity className="w-4 h-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">구분</th>
                  <th className="border px-2 py-1">테스트</th>
                  <th className="border px-2 py-1">평가 기준</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1" rowSpan={2}>상체</td>
                  <td className="border px-2 py-1">푸쉬업</td>
                  <td className="border px-2 py-1">부족/정상/우수</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">플랭크</td>
                  <td className="border px-2 py-1">부족/정상/우수</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1" rowSpan={2}>하체</td>
                  <td className="border px-2 py-1">스쿼트</td>
                  <td className="border px-2 py-1">부족/정상/우수</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">월싯</td>
                  <td className="border px-2 py-1">부족/정상/우수</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">심폐</td>
                  <td className="border px-2 py-1">버피/트레드밀</td>
                  <td className="border px-2 py-1">개수/시간 기록</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">유연성</td>
                  <td className="border px-2 py-1">앉아 윗몸 굽히기</td>
                  <td className="border px-2 py-1">cm (발끝 기준 +/-)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="5. 프로그램 설계" icon={<Target className="w-4 h-4" />}>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-yellow-50 rounded">
              <p className="font-medium">SMART 목표</p>
              <ul className="list-disc list-inside text-gray-600">
                <li><strong>S</strong>pecific: 구체적 목표</li>
                <li><strong>M</strong>easurable: 측정 지표</li>
                <li><strong>A</strong>chievable: 달성 가능성</li>
                <li><strong>R</strong>elevant: 목표 연관성</li>
                <li><strong>T</strong>ime-bound: 4주/8주/12주 목표</li>
              </ul>
            </div>
            <div className="p-2 bg-yellow-50 rounded">
              <p className="font-medium">12주 로드맵</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>Phase 1 (1-4주): 기초 형성기</li>
                <li>Phase 2 (5-8주): 강화기</li>
                <li>Phase 3 (9-12주): 최적화기</li>
              </ul>
            </div>
          </div>
        </SubSection>

        <SubSection title="6. OT 완료 체크리스트" icon={<CheckCircle2 className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[
              "인바디 측정 완료",
              "둘레 측정 완료",
              "비포 사진 촬영 완료",
              "움직임 스크리닝 완료",
              "체력 테스트 완료",
              "목표 합의 완료",
              "로드맵 설명 완료",
              "센터 안내 완료",
              "다음 수업 예약",
              "숙제 부여",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded">
                <CheckCircle2 className="w-3 h-3 text-gray-400" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </div>
    </div>
  );
}

// PT 회원 관리 기록지 가이드
function PTGuide() {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-gray-600">정규 PT 회원의 진행 상황을 지속적으로 관리하는 기록지입니다.</p>

      <div className="space-y-3">
        <SubSection title="1. 기본 정보" icon={<Users className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>회원명, 연락처</li>
              <li>담당 트레이너</li>
              <li>최초 미팅일</li>
            </ul>
            <div className="p-2 bg-pink-50 rounded">
              <p className="font-medium text-gray-800">목표 유형 (다중 선택)</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {["다이어트", "재활/체형", "근력", "체력증진", "기타"].map((goal) => (
                  <span key={goal} className="px-1.5 py-0.5 bg-white border rounded text-xs">{goal}</span>
                ))}
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection title="2. 회원 등록 정보" icon={<Calendar className="w-4 h-4" />}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-pink-50 rounded text-center">
              <p className="font-medium">총 세션 수</p>
              <p className="text-gray-600">__회</p>
            </div>
            <div className="p-2 bg-pink-50 rounded text-center">
              <p className="font-medium">잔여 세션 수</p>
              <p className="text-gray-600">__회</p>
            </div>
            <div className="p-2 bg-pink-50 rounded text-center">
              <p className="font-medium">만료일</p>
              <p className="text-gray-600">YYYY-MM-DD</p>
            </div>
          </div>
          <p className="text-xs text-pink-600 mt-2 font-medium">* 잔여 세션이 10회 이하일 때 재등록 상담 권장</p>
        </SubSection>

        <SubSection title="3. 처음 만난 날 측정" icon={<Activity className="w-4 h-4" />}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <p className="font-medium">인바디</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>체중, 골격근량</li>
                <li>체지방량, 체지방률</li>
                <li>BMI, 기초대사량</li>
              </ul>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="font-medium">둘레 측정</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>가슴, 허리, 엉덩이</li>
                <li>허벅지 (좌/우)</li>
              </ul>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <p className="font-medium">기초 체력</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>푸쉬업 (__개)</li>
                <li>플랭크 (__초)</li>
                <li>스쿼트 (__개)</li>
              </ul>
            </div>
          </div>
        </SubSection>

        <SubSection title="4. 세션 상세 기록" icon={<ClipboardList className="w-4 h-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">회차</th>
                  <th className="border px-2 py-1">날짜</th>
                  <th className="border px-2 py-1">운동 내용</th>
                  <th className="border px-2 py-1">트레이너 메모</th>
                  <th className="border px-2 py-1">회원 피드백</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1 text-center">1</td>
                  <td className="border px-2 py-1">2025-01-02</td>
                  <td className="border px-2 py-1">하체 + 코어</td>
                  <td className="border px-2 py-1">스쿼트 폼 안정적</td>
                  <td className="border px-2 py-1">허벅지 뻐근함</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1 text-center">2</td>
                  <td className="border px-2 py-1">2025-01-04</td>
                  <td className="border px-2 py-1">상체 + 유산소</td>
                  <td className="border px-2 py-1">푸쉬업 개수 증가</td>
                  <td className="border px-2 py-1">어깨 불편감 없음</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="5. 비포 사진" icon={<FileText className="w-4 h-4" />}>
          <div className="p-2 bg-pink-50 rounded text-xs">
            <p className="font-medium text-gray-800 mb-1">촬영 권장 시점</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white rounded border">OT 완료 후</span>
              <span className="px-2 py-1 bg-white rounded border">4주마다</span>
              <span className="px-2 py-1 bg-white rounded border">PT 종료 시</span>
            </div>
            <p className="text-gray-600 mt-2">* 동일 장소, 조명, 포즈로 촬영하여 비교 용이하게</p>
          </div>
        </SubSection>
      </div>
    </div>
  );
}

// 회원 관리 흐름 가이드
function WorkflowGuide() {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-gray-600">회원 여정별 기록지 사용 흐름입니다.</p>

      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">신규 상담</div>
          <span className="text-gray-400">→</span>
          <div className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium">OT 진행</div>
          <span className="text-gray-400">→</span>
          <div className="px-3 py-2 bg-pink-100 text-pink-700 rounded-lg font-medium">PT 관리</div>
          <span className="text-gray-400">→</span>
          <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">재등록/만료</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">단계</th>
              <th className="border px-3 py-2 text-left">사용 기록지</th>
              <th className="border px-3 py-2 text-left">주요 기록 내용</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-3 py-2 font-medium">신규 상담</td>
              <td className="border px-3 py-2">상담 기록지</td>
              <td className="border px-3 py-2">회원 정보, 목표, 운동 경험, 가용 시간</td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">OT 진행</td>
              <td className="border px-3 py-2">OT 기록지</td>
              <td className="border px-3 py-2">체성분, 자세/움직임 평가, 프로그램 설계</td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">PT 시작</td>
              <td className="border px-3 py-2">PT 기록지</td>
              <td className="border px-3 py-2">세션별 기록, 진척도 관리</td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-medium">재등록/재측정</td>
              <td className="border px-3 py-2">인바디 업데이트</td>
              <td className="border px-3 py-2">변화 비교 분석</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-green-50 rounded-lg">
        <p className="font-medium text-green-800 text-sm mb-2">권장 측정 주기</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between p-2 bg-white rounded">
            <span>세션 기록</span>
            <span className="font-medium text-green-600">매 PT 후 (당일)</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span>인바디 측정</span>
            <span className="font-medium text-green-600">4주마다</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span>둘레 측정</span>
            <span className="font-medium text-green-600">4주마다</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span>비포/애프터 사진</span>
            <span className="font-medium text-green-600">4주마다</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span>체력 테스트</span>
            <span className="font-medium text-green-600">8주마다</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 기록 작성 팁 가이드
function TipsGuide() {
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="font-medium text-blue-800 mb-1">상담 기록지 작성 팁</p>
          <ul className="list-disc list-inside text-blue-700 text-xs space-y-0.5">
            <li>회원의 말을 최대한 그대로 기록하여 니즈 정확히 파악</li>
            <li>중도 포기 이유는 솔직한 답변을 유도하여 리텐션 전략 수립</li>
            <li>목표 설정 시 회원과 충분한 대화를 통해 현실적인 목표 합의</li>
          </ul>
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="font-medium text-yellow-800 mb-1">OT 기록지 작성 팁</p>
          <ul className="list-disc list-inside text-yellow-700 text-xs space-y-0.5">
            <li>숫자는 정확하게, 평가는 근거와 함께 기록</li>
            <li>자세/움직임 이상 발견 시 사진으로 기록하여 변화 추적</li>
            <li>OT 완료 체크리스트를 빠짐없이 확인</li>
          </ul>
        </div>

        <div className="p-3 bg-pink-50 rounded-lg">
          <p className="font-medium text-pink-800 mb-1">PT 기록지 작성 팁</p>
          <ul className="list-disc list-inside text-pink-700 text-xs space-y-0.5">
            <li>매 세션 즉시 기록하여 누락 방지</li>
            <li>회원 피드백은 긍정/부정 모두 솔직하게 기록</li>
            <li>다음 세션 계획을 미리 메모하여 준비</li>
          </ul>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="font-medium text-purple-800 mb-1">자주 묻는 질문 (FAQ)</p>
          <div className="space-y-2 text-xs">
            <div>
              <p className="font-medium text-gray-800">Q. 기록지를 저장하지 않고 나가면?</p>
              <p className="text-gray-600">A. 자동 저장되지 않으므로 반드시 저장 버튼을 클릭하세요.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Q. OT 없이 바로 PT를 시작하는 회원은?</p>
              <p className="text-gray-600">A. PT 기록지에서 처음 만난 날 측정 섹션에 기본 측정값을 기록합니다.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Q. 트레이너가 변경되면?</p>
              <p className="text-gray-600">A. 담당 트레이너를 변경하고, 인수인계 내용을 댓글에 기록합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
