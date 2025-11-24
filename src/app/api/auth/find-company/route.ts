import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { businessNumber } = await request.json();

    // 마스터키로 검색 (가입 전이라 권한이 없으므로)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 사업자 번호로 회사 검색
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, representative_name")
      .eq("business_number", businessNumber)
      .single();

    if (error || !data) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, company: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}