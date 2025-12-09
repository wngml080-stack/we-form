# 월별 스케줄 승인 시스템 설정 가이드

## 1. 데이터베이스 마이그레이션 실행하기

월별 스케줄 승인 시스템을 사용하려면 먼저 데이터베이스에 `monthly_schedule_reports` 테이블을 생성해야 합니다.

### 방법: Supabase 대시보드에서 직접 실행

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. 아래 마이그레이션 파일의 내용을 복사하여 붙여넣기:
   - 파일 경로: `supabase/migrations/20251208170000_monthly_schedule_reports.sql`
5. **Run** 버튼 클릭

마이그레이션이 성공하면 다음과 같은 메시지가 표시됩니다:
```
Success. No rows returned
```

## 2. 기능 설명

### 직원 (Staff)
- `/staff` 페이지에서 월별 스케줄 통계 확인
- "관리자에게 전송 (마감)" 버튼으로 월별 보고서 제출
- 승인된 월의 스케줄은 수정/삭제 불가

### 관리자 (Admin/Company Admin/System Admin)
- `/admin/reports` 페이지에서 제출된 보고서 검토
- 보고서 승인 또는 반려 처리
- 관리자 메모 작성 가능

## 3. 권한 구조

- **system_admin**: 모든 회사의 데이터 접근 가능
- **company_admin**: 자신이 관리하는 회사의 모든 지점 데이터 접근
- **admin**: 자신이 속한 지점의 데이터만 접근
- **staff**: 자신의 데이터만 접근

## 4. 테이블 구조

```sql
monthly_schedule_reports (
  - id: UUID (PK)
  - staff_id: UUID (FK → staffs)
  - gym_id: UUID (FK → gyms)
  - company_id: UUID (FK → companies)
  - year_month: VARCHAR(7) -- 'YYYY-MM' 형식
  - stats: JSONB -- 통계 데이터 스냅샷
  - status: VARCHAR(20) -- 'submitted', 'approved', 'rejected'
  - submitted_at: TIMESTAMP
  - reviewed_at: TIMESTAMP
  - reviewed_by: UUID (FK → staffs)
  - staff_memo: TEXT
  - admin_memo: TEXT
)
```

## 5. 워크플로우

1. **직원**: 매월 스케줄 작성
2. **직원**: 월말에 "관리자에게 전송" 버튼 클릭 (제출)
3. **관리자**: `/admin/reports`에서 제출된 보고서 검토
4. **관리자**: 승인 또는 반려 처리
5. **승인 시**: 해당 월의 스케줄이 잠김 (수정 불가)
6. **반려 시**: 직원이 수정 후 재제출 가능

## 6. API 엔드포인트

- `POST /api/staff/submit-monthly-report` - 월별 보고서 제출/재제출
  - Body: `{ staff_id, gym_id, company_id, year_month, stats, staff_memo }`

## 7. 페이지 접근 방법

- **직원 페이지**: `/staff`
- **관리자 승인 페이지**: `/admin/reports`
- **본사 관리 페이지**: `/admin/hq` (company_admin용)
- **시스템 관리 페이지**: `/admin/system` (system_admin용)

## 문제 해결

### 테이블이 생성되지 않았다는 에러
→ 위의 마이그레이션 SQL을 Supabase SQL Editor에서 실행했는지 확인

### RLS 권한 오류
→ 사용자의 role이 올바르게 설정되어 있는지 `staffs` 테이블에서 확인

### 승인 상태가 반영되지 않음
→ 브라우저를 새로고침하거나, 다른 월로 이동했다가 다시 돌아오기
