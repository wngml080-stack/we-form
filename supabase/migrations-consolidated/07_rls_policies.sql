-- =====================================================
-- We:Form 통합 마이그레이션 - 07. RLS Policies
-- =====================================================
-- Row Level Security 정책 및 헬퍼 함수
-- =====================================================

-- =====================================================
-- 1. 헬퍼 함수
-- =====================================================

-- 현재 사용자 정보 조회
CREATE OR REPLACE FUNCTION get_current_staff()
RETURNS TABLE(id uuid, company_id uuid, gym_id uuid, role text)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT s.id, s.company_id, s.gym_id, s.role
  FROM staffs s
  WHERE s.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT company_id FROM staffs WHERE user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION get_my_gym_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT gym_id FROM staffs WHERE user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT role FROM staffs WHERE user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION get_my_staff_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT id FROM staffs WHERE user_id = auth.uid() LIMIT 1; $$;

-- 권한 체크 함수
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM staffs WHERE user_id = auth.uid() AND role = 'system_admin'); $$;

CREATE OR REPLACE FUNCTION is_company_admin_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM staffs WHERE user_id = auth.uid() AND role IN ('system_admin', 'company_admin')); $$;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM staffs WHERE user_id = auth.uid() AND role IN ('system_admin', 'company_admin', 'admin')); $$;

-- =====================================================
-- 2. RLS 활성화 및 정책
-- =====================================================

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT USING (is_system_admin() OR id = get_my_company_id());
DROP POLICY IF EXISTS "companies_insert" ON companies;
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (is_system_admin());
DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (is_system_admin() OR (is_company_admin_or_above() AND id = get_my_company_id()));

-- Gyms
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gyms_select" ON gyms;
CREATE POLICY "gyms_select" ON gyms FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "gyms_insert" ON gyms;
CREATE POLICY "gyms_insert" ON gyms FOR INSERT WITH CHECK (is_system_admin() OR (is_company_admin_or_above() AND company_id = get_my_company_id()));
DROP POLICY IF EXISTS "gyms_update" ON gyms;
CREATE POLICY "gyms_update" ON gyms FOR UPDATE USING (is_system_admin() OR (is_company_admin_or_above() AND company_id = get_my_company_id()) OR (is_admin_or_above() AND id = get_my_gym_id()));

-- Staffs
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staffs_select" ON staffs;
CREATE POLICY "staffs_select" ON staffs FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "staffs_insert" ON staffs;
CREATE POLICY "staffs_insert" ON staffs FOR INSERT WITH CHECK (is_system_admin() OR (is_admin_or_above() AND company_id = get_my_company_id()));
DROP POLICY IF EXISTS "staffs_update" ON staffs;
CREATE POLICY "staffs_update" ON staffs FOR UPDATE USING (is_system_admin() OR id = get_my_staff_id() OR (is_admin_or_above() AND company_id = get_my_company_id()));

-- Members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select" ON members;
CREATE POLICY "members_select" ON members FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "members_insert" ON members;
CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR gym_id = get_my_gym_id())));
DROP POLICY IF EXISTS "members_update" ON members;
CREATE POLICY "members_update" ON members FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR gym_id = get_my_gym_id())));

