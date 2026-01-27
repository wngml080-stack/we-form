import type { Schedule, AttendanceStats } from "../hooks/useAttendanceData";

const STATUS_LABELS: Record<string, string> = {
  reserved: "예약됨",
  completed: "출석완료",
  no_show_deducted: "노쇼(차감)",
  no_show: "노쇼",
  service: "서비스",
  cancelled: "취소됨",
};

const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  inside: "근무내",
  outside: "근무외",
  weekend: "주말",
  holiday: "공휴일",
};

interface ExportOptions {
  schedules: Schedule[];
  stats: AttendanceStats;
  gymName: string;
  period: string;
  viewMode: "daily" | "monthly" | "range";
}

export async function exportAttendanceToExcel({
  schedules,
  stats,
  gymName,
  period,
  viewMode,
}: ExportOptions) {
  // Dynamic import - 클릭할 때만 xlsx 라이브러리 로드
  const XLSX = await import("xlsx");

  // 워크북 생성
  const wb = XLSX.utils.book_new();

  // 1. 요약 시트
  const summaryData = [
    ["출석 관리 보고서"],
    [""],
    ["지점", gymName],
    ["기간", period],
    ["조회 유형", viewMode === "daily" ? "일별" : viewMode === "monthly" ? "월별" : "기간지정"],
    [""],
    ["통계 요약"],
    ["전체", stats.total],
    ["출석완료", stats.completed],
    ["노쇼", stats.noShow],
    ["대기", stats.pending],
    ["서비스", stats.service],
    ["취소", stats.cancelled],
    ["출석률", `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // 열 너비 설정
  summarySheet["!cols"] = [{ wch: 15 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, summarySheet, "요약");

  // 2. 상세 데이터 시트
  const detailHeaders = [
    "날짜",
    "시간",
    "종료시간",
    "회원명",
    "트레이너",
    "유형",
    "근무구분",
    "상태",
  ];

  const detailData = schedules.map((schedule) => {
    const startDate = new Date(schedule.start_time);
    const endDate = new Date(schedule.end_time);

    return [
      startDate.toLocaleDateString("ko-KR"),
      startDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      endDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      schedule.member_name || "-",
      schedule.staff?.name || "-",
      schedule.type,
      schedule.schedule_type ? SCHEDULE_TYPE_LABELS[schedule.schedule_type] || schedule.schedule_type : "-",
      STATUS_LABELS[schedule.status] || schedule.status,
    ];
  });

  const detailSheet = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailData]);

  // 열 너비 설정
  detailSheet["!cols"] = [
    { wch: 12 }, // 날짜
    { wch: 8 },  // 시간
    { wch: 8 },  // 종료시간
    { wch: 12 }, // 회원명
    { wch: 12 }, // 트레이너
    { wch: 8 },  // 유형
    { wch: 10 }, // 근무구분
    { wch: 12 }, // 상태
  ];

  XLSX.utils.book_append_sheet(wb, detailSheet, "상세데이터");

  // 3. 트레이너별 통계 시트
  const staffStatsMap = new Map<string, {
    name: string;
    total: number;
    completed: number;
    noShow: number;
    service: number;
  }>();

  schedules.forEach((schedule) => {
    const staffId = schedule.staff_id;
    const staffName = schedule.staff?.name || "알 수 없음";

    if (!staffStatsMap.has(staffId)) {
      staffStatsMap.set(staffId, {
        name: staffName,
        total: 0,
        completed: 0,
        noShow: 0,
        service: 0,
      });
    }

    const staffStat = staffStatsMap.get(staffId)!;
    staffStat.total++;

    if (schedule.status === "completed") {
      staffStat.completed++;
    } else if (["no_show", "no_show_deducted"].includes(schedule.status)) {
      staffStat.noShow++;
    } else if (schedule.status === "service") {
      staffStat.service++;
    }
  });

  const staffStatsHeaders = ["트레이너", "전체", "출석", "노쇼", "서비스", "출석률"];
  const staffStatsData = Array.from(staffStatsMap.values()).map((stat) => [
    stat.name,
    stat.total,
    stat.completed,
    stat.noShow,
    stat.service,
    stat.total > 0 ? `${Math.round((stat.completed / stat.total) * 100)}%` : "0%",
  ]);

  const staffSheet = XLSX.utils.aoa_to_sheet([staffStatsHeaders, ...staffStatsData]);

  staffSheet["!cols"] = [
    { wch: 12 }, // 트레이너
    { wch: 8 },  // 전체
    { wch: 8 },  // 출석
    { wch: 8 },  // 노쇼
    { wch: 8 },  // 서비스
    { wch: 10 }, // 출석률
  ];

  XLSX.utils.book_append_sheet(wb, staffSheet, "트레이너별통계");

  // 파일 다운로드
  const filename = `출석관리_${gymName}_${period.replace(/[^0-9-]/g, "")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 단일 날짜 포맷
export function formatPeriod(
  viewMode: "daily" | "monthly" | "range",
  selectedDate: string,
  selectedMonth: string,
  startDate: string,
  endDate: string
): string {
  if (viewMode === "daily") {
    const date = new Date(selectedDate);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  } else if (viewMode === "monthly") {
    const [year, month] = selectedMonth.split("-");
    return `${year}년 ${parseInt(month)}월`;
  } else {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
  }
}
