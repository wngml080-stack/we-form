import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

export async function GET() {
  // 인증 확인 - system_admin만 접근 가능
  const { staff, error: authError } = await authenticateRequest();
  if (authError) return authError;
  if (!staff) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  if (staff.role !== "system_admin") {
    return NextResponse.json({ error: "시스템 관리자 권한이 필요합니다." }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();

  const sql = `
    -- 1. 급여 구성요소 (Components)
    create table if not exists salary_components (
      id uuid primary key default gen_random_uuid(),
      gym_id uuid references gyms(id) on delete cascade not null,
      name text not null,
      type text not null check (type in ('fixed', 'variable', 'computed')), 
      is_taxable boolean default true,
      created_at timestamptz default now()
    );

    -- 2. 계산 규칙 (Rules)
    create table if not exists salary_rules (
      id uuid primary key default gen_random_uuid(),
      gym_id uuid references gyms(id) on delete cascade not null,
      component_id uuid references salary_components(id) on delete cascade,
      name text not null,
      calculation_type text not null check (calculation_type in ('fixed', 'hourly', 'percentage_total', 'percentage_personal', 'tiered')),
      default_parameters jsonb default '{}',
      created_at timestamptz default now()
    );

    -- 3. 급여 템플릿 (Templates)
    create table if not exists salary_templates (
      id uuid primary key default gen_random_uuid(),
      gym_id uuid references gyms(id) on delete cascade not null,
      name text not null,
      description text,
      created_at timestamptz default now()
    );

    -- 4. 템플릿 - 규칙 매핑 (N:M)
    create table if not exists salary_template_items (
      id uuid primary key default gen_random_uuid(),
      template_id uuid references salary_templates(id) on delete cascade not null,
      rule_id uuid references salary_rules(id) on delete cascade not null,
      order_index integer default 0,
      created_at timestamptz default now()
    );

    -- 5. 직원별 급여 설정 (Assignments)
    create table if not exists staff_salary_settings (
      id uuid primary key default gen_random_uuid(),
      staff_id uuid references staffs(id) on delete cascade not null,
      template_id uuid references salary_templates(id) on delete set null,
      personal_parameters jsonb default '{}',
      valid_from date not null default current_date,
      valid_to date,
      created_at timestamptz default now()
    );

    -- RLS 활성화
    alter table salary_components enable row level security;
    alter table salary_rules enable row level security;
    alter table salary_templates enable row level security;
    alter table salary_template_items enable row level security;
    alter table staff_salary_settings enable row level security;

    -- 정책은 이미 존재할 수 있으므로 예외 처리 없이 생성 시도 (실패하면 무시됨)
    do $$
    begin
      if not exists (select 1 from pg_policies where policyname = 'Enable read for users based on gym_id_comp') then
        create policy "Enable read for users based on gym_id_comp" on salary_components for select using (auth.uid() in (select user_id from staffs where gym_id = salary_components.gym_id));
        create policy "Enable all for admins_comp" on salary_components for all using (auth.uid() in (select user_id from staffs where gym_id = salary_components.gym_id and role in ('admin', 'manager')));
      end if;
      
      if not exists (select 1 from pg_policies where policyname = 'Enable read for users based on gym_id_rule') then
        create policy "Enable read for users based on gym_id_rule" on salary_rules for select using (auth.uid() in (select user_id from staffs where gym_id = salary_rules.gym_id));
        create policy "Enable all for admins_rule" on salary_rules for all using (auth.uid() in (select user_id from staffs where gym_id = salary_rules.gym_id and role in ('admin', 'manager')));
      end if;

      if not exists (select 1 from pg_policies where policyname = 'Enable read for users based on gym_id_tmpl') then
        create policy "Enable read for users based on gym_id_tmpl" on salary_templates for select using (auth.uid() in (select user_id from staffs where gym_id = salary_templates.gym_id));
        create policy "Enable all for admins_tmpl" on salary_templates for all using (auth.uid() in (select user_id from staffs where gym_id = salary_templates.gym_id and role in ('admin', 'manager')));
      end if;
    end
    $$;
  `;

  // DDL은 일반 REST API로 실행 불가 - Supabase 대시보드에서 수동 실행 필요
  return NextResponse.json({ message: "Please run the SQL in Supabase Dashboard SQL Editor manually for security reasons.", sql });
}

