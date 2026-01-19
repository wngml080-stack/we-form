import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 전화번호로 회원 조회
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const gymId = searchParams.get("gym_id");

    if (!phone || !gymId) {
      return NextResponse.json({ error: "phone과 gym_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gymId)
      .maybeSingle();

    if (!canAccessGym(staff, gymId, gym?.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 전화번호 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/-/g, "");
    const formattedPhone = `${normalizedPhone.slice(0, 3)}-${normalizedPhone.slice(3, 7)}-${normalizedPhone.slice(7)}`;

    // 회원 조회 (정규화된 번호와 포맷된 번호 모두 검색)
    const { data: member, error } = await supabase
      .from("members")
      .select("id, name, phone, status, trainer_id")
      .eq("gym_id", gymId)
      .or(`phone.eq.${normalizedPhone},phone.eq.${formattedPhone}`)
      .maybeSingle();

    if (error) {
      console.error("[Members API] 회원 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ member: null, message: "회원을 찾을 수 없습니다." });
    }

    return NextResponse.json({ member });
  } catch (error: unknown) {
    console.error("[MembersByPhone] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
