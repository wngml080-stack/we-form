import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";

// 휴가 신청 목록 조회
export async function GET(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");
    const status = searchParams.get("status");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("leave_requests")
      .select(`
        *,
        staff:staffs(id, name, email, job_title),
        leave_type:leave_types(id, name, code, color),
        approver:staffs!leave_requests_approved_by_fkey(id, name)
      `)
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`)
      .order("created_at", { ascending: false });

    // 권한에 따른 필터링
    if (staff.role === "system_admin") {
      // 전체 조회 가능
    } else if (staff.role === "company_admin") {
      query = query.eq("company_id", staff.company_id);
    } else if (staff.role === "admin") {
      query = query.eq("gym_id", staff.gym_id);
    } else {
      // 일반 직원은 본인 것만
      query = query.eq("staff_id", staff.id);
    }

    if (gymId) {
      query = query.eq("gym_id", gymId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data });
  } catch (error: unknown) {
    console.error("[LeaveRequests GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 휴가 신청
export async function POST(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { leave_type_id, start_date, end_date, is_half_day, half_day_type, reason, contact_phone } = body;

    if (!leave_type_id || !start_date || !end_date) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 휴가 유형 조회 (차감 일수 확인)
    const { data: leaveType } = await supabase
      .from("leave_types")
      .select("deduction_days")
      .eq("id", leave_type_id)
      .single();

    if (!leaveType) {
      return NextResponse.json({ error: "휴가 유형을 찾을 수 없습니다." }, { status: 404 });
    }

    // 일수 계산
    const start = new Date(start_date);
    const end = new Date(end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = is_half_day ? 0.5 : diffDays * leaveType.deduction_days;

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        staff_id: staff.id,
        company_id: staff.company_id,
        gym_id: staff.gym_id,
        leave_type_id,
        start_date,
        end_date,
        total_days: totalDays,
        is_half_day: is_half_day || false,
        half_day_type,
        reason,
        contact_phone,
        status: "pending",
      })
      .select(`
        *,
        staff:staffs(id, name),
        leave_type:leave_types(id, name, color)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ request: data });
  } catch (error: unknown) {
    console.error("[LeaveRequests POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
