import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type StaffRole = "system_admin" | "company_admin" | "admin" | "staff";

export interface AuthenticatedStaff {
  id: string;
  name: string;
  role: StaffRole;
  gym_id: string | null;
  company_id: string | null;
  clerk_user_id: string;
}

export interface AuthResult {
  staff: AuthenticatedStaff | null;
  error: NextResponse | null;
  userId: string | null;
}

/**
 * Clerk 인증 확인 및 직원 정보 조회
 * 인증 실패 시 적절한 에러 응답 반환
 * clerk_user_id로 조회 실패 시 이메일로 fallback 조회
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const authResult = await auth();
  const userId = authResult.userId;

  if (!userId) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      ),
      userId: null,
    };
  }

  const supabase = getSupabaseAdmin();

  // 1. clerk_user_id로 조회
  let { data: staff, error } = await supabase
    .from("staffs")
    .select("id, name, role, gym_id, company_id, clerk_user_id")
    .eq("clerk_user_id", userId)
    .single();

  // 2. clerk_user_id로 찾지 못한 경우, Clerk에서 이메일을 가져와 조회
  if (error || !staff) {
    try {
      // Clerk에서 사용자 정보 가져오기
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;

      if (email) {
        // 이메일로 직원 조회
        const { data: staffByEmail, error: emailError } = await supabase
          .from("staffs")
          .select("id, name, role, gym_id, company_id, clerk_user_id")
          .eq("email", email)
          .single();

        if (!emailError && staffByEmail) {
          staff = staffByEmail;

          // clerk_user_id가 없거나 다르면 업데이트
          if (!staffByEmail.clerk_user_id || staffByEmail.clerk_user_id !== userId) {
            await supabase
              .from("staffs")
              .update({ clerk_user_id: userId })
              .eq("id", staffByEmail.id);
          }
        }
      }
    } catch (clerkError) {
      console.error("[Auth] Clerk user lookup failed:", clerkError);
    }
  }

  if (!staff) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다. 관리자에게 문의하세요." },
        { status: 403 }
      ),
      userId,
    };
  }

  return {
    staff: staff as AuthenticatedStaff,
    error: null,
    userId,
  };
}

/**
 * 관리자 권한 확인 (system_admin, company_admin, admin)
 */
export function isAdmin(role: StaffRole): boolean {
  return ["system_admin", "company_admin", "admin"].includes(role);
}

/**
 * 특정 회사에 대한 접근 권한 확인
 */
export function canAccessCompany(
  staff: AuthenticatedStaff,
  companyId: string
): boolean {
  if (staff.role === "system_admin") return true;
  if (!staff.company_id) return false;
  return staff.company_id === companyId;
}

/**
 * 특정 지점에 대한 접근 권한 확인
 */
export function canAccessGym(
  staff: AuthenticatedStaff,
  gymId: string,
  gymCompanyId?: string
): boolean {
  if (staff.role === "system_admin") return true;
  if (staff.role === "company_admin") {
    // company_admin은 같은 회사의 모든 지점 접근 가능
    return gymCompanyId ? staff.company_id === gymCompanyId : true;
  }
  if (!staff.gym_id) return false;
  return staff.gym_id === gymId;
}

/**
 * 인증 및 관리자 권한 확인을 한번에 수행
 */
export async function requireAdmin(): Promise<{
  staff: AuthenticatedStaff | null;
  error: NextResponse | null;
}> {
  const { staff, error } = await authenticateRequest();

  if (error) return { staff: null, error };

  if (!staff || !isAdmin(staff.role)) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      ),
    };
  }

  return { staff, error: null };
}
