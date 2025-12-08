# Supabase 마이그레이션 가이드

## 📋 마이그레이션 파일 목록

마이그레이션은 **번호 순서대로** 실행됩니다:

```
00_migration_tracker.sql          # 마이그레이션 추적 시스템 (가장 먼저 실행)
20251208164318_salary_system_tables.sql  # 급여 시스템 테이블 생성
20251208164319_alter_existing_tables.sql # 기존 테이블 수정
20251208164320_salary_rls_policies.sql   # RLS 정책 적용
```

## 🚀 실행 방법

### 1단계: 마이그레이션 추적 시스템 설치

Supabase SQL Editor에서 실행:

```sql
-- 00_migration_tracker.sql 파일 내용을 복사해서 실행
```

이렇게 하면 `migration_history` 테이블이 생성되고, 중복 실행을 방지할 수 있습니다.

### 2단계: 급여 시스템 마이그레이션 실행

**순서대로** 실행하세요:

```sql
-- 1. 테이블 생성
-- 20251208164318_salary_system_tables.sql 실행

-- 2. 기존 테이블 수정
-- 20251208164319_alter_existing_tables.sql 실행

-- 3. RLS 정책
-- 20251208164320_salary_rls_policies.sql 실행
```

### 3단계: 실행 확인

```sql
-- 실행된 마이그레이션 확인
SELECT * FROM migration_history ORDER BY executed_at;

-- 또는
SELECT * FROM executed_migrations;
```

## ✅ 중복 실행 방지

각 마이그레이션 파일은 자동으로 중복 실행을 방지합니다:
- 이미 실행된 마이그레이션은 건너뜀
- `migration_history` 테이블에 기록됨

## 📝 새 마이그레이션 추가하는 방법

### 1. 타임스탬프 생성

```bash
date +"%Y%m%d%H%M%S"
# 예: 20251208164321
```

### 2. 파일 생성

```
supabase/migrations/20251208164321_your_migration_name.sql
```

### 3. 템플릿 사용

```sql
-- ============================================
-- 마이그레이션 설명
-- Migration: 20251208164321_your_migration_name
-- ============================================

-- 중복 실행 방지
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM migration_history
    WHERE migration_name = '20251208164321_your_migration_name'
  ) THEN
    RAISE EXCEPTION '이 마이그레이션은 이미 실행되었습니다.';
  END IF;
END $$;

-- ============================================
-- 여기에 SQL 작성
-- ============================================

-- 예: 테이블 생성
CREATE TABLE IF NOT EXISTS your_table (
  id UUID PRIMARY KEY,
  ...
);

-- ============================================
-- 마이그레이션 완료 기록
-- ============================================

SELECT execute_migration(
  '20251208164321_your_migration_name',
  NULL,
  '마이그레이션 설명'
);
```

## 🔄 롤백 (되돌리기)

마이그레이션을 되돌리고 싶다면:

### 옵션 1: 수동 롤백

```sql
-- 1. 생성된 테이블 삭제
DROP TABLE IF EXISTS job_positions CASCADE;
DROP TABLE IF EXISTS salary_variables CASCADE;
-- ... (나머지)

-- 2. 마이그레이션 기록 삭제
DELETE FROM migration_history
WHERE migration_name = '20251208164318_salary_system_tables';
```

### 옵션 2: 롤백 SQL 파일 작성

```sql
-- 20251208164318_salary_system_tables_rollback.sql
DROP TABLE IF EXISTS fc_level_assignments CASCADE;
DROP TABLE IF EXISTS calculated_salaries CASCADE;
DROP TABLE IF EXISTS monthly_performance CASCADE;
DROP TABLE IF EXISTS inbody_records CASCADE;
DROP TABLE IF EXISTS calculation_rules CASCADE;
DROP TABLE IF EXISTS salary_components CASCADE;
DROP TABLE IF EXISTS salary_variables CASCADE;
DROP TABLE IF EXISTS job_positions CASCADE;

DELETE FROM migration_history
WHERE migration_name = '20251208164318_salary_system_tables';
```

## 🛠️ 문제 해결

### "이미 실행되었습니다" 오류가 나는데 다시 실행하고 싶어요

```sql
-- 해당 마이그레이션 기록 삭제 (주의!)
DELETE FROM migration_history
WHERE migration_name = '20251208164318_salary_system_tables';

-- 그 다음 마이그레이션 파일 다시 실행
```

### 전체 초기화하고 싶어요

```sql
-- ⚠️ 주의: 모든 데이터가 삭제됩니다!

-- 1. 모든 테이블 삭제
DROP TABLE IF EXISTS fc_level_assignments CASCADE;
DROP TABLE IF EXISTS calculated_salaries CASCADE;
DROP TABLE IF EXISTS monthly_performance CASCADE;
DROP TABLE IF EXISTS inbody_records CASCADE;
DROP TABLE IF EXISTS calculation_rules CASCADE;
DROP TABLE IF EXISTS salary_components CASCADE;
DROP TABLE IF EXISTS salary_variables CASCADE;
DROP TABLE IF EXISTS job_positions CASCADE;

-- 2. 마이그레이션 기록 초기화
TRUNCATE migration_history;
INSERT INTO migration_history (migration_name, notes)
VALUES ('00_migration_tracker', '마이그레이션 추적 시스템 초기화');

-- 3. 처음부터 다시 실행
```

## 📊 유용한 쿼리

### 테이블 목록 확인

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%salary%'
OR tablename IN ('job_positions', 'inbody_records', 'fc_level_assignments')
ORDER BY tablename;
```

### 테이블 컬럼 확인

```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'staffs'
AND column_name IN ('work_start_time', 'work_end_time', 'job_position_code');
```

## ⚠️ 중요 사항

1. **순서대로 실행하세요**
   - 00 → 20251208164318 → 20251208164319 → 20251208164320

2. **프로덕션 환경 주의**
   - 테스트 환경에서 먼저 실행
   - 백업 필수

3. **RLS 정책**
   - admin, manager 권한만 설정 가능
   - 테스트 시 권한 확인

## 📞 지원

문제 발생 시:
1. 에러 메시지 캡처
2. `SELECT * FROM migration_history` 결과 확인
3. 개발팀에 문의
