"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/lib/utils/error-handler";

interface ParsedExcelRow {
  name: string;
  phone: string;
  birth_date: string;
  gender: string;
  membership_names: string[];
  course_names: string[];
  additional_products: string[];
  membership_start_date: string;
  membership_end_date: string;
  membership_name?: string; // 호환성을 위해
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymId: string;
  companyId: string;
  onSuccess: () => void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  gymId,
  companyId,
  onSuccess,
}: ExcelImportModalProps) {
  const supabase = createSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedExcelData, setParsedExcelData] = useState<ParsedExcelRow[]>([]);

  const resetForm = () => {
    setExcelFile(null);
    setParsedExcelData([]);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  // Excel 날짜를 YYYY-MM-DD 문자열로 변환
  const excelDateToString = (excelDate: any): string => {
    if (!excelDate) return "";

    if (typeof excelDate === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
        return excelDate;
      }
      if (/^\d{4}[.\/]\d{2}[.\/]\d{2}$/.test(excelDate)) {
        return excelDate.replace(/[.\/]/g, "-");
      }
    }

    if (typeof excelDate === "number") {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return "";
  };

  // 상품명에서 membership_type 자동 감지
  const detectMembershipType = (productName: string): string => {
    const name = productName.toLowerCase();

    if (name.includes("ppt")) return "PPT";
    if (name.includes("gpt")) return "GPT";
    if (name.includes("pt")) return "PT";
    if (name.includes("요가")) return "GX";
    if (name.includes("필라테스")) return "필라테스";
    if (name.includes("gx")) return "GX";
    if (name.includes("골프")) return "골프";
    if (name.includes("하이록스")) return "헬스";
    if (name.includes("크로스핏")) return "헬스";
    if (name.includes("헬스")) return "헬스";
    if (name.includes("락커")) return "헬스";
    if (name.includes("운동복")) return "헬스";
    if (name.includes("러닝")) return "헬스";

    return "헬스";
  };

  // Excel 파일 처리
  const handleExcelFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const findColumn = (row: any, keywords: string[]): any => {
        const columns = Object.keys(row);
        for (const keyword of keywords) {
          const matchedColumn = columns.find((col) => col.includes(keyword));
          if (matchedColumn) return row[matchedColumn];
        }
        return null;
      };

      const findAllColumns = (row: any, keywords: string[]): string[] => {
        const columns = Object.keys(row);
        const matchedValues: string[] = [];
        for (const keyword of keywords) {
          const matchedColumns = columns.filter((col) => col.includes(keyword));
          for (const col of matchedColumns) {
            const value = row[col];
            if (value && String(value).trim()) {
              matchedValues.push(String(value).trim());
            }
          }
        }
        return matchedValues;
      };

      const mapped = jsonData.map((row: any) => {
        const birthDate = excelDateToString(
          findColumn(row, ["생년월일", "생일"])
        );
        const startDate = excelDateToString(findColumn(row, ["등록", "시작"]));
        const endDate = excelDateToString(findColumn(row, ["만료", "종료"]));
        const membershipNames = findAllColumns(row, [
          "회원권",
          "대여권",
          "이용권",
        ]);
        const courseNames = findAllColumns(row, ["수강권", "횟수권"]);
        const additionalProducts = findAllColumns(row, ["부가상품"]);
        const name = findColumn(row, ["회원명", "이름", "성명"]) || "";
        const phone =
          findColumn(row, ["연락처", "전화번호", "휴대폰", "폰번호", "전화"]) ||
          "";
        const genderValue = findColumn(row, ["성별"]);
        const gender =
          genderValue === "남성" || genderValue === "남"
            ? "male"
            : genderValue === "여성" || genderValue === "여"
              ? "female"
              : "";

        return {
          name,
          phone,
          birth_date: birthDate,
          gender,
          membership_names: membershipNames,
          course_names: courseNames,
          additional_products: additionalProducts,
          membership_start_date: startDate,
          membership_end_date: endDate,
          membership_name: membershipNames[0] || "",
        };
      });

      setParsedExcelData(mapped);
      showSuccess(`${mapped.length}개의 회원 데이터를 불러왔습니다.`);
    } catch (error: any) {
      console.error("Excel 파싱 오류:", error);
      showError("Excel 파일을 읽는데 실패했습니다.");
      setExcelFile(null);
    }
  };

  // Excel 데이터 일괄 등록
  const handleBulkImport = async () => {
    if (!parsedExcelData || parsedExcelData.length === 0) {
      toast.warning("가져올 데이터가 없습니다.");
      return;
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    const confirmed = confirm(
      `${parsedExcelData.length}명의 회원을 등록하시겠습니까?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const row of parsedExcelData) {
        try {
          if (!row.name || !row.phone) {
            failCount++;
            continue;
          }

          const { data: newMember, error: memberError } = await supabase
            .from("members")
            .insert({
              company_id: companyId,
              gym_id: gymId,
              name: row.name,
              phone: row.phone,
              birth_date: row.birth_date || null,
              gender: row.gender || null,
              status: "active",
            })
            .select()
            .single();

          if (memberError) throw memberError;

          const today = new Date().toISOString().split("T")[0];

          // 회원권 등록
          if (
            row.membership_names &&
            row.membership_names.length > 0 &&
            newMember
          ) {
            for (const membershipName of row.membership_names) {
              await supabase.from("member_memberships").insert({
                company_id: companyId,
                gym_id: gymId,
                member_id: newMember.id,
                name: membershipName,
                membership_type: detectMembershipType(membershipName),
                total_sessions: null,
                used_sessions: 0,
                start_date: row.membership_start_date || today,
                end_date: row.membership_end_date || null,
                status: "active",
                memo: "[엑셀 가져오기 - 회원권] 수정 불가",
              });
            }
          }

          // 수강권 등록
          if (row.course_names && row.course_names.length > 0 && newMember) {
            for (const courseName of row.course_names) {
              await supabase.from("member_memberships").insert({
                company_id: companyId,
                gym_id: gymId,
                member_id: newMember.id,
                name: courseName,
                membership_type: detectMembershipType(courseName),
                total_sessions: null,
                used_sessions: 0,
                start_date: row.membership_start_date || today,
                end_date: row.membership_end_date || null,
                status: "active",
                memo: "[엑셀 가져오기 - 수강권] 수정 불가",
              });
            }
          }

          // 부가상품 등록
          if (
            row.additional_products &&
            row.additional_products.length > 0 &&
            newMember
          ) {
            for (const additionalProduct of row.additional_products) {
              await supabase.from("member_memberships").insert({
                company_id: companyId,
                gym_id: gymId,
                member_id: newMember.id,
                name: additionalProduct,
                membership_type: detectMembershipType(additionalProduct),
                total_sessions: null,
                used_sessions: 0,
                start_date: row.membership_start_date || today,
                end_date: row.membership_end_date || null,
                status: "active",
                memo: "[엑셀 가져오기 - 부가상품] 수정 불가",
              });
            }
          }

          successCount++;
        } catch (error) {
          console.error("회원 등록 실패:", error);
          failCount++;
        }
      }

      showSuccess(`등록 완료: 성공 ${successCount}명, 실패 ${failCount}명`);
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("일괄 등록 오류:", error);
      showError(error.message || "일괄 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Excel 회원 데이터 가져오기</DialogTitle>
          <DialogDescription className="sr-only">
            Excel 파일에서 회원 데이터를 가져옵니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">
              Excel 파일 형식 안내
            </h4>
            <p className="text-sm text-blue-700 mb-2">
              다음 컬럼명을 사용하여 Excel 파일을 준비해주세요:
            </p>
            <div className="text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>회원명</strong> (필수)
                </li>
                <li>
                  <strong>연락처</strong> (필수)
                </li>
                <li>
                  <strong>생년월일</strong> (선택, 예: 1990-01-01)
                </li>
                <li>
                  <strong>성별</strong> (선택, "남성" 또는 "여성")
                </li>
                <li>
                  <strong>회원권이름</strong> (선택)
                </li>
                <li>
                  <strong>시작일</strong> (선택, 예: 2024-01-01)
                </li>
                <li>
                  <strong>종료일</strong> (선택, 예: 2024-12-31)
                </li>
              </ul>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="space-y-2">
            <Label className="text-[#0F4C5C]">Excel 파일 선택</Label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {excelFile && (
              <p className="text-sm text-gray-600">
                선택된 파일: {excelFile.name}
              </p>
            )}
          </div>

          {/* 미리보기 테이블 */}
          {parsedExcelData.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">
                데이터 미리보기 ({parsedExcelData.length}명)
              </h4>
              <div className="border rounded-md overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">회원명</th>
                      <th className="px-3 py-2 text-left">연락처</th>
                      <th className="px-3 py-2 text-left">생년월일</th>
                      <th className="px-3 py-2 text-left">성별</th>
                      <th className="px-3 py-2 text-left">회원권</th>
                      <th className="px-3 py-2 text-left">시작일</th>
                      <th className="px-3 py-2 text-left">종료일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedExcelData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{row.name || "-"}</td>
                        <td className="px-3 py-2">{row.phone || "-"}</td>
                        <td className="px-3 py-2">{row.birth_date || "-"}</td>
                        <td className="px-3 py-2">
                          {row.gender === "male"
                            ? "남성"
                            : row.gender === "female"
                              ? "여성"
                              : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {row.membership_name || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {row.membership_start_date || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {row.membership_end_date || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">
                * 회원명과 연락처가 없는 행은 등록되지 않습니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleBulkImport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            disabled={isLoading || parsedExcelData.length === 0}
          >
            {isLoading
              ? "등록 중..."
              : `${parsedExcelData.length}명 일괄 등록`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
