"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Search, UserPlus, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [gymId, setGymId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");

  // 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // 직원 목록 (등록자/담당트레이너 선택용)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string>("");

  // 폼 상태 (확장)
  const [createForm, setCreateForm] = useState({
    // 필수 정보
    name: "",
    phone: "",
    registered_at: new Date().toISOString().split('T')[0],

    // 회원권 정보
    membership_name: "PT 30회",
    total_sessions: "30",
    membership_amount: "",

    // 담당자 정보
    registered_by: "", // 등록자 (현재 로그인한 사람으로 자동 설정)
    trainer_id: "", // 담당 트레이너

    // 선택 정보
    birth_date: "",
    gender: "",
    exercise_goal: "",

    // 인바디 정보
    weight: "",
    body_fat_mass: "",
    skeletal_muscle_mass: "",

    memo: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    birth_date: "",
    gender: "",
    status: "active",
    memo: ""
  });

  const [membershipForm, setMembershipForm] = useState({
    name: "",
    total_sessions: "",
    start_date: "",
    end_date: "",
    amount: "",
    method: "card"
  });

  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery, statusFilter]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 내 정보 가져오기
    const { data: me } = await supabase
      .from("staffs")
      .select("id, gym_id, company_id, role, gyms(name)")
      .eq("user_id", user.id)
      .single();

    if (me) {
      setGymId(me.gym_id);
      setCompanyId(me.company_id);
      setMyStaffId(me.id);
      setMyRole(me.role);
      // @ts-ignore
      setGymName(me.gyms?.name ?? "We:form");

      // 등록자를 현재 로그인한 사람으로 자동 설정
      setCreateForm(prev => ({
        ...prev,
        registered_by: me.id,
        trainer_id: me.id // 기본값으로 본인 설정
      }));

      fetchMembers(me.gym_id, me.company_id, me.role, me.id);
      fetchStaffList(me.gym_id);
    }
  };

  const fetchStaffList = async (targetGymId: string | null) => {
    if (!targetGymId) return;

    const { data } = await supabase
      .from("staffs")
      .select("id, name, job_title")
      .eq("gym_id", targetGymId)
      .eq("employment_status", "재직")
      .order("name");

    if (data) {
      setStaffList(data);
    }
  };

  const fetchMembers = async (targetGymId: string | null, targetCompanyId: string | null, role: string, staffId: string) => {
    if (!targetGymId || !targetCompanyId) return;

    let query = supabase
      .from("members")
      .select(`
        *,
        member_memberships!inner (
          id,
          name,
          total_sessions,
          used_sessions,
          start_date,
          end_date,
          status
        )
      `)
      .eq("gym_id", targetGymId)
      .eq("company_id", targetCompanyId);

    // 직원(staff)은 자기가 담당하는 회원만 조회
    if (role === "staff") {
      query = query.eq("trainer_id", staffId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("회원 조회 에러:", error);
      return;
    }

    // 회원권 정보를 집계
    const membersWithMemberships = (data || []).map((member: any) => {
      const memberships = member.member_memberships || [];
      const activeMembership = memberships.find((m: any) => m.status === 'active');

      return {
        ...member,
        activeMembership,
        totalMemberships: memberships.length
      };
    });

    setMembers(membersWithMemberships);
  };

  const filterMembers = () => {
    let filtered = [...members];

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(query) ||
        m.phone?.includes(query)
      );
    }

    setFilteredMembers(filtered);
  };

  const handleCreateMember = async () => {
    // 필수 항목 검증
    if (!createForm.name || !createForm.phone || !createForm.registered_at ||
        !createForm.membership_amount || !createForm.total_sessions ||
        !createForm.trainer_id) {
      alert("필수 항목을 모두 입력해주세요.\n(회원명, 연락처, 등록날짜, 등록금액, 등록세션, 담당트레이너)");
      return;
    }

    if (!gymId || !companyId) {
      alert("지점 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 회원 등록
      const { data: member, error: memberError } = await supabase
        .from("members")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          name: createForm.name,
          phone: createForm.phone,
          birth_date: createForm.birth_date || null,
          gender: createForm.gender || null,
          registered_by: createForm.registered_by || myStaffId,
          trainer_id: createForm.trainer_id,
          exercise_goal: createForm.exercise_goal || null,
          weight: createForm.weight ? parseFloat(createForm.weight) : null,
          body_fat_mass: createForm.body_fat_mass ? parseFloat(createForm.body_fat_mass) : null,
          skeletal_muscle_mass: createForm.skeletal_muscle_mass ? parseFloat(createForm.skeletal_muscle_mass) : null,
          memo: createForm.memo || null,
          status: "active",
          created_at: createForm.registered_at
        })
        .select()
        .single();

      if (memberError) throw memberError;

      // 2. 회원권 등록
      const { data: membership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id: gymId,
          member_id: member.id,
          name: createForm.membership_name,
          total_sessions: parseInt(createForm.total_sessions),
          used_sessions: 0,
          start_date: createForm.registered_at,
          end_date: null,
          status: "active"
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      // 3. 결제 정보 등록
      const amount = parseFloat(createForm.membership_amount);
      const { error: paymentError } = await supabase
        .from("member_payments")
        .insert({
          company_id: companyId,
          gym_id: gymId,
          member_id: member.id,
          membership_id: membership.id,
          amount: amount,
          method: "card", // 기본값
          memo: `${createForm.membership_name} 신규 등록`,
          paid_at: createForm.registered_at
        });

      if (paymentError) throw paymentError;

      // 4. 매출 로그에 기록
      await supabase.from("sales_logs").insert({
        company_id: companyId,
        gym_id: gymId,
        staff_id: myStaffId,
        type: "sale",
        amount: amount,
        method: "card",
        memo: `${createForm.name} - ${createForm.membership_name} 신규 등록`,
        occurred_at: createForm.registered_at
      });

      alert("회원이 등록되었습니다!");
      setIsCreateOpen(false);

      // 폼 초기화
      setCreateForm({
        name: "",
        phone: "",
        registered_at: new Date().toISOString().split('T')[0],
        membership_name: "PT 30회",
        total_sessions: "30",
        membership_amount: "",
        registered_by: myStaffId || "",
        trainer_id: myStaffId || "",
        birth_date: "",
        gender: "",
        exercise_goal: "",
        weight: "",
        body_fat_mass: "",
        skeletal_muscle_mass: "",
        memo: ""
      });

      fetchMembers(gymId, companyId, myRole, myStaffId!);
    } catch (error: any) {
      console.error(error);
      alert("등록 실패: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (member: any) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name || "",
      phone: member.phone || "",
      birth_date: member.birth_date || "",
      gender: member.gender || "",
      status: member.status || "active",
      memo: member.memo || ""
    });
    setIsEditOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({
          ...editForm,
          birth_date: editForm.birth_date || null,
          gender: editForm.gender || null
        })
        .eq("id", selectedMember.id);

      if (error) throw error;

      alert("회원 정보가 수정되었습니다!");
      setIsEditOpen(false);
      fetchMembers(gymId, companyId, myRole, myStaffId!);
    } catch (error: any) {
      console.error(error);
      alert("수정 실패: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openMembershipModal = (member: any) => {
    setSelectedMember(member);
    setMembershipForm({
      name: "PT 30회",
      total_sessions: "30",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      amount: "",
      method: "card"
    });
    setIsMembershipOpen(true);
  };

  const handleCreateMembership = async () => {
    if (!selectedMember || !gymId || !companyId) return;
    if (!membershipForm.name || !membershipForm.total_sessions) {
      alert("회원권 이름과 횟수는 필수입니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 회원권 생성
      const { data: membership, error: membershipError } = await supabase
        .from("member_memberships")
        .insert({
          gym_id: gymId,
          member_id: selectedMember.id,
          name: membershipForm.name,
          total_sessions: parseInt(membershipForm.total_sessions),
          used_sessions: 0,
          start_date: membershipForm.start_date || null,
          end_date: membershipForm.end_date || null,
          status: "active"
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      // 2. 결제 정보가 있으면 결제 기록 생성
      if (membershipForm.amount && parseFloat(membershipForm.amount) > 0) {
        const { error: paymentError } = await supabase
          .from("member_payments")
          .insert({
            company_id: companyId,
            gym_id: gymId,
            member_id: selectedMember.id,
            membership_id: membership.id,
            amount: parseFloat(membershipForm.amount),
            method: membershipForm.method,
            memo: `${membershipForm.name} 구매`
          });

        if (paymentError) throw paymentError;

        // 3. 매출 로그에도 기록
        await supabase.from("sales_logs").insert({
          company_id: companyId,
          gym_id: gymId,
          type: "sale",
          amount: parseFloat(membershipForm.amount),
          method: membershipForm.method,
          memo: `${selectedMember.name} - ${membershipForm.name}`,
          occurred_at: new Date().toISOString()
        });
      }

      alert("회원권이 등록되었습니다!");
      setIsMembershipOpen(false);
      fetchMembers(gymId, companyId, myRole, myStaffId!);
    } catch (error: any) {
      console.error(error);
      alert("등록 실패: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      paused: "bg-amber-100 text-amber-700",
      expired: "bg-gray-100 text-gray-500"
    };
    const labels: Record<string, string> = {
      active: "활성",
      paused: "휴면",
      expired: "만료"
    };
    return { color: colors[status] || "bg-gray-100", label: labels[status] || status };
  };

  return (
    <div className="space-y-8 p-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-heading font-bold text-[#2F80ED]">회원 관리</h2>
          <p className="text-base text-gray-600 mt-2 font-sans">{gymName}</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full md:w-auto bg-[#0F4C5C] hover:bg-[#09313b]"
        >
          <UserPlus className="mr-2 h-4 w-4"/> 회원 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="이름 또는 연락처로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="paused">휴면</SelectItem>
            <SelectItem value="expired">만료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">전체 회원</div>
          <div className="text-2xl font-bold text-[#0F4C5C] mt-1">{members.length}명</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">활성 회원</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {members.filter(m => m.status === 'active').length}명
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">휴면 회원</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {members.filter(m => m.status === 'paused').length}명
          </div>
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">이름</th>
              <th className="px-4 py-3 whitespace-nowrap">연락처</th>
              <th className="px-4 py-3 whitespace-nowrap">생년월일</th>
              <th className="px-4 py-3 whitespace-nowrap">성별</th>
              <th className="px-4 py-3 whitespace-nowrap">활성 회원권</th>
              <th className="px-4 py-3 whitespace-nowrap">잔여횟수</th>
              <th className="px-4 py-3 whitespace-nowrap">상태</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => {
              const statusBadge = getStatusBadge(member.status);
              const remaining = member.activeMembership
                ? (member.activeMembership.total_sessions - member.activeMembership.used_sessions)
                : null;

              return (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-gray-600">{member.phone || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{member.birth_date || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{member.gender || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {member.activeMembership ? member.activeMembership.name : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {member.activeMembership ? (
                      <span className={remaining === 0 ? "text-red-500 font-semibold" : "text-gray-700"}>
                        {remaining} / {member.activeMembership.total_sessions}회
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 ${statusBadge.color}`}>
                      {statusBadge.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMembershipModal(member)}
                      title="회원권 등록"
                    >
                      <CreditCard className="h-4 w-4 text-emerald-600"/>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(member)}
                    >
                      <Pencil className="h-4 w-4 text-gray-500"/>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-20 text-gray-400">
                  {searchQuery || statusFilter !== "all"
                    ? "검색 결과가 없습니다."
                    : "등록된 회원이 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 회원 등록 모달 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신규 회원 등록</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">

            {/* 필수 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">필수 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">회원명 <span className="text-red-500">*</span></Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">연락처 <span className="text-red-500">*</span></Label>
                  <Input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록날짜 <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={createForm.registered_at}
                    onChange={(e) => setCreateForm({...createForm, registered_at: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록금액 (원) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={createForm.membership_amount}
                    onChange={(e) => setCreateForm({...createForm, membership_amount: e.target.value})}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록세션 (회) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={createForm.total_sessions}
                    onChange={(e) => setCreateForm({...createForm, total_sessions: e.target.value})}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#0F4C5C]">회원권명</Label>
                <Input
                  value={createForm.membership_name}
                  onChange={(e) => setCreateForm({...createForm, membership_name: e.target.value})}
                  placeholder="PT 30회"
                />
              </div>
            </div>

            {/* 담당자 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">담당자 정보</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">등록자 <span className="text-red-500">*</span></Label>
                  <Select
                    value={createForm.registered_by}
                    onValueChange={(v) => setCreateForm({...createForm, registered_by: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {staffList.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.job_title})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">담당트레이너 <span className="text-red-500">*</span></Label>
                  <Select
                    value={createForm.trainer_id}
                    onValueChange={(v) => setCreateForm({...createForm, trainer_id: v})}
                  >
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-white max-h-[200px]">
                      {staffList.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.job_title})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">기본 정보 (선택)</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">생년월일</Label>
                  <Input
                    type="date"
                    value={createForm.birth_date}
                    onChange={(e) => setCreateForm({...createForm, birth_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">성별</Label>
                  <Select value={createForm.gender} onValueChange={(v) => setCreateForm({...createForm, gender: v})}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">운동목적</Label>
                  <Input
                    value={createForm.exercise_goal}
                    onChange={(e) => setCreateForm({...createForm, exercise_goal: e.target.value})}
                    placeholder="다이어트, 근력강화 등"
                  />
                </div>
              </div>
            </div>

            {/* 인바디 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">인바디 정보 (선택)</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">몸무게 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={createForm.weight}
                    onChange={(e) => setCreateForm({...createForm, weight: e.target.value})}
                    placeholder="70.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">체지방량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={createForm.body_fat_mass}
                    onChange={(e) => setCreateForm({...createForm, body_fat_mass: e.target.value})}
                    placeholder="15.2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F4C5C]">골격근량 (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={createForm.skeletal_muscle_mass}
                    onChange={(e) => setCreateForm({...createForm, skeletal_muscle_mass: e.target.value})}
                    placeholder="32.1"
                  />
                </div>
              </div>
            </div>

            {/* 메모 섹션 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">메모</h3>

              <div className="space-y-2">
                <Textarea
                  value={createForm.memo}
                  onChange={(e) => setCreateForm({...createForm, memo: e.target.value})}
                  placeholder="특이사항이나 메모를 입력하세요"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateMember} className="bg-[#0F4C5C] hover:bg-[#09313b]" disabled={isLoading}>
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>회원 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>연락처</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>생년월일</Label>
                <Input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({...editForm, birth_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>성별</Label>
                <Select value={editForm.gender} onValueChange={(v) => setEditForm({...editForm, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="male">남성</SelectItem>
                    <SelectItem value="female">여성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="paused">휴면</SelectItem>
                  <SelectItem value="expired">만료</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <Textarea
                value={editForm.memo}
                onChange={(e) => setEditForm({...editForm, memo: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateMember} className="bg-[#0F4C5C]" disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원권 등록 모달 */}
      <Dialog open={isMembershipOpen} onOpenChange={setIsMembershipOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>회원권 등록 - {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>회원권 이름 <span className="text-red-500">*</span></Label>
              <Input
                value={membershipForm.name}
                onChange={(e) => setMembershipForm({...membershipForm, name: e.target.value})}
                placeholder="예: PT 30회, OT 20회"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>총 횟수 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={membershipForm.total_sessions}
                  onChange={(e) => setMembershipForm({...membershipForm, total_sessions: e.target.value})}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label>결제 금액 (원)</Label>
                <Input
                  type="number"
                  value={membershipForm.amount}
                  onChange={(e) => setMembershipForm({...membershipForm, amount: e.target.value})}
                  placeholder="1000000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={membershipForm.start_date}
                  onChange={(e) => setMembershipForm({...membershipForm, start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={membershipForm.end_date}
                  onChange={(e) => setMembershipForm({...membershipForm, end_date: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>결제 방법</Label>
              <Select value={membershipForm.method} onValueChange={(v) => setMembershipForm({...membershipForm, method: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateMembership} className="bg-[#0F4C5C]" disabled={isLoading}>
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
