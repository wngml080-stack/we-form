## We:form TODO 리스트

### ✅ 완료된 작업

- [x] DB 스키마 설계 및 생성 (gyms, staffs, schedules, attendance_statuses, salary_settings)
- [x] Supabase RLS 정책 적용 (멀티테넌시, 역할 기반 접근 제어)
- [x] 초기 브랜드/디자인 시스템 정의 (Deep Teal & Electric Lime, Shadcn UI 세팅)
- [x] 로그인 페이지 구현 (`/login`) – Supabase Auth 연동, role 기반 라우팅(`/admin`, `/staff`)
- [x] 관리자 페이지 기본 레이아웃 (`/admin`) – 사이드바 + 대시보드 헤더 + 로그아웃
- [x] 강사 페이지 기본 레이아웃 (`/staff`) – 모바일 카드 레이아웃 + 로그아웃

### 🔄 진행 중인 작업

- [ ] 강사 스케줄러 구현 (FullCalendar `listWeek` 뷰)
  - [x] FullCalendar 및 플러그인 설치 (`daygrid`, `timegrid`, `interaction`, `list`)
  - [x] 내 스케줄 조회 (Supabase `schedules` + `staffs` 조인 로직)
  - [x] 수업 추가 모달 (회원명, 시간, 타입 PT/OT 입력 후 `schedules` insert)
  - [x] 상태 변경 모달 (completed / no_show_deducted / no_show / service)
  - [ ] FullCalendar 스타일링 다듬기 (브랜드 컬러, 타이포그래피, 빈 상태 UX)
  - [ ] 현재 달 제한 로직 검증 (과거/미래 스케줄 생성/수정 제약 테스트)

### ⏳ 예정된 작업

- [ ] 관리자 급여 설정 기능
  - [ ] `salary_settings` CRUD UI (상태별 급여 규칙, PT/OT별 단가 등)
  - [ ] `attendance_statuses` 설정 화면 (색상/라벨/메타데이터 편집)
  - [ ] 스케줄 → 급여 계산 파이프라인 설계
- [ ] n8n 연동
  - [ ] Webhook/API 구조 설계 (스케줄 확정/정산 시 이벤트 발행)
  - [ ] n8n 플로우 템플릿 정의 (알림, 리포트, 외부 시스템 연동)
- [ ] 구글 시트 백업
  - [ ] 주요 테이블(`schedules`, `salary_settings`, `attendance_statuses`) 백업 구조 설계
  - [ ] Google Sheets API 또는 n8n + 구글 시트 연동 방식 결정
  - [ ] 정기 백업/복원 시나리오 문서화

### 📌 참고

- 새로운 기능을 추가할 때마다:
  - [ ] RLS 정책이 충분한지 검토
  - [ ] 멀티테넌시(`gym_id`) 필터가 누락되지 않았는지 확인
  - [ ] 이 TODO 리스트와 `PROMPTS.md` 에 히스토리를 업데이트


