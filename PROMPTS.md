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


