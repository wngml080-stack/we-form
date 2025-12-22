import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany, canAccessGym, isAdmin } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    // 인증 확인
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff || !isAdmin(staff.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // URL에서 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const gymId = searchParams.get('gym_id');
    const companyId = searchParams.get('company_id');
    const trainerId = searchParams.get('trainer_id');

    // 권한 확인
    if (gymId) {
      const { data: gym } = await supabase
        .from("gyms")
        .select("company_id")
        .eq("id", gymId)
        .single();

      if (!canAccessGym(staff, gymId, gym?.company_id)) {
        return NextResponse.json(
          { error: "해당 지점에 대한 접근 권한이 없습니다." },
          { status: 403 }
        );
      }
    } else if (companyId) {
      if (!canAccessCompany(staff, companyId)) {
        return NextResponse.json(
          { error: "해당 회사에 대한 접근 권한이 없습니다." },
          { status: 403 }
        );
      }
    } else {
      // gymId나 companyId가 없으면 자신의 권한 범위 내에서 조회
      // admin 역할은 자기 지점만, company_admin은 자기 회사만
    }

    // 페이지네이션 설정
    const PAGE_SIZE = 50;
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    // 쿼리 시작 (count 옵션으로 총 개수도 가져오기)
    let query = supabase
      .from("members")
      .select(`
        id, name, phone, birth_date, gender, status, created_at, trainer_id,
        member_memberships!left (
          id, name, total_sessions, used_sessions, start_date, end_date, status
        )
      `, { count: 'exact' });

    // 역할별 필터링
    if (gymId) {
      query = query.eq("gym_id", gymId);
    } else if (companyId) {
      query = query.eq("company_id", companyId);
    } else {
      // 명시적 필터가 없으면 사용자 권한에 맞게 자동 필터
      if (staff.role === "admin" && staff.gym_id) {
        query = query.eq("gym_id", staff.gym_id);
      } else if (staff.role === "company_admin" && staff.company_id) {
        query = query.eq("company_id", staff.company_id);
      }
      // system_admin은 필터 없이 전체 조회 가능
    }

    // 트레이너별 필터링 (직원 페이지용)
    if (trainerId) {
      query = query.eq("trainer_id", trainerId);
    }

    // 상태 필터링
    if (status !== 'all') {
      query = query.eq("status", status);
    }

    // 검색 필터링 (이름 또는 전화번호)
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // 정렬 + 페이지네이션 적용
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      console.error("회원 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 상태별 카운트 조회 (통계 카드용)
    let statsQuery = supabase
      .from("members")
      .select("status", { count: 'exact', head: false });

    if (gymId) {
      statsQuery = statsQuery.eq("gym_id", gymId);
    } else if (companyId) {
      statsQuery = statsQuery.eq("company_id", companyId);
    } else {
      if (staff.role === "admin" && staff.gym_id) {
        statsQuery = statsQuery.eq("gym_id", staff.gym_id);
      } else if (staff.role === "company_admin" && staff.company_id) {
        statsQuery = statsQuery.eq("company_id", staff.company_id);
      }
    }

    if (trainerId) {
      statsQuery = statsQuery.eq("trainer_id", trainerId);
    }

    const { data: statsData } = await statsQuery;

    // 상태별 집계
    const stats = {
      total: statsData?.length || 0,
      active: statsData?.filter(m => m.status === 'active').length || 0,
      paused: statsData?.filter(m => m.status === 'paused').length || 0,
      expired: statsData?.filter(m => m.status === 'expired').length || 0,
    };

    // 활성 회원권만 필터링
    const membersWithActiveMemberships = data?.map(member => ({
      ...member,
      member_memberships: member.member_memberships?.filter(
        (m: any) => m.status === 'active'
      ) || []
    })) || [];

    return NextResponse.json({
      members: membersWithActiveMemberships,
      count: count || 0,
      totalPages: Math.ceil((count || 0) / PAGE_SIZE),
      currentPage: page,
      pageSize: PAGE_SIZE,
      stats,
      filter: { gymId, companyId, trainerId, status, search }
    });
  } catch (error: any) {
    console.error("회원 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
