import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 👇 managerId (기존 대기자의 staff_id)를 받습니다.
    const { gymName, managerId } = body;

    if (!gymName || !managerId) {
        throw new Error("지점명과 지점장(대기자)을 선택해주세요.");
    }

    // 1. 마스터키 준비
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("🚀 지점 생성 및 지점장 임명 시작:", gymName);

    // 2. 지점(Gym) 생성
    const { data: gymData, error: gymError } = await supabaseAdmin
      .from("gyms")
      .insert({
        name: gymName,
        plan: "enterprise",
        status: "active",
      })
      .select()
      .single();

    if (gymError) throw new Error("지점 생성 실패: " + gymError.message);

    console.log("✅ 지점 생성 완료 ID:", gymData.id);

    // 3. 기존 대기자(Staff) 정보를 업데이트 (지점장으로 승격)
    const { error: updateError } = await supabaseAdmin
      .from("staffs")
      .update({
        gym_id: gymData.id,       // 생성된 지점 소속으로
        role: "admin",            // 관리자 권한 부여
        job_title: "지점장",      // 직책 변경
        employment_status: "재직" // 상태 변경
      })
      .eq("id", managerId);       // 선택한 사람의 ID

    if (updateError) {
        // 실패 시 지점 삭제 (롤백)
        await supabaseAdmin.from("gyms").delete().eq("id", gymData.id);
        throw new Error("지점장 임명 실패: " + updateError.message);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ 에러:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}