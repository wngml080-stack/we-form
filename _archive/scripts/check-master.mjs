import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 a29979910@gmail.com 계정 확인 중...\n');

// Auth 유저 확인
const { data: users } = await supabase.auth.admin.listUsers();
const authUser = users?.users?.find(u => u.email === 'a29979910@gmail.com');

if (authUser) {
  console.log('✅ Auth 유저 존재:', authUser.id);
  console.log('   이메일:', authUser.email);
  console.log('   이메일 확인됨:', authUser.email_confirmed_at ? 'Yes' : 'No');

  // Staff 레코드 확인
  const { data: staff, error } = await supabase
    .from('staffs')
    .select('*')
    .eq('user_id', authUser.id)
    .single();

  if (staff) {
    console.log('\n✅ Staff 레코드 존재:');
    console.log('   ID:', staff.id);
    console.log('   이름:', staff.name);
    console.log('   역할:', staff.role);
    console.log('   회사 ID:', staff.company_id);
    console.log('   지점 ID:', staff.gym_id);
    console.log('   재직 상태:', staff.employment_status);
  } else {
    console.log('\n❌ Staff 레코드 없음');
    if (error) console.log('   에러:', error.message);
  }
} else {
  console.log('❌ Auth 유저 없음');
}
