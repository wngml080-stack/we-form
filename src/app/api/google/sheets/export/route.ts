import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/google/config";
import {
  createSpreadsheet,
  formatMembersForSheet,
  formatSalesForSheet,
  formatSchedulesForSheet,
} from "@/lib/google/sheets";
import { decrypt, encrypt } from "@/lib/utils/encryption";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExportType = "members" | "sales" | "schedules" | "all";

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError || !staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { type = "all", dateRange } = await request.json() as {
      type?: ExportType;
      dateRange?: { start: string; end: string };
    };

    const supabase = getSupabaseAdmin();
    const gymId = staff.gym_id;

    if (!gymId) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    // Google 토큰 조회
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_google_tokens")
      .select("access_token, refresh_token, token_expires_at")
      .eq("staff_id", staff.id)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "Google 계정을 먼저 연동해주세요.", needsConnect: true },
        { status: 400 }
      );
    }

    // 암호화된 토큰 복호화
    let accessToken = decrypt(tokenData.access_token);
    const refreshToken = tokenData.refresh_token ? decrypt(tokenData.refresh_token) : null;

    // 토큰 만료 확인 및 갱신
    if (new Date(tokenData.token_expires_at) < new Date()) {
      if (!refreshToken) {
        return NextResponse.json(
          { error: "Google 계정을 다시 연동해주세요.", needsConnect: true },
          { status: 400 }
        );
      }

      try {
        const newTokens = await refreshAccessToken(refreshToken);
        accessToken = newTokens.access_token;

        // 새 토큰 저장 (암호화)
        await supabase
          .from("user_google_tokens")
          .update({
            access_token: encrypt(newTokens.access_token),
            token_expires_at: new Date(
              Date.now() + newTokens.expires_in * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("staff_id", staff.id);
      } catch (refreshError) {
        console.error("[Sheets Export] Token refresh failed:", refreshError);
        return NextResponse.json(
          { error: "Google 계정을 다시 연동해주세요.", needsConnect: true },
          { status: 400 }
        );
      }
    }

    // 데이터 조회
    const sheets = [];
    const today = new Date().toISOString().split("T")[0];
    const startDate = dateRange?.start || today;
    const endDate = dateRange?.end || today;

    // 회원 데이터
    if (type === "members" || type === "all") {
      const { data: members } = await supabase
        .from("members")
        .select(`
          name,
          phone,
          gender,
          birth_date,
          memberships (
            membership_type,
            start_date,
            end_date,
            status
          ),
          staff:trainer_id (
            name
          )
        `)
        .eq("gym_id", gymId)
        .order("name");

      if (members && members.length > 0) {
        const formattedMembers = members.map((m) => {
          const membership = Array.isArray(m.memberships)
            ? m.memberships[0]
            : m.memberships;
          const trainer = Array.isArray(m.staff) ? m.staff[0] : m.staff;

          return {
            name: m.name,
            phone: m.phone || undefined,
            gender: m.gender || undefined,
            birth_date: m.birth_date || undefined,
            membership_type: membership?.membership_type || undefined,
            start_date: membership?.start_date || undefined,
            end_date: membership?.end_date || undefined,
            status: membership?.status || undefined,
            trainer_name: (trainer as { name?: string } | null)?.name || undefined,
          };
        });

        sheets.push(formatMembersForSheet(formattedMembers));
      }
    }

    // 매출 데이터
    if (type === "sales" || type === "all") {
      const { data: sales } = await supabase
        .from("payments")
        .select(`
          payment_date,
          amount,
          payment_method,
          members (name),
          products (name),
          staff (name)
        `)
        .eq("gym_id", gymId)
        .gte("payment_date", startDate)
        .lte("payment_date", endDate)
        .order("payment_date", { ascending: false });

      if (sales && sales.length > 0) {
        const formattedSales = sales.map((s) => {
          const member = Array.isArray(s.members) ? s.members[0] : s.members;
          const product = Array.isArray(s.products) ? s.products[0] : s.products;
          const staffMember = Array.isArray(s.staff) ? s.staff[0] : s.staff;

          return {
            date: s.payment_date,
            member_name: (member as { name?: string } | null)?.name || "미지정",
            product_name: (product as { name?: string } | null)?.name || "미지정",
            amount: Number(s.amount) || 0,
            payment_method: s.payment_method || undefined,
            staff_name: (staffMember as { name?: string } | null)?.name || undefined,
          };
        });

        sheets.push(formatSalesForSheet(formattedSales));
      }
    }

    // 일정 데이터
    if (type === "schedules" || type === "all") {
      const { data: schedules } = await supabase
        .from("schedules")
        .select(`
          scheduled_date,
          start_time,
          status,
          members (name),
          staff (name),
          lesson_types (name)
        `)
        .eq("gym_id", gymId)
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .order("scheduled_date", { ascending: false });

      if (schedules && schedules.length > 0) {
        const formattedSchedules = schedules.map((s) => {
          const member = Array.isArray(s.members) ? s.members[0] : s.members;
          const trainer = Array.isArray(s.staff) ? s.staff[0] : s.staff;
          const lessonType = Array.isArray(s.lesson_types) ? s.lesson_types[0] : s.lesson_types;

          return {
            date: s.scheduled_date,
            time: s.start_time || "",
            member_name: (member as { name?: string } | null)?.name || "미지정",
            trainer_name: (trainer as { name?: string } | null)?.name || "미지정",
            lesson_type: (lessonType as { name?: string } | null)?.name || "미지정",
            status: s.status || "",
          };
        });

        sheets.push(formatSchedulesForSheet(formattedSchedules));
      }
    }

    if (sheets.length === 0) {
      return NextResponse.json(
        { error: "내보낼 데이터가 없습니다." },
        { status: 400 }
      );
    }

    // 스프레드시트 생성
    const title = `Weform 데이터 내보내기 - ${new Date().toLocaleDateString("ko-KR")}`;
    const result = await createSpreadsheet(accessToken, title, sheets);

    return NextResponse.json({
      success: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl,
      sheetsCount: sheets.length,
    });
  } catch (error) {
    console.error("[Sheets Export] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "데이터 내보내기 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
