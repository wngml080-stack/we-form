import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET 환경변수를 설정해주세요");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Error occured", { status: 400 });
  }

  const eventType = evt.type;

  // 유저 생성/로그인 시
  if (eventType === "user.created" || eventType === "session.created") {
    const { id, email_addresses } = evt.data as any;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    // 이메일로 기존 staff 찾기
    const { data: existingStaff } = await supabaseAdmin
      .from("staffs")
      .select("*")
      .eq("email", email)
      .single();

    if (existingStaff) {
      // 기존 staff에 clerk_user_id 업데이트
      await supabaseAdmin
        .from("staffs")
        .update({ clerk_user_id: id })
        .eq("id", existingStaff.id);
    }
    // 미등록 이메일은 승인 대기 (staffs에 없으면 접근 불가)
  }

  // 유저 삭제 시
  if (eventType === "user.deleted") {
    const { id } = evt.data as any;

    await supabaseAdmin
      .from("staffs")
      .update({ clerk_user_id: null, employment_status: "퇴사" })
      .eq("clerk_user_id", id);
  }

  return NextResponse.json({ success: true });
}
