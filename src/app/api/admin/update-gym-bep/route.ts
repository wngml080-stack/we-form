import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gym_id, fc_bep, pt_bep } = body;

    if (!gym_id) {
      return NextResponse.json(
        { error: "gym_id는 필수입니다." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const updateData: any = {};
    if (fc_bep !== undefined) updateData.fc_bep = fc_bep;
    if (pt_bep !== undefined) updateData.pt_bep = pt_bep;

    const { error } = await supabaseAdmin
      .from("gyms")
      .update(updateData)
      .eq("id", gym_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
