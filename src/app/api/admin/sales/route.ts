import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest, canAccessGym } from "@/lib/api/auth";

// 매출 생성
export async function POST(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_id,
      gym_id,
      member_name,
      phone,
      gender, // 성별
      birth_date, // 생년월일
      sale_type,
      membership_category,
      membership_name,
      amount,
      method,
      installment,
      trainer_id,
      trainer_name,
      registrar, // 등록자 (수기 입력)
      memo,
      // PT 전용 필드
      service_sessions, // PT 횟수
      bonus_sessions,   // 서비스(보너스) 세션
      validity_per_session,
      membership_start_date,
      // 신규/재등록 전용 필드
      visit_route,
      expiry_type,
    } = body;

    if (!company_id || !gym_id) {
      return NextResponse.json({ error: "company_id와 gym_id가 필요합니다." }, { status: 400 });
    }

    // 권한 확인
    const supabase = getSupabaseAdmin();
    const { data: gym } = await supabase
      .from("gyms")
      .select("company_id")
      .eq("id", gym_id)
      .maybeSingle();

    if (!canAccessGym(staff, gym_id, gym?.company_id)) {
      return NextResponse.json({ error: "해당 지점에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // trainer_name 조회 (trainer_id가 있고 trainer_name이 없을 경우)
    let finalTrainerName = trainer_name || "";
    if (trainer_id && !trainer_name) {
      const { data: trainerData } = await supabase
        .from("staffs")
        .select("name")
        .eq("id", trainer_id)
        .maybeSingle();
      if (trainerData) finalTrainerName = trainerData.name;
    }

    // 1. 회원 조회 또는 생성 (전화번호 기준)
    let memberId: string | null = null;

    if (phone) {
      // 전화번호로 기존 회원 조회
      const normalizedPhone = phone.replace(/-/g, "");
      const { data: existingMember } = await supabase
        .from("members")
        .select("id")
        .eq("gym_id", gym_id)
        .or(`phone.eq.${phone},phone.eq.${normalizedPhone}`)
        .maybeSingle();

      if (existingMember) {
        memberId = existingMember.id;

        // trainer_id 업데이트 (직접 쿼리)
        if (trainer_id) {
          await supabase
            .from("members")
            .update({ trainer_id })
            .eq("id", memberId);
        }

        // gender/birth_date 업데이트 (RPC 함수 사용 - 스키마 캐시 우회)
        if (gender || birth_date) {
          const { error: rpcError } = await supabase.rpc("update_member_gender_birthdate", {
            p_gym_id: gym_id,
            p_phone: phone,
            p_gender: gender || null,
            p_birth_date: birth_date || null
          });

          if (rpcError) {
            console.log("[Sales API] RPC 업데이트 실패, 직접 쿼리 시도:", rpcError.message);
            // RPC 실패 시 직접 쿼리 (fallback)
            const updateData: Record<string, any> = {};
            if (gender) updateData.gender = gender;
            if (birth_date) updateData.birth_date = birth_date;
            await supabase
              .from("members")
              .update(updateData)
              .eq("id", memberId);
          }
        }
      } else if (member_name) {
        // 신규 회원 생성 - trainer_id, gender, birth_date 포함
        const { data: newMember, error: memberError } = await supabase
          .from("members")
          .insert({
            company_id,
            gym_id,
            name: member_name,
            phone: phone,
            gender: gender || null,
            birth_date: birth_date || null,
            trainer_id: trainer_id || null,
            status: "active",
          })
          .select("id")
          .single();

        if (!memberError && newMember) {
          memberId = newMember.id;
          console.log("[Sales API] 신규 회원 생성:", memberId);
        }
      }
    }

    // member_payments 테이블에 저장 (트레이너 미지정 시 null, gender/birth_date 포함)
    const { data: payment, error: paymentError } = await supabase
      .from("member_payments")
      .insert({
        company_id,
        gym_id,
        member_name: member_name || "",
        phone: phone || "",
        gender: gender || null,
        birth_date: birth_date || null,
        sale_type: sale_type || "",
        membership_category: membership_category || "",
        membership_name: membership_name || "",
        amount: parseFloat(amount) || 0,
        method: method || "card",
        installment: installment || 1,
        trainer_id: trainer_id || null,
        trainer_name: finalTrainerName || "",
        registrar: registrar || "", // 등록자 (수기 입력)
        memo: memo || "",
        // PT 전용 필드
        service_sessions: service_sessions || null,
        bonus_sessions: bonus_sessions || 0,
        validity_per_session: validity_per_session || null,
        start_date: membership_start_date || null,
        // 신규/재등록 전용 필드
        visit_route: visit_route || null,
        expiry_type: expiry_type || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[Sales API] 매출 생성 오류:", paymentError);
      return NextResponse.json({ error: paymentError.message }, { status: 500 });
    }

    // 2. 매출 저장 시 회원권 자동 생성
    // - PT 카테고리 → PT 회원권 생성 (횟수 기반)
    // - PT 외 카테고리 → OT 회원권 생성 (1회 기반, 스케줄 관리에서 OT 등록 가능)
    let membershipCreated = null;

    console.log("[Sales API] 회원권 생성 체크 - memberId:", memberId, "category:", membership_category);

    if (memberId && membership_category === "PT") {
      // PT 카테고리: PT 회원권 자동 생성 (횟수가 없어도 생성)
      console.log("[Sales API] ✅ PT 조건 충족! PT 회원권 생성 시작...");
      // 횟수가 없으면 기본값 10회 사용
      const totalSessions = parseInt(service_sessions) || 10;
      // 종료일 계산: 시작일 + (횟수 * 1회당 유효일수)
      const startDate = membership_start_date ? new Date(membership_start_date) : new Date();
      const daysPerSession = validity_per_session || 7; // 기본값 7일
      const totalDays = totalSessions * daysPerSession;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalDays);

      const { data: newMembership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          company_id,
          gym_id,
          member_id: memberId,
          name: membership_name
            ? (membership_name.toLowerCase().includes('pt') ? membership_name : `PT ${membership_name}`)
            : "PT",
          total_sessions: totalSessions,
          used_sessions: 0,
          service_sessions: parseInt(bonus_sessions) || 0,
          used_service_sessions: 0,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          amount: parseFloat(amount) || 0,
          status: "active",
          sales_staff_id: trainer_id || null,
          registration_type: sale_type === "신규" ? "new" : "renewal",
        })
        .select()
        .single();

      if (membershipError) {
        console.error("[Sales API] PT 회원권 생성 오류:", membershipError);
        // 회원권 생성 실패해도 매출은 정상 처리 (로그만 남김)
      } else {
        membershipCreated = newMembership;
        console.log("[Sales API] PT 회원권 생성 완료:", newMembership?.id);

        // 활동 로그 기록 - PT 회원권 등록
        await supabase.from("member_activity_logs").insert({
          gym_id,
          company_id,
          member_id: memberId,
          action_type: "membership_created",
          description: `${sale_type === "신규" ? "신규" : "재등록"} PT 회원권 등록: ${newMembership.name} (${totalSessions}회, ${new Intl.NumberFormat("ko-KR").format(parseFloat(amount) || 0)}원)`,
          changes: {
            membership_id: newMembership.id,
            membership_name: newMembership.name,
            total_sessions: totalSessions,
            service_sessions: parseInt(bonus_sessions) || 0,
            amount: parseFloat(amount) || 0,
            start_date: newMembership.start_date,
            end_date: newMembership.end_date,
            registration_type: sale_type,
            trainer_id: trainer_id || null,
            trainer_name: finalTrainerName || ""
          },
          created_by: staff.id
        });
      }
    } else if (memberId && membership_category && membership_category !== "PT") {
      // PT 외 카테고리 (헬스, 골프, 필라테스 등): OT 회원권 자동 생성 (무제한)
      console.log("[Sales API] ✅ 비PT 카테고리! OT 회원권 생성 시작...");
      const startDate = membership_start_date ? new Date(membership_start_date) : new Date();
      // OT는 30일 유효기간
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      const otName = `OT (${membership_category})`;

      const { data: newMembership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          company_id,
          gym_id,
          member_id: memberId,
          name: otName,
          total_sessions: 9999, // OT는 무제한
          used_sessions: 0,
          service_sessions: 0,
          used_service_sessions: 0,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          amount: 0, // OT는 별도 금액 없음 (매출은 membership 가격)
          status: "active",
          sales_staff_id: trainer_id || null,
          registration_type: sale_type === "신규" ? "new" : "renewal",
        })
        .select()
        .single();

      if (membershipError) {
        console.error("[Sales API] OT 회원권 생성 오류:", membershipError);
      } else {
        membershipCreated = newMembership;
        console.log("[Sales API] OT 회원권 생성 완료:", newMembership?.id);

        // 활동 로그 기록 - OT/일반 회원권 등록
        await supabase.from("member_activity_logs").insert({
          gym_id,
          company_id,
          member_id: memberId,
          action_type: "membership_created",
          description: `${sale_type === "신규" ? "신규" : "재등록"} ${membership_category} 회원권 등록: ${membership_name || membership_category} (${new Intl.NumberFormat("ko-KR").format(parseFloat(amount) || 0)}원)`,
          changes: {
            membership_id: newMembership.id,
            membership_name: newMembership.name,
            membership_category,
            amount: parseFloat(amount) || 0,
            start_date: newMembership.start_date,
            end_date: newMembership.end_date,
            registration_type: sale_type,
            trainer_id: trainer_id || null,
            trainer_name: finalTrainerName || ""
          },
          created_by: staff.id
        });
      }
    }

    return NextResponse.json({ success: true, payment, membership: membershipCreated, member_id: memberId });
  } catch (error: any) {
    console.error("[Sales API] 매출 생성 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매출 수정
export async function PUT(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 매출 확인 (phone 포함)
    const { data: existingPayment, error: findError } = await supabase
      .from("member_payments")
      .select("gym_id, company_id, phone")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Sales API] 매출 조회 오류:", findError);
      return NextResponse.json({ error: "매출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingPayment) {
      return NextResponse.json({ error: "매출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingPayment.gym_id, existingPayment.company_id)) {
      return NextResponse.json({ error: "해당 매출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    // trainer_name 조회 (trainer_id가 변경된 경우)
    let trainerName = updates.trainer_name;
    if (updates.trainer_id && !updates.trainer_name) {
      const { data: trainerData } = await supabase
        .from("staffs")
        .select("name")
        .eq("id", updates.trainer_id)
        .maybeSingle();
      if (trainerData) trainerName = trainerData.name;
    }

    // 수정 가능한 필드들 (PT 전용 필드 포함, gender/birth_date 추가)
    const allowedFields = [
      "member_name", "phone", "sale_type", "membership_category", "membership_name",
      "amount", "method", "installment", "trainer_id", "registrar", "memo",
      "service_sessions", "bonus_sessions", "validity_per_session", "start_date", "visit_route", "expiry_type",
      "gender", "birth_date"
    ];
    const dbUpdates: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        if (key === "amount") {
          dbUpdates[key] = parseFloat(updates[key]) || 0;
        } else {
          dbUpdates[key] = updates[key];
        }
      }
    }

    // membership_start_date -> start_date 필드명 매핑 처리
    if (updates.membership_start_date !== undefined) {
      dbUpdates.start_date = updates.membership_start_date;
    }

    // trainer_name 업데이트
    if (trainerName !== undefined) {
      dbUpdates.trainer_name = trainerName;
    }

    const { error: updateError } = await supabase
      .from("member_payments")
      .update(dbUpdates)
      .eq("id", id);

    if (updateError) {
      console.error("[Sales API] 매출 수정 오류:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 성별/생년월일이 변경된 경우 members 테이블도 업데이트 (RPC 함수 사용 - 스키마 캐시 우회)
    console.log("[Sales API] PUT updates:", updates);
    console.log("[Sales API] gender/birth_date check:", {
      hasGender: updates.gender !== undefined,
      hasBirthDate: updates.birth_date !== undefined,
      phone: existingPayment.phone
    });

    if ((updates.gender !== undefined || updates.birth_date !== undefined) && existingPayment.phone) {
      console.log("[Sales API] Updating member gender/birth_date via RPC:", {
        gym_id: existingPayment.gym_id,
        phone: existingPayment.phone,
        gender: updates.gender,
        birth_date: updates.birth_date
      });

      // RPC 함수를 사용하여 업데이트 (스키마 캐시 우회)
      const { error: rpcError } = await supabase.rpc("update_member_gender_birthdate", {
        p_gym_id: existingPayment.gym_id,
        p_phone: existingPayment.phone,
        p_gender: updates.gender || null,
        p_birth_date: updates.birth_date || null
      });

      if (rpcError) {
        console.error("[Sales API] 회원 정보 수정 RPC 오류:", rpcError);
        // RPC 실패 시 직접 쿼리 시도 (fallback)
        const normalizedPhone = existingPayment.phone.replace(/-/g, "");
        const memberUpdates: Record<string, unknown> = {};
        if (updates.gender !== undefined) memberUpdates.gender = updates.gender;
        if (updates.birth_date !== undefined) memberUpdates.birth_date = updates.birth_date;

        const { error: directError } = await supabase
          .from("members")
          .update(memberUpdates)
          .eq("gym_id", existingPayment.gym_id)
          .or(`phone.eq.${existingPayment.phone},phone.eq.${normalizedPhone}`);

        if (directError) {
          console.error("[Sales API] 회원 정보 직접 수정 오류:", directError);
        }
      } else {
        console.log("[Sales API] 회원 gender/birth_date 업데이트 성공 (RPC)");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Sales API] 매출 수정 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매출 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 기존 매출 확인 (phone 포함)
    const { data: existingPayment, error: findError } = await supabase
      .from("member_payments")
      .select("gym_id, company_id, phone")
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error("[Sales API] 매출 조회 오류:", findError);
      return NextResponse.json({ error: "매출 조회 중 오류가 발생했습니다." }, { status: 500 });
    }

    if (!existingPayment) {
      return NextResponse.json({ error: "매출 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (!canAccessGym(staff, existingPayment.gym_id, existingPayment.company_id)) {
      return NextResponse.json({ error: "해당 매출에 대한 접근 권한이 없습니다." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("member_payments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Sales API] 매출 삭제 오류:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 매출 삭제 후: 해당 회원의 다른 매출이 없으면 회원과 회원권도 삭제
    if (existingPayment.phone) {
      const normalizedPhone = existingPayment.phone.replace(/-/g, "");

      // 같은 phone으로 다른 매출이 있는지 확인
      const { data: otherPayments } = await supabase
        .from("member_payments")
        .select("id")
        .eq("gym_id", existingPayment.gym_id)
        .or(`phone.eq.${existingPayment.phone},phone.eq.${normalizedPhone}`)
        .limit(1);

      // 다른 매출이 없으면 회원과 회원권 삭제
      if (!otherPayments || otherPayments.length === 0) {
        // 회원 찾기
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("gym_id", existingPayment.gym_id)
          .or(`phone.eq.${existingPayment.phone},phone.eq.${normalizedPhone}`)
          .maybeSingle();

        if (member) {
          // 회원권 삭제
          await supabase
            .from("member_memberships")
            .delete()
            .eq("member_id", member.id);

          // 회원 삭제
          await supabase
            .from("members")
            .delete()
            .eq("id", member.id);

          console.log("[Sales API] 매출 삭제로 인한 회원 및 회원권 삭제:", member.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Sales API] 매출 삭제 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 매출 목록 조회 - member_payments 테이블에서 조회
export async function GET(request: NextRequest) {
  try {
    const { staff, error: authError } = await authenticateRequest();
    if (authError) return authError;
    if (!staff) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get("gym_id");
    const companyId = searchParams.get("company_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!gymId || !companyId) {
      return NextResponse.json({ error: "gym_id와 company_id가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("member_payments")
      .select("*")
      .eq("gym_id", gymId)
      .eq("company_id", companyId);

    // 날짜 필터 적용
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00`);
    }
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
      const nextDayStr = nextDate.toISOString().split('T')[0];
      query = query.lt("created_at", `${nextDayStr}T00:00:00`);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("매출 조회 에러:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 모든 고유 전화번호 수집
    const phoneSet = new Set<string>();
    (data || []).forEach((p: any) => {
      if (p.phone) {
        phoneSet.add(p.phone);
        phoneSet.add(p.phone.replace(/-/g, "")); // 하이픈 제거된 버전도 추가
      }
    });

    // members 테이블에서 성별/생년월일 조회 (RPC 함수 사용 - 스키마 캐시 우회)
    let membersMap: Record<string, { gender?: string; birth_date?: string }> = {};
    if (phoneSet.size > 0) {
      // RPC 함수로 조회 시도 (JSONB 반환)
      const { data: rpcResult, error: rpcError } = await supabase.rpc("get_members_by_phones", {
        p_gym_id: gymId,
        p_phones: Array.from(phoneSet)
      });

      if (!rpcError && rpcResult) {
        // JSONB 결과 파싱 - 문자열이면 파싱, 배열이면 그대로 사용
        let rpcMembers: any[] = [];
        if (typeof rpcResult === "string") {
          try {
            rpcMembers = JSON.parse(rpcResult);
          } catch {
            rpcMembers = [];
          }
        } else if (Array.isArray(rpcResult)) {
          rpcMembers = rpcResult;
        } else if (rpcResult && typeof rpcResult === "object") {
          // 단일 객체인 경우 배열로 변환
          rpcMembers = [rpcResult];
        }

        console.log("[Sales API] RPC 원본:", typeof rpcResult, JSON.stringify(rpcResult).substring(0, 200));

        rpcMembers.forEach((m: any) => {
          if (m && m.phone) {
            const normalizedPhone = m.phone.replace(/-/g, "");
            membersMap[m.phone] = { gender: m.gender, birth_date: m.birth_date };
            membersMap[normalizedPhone] = { gender: m.gender, birth_date: m.birth_date };
          }
        });
        console.log("[Sales API] RPC 조회 성공:", rpcMembers.length, "건, map:", Object.keys(membersMap).length);
      } else if (rpcError) {
        console.log("[Sales API] RPC 조회 실패, 직접 쿼리 시도:", rpcError.message);
        // RPC 실패 시 직접 쿼리 (fallback)
        const { data: members } = await supabase
          .from("members")
          .select("phone, gender, birth_date")
          .eq("gym_id", gymId)
          .in("phone", Array.from(phoneSet));

        if (members) {
          members.forEach((m: any) => {
            if (m.phone) {
              const normalizedPhone = m.phone.replace(/-/g, "");
              membersMap[m.phone] = { gender: m.gender, birth_date: m.birth_date };
              membersMap[normalizedPhone] = { gender: m.gender, birth_date: m.birth_date };
            }
          });
        }
      }
    }

    // member_payments 데이터를 Payment 형태로 변환
    // gender/birth_date는 member_payments 테이블에서 직접 읽고, 없으면 members 테이블에서 조회
    const payments = (data || []).map((p: any) => {
      const normalizedPhone = p.phone ? p.phone.replace(/-/g, "") : "";
      const memberInfo = membersMap[p.phone] || membersMap[normalizedPhone] || {};

      // 디버그: 각 payment의 gender/birth_date 값 확인
      const finalGender = p.gender || memberInfo.gender || "";
      const finalBirthDate = p.birth_date || memberInfo.birth_date || "";
      if (p.phone === "010-2222-2222") {
        console.log("[Sales API] Payment 매핑:", {
          phone: p.phone,
          "p.gender": p.gender,
          "memberInfo.gender": memberInfo.gender,
          "finalGender": finalGender,
          "p.birth_date": p.birth_date,
          "memberInfo.birth_date": memberInfo.birth_date,
          "finalBirthDate": finalBirthDate
        });
      }

      return {
        id: p.id,
        member_name: p.member_name || "",
        phone: p.phone || "",
        gender: finalGender,
        birth_date: finalBirthDate,
        sale_type: p.sale_type || "",
        membership_category: p.membership_category || "",
        membership_name: p.membership_name || "",
        amount: p.amount || 0,
        method: p.method || "card",
        installment: p.installment || 1,
        trainer_id: p.trainer_id || "",
        trainer_name: p.trainer_name || "",
        registrar: p.registrar || "", // 등록자 (수기 입력)
        memo: p.memo || "",
        created_at: p.created_at,
        // PT 전용 필드
        service_sessions: p.service_sessions || 0,
        bonus_sessions: p.bonus_sessions || 0,
        validity_per_session: p.validity_per_session || 0,
        start_date: p.start_date || "",
        membership_start_date: p.start_date || "",
        // 신규/재등록 전용 필드
        visit_route: p.visit_route || "",
        expiry_type: p.expiry_type || "",
      };
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error: any) {
    console.error("매출 조회 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
