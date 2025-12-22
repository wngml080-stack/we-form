import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, jobTitle, joinedAt, companyId, clerkUserId, email } = body;

    // clerkUserId 검증: 요청된 clerkUserId가 실제 로그인한 사용자와 일치하는지
    if (clerkUserId !== userId) {
      return NextResponse.json(
        { error: "인증 정보가 일치하지 않습니다." },
        { status: 403 }
      );
    }

    if (!name || !phone || !companyId || !email) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 이미 등록된 사용자인지 확인 (clerk_user_id로)
    const { data: existingByClerk } = await supabaseAdmin
      .from("staffs")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (existingByClerk) {
      return NextResponse.json({ error: "이미 등록된 사용자입니다." }, { status: 400 });
    }

    // 이미 등록된 이메일인지 확인
    const { data: existingStaff } = await supabaseAdmin
      .from("staffs")
      .select("id")
      .eq("email", email)
      .single();

    if (existingStaff) {
      return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 400 });
    }

    // 회사 존재 확인
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, status")
      .eq("id", companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: "존재하지 않는 회사입니다." }, { status: 400 });
    }

    // staff 등록
    const { error: staffError } = await supabaseAdmin.from("staffs").insert({
      company_id: companyId,
      gym_id: null,
      clerk_user_id: userId,
      email: email,
      name: name,
      phone: phone,
      role: "staff",
      job_title: jobTitle || null,
      joined_at: joinedAt || null,
      employment_status: "가입대기",
    });

    if (staffError) {
      throw new Error("직원 등록 실패: " + staffError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Staff onboarding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
