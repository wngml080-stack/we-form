import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";
import { getErrorMessage } from "@/types/common";
import type { MeetingCreateInput, MeetingFilters } from "@/types/meeting";

// 회의 목록 조회
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
    const meetingType = searchParams.get("meeting_type");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("meetings")
      .select(`
        id,
        title,
        meeting_type,
        scheduled_at,
        status,
        is_online,
        location,
        created_by,
        creator:staffs!meetings_created_by_fkey(id, name),
        participants:meeting_participants(count),
        action_items:meeting_action_items(count)
      `, { count: "exact" })
      .order("scheduled_at", { ascending: false });

    // 권한에 따른 필터링
    if (staff.role === "system_admin") {
      // 전체 조회 가능
    } else if (staff.role === "company_admin") {
      query = query.eq("company_id", staff.company_id);
    } else {
      // 일반 직원은 회사 내 회의만 조회
      query = query.eq("company_id", staff.company_id);
    }

    // 필터 적용
    if (gymId) {
      query = query.eq("gym_id", gymId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (meetingType) {
      query = query.eq("meeting_type", meetingType);
    }
    if (dateFrom) {
      query = query.gte("scheduled_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("scheduled_at", dateTo);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Meetings GET] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 데이터 변환
    const meetings = data?.map((m) => ({
      id: m.id,
      title: m.title,
      meeting_type: m.meeting_type,
      scheduled_at: m.scheduled_at,
      status: m.status,
      is_online: m.is_online,
      location: m.location,
      participant_count: m.participants?.[0]?.count || 0,
      action_item_count: m.action_items?.[0]?.count || 0,
      creator_name: (m.creator as { id: string; name: string }[] | null)?.[0]?.name || "알 수 없음",
    })) || [];

    return NextResponse.json({
      meetings,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: unknown) {
    console.error("[Meetings GET] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// 회의 생성
export async function POST(request: Request) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // admin 이상만 회의 생성 가능
    if (!["admin", "company_admin", "system_admin"].includes(staff.role)) {
      return NextResponse.json({ error: "회의를 생성할 권한이 없습니다." }, { status: 403 });
    }

    const body: MeetingCreateInput = await request.json();
    const {
      title,
      description,
      meeting_type = "regular",
      scheduled_at,
      location,
      is_online = false,
      online_link,
      gym_id,
      participant_ids = [],
      agendas = [],
    } = body;

    if (!title || !scheduled_at) {
      return NextResponse.json({ error: "제목과 일시는 필수입니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 회의 생성
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        company_id: staff.company_id,
        gym_id: gym_id || staff.gym_id,
        title,
        description,
        meeting_type,
        scheduled_at,
        location,
        is_online,
        online_link,
        status: "scheduled",
        created_by: staff.id,
      })
      .select()
      .single();

    if (meetingError) {
      console.error("[Meetings POST] Error creating meeting:", meetingError);
      return NextResponse.json({ error: meetingError.message }, { status: 500 });
    }

    // 참석자 추가 (주최자 포함)
    const participantInserts = [
      { meeting_id: meeting.id, staff_id: staff.id, role: "organizer" },
      ...participant_ids
        .filter((id) => id !== staff.id)
        .map((id) => ({ meeting_id: meeting.id, staff_id: id, role: "attendee" })),
    ];

    if (participantInserts.length > 0) {
      const { error: participantError } = await supabase
        .from("meeting_participants")
        .insert(participantInserts);

      if (participantError) {
        console.error("[Meetings POST] Error adding participants:", participantError);
      }
    }

    // 안건 추가
    if (agendas.length > 0) {
      const agendaInserts = agendas.map((agenda, index) => ({
        meeting_id: meeting.id,
        title: agenda.title,
        description: agenda.description || null,
        order_index: agenda.order_index ?? index,
        estimated_minutes: agenda.estimated_minutes || null,
        presenter_id: agenda.presenter_id || null,
      }));

      const { error: agendaError } = await supabase
        .from("meeting_agendas")
        .insert(agendaInserts);

      if (agendaError) {
        console.error("[Meetings POST] Error adding agendas:", agendaError);
      }
    }

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Meetings POST] Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