-- Member Memberships
ALTER TABLE member_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_memberships_select" ON member_memberships;
CREATE POLICY "member_memberships_select" ON member_memberships FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "member_memberships_insert" ON member_memberships;
CREATE POLICY "member_memberships_insert" ON member_memberships FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR gym_id = get_my_gym_id())));
DROP POLICY IF EXISTS "member_memberships_update" ON member_memberships;
CREATE POLICY "member_memberships_update" ON member_memberships FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));
DROP POLICY IF EXISTS "member_memberships_delete" ON member_memberships;
CREATE POLICY "member_memberships_delete" ON member_memberships FOR DELETE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Member Payments
ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_payments_select" ON member_payments;
CREATE POLICY "member_payments_select" ON member_payments FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "member_payments_insert" ON member_payments;
CREATE POLICY "member_payments_insert" ON member_payments FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR gym_id = get_my_gym_id())));
DROP POLICY IF EXISTS "member_payments_update" ON member_payments;
CREATE POLICY "member_payments_update" ON member_payments FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Membership Products
ALTER TABLE membership_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_products_select" ON membership_products;
CREATE POLICY "membership_products_select" ON membership_products FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "membership_products_insert" ON membership_products;
CREATE POLICY "membership_products_insert" ON membership_products FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));
DROP POLICY IF EXISTS "membership_products_update" ON membership_products;
CREATE POLICY "membership_products_update" ON membership_products FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedules_select" ON schedules;
CREATE POLICY "schedules_select" ON schedules FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "schedules_insert" ON schedules;
CREATE POLICY "schedules_insert" ON schedules FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR (gym_id = get_my_gym_id() AND staff_id = get_my_staff_id()))));
DROP POLICY IF EXISTS "schedules_update" ON schedules;
CREATE POLICY "schedules_update" ON schedules FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR (gym_id = get_my_gym_id() AND staff_id = get_my_staff_id() AND NOT is_locked))));
DROP POLICY IF EXISTS "schedules_delete" ON schedules;
CREATE POLICY "schedules_delete" ON schedules FOR DELETE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Attendances
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendances_select" ON attendances;
CREATE POLICY "attendances_select" ON attendances FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "attendances_insert" ON attendances;
CREATE POLICY "attendances_insert" ON attendances FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR gym_id = get_my_gym_id())));
DROP POLICY IF EXISTS "attendances_update" ON attendances;
CREATE POLICY "attendances_update" ON attendances FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Monthly Schedule Reports
ALTER TABLE monthly_schedule_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "monthly_schedule_reports_select" ON monthly_schedule_reports;
CREATE POLICY "monthly_schedule_reports_select" ON monthly_schedule_reports FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "monthly_schedule_reports_insert" ON monthly_schedule_reports;
CREATE POLICY "monthly_schedule_reports_insert" ON monthly_schedule_reports FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR staff_id = get_my_staff_id())));
DROP POLICY IF EXISTS "monthly_schedule_reports_update" ON monthly_schedule_reports;
CREATE POLICY "monthly_schedule_reports_update" ON monthly_schedule_reports FOR UPDATE USING (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR (staff_id = get_my_staff_id() AND status = 'draft'))));

-- Salary Components
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "salary_components_select" ON salary_components;
CREATE POLICY "salary_components_select" ON salary_components FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "salary_components_all" ON salary_components;
CREATE POLICY "salary_components_all" ON salary_components FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Salary Rules
ALTER TABLE salary_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "salary_rules_select" ON salary_rules;
CREATE POLICY "salary_rules_select" ON salary_rules FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "salary_rules_all" ON salary_rules;
CREATE POLICY "salary_rules_all" ON salary_rules FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Salary Templates
ALTER TABLE salary_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "salary_templates_select" ON salary_templates;
CREATE POLICY "salary_templates_select" ON salary_templates FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "salary_templates_all" ON salary_templates;
CREATE POLICY "salary_templates_all" ON salary_templates FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Salary Template Items
ALTER TABLE salary_template_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "salary_template_items_select" ON salary_template_items;
CREATE POLICY "salary_template_items_select" ON salary_template_items FOR SELECT USING (
  is_system_admin() OR EXISTS (SELECT 1 FROM salary_templates st WHERE st.id = template_id AND st.company_id = get_my_company_id())
);
DROP POLICY IF EXISTS "salary_template_items_all" ON salary_template_items;
CREATE POLICY "salary_template_items_all" ON salary_template_items FOR ALL USING (
  is_system_admin() OR (is_admin_or_above() AND EXISTS (SELECT 1 FROM salary_templates st WHERE st.id = template_id AND st.company_id = get_my_company_id()))
);

