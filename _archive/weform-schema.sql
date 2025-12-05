-- ============================================================
-- We:form 초기 ERD 기반 스키마 / RLS 정리 스크립트
-- 실행 위치: Supabase SQL Editor
-- 목적:
--   - 새 도메인 테이블 생성 (회원 / 출석 / 급여 / 로그)
--   - 기존 테이블 멀티테넌시 키 보완
--   - 최소한의 RLS(권한 정책) 적용
--   - 기본 출석 상태 코드 Seed 데이터 삽입
-- ------------------------------------------------------------
-- ⚠️ 주의
-- - 이미 일부 테이블/컬럼/RLS가 존재할 수 있으므로
--   최대한 idempotent 하게(if not exists / drop policy if exists 등) 작성되었습니다.
-- - 운영 DB에 적용하기 전에, 반드시 테스트 프로젝트에서 먼저 검증해 주세요.
-- ============================================================

-- ------------------------------------------------------------
-- 0. 준비: uuid 생성 함수 확실히 사용 가능하게
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. 기존 핵심 테이블 멀티테넌시 키 보완
--    (이미 있으면 아무 일도 일어나지 않음)
-- ------------------------------------------------------------

alter table public.gyms
  add column if not exists company_id uuid
    references public.companies(id) on delete cascade;

alter table public.staffs
  add column if not exists company_id uuid
    references public.companies(id) on delete cascade;

alter table public.staffs
  add column if not exists gym_id uuid
    references public.gyms(id) on delete set null;

alter table public.schedules
  add column if not exists gym_id uuid
    references public.gyms(id) on delete cascade;

do $$
begin
  if not exists (select 1 from pg_class where relname = 'idx_gyms_company_id') then
    create index idx_gyms_company_id on public.gyms(company_id);
  end if;

  if not exists (select 1 from pg_class where relname = 'idx_staffs_company_id') then
    create index idx_staffs_company_id on public.staffs(company_id);
  end if;

  if not exists (select 1 from pg_class where relname = 'idx_staffs_gym_id') then
    create index idx_staffs_gym_id on public.staffs(gym_id);
  end if;

  if not exists (select 1 from pg_class where relname = 'idx_schedules_gym_id') then
    create index idx_schedules_gym_id on public.schedules(gym_id);
  end if;
end$$;

-- ------------------------------------------------------------
-- 2. 매출 로그 / 시스템 로그 테이블
-- ------------------------------------------------------------

