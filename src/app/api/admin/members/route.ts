import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessCompany, canAccessGym, isAdmin } from "@/lib/api/auth";

// 회원 등록
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const {
      company_id,
      gym_id,
      name,
      phone,
      birth_date,
      gender,
      trainer_id,
      registered_by,
      exercise_goal,
      weight,
      body_fat_mass,
      skeletal_muscle_mass,
      memo,
      status = "active",
      created_at,
      // 회원권 정보 (선택)
      membership,
      // 결제 정보 (선택)
      payment,
      // 매출 로그 (선택)
      sales_log,
      // 추가 회원권 목록 (선택)
      additional_memberships,
      // 부가상품 목록 (선택)
      addons
    } = body;

    if (!company_id || !gym_id || !name) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. 회원 등록
    const memberInsertData: Record<string, any> = {
      company_id,
      gym_id,
      name,
      phone: phone || null,
      birth_date: birth_date || null,
      gender: gender || null,
      trainer_id: trainer_id || null,
      registered_by: registered_by || staff.id,
      exercise_goal: exercise_goal || null,
      weight: weight ? parseFloat(weight) : null,
      body_fat_mass: body_fat_mass ? parseFloat(body_fat_mass) : null,
      skeletal_muscle_mass: skeletal_muscle_mass ? parseFloat(skeletal_muscle_mass) : null,
      memo: memo || null,
      status
    };

    // created_at이 있으면 추가 (등록일 지정)
    if (created_at) {
      memberInsertData.created_at = created_at;
    }

    const { data: newMember, error: memberError } = await supabase
      .from("members")
      .insert(memberInsertData)
      .select()
      .single();

    if (memberError) {
      console.error("회원 등록 오류:", memberError);
      return NextResponse.json({ error: memberError.message, code: memberError.code }, { status: 500 });
    }

    // 2. 회원권 등록 (있는 경우)
    let membershipData = null;
    if (membership && newMember) {
      const { data: newMembership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id,
          member_id: newMember.id,
          name: membership.name,
          total_sessions: membership.total_sessions || null,
          used_sessions: 0,
          start_date: membership.start_date,
          end_date: membership.end_date,
          status: "active"
        })
        .select()
        .single();

      if (membershipError) {
        console.error("회원권 등록 오류:", membershipError);
        // 회원권 등록 실패 시 회원도 삭제 (롤백)
        await supabase.from("members").delete().eq("id", newMember.id);
        return NextResponse.json({ error: membershipError.message }, { status: 500 });
      }
      membershipData = newMembership;
    }

    // 3. 결제 정보 등록 (있는 경우)
    let paymentData = null;
    if (payment && newMember) {
      const { data: newPayment, error: paymentError } = await supabase
        .from("member_payments")
        .insert({
          company_id,
          gym_id,
          member_id: newMember.id,
          membership_id: membershipData?.id || null,
          membership_type: payment.membership_type,
          membership_name: payment.membership_name,
          registration_type: payment.registration_type || "신규",
          paid_at: payment.payment_date,
          amount: parseFloat(payment.amount),
          total_amount: parseFloat(payment.total_amount || payment.amount),
          total_sessions: payment.total_sessions || null,
          service_sessions: payment.service_sessions || 0,
          start_date: payment.start_date,
          end_date: payment.end_date,
          method: payment.method || "card",
          created_by: staff.id,
          memo: payment.memo || null
        })
        .select()
        .single();

      if (paymentError) {
        console.error("결제 정보 등록 오류:", paymentError);
      } else {
        paymentData = newPayment;
      }
    }

    // 4. 매출 로그 등록 (있는 경우)
    if (sales_log && newMember) {
      const { error: salesError } = await supabase
        .from("sales_logs")
        .insert({
          company_id,
          gym_id,
          member_id: newMember.id,
          staff_id: staff.id,
          type: sales_log.type || "sale",
          amount: parseFloat(sales_log.amount),
          method: sales_log.method || "card",
          memo: sales_log.memo || null,
          occurred_at: sales_log.occurred_at || sales_log.log_date || new Date().toISOString().split('T')[0]
        });

      if (salesError) {
        console.error("매출 로그 등록 오류:", salesError);
      }
    }

    // 5. 추가 회원권 등록 (있는 경우)
    const additionalMembershipResults: any[] = [];
    if (additional_memberships && Array.isArray(additional_memberships) && newMember) {
      for (const addMembership of additional_memberships) {
        if (!addMembership.product_id && !addMembership.amount) continue;

        // 추가 회원권 등록
        const { data: addMembershipData, error: addMembershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id,
            member_id: newMember.id,
            name: addMembership.membership_name,
            total_sessions: addMembership.total_sessions ? parseInt(addMembership.total_sessions) : null,
            used_sessions: 0,
            start_date: addMembership.start_date,
            end_date: addMembership.end_date || null,
            status: "active"
          })
          .select()
          .single();

        if (addMembershipError) {
          console.error("추가 회원권 등록 오류:", addMembershipError);
          continue;
        }

        additionalMembershipResults.push(addMembershipData);

        // 추가 회원권 결제 정보 등록
        if (addMembership.amount) {
          const addAmount = parseFloat(addMembership.amount);
          await supabase.from("member_payments").insert({
            company_id,
            gym_id,
            member_id: newMember.id,
            membership_id: addMembershipData.id,
            amount: addAmount,
            total_amount: addAmount,
            method: addMembership.payment_method || "card",
            membership_type: addMembership.membership_type,
            registration_type: "신규",
            memo: `${addMembership.membership_name} 신규 등록 (추가)`,
            paid_at: addMembership.registered_at || created_at,
            created_by: staff.id
          });

          // 추가 회원권 매출 로그 등록
          await supabase.from("sales_logs").insert({
            company_id,
            gym_id,
            member_id: newMember.id,
            staff_id: staff.id,
            type: "sale",
            amount: addAmount,
            method: addMembership.payment_method || "card",
            memo: `${name} - ${addMembership.membership_name} 신규 등록 (추가)`,
            occurred_at: addMembership.registered_at || created_at
          });
        }
      }
    }

    // 6. 부가상품 등록 (있는 경우)
    if (addons && Array.isArray(addons) && newMember) {
      for (const addon of addons) {
        if (!addon.amount) continue;

        const addonAmount = parseFloat(addon.amount);

        // 부가상품 결제 정보 등록
        await supabase.from("member_payments").insert({
          company_id,
          gym_id,
          member_id: newMember.id,
          amount: addonAmount,
          total_amount: addonAmount,
          method: addon.payment_method || "card",
          membership_type: "부가상품",
          registration_type: "부가상품",
          memo: addon.memo || "부가상품 구매",
          paid_at: addon.occurred_at || created_at,
          start_date: addon.start_date || null,
          end_date: addon.end_date || null,
          created_by: staff.id
        });

        // 부가상품 매출 로그 등록
        await supabase.from("sales_logs").insert({
          company_id,
          gym_id,
          member_id: newMember.id,
          staff_id: staff.id,
          type: "sale",
          amount: addonAmount,
          method: addon.payment_method || "card",
          memo: `부가상품: ${addon.memo || '부가상품'}`,
          occurred_at: addon.occurred_at || created_at
        });
      }
    }

    return NextResponse.json({
      member: newMember,
      membership: membershipData,
      payment: paymentData,
      additional_memberships: additionalMembershipResults
    });
  } catch (error: any) {
    console.error("회원 등록 API 오류:", error);
    return NextResponse.json({ error: error.message || "알 수 없는 오류" }, { status: 500 });
  }
}

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
