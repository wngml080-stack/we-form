"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { CalendarRange, LayoutDashboard, LogOut, Users2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type StaffRow = {
  id: string;
  name: string;
  job_title: string | null;
  employment_status: string | null;
  hired_at: string | null;
  gyms?: {
    name: string;
  } | null;
};

function getStatusBadgeColor(status: string | null | undefined) {
  switch (status) {
    case "재직":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "퇴사":
      return "bg-slate-100 text-slate-500 border-slate-200";
    case "휴직":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "지점이동":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "보직변경":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

export default function AdminStaffPage() {
  const router = useRouter();

  const [gymId, setGymId] = useState<string | null>(null);

  const [staffs, setStaffs] = useState<StaffRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffRow | null>(null);
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editStatus, setEditStatus] = useState<string>("재직");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: me, error } = await supabase
          .from("staffs")
          .select(
            `
            id,
            gym_id,
            name,
            gyms ( name )
          `
          )
          .eq("user_id", user.id)
          .single();

        if (error || !me) {
          console.error("관리자 정보 로딩 실패:", error);
          return;
        }

        setGymId(me.gym_id);
        setAdminName(me.name);
        // @ts-ignore
        setGymName(me.gyms?.name ?? "We:form");

        await fetchStaffs(me.gym_id);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [router]);

  const fetchStaffs = async (gymIdValue: string) => {
    const { data, error } = await supabase
      .from("staffs")
      .select(
        `
        id,
        name,
        job_title,
        employment_status,
        hired_at,
        gyms ( name )
      `
      )
      .eq("gym_id", gymIdValue)
      .order("name", { ascending: true });

    if (error) {
      console.error("직원 목록 로딩 실패:", error);
      return;
    }

    setStaffs((data ?? []) as StaffRow[]);
  };

  const openEditModal = (staff: StaffRow) => {
    setEditTarget(staff);
    setEditJobTitle(staff.job_title ?? "");
    setEditStatus(staff.employment_status ?? "재직");
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget || !gymId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("staffs")
        .update({
          job_title: editJobTitle,
          employment_status: editStatus,
        })
        .eq("id", editTarget.id)
        .eq("gym_id", gymId);

      if (error) {
        console.error("직원 수정 실패:", error);
        return;
      }

      await fetchStaffs(gymId);
      setIsEditOpen(false);
      setEditTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            직원 관리
          </h1>
          <p className="text-xs text-slate-500">
            센터에 소속된 모든 직원의 정보를 조회하고, 직책과 상태를 관리합니다.
          </p>
        </div>
      </header>

      <section className="flex-1 px-6 py-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  이름
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  지점
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  직책
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  상태
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  입사일
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {staffs.map((staff) => {
                const badgeClass = getStatusBadgeColor(staff.employment_status);
                const hiredLabel = staff.hired_at
                  ? new Date(staff.hired_at).toLocaleDateString("ko-KR")
                  : "-";
                return (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm text-slate-800">
                      {staff.name}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">
                      {staff.gyms?.name ?? gymName}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-700">
                      {staff.job_title ?? "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}
                      >
                        {staff.employment_status ?? "미지정"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">
                      {hiredLabel}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => openEditModal(staff)}
                      >
                        수정
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {staffs.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    등록된 직원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {isLoading && (
            <p className="px-4 py-3 text-xs text-slate-400">
              직원 정보를 불러오는 중입니다...
            </p>
          )}
        </div>
      </section>
      {/* 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl bg-white">
          <DialogHeader>
            <DialogTitle className="space-y-1">
              <div className="text-sm font-semibold text-slate-500">
                직원 정보 수정
              </div>
              <div className="text-lg font-bold text-slate-900">
                {editTarget?.name}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">직책</label>
              <Input
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
                placeholder="예: 수석 트레이너"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">상태</label>
              <Select
                value={editStatus}
                onValueChange={(value) => setEditStatus(value)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="재직">재직</SelectItem>
                  <SelectItem value="휴직">휴직</SelectItem>
                  <SelectItem value="퇴사">퇴사</SelectItem>
                  <SelectItem value="지점이동">지점이동</SelectItem>
                  <SelectItem value="보직변경">보직변경</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs text-slate-600"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 bg-[#0F4C5C] px-3 text-xs font-semibold text-white hover:bg-[#09313b]"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


