## We:form TODO 리스트

### ✅ 완료된 작업

- [x] 프로젝트 세팅 (Next.js + Supabase + Shadcn UI)
- [x] DB 스키마 설계 및 구축 (gyms, staffs, schedules, attendance_statuses, salary_settings + RLS)
- [x] 로그인 페이지 & 권한별 리다이렉트 (`/login` → `/admin` / `/staff`)
- [x] 강사 전용 스케줄러 (`/staff`) – FullCalendar `listWeek`, 수업 등록/상태 변경 모달
- [x] n8n 자동화 연동 – Next.js API Proxy(`/api/n8n`) → n8n Webhook → 구글 시트 저장 플로우

### 🔄 진행 중인 작업

- (현재 스프린트 기준 진행 중 항목 없음 – 다음 작업 정의 시 여기에 추가)

### ⏳ 예정된 작업

- [ ] 관리자 통합 스케줄러
  - [ ] 전체 직원 스케줄 리스트/캘린더 조회
  - [ ] 직원/지점/상태별 필터링 및 검색
- [ ] 급여 규칙 설정 페이지
  - [ ] `salary_settings` CRUD UI (상태별 급여 규칙, PT/OT별 단가 등)
  - [ ] `attendance_statuses` 설정 화면 (색상/라벨/메타데이터 편집)
  - [ ] 스케줄 → 급여 계산/정산 파이프라인 설계

### 📌 참고

- 새로운 기능을 추가할 때마다:
  - [ ] RLS 정책이 충분한지 검토
  - [ ] 멀티테넌시(`gym_id`) 필터가 누락되지 않았는지 확인
  - [ ] 이 TODO 리스트와 `PROMPTS.md` 에 히스토리를 업데이트


