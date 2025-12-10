"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, UserPlus, Calendar as CalendarIcon, LogOut, CheckCircle2, AlertCircle, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classifyScheduleType } from "@/lib/schedule-utils";
import WeeklyTimetable from "@/components/WeeklyTimetable";
import { cn } from "@/lib/utils";

export default function StaffPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // 데이터 상태
  const [schedules, setSchedules] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  
  // UI 상태
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 내 정보 상태
  const [myStaffId, setMyStaffId] = useState<string | null>(null);
  const [myStaffName, setMyStaffName] = useState<string | null>(null);
  const [myJobTitle, setMyJobTitle] = useState<string | null>(null);
  const [myGymId, setMyGymId] = useState<string | null>(null);
  const [myGymName, setMyGymName] = useState<string | null>(null);
  const [myCompanyId, setMyCompanyId] = useState<string | null>(null);
  const [myWorkStartTime, setMyWorkStartTime] = useState<string | null>(null);
  const [myWorkEndTime, setMyWorkEndTime] = useState<string | null>(null);

  // 통계 및 승인 상태
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [isMonthApproved, setIsMonthApproved] = useState(false);

  // 입력 폼 상태
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newClassType, setNewClassType] = useState("PT");
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState("50");

  const [newMemberData, setNewMemberData] = useState({
    name: "",
    phone: "",
    memo: ""
  });

  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    memberName: string;
    timeLabel: string;
    startTime: Date;
    type: string;
    duration: string;
    memberId: string | null;
    status: string;
  } | null>(null);

  // 수정용 상태
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editDuration, setEditDuration] = useState("50");
  const [editClassType, setEditClassType] = useState("PT");
  const [editMemberName, setEditMemberName] = useState("");

  const supabase = createSupabaseClient();

  // 초기 로딩
  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        const { data: staff } = await supabase
          .from("staffs")
          .select("id, gym_id, company_id, work_start_time, work_end_time, name, job_title, gyms(name)")
          .eq("user_id", user.id)
          .single();

        if (staff) {
          setMyStaffId(staff.id);
          setMyStaffName(staff.name);
          setMyJobTitle(staff.job_title);
          setMyGymId(staff.gym_id);
          // @ts-ignore
          setMyGymName(staff.gyms?.name);
          setMyCompanyId(staff.company_id);
          setMyWorkStartTime(staff.work_start_time);
          setMyWorkEndTime(staff.work_end_time);
          
          await Promise.all([
            fetchSchedules(staff.id),
            fetchMembers(staff.gym_id, staff.company_id)
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyInfo();
  }, []);

  // 멤버 검색 필터링
  useEffect(() => {
    if (!memberSearchQuery.trim()) {
      setFilteredMembers(members);
      setShowMemberDropdown(false);
    } else {
      const query = memberSearchQuery.toLowerCase();
      const filtered = members.filter(m =>
        m.name?.toLowerCase().includes(query) ||
        m.phone?.includes(query)
      );
      setFilteredMembers(filtered);
      setShowMemberDropdown(true);
    }
  }, [memberSearchQuery, members]);

  // 스케줄 데이터 변경 시 월간 통계 재계산
  useEffect(() => {
    if (schedules.length > 0) {
      calculateMonthlyStats(schedules);
    }
  }, [selectedDate, schedules]);

  // API 호출 함수들
  const fetchMembers = async (gymId: string | null, companyId: string | null) => {
    if (!gymId || !companyId) return;

    const { data, error } = await supabase
      .from("members")
      .select(`
        *,
        member_memberships!inner (
          id,
          name,
          total_sessions,
          used_sessions,
          status
        )
      `)
      .eq("gym_id", gymId)
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("회원 조회 에러:", error);
      return;
    }

    const membersWithMemberships = (data || []).map((member: any) => {
      const memberships = member.member_memberships || [];
      const activeMembership = memberships.find((m: any) => m.status === 'active');
      const remaining = activeMembership
        ? (activeMembership.total_sessions - activeMembership.used_sessions)
        : 0;

      return {
        ...member,
        activeMembership,
        remaining
      };
    });

    setMembers(membersWithMemberships);
  };

  const fetchSchedules = async (staffId: string) => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("staff_id", staffId);

    if (error) {
      console.error("스케줄 로딩 실패:", error);
    } else {
      setSchedules(data || []);
      calculateMonthlyStats(data || []);
    }
  };

  const calculateMonthlyStats = (scheduleList: any[]) => {
    const current = new Date(selectedDate);
    const targetYear = current.getFullYear();
    const targetMonth = current.getMonth();

    const monthlySchedules = scheduleList.filter(s => {
      const d = new Date(s.start_time);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const stats = {
      PT: 0,
      OT: 0,
      Consulting: 0,
      completed: 0,
      no_show_deducted: 0,
      no_show: 0,
      service: 0,
      total: monthlySchedules.length
    };

    monthlySchedules.forEach(s => {
      if (s.type === 'PT') stats.PT++;
      else if (s.type === 'OT') stats.OT++;
      else if (s.type === 'Consulting') stats.Consulting++;

      if (s.status === 'completed') stats.completed++;
      else if (s.status === 'no_show_deducted') stats.no_show_deducted++;
      else if (s.status === 'no_show') stats.no_show++;
      else if (s.status === 'service') stats.service++;
    });

    setMonthlyStats(stats);
    // TODO: DB에서 실제 승인 여부 조회
    setIsMonthApproved(false);
  };

  // 핸들러 함수들
  const handleCreateMember = async () => {
    if (!newMemberData.name || !myGymId || !myCompanyId) return;

    const { data, error } = await supabase
      .from("members")
      .insert({
        name: newMemberData.name,
        phone: newMemberData.phone,
        gym_id: myGymId,
        company_id: myCompanyId,
        status: 'active',
        memo: newMemberData.memo
      })
      .select()
      .single();

    if (error) {
      alert("회원 생성 실패: " + error.message);
    } else {
      alert("회원이 생성되었습니다.");
      setIsAddMemberModalOpen(false);
      setNewMemberData({ name: "", phone: "", memo: "" });
      fetchMembers(myGymId, myCompanyId);
      
      // 수업 등록 모달에 자동 세팅
      setNewMemberName(data.name);
      setSelectedMemberId(data.id);
      setMemberSearchQuery(data.name);
      // 수업 등록 모달 열기 (만약 닫혀있다면)
      if (!isAddModalOpen) setIsAddModalOpen(true);
    }
  };

  const handleAddClass = async () => {
    if (!newMemberName || !myStaffId || !myGymId) return;

    const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
    const durationMin = parseInt(duration);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);

    const scheduleType = classifyScheduleType(
      startDateTime,
      myWorkStartTime,
      myWorkEndTime
    );

    const { error } = await supabase.from("schedules").insert({
      gym_id: myGymId,
      staff_id: myStaffId,
      member_id: selectedMemberId,
      member_name: newMemberName,
      type: newClassType,
      status: "reserved",
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      title: `${newMemberName} (${newClassType})`,
      schedule_type: scheduleType,
      counted_for_salary: true,
    });

    if (error) {
      alert("등록 실패!");
      console.error(error);
    } else {
      setIsAddModalOpen(false);
      setNewMemberName("");
      setSelectedMemberId(null);
      setMemberSearchQuery("");
      fetchSchedules(myStaffId);

      // n8n 알림 (Fire and forget)
      fetch("/api/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: startTime,
          member_name: newMemberName,
          type: newClassType,
          status: "reserved",
          staff_id: myStaffId,
        }),
      }).catch(e => console.error(e));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent || !myStaffId) return;

    try {
      // 1. 상태 조회
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedules")
        .select("id, member_id, status")
        .eq("id", selectedEvent.id)
        .single();

      if (scheduleError) throw scheduleError;

      const oldStatus = schedule?.status || "reserved";

      // 2. 업데이트
      const { error: updateError } = await supabase
        .from("schedules")
        .update({ status: newStatus })
        .eq("id", selectedEvent.id)
        .eq("staff_id", myStaffId);

      if (updateError) throw updateError;

      // 3. 회원권 차감 로직
      const shouldDeduct = (status: string) =>
        status === "completed" || status === "no_show_deducted";

      const wasDeducted = shouldDeduct(oldStatus);
      const willDeduct = shouldDeduct(newStatus);

      if (schedule?.member_id && wasDeducted !== willDeduct) {
        const { data: membership } = await supabase
          .from("member_memberships")
          .select("id, used_sessions")
          .eq("member_id", schedule.member_id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (membership) {
          let newUsedSessions = membership.used_sessions;
          if (willDeduct && !wasDeducted) newUsedSessions += 1;
          else if (!willDeduct && wasDeducted) newUsedSessions = Math.max(0, newUsedSessions - 1);

          await supabase
            .from("member_memberships")
            .update({ used_sessions: newUsedSessions })
            .eq("id", membership.id);
        }
      }

      setIsStatusModalOpen(false);
      setSelectedEvent(null);
      fetchSchedules(myStaffId);
      if (myGymId && myCompanyId) fetchMembers(myGymId, myCompanyId);
    } catch (error: any) {
      console.error(error);
      alert("상태 변경 실패: " + error.message);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedEvent || !myStaffId) return;
    if (!confirm("정말 이 스케줄을 삭제하시겠습니까?")) return;

    try {
      const { data: schedule } = await supabase
        .from("schedules")
        .select("status, member_id")
        .eq("id", selectedEvent.id)
        .single();
      
      // 차감된 건이면 복구
      if (schedule && (schedule.status === "completed" || schedule.status === "no_show_deducted")) {
         const { data: membership } = await supabase
          .from("member_memberships")
          .select("id, used_sessions")
          .eq("member_id", schedule.member_id)
          .eq("status", "active")
          .limit(1)
          .single();
        
        if (membership) {
          await supabase
            .from("member_memberships")
            .update({ used_sessions: Math.max(0, membership.used_sessions - 1) })
            .eq("id", membership.id);
        }
      }

      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", selectedEvent.id)
        .eq("staff_id", myStaffId);

      if (error) throw error;

      setIsStatusModalOpen(false);
      setSelectedEvent(null);
      fetchSchedules(myStaffId);
      if (myGymId && myCompanyId) fetchMembers(myGymId, myCompanyId);

    } catch (error: any) {
      alert("삭제 실패: " + error.message);
    }
  };

  const handleEditClass = async () => {
    if (!selectedEvent || !myStaffId || !myGymId) return;

    const startDateTime = new Date(`${editDate}T${editStartTime}:00`);
    const durationMin = parseInt(editDuration);
    const endDateTime = new Date(startDateTime.getTime() + durationMin * 60 * 1000);
    const scheduleType = classifyScheduleType(startDateTime, myWorkStartTime, myWorkEndTime);

    const { error } = await supabase
      .from("schedules")
      .update({
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        type: editClassType,
        schedule_type: scheduleType,
        title: `${editMemberName} (${editClassType})`
      })
      .eq("id", selectedEvent.id)
      .eq("staff_id", myStaffId);

    if (error) alert("수정 실패!");
    else {
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      fetchSchedules(myStaffId);
    }
  };

  // 유틸 함수
  const currentDate = new Date(selectedDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') date.setDate(date.getDate() - 7);
    else date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    if (viewType === 'week') date.setDate(date.getDate() + 7);
    else date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    if (isMonthApproved) {
        alert("이미 마감 승인된 달입니다.");
        return;
    }
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setStartTime(time);
    setIsAddModalOpen(true);
  };

  const handleScheduleClick = (schedule: any) => {
    const startTime = new Date(schedule.start_time);
    const endTime = new Date(schedule.end_time);
    const timeLabel = `${startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} ~ ${endTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    const diffMs = endTime.getTime() - startTime.getTime();
    const durationMin = Math.round(diffMs / (1000 * 60));

    setSelectedEvent({
      id: schedule.id,
      memberName: schedule.member_name,
      timeLabel,
      startTime,
      type: schedule.type,
      duration: String(durationMin),
      memberId: schedule.member_id,
      status: schedule.status
    });
    setIsStatusModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedEvent) return;
    setEditDate(selectedEvent.startTime.toISOString().split('T')[0]);
    setEditStartTime(selectedEvent.startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setEditDuration(selectedEvent.duration);
    setEditClassType(selectedEvent.type);
    setEditMemberName(selectedEvent.memberName);
    setIsStatusModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSelectMember = (member: any) => {
    setNewMemberName(member.name);
    setSelectedMemberId(member.id);
    setMemberSearchQuery(member.name);
    setShowMemberDropdown(false);
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2F80ED]"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-10">
      {/* 1. Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-[60px] flex items-center justify-between px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
            <h1 className="text-xl font-black text-[#2F80ED] tracking-tighter">We:form</h1>
            {myStaffName && (
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <span className="font-bold text-[#2F80ED]">{myGymName}</span>
                    <span className="w-px h-3 bg-gray-300"></span>
                    <span className="font-medium text-gray-700">{myStaffName} {myJobTitle}</span>
                </div>
            )}
        </div>
        <div className="flex items-center gap-3">
            {/* 모바일에서만 보이는 간략 정보 */}
            <div className="md:hidden text-xs font-bold text-gray-700">
                {myStaffName}
            </div>
            <Button 
                onClick={() => router.push('/login')} 
                variant="ghost" 
                className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 h-8 px-2 rounded-lg"
            >
                <LogOut className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">로그아웃</span>
            </Button>
        </div>
      </header>

      {/* Main Content (Bento Grid) */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* 2. Welcome & Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Welcome Message */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <CalendarIcon className="w-4 h-4 text-[#2F80ED]" />
                    <span>{new Date().toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    {myStaffName}님, <span className="text-[#2F80ED]">오늘도 화이팅하세요!</span> 👋
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    이번 달은 총 <span className="font-bold text-gray-900">{monthlyStats?.total || 0}</span>개의 수업이 예정되어 있습니다.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center gap-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3 h-full">
                    <Button 
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="h-auto flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#2F80ED] border-0 rounded-xl py-4"
                        variant="outline"
                    >
                        <UserPlus className="w-6 h-6" />
                        <span className="text-xs font-bold">회원 등록</span>
                    </Button>
                    <Button 
                        onClick={() => {
                            setSelectedDate(todayStr);
                            setStartTime("09:00");
                            setIsAddModalOpen(true);
                        }}
                        className="h-auto flex flex-col items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-[#F2994A] border-0 rounded-xl py-4"
                        variant="outline"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="text-xs font-bold">수업 추가</span>
                    </Button>
                    <Button 
                        onClick={() => router.push("/staff/salary")}
                        className="h-auto flex flex-col items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-0 rounded-xl py-4 col-span-2"
                        variant="outline"
                    >
                        <DollarSign className="w-6 h-6" />
                        <span className="text-xs font-bold">급여 명세서 조회</span>
                    </Button>
                </div>
            </div>
        </div>

        {/* 3. Scheduler Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
            {/* Scheduler Header Control */}
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white sticky top-0 z-10">
                {/* 날짜 네비게이션 */}
                <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200 w-full md:w-auto justify-between md:justify-start">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm" onClick={handlePrevDate}>
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </Button>
                    <div className="relative flex items-center justify-center px-4 min-w-[140px]">
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                            {year}년 {month}월 <span className="text-gray-400 font-light">|</span> {currentDate.getDate()}일
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm" onClick={handleNextDate}>
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="h-9 px-3 text-xs font-bold text-[#2F80ED] hover:bg-white hover:shadow-sm rounded-lg ml-1" 
                        onClick={() => setSelectedDate(todayStr)}
                    >
                        오늘
                    </Button>
                </div>

                {/* 뷰 전환 탭 (3D Style) */}
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
                    {['day', 'week', 'month'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setViewType(type as any)}
                            className={cn(
                                "flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                                viewType === type 
                                    ? "bg-white text-[#2F80ED] shadow-sm ring-1 ring-black/5" 
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {type === 'day' ? '일간' : type === 'week' ? '주간' : '월간(통계)'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scheduler Body */}
            <div className="flex-1 p-0 md:p-6 overflow-hidden flex flex-col">
                {viewType === 'month' ? (
                    // 월간 통계 뷰
                    <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300 p-4 md:p-0">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                📊 {month}월 수업 리포트
                            </h3>
                            {isMonthApproved ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> 마감 승인됨
                                </span>
                            ) : (
                                <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> 작성 중
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                             {[
                                { label: 'PT 진행', value: monthlyStats?.PT, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600' },
                                { label: 'OT 진행', value: monthlyStats?.OT, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-600' },
                                { label: '상담', value: monthlyStats?.Consulting, color: 'green', bg: 'bg-green-50', text: 'text-green-600' },
                                { label: '총 일정', value: monthlyStats?.total, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-600' },
                             ].map((stat, idx) => (
                                <div key={idx} className={cn("rounded-2xl p-5 flex flex-col gap-2 transition-transform hover:scale-105", stat.bg)}>
                                    <span className={cn("text-xs font-bold uppercase tracking-wider", stat.text)}>{stat.label}</span>
                                    <span className={cn("text-3xl font-black", stat.text.replace('600', '900'))}>{stat.value || 0}<span className="text-sm font-medium ml-1 text-gray-500">건</span></span>
                                </div>
                             ))}
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                             <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">상세 현황</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { label: '출석 완료', icon: '🟢', value: monthlyStats?.completed },
                                    { label: '노쇼 (차감)', icon: '🔴', value: monthlyStats?.no_show_deducted },
                                    { label: '단순 노쇼', icon: '⚪', value: monthlyStats?.no_show },
                                    { label: '서비스', icon: '🔵', value: monthlyStats?.service },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{item.value || 0}회</span>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-100">
                             <Button 
                                disabled={isMonthApproved}
                                className="w-full h-14 text-lg font-bold bg-[#2F80ED] hover:bg-[#1c6cd7] shadow-lg shadow-blue-200 disabled:shadow-none disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition-all"
                                onClick={() => {
                                    if (confirm(`${year}년 ${month}월 스케줄을 마감하고 관리자에게 전송하시겠습니까?\n전송 후에는 수정이 불가능합니다.`)) {
                                        setIsMonthApproved(true); 
                                        alert("관리자에게 전송되었습니다.");
                                    }
                                }}
                            >
                                {isMonthApproved ? "전송 완료 (수정 불가)" : "관리자에게 스케줄 전송 (마감)"}
                            </Button>
                            <p className="text-xs text-gray-400 text-center mt-3">
                                * 매월 1일 ~ 5일 사이에 전송해주세요. 전송 후에는 수정이 불가능합니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    // 주간/일간 캘린더 뷰
                    <WeeklyTimetable
                        schedules={schedules}
                        onScheduleClick={handleScheduleClick}
                        onTimeSlotClick={handleTimeSlotClick}
                        viewType={viewType}
                        selectedDate={selectedDate}
                    />
                )}
            </div>
        </div>
      </main>

      {/* Floating Action Button (Mobile Only) */}
      {!isMonthApproved && (
          <button
            onClick={() => {
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setIsAddModalOpen(true);
            }}
            className="md:hidden fixed bottom-6 right-6 bg-[#2F80ED] text-white p-4 rounded-full shadow-xl shadow-blue-200 hover:bg-[#1c6cd7] transition-all active:scale-95 z-50 flex items-center justify-center"
          >
            <Plus className="w-6 h-6 stroke-[3px]" />
          </button>
      )}

      {/* --- MODALS --- */}
      
      {/* 1. 수업 등록 모달 */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold">수업 등록</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2 space-y-5">
            <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500">날짜</Label>
                <div className="relative">
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="font-bold text-gray-900 bg-gray-50 border-gray-200 h-11"
                    />
                </div>
            </div>
            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-500">회원 선택</Label>
                  <button 
                      onClick={() => {
                          setIsAddModalOpen(false);
                          setIsAddMemberModalOpen(true);
                      }}
                      className="text-xs text-[#2F80ED] font-bold hover:underline flex items-center gap-0.5"
                  >
                      <Plus className="w-3 h-3" /> 새 회원
                  </button>
              </div>
              <Input
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                onFocus={() => setShowMemberDropdown(true)}
                placeholder="이름 검색"
                className="h-11 bg-gray-50 border-gray-200"
              />
              {showMemberDropdown && filteredMembers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectMember(member)}
                      className="w-full px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg flex justify-between items-center group transition-colors"
                    >
                      <span className="font-bold text-gray-800">{member.name}</span>
                      <div className="text-xs text-gray-500 flex flex-col items-end">
                        <span>{member.phone || "-"}</span>
                        {member.activeMembership && (
                          <span className={member.remaining === 0 ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>
                            {member.remaining}회 남음
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500">시작 시간</Label>
                    <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="h-11 bg-gray-50 border-gray-200 font-bold"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500">진행 시간</Label>
                    <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30분 (OT)</SelectItem>
                            <SelectItem value="50">50분 (기본)</SelectItem>
                            <SelectItem value="60">60분</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">수업 종류</Label>
              <div className="grid grid-cols-3 gap-2">
                 {['PT', 'OT', 'Consulting'].map((type) => (
                     <button
                        key={type}
                        onClick={() => setNewClassType(type)}
                        className={cn(
                            "py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                            newClassType === type 
                                ? "border-[#2F80ED] bg-blue-50 text-[#2F80ED]" 
                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-300"
                        )}
                     >
                        {type === 'Consulting' ? '상담' : type}
                     </button>
                 ))}
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <Button 
                onClick={handleAddClass} 
                className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-200"
            >
              등록하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 2. 회원 생성 모달 */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">새 회원 등록</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500">이름 <span className="text-red-500">*</span></Label>
                    <Input 
                        value={newMemberData.name}
                        onChange={(e) => setNewMemberData({...newMemberData, name: e.target.value})}
                        placeholder="홍길동"
                        className="h-11 bg-gray-50 border-gray-200"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500">연락처</Label>
                    <Input 
                        value={newMemberData.phone}
                        onChange={(e) => setNewMemberData({...newMemberData, phone: e.target.value})}
                        placeholder="010-0000-0000"
                        className="h-11 bg-gray-50 border-gray-200"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500">메모</Label>
                    <Input 
                        value={newMemberData.memo}
                        onChange={(e) => setNewMemberData({...newMemberData, memo: e.target.value})}
                        placeholder="특이사항"
                        className="h-11 bg-gray-50 border-gray-200"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button 
                    onClick={handleCreateMember}
                    className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full h-12 rounded-xl text-lg font-bold"
                >
                    등록 완료
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. 상태 변경 모달 (3D Buttons) */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl p-0 overflow-hidden gap-0">
          <div className="bg-[#2F80ED] p-6 text-white">
              <h3 className="text-xl font-bold">{selectedEvent?.memberName}님 수업</h3>
              <p className="opacity-80 text-sm font-medium mt-1">
                {selectedEvent?.timeLabel} ({selectedEvent?.duration}분) · {selectedEvent?.type}
              </p>
          </div>
          
          <div className="p-6">
            <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">상태 변경</h4>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                    onClick={() => handleStatusChange("completed")}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 transition-all active:scale-95 active:border-b-0 active:translate-y-1",
                        selectedEvent?.status === 'completed' 
                            ? "bg-orange-50 border-orange-200 text-orange-600 ring-2 ring-orange-400 ring-offset-2" 
                            : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <span className="text-2xl mb-1">🟢</span>
                    <span className="font-bold text-sm">출석 완료</span>
                </button>
                <button
                    onClick={() => handleStatusChange("no_show_deducted")}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 transition-all active:scale-95 active:border-b-0 active:translate-y-1",
                        selectedEvent?.status === 'no_show_deducted' 
                            ? "bg-red-50 border-red-200 text-red-600 ring-2 ring-red-400 ring-offset-2" 
                            : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <span className="text-2xl mb-1">🔴</span>
                    <span className="font-bold text-sm">노쇼 (차감)</span>
                </button>
                <button
                    onClick={() => handleStatusChange("no_show")}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 transition-all active:scale-95 active:border-b-0 active:translate-y-1",
                        selectedEvent?.status === 'no_show' 
                            ? "bg-gray-100 border-gray-300 text-gray-700 ring-2 ring-gray-400 ring-offset-2" 
                            : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <span className="text-2xl mb-1">⚪</span>
                    <span className="font-bold text-sm">단순 노쇼</span>
                </button>
                <button
                    onClick={() => handleStatusChange("service")}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 transition-all active:scale-95 active:border-b-0 active:translate-y-1",
                        selectedEvent?.status === 'service' 
                            ? "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-400 ring-offset-2" 
                            : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <span className="text-2xl mb-1">🔵</span>
                    <span className="font-bold text-sm">서비스</span>
                </button>
            </div>
            
            {!isMonthApproved && (
                <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <Button 
                        onClick={handleOpenEditModal}
                        variant="outline" 
                        className="flex-1 h-12 rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                        수정하기
                    </Button>
                    <Button 
                        onClick={handleDeleteSchedule}
                        variant="ghost" 
                        className="h-12 px-4 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                        삭제
                    </Button>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. 수정 모달 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">수업 수정</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500">회원 이름</Label>
                <div className="h-11 flex items-center px-3 bg-gray-100 rounded-lg text-gray-500 font-bold border border-gray-200">
                    {editMemberName}
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500">날짜 변경</Label>
                <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="h-11 bg-gray-50 border-gray-200 font-bold"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500">시작 시간</Label>
                    <Input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="h-11 bg-gray-50 border-gray-200 font-bold"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-500">진행 시간</Label>
                    <Select value={editDuration} onValueChange={setEditDuration}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30분 (OT)</SelectItem>
                            <SelectItem value="50">50분 (기본)</SelectItem>
                            <SelectItem value="60">60분</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500">수업 종류</Label>
              <Select value={editClassType} onValueChange={setEditClassType}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="OT">OT</SelectItem>
                  <SelectItem value="Consulting">상담</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
                onClick={handleEditClass} 
                className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full h-12 rounded-xl text-lg font-bold"
            >
              수정 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
