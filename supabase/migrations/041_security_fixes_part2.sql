-- =====================================================
-- 보안 고문(Security Advisor) 문제 해결 마이그레이션 Part 2
-- 2026-01-27
-- =====================================================

-- =====================================================
-- PART 1: members 테이블 RLS 활성화 및 정책 생성
-- =====================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- members 테이블 정책 생성
DO $$
BEGIN
  -- 기존 정책 삭제
  DROP POLICY IF EXISTS "members_select" ON members;
  DROP POLICY IF EXISTS "members_insert" ON members;
  DROP POLICY IF EXISTS "members_update" ON members;
  DROP POLICY IF EXISTS "members_delete" ON members;
  DROP POLICY IF EXISTS "members_all" ON members;

  -- 새 정책 생성
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'company_id') THEN
    EXECUTE 'CREATE POLICY "members_select" ON members FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id())';
    EXECUTE 'CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (is_system_admin() OR company_id = get_my_company_id())';
    EXECUTE 'CREATE POLICY "members_update" ON members FOR UPDATE USING (is_system_admin() OR company_id = get_my_company_id())';
    EXECUTE 'CREATE POLICY "members_delete" ON members FOR DELETE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()))';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'gym_id') THEN
    EXECUTE 'CREATE POLICY "members_select" ON members FOR SELECT USING (is_system_admin() OR gym_id = get_my_gym_id())';
    EXECUTE 'CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (is_system_admin() OR gym_id = get_my_gym_id())';
    EXECUTE 'CREATE POLICY "members_update" ON members FOR UPDATE USING (is_system_admin() OR gym_id = get_my_gym_id())';
    EXECUTE 'CREATE POLICY "members_delete" ON members FOR DELETE USING (is_system_admin() OR (gym_id = get_my_gym_id() AND is_admin_or_above()))';
  END IF;
END $$;

-- =====================================================
-- PART 2: 추가 함수들 search_path 설정
-- =====================================================

-- update_membership_products_updated_at
CREATE OR REPLACE FUNCTION update_membership_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- update_chat_room_last_message
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- create_default_leave_types (테이블 존재 시에만)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_types') THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION create_default_leave_types()
      RETURNS TRIGGER AS $trigger$
      BEGIN
        INSERT INTO leave_types (company_id, name, code, deduction_days, is_paid, color, display_order)
        VALUES
          (NEW.id, '연차', 'annual', 1, true, '#4CAF50', 1),
          (NEW.id, '반차(오전)', 'half_am', 0.5, true, '#8BC34A', 2),
          (NEW.id, '반차(오후)', 'half_pm', 0.5, true, '#8BC34A', 3),
          (NEW.id, '병가', 'sick', 1, true, '#FF9800', 4),
          (NEW.id, '경조사', 'family', 1, true, '#9C27B0', 5),
          (NEW.id, '무급휴가', 'unpaid', 1, false, '#607D8B', 6)
        ON CONFLICT (company_id, code) DO NOTHING;
        RETURN NEW;
      END;
      $trigger$ LANGUAGE plpgsql SET search_path = public;
    $func$;
  END IF;
END $$;

-- check_is_admin (DROP 후 재생성)
DROP FUNCTION IF EXISTS check_is_admin();

CREATE FUNCTION check_is_admin()
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
-- PART 3: companies RLS 정책 강화
-- =====================================================

DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert" ON companies
  FOR INSERT WITH CHECK (
    is_system_admin()
  );

