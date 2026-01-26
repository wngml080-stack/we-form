import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import crypto from "crypto";

/**
 * 초대 코드 생성
 */
export async function POST(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    if (!staff.company_id) {
      return NextResponse.json(
        { error: "회사 정보가 없습니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { expiresInDays = 7, maxUses = 10 } = body;

    // 6자리 영숫자 초대 코드 생성
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    // 만료일 계산
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const supabaseAdmin = getSupabaseAdmin();

    const { data: inviteCode, error } = await supabaseAdmin
      .from("invite_codes")
      .insert({
        company_id: staff.company_id,
        code,
        created_by: staff.id,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
        used_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[InviteCode] 생성 오류:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      inviteCode: {
        id: inviteCode.id,
        code: inviteCode.code,
        expiresAt: inviteCode.expires_at,
        maxUses: inviteCode.max_uses,
      },
    });
  } catch (error: unknown) {
    console.error("[InviteCode] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * 초대 코드 목록 조회
 */
export async function GET() {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    if (!staff.company_id) {
      return NextResponse.json(
        { error: "회사 정보가 없습니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: inviteCodes, error } = await supabaseAdmin
      .from("invite_codes")
      .select(`
        id,
        code,
        expires_at,
        max_uses,
        used_count,
        is_active,
        created_at,
        created_by,
        staffs!invite_codes_created_by_fkey(name)
      `)
      .eq("company_id", staff.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[InviteCode] 조회 오류:", error);
      throw error;
    }

    return NextResponse.json({ inviteCodes });
  } catch (error: unknown) {
    console.error("[InviteCode] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * 초대 코드 비활성화
 */
export async function DELETE(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get("id");

    if (!codeId) {
      return NextResponse.json(
        { error: "초대 코드 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 회사 소속 확인
    const { data: inviteCode } = await supabaseAdmin
      .from("invite_codes")
      .select("company_id")
      .eq("id", codeId)
      .single();

    if (!inviteCode || inviteCode.company_id !== staff.company_id) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("invite_codes")
      .update({ is_active: false })
      .eq("id", codeId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[InviteCode] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
