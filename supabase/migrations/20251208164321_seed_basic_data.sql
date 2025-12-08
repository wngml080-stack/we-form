-- ============================================
-- 기본 데이터 입력 (모든 gym에 자동 적용)
-- Migration: 20251208164321_seed_basic_data
-- ============================================

-- 중복 실행 방지
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM migration_history
    WHERE migration_name = '20251208164321_seed_basic_data'
  ) THEN
    RAISE EXCEPTION '이 마이그레이션은 이미 실행되었습니다.';
  END IF;
END $$;

-- ============================================
-- 모든 gym에 기본 데이터 입력
-- ============================================

DO $$
DECLARE
  gym_record RECORD;
  total_gyms INT := 0;
BEGIN
  -- 모든 gym을 순회하면서 데이터 입력
  FOR gym_record IN (SELECT id, name FROM gyms ORDER BY name)
  LOOP
    total_gyms := total_gyms + 1;
    RAISE NOTICE '================================================';
    RAISE NOTICE '처리 중: % (ID: %)', gym_record.name, gym_record.id;

    -- ============================================
    -- 1. 직무 정의 (10가지)
    -- ============================================

    INSERT INTO job_positions (gym_id, code, name, description) VALUES
      (gym_record.id, 'trainer', '트레이너', '개인 PT 수업을 담당하는 트레이너'),
      (gym_record.id, 'pt_lead', 'PT팀장', 'PT팀을 이끄는 팀장급 트레이너'),
      (gym_record.id, 'fc_staff', 'FC사원', '회원 상담 및 관리를 담당하는 FC 사원'),
      (gym_record.id, 'fc_junior', 'FC주임', 'FC 업무를 담당하는 주임급'),
      (gym_record.id, 'fc_lead', 'FC팀장', 'FC팀을 이끄는 팀장'),
      (gym_record.id, 'manager', '지점장', '지점을 관리하는 지점장 (관리자)'),
      (gym_record.id, 'director', '실장', '센터 운영 총괄 실장 (주주, 관리자)'),
      (gym_record.id, 'pilates_trainer', '필라테스 전임', '필라테스 수업 전담 강사'),
      (gym_record.id, 'pilates_lead', '필라테스 팀장', '필라테스팀 팀장'),
      (gym_record.id, 'pilates_director', '필라테스 원장', '필라테스 부문 총괄 원장')
    ON CONFLICT (gym_id, code) DO NOTHING;

    RAISE NOTICE '  ✓ 10개 직무 정의 완료';

    -- ============================================
    -- 2. 급여 변수 정의
    -- ============================================

    INSERT INTO salary_variables (gym_id, variable_name, display_name, data_type, data_source, aggregation_method, description) VALUES
      -- 매출 관련
      (gym_record.id, 'personal_sales', '개인 매출', 'number', 'member_registrations', 'sum', '직원 개인의 총 매출액'),
      (gym_record.id, 'personal_sales_excl_vat', '개인 매출 (부가세 제외)', 'number', 'member_registrations', 'sum', '부가세를 제외한 개인 매출'),
      (gym_record.id, 'new_member_sales', '신규 회원 매출', 'number', 'member_registrations', 'sum', '신규 등록 회원 매출'),
      (gym_record.id, 'renewal_sales', '재등록 매출', 'number', 'member_registrations', 'sum', '재등록 회원 매출'),
      (gym_record.id, 'extension_sales', '기간변경 매출', 'number', 'member_registrations', 'sum', '기간 변경 매출'),
      (gym_record.id, 'fc_total_sales', 'FC 총매출', 'number', 'member_registrations', 'sum', 'FC 팀 전체 매출'),
      (gym_record.id, 'fc_total_sales_excl_vat', 'FC 총매출 (부가세 제외)', 'number', 'member_registrations', 'sum', 'FC 팀 전체 매출 (부가세 제외)'),

      -- PT 수업 관련
      (gym_record.id, 'pt_total_count', 'PT 전체 횟수', 'number', 'schedules', 'count', '전체 PT 수업 횟수'),
      (gym_record.id, 'pt_inside_count', 'PT 근무내 횟수', 'number', 'schedules', 'count', '근무시간 내 PT 수업 횟수'),
      (gym_record.id, 'pt_outside_count', 'PT 근무외 횟수', 'number', 'schedules', 'count', '근무시간 외 PT 수업 횟수'),
      (gym_record.id, 'pt_weekend_count', 'PT 주말 횟수', 'number', 'schedules', 'count', '주말 PT 수업 횟수'),
      (gym_record.id, 'pt_holiday_count', 'PT 공휴일 횟수', 'number', 'schedules', 'count', '공휴일 PT 수업 횟수'),

      -- 활동 지표
      (gym_record.id, 'ot_count', 'OT 횟수', 'number', 'schedules', 'count', 'OT(오리엔테이션) 진행 횟수'),
      (gym_record.id, 'inbody_count', '인바디 측정 횟수', 'number', 'inbody_records', 'count', '인바디 측정 진행 횟수'),

      -- FC 레벨
      (gym_record.id, 'fc_level', 'FC 레벨', 'number', 'fc_level_assignments', 'value', 'FC 레벨 (1~5)'),

      -- 기타
      (gym_record.id, 'gym_total_sales', '센터 전체 매출', 'number', 'member_registrations', 'sum', '센터 전체 매출'),
      (gym_record.id, 'working_days', '근무 일수', 'number', 'manual', 'value', '월 근무 일수')
    ON CONFLICT (gym_id, variable_name) DO NOTHING;

    RAISE NOTICE '  ✓ 17개 변수 정의 완료';

    -- ============================================
    -- 3. 급여 구성요소 (공통)
    -- ============================================

    INSERT INTO salary_components (gym_id, name, category, description, display_order) VALUES
      (gym_record.id, '기본급', 'base', '월 고정 기본급', 1),
      (gym_record.id, '식대', 'allowance', '식대 지원금', 2),
      (gym_record.id, '영업지원금', 'allowance', '영업 활동 지원금', 3),
      (gym_record.id, '직책수당', 'allowance', '팀장/주임 등 직책 수당', 4),
      (gym_record.id, 'PT 수업료', 'lesson', 'PT 수업에 대한 급여', 10),
      (gym_record.id, 'OT 수업료', 'lesson', 'OT(오리엔테이션) 수업료', 11),
      (gym_record.id, '필라테스 수업료', 'lesson', '필라테스 수업에 대한 급여', 12),
      (gym_record.id, 'FC 인센티브', 'incentive', 'FC 매출 인센티브', 20),
      (gym_record.id, '매출 인센티브', 'incentive', '개인 매출에 따른 인센티브', 21),
      (gym_record.id, '성과급', 'bonus', '특별 성과에 대한 상금', 30),
      (gym_record.id, '기타 수당', 'allowance', '기타 추가 수당', 99)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '  ✓ 11개 급여 구성요소 생성 완료';

  END LOOP;

  -- ============================================
  -- 완료 메시지
  -- ============================================

  RAISE NOTICE '================================================';
  RAISE NOTICE '전체 기본 데이터 입력 완료!';
  RAISE NOTICE '처리된 센터: %개', total_gyms;
  RAISE NOTICE '각 센터별:';
  RAISE NOTICE '  - 10개 직무';
  RAISE NOTICE '  - 17개 변수';
  RAISE NOTICE '  - 11개 급여 구성요소';
  RAISE NOTICE '================================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '오류 발생: %', SQLERRM;
    RAISE;
END $$;

-- ============================================
-- 마이그레이션 완료 기록
-- ============================================

SELECT execute_migration(
  '20251208164321_seed_basic_data',
  NULL,
  '기본 데이터 입력: 모든 gym에 직무 10개, 변수 17개, 구성요소 11개씩 자동 입력'
);
