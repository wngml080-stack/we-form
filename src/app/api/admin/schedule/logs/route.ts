import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

export async function GET(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");
    const companyId = searchParams.get("company_id");
    const limit = parseInt(searchParams.get("limit") || "10");
    const todayOnly = searchParams.get("today_only") === "true";

    if (!gymId || !companyId) {
      return NextResponse.json(
        { error: "gym_id와 company_id는 필수입니다." },
        { status: 400 }
      );
    }

    // 회원/매출 테이블 임시 비활성화 (재연결 예정)
    void gymId; void companyId; void limit; void todayOnly;

    return NextResponse.json({
      success: true,
      logs: [],
      summary: {
        new_member: { count: 0, amount: 0 },
        existing_member: { count: 0, amount: 0 },
        addon: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 },
        total: { count: 0, amount: 0 }
      }
    });

  } catch (error: unknown) {
    console.error("[ScheduleLogs] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
