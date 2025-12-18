import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, representative_name, contact_phone, status } = body;

    // 필수 필드 검증
    if (!name || !representative_name) {
      return NextResponse.json(
        { error: "회사명과 대표자명은 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
