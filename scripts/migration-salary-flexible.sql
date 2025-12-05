-- 1. 급여 구성요소 (Components)
-- 예: 기본급, 식대, 수업료, 인센티브
create table if not exists salary_components (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('fixed', 'variable', 'computed')), -- 고정, 변동(매월입력), 계산됨
  is_taxable boolean default true,
  created_at timestamptz default now()
);

-- 2. 계산 규칙 (Rules)
-- 예: "매출 5% 인센티브", "시급 1.5만원 계산"
create table if not exists salary_rules (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references gyms(id) on delete cascade not null,
  component_id uuid references salary_components(id) on delete cascade,
  name text not null,
  
  -- 계산 방식 Strategy
  -- 'fixed': 고정값 (예: 기본급 200만원)
  -- 'hourly': 시급 * 시간
  -- 'percentage_total': 총매출 * 비율
  -- 'percentage_personal': 개인매출 * 비율
  -- 'tiered': 구간별 (복잡한 로직)
  calculation_type text not null check (calculation_type in ('fixed', 'hourly', 'percentage_total', 'percentage_personal', 'tiered')),
  
  -- 기본 파라미터 (JSON)
  -- 예: { "amount": 2000000 } 또는 { "rate": 5 }
  default_parameters jsonb default '{}',
  
  created_at timestamptz default now()
);

-- 3. 급여 템플릿 (Templates)
-- 예: "정규직 트레이너", "프리랜서 강사"
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
  order_index integer default 0, -- 계산 순서
  created_at timestamptz default now()
);

-- 5. 직원별 급여 설정 (Assignments)
-- 직원이 어떤 템플릿을 쓰는지 + 개별 변수(오버라이드) 저장
create table if not exists staff_salary_settings (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staffs(id) on delete cascade not null,
  template_id uuid references salary_templates(id) on delete set null,
  
  -- 개별 값 (JSON)
  -- 템플릿의 규칙은 따르되, 값은 다를 수 있음
  -- Key: rule_id, Value: { "amount": 3000000 } 등 파라미터 객체
  personal_parameters jsonb default '{}',
  
  valid_from date not null default current_date,
  valid_to date,
  
  created_at timestamptz default now()
);

-- RLS 정책 (간단하게 gym_id 기준 격리)
alter table salary_components enable row level security;
alter table salary_rules enable row level security;
alter table salary_templates enable row level security;
alter table salary_template_items enable row level security;
alter table staff_salary_settings enable row level security;

-- (기존 정책 패턴 적용 - 예시)
create policy "Enable read for users based on gym_id" on salary_components for select using (auth.uid() in (select user_id from staffs where gym_id = salary_components.gym_id));
create policy "Enable all for admins" on salary_components for all using (auth.uid() in (select user_id from staffs where gym_id = salary_components.gym_id and role in ('admin', 'manager')));

-- 나머지 테이블도 동일하게 적용 (생략 가능하나 안전을 위해 적용 권장)

