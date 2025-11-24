import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. 클라이언트(강사앱)에서 보낸 데이터 받기
    const body = await request.json();
    console.log("🚀 [n8n Proxy] 데이터 도착:", body);

    // 2. 환경변수에서 n8n Webhook 주소 불러오기
    const n8nUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nUrl) {
      console.error("❌ [n8n Proxy] N8N_WEBHOOK_URL이 설정되어 있지 않습니다.");
      // UX 방해 최소화를 위해 200 반환 + 실패 여부만 알려줌
      return NextResponse.json(
        { success: false, error: "N8N_WEBHOOK_URL not configured" },
        { status: 200 }
      );
    }

    console.log("🚀 [n8n Proxy] n8n으로 발송 시작:", n8nUrl);

    // 3. n8n으로 데이터 토스! (Proxy)
    try {
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(
          "❌ [n8n Proxy] n8n 전송 실패:",
          response.status,
          response.statusText
        );
        // 실패해도 클라이언트 UX는 깨지지 않도록 200으로 응답
        return NextResponse.json(
          { success: false, error: response.statusText },
          { status: 200 }
        );
      }
    } catch (err) {
      console.error("❌ [n8n Proxy] n8n 요청 중 네트워크 에러:", err);
      return NextResponse.json(
        { success: false, error: "n8n network error" },
        { status: 200 }
      );
    }

    console.log("✅ [n8n Proxy] n8n 전송 성공!");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ [n8n Proxy] 요청 파싱 중 에러:", error);
    // 이 경우에는 진짜 서버 문제이므로 500 반환
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}