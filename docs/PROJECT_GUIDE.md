# We:form 프로젝트 가이드

> 헬스장/필라테스 센터를 위한 종합 관리 플랫폼

---

## 📖 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [시스템 아키텍처](#-시스템-아키텍처)
3. [기술 스택](#-기술-스택)
4. [디자인 시스템](#-디자인-시스템)
5. [데이터베이스 구조](#-데이터베이스-구조)
6. [주요 기능](#-주요-기능)
7. [역할별 권한](#-역할별-권한)
8. [개발 가이드](#-개발-가이드)

---

## 🎯 프로젝트 개요

### 목적
We:form은 **멀티 브랜치 헬스케어 시설 통합 관리 플랫폼**입니다.
여러 지점을 운영하는 헬스장/필라테스 센터에서 회원, 직원, 스케줄, 출석, 매출을 효율적으로 관리할 수 있도록 지원합니다.

### 핵심 가치
- **멀티테넌시**: 회사(Company) → 지점(Branch/Gym) 구조로 데이터 격리
- **역할 기반 접근 제어**: 시스템 관리자, 본사, 지점장, 직원 4단계 권한
- **실시간 협업**: Supabase Realtime을 활용한 실시간 데이터 동기화
- **직관적 UX**: 그라데이션, 소프트 섀도우, 부드러운 애니메이션

---

## 🏗️ 시스템 아키텍처

### 계층 구조

```
┌─────────────────────────────────────────┐
│         System Admin (마스터)            │ ← 모든 회사/지점 접근
└─────────────────────────────────────────┘
            │
            ├─── 회사 A (Company)
            │     ├─── 본사 (Company Admin)
            │     ├─── 지점 1 (Branch)
            │     │     ├─── 지점장 (Admin)
            │     │     └─── 직원 (Staff)
            │     └─── 지점 2 (Branch)
            │           ├─── 지점장 (Admin)
            │           └─── 직원 (Staff)
            │
            └─── 회사 B (Company)
                  └─── ...
```

### 역할별 접근 범위

| 역할 | 접근 범위 | 수정 권한 |
|------|----------|----------|
| **System Admin** | 모든 회사/지점 | 회사 생성/수정/삭제, 지점 생성/수정/삭제 |
| **Company Admin** | 자기 회사의 모든 지점 | 지점 생성/수정, 직원 관리, 회원 관리 |
| **Admin (지점장)** | 자기 지점만 | 직원 관리, 회원 관리, 스케줄 관리 |
| **Staff (직원)** | 자기 지점만 (조회 위주) | 스케줄 생성, 출석 체크 |

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0 (Oxide Engine)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Calendar**: FullCalendar

### Backend
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **Security**: Row Level Security (RLS)

### DevOps
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **Version Control**: Git

---

## 🎨 디자인 시스템

> **상세 가이드**: [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)

### 브랜드 컬러

```css
Primary Blue:   #2F80ED  /* 메인 브랜드 컬러 */
Accent Orange:  #F2994A  /* 포인트 컬러 */
```

### 폰트
- **Paperozi**: 한글 웹폰트 (전체 적용)
- Weight: 100 ~ 900

### 그라데이션

```css
/* 사이드바 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 페이지 배경 */
background: linear-gradient(to-br, #f8fafc, #dbeafe/30, #fae8ff/30);
```

### 컴포넌트 스타일

```tsx
// 카드
<div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-soft-lg transition-all">

// 버튼
<Button className="bg-[#2F80ED] hover:bg-[#1e5bb8] text-white">

// 배지
<Badge className="bg-emerald-500">출석</Badge>
```

---

## 🗄️ 데이터베이스 구조

> **전체 스키마**: [weform-schema.sql](../weform-schema.sql)

### 핵심 테이블

#### 1. 조직 구조
```sql
companies        -- 회사 (복수 지점 운영 단위)
  ├─ gyms        -- 지점 (센터/스튜디오)
  └─ staffs      -- 직원 (user_id 연결)
```

#### 2. 회원 관리
```sql
members                -- 회원 정보
  ├─ member_memberships  -- 회원권
  └─ member_payments     -- 결제 내역
```

#### 3. 스케줄 & 출석
```sql
schedules            -- 스케줄
  └─ attendances     -- 출석 기록
       └─ attendance_statuses  -- 출석 상태 코드
```

#### 4. 로그 & 급여
```sql
sales_logs          -- 매출 로그
system_logs         -- 시스템 로그
salary_settings     -- 급여 설정
```

### RLS 정책

> **적용 스크립트**: [scripts/apply-rls-policies.sql](../scripts/apply-rls-policies.sql)

모든 테이블에 Row Level Security 적용:
- 로그인한 사용자의 `user_id` → `staffs` 테이블 조회
- 직원의 `role`, `company_id`, `gym_id` 기반으로 데이터 필터링
- 퇴사 직원 자동 차단 (`employment_status <> '퇴사'`)

---

## ✨ 주요 기능

### 1. 인증 & 권한 관리
- ✅ 이메일/비밀번호 로그인
- ✅ 회원가입 (회사 생성 또는 기존 회사 가입)
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ Row Level Security (RLS)

### 2. 회사/지점 관리
- ✅ 회사(Company) CRUD (시스템 관리자만)
- ✅ 지점(Gym) CRUD (본사/마스터)
- ✅ 지점별 데이터 격리

### 3. 직원 관리
- ✅ 직원 등록 (이메일/비밀번호 자동 생성)
- ✅ 직원 정보 수정
- ✅ 직원 역할 변경
- ✅ 퇴사 처리

### 4. 스케줄 관리
- ✅ 스케줄 생성 (개인/그룹)
- ✅ 캘린더 뷰 (FullCalendar)
- ✅ 직원별 필터링
- ✅ 회원 연결

### 5. 출석 관리
- ✅ 출석 기록 등록
- ✅ 출석 상태 변경 (출석, 노쇼, 예약 등)
- ✅ 스케줄/날짜별 필터링
- ✅ 출석 기록 삭제

### 6. 회원 관리
- 🔄 회원 등록/수정
- 🔄 회원권 관리
- 🔄 결제 내역 관리
- 🔄 회원별 출석 히스토리

### 7. 매출 관리
- 🔄 매출 로그 조회
- 🔄 매출 통계 대시보드

### 8. 급여 관리
- 🔄 급여 설정
- 🔄 급여 계산

### 9. 시스템 로그
- 🔄 시스템 활동 기록
- 🔄 로그 조회 (본사/마스터만)

**범례**: ✅ 완료 | 🔄 구현 중 | ❌ 미구현

---

## 🔐 역할별 권한

> **상세 권한 표**: [docs/TEST_ACCOUNTS.md](TEST_ACCOUNTS.md)

### System Admin (마스터)
```
✅ 모든 회사/지점 조회/수정
✅ 회사 생성/삭제
✅ 지점 생성/수정/삭제
✅ 직원 관리
✅ 시스템 로그 조회
```

### Company Admin (본사)
```
✅ 자기 회사의 모든 지점 조회/수정
✅ 지점 생성/수정
✅ 직원 관리
✅ 회원 관리
✅ 시스템 로그 조회
❌ 회사 생성/삭제 (마스터만)
```

### Admin (지점장)
```
✅ 자기 지점 조회/수정
✅ 직원 관리
✅ 회원 관리
✅ 스케줄 관리
✅ 출석 관리
❌ 지점 생성/삭제
❌ 시스템 로그 조회
```

### Staff (직원)
```
✅ 자기 지점 조회
✅ 스케줄 생성
✅ 출석 체크
❌ 회원 정보 수정
❌ 직원 정보 수정
❌ 급여 설정 수정
```

---

## 🚀 개발 가이드

### 프로젝트 구조

```
weform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # 관리자 페이지
│   │   │   ├── layout.tsx      # Admin 레이아웃 (사이드바)
│   │   │   ├── page.tsx        # 대시보드
│   │   │   ├── schedule/       # 스케줄 관리
│   │   │   ├── attendance/     # 출석 관리
│   │   │   ├── staff/          # 직원 관리
│   │   │   ├── hq/             # 본사 관리
│   │   │   └── system/         # 시스템 관리
│   │   ├── api/                # API Routes
│   │   │   ├── admin/          # 관리자 API
│   │   │   ├── auth/           # 인증 API
│   │   │   └── attendance/     # 출석 API
│   │   ├── login/              # 로그인
│   │   ├── signup/             # 회원가입
│   │   └── globals.css         # 전역 스타일
│   ├── components/             # React 컴포넌트
│   │   └── ui/                 # shadcn/ui 컴포넌트
│   └── lib/                    # 유틸리티
│       └── supabase/           # Supabase 클라이언트
├── docs/                       # 문서
│   ├── DESIGN_SYSTEM.md        # 디자인 시스템
│   ├── TEST_ACCOUNTS.md        # 테스트 계정
│   ├── PROJECT_GUIDE.md        # 이 파일
│   └── pages/                  # 페이지별 가이드
├── scripts/                    # DB 스크립트
│   ├── apply-rls-policies.sql  # RLS 정책
│   └── create-test-users-v2.mjs # 테스트 계정 생성
├── weform-schema.sql           # DB 스키마
└── tailwind.config.ts          # Tailwind 설정
```

### 환경 변수 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### 로컬 개발 서버 실행

```bash
npm install
npm run dev
```

→ http://localhost:3000

### 데이터베이스 설정

1. **Supabase 프로젝트 생성**
2. **스키마 적용**:
   - Supabase SQL Editor에서 `weform-schema.sql` 실행
3. **RLS 정책 적용**:
   - `scripts/apply-rls-policies.sql` 실행
4. **테스트 계정 생성**:
   ```bash
   node scripts/create-test-users-v2.mjs
   ```

---

## 📚 참고 문서

### 디자인
- [디자인 시스템 명세서](DESIGN_SYSTEM.md)
- [페이지별 디자인 가이드](pages/README.md)
- [출석 관리 페이지 가이드](pages/04-attendance.md)

### 개발
- [테스트 계정 정보](TEST_ACCOUNTS.md)
- [DB 스키마](../weform-schema.sql)
- [RLS 정책](../scripts/apply-rls-policies.sql)

### 외부 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [shadcn/ui 공식 문서](https://ui.shadcn.com)

---

## 🔄 구현 우선순위

현재 진행 상황:

1. ✅ **RLS 정책** - 완료 (13개 테이블)
2. ✅ **출석 관리 시스템** - 완료 (API + 프론트엔드)
3. 🔄 **매출 로그 시스템** - 다음 단계
4. 🔄 **급여 관리 페이지** - 예정
5. 🔄 **시스템 로그 조회** - 예정

---

## 🤝 기여 가이드

### 새로운 기능 추가 시

1. **디자인 가이드 확인**: `docs/DESIGN_SYSTEM.md`
2. **DB 스키마 수정**: `weform-schema.sql` 업데이트
3. **RLS 정책 추가**: `scripts/apply-rls-policies.sql`
4. **API 구현**: `src/app/api/` 하위에 엔드포인트 생성
5. **프론트엔드 구현**: `src/app/admin/` 하위에 페이지 생성
6. **문서 업데이트**: `docs/pages/` 하위에 가이드 작성

### 코드 스타일

- **TypeScript**: 타입 안전성 준수
- **Tailwind**: 유틸리티 클래스 사용
- **컴포넌트**: 재사용 가능한 작은 단위로 분리
- **네이밍**: 명확하고 일관된 변수명 사용

---

## 📞 문의 및 지원

프로젝트 관련 질문이나 이슈는 GitHub Issues에 등록해주세요.

**프로젝트 관리자**: We:form Team
**최종 업데이트**: 2025-12-05
