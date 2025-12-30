import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

interface TransferRequest {
  from_membership_id: string;
  to_member_id?: string;
  new_member?: {
    name: string;
    phone: string;
  };
  transfer_sessions: number;
  transfer_date: string;
  transfer_reason?: string;
  transfer_fee?: number;
  payment_method?: string;
}

// 회원권 양도
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

    const { id: fromMemberId } = await params;
    const body: TransferRequest = await request.json();
    const {
      from_membership_id,
      to_member_id,
      new_member,
      transfer_sessions,
      transfer_date,
      transfer_reason,
      transfer_fee,
      payment_method,
    } = body;

    // 유효성 검사
    if (!from_membership_id) {
      return NextResponse.json({ error: "양도할 회원권 ID가 필요합니다." }, { status: 400 });
    }
    if (!to_member_id && !new_member) {
      return NextResponse.json({ error: "양수인 정보가 필요합니다." }, { status: 400 });
    }
    if (!transfer_sessions || transfer_sessions < 1) {
      return NextResponse.json({ error: "양도 횟수는 1회 이상이어야 합니다." }, { status: 400 });
    }
    if (!transfer_date) {
      return NextResponse.json({ error: "양도 시작일이 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. 양도자 회원 정보 확인
    const { data: fromMember, error: fromMemberError } = await supabase
      .from("members")
      .select("id, gym_id, company_id, name")
      .eq("id", fromMemberId)
      .single();

    if (fromMemberError || !fromMember) {
      return NextResponse.json({ error: "양도자 회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, fromMember.gym_id, fromMember.company_id)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 2. 양도할 회원권 조회
    const { data: fromMembership, error: fromMembershipError } = await supabase
      .from("member_memberships")
      .select("id, name, membership_type, start_date, end_date, status, total_sessions, used_sessions")
      .eq("id", from_membership_id)
      .eq("member_id", fromMemberId)
      .single();

    if (fromMembershipError || !fromMembership) {
      return NextResponse.json({ error: "회원권을 찾을 수 없습니다." }, { status: 404 });
    }

    if (fromMembership.status !== "active") {
      return NextResponse.json({ error: "활성 상태의 회원권만 양도할 수 있습니다." }, { status: 400 });
    }

    // 잔여 횟수 확인
    const remainingSessions = fromMembership.total_sessions - fromMembership.used_sessions;
    if (transfer_sessions > remainingSessions) {
      return NextResponse.json({
        error: `양도 횟수(${transfer_sessions}회)가 잔여 횟수(${remainingSessions}회)를 초과합니다.`
      }, { status: 400 });
    }

    // 3. 양수인 처리
    let toMemberId = to_member_id;

    // 신규 회원 등록
    if (!toMemberId && new_member) {
      const { data: newMemberData, error: newMemberError } = await supabase
        .from("members")
        .insert({
          gym_id: fromMember.gym_id,
          company_id: fromMember.company_id,
          name: new_member.name,
          phone: new_member.phone,
          status: "active",
        })
        .select()
        .single();

      if (newMemberError || !newMemberData) {
        return NextResponse.json({ error: "신규 회원 등록에 실패했습니다." }, { status: 500 });
      }

      toMemberId = newMemberData.id;

      // 신규 회원 생성 로그
      try {
        await supabase.from("member_activity_logs").insert({
          gym_id: fromMember.gym_id,
          company_id: fromMember.company_id,
          member_id: toMemberId,
          action_type: "member_created",
          description: `신규 회원 등록 (양도 수령): ${new_member.name}`,
          changes: { after: newMemberData },
          created_by: staff.id,
        });
      } catch (logError) {
        console.error("[Transfer] 신규 회원 로그 기록 실패:", logError);
      }
    }

    // 양수인 회원 정보 조회
    const { data: toMember, error: toMemberError } = await supabase
      .from("members")
      .select("id, gym_id, company_id, name")
      .eq("id", toMemberId)
      .single();

    if (toMemberError || !toMember) {
      return NextResponse.json({ error: "양수인 회원을 찾을 수 없습니다." }, { status: 404 });
    }

    // 같은 지점인지 확인
    if (toMember.gym_id !== fromMember.gym_id) {
      return NextResponse.json({ error: "같은 지점의 회원에게만 양도할 수 있습니다." }, { status: 400 });
    }

    // 자기 자신에게 양도 불가
    if (toMemberId === fromMemberId) {
      return NextResponse.json({ error: "자기 자신에게는 양도할 수 없습니다." }, { status: 400 });
    }

    // 4. 양수인의 기존 회원권 확인 (같은 유형)
    const membershipType = fromMembership.membership_type || "PT";
    const { data: existingMembership } = await supabase
      .from("member_memberships")
      .select("id, name, total_sessions, used_sessions, end_date, status")
      .eq("member_id", toMemberId)
      .eq("membership_type", membershipType)
      .eq("status", "active")
      .single();

    let toMembershipId: string;
    let toMembershipAction: "created" | "merged" = "created";

    // 5. 양수인 회원권 처리
    if (existingMembership) {
      // 병합: 기존 회원권에 횟수 추가
      const newTotalSessions = existingMembership.total_sessions + transfer_sessions;

      // 종료일 계산 (더 늦은 날짜 선택)
      const transferEndDate = calculateEndDate(transfer_date, transfer_sessions);
      const newEndDate = existingMembership.end_date && existingMembership.end_date > transferEndDate
        ? existingMembership.end_date
        : transferEndDate;

      const { error: mergeError } = await supabase
        .from("member_memberships")
        .update({
          total_sessions: newTotalSessions,
          end_date: newEndDate,
        })
        .eq("id", existingMembership.id);

      if (mergeError) {
        return NextResponse.json({ error: "회원권 병합에 실패했습니다." }, { status: 500 });
      }

      toMembershipId = existingMembership.id;
      toMembershipAction = "merged";
    } else {
      // 신규 생성
      const newEndDate = calculateEndDate(transfer_date, transfer_sessions);

      const { data: newMembership, error: createError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id: fromMember.gym_id,
          member_id: toMemberId,
          name: fromMembership.name,
          membership_type: membershipType,
          total_sessions: transfer_sessions,
          used_sessions: 0,
          start_date: transfer_date,
          end_date: newEndDate,
          status: "active",
        })
        .select()
        .single();

      if (createError || !newMembership) {
        return NextResponse.json({ error: "양수인 회원권 생성에 실패했습니다." }, { status: 500 });
      }

      toMembershipId = newMembership.id;
    }

    // 6. 양도자 회원권 횟수 차감
    const newFromTotalSessions = fromMembership.total_sessions - transfer_sessions;
    const isFullTransfer = transfer_sessions === remainingSessions;

    const { error: deductError } = await supabase
      .from("member_memberships")
      .update({
        total_sessions: newFromTotalSessions,
        status: isFullTransfer ? "finished" : "active",
      })
      .eq("id", from_membership_id);

    if (deductError) {
      return NextResponse.json({ error: "양도자 회원권 업데이트에 실패했습니다." }, { status: 500 });
    }

    // 전체 양도 시 양도자 회원 상태 확인
    if (isFullTransfer) {
      const { data: otherMemberships } = await supabase
        .from("member_memberships")
        .select("id")
        .eq("member_id", fromMemberId)
        .eq("status", "active")
        .neq("id", from_membership_id);

      if (!otherMemberships || otherMemberships.length === 0) {
        await supabase
          .from("members")
          .update({ status: "expired" })
          .eq("id", fromMemberId);
      }
    }

    // 7. 양수인 회원 상태 활성화
    await supabase
      .from("members")
      .update({ status: "active" })
      .eq("id", toMemberId);

    // 8. 양도 이력 저장
    try {
      await supabase.from("member_membership_transfers").insert({
        gym_id: fromMember.gym_id,
        company_id: fromMember.company_id,
        from_member_id: fromMemberId,
        from_membership_id: from_membership_id,
        to_member_id: toMemberId,
        to_membership_id: toMembershipId,
        transferred_sessions: transfer_sessions,
        transfer_fee: transfer_fee || 0,
        payment_method: payment_method || null,
        transfer_reason: transfer_reason || null,
        transfer_date: transfer_date,
        original_membership_data: {
          name: fromMembership.name,
          membership_type: membershipType,
          total_sessions: fromMembership.total_sessions,
          used_sessions: fromMembership.used_sessions,
          remaining_sessions: remainingSessions,
          start_date: fromMembership.start_date,
          end_date: fromMembership.end_date,
        },
        created_by: staff.id,
      });
    } catch (transferLogError) {
      console.error("[Transfer] 양도 이력 저장 실패:", transferLogError);
    }

    // 9. 활동 로그 기록 - 양도자
    try {
      await supabase.from("member_activity_logs").insert({
        gym_id: fromMember.gym_id,
        company_id: fromMember.company_id,
        member_id: fromMemberId,
        membership_id: from_membership_id,
        action_type: "membership_transferred",
        description: `회원권 "${fromMembership.name}" ${transfer_sessions}회 양도 → ${toMember.name}`,
        changes: {
          before: {
            total_sessions: fromMembership.total_sessions,
            remaining_sessions: remainingSessions,
          },
          after: {
            total_sessions: newFromTotalSessions,
            remaining_sessions: remainingSessions - transfer_sessions,
            transferred_to: toMember.name,
            transferred_sessions: transfer_sessions,
          },
        },
        created_by: staff.id,
      });
    } catch (logError) {
      console.error("[Transfer] 양도자 로그 기록 실패:", logError);
    }

    // 10. 활동 로그 기록 - 양수인
    try {
      const actionDescription = toMembershipAction === "merged"
        ? `회원권 "${fromMembership.name}" ${transfer_sessions}회 양도받음 (기존 회원권에 병합) ← ${fromMember.name}`
        : `회원권 "${fromMembership.name}" ${transfer_sessions}회 양도받음 ← ${fromMember.name}`;

      await supabase.from("member_activity_logs").insert({
        gym_id: fromMember.gym_id,
        company_id: fromMember.company_id,
        member_id: toMemberId,
        membership_id: toMembershipId,
        action_type: toMembershipAction === "merged" ? "membership_updated" : "membership_created",
        description: actionDescription,
        changes: {
          transfer_from: fromMember.name,
          transferred_sessions: transfer_sessions,
          merged: toMembershipAction === "merged",
        },
        created_by: staff.id,
      });
    } catch (logError) {
      console.error("[Transfer] 양수인 로그 기록 실패:", logError);
    }

    // 11. 양도 수수료 결제 기록
    if (transfer_fee && transfer_fee > 0) {
      try {
        await supabase.from("member_payments").insert({
          gym_id: fromMember.gym_id,
          company_id: fromMember.company_id,
          member_id: toMemberId,
          membership_id: toMembershipId,
          registration_type: "양도수수료",
          amount: transfer_fee,
          method: payment_method || "cash",
          memo: `${fromMember.name}님으로부터 회원권 양도 수수료`,
          paid_at: new Date().toISOString(),
        });

        // 매출 로그
        await supabase.from("sales_logs").insert({
          gym_id: fromMember.gym_id,
          company_id: fromMember.company_id,
          member_id: toMemberId,
          sales_type: "양도수수료",
          amount: transfer_fee,
          method: payment_method || "cash",
          staff_id: staff.id,
          memo: `${fromMember.name} → ${toMember.name} 회원권 양도`,
        });
      } catch (paymentError) {
        console.error("[Transfer] 수수료 결제 기록 실패:", paymentError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        from_member: {
          id: fromMemberId,
          name: fromMember.name,
          remaining_sessions: remainingSessions - transfer_sessions,
        },
        to_member: {
          id: toMemberId,
          name: toMember.name,
          is_new: !to_member_id,
        },
        transfer: {
          sessions: transfer_sessions,
          date: transfer_date,
          fee: transfer_fee || 0,
          action: toMembershipAction,
        },
      },
    });
  } catch (error: unknown) {
    console.error("회원권 양도 API 오류:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 종료일 계산 (기본 7일/회)
function calculateEndDate(startDate: string, sessions: number, daysPerSession: number = 7): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + (sessions * daysPerSession) - 1);
  return start.toISOString().split("T")[0];
}

// 양도 이력 조회
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get("membershipId");
    const direction = searchParams.get("direction"); // "from" | "to" | null (both)

    const supabase = getSupabaseAdmin();

    // 양도 이력 조회 (양도자 또는 양수인으로서의 이력)
    let query = supabase
      .from("member_membership_transfers")
      .select(`
        *,
        from_member:members!member_membership_transfers_from_member_id_fkey(id, name, phone),
        to_member:members!member_membership_transfers_to_member_id_fkey(id, name, phone),
        from_membership:member_memberships!member_membership_transfers_from_membership_id_fkey(id, name),
        created_by_staff:staffs!member_membership_transfers_created_by_fkey(id, name)
      `)
      .order("created_at", { ascending: false });

    if (direction === "from") {
      query = query.eq("from_member_id", memberId);
    } else if (direction === "to") {
      query = query.eq("to_member_id", memberId);
    } else {
      query = query.or(`from_member_id.eq.${memberId},to_member_id.eq.${memberId}`);
    }

    if (membershipId) {
      query = query.or(`from_membership_id.eq.${membershipId},to_membership_id.eq.${membershipId}`);
    }

    const { data: transfers, error } = await query;

    if (error) {
      console.log("[Transfer] 양도 이력 조회 실패:", error);
      return NextResponse.json({ transfers: [] });
    }

    return NextResponse.json({ transfers: transfers || [] });
  } catch (error: unknown) {
    console.error("양도 이력 조회 API 오류:", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
