// 카카오 채널 메시지 발송 유틸리티

import { kakaoConfig, KAKAO_API, KakaoMessage } from "./config";

// 채널 메시지 발송 (1:1 채팅)
export async function sendChannelMessage(
  userKey: string,
  text: string,
  buttonTitle?: string,
  buttonUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!kakaoConfig.adminKey) {
    return { success: false, error: "KAKAO_ADMIN_KEY가 설정되지 않았습니다." };
  }

  try {
    const messageData: KakaoMessage = {
      receiver_uuids: [userKey],
      template_object: {
        object_type: "text",
        text,
        ...(buttonUrl && {
          link: {
            web_url: buttonUrl,
            mobile_web_url: buttonUrl,
          },
          button_title: buttonTitle || "자세히 보기",
        }),
      },
    };

    const response = await fetch(KAKAO_API.SEND_MESSAGE, {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${kakaoConfig.adminKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        receiver_uuids: JSON.stringify([userKey]),
        template_object: JSON.stringify(messageData.template_object),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Kakao Message] Error:", error);
      return { success: false, error: error.msg || "메시지 발송 실패" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Kakao Message] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "알 수 없는 오류" };
  }
}

// 알림톡 발송 (솔라피, NHN Cloud 등 별도 서비스 사용 권장)
export interface AlimtalkRequest {
  templateId: string;
  recipientNo: string;
  templateParameter?: Record<string, string>;
}

export async function sendAlimtalk(request: AlimtalkRequest): Promise<{ success: boolean; error?: string }> {
  // 알림톡은 별도 서비스(솔라피, NHN Cloud 등)를 통해 발송해야 합니다.
  // 여기서는 인터페이스만 정의하고, 실제 구현은 사용하는 서비스에 맞게 수정 필요

  const alimtalkServiceUrl = process.env.ALIMTALK_SERVICE_URL;
  const alimtalkApiKey = process.env.ALIMTALK_API_KEY;

  if (!alimtalkServiceUrl || !alimtalkApiKey) {
    console.warn("[Alimtalk] 알림톡 서비스가 설정되지 않았습니다.");
    return { success: false, error: "알림톡 서비스 미설정" };
  }

  try {
    // 솔라피 예시 (실제 사용 시 해당 서비스 문서 참조)
    const response = await fetch(alimtalkServiceUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${alimtalkApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          to: request.recipientNo,
          from: process.env.ALIMTALK_SENDER_NUMBER,
          kakaoOptions: {
            pfId: kakaoConfig.channelPublicId,
            templateId: request.templateId,
            variables: request.templateParameter,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "알림톡 발송 실패" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Alimtalk] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "알 수 없는 오류" };
  }
}

// 예약 확인 알림톡 템플릿 발송
export async function sendReservationConfirmation(
  phoneNumber: string,
  customerName: string,
  reservationDate: string,
  reservationTime: string,
  gymName: string
): Promise<{ success: boolean; error?: string }> {
  return sendAlimtalk({
    templateId: "RESERVATION_CONFIRM", // 템플릿 ID는 카카오 비즈니스에서 승인받은 것 사용
    recipientNo: phoneNumber.replace(/-/g, ""),
    templateParameter: {
      customerName,
      reservationDate,
      reservationTime,
      gymName,
    },
  });
}

// 예약 리마인더 알림톡 발송
export async function sendReservationReminder(
  phoneNumber: string,
  customerName: string,
  reservationDate: string,
  reservationTime: string,
  gymName: string,
  gymAddress: string
): Promise<{ success: boolean; error?: string }> {
  return sendAlimtalk({
    templateId: "RESERVATION_REMINDER",
    recipientNo: phoneNumber.replace(/-/g, ""),
    templateParameter: {
      customerName,
      reservationDate,
      reservationTime,
      gymName,
      gymAddress,
    },
  });
}
