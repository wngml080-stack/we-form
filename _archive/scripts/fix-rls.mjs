import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = "https://ungpvlanxgskqzgkewlk.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ3B2bGFueGdza3F6Z2tld2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUzNTg3MiwiZXhwIjoyMDc5MTExODcyfQ.uBujLzDk2cuDyHxs4C8QUaO34f12_jAnPbeVkALpUbQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 RLS 정책 수정 중...\n');

// SQL 파일 읽기
const sql = readFileSync('scripts/fix-rls-staffs.sql', 'utf8');

// SQL 실행 - 여러 문장을 개별적으로 실행
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  if (statement.includes('DROP POLICY') || statement.includes('CREATE POLICY')) {
    console.log('실행 중:', statement.split('\n')[0] + '...');

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

    if (error) {
      console.error('❌ 에러:', error.message);
      // DROP POLICY 에러는 무시 (이미 없을 수 있음)
      if (!statement.includes('DROP POLICY')) {
        process.exit(1);
      }
    } else {
      console.log('✅ 성공\n');
    }
  }
}

console.log('🎉 RLS 정책 수정 완료!\n');
console.log('이제 로그인을 다시 테스트해보세요.');
