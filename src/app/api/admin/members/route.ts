import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service Role로 RLS 우회해서 회원 조회 (페이지네이션 적용)
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // URL에서 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const gymId = searchParams.get('gym_id');
    const companyId = searchParams.get('company_id');
    const trainerId = searchParams.get('trainer_id'); // 직원 페이지용

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

    // 역할별 필터링 (staffs 패턴과 동일)
    if (gymId) {
      query = query.eq("gym_id", gymId);
    } else if (companyId) {
      query = query.eq("company_id", companyId);
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
      console.error("❌ 회원 조회 오류:", error);
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
    }

    if (trainerId) {
      statsQuery = statsQuery.eq("trainer_id", trainerId);
    }

    const { data: statsData, error: statsError } = await statsQuery;

    // 상태별 집계
    const stats = {
      total: statsData?.length || 0,
      active: statsData?.filter(m => m.status === 'active').length || 0,
      paused: statsData?.filter(m => m.status === 'paused').length || 0,
      expired: statsData?.filter(m => m.status === 'expired').length || 0,
    };

    // 활성 회원권만 필터링 (클라이언트 사이드 처리)
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
    console.error("❌ 회원 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
