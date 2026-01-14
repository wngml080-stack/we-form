import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { error: authError } = await authenticateRequest();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "스케줄 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: signature, error } = await supabase
      .from("signatures")
      .select("id, status, signed_at, signature_data")
      .eq("schedule_id", scheduleId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    return NextResponse.json({
      signature: signature
        ? {
            id: signature.id,
            status: signature.status,
            signedAt: signature.signed_at,
            hasSignature: !!signature.signature_data,
          }
        : null,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
