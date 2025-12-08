-- RLS 정책 보완 (INSERT, UPDATE, DELETE 권한 추가)

-- 1. salary_components
drop policy if exists "Enable all for admins" on salary_components;
create policy "Enable all for admins" on salary_components for all 
using (
    exists (
        select 1 from staffs 
        where user_id = auth.uid() 
        and gym_id = salary_components.gym_id 
        and role in ('admin', 'manager')
    )
)
with check (
    exists (
        select 1 from staffs 
        where user_id = auth.uid() 
        and gym_id = salary_components.gym_id 
        and role in ('admin', 'manager')
    )
);

-- 2. salary_rules
drop policy if exists "Enable all for admins" on salary_rules;
create policy "Enable all for admins" on salary_rules for all 
using (
    exists (
        select 1 from staffs 
        where user_id = auth.uid() 
        and gym_id = salary_rules.gym_id 
        and role in ('admin', 'manager')
    )
)
with check (
    exists (
        select 1 from staffs 
        where user_id = auth.uid() 
        and gym_id = salary_rules.gym_id 
        and role in ('admin', 'manager')
    )
);

-- 3. salary_templates
drop policy if exists "Enable all for admins" on salary_templates;
create policy "Enable all for admins" on salary_templates for all 
using (
    exists (
        select 1 from staffs 
        where user_id = auth.uid() 
        and gym_id = salary_templates.gym_id 
        and role in ('admin', 'manager')
    )
)
with check (
    exists (
        select 1 from staffs 
        where user_id = auth.uid() 
        and gym_id = salary_templates.gym_id 
        and role in ('admin', 'manager')
    )
);

-- 4. salary_template_items
-- template_id를 통해 gym_id를 간접 참조해야 해서 복잡함.
-- 간단하게: 인증된 사용자는 생성 가능하도록 하고, 조회 시 필터링하는 전략 사용 가능.
-- 또는 서브쿼리 사용.
drop policy if exists "Enable all for admins" on salary_template_items;
create policy "Enable all for admins" on salary_template_items for all 
using (
    exists (
        select 1 from salary_templates st
        join staffs s on s.gym_id = st.gym_id
        where st.id = salary_template_items.template_id
        and s.user_id = auth.uid()
        and s.role in ('admin', 'manager')
    )
)
with check (
    exists (
        select 1 from salary_templates st
        join staffs s on s.gym_id = st.gym_id
        where st.id = salary_template_items.template_id
        and s.user_id = auth.uid()
        and s.role in ('admin', 'manager')
    )
);

-- 5. staff_salary_settings
drop policy if exists "Enable all for admins" on staff_salary_settings;
create policy "Enable all for admins" on staff_salary_settings for all 
using (
    exists (
        select 1 from staffs s_target
        join staffs s_admin on s_admin.gym_id = s_target.gym_id
        where s_target.id = staff_salary_settings.staff_id
        and s_admin.user_id = auth.uid()
        and s_admin.role in ('admin', 'manager')
    )
)
with check (
    exists (
        select 1 from staffs s_target
        join staffs s_admin on s_admin.gym_id = s_target.gym_id
        where s_target.id = staff_salary_settings.staff_id
        and s_admin.user_id = auth.uid()
        and s_admin.role in ('admin', 'manager')
    )
);

