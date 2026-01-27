-- =====================================================
-- 037: employment_status에 '가입대기' 상태 추가
-- 신규 직원 온보딩 시 승인 대기 상태를 위한 값 추가
-- =====================================================

-- 기존 CHECK 제약 조건 삭제
ALTER TABLE staffs DROP CONSTRAINT IF EXISTS staffs_employment_status_check;

-- 새로운 CHECK 제약 조건 추가 ('가입대기' 포함)
ALTER TABLE staffs ADD CONSTRAINT staffs_employment_status_check
  CHECK (employment_status IN ('재직', '퇴사', '휴직', '가입대기'));

-- 설명:
-- '재직': 현재 근무 중인 직원 (승인됨)
-- '퇴사': 퇴사한 직원
-- '휴직': 휴직 중인 직원
-- '가입대기': 신규 가입 후 관리자 승인 대기 중
