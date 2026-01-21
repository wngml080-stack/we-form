# Weform - 피트니스 센터 ERP SaaS

피트니스 센터를 위한 올인원 ERP 솔루션입니다.

## 주요 기능

- **회원 관리**: 회원 등록, 회원권 관리, 만기 알림
- **스케줄 관리**: PT/GX 수업 스케줄링, 전자 서명
- **급여 관리**: 트레이너별 급여 계산, 정산
- **매출 관리**: 실시간 매출 분석, 갱신율 추적
- **출퇴근 관리**: 직원 출퇴근 기록
- **AI 어시스턴트**: Claude 기반 업무 자동화

## 기술 스택

| 카테고리 | 기술 |
|----------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| UI Components | Radix UI, shadcn/ui |
| AI | Claude API (Anthropic) |
| Monitoring | Sentry |
| Testing | Vitest, Playwright |

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm or yarn
- Supabase 프로젝트

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd weform

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 실제 값 입력
```

### 환경 변수

`.env.example` 파일을 참조하여 `.env.local`을 설정하세요:

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 키 (서버 전용) |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `ENCRYPTION_KEY` | 암호화 키 (32바이트 base64) |

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run test` | 단위 테스트 (watch 모드) |
| `npm run test:run` | 단위 테스트 (단일 실행) |
| `npm run test:coverage` | 테스트 커버리지 |

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # 관리자 페이지
│   ├── staff/              # 직원 페이지
│   ├── api/                # API 라우트 (96개)
│   └── docs/               # API 문서 (Swagger UI)
├── components/             # 공통 컴포넌트
│   └── ui/                 # UI 컴포넌트 (shadcn/ui)
├── lib/                    # 유틸리티
│   ├── api/                # API 헬퍼
│   ├── ai/                 # AI 통합
│   ├── security/           # Rate limiting, 보안 헤더
│   ├── swagger/            # OpenAPI 문서
│   ├── supabase/           # Supabase 클라이언트
│   └── validations/        # Zod 스키마
└── types/                  # TypeScript 타입
```

## API 문서

개발 서버 실행 후 `/docs`에서 Swagger UI로 API 문서를 확인할 수 있습니다.

## 테스트

### 단위 테스트

```bash
# 전체 테스트 실행
npm run test:run

# 커버리지 리포트
npm run test:coverage
```

### E2E 테스트

```bash
# Playwright 테스트 실행
npx playwright test

# UI 모드로 실행
npx playwright test --ui
```

## 보안

- **Rate Limiting**: API별 요청 제한 (standard: 60/분, auth: 10/분, ai: 20/분)
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, CSP 등
- **Input Validation**: Zod 스키마 기반 입력 검증
- **RBAC**: 4단계 역할 기반 접근 제어 (system_admin → staff)

## 라이선스

Private

## 지원

문의사항은 support@weform.kr로 연락주세요.
