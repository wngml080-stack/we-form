import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔑 비밀번호 재설정 시작...\n');

const testUsers = [
  { email: 'loo920@naver.com', password: 'test1234!' },
  { email: 'kongkong9922@naver.com', password: 'test1234!' },
  { email: 'thdus545@naver.com', password: 'test1234!' }
];

// 1. 먼저 auth.users에서 유저 목록 확인
const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
  console.error('❌ 유저 목록 조회 실패:', listError.message);
  process.exit(1);
}

console.log('📋 전체 Auth 유저 목록:');
for (const u of allUsers.users) {
  console.log(`   - ${u.email} (${u.id})`);
}
console.log('');

// 2. 각 테스트 유저의 비밀번호 재설정
for (const user of testUsers) {
  const authUser = allUsers.users.find(u => u.email === user.email);

  if (!authUser) {
    console.log(`⚠️  ${user.email} - Auth 유저 없음, 새로 생성 중...`);

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.email.split('@')[0] }
    });

    if (createError) {
      console.error(`   ❌ 생성 실패:`, createError.message);
    } else {
      console.log(`   ✅ 생성 완료: ${newUser.user.id}`);
    }
  } else {
    console.log(`🔄 ${user.email} - 비밀번호 재설정 중...`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      {
        password: user.password,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error(`   ❌ 재설정 실패:`, updateError.message);
    } else {
      console.log(`   ✅ 비밀번호: ${user.password}`);
    }
  }
}

console.log('\n✅ 비밀번호 재설정 완료!\n');
console.log('📝 로그인 정보:');
console.log('─────────────────────────────────────────');
console.log('loo920@naver.com / test1234!');
console.log('kongkong9922@naver.com / test1234!');
console.log('thdus545@naver.com / test1234!');
console.log('─────────────────────────────────────────\n');
