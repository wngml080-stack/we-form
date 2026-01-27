-- =====================================================
-- 보안 고문(Security Advisor) 문제 해결 마이그레이션
-- 2026-01-27
-- =====================================================
-- 1. migration_history 테이블 RLS 활성화
-- 2. SECURITY DEFINER 함수들에 search_path = public 추가
-- 3. membership_types, payment_methods RLS 정책 강화
-- =====================================================

-- =====================================================
-- PART 1: migration_history RLS 활성화
-- =====================================================

ALTER TABLE IF EXISTS migration_history ENABLE ROW LEVEL SECURITY;

-- 시스템 관리자만 수정 가능
DROP POLICY IF EXISTS "migration_history_all" ON migration_history;
CREATE POLICY "migration_history_all" ON migration_history
  FOR ALL USING (is_system_admin());

-- 읽기는 인증된 사용자 허용 (마이그레이션 상태 확인용)
DROP POLICY IF EXISTS "migration_history_select" ON migration_history;
CREATE POLICY "migration_history_select" ON migration_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- PART 2: 015b_enable_rls.sql 함수들 재정의 (search_path 추가)
-- =====================================================

-- 기존 함수 삭제 (RETURNS TABLE 함수는 반환 타입 변경 시 DROP 필요)
DROP FUNCTION IF EXISTS get_current_staff();

-- 현재 사용자 정보 조회 함수
CREATE OR REPLACE FUNCTION get_current_staff()
RETURNS TABLE(
  id uuid,
  company_id uuid,
  gym_id uuid,
  role text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.id, s.company_id, s.gym_id, s.role
  FROM staffs s
  WHERE s.user_id = auth.uid()
  LIMIT 1;
$$;

-- 편의 함수들
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT company_id FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_gym_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gym_id FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_staff_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM staffs WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 권한 체크 함수들
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND role = 'system_admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_company_admin_or_above()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('system_admin', 'company_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staffs
    WHERE user_id = auth.uid()
    AND role IN ('system_admin', 'company_admin', 'admin')
  );
$$;

-- =====================================================
-- PART 3: 027_member_gender_birthdate_functions.sql 함수 재정의
-- =====================================================