create table if not exists public.sales_logs (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  staff_id     uuid references public.staffs(id) on delete set null,
  schedule_id  uuid references public.schedules(id) on delete set null,
  type         text not null,   -- sale / refund / adjust ...
  amount       numeric not null,
  method       text,            -- card / cash / transfer ...
  memo         text,
  occurred_at  timestamptz not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_sales_logs_company_id
  on public.sales_logs(company_id);
create index if not exists idx_sales_logs_gym_id
  on public.sales_logs(gym_id);
create index if not exists idx_sales_logs_staff_id
  on public.sales_logs(staff_id);
create index if not exists idx_sales_logs_occurred_at
  on public.sales_logs(occurred_at desc);

create table if not exists public.system_logs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  gym_id      uuid references public.gyms(id) on delete set null,
  staff_id    uuid references public.staffs(id) on delete set null,
  action      text not null,   -- login / create_schedule / update_member ...
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_system_logs_company_id
  on public.system_logs(company_id);
create index if not exists idx_system_logs_gym_id
  on public.system_logs(gym_id);
create index if not exists idx_system_logs_staff_id
  on public.system_logs(staff_id);
create index if not exists idx_system_logs_action
  on public.system_logs(action);
create index if not exists idx_system_logs_created_at
  on public.system_logs(created_at desc);

-- ------------------------------------------------------------
-- 3. 회원 도메인: members / member_memberships / member_payments
-- ------------------------------------------------------------

create table if not exists public.members (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  gym_id            uuid not null references public.gyms(id) on delete cascade,
  name              text not null,
  phone             text,
  birth_date        date,
  gender            text,
  status            text not null default 'active', -- active / paused / expired ...
  memo              text,
  profile_image_url text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_members_company_id on public.members(company_id);
create index if not exists idx_members_gym_id     on public.members(gym_id);
create index if not exists idx_members_status     on public.members(status);

create table if not exists public.member_memberships (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references public.gyms(id) on delete cascade,
  member_id      uuid not null references public.members(id) on delete cascade,
  name           text not null,          -- 예: PT 30회
  total_sessions integer,
  used_sessions  integer not null default 0,
  start_date     date,
  end_date       date,
  status         text not null default 'active', -- active / frozen / finished ...
  created_at     timestamptz not null default now()
);

create index if not exists idx_member_memberships_gym_id
  on public.member_memberships(gym_id);
create index if not exists idx_member_memberships_member_id
  on public.member_memberships(member_id);
create index if not exists idx_member_memberships_status
  on public.member_memberships(status);

create table if not exists public.member_payments (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  gym_id         uuid not null references public.gyms(id) on delete cascade,
  member_id      uuid not null references public.members(id) on delete cascade,
  membership_id  uuid references public.member_memberships(id) on delete set null,
  sales_log_id   uuid references public.sales_logs(id) on delete set null,
  amount         numeric not null,
  method         text not null,
  memo           text,
  paid_at        timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create index if not exists idx_member_payments_company_id
  on public.member_payments(company_id);
create index if not exists idx_member_payments_gym_id
  on public.member_payments(gym_id);
create index if not exists idx_member_payments_member_id
  on public.member_payments(member_id);

-- ------------------------------------------------------------
-- 4. 출석/급여 도메인: attendance_statuses / salary_settings / attendances
-- ------------------------------------------------------------

create table if not exists public.attendance_statuses (
  code        text primary key,   -- completed / no_show / ...
  label       text not null,      -- UI 표시용 라벨 (예: '출석')
  color       text,               -- Tailwind/HEX (예: 'bg-emerald-500')
  description text
);

-- 기존 salary_settings 가 config_json 기반으로 존재할 수 있으므로,
-- 필요한 컬럼만 확장하는 형태로 설계
create table if not exists public.salary_settings (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references public.gyms(id) on delete cascade,
  config_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.salary_settings
  add column if not exists attendance_code text,
  add column if not exists pay_type        text not null default 'fixed',
  add column if not exists amount          numeric,
  add column if not exists rate            numeric,
  add column if not exists memo            text;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name   = 'attendance_statuses'
  ) and not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_schema    = 'public'
      and table_name      = 'salary_settings'
      and constraint_name = 'salary_settings_attendance_code_fkey'
  ) then
    alter table public.salary_settings
      add constraint salary_settings_attendance_code_fkey
      foreign key (attendance_code)
      references public.attendance_statuses(code)
      on delete restrict;
  end if;
end$$;

create index if not exists idx_salary_settings_gym_id
  on public.salary_settings(gym_id);

do $$
begin
  if not exists (
    select 1 from pg_class where relname = 'idx_salary_settings_attendance_code'
  ) then
    create index idx_salary_settings_attendance_code
      on public.salary_settings(attendance_code);
  end if;
end$$;

create table if not exists public.attendances (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  schedule_id  uuid not null references public.schedules(id) on delete cascade,
  staff_id     uuid not null references public.staffs(id) on delete cascade,
  member_id    uuid references public.members(id) on delete set null,
  status_code  text not null references public.attendance_statuses(code) on delete restrict,
  attended_at  timestamptz not null default now(),
  memo         text
);

create index if not exists idx_attendances_gym_id
  on public.attendances(gym_id);
create index if not exists idx_attendances_schedule_id
  on public.attendances(schedule_id);
create index if not exists idx_attendances_staff_id
  on public.attendances(staff_id);
create index if not exists idx_attendances_member_id
  on public.attendances(member_id);
create index if not exists idx_attendances_status_code
  on public.attendances(status_code);

-- ------------------------------------------------------------
-- 5. 출석 상태 코드 기본 Seed 데이터
-- ------------------------------------------------------------

insert into public.attendance_statuses (code, label, color, description) values
  ('reserved',        '예약',           'bg-blue-500',    '예약 상태 (기본 상태)'),
  ('completed',       '출석',           'bg-emerald-500', '정상 출석 완료'),
  ('no_show',         '노쇼',           'bg-gray-400',    '단순 노쇼'),
  ('no_show_deducted','노쇼(공제)',     'bg-red-500',     '공제 대상 노쇼'),
  ('service',         '서비스',         'bg-sky-500',     '서비스 / 무료 수업')
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- 6. RLS (Row Level Security) 기본 정책
--    - 로그인(authenticated) + 자기 회사/지점 기준 접근
-- ------------------------------------------------------------

-- RLS 활성화
alter table public.members             enable row level security;
alter table public.member_memberships  enable row level security;
alter table public.member_payments     enable row level security;
alter table public.attendance_statuses enable row level security;
alter table public.salary_settings     enable row level security;
alter table public.attendances         enable row level security;
alter table public.sales_logs          enable row level security;
alter table public.system_logs         enable row level security;

-- 6-1. members
drop policy if exists "members_select" on public.members;
create policy "members_select"
on public.members
for select
to authenticated
using (
  exists (
    select 1
    from public.staffs s
    join public.companies c on c.id = s.company_id
    where s.user_id      = auth.uid()
      and s.company_id   = members.company_id
      and s.gym_id       = members.gym_id
      and s.employment_status <> '퇴사'
      and c.status = 'active'
  )
);

drop policy if exists "members_write" on public.members;
create policy "members_write"
on public.members
for all
to authenticated
using (
  exists (
    select 1
    from public.staffs s
    where s.user_id      = auth.uid()
      and s.company_id   = members.company_id
      and s.gym_id       = members.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
)
with check (
  exists (
    select 1
    from public.staffs s
    where s.user_id      = auth.uid()
      and s.company_id   = members.company_id
      and s.gym_id       = members.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
);

-- 6-2. member_memberships
drop policy if exists "member_memberships_select" on public.member_memberships;
create policy "member_memberships_select"
on public.member_memberships
for select
to authenticated
using (
  exists (
    select 1
    from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = member_memberships.gym_id
      and s.employment_status <> '퇴사'
  )
);

drop policy if exists "member_memberships_write" on public.member_memberships;
create policy "member_memberships_write"
on public.member_memberships
for all
to authenticated
using (
  exists (
    select 1
    from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = member_memberships.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
)
with check (
  exists (
    select 1
    from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = member_memberships.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
);

-- 6-3. member_payments
drop policy if exists "member_payments_select" on public.member_payments;
create policy "member_payments_select"
on public.member_payments
for select
to authenticated
using (
  exists (
    select 1
    from public.staffs s
    where s.user_id    = auth.uid()
      and s.company_id = member_payments.company_id
      and s.gym_id     = member_payments.gym_id
      and s.employment_status <> '퇴사'
  )
);

drop policy if exists "member_payments_write" on public.member_payments;
create policy "member_payments_write"
on public.member_payments
for all
to authenticated
using (
  exists (
    select 1
    from public.staffs s
    where s.user_id    = auth.uid()
      and s.company_id = member_payments.company_id
      and s.gym_id     = member_payments.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
)
with check (
  exists (
    select 1
    from public.staffs s
    where s.user_id    = auth.uid()
      and s.company_id = member_payments.company_id
      and s.gym_id     = member_payments.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
);

-- 6-4. attendance_statuses / salary_settings (설정 테이블)
drop policy if exists "attendance_statuses_select" on public.attendance_statuses;
create policy "attendance_statuses_select"
on public.attendance_statuses
for select
to authenticated
using ( true );

drop policy if exists "attendance_statuses_write" on public.attendance_statuses;
create policy "attendance_statuses_write"
on public.attendance_statuses
for all
to authenticated
using (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.role in ('company_admin','admin','system_admin')
      and s.employment_status <> '퇴사'
  )
)
with check (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.role in ('company_admin','admin','system_admin')
      and s.employment_status <> '퇴사'
  )
);

drop policy if exists "salary_settings_select" on public.salary_settings;
create policy "salary_settings_select"
on public.salary_settings
for select
to authenticated
using (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = salary_settings.gym_id
      and s.employment_status <> '퇴사'
  )
);

drop policy if exists "salary_settings_write" on public.salary_settings;
create policy "salary_settings_write"
on public.salary_settings
for all
to authenticated
using (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = salary_settings.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
)
with check (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = salary_settings.gym_id
      and s.employment_status <> '퇴사'
      and s.role in ('company_admin','admin','system_admin')
  )
);

-- 6-5. attendances
drop policy if exists "attendances_select" on public.attendances;
create policy "attendances_select"
on public.attendances
for select
to authenticated
using (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = attendances.gym_id
      and s.employment_status <> '퇴사'
  )
);

drop policy if exists "attendances_write" on public.attendances;
create policy "attendances_write"
on public.attendances
for all
to authenticated
using (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = attendances.gym_id
      and s.employment_status <> '퇴사'
  )
)
with check (
  exists (
    select 1 from public.staffs s
    where s.user_id = auth.uid()
      and s.gym_id  = attendances.gym_id
      and s.employment_status <> '퇴사'
  )
);

-- 6-6. sales_logs / system_logs
drop policy if exists "sales_logs_select" on public.sales_logs;
create policy "sales_logs_select"
on public.sales_logs
for select
to authenticated
using (
  exists (
    select 1 from public.staffs s
    where s.user_id    = auth.uid()
      and s.company_id = sales_logs.company_id
      and s.gym_id     = sales_logs.gym_id
      and s.employment_status <> '퇴사'
  )
);

drop policy if exists "system_logs_select" on public.system_logs;
create policy "system_logs_select"
on public.system_logs
for select
to authenticated
using (
  exists (
    select 1 from public.staffs s
    where s.user_id    = auth.uid()
      and s.company_id = system_logs.company_id
      and (s.gym_id is null or s.gym_id = system_logs.gym_id)
      and s.role in ('company_admin','system_admin')
      and s.employment_status <> '퇴사'
  )
);





