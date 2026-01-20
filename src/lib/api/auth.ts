import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type StaffRole = "system_admin" | "company_admin" | "admin" | "staff";

export interface AuthenticatedStaff {
  id: string;
  name: string;
  role: StaffRole;
  gym_id: string | null;
  company_id: string | null;
}

export interface AuthResult {
  staff: AuthenticatedStaff | null;
  error: NextResponse | null;
  userId: string | null;
}

/**
 * Supabase Auth 인증 확인 및 직원 정보 조회
 * 인증 실패 시 적절한 에러 응답 반환
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      ),
      userId: null,
    };
  }

  const supabaseAdmin = getSupabaseAdmin();

  // 이메일로 직원 조회
  const { data: staff, error } = await supabaseAdmin
    .from("staffs")
    .select("id, name, role, gym_id, company_id")
    .eq("email", user.email)
    .single();

  if (error || !staff) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다. 관리자에게 문의하세요." },
        { status: 403 }
      ),
      userId: user.id,
    };
  }

  return {
    staff: staff as AuthenticatedStaff,
    error: null,
    userId: user.id,
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
 * staff 역할도 자신의 회사에 접근 가능
 */
export function canAccessCompany(
  staff: AuthenticatedStaff,
  companyId: string
): boolean {
  if (staff.role === "system_admin") return true;
  if (!staff.company_id) return false;
  // company_admin, admin, staff 모두 자신의 회사에 접근 가능
  return staff.company_id === companyId;
}

/**
 * 특정 지점에 대한 접근 권한 확인
 * staff 역할은 자신의 지점만 접근 가능
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
  // admin, staff는 자신의 지점만 접근 가능
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

/**
 * 인증만 확인 (관리자 권한 불필요)
 * 인증 실패 시 에러 응답, 성공 시 staff 정보 반환
 */
export async function requireAuth(): Promise<{
  staff: AuthenticatedStaff | null;
  error: NextResponse | null;
}> {
  const { staff, error } = await authenticateRequest();

  if (error) return { staff: null, error };

  if (!staff) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  return { staff, error: null };
}

/**
 * 인증 + 특정 회사 접근 권한 확인
 */
export async function requireCompanyAccess(companyId: string): Promise<{
  staff: AuthenticatedStaff | null;
  error: NextResponse | null;
}> {
  const { staff, error } = await requireAuth();

  if (error) return { staff: null, error };
  if (!staff) return { staff: null, error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }) };

  if (!canAccessCompany(staff, companyId)) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "해당 회사에 대한 접근 권한이 없습니다." },
        { status: 403 }
      ),
    };
  }

  return { staff, error: null };
}

/**
 * 인증 + 특정 지점 접근 권한 확인
 */
export async function requireGymAccess(gymId: string, gymCompanyId?: string): Promise<{
  staff: AuthenticatedStaff | null;
  error: NextResponse | null;
}> {
  const { staff, error } = await requireAuth();

  if (error) return { staff: null, error };
  if (!staff) return { staff: null, error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }) };

  if (!canAccessGym(staff, gymId, gymCompanyId)) {
    return {
      staff: null,
      error: NextResponse.json(
        { error: "해당 지점에 대한 접근 권한이 없습니다." },
        { status: 403 }
      ),
    };
  }

  return { staff, error: null };
}