-- 기존 함수 삭제 (반환 타입 변경 시 필요)
DROP FUNCTION IF EXISTS update_member_gender_birthdate(UUID, TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS get_members_by_phones(UUID, TEXT[]);

CREATE OR REPLACE FUNCTION update_member_gender_birthdate(
  p_gym_id UUID,
  p_phone TEXT,
  p_gender TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE members
  SET
    gender = COALESCE(p_gender, gender),
    birth_date = COALESCE(p_birth_date, birth_date)
  WHERE gym_id = p_gym_id
    AND (phone = p_phone OR phone = REPLACE(p_phone, '-', ''));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_members_by_phones(
  p_gym_id UUID,
  p_phones TEXT[]
)
RETURNS TABLE (
  phone TEXT,
  gender TEXT,
  birth_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.phone, m.gender, m.birth_date
  FROM members m
  WHERE m.gym_id = p_gym_id
    AND m.phone = ANY(p_phones);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PART 4: 034_internal_messenger.sql 함수 재정의
-- =====================================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS find_or_create_dm_room(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_unread_message_count(UUID);
DROP FUNCTION IF EXISTS get_total_unread_count(UUID);

-- 1:1 DM 채팅방 찾기 또는 생성
CREATE OR REPLACE FUNCTION find_or_create_dm_room(
  p_company_id UUID,
  p_staff_id_1 UUID,
  p_staff_id_2 UUID
) RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- 기존 DM 방 찾기
  SELECT cr.id INTO v_room_id
  FROM chat_rooms cr
  WHERE cr.company_id = p_company_id
    AND cr.room_type = 'dm'
    AND EXISTS (
      SELECT 1 FROM chat_room_members crm1
      WHERE crm1.room_id = cr.id AND crm1.staff_id = p_staff_id_1 AND crm1.left_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM chat_room_members crm2
      WHERE crm2.room_id = cr.id AND crm2.staff_id = p_staff_id_2 AND crm2.left_at IS NULL
    )
  LIMIT 1;

  -- 없으면 새로 생성
  IF v_room_id IS NULL THEN
    INSERT INTO chat_rooms (company_id, room_type, created_by)
    VALUES (p_company_id, 'dm', p_staff_id_1)
    RETURNING id INTO v_room_id;

    INSERT INTO chat_room_members (room_id, staff_id)
    VALUES (v_room_id, p_staff_id_1), (v_room_id, p_staff_id_2);
  END IF;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 안읽은 메시지 수 조회
CREATE OR REPLACE FUNCTION get_unread_message_count(p_staff_id UUID)
RETURNS TABLE (room_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.room_id,
    COUNT(*) as unread_count
  FROM chat_messages cm
  JOIN chat_room_members crm ON crm.room_id = cm.room_id AND crm.staff_id = p_staff_id
  WHERE cm.sender_id != p_staff_id
    AND cm.is_deleted = FALSE
    AND (crm.last_read_at IS NULL OR cm.created_at > crm.last_read_at)
    AND crm.left_at IS NULL
  GROUP BY cm.room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 총 안읽은 메시지 수 조회
CREATE OR REPLACE FUNCTION get_total_unread_count(p_staff_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT COALESCE(SUM(unread_count), 0) INTO v_count
  FROM get_unread_message_count(p_staff_id);
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PART 5: 038_meeting_system.sql 함수 재정의
-- =====================================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS get_upcoming_meetings(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_pending_action_items(UUID);
DROP FUNCTION IF EXISTS get_meeting_statistics(UUID, DATE, DATE);

-- 특정 직원의 예정된 회의 목록 조회
CREATE OR REPLACE FUNCTION get_upcoming_meetings(
  p_staff_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  meeting_id UUID,
  title VARCHAR,
  scheduled_at TIMESTAMPTZ,
  meeting_type VARCHAR,
  participant_role VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as meeting_id,
    m.title,
    m.scheduled_at,
    m.meeting_type,
    mp.role as participant_role
  FROM meetings m
  JOIN meeting_participants mp ON mp.meeting_id = m.id
  WHERE mp.staff_id = p_staff_id
    AND m.status = 'scheduled'
    AND m.scheduled_at >= NOW()
  ORDER BY m.scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 특정 직원의 미완료 액션 아이템 조회
CREATE OR REPLACE FUNCTION get_pending_action_items(
  p_staff_id UUID
)
RETURNS TABLE (
  action_item_id UUID,
  title VARCHAR,
  due_date DATE,
  priority VARCHAR,
  meeting_title VARCHAR,
  meeting_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mai.id as action_item_id,
    mai.title,
    mai.due_date,
    mai.priority,
    m.title as meeting_title,
    m.id as meeting_id
  FROM meeting_action_items mai
  JOIN meetings m ON m.id = mai.meeting_id
  WHERE mai.assignee_id = p_staff_id
    AND mai.status IN ('pending', 'in_progress')
  ORDER BY
    CASE WHEN mai.due_date IS NULL THEN 1 ELSE 0 END,
    mai.due_date ASC,
    CASE mai.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 회의 통계 조회
CREATE OR REPLACE FUNCTION get_meeting_statistics(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_meetings BIGINT,
  completed_meetings BIGINT,
  cancelled_meetings BIGINT,
  total_duration_minutes BIGINT,
  total_action_items BIGINT,
  completed_action_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT m.id) as total_meetings,
    COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_meetings,
    COUNT(DISTINCT CASE WHEN m.status = 'cancelled' THEN m.id END) as cancelled_meetings,
    COALESCE(SUM(m.duration_minutes), 0) as total_duration_minutes,
    COUNT(mai.id) as total_action_items,
    COUNT(CASE WHEN mai.status = 'completed' THEN mai.id END) as completed_action_items
  FROM meetings m
  LEFT JOIN meeting_action_items mai ON mai.meeting_id = m.id
  WHERE m.company_id = p_company_id
    AND m.scheduled_at >= p_start_date
    AND m.scheduled_at < p_end_date + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PART 6: 039_consultation_system.sql 함수 재정의
-- =====================================================

-- 상담 상태 변경 로그 트리거 함수
CREATE OR REPLACE FUNCTION log_consultation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO consultation_logs (
      consultation_id,
      action_type,
      old_value,
      new_value,
      performed_by
    )
    SELECT
      NEW.id,
      'status_changed',
      OLD.status,
      NEW.status,
      s.id
    FROM staffs s
    WHERE s.user_id = auth.uid()
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 상담 통계 조회
CREATE OR REPLACE FUNCTION get_consultation_stats(
  p_gym_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  pending_count BIGINT,
  scheduled_count BIGINT,
  completed_count BIGINT,
  converted_count BIGINT,
  conversion_rate NUMERIC,
  by_channel JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'converted') as converted
    FROM consultations c
    WHERE c.gym_id = p_gym_id
      AND (p_start_date IS NULL OR c.created_at >= p_start_date)
      AND (p_end_date IS NULL OR c.created_at < p_end_date + INTERVAL '1 day')
  ),
  channel_stats AS (
    SELECT jsonb_object_agg(channel, cnt) as by_channel
    FROM (
      SELECT channel, COUNT(*) as cnt
      FROM consultations c
      WHERE c.gym_id = p_gym_id
        AND (p_start_date IS NULL OR c.created_at >= p_start_date)
        AND (p_end_date IS NULL OR c.created_at < p_end_date + INTERVAL '1 day')
      GROUP BY channel
    ) sub
  )
  SELECT
    s.total as total_count,
    s.pending as pending_count,
    s.scheduled as scheduled_count,
    s.completed as completed_count,
    s.converted as converted_count,
    CASE WHEN s.total > 0 THEN ROUND(s.converted::NUMERIC / s.total * 100, 1) ELSE 0 END as conversion_rate,
    COALESCE(cs.by_channel, '{}'::jsonb) as by_channel
  FROM stats s, channel_stats cs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 오늘 상담 목록 조회
CREATE OR REPLACE FUNCTION get_today_consultations(p_gym_id UUID)
RETURNS TABLE (
  id UUID,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  scheduled_time TIME,
  consultation_type VARCHAR,
  assigned_staff_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.customer_name,
    c.customer_phone,
    c.scheduled_time,
    c.consultation_type,
    s.name as assigned_staff_name
  FROM consultations c
  LEFT JOIN staffs s ON s.id = c.assigned_staff_id
  WHERE c.gym_id = p_gym_id
    AND c.scheduled_date = CURRENT_DATE
    AND c.status = 'scheduled'
  ORDER BY c.scheduled_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PART 7: 00_migration_tracker.sql 함수 재정의
-- =====================================================

CREATE OR REPLACE FUNCTION execute_migration(
  p_migration_name VARCHAR,
  p_checksum VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_executed BOOLEAN;
BEGIN
  -- 이미 실행되었는지 확인
  SELECT EXISTS(
    SELECT 1 FROM migration_history
    WHERE migration_name = p_migration_name
  ) INTO v_already_executed;

  IF v_already_executed THEN
    RAISE NOTICE '마이그레이션 [%]는 이미 실행되었습니다. 건너뜁니다.', p_migration_name;
    RETURN FALSE;
  ELSE
    -- 실행 기록 저장
    INSERT INTO migration_history (migration_name, checksum, notes)
    VALUES (p_migration_name, p_checksum, p_notes);

    RAISE NOTICE '마이그레이션 [%] 실행 완료', p_migration_name;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PART 8: membership_types RLS 정책 강화 (테이블 존재 시에만)
-- =====================================================

DO $$
BEGIN
  -- membership_types 테이블이 존재하는 경우에만 정책 수정
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_types' AND table_schema = 'public') THEN
    -- 기존 정책 삭제
    DROP POLICY IF EXISTS "membership_types_select" ON membership_types;
    DROP POLICY IF EXISTS "membership_types_insert" ON membership_types;
    DROP POLICY IF EXISTS "membership_types_update" ON membership_types;
    DROP POLICY IF EXISTS "membership_types_delete" ON membership_types;

    -- 새 정책: 회사 기반 접근 제어
    EXECUTE 'CREATE POLICY "membership_types_select" ON membership_types
      FOR SELECT USING (
        is_system_admin()
        OR company_id = get_my_company_id()
      )';

    EXECUTE 'CREATE POLICY "membership_types_insert" ON membership_types
      FOR INSERT WITH CHECK (
        is_system_admin()
        OR (company_id = get_my_company_id() AND is_admin_or_above())
      )';

    EXECUTE 'CREATE POLICY "membership_types_update" ON membership_types
      FOR UPDATE USING (
        is_system_admin()
        OR (company_id = get_my_company_id() AND is_admin_or_above())
      )';

    EXECUTE 'CREATE POLICY "membership_types_delete" ON membership_types
      FOR DELETE USING (
        is_system_admin()
        OR (company_id = get_my_company_id() AND is_admin_or_above())
      )';

    RAISE NOTICE 'membership_types RLS 정책이 업데이트되었습니다.';
  ELSE
    RAISE NOTICE 'membership_types 테이블이 존재하지 않습니다. 건너뜁니다.';
  END IF;
END $$;

-- =====================================================
-- PART 9: payment_methods RLS 정책 강화 (테이블 존재 시에만)
-- =====================================================

DO $$
BEGIN
  -- payment_methods 테이블이 존재하는 경우에만 정책 수정
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods' AND table_schema = 'public') THEN
    -- 기존 정책 삭제
    DROP POLICY IF EXISTS "payment_methods_select" ON payment_methods;
    DROP POLICY IF EXISTS "payment_methods_insert" ON payment_methods;
    DROP POLICY IF EXISTS "payment_methods_update" ON payment_methods;
    DROP POLICY IF EXISTS "payment_methods_delete" ON payment_methods;

    -- 새 정책: 회사 기반 접근 제어
    EXECUTE 'CREATE POLICY "payment_methods_select" ON payment_methods
      FOR SELECT USING (
        is_system_admin()
        OR company_id = get_my_company_id()
      )';

    EXECUTE 'CREATE POLICY "payment_methods_insert" ON payment_methods
      FOR INSERT WITH CHECK (
        is_system_admin()
        OR (company_id = get_my_company_id() AND is_admin_or_above())
      )';

    EXECUTE 'CREATE POLICY "payment_methods_update" ON payment_methods
      FOR UPDATE USING (
        is_system_admin()
        OR (company_id = get_my_company_id() AND is_admin_or_above())
      )';

    EXECUTE 'CREATE POLICY "payment_methods_delete" ON payment_methods
      FOR DELETE USING (
        is_system_admin()
        OR (company_id = get_my_company_id() AND is_admin_or_above())
      )';

    RAISE NOTICE 'payment_methods RLS 정책이 업데이트되었습니다.';
  ELSE
    RAISE NOTICE 'payment_methods 테이블이 존재하지 않습니다. 건너뜁니다.';
  END IF;
END $$;

-- =====================================================
-- PART 10: 추가 트리거/유틸리티 함수들 (search_path 추가)
-- =====================================================

-- updated_at 자동 업데이트 함수 (일반적으로 사용됨)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '보안 수정 마이그레이션이 완료되었습니다.';
  RAISE NOTICE '- migration_history RLS 활성화';
  RAISE NOTICE '- 19개 SECURITY DEFINER 함수에 search_path 추가';
  RAISE NOTICE '- membership_types, payment_methods RLS 정책 강화';
END $$;
