import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const gymId = searchParams.get("gym_id");

    if (!gymId) {
      return NextResponse.json(
        { error: "gym_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("salary_settings")
      .select("*")
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("급여 설정 조회 실패:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { gym_id, attendance_code, pay_type, amount, rate, memo } = body;

    if (!gym_id) {
      return NextResponse.json(
        { error: "gym_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("salary_settings")
      .insert({
        gym_id,
        attendance_code: attendance_code || null,
        pay_type: pay_type || "fixed",
        amount: amount || null,
        rate: rate || null,
        memo: memo || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("급여 설정 생성 실패:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
