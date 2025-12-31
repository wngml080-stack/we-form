import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, ArrowUpDown } from "lucide-react";

// 회원 데이터 타입
export interface Member {
  id: string;
  name: string;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  status: "active" | "paused" | "expired";
  created_at: string;
  trainer_id: string | null;
  activeMembership?: {
    id: string;
    name: string;
    total_sessions: number;
    used_sessions: number;
    start_date: string;
    end_date: string | null;
    status: string;
  };
  totalMemberships?: number;
}

// 상태 뱃지 헬퍼 함수 (종료일 기준으로 마감임박/만료 계산)
function getStatusBadge(status: string, endDate?: string | null) {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    expiring: "bg-orange-100 text-orange-700",
    paused: "bg-amber-100 text-amber-700",
    expired: "bg-gray-100 text-gray-500"
  };
  const labels: Record<string, string> = {
    active: "활성",
    expiring: "마감임박",
    paused: "홀딩",
    expired: "만료"
  };

  // 홀딩 상태는 그대로 표시
  if (status === "paused") {
    return { color: colors.paused, label: labels.paused };
  }

  // 종료일 기준으로 상태 계산
  if (endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: colors.expired, label: labels.expired };
    }
    if (diffDays <= 7) {
      return { color: colors.expiring, label: labels.expiring };
    }
  }

  return { color: colors[status] || "bg-gray-100", label: labels[status] || status };
}

// 액션 Props 타입
export interface MemberActionsProps {
  onViewDetail: (member: Member) => void;
  onStatusChange: (member: Member, newStatus: string) => void;
}

/**
 * 회원 테이블 컬럼 정의
 *
 * @param actions - 액션 핸들러 (수정, 회원권 등록)
 * @returns TanStack Table 컬럼 정의 배열
 */
export function getMemberColumns(actions: MemberActionsProps): ColumnDef<Member>[] {
  return [
    // 0. 체크박스 (행 선택)
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="전체 선택"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="행 선택"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // 1. 이름 (정렬 가능)
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 font-medium hover:text-gray-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            이름
            <ArrowUpDown className="h-3 w-3" />
          </button>
        );
      },
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("name")}</span>;
      },
      enableSorting: true,
    },

    // 2. 연락처
    {
      accessorKey: "phone",
      header: "연락처",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string | null;
        return <span className="text-gray-600">{phone || "-"}</span>;
      },
      enableSorting: false,
    },

    // 3. 생년월일 (정렬 가능)
    {
      accessorKey: "birth_date",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 font-medium hover:text-gray-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            생년월일
            <ArrowUpDown className="h-3 w-3" />
          </button>
        );
      },
      cell: ({ row }) => {
        const birthDate = row.getValue("birth_date") as string | null;
        return <span className="text-gray-600">{birthDate || "-"}</span>;
      },
      enableSorting: true,
    },

    // 4. 성별
    {
      accessorKey: "gender",
      header: "성별",
      cell: ({ row }) => {
        const gender = row.getValue("gender") as string | null;
        return <span className="text-gray-600">{gender || "-"}</span>;
      },
      enableSorting: false,
    },

    // 5. 활성 회원권
    {
      id: "activeMembership",
      header: "활성 회원권",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <span className="text-gray-600">
            {member.activeMembership ? member.activeMembership.name : "-"}
          </span>
        );
      },
      enableSorting: false,
    },

    // 5-1. 회원권 시작일 (정렬 가능)
    {
      id: "membership_start_date",
      accessorFn: (row) => row.activeMembership?.start_date,
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 font-medium hover:text-gray-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            시작일
            <ArrowUpDown className="h-3 w-3" />
          </button>
        );
      },
      cell: ({ row }) => {
        const member = row.original;
        if (!member.activeMembership?.start_date) {
          return <span className="text-gray-500">-</span>;
        }
        return <span className="text-gray-600">{member.activeMembership.start_date}</span>;
      },
      enableSorting: true,
    },

    // 5-2. 회원권 종료일 (정렬 가능)
    {
      id: "membership_end_date",
      accessorFn: (row) => row.activeMembership?.end_date,
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 font-medium hover:text-gray-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            종료일
            <ArrowUpDown className="h-3 w-3" />
          </button>
        );
      },
      cell: ({ row }) => {
        const member = row.original;
        if (!member.activeMembership?.end_date) {
          return <span className="text-gray-500">-</span>;
        }
        return <span className="text-gray-600">{member.activeMembership.end_date}</span>;
      },
      enableSorting: true,
    },

    // 6. 잔여횟수 (기존 로직 그대로)
    {
      id: "remaining",
      header: "잔여횟수",
      cell: ({ row }) => {
        const member = row.original;
        if (!member.activeMembership) {
          return <span className="text-gray-500">-</span>;
        }

        const remaining = member.activeMembership.total_sessions - member.activeMembership.used_sessions;
        const isZero = remaining === 0;

        return (
          <span className={isZero ? "text-red-500 font-semibold" : "text-gray-700"}>
            {remaining} / {member.activeMembership.total_sessions}회
          </span>
        );
      },
      enableSorting: false,
    },

    // 7. 상태 (정렬 가능, 클릭 가능)
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-2 font-medium hover:text-gray-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            상태
            <ArrowUpDown className="h-3 w-3" />
          </button>
        );
      },
      cell: ({ row }) => {
        const member = row.original;
        const status = row.getValue("status") as string;
        const endDate = member.activeMembership?.end_date;
        const statusBadge = getStatusBadge(status, endDate);

        return (
          <button
            onClick={() => {
              // 상태 순환: active -> paused -> expired -> active
              const nextStatus =
                status === "active" ? "paused" :
                status === "paused" ? "expired" : "active";
              actions.onStatusChange(member, nextStatus);
            }}
            className="focus:outline-none"
          >
            <Badge className={`border-0 ${statusBadge.color} cursor-pointer hover:opacity-80`}>
              {statusBadge.label}
            </Badge>
          </button>
        );
      },
      enableSorting: true,
    },

    // 8. 관리 액션
    {
      id: "actions",
      header: () => <div className="text-right">관리</div>,
      cell: ({ row }) => {
        const member = row.original;

        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.onViewDetail(member)}
              title="회원 상세정보 및 결제 이력"
            >
              <Eye className="h-4 w-4 text-blue-600"/>
            </Button>
          </div>
        );
      },
      enableSorting: false,
    },
  ];
}
