## PROMPTS 로그

We:form 프로젝트에서 사용한 주요 프롬프트와 개발 히스토리를 기록하는 문서입니다.  
날짜별로 정리하고, 이후에 같은 패턴의 작업을 다시 할 때 참고용으로 사용합니다.

---

## 2025-11-19

### 1. 로그인 구현 프롬프트

- **요약**
  - Supabase Auth를 사용해 이메일/비밀번호 기반 로그인 구현.
  - 로그인 성공 후 `staffs` 테이블에서 `role` 조회 → `admin` 은 `/admin`, `staff` 는 `/staff` 로 라우팅.
  - Shadcn Card를 활용한 브랜딩된 로그인 페이지(UI: Deep Teal 배경, Lime 버튼).
- **관련 파일**
  - `src/app/login/page.tsx`
- **핵심 요구사항 (발췌)**
  - We:form 로고 텍스트를 카드 상단에 크게 노출.
  - 로그인 버튼은 Electric Lime(#E0FB4A) + 검정 굵은 텍스트.
  - Supabase `createBrowserClient` 사용.
  - 로그인 성공 후 `staffs.role` 에 따라 `/admin` / `/staff` 로 이동.

```text
프롬프트 키워드:
- Supabase SQL Editor에 붙여넣을 쿼리
- 로그인 페이지 디자인 (Deep Teal 배경, Shadcn Card)
- Supabase Auth(createBrowserClient) 이메일/비번 로그인
- role에 따른 /admin, /staff 라우팅
```

---

### 2. 스케줄러 구현 프롬프트 (강사 페이지)

- **요약**
  - `/staff` 페이지에 FullCalendar 기반 스케줄러 구현.
  - 초기 뷰: `listWeek` (모바일에서 보기 좋은 주간 리스트).
  - 일정 조회: Supabase `schedules` 테이블에서 내 스케줄(staff_id/user_id 기준) 불러오기.
  - 일정 추가: 날짜 클릭 또는 “수업 추가” 버튼 → 모달에서 회원명/시간/타입(PT/OT) 입력 후 저장.
  - 상태 변경: 이벤트 클릭 시 상태 변경 모달 → 4개 버튼으로 상태를 `completed`, `no_show_deducted`, `no_show`, `service` 로 업데이트.
- **관련 파일**
  - `src/app/staff/page.tsx`
- **핵심 요구사항 (발췌)**
  - FullCalendar 플러그인: `daygrid`, `timegrid`, `interaction`, `list`.
  - initialView는 `listWeek`, headerToolbar는 `prev,next today | title`.
  - 브랜드 컬러 Deep Teal을 헤더 배경/강조색으로 사용.
  - 상태별 색깔: 출석완료(초록/Lime), 노쇼차감(빨강), 단순노쇼(회색), 서비스(파랑).

```text
프롬프트 키워드:
- FullCalendar listWeek 모바일 우선 스케줄러
- Supabase schedules에서 내 스케줄 조회
- 날짜 클릭 → 수업 추가 모달
- 이벤트 클릭 → 상태 변경 모달 (completed / no_show_deducted / no_show / service)
```

---

### 3. 강사 스케줄러 구현 (FAB 버튼 포함)

- **요약**
  - 강사용 `/staff` 페이지에 모바일 친화적인 FullCalendar UI를 구현하고, 우측 하단 FAB 버튼으로 수업 추가 플로우를 설계.
  - `listWeek` 뷰를 기본으로 사용하고, timeGrid/dayGrid 전환 버튼과 함께 헤더를 단순화.
  - 수업 등록 모달에서 날짜/시간/진행 시간/수업 종류(PT/OT 등)를 입력 받아 `schedules` 테이블에 저장.
- **관련 파일**
  - `src/app/staff/page.tsx`
- **핵심 요구사항 (발췌)**
  - 헤더: `left: "prev,next", center: "title", right: "timeGridDay,listWeek,dayGridMonth"`.
  - FAB 버튼: 오른쪽 하단 고정, 브랜드 Lime 컬러, 클릭 시 수업 등록 모달 열기.
  - 진행 시간(30/50/60분)에 따라 종료 시간을 자동 계산해 `start_time`/`end_time` 으로 저장.

```text
프롬프트 키워드:
- 모바일 listWeek + FAB 스케줄러
- FullCalendar headerToolbar 커스텀
- 수업 등록 모달 (날짜/시간/진행 시간/수업 종류)
- Supabase schedules.insert 후 캘린더 리프레시
```

---

### 4. n8n API Proxy 생성 프롬프트

- **요약**
  - Next.js App Router 기반의 `/api/n8n` 엔드포인트를 만들어, 클라이언트→Next.js→n8n Webhook 구조의 프록시를 구현.
  - CORS 문제를 피하기 위해 브라우저에서 n8n을 직접 호출하지 않고, 서버 라우트를 반드시 경유하도록 설계.
  - 에러 발생 시 서버 로그에만 남기고, 클라이언트에는 간단한 JSON 상태만 반환.
- **관련 파일**
  - `src/app/api/n8n/route.ts`
  - `src/app/staff/page.tsx` (수업 등록 성공 후 `/api/n8n` 호출)
- **핵심 요구사항 (발췌)**
  - `POST` 요청의 body를 `console.log` 로 터미널에 출력 (디버깅용).
  - `.env.local` 의 `N8N_WEBHOOK_URL` 로 `fetch` 를 사용해 그대로 전달.
  - 성공 시 `{ success: true }` JSON 응답, 실패 시 500 코드 + 에러 로그.

```text
프롬프트 키워드:
- Next.js App Router /api/n8n 라우트
- N8N_WEBHOOK_URL 환경변수 사용
- body 콘솔 출력 + fetch 프록시
- n8n 응답 성공 시 { success: true } 반환
```

---

### 5. 구글 시트 연동 프롬프트 (n8n 플로우)

- **요약**
  - n8n에서 수신한 We:form 스케줄 데이터를 Google Sheets에 적재하는 플로우 설계를 위한 프롬프트.
  - `/api/n8n` → n8n Webhook → Google Sheets 노드로 이어지는 간단한 ETL 흐름.
  - 향후 정산/리포트용 데이터 소스로 사용할 수 있도록 시트 컬럼 구조를 정의.
- **관련 파일 / 리소스**
  - `src/app/api/n8n/route.ts` (웹훅 진입점)
  - n8n 워크플로(시각적 플로우라 코드 파일은 없음)
- **핵심 요구사항 (발췌)**
  - 전달 필드: `date`, `time`, `member_name`, `type`, `status`, `staff_id` 등.
  - 시트 컬럼: 날짜/시간/회원명/수업 타입/상태/강사(지점명_이름) 등으로 설계.
  - 실패 시 알림(예: 슬랙/이메일) 또는 재시도 전략을 n8n 플로우에 정의.

```text
프롬프트 키워드:
- n8n → Google Sheets 데이터 적재
- We:form 스케줄 로그 시트 설계
- /api/n8n Webhook 입력 매핑
- 실패 알림/재시도 전략 논의
```

---

## 앞으로 사용할 프롬프트 기록 템플릿

> 새 작업을 요청할 때마다, 이 템플릿을 복사해서 날짜/섹션을 추가하면 됩니다.

```md
## YYYY-MM-DD

### N. 기능/작업 이름 (예: 급여 설정 화면 구현 프롬프트)

- **요약**
  - (이 프롬프트로 무엇을 만들려고 했는지 2~4줄 정도로 요약)
- **관련 파일**
  - `src/...`
  - `supabase/...`
- **핵심 요구사항 (발췌)**
  - (프롬프트에서 특히 중요했던 제약/규칙/정책들을 불릿으로 정리)

```text
프롬프트 키워드:
- 여기에
- 실제
- 프롬프트에서
- 사용했던
- 핵심 키워드/문장들을 요약해서 적기
```
```


