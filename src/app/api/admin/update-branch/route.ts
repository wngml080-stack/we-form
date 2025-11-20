import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 👇 추가된 필드들
    const { gymId, gymName, status, newManagerId, category, size, open_date, memo } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 지점 정보 업데이트
    const { error: gymError } = await supabaseAdmin
      .from("gyms")
      .update({ 
          name: gymName, 
          status: status,
          category,   // 👈 추가
          size,       // 👈 추가
          open_date,  // 👈 추가
          memo        // 👈 추가
      })
      .eq("id", gymId);

    if (gymError) throw new Error("지점 수정 실패: " + gymError.message);

    // 관리자 변경 로직 (기존과 동일)
    if (newManagerId && newManagerId !== "none") {
      const { error: staffError } = await supabaseAdmin
        .from("staffs")
        .update({ role: "admin", job_title: "지점장" })
        .eq("id", newManagerId);
      if (staffError) throw new Error("관리자 권한 부여 실패");
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}