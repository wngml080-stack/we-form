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
import { FileDown, FileSpreadsheet, X, Info, CheckCircle2, Download, AlertCircle, FileUp, Sparkles, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils/phone-format";

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
  membership_name?: string;
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

  const excelDateToString = (excelDate: any): string => {
    if (!excelDate) return "";
    if (typeof excelDate === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) return excelDate;
      if (/^\d{4}[.\/]\d{2}[.\/]\d{2}$/.test(excelDate)) return excelDate.replace(/[.\/]/g, "-");
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

  const detectMembershipType = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes("ppt")) return "PPT";
    if (name.includes("gpt")) return "GPT";
    if (name.includes("pt")) return "PT";
    if (name.includes("요가") || name.includes("gx")) return "GX";
    if (name.includes("필라테스")) return "필라테스";
    if (name.includes("골프")) return "골프";
    return "헬스";
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            if (value && String(value).trim()) matchedValues.push(String(value).trim());
          }
        }
        return matchedValues;
      };

      const mapped = jsonData.map((row: any) => {
        const birthDate = excelDateToString(findColumn(row, ["생년월일", "생일"]));
        const startDate = excelDateToString(findColumn(row, ["등록", "시작"]));
        const endDate = excelDateToString(findColumn(row, ["만료", "종료"]));
        const membershipNames = findAllColumns(row, ["회원권", "대여권", "이용권"]);
        const courseNames = findAllColumns(row, ["수강권", "횟수권"]);
        const additionalProducts = findAllColumns(row, ["부가상품"]);
        const name = findColumn(row, ["회원명", "이름", "성명"]) || "";
        const phone = findColumn(row, ["연락처", "전화번호", "휴대폰", "폰번호", "전화"]) || "";
        const genderValue = findColumn(row, ["성별"]);
        const gender = genderValue === "남성" || genderValue === "남" ? "male" : genderValue === "여성" || genderValue === "여" ? "female" : "";

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

  const handleBulkImport = async () => {
    if (!parsedExcelData || parsedExcelData.length === 0) {
      toast.warning("가져올 데이터가 없습니다.");
      return;
    }

    if (!gymId || !companyId) {
      toast.error("지점 정보를 찾을 수 없습니다.");
      return;
    }

    const confirmed = confirm(`${parsedExcelData.length}명의 회원을 등록하시겠습니까?`);
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

          // 회원권/수강권/부가상품 등록 로직 동일
          const allProductNames = [
            ...(row.membership_names || []),
            ...(row.course_names || []),
            ...(row.additional_products || [])
          ];

          for (const productName of allProductNames) {
            const { error: membershipError } = await supabase.from("member_memberships").insert({
              company_id: companyId,
              gym_id: gymId,
              member_id: newMember.id,
              name: productName,
              membership_type: detectMembershipType(productName),
              total_sessions: null,
              used_sessions: 0,
              start_date: row.membership_start_date || today,
              end_date: row.membership_end_date || null,
              status: "active",
              memo: "[엑셀 가져오기] 상세 정보 수정 필요",
            });

            if (membershipError) {
              console.error(`회원권 등록 실패 (${row.name} - ${productName}):`, membershipError);
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
      <DialogContent className="max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">회원 데이터 일괄 업로드</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-sm text-white/80 font-bold">Excel 파일을 통한 대규모 회원 정보 등록</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">기존 회원 데이터를 엑셀로 한 번에 가져옵니다</DialogDescription>
          <button
            onClick={handleClose}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* 가이드 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Excel 준비 가이드</h3>
              </div>
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                  원활한 업로드를 위해 아래 컬럼명이 포함된 엑셀 파일을 준비해주세요. 컬럼 순서는 상관없습니다.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "회원명", required: true },
                    { label: "연락처", required: true },
                    { label: "생년월일", required: false },
                    { label: "성별", required: false },
                    { label: "회원권이름", required: false },
                    { label: "시작일", required: false },
                    { label: "종료일", required: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className={cn("w-1.5 h-1.5 rounded-full", item.required ? "bg-rose-500" : "bg-slate-300")}></div>
                      <span className="text-xs font-black text-slate-700">{item.label}</span>
                      {item.required && <span className="text-[10px] font-black text-rose-500 uppercase ml-auto">Req</span>}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full h-12 rounded-2xl font-black gap-2 border-slate-200">
                  <Download className="w-4 h-4" />
                  샘플 엑셀 다운로드
                </Button>
              </div>
            </div>

            {/* 업로드 섹션 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">파일 업로드</h3>
              </div>
              <div className="bg-white rounded-[32px] p-10 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group relative overflow-hidden flex flex-col items-center justify-center text-center">
                {excelFile ? (
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
                      <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 truncate max-w-[200px]">{excelFile.name}</p>
                      <p className="text-xs font-bold text-emerald-600">파일이 준비되었습니다.</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setExcelFile(null)}
                      className="text-slate-400 hover:text-rose-500 font-bold"
                    >
                      다른 파일 선택하기
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <FileUp className="w-10 h-10 text-slate-300 group-hover:text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900">클릭하여 파일 선택</p>
                      <p className="text-xs font-bold text-slate-400">.xlsx 또는 .xls 파일만 가능합니다.</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 미리보기 섹션 */}
          {parsedExcelData.length > 0 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">데이터 미리보기</h3>
                </div>
                <div className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">
                  {parsedExcelData.length} Members Loaded
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Name</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Birth</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membership</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parsedExcelData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-900">{row.name || "-"}</td>
                          <td className="px-6 py-4 font-bold text-slate-500 text-sm">{row.phone ? formatPhoneNumber(row.phone) : "-"}</td>
                          <td className="px-6 py-4 font-bold text-slate-500 text-sm">{row.birth_date || "-"}</td>
                          <td className="px-6 py-4">
                            {row.gender ? (
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                                row.gender === "male" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                              )}>
                                {row.gender === "male" ? "MALE" : "FEMALE"}
                              </span>
                            ) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 truncate max-w-[120px] inline-block">
                              {row.membership_name || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                              <span>{row.membership_start_date || "-"}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="text-slate-900">{row.membership_end_date || "-"}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={handleBulkImport}
            disabled={isLoading || parsedExcelData.length === 0}
            className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black gap-3 shadow-xl shadow-emerald-100 hover:-translate-y-1 transition-all text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">데이터 등록 중...</span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                {parsedExcelData.length}명 일괄 등록하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
