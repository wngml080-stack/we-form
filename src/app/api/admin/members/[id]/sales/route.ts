import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/api/auth";

// 기존 회원 매출 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id: memberId } = await params;
    const body = await request.json();
    const {
      company_id,
      gym_id,
      registration_type,
      membership_type,
      membership_name,
      total_sessions,
      additional_sessions,
      start_date,
      end_date,
      amount,
      total_amount,
      installment_count,
      installment_current,
      method,
      visit_route,
      memo,
      // 회원 정보 업데이트
      member_update,
      // 추가 회원권
      additional_memberships,
      // 부가상품
      addons,
    } = body;

    if (!company_id || !gym_id || !registration_type) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 회원 정보 조회
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, member_memberships(id, name, total_sessions, used_sessions, end_date, status)")
      .eq("id", memberId)
      .maybeSingle();

    if (memberError) {
      console.error("[MemberSales] 회원 조회 오류:", memberError);
      return NextResponse.json({ error: "회원 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 활성 회원권 찾기
    const activeMembership = member.member_memberships?.find((m: any) => m.status === "active");

    // 등록 타입에 따른 처리
    if (registration_type === "리뉴") {
      // 리뉴 = 재등록: 새 회원권 생성
      const { data: newMembership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id,
          member_id: memberId,
          name: membership_name,
          membership_type: membership_type || null,
          total_sessions: parseInt(total_sessions) || 0,
          used_sessions: 0,
          start_date: start_date || null,
          end_date: end_date || null,
          status: "active",
        })
        .select()
        .maybeSingle();

      if (membershipError) {
        console.error("[MemberSales] 회원권 리뉴 생성 오류:", membershipError);
        throw membershipError;
      }

      // 회원 상태 활성화
      await supabase.from("members").update({ status: "active" }).eq("id", memberId);

      // 활동 로그
      await supabase.from("member_activity_logs").insert({
        gym_id,
        company_id,
        member_id: memberId,
        membership_id: newMembership?.id,
        action_type: "membership_renewed",
        description: `회원권 리뉴: ${membership_name} (${total_sessions}회)`,
        created_by: staff.id
      });
    } else if (registration_type === "기간변경") {
      // 기간변경: 기존 회원권의 기간/횟수 추가
      if (activeMembership) {
        const addSessions = parseInt(additional_sessions || total_sessions || "0");
        const newTotalSessions = activeMembership.total_sessions + addSessions;

        const { error: updateError } = await supabase
          .from("member_memberships")
          .update({
            total_sessions: newTotalSessions,
            end_date: end_date || activeMembership.end_date,
            status: "active",
          })
          .eq("id", activeMembership.id);

        if (updateError) throw updateError;

        // 활동 로그
        await supabase.from("member_activity_logs").insert({
          gym_id,
          company_id,
          member_id: memberId,
          membership_id: activeMembership.id,
          action_type: "membership_updated",
          description: `회원권 기간변경: ${addSessions}회 추가 (${activeMembership.total_sessions} → ${newTotalSessions}), 종료일 ${end_date || activeMembership.end_date}`,
          changes: {
            before: { total_sessions: activeMembership.total_sessions, end_date: activeMembership.end_date },
            after: { total_sessions: newTotalSessions, end_date: end_date || activeMembership.end_date }
          },
          created_by: staff.id
        });
      } else {
        // 활성 회원권이 없으면 새로 생성
        const { data: newMembership, error: membershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id,
            member_id: memberId,
            name: membership_name,
            membership_type: membership_type || null,
            total_sessions: parseInt(total_sessions) || 0,
            used_sessions: 0,
            start_date: start_date || null,
            end_date: end_date || null,
            status: "active",
          })
          .select()
          .maybeSingle();

        if (membershipError) {
          console.error("[MemberSales] 회원권 기간변경 생성 오류:", membershipError);
          throw membershipError;
        }

        // 활동 로그
        await supabase.from("member_activity_logs").insert({
          gym_id,
          company_id,
          member_id: memberId,
          membership_id: newMembership?.id,
          action_type: "membership_created",
          description: `회원권 기간변경 (신규 생성): ${membership_name} (${total_sessions}회)`,
          created_by: staff.id
        });
      }

      // 회원 상태 활성화
      await supabase.from("members").update({ status: "active" }).eq("id", memberId);
    } else if (registration_type === "신규" || registration_type === "재등록") {
      // 새 회원권 생성
      const { data: newMembership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id,
          member_id: memberId,
          name: membership_name,
          membership_type: membership_type || null,
          total_sessions: parseInt(total_sessions) || 0,
          used_sessions: 0,
          start_date: start_date || null,
          end_date: end_date || null,
          status: "active",
        })
        .select()
        .maybeSingle();

      if (membershipError) {
        console.error("[MemberSales] 회원권 신규/재등록 생성 오류:", membershipError);
        throw membershipError;
      }

      // 회원 상태 활성화
      await supabase.from("members").update({ status: "active" }).eq("id", memberId);

      // 활동 로그
      await supabase.from("member_activity_logs").insert({
        gym_id,
        company_id,
        member_id: memberId,
        membership_id: newMembership?.id,
        action_type: registration_type === "신규" ? "membership_created" : "membership_renewed",
        description: `회원권 ${registration_type}: ${membership_name} (${total_sessions}회)`,
        created_by: staff.id
      });
    }

    // 결제 내역 등록
    const paymentAmount = parseFloat(amount || "0");
    const paymentTotalAmount = total_amount ? parseFloat(total_amount) : paymentAmount;
    // 결제일은 오늘 날짜+시간 사용 (timestamptz 타입에 맞게 ISO 형식)
    const paymentDate = new Date().toISOString();

    console.log(`[Member Sales API] 결제 정보:`, {
      memberId,
      memberName: member.name,
      paymentAmount,
      paymentTotalAmount,
      paymentDate,
      method,
      registration_type,
      membership_type,
      membership_name
    });

    if (paymentAmount > 0) {
      const { data: paymentData, error: paymentError } = await supabase.from("member_payments").insert({
        company_id,
        gym_id,
        member_id: memberId,
        amount: paymentAmount,
        total_amount: paymentTotalAmount,
        installment_count: parseInt(installment_count || "1"),
        installment_current: parseInt(installment_current || "1"),
        method: method || "card",
        membership_type: membership_type || null,
        registration_type,
        visit_route: visit_route || null,
        memo: memo || null,
        paid_at: paymentDate,
        created_by: staff.id,
      }).select();

      if (paymentError) {
        console.error("결제 정보 등록 오류:", paymentError);
      } else {
        console.log(`[Member Sales API] ✓ 결제 레코드 생성 성공:`, paymentData);
      }

      // 매출 로그
      await supabase.from("sales_logs").insert({
        company_id,
        gym_id,
        member_id: memberId,
        staff_id: staff.id,
        type: "sale",
        amount: paymentAmount,
        method: method || "card",
        memo: `${member.name} - ${membership_name || registration_type}`,
        occurred_at: paymentDate,
      });
    } else {
      console.warn(`[Member Sales API] ⚠️ 금액이 0이라 결제 레코드 생성 안함: ${member.name}`);
    }

    // 회원 정보 업데이트 (있는 경우)
    if (member_update && Object.keys(member_update).length > 0) {
      const updateData: Record<string, unknown> = {};
      if (member_update.name) updateData.name = member_update.name;
      if (member_update.phone) updateData.phone = member_update.phone;
      if (member_update.birth_date) updateData.birth_date = member_update.birth_date;
      if (member_update.gender) updateData.gender = member_update.gender;
      if (member_update.exercise_goal) updateData.exercise_goal = member_update.exercise_goal;
      if (member_update.weight) updateData.weight = parseFloat(member_update.weight);
      if (member_update.body_fat_mass) updateData.body_fat_mass = parseFloat(member_update.body_fat_mass);
      if (member_update.skeletal_muscle_mass) updateData.skeletal_muscle_mass = parseFloat(member_update.skeletal_muscle_mass);
      if (member_update.trainer_id) updateData.trainer_id = member_update.trainer_id;

      if (Object.keys(updateData).length > 0) {
        await supabase.from("members").update(updateData).eq("id", memberId);
      }
    }

    // 추가 회원권 저장
    if (additional_memberships && Array.isArray(additional_memberships)) {
      for (const membership of additional_memberships) {
        if (!membership.membership_name || !membership.amount) continue;

        const membershipAmount = parseFloat(membership.amount);
        const membershipSessions = parseInt(membership.total_sessions) || 0;

        // 새 회원권 생성
        const { data: newMembership, error: membershipError } = await supabase
          .from("member_memberships")
          .insert({
            gym_id,
            member_id: memberId,
            name: membership.membership_name,
            membership_type: membership.membership_type || null,
            total_sessions: membershipSessions,
            used_sessions: 0,
            start_date: membership.start_date || null,
            end_date: membership.end_date || null,
            status: "active",
          })
          .select()
          .maybeSingle();

        if (membershipError) {
          console.error("[MemberSales] 추가 회원권 등록 오류:", membershipError);
          continue;
        }

        // 결제 기록 (결제일은 오늘 날짜 사용)
        const { error: addPaymentError } = await supabase.from("member_payments").insert({
          company_id,
          gym_id,
          member_id: memberId,
          amount: membershipAmount,
          total_amount: membershipAmount,
          method: membership.payment_method || "card",
          membership_type: membership.membership_type || null,
          registration_type: registration_type,
          memo: `${membership.membership_name} (${membershipSessions}회)`,
          paid_at: paymentDate,
          start_date: membership.start_date || null,
          end_date: membership.end_date || null,
          created_by: staff.id,
        });

        if (addPaymentError) {
          console.error("[MemberSales] 추가 회원권 결제 등록 오류:", addPaymentError);
        }

        // 매출 로그
        const { error: addSalesError } = await supabase.from("sales_logs").insert({
          company_id,
          gym_id,
          member_id: memberId,
          staff_id: staff.id,
          type: "sale",
          amount: membershipAmount,
          method: membership.payment_method || "card",
          memo: `${member.name} - ${membership.membership_name} 추가`,
          occurred_at: paymentDate,
        });

        if (addSalesError) {
          console.error("[MemberSales] 추가 회원권 매출 로그 등록 오류:", addSalesError);
        }

        // 활동 로그
        const { error: addLogError } = await supabase.from("member_activity_logs").insert({
          gym_id,
          company_id,
          member_id: memberId,
          membership_id: newMembership?.id,
          action_type: "membership_created",
          description: `추가 회원권: ${membership.membership_name} (${membershipSessions}회)`,
          created_by: staff.id
        });

        if (addLogError) {
          console.error("[MemberSales] 추가 회원권 활동 로그 등록 오류:", addLogError);
        }
      }
    }

    // 부가상품 저장
    if (addons && Array.isArray(addons)) {
      for (const addon of addons) {
        if (!addon.addon_type || !addon.amount) continue;

        const addonAmount = parseFloat(addon.amount);

        // 결제 기록 (결제일은 오늘 날짜 사용)
        const { error: addonPaymentError } = await supabase.from("member_payments").insert({
          company_id,
          gym_id,
          member_id: memberId,
          amount: addonAmount,
          total_amount: addonAmount,
          method: addon.method || "card",
          membership_type: "부가상품",
          registration_type: "부가상품",
          memo: addon.memo,
          paid_at: paymentDate,
          start_date: addon.start_date || null,
          end_date: addon.end_date || null,
          created_by: staff.id,
        });

        if (addonPaymentError) {
          console.error("[MemberSales] 부가상품 결제 등록 오류:", addonPaymentError);
        }

        // 매출 로그
        const { error: addonSalesError } = await supabase.from("sales_logs").insert({
          company_id,
          gym_id,
          member_id: memberId,
          staff_id: staff.id,
          type: "sale",
          amount: addonAmount,
          method: addon.method || "card",
          memo: `부가상품: ${addon.memo}`,
          occurred_at: paymentDate,
        });

        if (addonSalesError) {
          console.error("[MemberSales] 부가상품 매출 로그 등록 오류:", addonSalesError);
        }
      }
    }

    return NextResponse.json({ success: true, member_id: memberId });
  } catch (error: any) {
    console.error("기존 회원 매출 등록 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
