import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. 클라이언트(강사앱)에서 보낸 데이터 받기
    const body = await request.json();
    console.log("🚀 [1단계] 데이터 도착:", body);

    // 2. n8n 주소 (스크린샷에 있는 정확한 주소입니다)
    const n8nUrl = "http://localhost:5678/webhook-test/1cf41af6-7856-48e9-94b4-3746860bd0fc";

    console.log("🚀 [2단계] n8n으로 발송 시작:", n8nUrl);

    // 3. n8n으로 데이터 토스! (Proxy)
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("❌ [3단계] n8n 전송 실패:", response.statusText);
      return NextResponse.json({ error: response.statusText }, { status: response.status });
    }

    console.log("✅ [3단계] n8n 전송 성공! (200 OK)");
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ [에러 발생]:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}