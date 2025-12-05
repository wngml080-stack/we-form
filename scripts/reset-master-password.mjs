import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 마스터 계정 비밀번호 재설정 중...\n');

const email = 'a29979910@gmail.com';
const newPassword = 'test1234!';

// Auth 유저 찾기
const { data: users } = await supabase.auth.admin.listUsers();
const authUser = users?.users?.find(u => u.email === email);

if (!authUser) {
  console.log('❌ 계정을 찾을 수 없습니다.');
  process.exit(1);
}

console.log('✅ 계정 발견:', authUser.id);

// 비밀번호 재설정
const { data, error } = await supabase.auth.admin.updateUserById(
  authUser.id,
  {
    password: newPassword,
    email_confirm: true
  }
);

if (error) {
  console.error('❌ 비밀번호 재설정 실패:', error.message);
  process.exit(1);
}

console.log('✅ 비밀번호가 성공적으로 재설정되었습니다!\n');
console.log('📝 새로운 로그인 정보:');
console.log('─────────────────────────────────────────');
console.log('이메일:', email);
console.log('비밀번호:', newPassword);
console.log('역할: system_admin (마스터)');
console.log('─────────────────────────────────────────\n');
console.log('💡 이제 이 정보로 로그인해보세요!');
