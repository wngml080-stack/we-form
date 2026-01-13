// 카카오 비즈니스 채널 설정

export const kakaoConfig = {
  restApiKey: process.env.KAKAO_REST_API_KEY || "",
  adminKey: process.env.KAKAO_ADMIN_KEY || "",
  channelId: process.env.KAKAO_CHANNEL_ID || "",
  channelPublicId: process.env.KAKAO_CHANNEL_PUBLIC_ID || "",
  webhookSecret: process.env.KAKAO_WEBHOOK_SECRET || "",
};

// 카카오 API 엔드포인트
export const KAKAO_API = {
  // 채널 메시지 API
  SEND_MESSAGE: "https://kapi.kakao.com/v1/api/talk/channels/message/send",
  // 알림톡 API (별도 서비스 필요)
  ALIMTALK: "https://kapi.kakao.com/v2/api/talk/memo/send",
};

// 메시지 타입
export type KakaoMessageType = "text" | "photo" | "link" | "commerce";

// 카카오 메시지 인터페이스
export interface KakaoTextMessage {
  object_type: "text";
  text: string;
  link?: {
    web_url?: string;
    mobile_web_url?: string;
  };
  button_title?: string;
}

export interface KakaoMessage {
  receiver_uuids?: string[];
  template_object: KakaoTextMessage;
}

// Webhook 이벤트 타입
export interface KakaoWebhookEvent {
  event: "message" | "added" | "blocked";
  user_key: string;
  message?: {
    type: string;
    text?: string;
    photo?: {
      url: string;
      width: number;
      height: number;
    };
  };
  timestamp: number;
}

// 챗봇 스킬 요청 인터페이스
export interface KakaoSkillRequest {
  intent: {
    id: string;
    name: string;
  };
  userRequest: {
    timezone: string;
    params: Record<string, string>;
    block: {
      id: string;
      name: string;
    };
    utterance: string;
    lang: string;
    user: {
      id: string;
      type: string;
      properties: Record<string, string>;
    };
  };
  bot: {
    id: string;
    name: string;
  };
  action: {
    name: string;
    clientExtra: Record<string, unknown>;
    params: Record<string, string>;
    id: string;
    detailParams: Record<string, { origin: string; value: string; groupName: string }>;
  };
}

// 챗봇 스킬 응답 인터페이스
export interface KakaoSkillResponse {
  version: "2.0";
  template: {
    outputs: KakaoSkillOutput[];
    quickReplies?: KakaoQuickReply[];
  };
}

export interface KakaoSkillOutput {
  simpleText?: {
    text: string;
  };
  simpleImage?: {
    imageUrl: string;
    altText: string;
  };
  basicCard?: {
    title?: string;
    description?: string;
    thumbnail?: {
      imageUrl: string;
    };
    buttons?: KakaoButton[];
  };
}

export interface KakaoButton {
  label: string;
  action: "webLink" | "message" | "phone" | "block" | "share";
  webLinkUrl?: string;
  messageText?: string;
  phoneNumber?: string;
  blockId?: string;
}

export interface KakaoQuickReply {
  label: string;
  action: "message" | "block";
  messageText?: string;
  blockId?: string;
}

// 스킬 응답 생성 헬퍼
export function createTextResponse(text: string, quickReplies?: KakaoQuickReply[]): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ simpleText: { text } }],
      quickReplies,
    },
  };
}

export function createCardResponse(
  title: string,
  description: string,
  buttons?: KakaoButton[]
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          basicCard: {
            title,
            description,
            buttons,
          },
        },
      ],
    },
  };
}

export function createQuickReplyResponse(
  text: string,
  quickReplies: { label: string; action: "message" | "block"; messageText?: string; blockId?: string }[]
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ simpleText: { text } }],
      quickReplies: quickReplies.map((qr) => ({
        label: qr.label,
        action: qr.action,
        messageText: qr.action === "message" ? (qr.messageText || qr.label) : undefined,
        blockId: qr.action === "block" ? qr.blockId : undefined,
      })),
    },
  };
}