-- Staff Salary Settings
ALTER TABLE staff_salary_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_salary_settings_select" ON staff_salary_settings;
CREATE POLICY "staff_salary_settings_select" ON staff_salary_settings FOR SELECT USING (
  is_system_admin() OR staff_id = get_my_staff_id() OR (is_admin_or_above() AND EXISTS (SELECT 1 FROM staffs s WHERE s.id = staff_id AND s.company_id = get_my_company_id()))
);
DROP POLICY IF EXISTS "staff_salary_settings_all" ON staff_salary_settings;
CREATE POLICY "staff_salary_settings_all" ON staff_salary_settings FOR ALL USING (
  is_system_admin() OR (is_admin_or_above() AND EXISTS (SELECT 1 FROM staffs s WHERE s.id = staff_id AND s.company_id = get_my_company_id()))
);

-- Calculated Salaries
ALTER TABLE calculated_salaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calculated_salaries_select" ON calculated_salaries;
CREATE POLICY "calculated_salaries_select" ON calculated_salaries FOR SELECT USING (is_system_admin() OR (company_id = get_my_company_id() AND (is_admin_or_above() OR staff_id = get_my_staff_id())));
DROP POLICY IF EXISTS "calculated_salaries_all" ON calculated_salaries;
CREATE POLICY "calculated_salaries_all" ON calculated_salaries FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Salary Settings
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "salary_settings_select" ON salary_settings;
CREATE POLICY "salary_settings_select" ON salary_settings FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "salary_settings_all" ON salary_settings;
CREATE POLICY "salary_settings_all" ON salary_settings FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Inquiries
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inquiries_select" ON inquiries;
CREATE POLICY "inquiries_select" ON inquiries FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "inquiries_all" ON inquiries;
CREATE POLICY "inquiries_all" ON inquiries FOR ALL USING (is_system_admin() OR company_id = get_my_company_id());

-- Inquiry Messages
ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inquiry_messages_select" ON inquiry_messages;
CREATE POLICY "inquiry_messages_select" ON inquiry_messages FOR SELECT USING (
  is_system_admin() OR EXISTS (SELECT 1 FROM inquiries i WHERE i.id = inquiry_id AND i.company_id = get_my_company_id())
);
DROP POLICY IF EXISTS "inquiry_messages_all" ON inquiry_messages;
CREATE POLICY "inquiry_messages_all" ON inquiry_messages FOR ALL USING (
  is_system_admin() OR EXISTS (SELECT 1 FROM inquiries i WHERE i.id = inquiry_id AND i.company_id = get_my_company_id())
);

-- Reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reservations_select" ON reservations;
CREATE POLICY "reservations_select" ON reservations FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "reservations_all" ON reservations;
CREATE POLICY "reservations_all" ON reservations FOR ALL USING (is_system_admin() OR company_id = get_my_company_id());

-- Chat Rooms (HQ staff only - gym_id IS NULL)
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT USING (
  is_system_admin() OR (company_id = get_my_company_id() AND is_company_admin_or_above())
);
DROP POLICY IF EXISTS "chat_rooms_all" ON chat_rooms;
CREATE POLICY "chat_rooms_all" ON chat_rooms FOR ALL USING (
  is_system_admin() OR (company_id = get_my_company_id() AND is_company_admin_or_above())
);

-- Chat Room Members
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_room_members_select" ON chat_room_members;
CREATE POLICY "chat_room_members_select" ON chat_room_members FOR SELECT USING (
  is_system_admin() OR staff_id = get_my_staff_id() OR EXISTS (SELECT 1 FROM chat_rooms cr WHERE cr.id = room_id AND cr.company_id = get_my_company_id() AND is_company_admin_or_above())
);
DROP POLICY IF EXISTS "chat_room_members_all" ON chat_room_members;
CREATE POLICY "chat_room_members_all" ON chat_room_members FOR ALL USING (
  is_system_admin() OR EXISTS (SELECT 1 FROM chat_rooms cr WHERE cr.id = room_id AND cr.company_id = get_my_company_id() AND is_company_admin_or_above())
);

-- Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  is_system_admin() OR EXISTS (
    SELECT 1 FROM chat_room_members crm
    JOIN chat_rooms cr ON cr.id = crm.room_id
    WHERE crm.room_id = chat_messages.room_id AND crm.staff_id = get_my_staff_id() AND crm.left_at IS NULL
  )
);
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (
  is_system_admin() OR (sender_id = get_my_staff_id() AND EXISTS (
    SELECT 1 FROM chat_room_members crm WHERE crm.room_id = chat_messages.room_id AND crm.staff_id = get_my_staff_id() AND crm.left_at IS NULL
  ))
);

-- Gym Kakao Channels
ALTER TABLE gym_kakao_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gym_kakao_channels_select" ON gym_kakao_channels;
CREATE POLICY "gym_kakao_channels_select" ON gym_kakao_channels FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "gym_kakao_channels_all" ON gym_kakao_channels;
CREATE POLICY "gym_kakao_channels_all" ON gym_kakao_channels FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Gym Auto Response Settings
ALTER TABLE gym_auto_response_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gym_auto_response_settings_select" ON gym_auto_response_settings;
CREATE POLICY "gym_auto_response_settings_select" ON gym_auto_response_settings FOR SELECT USING (
  is_system_admin() OR EXISTS (SELECT 1 FROM gyms g WHERE g.id = gym_id AND g.company_id = get_my_company_id())
);
DROP POLICY IF EXISTS "gym_auto_response_settings_all" ON gym_auto_response_settings;
CREATE POLICY "gym_auto_response_settings_all" ON gym_auto_response_settings FOR ALL USING (
  is_system_admin() OR (is_admin_or_above() AND EXISTS (SELECT 1 FROM gyms g WHERE g.id = gym_id AND g.company_id = get_my_company_id()))
);

-- Member Activity Logs
ALTER TABLE member_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_activity_logs_select" ON member_activity_logs;
CREATE POLICY "member_activity_logs_select" ON member_activity_logs FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "member_activity_logs_insert" ON member_activity_logs;
CREATE POLICY "member_activity_logs_insert" ON member_activity_logs FOR INSERT WITH CHECK (is_system_admin() OR company_id = get_my_company_id());

