import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 마이그레이션 시작...\n');

// 1단계: 기존 데이터 삭제
console.log('1️⃣ 기존 데이터 삭제 중...');
const tables = ['attendances', 'payments', 'schedules', 'member_memberships', 'members', 'memberships', 'staffs', 'gyms', 'companies'];

for (const table of tables) {
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.log(`   ⚠️  ${table}: ${error.message}`);
  else console.log(`   ✅ ${table} 삭제 완료`);
}

// 2단계: SQL로 컬럼 추가 (psql 사용)
console.log('\n2️⃣ 컬럼 추가 - psql로 실행해야 합니다...\n');
console.log('아래 명령어를 실행하세요:');
console.log('-----------------------------------');
console.log('psql "postgresql://postgres.ungpvlanxgskqzgkewlk:YOUR_PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres" -f scripts/reset-and-migrate.sql');
console.log('-----------------------------------\n');

console.log('또는 Supabase Dashboard에서:');
console.log('1. https://supabase.com/dashboard/project/ungpvlanxgskqzgkewlk 접속');
console.log('2. 왼쪽 메뉴에서 "SQL Editor" 클릭');
console.log('3. scripts/reset-and-migrate.sql 파일 내용 복사해서 붙여넣기');
console.log('4. Run 버튼 클릭\n');
