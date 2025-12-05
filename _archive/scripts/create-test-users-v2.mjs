import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 테스트 계정 생성 시작...\n');

// 부티크짐 회사/지점 ID (이미 생성됨)
const companyId = '5032fb10-93ab-4b64-b08d-b84e0d28af9f';
const gymId = 'ce8dc5d9-8daa-4078-a998-51d07672f08e';

// 테스트 유저 정보
const testUsers = [
  {
    email: 'loo920@naver.com',
    password: 'test1234!',
    name: '본사담당자',
    role: 'company_admin',
    job_title: '이사'
  },
  {
    email: 'kongkong9922@naver.com',
    password: 'test1234!',
    name: '지점장',
    role: 'admin',
    job_title: '지점장'
  },
  {
    email: 'thdus545@naver.com',
    password: 'test1234!',
    name: '트레이너소연',
    role: 'staff',
    job_title: '필라전임'
  }
];

for (const user of testUsers) {
  console.log(`📧 ${user.email} (${user.role}) 처리 중...`);

  // 1. 기존 auth.users 확인
  const { data: existingAuth } = await supabase.auth.admin.listUsers();
  const authUser = existingAuth?.users?.find(u => u.email === user.email);

  let userId;

  if (authUser) {
    console.log(`   ℹ️  Auth 유저 이미 존재: ${authUser.id}`);
    userId = authUser.id;
  } else {
    // 2. Auth 유저 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name }
    });

    if (authError) {
      console.error(`   ❌ Auth 생성 실패:`, authError.message);
      continue;
    }

    userId = authData.user.id;
    console.log(`   ✅ Auth 유저 생성 완료: ${userId}`);
  }

  // 3. 기존 staff 확인
  const { data: existingStaff } = await supabase
    .from('staffs')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingStaff) {
    console.log(`   ⚠️  Staff 레코드 이미 존재, 업데이트 중...`);

    // 업데이트
    const { error: updateError } = await supabase
      .from('staffs')
      .update({
        company_id: companyId,
        gym_id: gymId,
        name: user.name,
        email: user.email,
        role: user.role,
        job_title: user.job_title,
        employment_status: '재직'
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error(`   ❌ Staff 업데이트 실패:`, updateError.message);
    } else {
      console.log(`   ✅ Staff 업데이트 완료`);
    }
  } else {
    // 4. Staff 레코드 생성
    const { error: staffError } = await supabase
      .from('staffs')
      .insert({
        user_id: userId,
        company_id: companyId,
        gym_id: gymId,
        name: user.name,
        email: user.email,
        role: user.role,
        job_title: user.job_title,
        employment_status: '재직'
      });

    if (staffError) {
      console.error(`   ❌ Staff 생성 실패:`, staffError.message);
      continue;
    }

    console.log(`   ✅ Staff 레코드 생성 완료`);
  }

  console.log(`   🎉 ${user.email} 완료!\n`);
}

console.log('✅ 모든 테스트 계정 처리 완료!\n');
console.log('📝 로그인 정보:');
console.log('─────────────────────────────────────────');
console.log('1. 마스터 (system_admin)');
console.log('   이메일: wngml080@gmail.com');
console.log('   회사: 테스트 헬스장 / 본점');
console.log('');
console.log('2. 본사 (company_admin)');
console.log('   이메일: loo920@naver.com');
console.log('   비밀번호: test1234!');
console.log('   회사: 부티크짐 / 강남점');
console.log('');
console.log('3. 지점장 (admin)');
console.log('   이메일: kongkong9922@naver.com');
console.log('   비밀번호: test1234!');
console.log('   회사: 부티크짐 / 강남점');
console.log('');
console.log('4. 트레이너 (staff)');
console.log('   이메일: thdus545@naver.com');
console.log('   비밀번호: test1234!');
console.log('   회사: 부티크짐 / 강남점');
console.log('─────────────────────────────────────────\n');
