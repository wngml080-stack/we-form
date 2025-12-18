"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Pencil, Trash2, MapPin, Calendar, User, Building2, Users, UserCheck, TrendingUp, Clock, Activity, BarChart3, Bell } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

// 카테고리 목록 정의
const CATEGORY_OPTIONS = ["헬스", "PT", "필라테스", "골프", "GX", "요가"];

export default function HQPage() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<any[]>([]);
  const [allStaffs, setAllStaffs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [myRole, setMyRole] = useState<string>("");

  // system_admin용 회사 목록
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // 통계 데이터
  const [stats, setStats] = useState({
    totalGyms: 0,
    totalStaffs: 0,
    totalMembers: 0,
    newMembersThisMonth: 0
  });
  const [gymStats, setGymStats] = useState<any[]>([]);

  const [selectedGym, setSelectedGym] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  // 지점 필터
  const [selectedGymFilter, setSelectedGymFilter] = useState<string>("all");

  // 지점 상세보기 모달
  const [selectedGymDetail, setSelectedGymDetail] = useState<any | null>(null);
  const [isGymDetailOpen, setIsGymDetailOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("current"); // current, previous, recent3
  const [isEditingBep, setIsEditingBep] = useState(false);
  const [bepForm, setBepForm] = useState({ fc_bep: 75000000, pt_bep: 100000000 });

  // 직원 정보 수정 모달
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isStaffEditOpen, setIsStaffEditOpen] = useState(false);
  const [staffEditForm, setStaffEditForm] = useState({ job_title: "", role: "", employment_status: "" });

  // 회사 행사 관리
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_type: "general",
    gym_id: "all",
    event_date: new Date().toISOString().split('T')[0],
    start_time: "",
    end_time: "",
    location: "",
    target_audience: "all",
    color: "blue",
    is_active: true
  });

  // 폼 상태
  const initialForm = {
    gymName: "", managerId: "", category: [] as string[], size: "", open_date: "", memo: "", status: "active"
  };
  const [formData, setFormData] = useState(initialForm);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createSupabaseClient();

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  useEffect(() => {
    init();
  }, []);

  // system_admin이 회사를 변경했을 때 데이터 다시 가져오기
  useEffect(() => {
    if (selectedCompanyId && myRole === 'system_admin') {
      fetchData(selectedCompanyId, myRole);
      // 선택된 회사의 이름 업데이트
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      if (selectedCompany) {
        setCompanyName(selectedCompany.name);
      }
      // 지점 필터를 '전체'로 초기화
      setSelectedGymFilter("all");
    }
  }, [selectedCompanyId]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 내 정보 가져오기
    const { data: me } = await supabase
      .from("staffs")
      .select("company_id, role, companies(name)")
      .eq("user_id", user.id)
      .single();

    if (me) {
      setCompanyId(me.company_id);
      setMyRole(me.role);
      // @ts-ignore
      setCompanyName(me.companies?.name ?? "");

      // system_admin인 경우 운영 중인 회사 목록만 가져오기
      if (me.role === 'system_admin') {
        const { data: companiesData } = await supabase
          .from("companies")
          .select("id, name")
          .eq("status", "active")
          .order("name", { ascending: true });

        if (companiesData) {
          setCompanies(companiesData);
          setSelectedCompanyId(me.company_id); // 기본값은 자신의 회사
        }
      }

      // company_id 기준으로 데이터 조회
      fetchData(me.company_id, me.role);
    }
  };

  const fetchData = async (targetCompanyId: string | null, role: string) => {
    if (!targetCompanyId) return;

    // 지점 목록 (자기 회사 것만)
    const { data: gymData, error: gymError } = await supabase
        .from("gyms")
        .select(`*, staffs(id, name, role, email)`)
        .eq("company_id", targetCompanyId)
        .order("created_at", { ascending: false });

    if (gymError) {
      console.error('❌ 지점 조회 오류:', gymError);
    }
    if (gymData) setGyms(gymData);

    // 대기 직원 (자기 회사 것만, gym_id가 null인 사람)
    const { data: pendingData } = await supabase
      .from("staffs")
      .select("*")
      .eq("company_id", targetCompanyId)
      .is("gym_id", null)
      .order("created_at", { ascending: false });
    if (pendingData) setPendingStaffs(pendingData);

    // 전체 직원 (자기 회사 것만)
    const { data: allData } = await supabase
        .from("staffs")
        .select("id, name, email, role, job_title, gym_id, created_at, updated_at, user_id, gyms(name)")
        .eq("company_id", targetCompanyId)
        .order("name", { ascending: true });
    if (allData) setAllStaffs(allData);

    // 회원 데이터 (자기 회사 것만)
    const { data: memberData } = await supabase
      .from("members")
      .select("id, name, phone, status, created_at, gym_id, gyms(name)")
      .eq("company_id", targetCompanyId)
      .order("created_at", { ascending: false });
    if (memberData) setMembers(memberData);

    // 결제 데이터 가져오기 (매출 계산용)
    const { data: paymentData, error: paymentError } = await supabase
      .from("member_payments")
      .select("id, member_id, amount, membership_type, registration_type, created_at, gym_id, visit_route")
      .eq("company_id", targetCompanyId)
      .order("created_at", { ascending: false });

    console.log('💳 결제 데이터 조회:', {
      결제건수: paymentData?.length || 0,
      에러: paymentError,
      샘플데이터: paymentData?.slice(0, 3)
    });

    // 회원에 결제 정보 연결
    if (memberData && paymentData) {
      const membersWithPayments = memberData.map(member => {
        const payments = paymentData.filter(p => p.member_id === member.id);
        return {
          ...member,
          payments: payments
        };
      });
      setMembers(membersWithPayments);
      console.log('👥 회원+결제 연결 완료:', {
        전체회원수: membersWithPayments.length,
        결제있는회원수: membersWithPayments.filter(m => m.payments.length > 0).length
      });
    }

    // 직접 count 쿼리로 정확한 통계 가져오기
    const { count: totalGymsCount } = await supabase
      .from("gyms")
      .select("*", { count: "exact", head: true })
      .eq("company_id", targetCompanyId);

    const { count: totalStaffsCount } = await supabase
      .from("staffs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", targetCompanyId);

    const { count: totalMembersCount } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", targetCompanyId);

    // 최근 활동 데이터 생성 (최근 30일 이내 직원 활동만)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities: any[] = [];

    // 최근 직원 활동 (최근 30일 이내)
    const recentStaffs = allData?.filter(s =>
      s.created_at &&
      new Date(s.created_at) >= thirtyDaysAgo
    ) || [];

    recentStaffs.forEach(staff => {
      // @ts-ignore
      const gymName = staff.gyms?.name || '미배정';

      // user_id가 있으면 자체 가입, 없으면 수동 추가
      const isManualAdd = !staff.user_id;
      const activityType = isManualAdd ? '수동 추가' : '자체 가입';
      const badgeColor = isManualAdd ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';

      // 직책 정보
      const jobTitle = staff.job_title || '-';
      const roleText = staff.role === 'admin' ? '관리자' : staff.role === 'company_admin' ? '본사 관리자' : '직원';

      activities.push({
        id: `staff-${staff.id}`,
        name: staff.name,
        type: 'staff',
        activityType,
        gymName,
        jobTitle,
        roleText,
        created_at: staff.created_at,
        badgeColor
      });
    });

    // 날짜순 정렬 (최신순)
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivities(activities.slice(0, 15));

    // 이번 달 신규 회원 수 (count 쿼리 사용)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: newMembersThisMonthCount } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", targetCompanyId)
      .gte("created_at", firstDayOfMonth.toISOString());

    // 통계 설정 (count 쿼리 결과 사용)
    setStats({
      totalGyms: totalGymsCount || 0,
      totalStaffs: totalStaffsCount || 0,
      totalMembers: totalMembersCount || 0,
      newMembersThisMonth: newMembersThisMonthCount || 0
    });

    // 지점별 통계
    const gymStatsData = gymData?.map(gym => {
      const staffCount = allData?.filter(s => s.gym_id === gym.id).length || 0;
      const memberCount = memberData?.filter(m => m.gym_id === gym.id).length || 0;
      const newMembersCount = memberData?.filter(m => {
        if (m.gym_id !== gym.id) return false;
        const createdAt = new Date(m.created_at);
        return createdAt >= firstDayOfMonth;
      }).length || 0;

      return {
        id: gym.id,
        name: gym.name,
        status: gym.status,
        staffCount,
        memberCount,
        newMembersCount
      };
    }) || [];

    setGymStats(gymStatsData);

    // 회사 행사 조회 (자기 회사 것만)
    const { data: eventsData } = await supabase
      .from("company_events")
      .select("*, gyms(name)")
      .eq("company_id", targetCompanyId)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (eventsData) setCompanyEvents(eventsData);
  };

  const handleAssign = async (staffId: string) => {
    if (!selectedGym || !selectedRole) return alert("지점과 권한을 선택해주세요.");
    if (!confirm("발령 보내시겠습니까?")) return;
    const { error } = await supabase.from("staffs").update({ gym_id: selectedGym, role: selectedRole, employment_status: "재직" }).eq("id", staffId);
    if (!error) { alert("발령 완료!"); fetchData(companyId, myRole); } else { alert(error.message); }
  };

  // 회사 행사 관리 함수들
  const openEventModal = (event: any = null) => {
    if (event) {
      // 수정 모드
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        gym_id: event.gym_id || "all",
        event_date: event.event_date,
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        location: event.location || "",
        target_audience: event.target_audience,
        color: event.color,
        is_active: event.is_active
      });
    } else {
      // 신규 등록 모드
      setEditingEvent(null);
      setEventForm({
        title: "",
        description: "",
        event_type: "general",
        gym_id: "all",
        event_date: new Date().toISOString().split('T')[0],
        start_time: "",
        end_time: "",
        location: "",
        target_audience: "all",
        color: "blue",
        is_active: true
      });
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) {
      return alert("행사 제목을 입력해주세요.");
    }

    setIsLoading(true);
    try {
      const targetCompanyId = companyId || selectedCompanyId;
      if (!targetCompanyId) {
        throw new Error("회사 정보를 찾을 수 없습니다.");
      }

      const eventData = {
        company_id: targetCompanyId,
        gym_id: eventForm.gym_id === "all" ? null : eventForm.gym_id,
        title: eventForm.title,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        event_date: eventForm.event_date,
        start_time: eventForm.start_time || null,
        end_time: eventForm.end_time || null,
        location: eventForm.location || null,
        target_audience: eventForm.target_audience,
        color: eventForm.color,
        is_active: eventForm.is_active
      };

      if (editingEvent) {
        // 수정
        const { error } = await supabase
          .from("company_events")
          .update(eventData)
          .eq("id", editingEvent.id);

        if (error) throw error;
        alert("회사 행사가 수정되었습니다.");
      } else {
        // 신규 등록
        const { error } = await supabase
          .from("company_events")
          .insert(eventData);

        if (error) throw error;
        alert("회사 행사가 등록되었습니다.");
      }

      setIsEventModalOpen(false);
      fetchData(targetCompanyId, myRole);
    } catch (error: any) {
      alert("오류: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("company_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("회사 행사가 삭제되었습니다.");
      const targetCompanyId = companyId || selectedCompanyId;
      fetchData(targetCompanyId, myRole);
    } catch (error: any) {
      alert("오류: " + error.message);
    }
  };

  const handleToggleEventActive = async (event: any) => {
    try {
      const { error } = await supabase
        .from("company_events")
        .update({ is_active: !event.is_active })
        .eq("id", event.id);

      if (error) throw error;

      const targetCompanyId = companyId || selectedCompanyId;
      fetchData(targetCompanyId, myRole);
    } catch (error: any) {
      alert("오류: " + error.message);
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => {
        const exists = prev.category.includes(cat);
        if (exists) {
            return { ...prev, category: prev.category.filter(c => c !== cat) };
        } else {
            return { ...prev, category: [...prev.category, cat] };
        }
    });
  };

  const handleCreateBranch = async () => {
    // 필수값 체크 강화
    if (!formData.gymName || !formData.managerId) return alert("필수 정보(지점명, 지점장)를 입력해주세요.");
    
    setIsLoading(true);
    try {
        const res = await fetch("/api/admin/create-branch", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...formData,
                category: formData.category.join(", ") 
            })
        });
        if (!res.ok) throw new Error("실패");
        alert("생성 완료!");
        setIsCreateOpen(false); setFormData(initialForm); fetchData(companyId, myRole);
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleUpdateGym = async () => {
    if (!editTargetId) return;
    setIsLoading(true);
    try {
        const res = await fetch("/api/admin/update-branch", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                ...formData, 
                gymId: editTargetId, 
                newManagerId: formData.managerId,
                category: formData.category.join(", ") 
            })
        });
        if (!res.ok) throw new Error("실패");
        alert("수정 완료!");
        setIsEditOpen(false); setEditTargetId(null); setFormData(initialForm); fetchData(companyId, myRole);
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const openEditModal = (gym: any) => {
    setEditTargetId(gym.id);
    setFormData({
        gymName: gym.name || "",
        managerId: "none",
        category: gym.category ? gym.category.split(", ") : [],
        size: gym.size || "",
        open_date: gym.open_date || "",
        memo: gym.memo || "",
        status: gym.status || "active"
    });
    setIsEditOpen(true);
  };

  const handleDeleteGym = async (gymId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("gyms").delete().eq("id", gymId);
    fetchData(companyId, myRole);
  };

  const openStaffEditModal = (staff: any) => {
    setEditingStaff(staff);
    setStaffEditForm({
      job_title: staff.job_title || "",
      role: staff.role || "staff",
      employment_status: staff.employment_status || "재직"
    });
    setIsStaffEditOpen(true);
  };

  const handleStaffUpdate = async () => {
    if (!editingStaff) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("staffs")
        .update({
          job_title: staffEditForm.job_title,
          role: staffEditForm.role,
          employment_status: staffEditForm.employment_status
        })
        .eq("id", editingStaff.id);

      if (error) throw error;
      alert("직원 정보가 수정되었습니다.");
      setIsStaffEditOpen(false);
      fetchData(companyId || selectedCompanyId, myRole);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openGymDetailModal = (gym: any) => {
    const gymStat = gymStats.find(g => g.id === gym.id);
    setSelectedGymDetail({ ...gym, stats: gymStat });
    setBepForm({
      fc_bep: gym.fc_bep || 75000000,
      pt_bep: gym.pt_bep || 100000000
    });
    setSelectedMonth("current");
    setIsEditingBep(false);
    setIsGymDetailOpen(true);
  };

  const handleUpdateBep = async () => {
    if (!selectedGymDetail) return;

    try {
      const res = await fetch("/api/admin/update-gym-bep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gym_id: selectedGymDetail.id,
          fc_bep: bepForm.fc_bep,
          pt_bep: bepForm.pt_bep
        })
      });

      if (!res.ok) throw new Error("BEP 업데이트 실패");

      alert("BEP가 업데이트되었습니다!");
      setIsEditingBep(false);
      fetchData(companyId || selectedCompanyId, myRole);

      // 모달 데이터도 업데이트
      setSelectedGymDetail({
        ...selectedGymDetail,
        fc_bep: bepForm.fc_bep,
        pt_bep: bepForm.pt_bep
      });
    } catch (error: any) {
      alert("오류: " + error.message);
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes("필라테스")) return "bg-pink-100 text-pink-700 border-pink-200";
    if (cat.includes("골프")) return "bg-green-100 text-green-700 border-green-200";
    if (cat.includes("PT")) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  // 필터링된 데이터
  const filteredStats = selectedGymFilter === "all" ? stats : (() => {
    const selectedGymData = gyms.find(g => g.id === selectedGymFilter);
    if (!selectedGymData) return stats;

    const staffCount = allStaffs.filter(s => s.gym_id === selectedGymFilter).length;
    const memberCount = members.filter(m => m.gym_id === selectedGymFilter).length;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newMembersCount = members.filter(m => {
      if (m.gym_id !== selectedGymFilter) return false;
      const createdAt = new Date(m.created_at);
      return createdAt >= firstDayOfMonth;
    }).length;

    return {
      totalGyms: 1,
      totalStaffs: staffCount,
      totalMembers: memberCount,
      newMembersThisMonth: newMembersCount
    };
  })();

  const filteredGymStats = selectedGymFilter === "all"
    ? gymStats
    : gymStats.filter(g => g.id === selectedGymFilter);

  const filteredMembers = selectedGymFilter === "all"
    ? members
    : members.filter(m => m.gym_id === selectedGymFilter);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">본사 관리</h1>
          <p className="text-gray-500 mt-2 font-medium">{companyName}의 지점과 직원을 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">회사:</Label>
            {myRole === 'system_admin' ? (
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="회사 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="px-3 py-1.5 bg-[#2F80ED] text-white rounded-md text-sm font-medium">
                {companyName}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">지점:</Label>
            <Select value={selectedGymFilter} onValueChange={setSelectedGymFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체</SelectItem>
                {gyms.map(gym => (
                  <SelectItem key={gym.id} value={gym.id}>{gym.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {selectedGymFilter === "all" ? "전체 지점" : "선택 지점"}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{filteredStats.totalGyms}</div>
          <p className="text-sm text-gray-500">개 지점 운영 중</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">직원</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{filteredStats.totalStaffs}</div>
          <p className="text-sm text-gray-500">명 재직 중</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">회원</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{filteredStats.totalMembers}</div>
          <p className="text-sm text-gray-500">명 등록</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">이번 달 신규</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{filteredStats.newMembersThisMonth}</div>
          <p className="text-sm text-gray-500">명 가입</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 대기자 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">가입 승인 및 발령 대기</h3>
              </div>
              {pendingStaffs.length > 0 && (
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {pendingStaffs.length}명
                </span>
              )}
            </div>
          </div>
          <div className="p-6 space-y-3">
            {pendingStaffs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">대기 인원 없음</p>
              </div>
            ) : (
              pendingStaffs.map((staff) => (
                <div key={staff.id} className="border border-gray-200 bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-semibold text-gray-900">{staff.name}</span>
                      <p className="text-xs text-gray-500 mt-1">{staff.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select onValueChange={setSelectedGym}>
                      <SelectTrigger className="flex-1 h-9 bg-white">
                        <SelectValue placeholder="지점 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-[120px] h-9 bg-white">
                        <SelectValue placeholder="권한" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="admin">관리자</SelectItem>
                        <SelectItem value="staff">직원</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-9 bg-gray-900 hover:bg-gray-800 text-white"
                      onClick={() => handleAssign(staff.id)}
                    >
                      승인
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. 운영 센터 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">운영 중인 센터</h3>
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {gyms.length}개
                </span>
              </div>
            </div>
            <Button
              onClick={() => { setFormData(initialForm); setIsCreateOpen(true); }}
              size="sm"
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              <Plus className="mr-1 h-4 w-4" /> 지점 생성
            </Button>
          </div>
          <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
            {gyms.map((gym) => {
              const manager = gym.staffs?.find((s:any) => s.role === 'admin') || gym.staffs?.[0];
              const categories = gym.category ? gym.category.split(", ") : [];

              return (
                <div key={gym.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => openGymDetailModal(gym)}>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-semibold text-gray-900">{gym.name}</span>
                        {categories.map((cat: string) => (
                          <Badge key={cat} variant="outline" className={getCategoryColor(cat)}>{cat}</Badge>
                        ))}
                        {gym.status === 'pending' && <Badge className="bg-amber-500">승인대기</Badge>}
                      </div>
                      <div className="text-xs text-gray-600 flex gap-3 items-center flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3"/> {gym.size || '-'}평
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3"/> {gym.open_date || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3"/> {manager?.name || '미정'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); openEditModal(gym); }}>
                        <Pencil className="h-4 w-4 text-gray-500"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); handleDeleteGym(gym.id); }}>
                        <Trash2 className="h-4 w-4 text-gray-500"/>
                      </Button>
                    </div>
                  </div>
                  {gym.memo && (
                    <div className="mt-3 text-xs bg-gray-50 border-l-2 border-gray-300 p-2 rounded text-gray-600">
                      {gym.memo}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 회사 행사 관리 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900">회사 행사 관리</h3>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {companyEvents.length}개
              </span>
            </div>
          </div>
          <Button
            onClick={() => openEventModal()}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="mr-1 h-4 w-4" /> 행사 등록
          </Button>
        </div>
        <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
          {companyEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Calendar className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">등록된 회사 행사가 없습니다.</p>
            </div>
          ) : (
            companyEvents.map((event) => {
              const eventTypeColors: Record<string, string> = {
                general: "bg-blue-100 text-blue-700 border-blue-200",
                training: "bg-purple-100 text-purple-700 border-purple-200",
                meeting: "bg-orange-100 text-orange-700 border-orange-200",
                holiday: "bg-red-100 text-red-700 border-red-200",
                celebration: "bg-pink-100 text-pink-700 border-pink-200"
              };
              const eventTypeLabels: Record<string, string> = {
                general: "일반",
                training: "교육",
                meeting: "회의",
                holiday: "휴무",
                celebration: "행사"
              };

              const eventDate = new Date(event.event_date);
              const isToday = event.event_date === new Date().toISOString().split('T')[0];

              return (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className={eventTypeColors[event.event_type]}>
                          {eventTypeLabels[event.event_type]}
                        </Badge>
                        {event.gym_id ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {event.gyms?.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            전사 행사
                          </Badge>
                        )}
                        {isToday && (
                          <Badge className="bg-blue-500 text-white">오늘</Badge>
                        )}
                        {!event.is_active && (
                          <Badge className="bg-gray-400">비활성</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{event.description}</p>
                      )}
                      <div className="text-xs text-gray-500 flex gap-3 items-center flex-wrap">
                        <span>날짜: {event.event_date}</span>
                        {event.start_time && <span>시간: {event.start_time.substring(0, 5)}</span>}
                        {event.end_time && <span>~ {event.end_time.substring(0, 5)}</span>}
                        {event.location && <span>장소: {event.location}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50"
                        onClick={() => handleToggleEventActive(event)}
                        title={event.is_active ? "비활성화" : "활성화"}
                      >
                        <Activity className={`h-4 w-4 ${event.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50"
                        onClick={() => openEventModal(event)}
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. 직원 재직 현황 관리 & 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 직원 재직 현황 관리 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">직원 재직 현황</h3>
              </div>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {selectedGymFilter === "all"
                  ? allStaffs.length
                  : allStaffs.filter(s => s.gym_id === selectedGymFilter).length}명
              </span>
            </div>
          </div>
          <div className="p-6">
            {(() => {
              const filteredStaffs = selectedGymFilter === "all"
                ? allStaffs
                : allStaffs.filter(s => s.gym_id === selectedGymFilter);

              return filteredStaffs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">등록된 직원이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredStaffs.map((staff: any) => {
                  // @ts-ignore
                  const gymName = staff.gyms?.name || '미배정';
                  const roleText = staff.role === 'admin' ? '관리자' : staff.role === 'company_admin' ? '본사 관리자' : '직원';
                  const statusColor = staff.employment_status === '재직' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                     staff.employment_status === '퇴사' ? 'bg-red-50 text-red-700 border-red-200' :
                                     'bg-gray-50 text-gray-700 border-gray-200';

                  return (
                    <div key={staff.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-gray-900">{staff.name}</span>
                            <Badge variant="outline" className={`text-xs ${statusColor}`}>
                              {staff.employment_status || '재직'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">{staff.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100"
                          onClick={() => openStaffEditModal(staff)}
                        >
                          <Pencil className="h-4 w-4 text-gray-500"/>
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 rounded p-2 border border-gray-200">
                          <div className="text-gray-600 mb-0.5">소속</div>
                          <div className="font-medium text-gray-900">{gymName}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 border border-gray-200">
                          <div className="text-gray-600 mb-0.5">직책</div>
                          <div className="font-medium text-gray-900">{staff.job_title || '-'}</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 border border-gray-200">
                          <div className="text-gray-600 mb-0.5">권한</div>
                          <div className="font-medium text-gray-900">{roleText}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
            })()}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">최근 활동</h3>
            </div>
          </div>
          <div className="p-6">
            {recentActivities.length === 0 && pendingStaffs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">최근 활동이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pendingStaffs.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-amber-100 rounded-lg">
                        <Clock className="w-3 h-3 text-amber-600" />
                      </div>
                      <span className="font-semibold text-gray-900">발령 대기</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {pendingStaffs.length}명의 직원이 발령을 기다리고 있습니다
                    </p>
                  </div>
                )}
                {recentActivities.map((activity: any) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{activity.name}</span>
                      <Badge variant="outline" className={`text-xs border-0 ${activity.badgeColor}`}>
                        {activity.activityType}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3"/> {activity.gymName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3"/> {formatDate(activity.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3"/> 직책: {activity.jobTitle}
                        </span>
                        <span>•</span>
                        <span>권한: {activity.roleText}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 통합 모달 */}
      {[ 
        { isOpen: isCreateOpen, setIsOpen: setIsCreateOpen, title: "지점 생성", action: handleCreateBranch, btn: "생성하기" },
        { isOpen: isEditOpen, setIsOpen: setIsEditOpen, title: "지점 수정", action: handleUpdateGym, btn: "저장하기" }
      ].map((modal, idx) => (
        <Dialog key={idx} open={modal.isOpen} onOpenChange={modal.setIsOpen}>
            <DialogContent className="bg-white sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{modal.title}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* 👇 필수 항목에 빨간색 * 표시 추가 */}
                        <div className="space-y-2"><Label>지점명 <span className="text-red-500">*</span></Label><Input value={formData.gymName} onChange={(e) => setFormData({...formData, gymName: e.target.value})}/></div>
                        
                        <div className="space-y-2 col-span-2">
                            <Label>운영 종목 (다중 선택) <span className="text-red-500">*</span></Label>
                            <div className="flex gap-2 flex-wrap">
                                {CATEGORY_OPTIONS.map((cat) => {
                                    const isSelected = formData.category.includes(cat);
                                    return (
                                            <Badge 
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={`cursor-pointer text-sm py-1 px-3 select-none border ${
                                                isSelected 
                                                ? "bg-[#2F80ED] text-white hover:bg-[#1c6cd7] border-[#2F80ED]" 
                                                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {cat} {isSelected && "✓"}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>평수</Label><Input value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} placeholder="예: 100"/></div>
                        <div className="space-y-2"><Label>오픈일</Label><Input type="date" value={formData.open_date} onChange={(e) => setFormData({...formData, open_date: e.target.value})}/></div>
                    </div>

                    <div className="space-y-2">
                        <Label>지점장 선택 <span className="text-red-500">*</span></Label>
                        <Select value={formData.managerId} onValueChange={(v) => setFormData({...formData, managerId: v})}>
                            <SelectTrigger><SelectValue placeholder={modal.title.includes("수정") ? "변경 시 선택" : "선택"} /></SelectTrigger>
                            <SelectContent className="bg-white max-h-[200px]">
                                {modal.title.includes("수정") && <SelectItem value="none">-- 변경 안함 --</SelectItem>}
                                {allStaffs.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name} <span className="text-xs text-gray-400">({s.gyms?.name || '소속없음'})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {modal.title.includes("수정") && (
                        <div className="space-y-2">
                             <Label>상태 <span className="text-red-500">*</span></Label>
                             <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent className="bg-white"><SelectItem value="active">운영중</SelectItem><SelectItem value="pending">대기</SelectItem><SelectItem value="closed">폐업</SelectItem></SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2"><Label>메모</Label><Textarea value={formData.memo} onChange={(e) => setFormData({...formData, memo: e.target.value})} placeholder="특이사항 입력"/></div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={modal.action}
                    className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
                    disabled={isLoading}
                  >
                    {modal.btn}
                  </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      ))}

      {/* 직원 정보 수정 모달 */}
      <Dialog open={isStaffEditOpen} onOpenChange={setIsStaffEditOpen}>
        <DialogContent className="bg-white sm:max-w-[500px]">
          <DialogHeader><DialogTitle>직원 정보 수정</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>직책</Label>
              <Input
                value={staffEditForm.job_title}
                onChange={(e) => setStaffEditForm({...staffEditForm, job_title: e.target.value})}
                placeholder="예: 대표, 부점장, 트레이너 등"
              />
            </div>
            <div className="space-y-2">
              <Label>권한</Label>
              <Select value={staffEditForm.role} onValueChange={(v) => setStaffEditForm({...staffEditForm, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="company_admin">본사 관리자</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="staff">직원</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>재직 상태</Label>
              <Select value={staffEditForm.employment_status} onValueChange={(v) => setStaffEditForm({...staffEditForm, employment_status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="재직">재직</SelectItem>
                  <SelectItem value="휴직">휴직</SelectItem>
                  <SelectItem value="퇴사">퇴사</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleStaffUpdate}
              className="bg-[#2F80ED] hover:bg-[#1c6cd7]"
              disabled={isLoading}
            >
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 지점 상세보기 모달 */}
      <Dialog open={isGymDetailOpen} onOpenChange={setIsGymDetailOpen}>
        <DialogContent className="bg-white sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{selectedGymDetail?.name} 상세 현황</DialogTitle>
              {!isEditingBep ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBep(true)}
                  className="text-xs"
                >
                  <Pencil className="w-3 h-3 mr-1" /> BEP 수정
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingBep(false);
                      setBepForm({
                        fc_bep: selectedGymDetail.fc_bep || 75000000,
                        pt_bep: selectedGymDetail.pt_bep || 100000000
                      });
                    }}
                    className="text-xs"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdateBep}
                    className="text-xs bg-[#2F80ED] hover:bg-[#1c6cd7]"
                  >
                    저장
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedGymDetail && (() => {
            // 회원 데이터 필터링
            const gymMembers = members.filter(m => m.gym_id === selectedGymDetail.id);

            // 해당 지점의 모든 결제 데이터 가져오기
            const allPayments = gymMembers.flatMap((m: any) => m.payments || []);

            // PT 여부 확인 함수 (membership_type에 PT가 포함되어 있으면 PT)
            const isPT = (payment: any) => {
              const membershipType = payment.membership_type || '';
              return membershipType.toUpperCase().includes('PT');
            };

            // 날짜 계산
            const now = new Date();
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const recent3MonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

            // 월별로 결제 데이터 필터링
            let filteredPayments = allPayments;
            if (selectedMonth === "current") {
              filteredPayments = allPayments.filter(p => new Date(p.created_at) >= currentMonthStart);
            } else if (selectedMonth === "previous") {
              filteredPayments = allPayments.filter(p => {
                const date = new Date(p.created_at);
                return date >= previousMonthStart && date <= previousMonthEnd;
              });
            } else if (selectedMonth === "recent3") {
              filteredPayments = allPayments.filter(p => new Date(p.created_at) >= recent3MonthsStart);
            }

            // PT와 FC로 결제 데이터 분류
            const ptPayments = filteredPayments.filter(p => isPT(p));
            const fcPayments = filteredPayments.filter(p => !isPT(p));

            // FC 통계
            const fcTotalSales = fcPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const fcNewPayments = fcPayments.filter(p => p.registration_type === '신규');
            const fcRenewPayments = fcPayments.filter(p => p.registration_type === '리뉴');
            const fcNewSales = fcNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            // FC 회원 수 계산 (중복 제거)
            const fcMemberIds = [...new Set(fcPayments.map(p => p.member_id))];
            // visit_route로 워크인/비대면 구분 (인터넷 검색, 네이버 등이 포함되면 비대면, 그 외는 워크인)
            const fcOnlineCount = fcPayments.filter(p => {
              const route = (p.visit_route || '').toLowerCase();
              return route.includes('인터넷') || route.includes('네이버') || route.includes('온라인');
            }).length;
            const fcWalkinCount = fcPayments.length - fcOnlineCount;
            const fcAvgPrice = fcPayments.length > 0 ? fcTotalSales / fcPayments.length : 0;
            const fcNewRate = fcPayments.length > 0 ? (fcNewPayments.length / fcPayments.length * 100) : 0;

            // PT 통계
            const ptTotalSales = ptPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const ptNewPayments = ptPayments.filter(p => p.registration_type === '신규');
            const ptRenewPayments = ptPayments.filter(p => p.registration_type === '리뉴');
            const ptNewSales = ptNewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const ptRenewSales = ptRenewPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            // PT 회원 수 계산 (중복 제거)
            const ptMemberIds = [...new Set(ptPayments.map(p => p.member_id))];
            const ptAvgPrice = ptPayments.length > 0 ? ptTotalSales / ptPayments.length : 0;
            const ptRenewRate = ptPayments.length > 0 ? (ptRenewPayments.length / ptPayments.length * 100) : 0;

            // BEP (지점에 설정된 값 사용)
            const fcBEP = isEditingBep ? bepForm.fc_bep : (selectedGymDetail.fc_bep || 75000000);
            const ptBEP = isEditingBep ? bepForm.pt_bep : (selectedGymDetail.pt_bep || 100000000);
            const fcBepRate = fcBEP > 0 ? (fcTotalSales / fcBEP * 100) : 0;
            const ptBepRate = ptBEP > 0 ? (ptTotalSales / ptBEP * 100) : 0;

            // 기간 표시 텍스트
            const periodText = selectedMonth === "current" ? "이번 달" :
                              selectedMonth === "previous" ? "지난 달" :
                              "최근 3개월";

            // 디버깅 로그
            console.log('🔍 지점 통계 디버깅:', {
              지점명: selectedGymDetail.name,
              전체회원수: gymMembers.length,
              전체결제건수: allPayments.length,
              FC결제건수: fcPayments.length,
              FC총매출: fcTotalSales,
              PT결제건수: ptPayments.length,
              PT총매출: ptTotalSales,
              샘플결제데이터: allPayments.slice(0, 3)
            });

            return (
              <div className="py-4 space-y-6">
                {/* 기간 선택 탭 */}
                <div className="flex items-center gap-2 border-b pb-3">
                  <span className="text-sm font-semibold text-gray-700 mr-2">기간:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedMonth === "current" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMonth("current")}
                      className={selectedMonth === "current" ? "bg-[#2F80ED]" : ""}
                    >
                      이번 달
                    </Button>
                    <Button
                      variant={selectedMonth === "previous" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMonth("previous")}
                      className={selectedMonth === "previous" ? "bg-[#2F80ED]" : ""}
                    >
                      지난 달
                    </Button>
                    <Button
                      variant={selectedMonth === "recent3" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMonth("recent3")}
                      className={selectedMonth === "recent3" ? "bg-[#2F80ED]" : ""}
                    >
                      최근 3개월
                    </Button>
                  </div>
                  <div className="ml-auto text-sm text-gray-500">
                    ({periodText} 데이터)
                  </div>
                </div>

                {/* BEP 설정 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">BEP (손익분기점) 설정</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1">FC BEP</Label>
                      {isEditingBep ? (
                        <Input
                          type="number"
                          value={bepForm.fc_bep}
                          onChange={(e) => setBepForm({...bepForm, fc_bep: Number(e.target.value)})}
                          className="h-9"
                        />
                      ) : (
                        <div className="text-xl font-bold text-gray-900">
                          ₩{fcBEP.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1">PT BEP</Label>
                      {isEditingBep ? (
                        <Input
                          type="number"
                          value={bepForm.pt_bep}
                          onChange={(e) => setBepForm({...bepForm, pt_bep: Number(e.target.value)})}
                          className="h-9"
                        />
                      ) : (
                        <div className="text-xl font-bold text-gray-900">
                          ₩{ptBEP.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 기본 정보 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">기본 정보</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">평수</div>
                      <div className="font-medium text-gray-900">{selectedGymDetail.size || '-'}평</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">오픈일</div>
                      <div className="font-medium text-gray-900">{selectedGymDetail.open_date || '-'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">운영 종목</div>
                      <div className="font-medium text-gray-900 text-xs">
                        {selectedGymDetail.category ? selectedGymDetail.category.split(", ").join(", ") : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FC 상세 DATA */}
                <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-sm">FC</span>
                    회원권 / 부가상품 상세 DATA
                  </h3>

                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 border border-amber-300">
                      <div className="text-xs text-gray-600 mb-1">FC BEP</div>
                      <div className="text-lg font-bold text-gray-900">₩{fcBEP.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-300">
                      <div className="text-xs text-gray-600 mb-1">FC 총 매출</div>
                      <div className="text-lg font-bold text-blue-600">₩{fcTotalSales.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-300">
                      <div className="text-xs text-gray-600 mb-1">BEP 달성률</div>
                      <div className={`text-lg font-bold ${fcBepRate >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                        {fcBepRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-300">
                      <div className="text-xs text-gray-600 mb-1">FC 객단가</div>
                      <div className="text-lg font-bold text-gray-900">₩{Math.round(fcAvgPrice).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">총 등록</div>
                      <div className="text-xl font-bold text-gray-900">{fcPayments.length}</div>
                      <div className="text-xs text-gray-500">건</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">워크인</div>
                      <div className="text-xl font-bold text-blue-600">{fcWalkinCount}</div>
                      <div className="text-xs text-gray-500">건</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">비대면</div>
                      <div className="text-xl font-bold text-purple-600">{fcOnlineCount}</div>
                      <div className="text-xs text-gray-500">건</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">FC 리뉴얼</div>
                      <div className="text-xl font-bold text-emerald-600">{fcRenewPayments.length}</div>
                      <div className="text-xs text-gray-500">건</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-amber-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">신규율</div>
                      <div className="text-xl font-bold text-orange-600">{fcNewRate.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="mt-3 bg-white rounded-lg p-3 border border-amber-300">
                    <div className="text-xs text-gray-600 mb-1">FC 신규매출 ({periodText})</div>
                    <div className="text-2xl font-bold text-green-600">₩{fcNewSales.toLocaleString()}</div>
                  </div>
                </div>

                {/* PT 상세 DATA */}
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-sm">PT</span>
                    PT / PPT 상세 DATA
                  </h3>

                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <div className="text-xs text-gray-600 mb-1">PT BEP</div>
                      <div className="text-lg font-bold text-gray-900">₩{ptBEP.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <div className="text-xs text-gray-600 mb-1">PT 총 매출</div>
                      <div className="text-lg font-bold text-blue-600">₩{ptTotalSales.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <div className="text-xs text-gray-600 mb-1">BEP 달성률</div>
                      <div className={`text-lg font-bold ${ptBepRate >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                        {ptBepRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <div className="text-xs text-gray-600 mb-1">PT 객단가</div>
                      <div className="text-lg font-bold text-gray-900">₩{Math.round(ptAvgPrice).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">PT 총 등록</div>
                      <div className="text-xl font-bold text-gray-900">{ptPayments.length}</div>
                      <div className="text-xs text-gray-500">건</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">PT 신규</div>
                      <div className="text-xl font-bold text-blue-600">{ptNewPayments.length}</div>
                      <div className="text-xs text-gray-500">건</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">PT 재등록</div>
                      <div className="text-xl font-bold text-emerald-600">{ptRenewPayments.length}</div>
                      <div className="text-xs text-gray-500">건</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300 text-center">
                      <div className="text-xs text-gray-600 mb-1">재등록률</div>
                      <div className="text-xl font-bold text-purple-600">
                        {ptRenewRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <div className="text-xs text-gray-600 mb-1">신규 등록 매출</div>
                      <div className="text-xl font-bold text-green-600">₩{ptNewSales.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-300">
                      <div className="text-xs text-gray-600 mb-1">재등록 매출</div>
                      <div className="text-xl font-bold text-emerald-600">₩{ptRenewSales.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                {selectedGymDetail.memo && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">메모</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                      {selectedGymDetail.memo}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 회사 행사 등록/수정 모달 */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingEvent ? '회사 행사 수정' : '새 회사 행사 등록'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 행사명 */}
            <div>
              <Label htmlFor="event-title" className="text-sm font-semibold text-gray-700">
                행사명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="event-title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="행사 이름을 입력하세요"
                className="mt-1"
              />
            </div>

            {/* 설명 */}
            <div>
              <Label htmlFor="event-description" className="text-sm font-semibold text-gray-700">
                설명
              </Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="행사 설명을 입력하세요 (선택사항)"
                className="mt-1 min-h-[100px]"
              />
            </div>

            {/* 행사 유형과 대상 지점 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-type" className="text-sm font-semibold text-gray-700">
                  행사 유형 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={eventForm.event_type}
                  onValueChange={(value) => setEventForm({ ...eventForm, event_type: value })}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="행사 유형 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="training">교육</SelectItem>
                    <SelectItem value="meeting">회의</SelectItem>
                    <SelectItem value="holiday">휴무</SelectItem>
                    <SelectItem value="celebration">행사</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="event-gym" className="text-sm font-semibold text-gray-700">
                  대상 지점
                </Label>
                <Select
                  value={eventForm.gym_id}
                  onValueChange={(value) => setEventForm({ ...eventForm, gym_id: value })}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="전사 행사 (모든 지점)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">전사 행사 (모든 지점)</SelectItem>
                    {gyms.map((gym) => (
                      <SelectItem key={gym.id} value={gym.id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 행사 날짜 */}
            <div>
              <Label htmlFor="event-date" className="text-sm font-semibold text-gray-700">
                행사 날짜 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="event-date"
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-start-time" className="text-sm font-semibold text-gray-700">
                  시작 시간
                </Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="event-end-time" className="text-sm font-semibold text-gray-700">
                  종료 시간
                </Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* 장소 */}
            <div>
              <Label htmlFor="event-location" className="text-sm font-semibold text-gray-700">
                장소
              </Label>
              <Input
                id="event-location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="행사 장소를 입력하세요 (선택사항)"
                className="mt-1"
              />
            </div>

            {/* 참석 대상 */}
            <div>
              <Label htmlFor="event-target" className="text-sm font-semibold text-gray-700">
                참석 대상
              </Label>
              <Select
                value={eventForm.target_audience}
                onValueChange={(value) => setEventForm({ ...eventForm, target_audience: value })}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="참석 대상 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="management">관리자</SelectItem>
                  <SelectItem value="trainers">트레이너</SelectItem>
                  <SelectItem value="specific">특정 인원</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 색상 */}
            <div>
              <Label htmlFor="event-color" className="text-sm font-semibold text-gray-700">
                캘린더 색상
              </Label>
              <Select
                value={eventForm.color}
                onValueChange={(value) => setEventForm({ ...eventForm, color: value })}
              >
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="색상 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="blue">파란색</SelectItem>
                  <SelectItem value="red">빨간색</SelectItem>
                  <SelectItem value="green">초록색</SelectItem>
                  <SelectItem value="yellow">노란색</SelectItem>
                  <SelectItem value="purple">보라색</SelectItem>
                  <SelectItem value="orange">주황색</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 활성 상태 */}
            <div className="flex items-center gap-2 pt-2">
              <input
                id="event-active"
                type="checkbox"
                checked={eventForm.is_active}
                onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="event-active" className="text-sm text-gray-700 cursor-pointer">
                즉시 활성화 (체크 해제 시 비활성 상태로 저장)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEventModalOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveEvent}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '저장 중...' : (editingEvent ? '수정' : '등록')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}