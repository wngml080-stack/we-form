import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;

    // 시스템 관리자만 회사 생성 가능
    if (!staff || staff.role !== "system_admin") {
      return NextResponse.json(
        { error: "시스템 관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, representative_name, contact_phone, status } = body;

    // 필수 필드 검증
    if (!name || !representative_name) {
      return NextResponse.json(
        { error: "회사명과 대표자명은 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 회사명 중복 체크
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("name", name)
      .single();

    if (existingCompany) {
      return NextResponse.json(
        { error: "이미 존재하는 회사명입니다." },
        { status: 400 }
      );
    }

    // 고객사 생성
    const { data, error } = await supabaseAdmin
      .from("companies")
      .insert({
        name,
        representative_name,
        contact_phone: contact_phone || null,
        status: status || "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Error creating company:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
