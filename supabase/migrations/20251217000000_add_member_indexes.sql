-- 회원 관리 성능 최적화를 위한 인덱스 추가
-- 생성일: 2025-12-17
-- 목적: 지점당 4,000-10,000명 회원 처리 대비

-- ============================================
-- 1. 회원 조회 최적화 (gym_id 필터링)
-- ============================================

-- 지점별 회원 조회 + 생성일 정렬 (가장 자주 사용)
CREATE INDEX IF NOT EXISTS idx_members_gym_id_created_at
ON members(gym_id, created_at DESC);

-- 지점별 + 상태별 필터링
CREATE INDEX IF NOT EXISTS idx_members_gym_id_status
ON members(gym_id, status);

-- 지점별 + 담당 트레이너 필터링
CREATE INDEX IF NOT EXISTS idx_members_gym_id_trainer_id
ON members(gym_id, trainer_id);

-- ============================================
-- 2. 검색 최적화
-- ============================================

-- 지점별 + 이름 검색
CREATE INDEX IF NOT EXISTS idx_members_gym_id_name
ON members(gym_id, name);

-- 지점별 + 전화번호 검색
CREATE INDEX IF NOT EXISTS idx_members_gym_id_phone
ON members(gym_id, phone);

-- ============================================
-- 3. 트레이너별 필터링 (직원 역할)
-- ============================================

-- 트레이너가 담당 회원 조회 시
CREATE INDEX IF NOT EXISTS idx_members_trainer_id_created_at
ON members(trainer_id, created_at DESC);

-- ============================================
-- 4. 회원권 조인 최적화
-- ============================================

-- 회원 ID로 회원권 조회 + 상태 필터
CREATE INDEX IF NOT EXISTS idx_member_memberships_member_id_status
ON member_memberships(member_id, status);

-- 지점별 회원권 조회 + 상태 필터
CREATE INDEX IF NOT EXISTS idx_member_memberships_gym_id_status
ON member_memberships(gym_id, status);

-- ============================================
-- 5. 전체 텍스트 검색 (3단계용 - 선택사항)
-- ============================================

-- pg_trgm 확장 설치 (이미 설치되어 있으면 무시)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 이름 검색용 GIN 인덱스 (유사 검색 지원)
CREATE INDEX IF NOT EXISTS idx_members_name_trgm
ON members USING gin(name gin_trgm_ops);

-- 전화번호 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_members_phone_trgm
ON members USING gin(phone gin_trgm_ops);

-- ============================================
-- 인덱스 생성 완료
-- ============================================

-- 성능 향상 예상:
-- - 기본 조회: 10-50배 향상
-- - 검색: 20-100배 향상
-- - 페이지네이션: 즉시 응답

COMMENT ON INDEX idx_members_gym_id_created_at IS '지점별 회원 조회 + 최신순 정렬';
COMMENT ON INDEX idx_members_gym_id_status IS '지점별 상태 필터링';
COMMENT ON INDEX idx_members_gym_id_trainer_id IS '지점별 트레이너 필터링';
COMMENT ON INDEX idx_members_gym_id_name IS '지점별 이름 검색';
COMMENT ON INDEX idx_members_gym_id_phone IS '지점별 전화번호 검색';
COMMENT ON INDEX idx_members_trainer_id_created_at IS '트레이너 담당 회원 조회';
COMMENT ON INDEX idx_member_memberships_member_id_status IS '회원별 회원권 조회';
COMMENT ON INDEX idx_member_memberships_gym_id_status IS '지점별 회원권 조회';
