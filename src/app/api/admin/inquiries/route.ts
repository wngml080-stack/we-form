import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gym_id = searchParams.get("gym_id");
    const company_id = searchParams.get("company_id");
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");
    const search = searchParams.get("search");

    if (!gym_id) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 문의 목록 조회
    let query = supabase
      .from("inquiries")
      .select("*")
      .eq("gym_id", gym_id)
      .order("created_at", { ascending: false });

    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (channel && channel !== "all") {
      query = query.eq("channel", channel);
    }

    if (start_date) {
      query = query.gte("created_at", `${start_date}T00:00:00`);
    }

    if (end_date) {
      query = query.lte("created_at", `${end_date}T23:59:59`);
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error("[Inquiries API] Error:", error);
      return NextResponse.json({ error: "문의 조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("[Inquiries API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 문의 생성
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const {
      gym_id,
      company_id,
      channel,
      channel_id,
      customer_name,
      customer_phone,
      customer_email,
      inquiry_type,
      subject,
      content,
      priority,
      assigned_staff_id,
      notes,
      tags,
    } = body;

    if (!gym_id || !company_id || !channel || !inquiry_type) {
      return NextResponse.json(
        { error: "gym_id, company_id, channel, inquiry_type이 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 권한 확인
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // 문의 생성
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .insert({
        gym_id,
        company_id,
        channel,
        channel_id,
        customer_name,
        customer_phone,
        customer_email,
        inquiry_type,
        subject,
        content,
        priority: priority || "normal",
        assigned_staff_id,
        notes,
        tags: tags || [],
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("[Inquiries API] Create error:", error);
      return NextResponse.json({ error: "문의 생성 실패" }, { status: 500 });
    }

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error("[Inquiries API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
