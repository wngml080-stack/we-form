import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";

export async function POST(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const n8nUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nUrl) {
      return NextResponse.json(
        { success: false, error: "N8N_WEBHOOK_URL not configured" },
        { status: 200 }
      );
    }

    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error("n8n 전송 실패:", response.status, response.statusText);
        return NextResponse.json(
          { success: false, error: response.statusText },
          { status: 200 }
        );
      }
    } catch (err) {
      console.error("n8n 네트워크 에러:", err);
      return NextResponse.json(
        { success: false, error: "n8n network error" },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("n8n 프록시 에러:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
