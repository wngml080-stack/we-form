# 급여 시스템 설정 가이드

## 📋 개요

이 문서는 급여 자동 계산 시스템을 설정하는 방법을 설명합니다.

## 🗃️ 데이터베이스 설정

### 1단계: 마이그레이션 실행

```bash
# Supabase SQL Editor에서 다음 파일을 순서대로 실행하세요

1. scripts/salary-system-migration-v1.sql
   → 테이블 생성 및 기존 테이블 수정

2. scripts/salary-system-seed-data.sql
   → 기본 데이터 입력
   → ⚠️ 주의: gym_id를 실제 값으로 변경 후 실행!
```

### 2단계: gym_id 확인

```sql
-- 본인의 gym_id 확인
SELECT gym_id FROM staffs WHERE user_id = auth.uid();
```

### 3단계: seed 데이터 수정

`scripts/salary-system-seed-data.sql` 파일에서 `:gym_id`를 모두 실제 값으로 변경:

```sql
-- 변경 전
INSERT INTO job_positions (gym_id, code, name, description) VALUES
  (':gym_id', 'trainer', '트레이너', ...);

-- 변경 후 (예시)
INSERT INTO job_positions (gym_id, code, name, description) VALUES
  ('abc-123-def-456', 'trainer', '트레이너', ...);
```

### 4단계: seed 실행

수정한 `salary-system-seed-data.sql`을 Supabase SQL Editor에서 실행합니다.

## 📊 생성된 테이블 목록

### 1. 설정 테이블
- `job_positions` - 직무 정의 (트레이너, FC팀장 등)
- `salary_variables` - 변수 정의 (개인매출, OT개수 등)
- `salary_components` - 급여 구성요소 (기본급, 수업료 등)
- `calculation_rules` - 계산 규칙 (조건 + 계산식)

### 2. 데이터 테이블
- `inbody_records` - 인바디 측정 기록
- `monthly_performance` - 월별 실적 집계
- `calculated_salaries` - 계산된 급여
- `fc_level_assignments` - FC 레벨 할당

### 3. 수정된 기존 테이블
- `staffs` - 근무시간, 직무코드 컬럼 추가
- `schedules` - 스케줄 타입, 급여계산 포함 여부 추가
- `member_registrations` - 등록 타입, 부가세 제외 금액, 담당자 추가

## 🎯 직무 코드

시스템에 정의된 10가지 직무:

| 코드 | 이름 | 설명 |
|------|------|------|
| `trainer` | 트레이너 | 개인 PT 수업 담당 |
| `pt_lead` | PT팀장 | PT팀 팀장 |
| `fc_staff` | FC사원 | FC 사원 |
| `fc_junior` | FC주임 | FC 주임 |
| `fc_lead` | FC팀장 | FC 팀장 |
| `manager` | 지점장 | 지점 관리자 |
| `director` | 실장 | 센터 총괄 실장 |
| `pilates_trainer` | 필라테스 전임 | 필라테스 전담 강사 |
| `pilates_lead` | 필라테스 팀장 | 필라테스 팀장 |
| `pilates_director` | 필라테스 원장 | 필라테스 총괄 |

## 📈 변수 목록

급여 계산에 사용되는 변수들:

### 매출 관련
- `personal_sales` - 개인 매출
- `personal_sales_excl_vat` - 개인 매출 (부가세 제외)
- `new_member_sales` - 신규 회원 매출
- `renewal_sales` - 재등록 매출
- `extension_sales` - 기간변경 매출
- `fc_total_sales` - FC 총매출
- `fc_total_sales_excl_vat` - FC 총매출 (부가세 제외)

### PT 수업 관련
- `pt_total_count` - PT 전체 횟수
- `pt_inside_count` - PT 근무내 횟수
- `pt_outside_count` - PT 근무외 횟수
- `pt_weekend_count` - PT 주말 횟수
- `pt_holiday_count` - PT 공휴일 횟수

### 활동 지표
- `ot_count` - OT 횟수
- `inbody_count` - 인바디 측정 횟수

### FC 관련
- `fc_level` - FC 레벨 (1~5)

## 🔧 다음 단계

데이터베이스 설정이 완료되면:

1. **직원 정보 업데이트**
   - 각 직원의 `job_position_code` 설정
   - 근무시간 (`work_start_time`, `work_end_time`) 설정

2. **급여 규칙 설정**
   - 관리자 페이지에서 직무별 급여 규칙 생성
   - 조건과 계산식 설정

3. **자동 집계 테스트**
   - 스케줄 데이터에서 PT 횟수 집계
   - 회원 등록 데이터에서 매출 집계

4. **급여 계산 테스트**
   - 샘플 데이터로 급여 계산
   - 결과 검증

## ⚠️ 주의사항

1. **RLS 정책이 적용되어 있습니다**
   - 관리자(`admin`, `manager`)만 급여 설정 가능
   - 직원은 본인의 급여만 조회 가능

2. **기존 데이터 백업**
   - 마이그레이션 전 기존 데이터를 백업하세요
   - 특히 `staffs`, `schedules`, `member_registrations` 테이블

3. **테스트 환경에서 먼저 실행**
   - 프로덕션 환경 적용 전 테스트 필수

## 🐛 문제 해결

### 테이블이 이미 존재한다는 오류
```sql
-- 테이블 삭제 후 재생성 (주의: 데이터 손실!)
DROP TABLE IF EXISTS job_positions CASCADE;
DROP TABLE IF EXISTS salary_variables CASCADE;
-- ... (나머지 테이블들)
```

### gym_id를 모르겠어요
```sql
-- 현재 로그인한 사용자의 gym_id 확인
SELECT s.gym_id, g.name as gym_name
FROM staffs s
JOIN gyms g ON g.id = s.gym_id
WHERE s.user_id = auth.uid();
```

### RLS 정책 오류
```sql
-- 임시로 RLS 비활성화 (테스트용)
ALTER TABLE job_positions DISABLE ROW LEVEL SECURITY;
-- 주의: 프로덕션에서는 절대 비활성화하지 마세요!
```

## 📞 지원

문제가 발생하면:
1. 오류 메시지 전체를 캡처
2. 실행한 SQL 문 확인
3. 개발팀에 문의
