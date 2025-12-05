import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  const { error } = await supabase.rpc('exec_sql', { query: sql }); 
  // 주의: exec_sql 함수가 없으면 실패할 수 있음. 일반적인 REST API로는 DDL 실행 불가.
  // 따라서 postgres-js 같은 라이브러리를 쓰거나, Supabase 대시보드에서 실행해야 함.
  // 하지만 여기서는 DDL 실행을 위해 Supabase SQL Editor를 사용하도록 안내하는 것이 가장 안전함.
  
  return NextResponse.json({ message: "Please run the SQL in Supabase Dashboard SQL Editor manually for security reasons.", sql });
}

