// 매출 엑셀 내보내기 유틸리티
import { toast } from "@/lib/toast";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

interface PaymentData {
  payment_date: string;
  member_name: string;
  phone?: string;
  sale_type: string;
  membership_category: string;
  membership_name: string;
  amount: number;
  method: string;
  installment?: number;
  trainer_name?: string;
  memo?: string;
}

const methodLabels: Record<string, string> = {
  card: "카드",
  cash: "현금",
  transfer: "계좌이체"
};

export async function exportSalesToExcel(payments: PaymentData[], gymName: string) {
  if (payments.length === 0) {
    toast.warning("다운로드할 매출 데이터가 없습니다.");
    return;
  }

  // 동적 import - 사용자가 내보내기 클릭 시에만 로드
  const XLSX = await import("xlsx");

  const excelData = payments.map((payment) => ({
    "날짜": formatDate(payment.payment_date),
    "회원명": payment.member_name || "-",
    "휴대폰번호": payment.phone ? formatPhoneNumber(payment.phone) : "-",
    "유형": payment.sale_type || "-",
    "회원권": payment.membership_category || "-",
    "회원권명": payment.membership_name || "-",
    "금액": payment.amount || 0,
    "결제방법": methodLabels[payment.method] || payment.method || "-",
    "할부": payment.installment === 1 ? "일시불" : `${payment.installment}개월`,
    "담당TR": payment.trainer_name || "-",
    "메모": payment.memo || "-"
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 컬럼 너비 설정
  worksheet["!cols"] = [
    { wch: 12 },  // 날짜
    { wch: 10 },  // 회원명
    { wch: 14 },  // 휴대폰번호
    { wch: 8 },   // 유형
    { wch: 10 },  // 회원권
    { wch: 10 },  // 회원권명
    { wch: 12 },  // 금액
    { wch: 10 },  // 결제방법
    { wch: 8 },   // 할부
    { wch: 10 },  // 담당TR
    { wch: 20 }   // 메모
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "매출현황");

  const today = new Date().toISOString().split("T")[0];
  const fileName = `매출현황_${gymName}_${today}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  toast.success("엑셀 파일이 다운로드되었습니다.");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
