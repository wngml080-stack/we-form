import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 마스터 계정 생성 시작...\n');

const masterEmail = 'a29979910@gmail.com';
const masterPassword = 'master1234!';

// 1. Auth 유저 확인/생성
const { data: allUsers } = await supabase.auth.admin.listUsers();
const existingUser = allUsers?.users?.find(u => u.email === masterEmail);

let userId;

if (existingUser) {
  console.log('ℹ️  Auth 유저 이미 존재:', existingUser.id);
  userId = existingUser.id;

  // 비밀번호 재설정
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: masterPassword, email_confirm: true }
  );

  if (updateError) {
    console.error('❌ 비밀번호 재설정 실패:', updateError.message);
    process.exit(1);
  }
  console.log('✅ 비밀번호 재설정 완료');
} else {
  console.log('📧 Auth 유저 생성 중...');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: masterEmail,
    password: masterPassword,
    email_confirm: true,
    user_metadata: { name: '마스터2' }
  });

  if (authError) {
    console.error('❌ Auth 생성 실패:', authError.message);
    process.exit(1);
  }

  userId = authData.user.id;
  console.log('✅ Auth 유저 생성 완료:', userId);
}

// 2. Staff 레코드 확인/생성
const { data: existingStaff } = await supabase
  .from('staffs')
  .select('id, role')
  .eq('user_id', userId)
  .single();

if (existingStaff) {
  console.log('\n⚠️  Staff 레코드 이미 존재, system_admin으로 업데이트 중...');

  const { error: updateError } = await supabase
    .from('staffs')
    .update({
      role: 'system_admin',
      employment_status: '재직',
      name: '마스터2',
      email: masterEmail
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('❌ Staff 업데이트 실패:', updateError.message);
    process.exit(1);
  }
  console.log('✅ Staff 업데이트 완료');
} else {
  console.log('\n📝 Staff 레코드 생성 중...');

  const { error: staffError } = await supabase
    .from('staffs')
    .insert({
      user_id: userId,
      name: '마스터2',
      email: masterEmail,
      role: 'system_admin',
      employment_status: '재직'
    });

  if (staffError) {
    console.error('❌ Staff 생성 실패:', staffError.message);
    process.exit(1);
  }
  console.log('✅ Staff 레코드 생성 완료');
}

console.log('\n✅ 마스터 계정 설정 완료!\n');
console.log('📝 로그인 정보:');
console.log('─────────────────────────────────────────');
console.log('이메일: a29979910@gmail.com');
console.log('비밀번호: master1234!');
console.log('역할: system_admin (마스터)');
console.log('권한: 모든 회사/지점 조회 가능');
console.log('─────────────────────────────────────────\n');
