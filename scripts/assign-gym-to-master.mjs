import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 마스터 계정에 지점 할당 중...\n');

// 부티크짐 회사/지점 ID
const companyId = '5032fb10-93ab-4b64-b08d-b84e0d28af9f';
const gymId = 'ce8dc5d9-8daa-4078-a998-51d07672f08e';

// 마스터 계정 찾기
const { data: users } = await supabase.auth.admin.listUsers();
const masterUser = users?.users?.find(u => u.email === 'a29979910@gmail.com');

if (!masterUser) {
  console.log('❌ 마스터 계정을 찾을 수 없습니다.');
  process.exit(1);
}

console.log('✅ 마스터 계정 발견:', masterUser.id);

// Staff 레코드 업데이트
const { error } = await supabase
  .from('staffs')
  .update({
    company_id: companyId,
    gym_id: gymId
  })
  .eq('user_id', masterUser.id);

if (error) {
  console.error('❌ 업데이트 실패:', error.message);
  process.exit(1);
}

console.log('✅ 마스터 계정에 지점이 할당되었습니다!\n');
console.log('📝 업데이트된 정보:');
console.log('─────────────────────────────────────────');
console.log('회사 ID:', companyId, '(부티크짐)');
console.log('지점 ID:', gymId, '(강남점)');
console.log('─────────────────────────────────────────\n');
console.log('💡 이제 마스터 계정으로 출석 관리 페이지에 접근할 수 있습니다!');
