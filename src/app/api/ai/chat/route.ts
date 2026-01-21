import { NextRequest } from "next/server";
import { getClaudeClient, CLAUDE_MODELS } from "@/lib/ai/claude";
import { AI_TOOLS } from "@/lib/ai/tools";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { executeAiTool } from "@/lib/ai/tool-executor";
import { authenticateRequest, isAdmin } from "@/lib/api/auth";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting 체크 (AI API는 분당 20회 제한)
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, {
      ...RATE_LIMITS.ai,
      prefix: "ai-chat",
    });

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          },
        }
      );
    }

    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!staff || !isAdmin(staff.role)) {
      return new Response(JSON.stringify({ error: "관리자 권한이 필요합니다." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { message, gymId } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "메시지가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetGymId = gymId || staff.gym_id;
    if (!targetGymId) {
      return new Response(JSON.stringify({ error: "gym_id가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const claude = getClaudeClient();

    // Claude API 호출 with tools
    const response = await claude.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 2048,
      system: SYSTEM_PROMPTS.COMMAND_CENTER,
      tools: AI_TOOLS,
      messages: [{ role: "user", content: message }],
    });

    // Tool use 처리
    let finalResponse = response;
    const toolResults: Array<{ tool: string; result: unknown }> = [];

    while (finalResponse.stop_reason === "tool_use") {
      const toolUseBlocks = finalResponse.content.filter(
        (block): block is { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
          block.type === "tool_use"
      );

      const toolResultContents = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await executeAiTool(toolUse.name, toolUse.input, targetGymId);
          toolResults.push({ tool: toolUse.name, result });
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Continue conversation with tool results
      finalResponse = await claude.messages.create({
        model: CLAUDE_MODELS.FAST,
        max_tokens: 2048,
        system: SYSTEM_PROMPTS.COMMAND_CENTER,
        tools: AI_TOOLS,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: finalResponse.content },
          { role: "user", content: toolResultContents },
        ],
      });
    }

    // Extract text response
    const textContent = finalResponse.content.find(
      (block) => block.type === "text"
    );

    const responseText = textContent && "text" in textContent ? textContent.text : "응답을 생성할 수 없습니다.";

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        toolsUsed: toolResults.map((t) => t.tool),
        usage: finalResponse.usage,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "AI 처리 중 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
