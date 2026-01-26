# weform - 피트니스 센터 통합 관리 시스템

## 프로젝트 개요
피트니스 센터 운영을 위한 올인원 SaaS 플랫폼
- 회원 관리, PT 스케줄, 출석, 급여, 매출 분석, 상담 등

## 기술 스택

### 핵심 기술
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Radix UI, TailwindCSS 4
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State**: React Context + SWR
- **Testing**: Vitest + Playwright
- **Validation**: Zod

### 주요 라이브러리
- FullCalendar (스케줄 관리)
- Recharts (데이터 시각화)
- date-fns (날짜 처리)
- XLSX (엑셀 내보내기)

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   │   ├── attendance/    # 출석 관리
│   │   ├── branch/        # 지점 대시보드
│   │   ├── hq/           # 본사 대시보드
│   │   ├── pt-members/    # PT 회원 관리
│   │   ├── schedule/      # 스케줄 관리
│   │   ├── salary/        # 급여 관리
│   │   └── sales/         # 매출 관리
│   └── api/              # API Routes
├── components/           # 공용 컴포넌트
│   └── ui/              # shadcn/ui 기반 디자인 시스템
├── contexts/            # React Context
├── hooks/               # Custom Hooks
├── lib/                 # 유틸리티
└── types/              # TypeScript 타입 정의
```

## 코딩 표준

### TypeScript
- ✅ **MUST**: strict mode 사용
- ✅ **MUST**: 명시적 타입 정의 (any 금지)
- ✅ **MUST**: interface 대신 type 사용 (일관성)
- ✅ **PREFER**: Zod로 런타임 검증

### React 컴포넌트
- ✅ **MUST**: Server Component 우선 (RSC)
- ✅ **MUST**: 'use client'는 필요한 경우만
- ✅ **MUST**: Props에 타입 정의
- ✅ **PREFER**: 함수형 컴포넌트 + Hooks

### Supabase
- ✅ **MUST**: RLS(Row Level Security) 정책 준수
- ✅ **MUST**: 서버 컴포넌트에서 createClient() 사용
- ✅ **MUST**: 클라이언트 컴포넌트에서 createBrowserClient() 사용
- ⚠️ **NEVER**: 클라이언트에서 직접 DB 조작 (RLS 우회 금지)

### 스타일링
- ✅ **MUST**: TailwindCSS 유틸리티 클래스 사용
- ✅ **MUST**: cn() 함수로 클래스 병합
- ✅ **PREFER**: Radix UI 기반 컴포넌트 재사용

### 네이밍 컨벤션
- 컴포넌트: PascalCase (`MemberDetailModal`)
- 파일명: kebab-case 또는 PascalCase 일관성 유지
- 함수: camelCase (`fetchMemberData`)
- 상수: UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)
- 타입: PascalCase (`UserProfile`)

## 금지 사항 (DO NOT)

### 보안
- ⛔ **NEVER**: 환경 변수를 클라이언트에 노출
- ⛔ **NEVER**: Supabase RLS 정책 우회
- ⛔ **NEVER**: 인증 체크 생략
- ⛔ **NEVER**: 민감 정보 콘솔 로그

### 코드 품질
- ⛔ **NEVER**: any 타입 사용
- ⛔ **NEVER**: console.log를 프로덕션에 남김
- ⛔ **NEVER**: 테스트 없이 핵심 로직 변경
- ⛔ **NEVER**: 하드코딩된 값 (상수화 필수)

### 성능
- ⛔ **NEVER**: 불필요한 'use client' 추가
- ⛔ **NEVER**: 대용량 데이터 클라이언트 로딩
- ⛔ **NEVER**: 무한 루프 가능성 있는 useEffect

## 개발 워크플로우

### 1. 기능 추가 프로세스
```
1. 계획 모드로 구조 설계
2. DB 스키마 변경 (필요시 마이그레이션)
3. 타입 정의 생성/업데이트
4. API Route 구현 + 테스트
5. UI 컴포넌트 구현
6. 통합 테스트
7. 커밋 (의미있는 메시지)
```

### 2. 버그 수정 프로세스
```
1. 재현 단계 확인
2. 실패하는 테스트 작성
3. 버그 수정
4. 테스트 통과 확인
5. 관련 영역 회귀 테스트
```

### 3. 리팩토링 프로세스
```
1. 계획 모드로 영향 범위 분석
2. 테스트 커버리지 확인
3. 리팩토링 실행
4. 모든 테스트 통과 확인
5. 시각적 검토 (GitHub Desktop)
```

## 테스트 전략

### Unit Tests (Vitest)
- 유틸리티 함수
- 복잡한 비즈니스 로직
- 컴포넌트 단위 테스트

### E2E Tests (Playwright)
- 핵심 사용자 시나리오
- 회원 등록 → PT 계약 → 스케줄 예약 → 출석
- 급여 계산 → 매출 리포트

### 테스트 작성 규칙
- ✅ **MUST**: API Route에는 반드시 테스트 작성
- ✅ **MUST**: 결제/급여 로직은 100% 커버리지
- ✅ **PREFER**: TDD 방식 (특히 복잡한 로직)

## 일반 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 테스트
npm test           # watch 모드
npm run test:run   # 1회 실행
npm run test:coverage  # 커버리지

# Playwright
npm run test:screenshots
```

## 문제 해결

### Supabase 연결 이슈
1. 환경 변수 확인 (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY)
2. RLS 정책 확인
3. 서버/클라이언트 클라이언트 구분 확인

### 빌드 에러
1. TypeScript 에러 먼저 해결
2. 의존성 버전 호환성 확인
3. node_modules 재설치

## AI 협업 지침

### Claude Code 세션 관리
- **하나의 세션 = 하나의 기능/버그**
- 복잡한 작업은 계획 모드 사용 (Shift+Tab 2번)
- 대화가 50k 토큰 이상 시 HANDOFF.md 생성 후 /clear

### 작업 분해 원칙
```
❌ "PT 회원 관리 시스템 만들어줘"
✅ "PT 회원 상태 타입 정의해줘"
✅ "PT 회원 목록 조회 API 만들어줘"
✅ "PT 회원 칸반보드 컴포넌트 만들어줘"
```

### 검증 방법
1. 테스트 실행으로 검증
2. GitHub Desktop으로 diff 확인
3. Draft PR로 전체 변경사항 검토
4. Claude에게 자기 검증 요청

## 버전 정보
- Node.js: >= 20.0.0
- Next.js: 16.1.0
- React: 19.2.0
- TypeScript: 5.x
