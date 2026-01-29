// ============================================
// 환경변수 검증 및 타입 안전한 접근
// ============================================

/**
 * 필수 환경변수 목록
 */
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/**
 * 선택적 환경변수 목록 (기능별)
 */
const _optionalEnvVars = [
  // Encryption
  "ENCRYPTION_KEY",
  // Google OAuth
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  // Kakao
  "KAKAO_REST_API_KEY",
  "KAKAO_ADMIN_KEY",
  "KAKAO_CHANNEL_ID",
  "KAKAO_CHANNEL_PUBLIC_ID",
  "KAKAO_WEBHOOK_SECRET",
  // Alimtalk
  "ALIMTALK_SERVICE_URL",
  "ALIMTALK_API_KEY",
  "ALIMTALK_SENDER_NUMBER",
  // AI
  "ANTHROPIC_API_KEY",
  // N8N
  "N8N_WEBHOOK_URL",
  // App
  "NEXT_PUBLIC_APP_URL",
  // Default values for webhooks
  "DEFAULT_GYM_ID",
  "DEFAULT_COMPANY_ID",
  // Development
  "SKIP_WEBHOOK_SIGNATURE",
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];
type OptionalEnvVar = (typeof optionalEnvVars)[number];
type EnvVar = RequiredEnvVar | OptionalEnvVar;

/**
 * 환경변수 검증 결과
 */
interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * 환경변수 검증
 * 서버 시작 시 필수 환경변수가 설정되어 있는지 확인
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 필수 환경변수 검증
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // 기능별 환경변수 경고
  if (!process.env.ENCRYPTION_KEY) {
    warnings.push("ENCRYPTION_KEY가 설정되지 않았습니다. 토큰 암호화 기능이 제한됩니다.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    warnings.push("ANTHROPIC_API_KEY가 설정되지 않았습니다. AI 기능이 비활성화됩니다.");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push("Google OAuth 환경변수가 설정되지 않았습니다. Google 캘린더 연동이 비활성화됩니다.");
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * 환경변수 가져오기 (필수)
 * 환경변수가 없으면 에러 발생
 */
export function getRequiredEnv(key: RequiredEnvVar): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`필수 환경변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
}

/**
 * 환경변수 가져오기 (선택적)
 * 환경변수가 없으면 기본값 반환
 */
export function getOptionalEnv(key: OptionalEnvVar, defaultValue = ""): string {
  return process.env[key] || defaultValue;
}

/**
 * 환경변수 존재 여부 확인
 */
export function hasEnv(key: EnvVar): boolean {
  return !!process.env[key];
}

/**
 * 타입 안전한 환경변수 객체
 */
export const env = {
  // Supabase
  supabase: {
    url: () => getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: () => getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: () => getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },

  // Encryption
  encryption: {
    key: () => getOptionalEnv("ENCRYPTION_KEY"),
    isConfigured: () => hasEnv("ENCRYPTION_KEY"),
  },

  // Google
  google: {
    clientId: () => getOptionalEnv("GOOGLE_CLIENT_ID"),
    clientSecret: () => getOptionalEnv("GOOGLE_CLIENT_SECRET"),
    isConfigured: () => hasEnv("GOOGLE_CLIENT_ID") && hasEnv("GOOGLE_CLIENT_SECRET"),
  },

  // Kakao
  kakao: {
    restApiKey: () => getOptionalEnv("KAKAO_REST_API_KEY"),
    adminKey: () => getOptionalEnv("KAKAO_ADMIN_KEY"),
    channelId: () => getOptionalEnv("KAKAO_CHANNEL_ID"),
    channelPublicId: () => getOptionalEnv("KAKAO_CHANNEL_PUBLIC_ID"),
    webhookSecret: () => getOptionalEnv("KAKAO_WEBHOOK_SECRET"),
    isConfigured: () => hasEnv("KAKAO_ADMIN_KEY"),
  },

  // Alimtalk
  alimtalk: {
    serviceUrl: () => getOptionalEnv("ALIMTALK_SERVICE_URL"),
    apiKey: () => getOptionalEnv("ALIMTALK_API_KEY"),
    senderNumber: () => getOptionalEnv("ALIMTALK_SENDER_NUMBER"),
    isConfigured: () => hasEnv("ALIMTALK_API_KEY"),
  },

  // AI
  ai: {
    anthropicApiKey: () => getOptionalEnv("ANTHROPIC_API_KEY"),
    isConfigured: () => hasEnv("ANTHROPIC_API_KEY"),
  },

  // N8N
  n8n: {
    webhookUrl: () => getOptionalEnv("N8N_WEBHOOK_URL"),
    isConfigured: () => hasEnv("N8N_WEBHOOK_URL"),
  },

  // App
  app: {
    url: () => getOptionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    isDevelopment: () => process.env.NODE_ENV === "development",
    isProduction: () => process.env.NODE_ENV === "production",
  },

  // Default values (for webhooks without authentication)
  defaults: {
    gymId: () => getOptionalEnv("DEFAULT_GYM_ID"),
    companyId: () => getOptionalEnv("DEFAULT_COMPANY_ID"),
  },

  // Development flags
  dev: {
    skipWebhookSignature: () =>
      process.env.NODE_ENV === "development" &&
      getOptionalEnv("SKIP_WEBHOOK_SIGNATURE") === "true",
  },
} as const;

/**
 * 서버 시작 시 환경변수 검증 실행
 * instrumentation.ts 또는 서버 시작점에서 호출
 */
export function checkEnvOnStartup(): void {
  const result = validateEnv();

  if (!result.isValid) {
    console.error("❌ 필수 환경변수가 누락되었습니다:");
    result.missing.forEach((envVar) => console.error(`  - ${envVar}`));

    if (process.env.NODE_ENV === "production") {
      throw new Error("필수 환경변수가 설정되지 않아 서버를 시작할 수 없습니다.");
    }
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️ 환경변수 경고:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // Validation complete - no action needed if valid with no warnings
}
