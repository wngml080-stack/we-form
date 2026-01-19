import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function POST(request: Request) {
  try {
    // 인증 확인 - system_admin만 마이그레이션 실행 가능
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    if (staff.role !== "system_admin") {
      return NextResponse.json({ error: "시스템 관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: '마이그레이션 파일명을 제공해주세요.' }, { status: 400 });
    }

    // 파일명 검증 (path traversal 방지)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: '잘못된 파일명입니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', filename);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `마이그레이션 ${filename}이(가) 성공적으로 실행되었습니다.`
    });
  } catch (error: unknown) {
    console.error('[RunMigration] Error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
