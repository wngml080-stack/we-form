import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// PT 매출에 대한 회원권 일괄 생성 및 회원 정리
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 관리자만 실행 가능
    if (staff.role !== "system_admin" && staff.role !== "company_admin") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { gym_id, company_id, dry_run = false, action = "migrate" } = body;

    // action: "migrate" (PT 회원권 생성) 또는 "cleanup" (매출 없는 회원 삭제)
    if (action === "cleanup") {
      return await cleanupOrphanMembers(gym_id, company_id, dry_run);
    }

    if (!gym_id || !company_id) {
      return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. PT 카테고리인 모든 매출 조회
    const { data: ptPayments, error: paymentError } = await supabase
      .from("member_payments")
      .select("*")
      .eq("gym_id", gym_id)
      .eq("membership_category", "PT");

    if (paymentError) {
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    console.log(`[Migration] PT 매출 ${ptPayments?.length || 0}건 조회`);

    const results: { created: string[]; skipped: string[]; errors: string[] } = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const payment of ptPayments || []) {
      const memberName = payment.member_name;
      const phone = payment.phone;

      if (!phone) {
        results.skipped.push(`${memberName}: 전화번호 없음`);
        continue;
      }

      // 회원 찾기
      const normalizedPhone = phone.replace(/-/g, "");
      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("gym_id", gym_id)
        .or(`phone.eq.${phone},phone.eq.${normalizedPhone}`)
        .maybeSingle();

      if (!member) {
        results.skipped.push(`${memberName}: 회원 레코드 없음`);
        continue;
      }

      // 해당 회원의 PT 회원권이 이미 있는지 확인
      const { data: existingMembership } = await supabase
        .from("member_memberships")
        .select("id, name")
        .eq("member_id", member.id)
        .ilike("name", "%PT%")
        .maybeSingle();

      if (existingMembership) {
        results.skipped.push(`${memberName}: 이미 PT 회원권 있음 (${existingMembership.name})`);
        continue;
      }

      // 회원권 생성
      if (!dry_run) {
        const totalSessions = parseInt(payment.service_sessions) || 10;
        const startDate = payment.start_date ? new Date(payment.start_date) : new Date(payment.created_at);
        const daysPerSession = payment.validity_per_session || 7;
        const totalDays = totalSessions * daysPerSession;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + totalDays);

        const membershipName = payment.membership_name
          ? (payment.membership_name.toLowerCase().includes('pt') ? payment.membership_name : `PT ${payment.membership_name}`)
          : "PT";

        const { error: insertError } = await supabase
          .from("member_memberships")
          .insert({
            company_id,
            gym_id,
            member_id: member.id,
            name: membershipName,
            total_sessions: totalSessions,
            used_sessions: 0,
            service_sessions: parseInt(payment.bonus_sessions) || 0,
            used_service_sessions: 0,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            amount: parseFloat(payment.amount) || 0,
            status: "active",
            sales_staff_id: payment.trainer_id || staff.id,
            registration_type: payment.sale_type === "신규" ? "new" : "renewal",
          });

        if (insertError) {
          results.errors.push(`${memberName}: ${insertError.message}`);
        } else {
          results.created.push(`${memberName}: PT 회원권 생성 완료 (${totalSessions}회)`);
        }
      } else {
        results.created.push(`${memberName}: PT 회원권 생성 예정 (${parseInt(payment.service_sessions) || 10}회)`);
      }
    }

    return NextResponse.json({
      success: true,
      dry_run,
      total_pt_payments: ptPayments?.length || 0,
      results,
    });
  } catch (error: any) {
    console.error("[Migration] 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매출이 없는 고아 회원 정리
async function cleanupOrphanMembers(gym_id: string, company_id: string, dry_run: boolean) {
  if (!gym_id || !company_id) {
    return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 모든 회원 조회
  const { data: members, error: memberError } = await supabase
    .from("members")
    .select("id, name, phone")
    .eq("gym_id", gym_id);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  console.log(`[Cleanup] 총 회원 수: ${members?.length || 0}`);

  const results: { deleted: string[]; kept: string[]; errors: string[] } = {
    deleted: [],
    kept: [],
    errors: [],
  };

  for (const member of members || []) {
    const phone = member.phone;

    if (!phone) {
      results.kept.push(`${member.name}: 전화번호 없음 (유지)`);
      continue;
    }

    // 해당 회원의 매출이 있는지 확인
    const normalizedPhone = phone.replace(/-/g, "");
    const { data: payments, error: paymentError } = await supabase
      .from("member_payments")
      .select("id")
      .eq("gym_id", gym_id)
      .or(`phone.eq.${phone},phone.eq.${normalizedPhone}`)
      .limit(1);

    if (paymentError) {
      results.errors.push(`${member.name}: 조회 오류`);
      continue;
    }

    if (payments && payments.length > 0) {
      results.kept.push(`${member.name}: 매출 있음 (유지)`);
    } else {
      // 매출이 없으면 삭제
      if (!dry_run) {
        // 회원권 먼저 삭제
        await supabase
          .from("member_memberships")
          .delete()
          .eq("member_id", member.id);

        // 회원 삭제
        const { error: deleteError } = await supabase
          .from("members")
          .delete()
          .eq("id", member.id);

        if (deleteError) {
          results.errors.push(`${member.name}: 삭제 오류 - ${deleteError.message}`);
        } else {
          results.deleted.push(`${member.name}: 삭제 완료`);
          console.log(`[Cleanup] 회원 삭제: ${member.name}`);
        }
      } else {
        results.deleted.push(`${member.name}: 삭제 예정`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    action: "cleanup",
    dry_run,
    total_members: members?.length || 0,
    results,
  });
}
