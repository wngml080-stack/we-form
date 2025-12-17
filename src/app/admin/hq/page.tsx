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
import { Plus, Pencil, Trash2, MapPin, Calendar, User, Building2, Users, UserCheck, TrendingUp, Clock, Activity, BarChart3 } from "lucide-react";

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

      // system_admin인 경우 모든 회사 목록 가져오기
      if (me.role === 'system_admin') {
        const { data: companiesData } = await supabase
          .from("companies")
          .select("id, name")
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
    const { data: gymData } = await supabase
        .from("gyms")
        .select(`*, staffs(id, name, role, email)`)
        .eq("company_id", targetCompanyId)
        .order("created_at", { ascending: false });
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
        .select("id, name, email, role, gym_id, created_at, gyms(name)")
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

    // 최근 활동 데이터 생성 (최근 30일 이내)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities: any[] = [];

    // 최근 배치된 직원 (gym_id가 있고 최근 30일 이내 업데이트된 직원)
    const recentStaffs = allData?.filter(s =>
      s.gym_id &&
      s.created_at &&
      new Date(s.created_at) >= thirtyDaysAgo
    ) || [];

    recentStaffs.forEach(staff => {
      // @ts-ignore
      const gymName = staff.gyms?.name || '미배정';
      activities.push({
        id: `staff-${staff.id}`,
        name: staff.name,
        type: 'staff',
        activityType: '직원 가입',
        gymName,
        created_at: staff.created_at,
        badgeColor: 'bg-emerald-100 text-emerald-700'
      });
    });

    // 최근 가입한 회원
    const recentMembers = memberData?.filter(m =>
      m.created_at &&
      new Date(m.created_at) >= thirtyDaysAgo
    ).slice(0, 10) || [];

    recentMembers.forEach(member => {
      // @ts-ignore
      const gymName = member.gyms?.name || '미배정';
      activities.push({
        id: `member-${member.id}`,
        name: member.name,
        type: 'member',
        activityType: '회원 가입',
        gymName,
        created_at: member.created_at,
        badgeColor: 'bg-purple-100 text-purple-700'
      });
    });

    // 날짜순 정렬 (최신순)
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentActivities(activities.slice(0, 10));

    // 통계 계산
    const totalGyms = gymData?.length || 0;
    const totalStaffs = allData?.length || 0;
    const totalMembers = memberData?.length || 0;

    // 이번 달 신규 회원 수
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newMembersThisMonth = memberData?.filter(m => {
      const createdAt = new Date(m.created_at);
      return createdAt >= firstDayOfMonth;
    }).length || 0;

    setStats({
      totalGyms,
      totalStaffs,
      totalMembers,
      newMembersThisMonth
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
  };

  const handleAssign = async (staffId: string) => {
    if (!selectedGym || !selectedRole) return alert("지점과 권한을 선택해주세요.");
    if (!confirm("발령 보내시겠습니까?")) return;
    const { error } = await supabase.from("staffs").update({ gym_id: selectedGym, role: selectedRole, employment_status: "재직" }).eq("id", staffId);
    if (!error) { alert("발령 완료!"); fetchData(companyId, myRole); } else { alert(error.message); }
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
                    <div className="flex-1">
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={() => openEditModal(gym)}>
                        <Pencil className="h-4 w-4 text-gray-500"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={() => handleDeleteGym(gym.id)}>
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

      {/* 3. 지점별 상세 현황 & 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 지점별 상세 현황 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">지점별 상세 현황</h3>
            </div>
          </div>
          <div className="p-6">
            {filteredGymStats.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">등록된 지점이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredGymStats.map((gym: any) => (
                  <div key={gym.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{gym.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            gym.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : gym.status === 'closed'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}
                        >
                          {gym.status === 'active' ? '운영중' : gym.status === 'closed' ? '폐업' : '대기'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">직원</div>
                        <div className="text-lg font-bold text-gray-900">{gym.staffCount}</div>
                        <div className="text-xs text-gray-500">명</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">회원</div>
                        <div className="text-lg font-bold text-gray-900">{gym.memberCount}</div>
                        <div className="text-xs text-gray-500">명</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">신규</div>
                        <div className="text-lg font-bold text-gray-900">+{gym.newMembersCount}</div>
                        <div className="text-xs text-gray-500">명</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    <div className="text-xs text-gray-600 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3"/> {activity.gymName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3"/> {formatDate(activity.created_at)}
                      </span>
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
    </div>
  );
}