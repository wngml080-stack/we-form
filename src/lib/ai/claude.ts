import Anthropic from "@anthropic-ai/sdk";

// Singleton Claude client
let claudeClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    claudeClient = new Anthropic({ apiKey });
  }
  return claudeClient;
}

// Model configurations
export const CLAUDE_MODELS = {
  FAST: "claude-3-5-haiku-20241022", // 빠른 응답, 저렴
  SMART: "claude-sonnet-4-20250514", // 균형 잡힌 성능
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];
