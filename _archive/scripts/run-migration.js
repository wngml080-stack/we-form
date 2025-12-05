const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 마이그레이션 시작...\n');

  try {
    // 1단계: 기존 데이터 삭제
    console.log('1️⃣ 기존 데이터 삭제 중...');
    const tables = ['attendances', 'payments', 'schedules', 'member_memberships', 'members', 'memberships', 'staffs', 'gyms', 'companies'];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.log(`   ⚠️  ${table}: ${error.message}`);
      else console.log(`   ✅ ${table} 삭제 완료`);
    }

    console.log('\n2️⃣ members 테이블 컬럼 추가 중...');
    const alterMembers = `
      ALTER TABLE public.members
        ADD COLUMN IF NOT EXISTS registered_by uuid REFERENCES public.staffs(id),
        ADD COLUMN IF NOT EXISTS trainer_id uuid REFERENCES public.staffs(id),
        ADD COLUMN IF NOT EXISTS exercise_goal text,
        ADD COLUMN IF NOT EXISTS weight numeric,
        ADD COLUMN IF NOT EXISTS body_fat_mass numeric,
        ADD COLUMN IF NOT EXISTS skeletal_muscle_mass numeric;
    `;

    const { error: err1 } = await supabase.rpc('exec_sql', { sql: alterMembers });
    if (err1) console.log('   ⚠️  ', err1.message);
    else console.log('   ✅ members 컬럼 추가 완료');

    console.log('\n3️⃣ schedules 테이블 컬럼 추가 중...');
    const alterSchedules = `
      ALTER TABLE public.schedules
        ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id);
    `;

    const { error: err2 } = await supabase.rpc('exec_sql', { sql: alterSchedules });
    if (err2) console.log('   ⚠️  ', err2.message);
    else console.log('   ✅ schedules 컬럼 추가 완료');

    console.log('\n4️⃣ permission_requests 테이블 생성 중...');
    const createPermissions = `
      CREATE TABLE IF NOT EXISTS public.permission_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id uuid NOT NULL REFERENCES public.staffs(id) ON DELETE CASCADE,
        company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        requested_permission text NOT NULL,
        reason text,
        status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        requested_at timestamptz NOT NULL DEFAULT now(),
        reviewed_at timestamptz,
        reviewed_by uuid REFERENCES public.staffs(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;
    `;

    const { error: err3 } = await supabase.rpc('exec_sql', { sql: createPermissions });
    if (err3) console.log('   ⚠️  ', err3.message);
    else console.log('   ✅ permission_requests 테이블 생성 완료');

    console.log('\n✅ 마이그레이션 완료!\n');
    console.log('📝 다음 단계:');
    console.log('   1. 애플리케이션 새로고침');
    console.log('   2. 회원가입으로 새 데이터 생성');
    console.log('   3. 역할별 접근 테스트\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

runMigration();
