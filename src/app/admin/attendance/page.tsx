"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Calendar, Clock, User, Trash2, Filter, AlertCircle, CheckCircle2 } from "lucide-react";

interface AttendanceStatus {
  code: string;
  label: string;
  color: string;
  description: string;
}

interface AttendanceRecord {
  id: string;
  gym_id: string;
  schedule_id: string;
  staff_id: string;
  member_id: string;
  status_code: string;
  attended_at: string;
  memo: string;
  member: { id: string; name: string; phone: string };
  staff: { id: string; name: string };
  schedule: { id: string; title: string; start_time: string; end_time: string };
  status: AttendanceStatus;
}

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
}

export default function AdminAttendancePage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 unwrap해야 합니다.
  use(props.params);
  use(props.searchParams);

  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isApproved, gymName: authGymName } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<AttendanceStatus[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [gymId, setGymId] = useState<string>("");
  const [gymName, setGymName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 필터
  const [selectedSchedule, setSelectedSchedule] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 출석 기록 폼
  const [newRecord, setNewRecord] = useState({
    schedule_id: "",
    member_id: "",
    status_code: "completed",
    memo: "",
  });

  // Supabase 클라이언트 한 번만 생성 (메모이제이션)
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      if (!authUser || !isApproved) {
        router.push("/sign-in");
        return;
      }

      try {
        setGymName(authGymName || "지점");
        const userGymId = authUser.gym_id || "";
        setGymId(userGymId);

        if (!userGymId) return;

        await fetchStatuses();
        await fetchSchedules(userGymId);
        await fetchMembers(userGymId);
        await fetchRecords(userGymId);

      } catch (error) {
        console.error("초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [authLoading, authUser, isApproved, authGymName]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch("/api/attendance/statuses");
      const result = await response.json();
      if (result.data) setStatuses(result.data);
    } catch (error) {
      console.error("출석 상태 조회 실패:", error);
    }
  };

  const fetchSchedules = async (gymId: string) => {
    try {
      const { data, error } = await supabase
        .from("schedules")
        .select("id, title, start_time, end_time, type")
        .eq("gym_id", gymId)
        .gte("start_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("start_time", { ascending: false });

      if (error) throw error;
      if (data) setSchedules(data);
    } catch (error) {
      console.error("스케줄 조회 실패:", error);
    }
  };

  const fetchMembers = async (_gymId: string) => {
    setMembers([]);
  };

  // 출석 기록 조회 - 임시 비활성화 (테이블 재연결 예정)
  const fetchRecords = async (_gymId: string, _scheduleId?: string, _start?: string, _end?: string) => {
    setRecords([]);
  };

  const handleFilterChange = () => {
    if (gymId) fetchRecords(gymId, selectedSchedule, startDate, endDate);
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedSchedule, startDate, endDate]);

  // 출석 기록 생성 - 임시 비활성화 (테이블 재연결 예정)
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.warning("출석 기록 기능이 준비 중입니다.");
  };

  // 출석 상태 변경 - 임시 비활성화 (테이블 재연결 예정)
  const handleStatusChange = async (_recordId: string, _newStatusCode: string) => {
    toast.warning("출석 기록 기능이 준비 중입니다.");
  };

  // 출석 기록 삭제 - 임시 비활성화 (테이블 재연결 예정)
  const handleDeleteRecord = async (_recordId: string) => {
    toast.warning("출석 기록 기능이 준비 중입니다.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1920px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">출석 관리</h1>
          <p className="text-slate-500 text-sm font-medium mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2F80ED] rounded-full animate-pulse"></span>
            {gymName} 회원 출석 실시간 모니터링
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-[#2F80ED] hover:bg-[#1c60b8] text-white font-black h-12 px-8 rounded-[20px] shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
              <Plus className="w-5 h-5" />
              <span>출석 기록 직접 등록</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white rounded-[32px] max-w-2xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">출석 기록 등록</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">관리자가 직접 출석 여부를 수동으로 기록합니다.</DialogDescription>
              </DialogHeader>
            </div>
            
            <form onSubmit={handleCreateRecord} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">대상 스케줄</Label>
                  <Select
                    value={newRecord.schedule_id}
                    onValueChange={(value) => setNewRecord({ ...newRecord, schedule_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-gray-100 rounded-2xl focus:bg-white transition-all font-bold">
                      <SelectValue placeholder="스케줄 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-gray-100 shadow-2xl max-h-[300px]">
                      {schedules.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id} className="py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold">{schedule.title || schedule.type}</span>
                            <span className="text-[10px] text-slate-400">{new Date(schedule.start_time).toLocaleString("ko-KR")}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">대상 회원</Label>
                  <Select
                    value={newRecord.member_id}
                    onValueChange={(value) => setNewRecord({ ...newRecord, member_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-gray-100 rounded-2xl focus:bg-white transition-all font-bold">
                      <SelectValue placeholder="회원 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-gray-100 shadow-2xl">
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{member.name}</span>
                            <span className="text-[10px] text-slate-400">({member.phone})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">출석 상태</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status.code}
                      type="button"
                      onClick={() => setNewRecord({ ...newRecord, status_code: status.code })}
                      className={`py-3 px-4 rounded-2xl text-xs font-black transition-all border ${
                        newRecord.status_code === status.code
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-[1.02]"
                          : "bg-white text-slate-500 border-gray-100 hover:border-blue-200"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">특이사항 메모</Label>
                <Textarea
                  value={newRecord.memo}
                  onChange={(e) => setNewRecord({ ...newRecord, memo: e.target.value })}
                  placeholder="특이사항이나 전달받은 사유를 입력하세요..."
                  className="bg-slate-50 border-gray-100 rounded-2xl focus:bg-white transition-all text-sm font-medium min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-[20px] shadow-xl shadow-blue-100">
                  등록 완료
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-14 border-gray-200 text-slate-500 font-bold rounded-[20px]"
                >
                  취소
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 animate-in fade-in duration-500 delay-150">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">상세 필터 옵션</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">대상 스케줄 필터</p>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger className="h-12 bg-slate-50 border-gray-100 rounded-2xl font-bold text-slate-700 hover:bg-white transition-all">
                <SelectValue placeholder="전체 스케줄" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-2xl border-gray-100 shadow-2xl">
                <SelectItem value="all" className="font-bold text-blue-600 text-sm">전체 스케줄 보기</SelectItem>
                <div className="h-px bg-gray-50 my-1" />
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id} className="text-xs font-medium">
                    {schedule.title || schedule.type} - {new Date(schedule.start_time).toLocaleDateString("ko-KR")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">조회 시작일</p>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 pl-11 bg-slate-50 border-gray-100 rounded-2xl font-bold text-sm focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">조회 종료일</p>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 pl-11 bg-slate-50 border-gray-100 rounded-2xl font-bold text-sm focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 테이블 섹션 */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500 delay-300">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">출석 일시</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">회원 정보</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">스케줄 내역</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">담당 직원</th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">출석 상태</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">메모</th>
                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Calendar className="w-12 h-12 text-slate-200" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">검색된 출석 데이터가 없습니다</h3>
                      <p className="text-slate-400 font-medium text-sm">필터 조건을 변경하거나 새로운 출석 기록을 추가해보세요.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-slate-900 tracking-tight">{new Date(record.attended_at).toLocaleDateString("ko-KR")}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">{new Date(record.attended_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-slate-200 transition-transform group-hover:scale-110">
                          {record.member?.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 leading-none mb-1.5">{record.member?.name || "-"}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {record.member?.phone || ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 leading-none mb-1.5">{record.schedule?.title || "-"}</span>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 w-fit px-2 py-0.5 rounded-lg border border-blue-100">
                          {new Date(record.schedule?.start_time).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-5 h-5 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {record.staff?.name?.charAt(0) || "TR"}
                        </div>
                        <span className="text-xs font-bold text-slate-600">{record.staff?.name || "-"} 코치</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <Select
                        value={record.status_code}
                        onValueChange={(value) => handleStatusChange(record.id, value)}
                      >
                        <SelectTrigger className="w-32 border-none h-10 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all mx-auto shadow-sm">
                          <SelectValue>
                            <Badge className={(record.status?.color || "bg-slate-500") + " text-white border-none shadow-sm font-black text-[10px]"}>
                              {record.status?.label || record.status_code}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-2xl border-gray-100 shadow-2xl">
                          {statuses.map((status) => (
                            <SelectItem key={status.code} value={status.code} className="py-2">
                              <Badge className={status.color + " text-white border-none font-black text-[10px]"}>
                                {status.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium max-w-xs truncate">
                      {record.memo || <span className="text-slate-200">-</span>}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
