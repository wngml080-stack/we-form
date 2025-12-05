import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 테스트 계정 생성 시작...\n');

// 1. 부티크짐 회사 생성
console.log('1️⃣ 회사 "부티크짐" 생성 중...');
const { data: company, error: companyError } = await supabase
  .from('companies')
  .insert({ name: '부티크짐', status: 'active' })
  .select()
  .single();

if (companyError) {
  console.error('❌ 회사 생성 실패:', companyError.message);
  process.exit(1);
}
console.log('✅ 회사 생성 완료:', company.id);

// 2. 강남점 지점 생성
console.log('\n2️⃣ 지점 "강남점" 생성 중...');
const { data: gym, error: gymError } = await supabase
  .from('gyms')
  .insert({ company_id: company.id, name: '강남점' })
  .select()
  .single();

if (gymError) {
  console.error('❌ 지점 생성 실패:', gymError.message);
  process.exit(1);
}
console.log('✅ 지점 생성 완료:', gym.id);

// 3. 테스트 유저 생성
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

console.log('\n3️⃣ 테스트 유저 생성 중...\n');

for (const user of testUsers) {
  console.log(`   📧 ${user.email} (${user.role}) 생성 중...`);

  // Auth 유저 생성
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

  // Staff 레코드 생성
  const { error: staffError } = await supabase
    .from('staffs')
    .insert({
      user_id: authData.user.id,
      company_id: company.id,
      gym_id: gym.id,
      name: user.name,
      email: user.email,
      role: user.role,
      job_title: user.job_title,
      employment_status: '재직'
    });

  if (staffError) {
    console.error(`   ❌ Staff 생성 실패:`, staffError.message);
    // Auth 유저 삭제 (롤백)
    await supabase.auth.admin.deleteUser(authData.user.id);
    continue;
  }

  console.log(`   ✅ ${user.email} 생성 완료 (비밀번호: ${user.password})`);
}

console.log('\n✅ 모든 테스트 계정 생성 완료!\n');
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
