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
    const { companyName, repName, phone, businessNum, branchCount, staffCount, clerkUserId, email } = body;

    // clerkUserId 검증: 요청된 clerkUserId가 실제 로그인한 사용자와 일치하는지
    if (clerkUserId !== userId) {
      return NextResponse.json(
        { error: "인증 정보가 일치하지 않습니다." },
        { status: 403 }
      );
    }

    if (!companyName || !repName || !phone || !email) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 이미 등록된 사용자인지 확인
    const { data: existingStaff } = await supabaseAdmin
      .from("staffs")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (existingStaff) {
      return NextResponse.json({ error: "이미 등록된 사용자입니다." }, { status: 400 });
    }

    // 1. 회사 생성
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName,
        representative_name: repName,
        business_number: businessNum || null,
        branch_count: branchCount ? parseInt(branchCount) : null,
        staff_count: staffCount ? parseInt(staffCount) : null,
        status: "pending",
      })
      .select()
      .single();

    if (companyError) {
      throw new Error("회사 등록 실패: " + companyError.message);
    }

    // 2. 기본 지점 생성 (본사)
    const { data: gym, error: gymError } = await supabaseAdmin
      .from("gyms")
      .insert({
        company_id: company.id,
        name: "본사",
        status: "active",
      })
      .select()
      .single();

    if (gymError) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      throw new Error("지점 등록 실패: " + gymError.message);
    }

    // 3. 대표자 staff 등록
    const { error: staffError } = await supabaseAdmin.from("staffs").insert({
      company_id: company.id,
      gym_id: gym.id,
      clerk_user_id: userId,
      email: email,
      name: repName,
      phone: phone,
      role: "company_admin",
      job_title: "대표",
      employment_status: "가입대기",
    });

    if (staffError) {
      await supabaseAdmin.from("gyms").delete().eq("id", gym.id);
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      throw new Error("직원 등록 실패: " + staffError.message);
    }

    return NextResponse.json({ success: true, companyId: company.id });
  } catch (error: any) {
    console.error("Company onboarding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
