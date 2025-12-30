import { Member } from "@/app/admin/members/components/columns";

/**
 * 회원 데이터를 Excel 파일로 내보내기
 * xlsx 패키지를 동적 import하여 초기 번들 크기 최적화
 *
 * @param members - 내보낼 회원 데이터 배열
 * @param filename - 저장할 파일명 (기본값: "회원_목록_YYYYMMDD.xlsx")
 */
export async function exportMembersToExcel(members: Member[], filename?: string) {
  // 동적 import - 사용자가 내보내기 클릭 시에만 로드
  const XLSX = await import("xlsx");
  // 파일명 생성 (날짜 포함)
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const finalFilename = filename || `회원_목록_${dateStr}.xlsx`;

  // Excel 데이터 형식으로 변환
  const excelData = members.map((member, index) => ({
    "번호": index + 1,
    "이름": member.name,
    "연락처": member.phone || "-",
    "생년월일": member.birth_date || "-",
    "성별": member.gender || "-",
    "활성 회원권": member.activeMembership?.name || "-",
    "총 횟수": member.activeMembership?.total_sessions || 0,
    "사용 횟수": member.activeMembership?.used_sessions || 0,
    "잔여 횟수": member.activeMembership
      ? member.activeMembership.total_sessions - member.activeMembership.used_sessions
      : 0,
    "시작일": member.activeMembership?.start_date || "-",
    "종료일": member.activeMembership?.end_date || "-",
    "상태": member.status === "active" ? "활성" : member.status === "paused" ? "홀딩" : "만료",
    "등록일": member.created_at ? new Date(member.created_at).toISOString().split('T')[0] : "-",
  }));

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 컬럼 너비 자동 조정
  const columnWidths = [
    { wch: 6 },  // 번호
    { wch: 12 }, // 이름
    { wch: 15 }, // 연락처
    { wch: 12 }, // 생년월일
    { wch: 8 },  // 성별
    { wch: 20 }, // 활성 회원권
    { wch: 10 }, // 총 횟수
    { wch: 10 }, // 사용 횟수
    { wch: 10 }, // 잔여 횟수
    { wch: 12 }, // 시작일
    { wch: 12 }, // 종료일
    { wch: 8 },  // 상태
    { wch: 12 }, // 등록일
  ];
  worksheet['!cols'] = columnWidths;

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "회원 목록");

  // 파일 다운로드
  XLSX.writeFile(workbook, finalFilename);
}

/**
 * 선택된 회원 목록을 Excel로 내보내기 (간편 함수)
 */
export async function exportSelectedMembers(members: Member[]) {
  const count = members.length;
  const filename = `선택된_회원_${count}명_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;
  exportMembersToExcel(members, filename);
}
