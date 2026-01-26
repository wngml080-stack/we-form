import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, jobTitle, joinedAt, companyId, email, inviteCode } = body;

    if (!email) {
      return NextResponse.json({ error: "이메일이 필요합니다." }, { status: 400 });
    }

    // 초대 코드가 있으면 검증 (초대 코드 방식)
    // 초대 코드가 없으면 companyId 필수 (기존 방식 - 하위 호환)
    if (!inviteCode && !companyId) {
      return NextResponse.json({ error: "초대 코드 또는 회사 ID가 필요합니다." }, { status: 400 });
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

      // 이메일 인증 여부 확인
      if (!authUser.email_confirmed_at) {
        return NextResponse.json({ error: "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요." }, { status: 401 });
      }
    } else {
      // 세션 사용자가 있으면 이메일 일치 확인
      if (email !== sessionUser.email) {
        return NextResponse.json({ error: "인증 정보가 일치하지 않습니다." }, { status: 403 });
      }

      // 세션 사용자의 이메일 인증 여부 확인
      if (!sessionUser.email_confirmed_at) {
        return NextResponse.json({ error: "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요." }, { status: 401 });
      }
    }

    if (!name || !phone || !email) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    // 이미 등록된 이메일인지 확인
    const { data: existingStaff } = await supabaseAdmin
      .from("staffs")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingStaff) {
      return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 400 });
    }

    let targetCompanyId = companyId;
    let validatedInviteCode = null;

    // 초대 코드 검증
    if (inviteCode) {
      const { data: inviteCodeData, error: inviteError } = await supabaseAdmin
        .from("invite_codes")
        .select("id, company_id, expires_at, max_uses, used_count, is_active")
        .eq("code", inviteCode.toUpperCase())
        .maybeSingle();

      if (inviteError) {
        console.error("Invite code lookup error:", inviteError);
        return NextResponse.json({ error: "초대 코드 확인 중 오류가 발생했습니다." }, { status: 500 });
      }

      if (!inviteCodeData) {
        return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 400 });
      }

      if (!inviteCodeData.is_active) {
        return NextResponse.json({ error: "비활성화된 초대 코드입니다." }, { status: 400 });
      }

      if (new Date(inviteCodeData.expires_at) < new Date()) {
        return NextResponse.json({ error: "만료된 초대 코드입니다." }, { status: 400 });
      }

      if (inviteCodeData.used_count >= inviteCodeData.max_uses) {
        return NextResponse.json({ error: "사용 횟수가 초과된 초대 코드입니다." }, { status: 400 });
      }

      targetCompanyId = inviteCodeData.company_id;
      validatedInviteCode = inviteCodeData;
    }

    // 회사 존재 확인
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, status")
      .eq("id", targetCompanyId)
      .maybeSingle();

    if (companyError) {
      console.error("Company lookup error:", companyError);
      return NextResponse.json({ error: "회사 정보 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!company) {
      return NextResponse.json({ error: "존재하지 않는 회사입니다." }, { status: 400 });
    }

    // staff 등록
    const { data: newStaff, error: staffError } = await supabaseAdmin.from("staffs").insert({
      company_id: targetCompanyId,
      gym_id: null,
      email: email,
      name: name,
      phone: phone,
      role: "staff",
      job_title: jobTitle || null,
      joined_at: joinedAt || null,
      employment_status: "가입대기",
    }).select("id").single();

    if (staffError) {
      throw new Error("직원 등록 실패: " + staffError.message);
    }

    // 초대 코드 사용 기록 및 카운트 증가
    if (validatedInviteCode && newStaff) {
      // 사용 횟수 증가
      await supabaseAdmin
        .from("invite_codes")
        .update({ used_count: validatedInviteCode.used_count + 1 })
        .eq("id", validatedInviteCode.id);

      // 사용 기록 저장
      await supabaseAdmin
        .from("invite_code_usages")
        .insert({
          invite_code_id: validatedInviteCode.id,
          staff_id: newStaff.id,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Staff onboarding error:", error);
    const errorMessage = error instanceof Error ? error.message : "오류가 발생했습니다.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
