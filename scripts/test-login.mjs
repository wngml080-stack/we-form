import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzU4NzIsImV4cCI6MjA3OTExMTg3Mn0.TTsVv3r66KXu5KBTB_3HMStpIQLzqx-FbfQ8RRCuAuQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔐 로그인 테스트 시작...\n');

const email = 'a29979910@gmail.com';
const password = 'test1234!';

try {
  // 1. 로그인 시도
  console.log('1️⃣ 로그인 시도:', email);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('❌ 로그인 실패:', authError.message);
    process.exit(1);
  }

  console.log('✅ Auth 로그인 성공!');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);

  // 2. 직원 정보 조회
  console.log('\n2️⃣ 직원 정보 조회 중...');
  const { data: staffData, error: staffError } = await supabase
    .from("staffs")
    .select("role, employment_status")
    .eq("user_id", authData.user.id)
    .single();

  if (staffError) {
    console.error('❌ 직원 정보 조회 실패:', staffError.message);
    console.error('   Details:', staffError);
    process.exit(1);
  }

  if (!staffData) {
    console.error('❌ 직원 정보 없음');
    process.exit(1);
  }

  console.log('✅ 직원 정보 조회 성공!');
  console.log('   Role:', staffData.role);
  console.log('   Employment Status:', staffData.employment_status);

  // 3. 퇴사 체크
  console.log('\n3️⃣ 퇴사 여부 체크...');
  if (staffData.employment_status === '퇴사') {
    console.log('❌ 퇴사 처리된 계정');
    process.exit(1);
  }
  console.log('✅ 재직 중 확인');

  // 4. 라우팅 결정
  console.log('\n4️⃣ 라우팅 결정...');
  const roles = ["system_admin", "company_admin", "admin"];
  if (roles.includes(staffData.role)) {
    console.log('✅ /admin 페이지로 이동');
  } else {
    console.log('✅ /staff 페이지로 이동');
  }

  console.log('\n🎉 모든 체크 통과! 로그인 성공!\n');

} catch (error) {
  console.error('❌ 예상치 못한 에러:', error.message);
  process.exit(1);
}
