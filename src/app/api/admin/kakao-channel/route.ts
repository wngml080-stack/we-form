import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 지점의 카카오 채널 설정 조회
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");

    if (!gymId) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    // 권한 확인 (관리자만)
    if (!["admin", "company_admin", "system_admin", "manager"].includes(staff.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("gym_kakao_channels")
      .select("*")
      .eq("gym_id", gymId)
      .maybeSingle();

    if (error) {
      console.error("[Kakao Channel API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 민감 정보는 마스킹 처리
    if (data) {
      return NextResponse.json({
        ...data,
        admin_key: data.admin_key ? "****" + data.admin_key.slice(-4) : null,
        rest_api_key: data.rest_api_key ? "****" + data.rest_api_key.slice(-4) : null,
        webhook_secret: data.webhook_secret ? "****" + data.webhook_secret.slice(-4) : null,
        alimtalk_sender_key: data.alimtalk_sender_key ? "****" + data.alimtalk_sender_key.slice(-4) : null,
      });
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error("[Kakao Channel API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 지점의 카카오 채널 설정 저장/수정
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 권한 확인 (관리자만)
    if (!["admin", "company_admin", "system_admin", "manager"].includes(staff.role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const {
      gym_id,
      company_id,
      channel_id,
      channel_public_id,
      channel_name,
      rest_api_key,
      admin_key,
      webhook_secret,
      chatbot_enabled,
      alimtalk_enabled,
      alimtalk_sender_key,
      alimtalk_sender_number,
    } = body;

    if (!gym_id || !company_id) {
      return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
    }

    // 권한 확인
    if (!canAccessGym(staff, gym_id, company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 설정 확인
    const { data: existing } = await supabase
      .from("gym_kakao_channels")
      .select("id, admin_key, rest_api_key, webhook_secret, alimtalk_sender_key")
      .eq("gym_id", gym_id)
      .maybeSingle();

    // 업데이트할 데이터 구성 (빈 값이면 기존 값 유지)
    const updateData: Record<string, unknown> = {
      gym_id,
      company_id,
      channel_id: channel_id || null,
      channel_public_id: channel_public_id || null,
      channel_name: channel_name || null,
      chatbot_enabled: chatbot_enabled ?? false,
      alimtalk_enabled: alimtalk_enabled ?? false,
      alimtalk_sender_number: alimtalk_sender_number || null,
    };

    // API 키들은 마스킹된 값(****)이 아닌 경우에만 업데이트
    if (rest_api_key && !rest_api_key.startsWith("****")) {
      updateData.rest_api_key = rest_api_key;
    } else if (existing) {
      updateData.rest_api_key = existing.rest_api_key;
    }

    if (admin_key && !admin_key.startsWith("****")) {
      updateData.admin_key = admin_key;
    } else if (existing) {
      updateData.admin_key = existing.admin_key;
    }

    if (webhook_secret && !webhook_secret.startsWith("****")) {
      updateData.webhook_secret = webhook_secret;
    } else if (existing) {
      updateData.webhook_secret = existing.webhook_secret;
    }

    if (alimtalk_sender_key && !alimtalk_sender_key.startsWith("****")) {
      updateData.alimtalk_sender_key = alimtalk_sender_key;
    } else if (existing) {
      updateData.alimtalk_sender_key = existing.alimtalk_sender_key;
    }

    let result;
    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from("gym_kakao_channels")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("[Kakao Channel API] Update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // 새로 생성
      const { data, error } = await supabase
        .from("gym_kakao_channels")
        .insert(updateData)
        .select()
        .single();

      if (error) {
        console.error("[Kakao Channel API] Insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    // 응답 시 민감 정보 마스킹
    return NextResponse.json({
      ...result,
      admin_key: result.admin_key ? "****" + result.admin_key.slice(-4) : null,
      rest_api_key: result.rest_api_key ? "****" + result.rest_api_key.slice(-4) : null,
      webhook_secret: result.webhook_secret ? "****" + result.webhook_secret.slice(-4) : null,
      alimtalk_sender_key: result.alimtalk_sender_key ? "****" + result.alimtalk_sender_key.slice(-4) : null,
    });
  } catch (error) {
    console.error("[Kakao Channel API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// 카카오 채널 연동 테스트
export async function PUT(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { gym_id, action } = body;

    if (!gym_id) {
      return NextResponse.json({ error: "gym_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 채널 설정 조회
    const { data: channel } = await supabase
      .from("gym_kakao_channels")
      .select("*")
      .eq("gym_id", gym_id)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "카카오 채널 설정이 없습니다." }, { status: 404 });
    }

    if (action === "verify") {
      // 카카오 API 연결 테스트
      if (!channel.admin_key) {
        return NextResponse.json({ error: "Admin Key가 설정되지 않았습니다." }, { status: 400 });
      }

      try {
        // 카카오 채널 정보 조회 API 호출 테스트
        const response = await fetch("https://kapi.kakao.com/v1/api/talk/channels", {
          method: "GET",
          headers: {
            Authorization: `KakaoAK ${channel.admin_key}`,
          },
        });

        if (response.ok) {
          // 검증 성공
          await supabase
            .from("gym_kakao_channels")
            .update({
              is_verified: true,
              verified_at: new Date().toISOString(),
            })
            .eq("id", channel.id);

          return NextResponse.json({
            success: true,
            message: "카카오 채널 연동이 확인되었습니다.",
          });
        } else {
          const error = await response.json();
          return NextResponse.json({
            success: false,
            message: error.msg || "카카오 API 연결 실패",
          });
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: "카카오 API 연결 중 오류가 발생했습니다.",
        });
      }
    }

    return NextResponse.json({ error: "알 수 없는 액션입니다." }, { status: 400 });
  } catch (error) {
    console.error("[Kakao Channel API] Error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
