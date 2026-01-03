import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, repName, phone, businessNum, branchCount, staffCount, email } = body;

    if (!email) {
      return NextResponse.json({ error: "이메일이 필요합니다." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 먼저 세션 기반 인증 시도
    const supabase = await createClient();
    const { data: { user: sessionUser } } = await supabase.auth.getUser();

    // 세션이 없으면 Admin API로 Supabase Auth에 이메일이 등록되어 있는지 확인
    if (!sessionUser) {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error("Auth user list error:", listError);
        return NextResponse.json({ error: "인증 확인 중 오류가 발생했습니다." }, { status: 500 });
      }

      const authUser = users?.find(u => u.email === email);
      if (!authUser) {
        return NextResponse.json({ error: "회원가입이 완료되지 않았습니다. 먼저 계정을 생성해주세요." }, { status: 401 });
      }
    } else {
      // 세션 사용자가 있으면 이메일 일치 확인
      if (email !== sessionUser.email) {
        return NextResponse.json({ error: "인증 정보가 일치하지 않습니다." }, { status: 403 });
      }
    }

    if (!companyName || !repName || !phone || !email) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    // 이미 등록된 이메일인지 확인
    const { data: existingStaff } = await supabaseAdmin
      .from("staffs")
      .select("id")
      .eq("email", email)
      .maybeSingle();

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
      .maybeSingle();

    if (companyError) {
      console.error("[Onboarding] 회사 등록 오류:", companyError);
      throw new Error("회사 등록 실패: " + companyError.message);
    }

    if (!company) {
      throw new Error("회사 등록에 실패했습니다.");
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
      .maybeSingle();

    if (gymError) {
      console.error("[Onboarding] 지점 등록 오류:", gymError);
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      throw new Error("지점 등록 실패: " + gymError.message);
    }

    if (!gym) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      throw new Error("지점 등록에 실패했습니다.");
    }

    // 3. 대표자 staff 등록
    const { error: staffError } = await supabaseAdmin.from("staffs").insert({
      company_id: company.id,
      gym_id: gym.id,
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
  } catch (error: unknown) {
    console.error("Company onboarding error:", error);
    const errorMessage = error instanceof Error ? error.message : "오류가 발생했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
