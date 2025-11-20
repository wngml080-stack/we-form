import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 👇 추가된 필드들 받기
    const { gymName, managerId, category, size, open_date, memo } = body;

    if (!gymName || !managerId) {
        throw new Error("지점명과 지점장(대기자)을 선택해주세요.");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 지점 생성 (추가된 필드 포함)
    const { data: gymData, error: gymError } = await supabaseAdmin
      .from("gyms")
      .insert({
        name: gymName,
        plan: "enterprise",
        status: "active",
        category,   // 👈 추가
        size,       // 👈 추가
        open_date,  // 👈 추가
        memo        // 👈 추가
      })
      .select()
      .single();

    if (gymError) throw new Error("지점 생성 실패: " + gymError.message);

    // 지점장 연결
    const { error: updateError } = await supabaseAdmin
      .from("staffs")
      .update({
        gym_id: gymData.id,
        role: "admin",
        job_title: "지점장",
        employment_status: "재직"
      })
      .eq("id", managerId);

    if (updateError) {
        await supabaseAdmin.from("gyms").delete().eq("id", gymData.id);
        throw new Error("지점장 임명 실패: " + updateError.message);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}