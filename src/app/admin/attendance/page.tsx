"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";

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

export default function AdminAttendancePage() {
  const router = useRouter();
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

  const supabase = createSupabaseClient();

  useEffect(() => {
    const init = async () => {
      try {
        // 1. 로그인 체크
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");

        // 2. 내 정보 가져오기
        const { data: me, error: meError } = await supabase
          .from("staffs")
          .select("id, gym_id, role, gyms(name)")
          .eq("user_id", user.id)
          .single();

        if (meError || !me) {
          console.error("직원 정보 로딩 실패:", meError);
          alert("직원 정보를 찾을 수 없습니다.");
          return;
        }

        // @ts-ignore
        setGymName(me.gyms?.name || "지점");
        setGymId(me.gym_id);

        // 3. 출석 상태 코드 가져오기
        await fetchStatuses();

        // 4. 스케줄 목록 가져오기
        await fetchSchedules(me.gym_id);

        // 5. 회원 목록 가져오기
        await fetchMembers(me.gym_id);

        // 6. 출석 기록 가져오기
        await fetchRecords(me.gym_id);

      } catch (error) {
        console.error("초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // 출석 상태 코드 조회
  const fetchStatuses = async () => {
    try {
      const response = await fetch("/api/attendance/statuses");
      const result = await response.json();
      if (result.data) {
        setStatuses(result.data);
      }
    } catch (error) {
      console.error("출석 상태 조회 실패:", error);
    }
  };

  // 스케줄 목록 조회
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

  // 회원 목록 조회
  const fetchMembers = async (gymId: string) => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, phone")
        .eq("gym_id", gymId)
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setMembers(data);
    } catch (error) {
      console.error("회원 조회 실패:", error);
    }
  };

  // 출석 기록 조회
  const fetchRecords = async (gymId: string, scheduleId?: string, start?: string, end?: string) => {
    try {
      const params = new URLSearchParams({ gym_id: gymId });
      if (scheduleId && scheduleId !== "all") params.append("schedule_id", scheduleId);
      if (start) params.append("start_date", start);
      if (end) params.append("end_date", end);

      const response = await fetch(`/api/attendance/records?${params}`);
      const result = await response.json();

      if (result.data) {
        setRecords(result.data);
      }
    } catch (error) {
      console.error("출석 기록 조회 실패:", error);
    }
  };

  // 필터 적용
  const handleFilterChange = () => {
    if (gymId) {
      fetchRecords(
        gymId,
        selectedSchedule,
        startDate,
        endDate
      );
    }
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedSchedule, startDate, endDate]);

  // 출석 기록 생성
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRecord.schedule_id || !newRecord.member_id) {
      alert("스케줄과 회원을 선택해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/attendance/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gym_id: gymId,
          ...newRecord,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("출석 기록이 등록되었습니다.");
        setIsDialogOpen(false);
        setNewRecord({
          schedule_id: "",
          member_id: "",
          status_code: "completed",
          memo: "",
        });
        fetchRecords(gymId);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("출석 기록 생성 실패:", error);
      alert(`출석 기록 등록 실패: ${error.message}`);
    }
  };

  // 출석 상태 변경
  const handleStatusChange = async (recordId: string, newStatusCode: string) => {
    try {
      const response = await fetch(`/api/attendance/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_code: newStatusCode }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("출석 상태가 변경되었습니다.");
        fetchRecords(gymId);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("출석 상태 변경 실패:", error);
      alert(`출석 상태 변경 실패: ${error.message}`);
    }
  };

  // 출석 기록 삭제
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("출석 기록을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/attendance/records/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("출석 기록이 삭제되었습니다.");
        fetchRecords(gymId);
      } else {
        const result = await response.json();
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("출석 기록 삭제 실패:", error);
      alert(`출석 기록 삭제 실패: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">출석 관리</h1>
          <p className="text-gray-500 mt-2 font-medium">{gymName}의 회원 출석 기록을 관리합니다</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold px-6 py-2 shadow-sm">
              출석 기록 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">출석 기록 등록</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <Label htmlFor="schedule_id" className="text-sm font-semibold text-gray-700">스케줄</Label>
                <Select
                  value={newRecord.schedule_id}
                  onValueChange={(value) =>
                    setNewRecord({ ...newRecord, schedule_id: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="스케줄 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {schedule.title || schedule.type} - {new Date(schedule.start_time).toLocaleString("ko-KR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="member_id" className="text-sm font-semibold text-gray-700">회원</Label>
                <Select
                  value={newRecord.member_id}
                  onValueChange={(value) =>
                    setNewRecord({ ...newRecord, member_id: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="회원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status_code" className="text-sm font-semibold text-gray-700">출석 상태</Label>
                <Select
                  value={newRecord.status_code}
                  onValueChange={(value) =>
                    setNewRecord({ ...newRecord, status_code: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.code} value={status.code}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="memo" className="text-sm font-semibold text-gray-700">메모 (선택)</Label>
                <Textarea
                  id="memo"
                  value={newRecord.memo}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, memo: e.target.value })
                  }
                  placeholder="특이사항이나 메모를 입력하세요"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-[#2F80ED] hover:bg-[#2570d6] text-white font-semibold">
                  등록하기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 카드 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">필터 옵션</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">스케줄 필터</Label>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger>
                <SelectValue placeholder="전체 스케줄" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 스케줄</SelectItem>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.title || schedule.type} - {new Date(schedule.start_time).toLocaleDateString("ko-KR")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">시작 날짜</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">종료 날짜</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 출석 기록 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  출석 일시
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  회원명
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  스케줄
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  담당 직원
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  메모
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Calendar className="w-16 h-16 mb-4 text-gray-300" />
                      <p className="text-lg font-medium">출석 기록이 없습니다.</p>
                      <p className="text-sm mt-1">새로운 출석 기록을 등록해주세요.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.attended_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#2F80ED] font-bold mr-3">
                          {record.member?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {record.member?.name || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.member?.phone || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.schedule?.title || "-"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(record.schedule?.start_time).toLocaleString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-xs font-bold mr-2">
                          {record.staff?.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm text-gray-700">
                          {record.staff?.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={record.status_code}
                        onValueChange={(value) =>
                          handleStatusChange(record.id, value)
                        }
                      >
                        <SelectTrigger className="w-36 border-0">
                          <SelectValue>
                            <Badge className={(record.status?.color || "bg-gray-500") + " text-white"}>
                              {record.status?.label || record.status_code}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.code} value={status.code}>
                              <Badge className={status.color + " text-white"}>
                                {status.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {record.memo ? (
                        <span>{record.memo}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        삭제
                      </Button>
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