-- Member Membership Transfers
ALTER TABLE member_membership_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_membership_transfers_select" ON member_membership_transfers;
CREATE POLICY "member_membership_transfers_select" ON member_membership_transfers FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "member_membership_transfers_insert" ON member_membership_transfers;
CREATE POLICY "member_membership_transfers_insert" ON member_membership_transfers FOR INSERT WITH CHECK (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Member Trainers
ALTER TABLE member_trainers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_trainers_select" ON member_trainers;
CREATE POLICY "member_trainers_select" ON member_trainers FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "member_trainers_all" ON member_trainers;
CREATE POLICY "member_trainers_all" ON member_trainers FOR ALL USING (is_system_admin() OR company_id = get_my_company_id());

-- Member Trainer Transfers
ALTER TABLE member_trainer_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_trainer_transfers_select" ON member_trainer_transfers;
CREATE POLICY "member_trainer_transfers_select" ON member_trainer_transfers FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "member_trainer_transfers_insert" ON member_trainer_transfers;
CREATE POLICY "member_trainer_transfers_insert" ON member_trainer_transfers FOR INSERT WITH CHECK (is_system_admin() OR company_id = get_my_company_id());

-- Signatures (public token access for unsigned)
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signatures_select" ON signatures;
CREATE POLICY "signatures_select" ON signatures FOR SELECT USING (
  is_system_admin() OR EXISTS (SELECT 1 FROM gyms g WHERE g.id = gym_id AND g.company_id = get_my_company_id())
);
DROP POLICY IF EXISTS "signatures_public_read" ON signatures;
CREATE POLICY "signatures_public_read" ON signatures FOR SELECT USING (status = 'pending');  -- For public QR access
DROP POLICY IF EXISTS "signatures_all" ON signatures;
CREATE POLICY "signatures_all" ON signatures FOR ALL USING (
  is_system_admin() OR EXISTS (SELECT 1 FROM gyms g WHERE g.id = gym_id AND g.company_id = get_my_company_id())
);

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "announcements_all" ON announcements;
CREATE POLICY "announcements_all" ON announcements FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- System Announcements (all users read active)
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_announcements_select" ON system_announcements;
CREATE POLICY "system_announcements_select" ON system_announcements FOR SELECT USING (is_active = true OR is_system_admin());
DROP POLICY IF EXISTS "system_announcements_all" ON system_announcements;
CREATE POLICY "system_announcements_all" ON system_announcements FOR ALL USING (is_system_admin());

-- Company Events
ALTER TABLE company_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_events_select" ON company_events;
CREATE POLICY "company_events_select" ON company_events FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "company_events_all" ON company_events;
CREATE POLICY "company_events_all" ON company_events FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Gym Expenses
ALTER TABLE gym_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gym_expenses_select" ON gym_expenses;
CREATE POLICY "gym_expenses_select" ON gym_expenses FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "gym_expenses_all" ON gym_expenses;
CREATE POLICY "gym_expenses_all" ON gym_expenses FOR ALL USING (is_system_admin() OR company_id = get_my_company_id());

-- Expense Categories
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_categories_select" ON expense_categories;
CREATE POLICY "expense_categories_select" ON expense_categories FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "expense_categories_all" ON expense_categories;
CREATE POLICY "expense_categories_all" ON expense_categories FOR ALL USING (is_system_admin() OR company_id = get_my_company_id());

-- User Google Tokens
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_google_tokens_select" ON user_google_tokens;
CREATE POLICY "user_google_tokens_select" ON user_google_tokens FOR SELECT USING (is_system_admin() OR staff_id = get_my_staff_id());
DROP POLICY IF EXISTS "user_google_tokens_all" ON user_google_tokens;
CREATE POLICY "user_google_tokens_all" ON user_google_tokens FOR ALL USING (is_system_admin() OR staff_id = get_my_staff_id());

-- Attendance Statuses (공통 코드, 모두 읽기 가능)
ALTER TABLE attendance_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_statuses_select" ON attendance_statuses;
CREATE POLICY "attendance_statuses_select" ON attendance_statuses FOR SELECT USING (true);
DROP POLICY IF EXISTS "attendance_statuses_all" ON attendance_statuses;
CREATE POLICY "attendance_statuses_all" ON attendance_statuses FOR ALL USING (is_system_admin());

-- Sale Types
ALTER TABLE sale_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sale_types_select" ON sale_types;
CREATE POLICY "sale_types_select" ON sale_types FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "sale_types_all" ON sale_types;
CREATE POLICY "sale_types_all" ON sale_types FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Membership Categories
ALTER TABLE membership_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_categories_select" ON membership_categories;
CREATE POLICY "membership_categories_select" ON membership_categories FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "membership_categories_all" ON membership_categories;
CREATE POLICY "membership_categories_all" ON membership_categories FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Membership Names
ALTER TABLE membership_names ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_names_select" ON membership_names;
CREATE POLICY "membership_names_select" ON membership_names FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "membership_names_all" ON membership_names;
CREATE POLICY "membership_names_all" ON membership_names FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- Payment Methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_methods_select" ON payment_methods;
CREATE POLICY "payment_methods_select" ON payment_methods FOR SELECT USING (is_system_admin() OR company_id = get_my_company_id());
DROP POLICY IF EXISTS "payment_methods_all" ON payment_methods;
CREATE POLICY "payment_methods_all" ON payment_methods FOR ALL USING (is_system_admin() OR (company_id = get_my_company_id() AND is_admin_or_above()));

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$ BEGIN RAISE NOTICE 'RLS 정책이 성공적으로 적용되었습니다!'; END $$;