-- =====================================================
-- PART 4: gyms RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow all access for now" ON gyms;

  -- company_id 컬럼이 있으면 company_id 사용, 없으면 건너뜀
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gyms' AND column_name = 'company_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gyms' AND policyname = 'gyms_all') THEN
      EXECUTE 'CREATE POLICY "gyms_all" ON gyms FOR ALL USING (is_system_admin() OR company_id = get_my_company_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 5: staffs RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow all access for now" ON staffs;
  DROP POLICY IF EXISTS "staffs_insert" ON staffs;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staffs' AND column_name = 'company_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staffs' AND policyname = 'staffs_all') THEN
      EXECUTE 'CREATE POLICY "staffs_all" ON staffs FOR ALL USING (is_system_admin() OR company_id = get_my_company_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 6: schedules RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow all access for now" ON schedules;

  -- schedules 테이블은 gym_id로 접근 제어 (company_id가 없을 수 있음)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'company_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_all') THEN
      EXECUTE 'CREATE POLICY "schedules_all" ON schedules FOR ALL USING (is_system_admin() OR company_id = get_my_company_id())';
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'gym_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'schedules_all') THEN
      EXECUTE 'CREATE POLICY "schedules_all" ON schedules FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 7: member_payments RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "authenticated_access" ON member_payments;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_payments' AND column_name = 'company_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_payments' AND policyname = 'member_payments_all') THEN
      EXECUTE 'CREATE POLICY "member_payments_all" ON member_payments FOR ALL USING (is_system_admin() OR company_id = get_my_company_id())';
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_payments' AND column_name = 'gym_id') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_payments' AND policyname = 'member_payments_all') THEN
      EXECUTE 'CREATE POLICY "member_payments_all" ON member_payments FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 8: member_trainers RLS 정책 강화 (기존 정책 삭제)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_trainers') THEN
    DROP POLICY IF EXISTS "member_trainers_delete_policy" ON member_trainers;
    DROP POLICY IF EXISTS "member_trainers_insert_policy" ON member_trainers;
    DROP POLICY IF EXISTS "member_trainers_update_policy" ON member_trainers;

    -- company_id 컬럼이 있는 경우에만 정책 생성
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_trainers' AND column_name = 'company_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_select') THEN
        EXECUTE 'CREATE POLICY "member_trainers_select" ON member_trainers FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id())';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_insert') THEN
        EXECUTE 'CREATE POLICY "member_trainers_insert" ON member_trainers FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()))';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_update') THEN
        EXECUTE 'CREATE POLICY "member_trainers_update" ON member_trainers FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()))';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_delete') THEN
        EXECUTE 'CREATE POLICY "member_trainers_delete" ON member_trainers FOR DELETE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()))';
      END IF;
    -- gym_id로 폴백
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_trainers' AND column_name = 'gym_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_select') THEN
        EXECUTE 'CREATE POLICY "member_trainers_select" ON member_trainers FOR SELECT USING (is_system_admin() OR gym_id = get_my_gym_id())';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_insert') THEN
        EXECUTE 'CREATE POLICY "member_trainers_insert" ON member_trainers FOR INSERT WITH CHECK (is_system_admin() OR (gym_id = get_my_gym_id() AND is_admin_or_above()))';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_update') THEN
        EXECUTE 'CREATE POLICY "member_trainers_update" ON member_trainers FOR UPDATE USING (is_system_admin() OR (gym_id = get_my_gym_id() AND is_admin_or_above()))';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainers' AND policyname = 'member_trainers_delete') THEN
        EXECUTE 'CREATE POLICY "member_trainers_delete" ON member_trainers FOR DELETE USING (is_system_admin() OR (gym_id = get_my_gym_id() AND is_admin_or_above()))';
      END IF;
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 9: member_trainer_transfers RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_trainer_transfers') THEN
    DROP POLICY IF EXISTS "member_trainer_transfers_insert_policy" ON member_trainer_transfers;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_trainer_transfers' AND column_name = 'company_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainer_transfers' AND policyname = 'member_trainer_transfers_insert') THEN
        EXECUTE 'CREATE POLICY "member_trainer_transfers_insert" ON member_trainer_transfers FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()))';
      END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'member_trainer_transfers' AND column_name = 'gym_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_trainer_transfers' AND policyname = 'member_trainer_transfers_insert') THEN
        EXECUTE 'CREATE POLICY "member_trainer_transfers_insert" ON member_trainer_transfers FOR INSERT WITH CHECK (is_system_admin() OR (gym_id = get_my_gym_id() AND is_admin_or_above()))';
      END IF;
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 10: salary_settings RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_settings') THEN
    DROP POLICY IF EXISTS "Allow all access for now" ON salary_settings;
    DROP POLICY IF EXISTS "salary_settings_all" ON salary_settings;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_settings' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "salary_settings_all" ON salary_settings FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 11: salary_components RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_components') THEN
    DROP POLICY IF EXISTS "salary_components_delete" ON salary_components;
    DROP POLICY IF EXISTS "salary_components_insert" ON salary_components;
    DROP POLICY IF EXISTS "salary_components_update" ON salary_components;
    DROP POLICY IF EXISTS "salary_components_all" ON salary_components;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_components' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "salary_components_all" ON salary_components FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 12: salary_rules RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_rules') THEN
    DROP POLICY IF EXISTS "salary_rules_delete" ON salary_rules;
    DROP POLICY IF EXISTS "salary_rules_insert" ON salary_rules;
    DROP POLICY IF EXISTS "salary_rules_update" ON salary_rules;
    DROP POLICY IF EXISTS "salary_rules_all" ON salary_rules;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_rules' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "salary_rules_all" ON salary_rules FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 13: salary_template_items RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_template_items') THEN
    DROP POLICY IF EXISTS "salary_template_items_delete" ON salary_template_items;
    DROP POLICY IF EXISTS "salary_template_items_insert" ON salary_template_items;
    DROP POLICY IF EXISTS "salary_template_items_update" ON salary_template_items;
    DROP POLICY IF EXISTS "salary_template_items_all" ON salary_template_items;

    -- salary_template_items는 template_id로 연결되므로 다르게 처리
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_templates') THEN
      EXECUTE 'CREATE POLICY "salary_template_items_all" ON salary_template_items FOR ALL USING (
        is_system_admin()
        OR EXISTS (
          SELECT 1 FROM salary_templates st
          WHERE st.id = salary_template_items.template_id
          AND st.gym_id = get_my_gym_id()
        )
      )';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 14: expense_categories RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_categories') THEN
    DROP POLICY IF EXISTS "Allow all for expense_categories" ON expense_categories;
    DROP POLICY IF EXISTS "Users can view expense categories of their gym" ON expense_categories;
    DROP POLICY IF EXISTS "Users can manage expense categories of their gym" ON expense_categories;
    DROP POLICY IF EXISTS "expense_categories_all" ON expense_categories;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expense_categories' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "expense_categories_all" ON expense_categories FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 15: gym_expenses RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gym_expenses') THEN
    DROP POLICY IF EXISTS "Allow all for gym_expenses" ON gym_expenses;
    DROP POLICY IF EXISTS "Users can view expenses of their gym" ON gym_expenses;
    DROP POLICY IF EXISTS "Users can insert expenses to their gym" ON gym_expenses;
    DROP POLICY IF EXISTS "Users can update expenses of their gym" ON gym_expenses;
    DROP POLICY IF EXISTS "Users can delete expenses of their gym" ON gym_expenses;
    DROP POLICY IF EXISTS "gym_expenses_all" ON gym_expenses;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gym_expenses' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "gym_expenses_all" ON gym_expenses FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 16: sale_types RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_types') THEN
    DROP POLICY IF EXISTS "authenticated_access" ON sale_types;
    DROP POLICY IF EXISTS "sale_types_select" ON sale_types;
    DROP POLICY IF EXISTS "sale_types_all" ON sale_types;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_types' AND column_name = 'company_id') THEN
      EXECUTE 'CREATE POLICY "sale_types_all" ON sale_types FOR ALL USING (is_system_admin() OR company_id = get_my_company_id())';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_types' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "sale_types_all" ON sale_types FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 17: membership_categories RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_categories') THEN
    DROP POLICY IF EXISTS "authenticated_access" ON membership_categories;
    DROP POLICY IF EXISTS "membership_categories_select" ON membership_categories;
    DROP POLICY IF EXISTS "membership_categories_all" ON membership_categories;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_categories' AND column_name = 'company_id') THEN
      EXECUTE 'CREATE POLICY "membership_categories_all" ON membership_categories FOR ALL USING (is_system_admin() OR company_id = get_my_company_id())';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_categories' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "membership_categories_all" ON membership_categories FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 18: membership_names RLS 정책 강화
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_names') THEN
    DROP POLICY IF EXISTS "authenticated_access" ON membership_names;
    DROP POLICY IF EXISTS "membership_names_select" ON membership_names;
    DROP POLICY IF EXISTS "membership_names_all" ON membership_names;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_names' AND column_name = 'company_id') THEN
      EXECUTE 'CREATE POLICY "membership_names_all" ON membership_names FOR ALL USING (is_system_admin() OR company_id = get_my_company_id())';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_names' AND column_name = 'gym_id') THEN
      EXECUTE 'CREATE POLICY "membership_names_all" ON membership_names FOR ALL USING (is_system_admin() OR gym_id = get_my_gym_id())';
    END IF;
  END IF;
END $$;

-- =====================================================
-- PART 19: payment_methods RLS 정책 강화 (기존 정책 삭제)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
    DROP POLICY IF EXISTS "authenticated_access" ON payment_methods;
    -- 040에서 생성한 정책이 있으면 그대로 사용
  END IF;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '보안 수정 마이그레이션 Part 2가 완료되었습니다.';
  RAISE NOTICE '- members RLS 활성화';
  RAISE NOTICE '- 4개 함수 search_path 추가';
  RAISE NOTICE '- 27개 RLS 정책 강화';
END $$;
