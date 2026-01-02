"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { calculateMonthlyStats } from "@/lib/schedule-utils";
import { Calculator, Download, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 타입 정의
type StaffSalaryResult = {
    staff_id: string;
    staff_name: string;
    job_position?: string;
    base_salary: number; // 기본급 합계
    incentive_salary: number; // 인센티브 합계
    class_salary: number; // 수업료 합계
    total_salary: number; // 총 급여
    details: {
        rule_name: string;
        amount: number;
        calculation: string; // "50회 x 20,000원" 등 설명
    }[];
    stats: any; // 근무 통계
    reportStatus: 'approved' | 'submitted' | 'rejected' | 'none'; // 보고서 승인 상태
};

export default function SalaryCalculator() {
    const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();
    const gymId = branchFilter.selectedGymId;
    const gymName = branchFilter.gyms.find(g => g.id === gymId)?.name || "";

    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [results, setResults] = useState<StaffSalaryResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 임시 매출 데이터 상태
    const [salesData, setSalesData] = useState<Record<string, number>>({});
    const [isSaved, setIsSaved] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // 월별 보고서 승인 상태
    const [reportApprovalStatus, setReportApprovalStatus] = useState<{
        hasReports: boolean;
        allApproved: boolean;
        approvedCount: number;
        totalCount: number;
        staffStatuses: Record<string, 'approved' | 'submitted' | 'rejected' | 'none'>;
    }>({
        hasReports: false,
        allApproved: false,
        approvedCount: 0,
        totalCount: 0,
        staffStatuses: {}
    });

    const supabase = createSupabaseClient();

    // 월이 바뀌거나 지점ID가 로드되면 저장된 데이터 불러오기
    useEffect(() => {
        if (filterInitialized && gymId && selectedMonth) {
            fetchSavedData();
            checkReportApprovalStatus();
        }
    }, [filterInitialized, gymId, selectedMonth]);

    // 월별 보고서 승인 상태 확인
    const checkReportApprovalStatus = async () => {
        if (!gymId) return;

        try {
            // 해당 지점의 직원 목록 조회
            const { data: staffList } = await supabase
                .from("staffs")
                .select("id")
                .eq("gym_id", gymId)
                .neq("role", "admin");

            const staffIds = staffList?.map(s => s.id) || [];

            // 해당 월의 보고서 상태 조회
            const { data: reports } = await supabase
                .from("monthly_schedule_reports")
                .select("staff_id, status")
                .eq("gym_id", gymId)
                .eq("year_month", selectedMonth);

            const staffStatuses: Record<string, 'approved' | 'submitted' | 'rejected' | 'none'> = {};

            // 모든 직원의 상태 초기화
            staffIds.forEach(id => {
                staffStatuses[id] = 'none';
            });

            // 보고서가 있는 직원의 상태 업데이트
            reports?.forEach(report => {
                staffStatuses[report.staff_id] = report.status as 'approved' | 'submitted' | 'rejected';
            });

            const approvedCount = Object.values(staffStatuses).filter(s => s === 'approved').length;
            const totalCount = staffIds.length;

            setReportApprovalStatus({
                hasReports: (reports?.length || 0) > 0,
                allApproved: approvedCount === totalCount && totalCount > 0,
                approvedCount,
                totalCount,
                staffStatuses
            });
        } catch (error) {
            console.error("보고서 상태 확인 실패:", error);
        }
    };

    const fetchSavedData = async () => {
        if (!gymId) return;
        setIsLoading(true);
        try {
            // 1. 월별 실적(매출) 불러오기
            const { data: performances } = await supabase
                .from("monthly_performance")
                .select("staff_id, metrics")
                .eq("year_month", selectedMonth);

            const loadedSales: Record<string, number> = {};
            if (performances) {
                performances.forEach((p: any) => {
                    if (p.metrics?.personal_sales) {
                        loadedSales[p.staff_id] = Number(p.metrics.personal_sales);
                    }
                });
                setSalesData(loadedSales);
            }

            // 2. 저장된 급여 내역 불러오기
            const { data: salaries } = await supabase
                .from("calculated_salaries")
                .select(`
                    staff_id, 
                    total_amount, 
                    breakdown, 
                    updated_at,
                    staff:staffs(id, name, job_title)
                `)
                .eq("year_month", selectedMonth);

            if (salaries && salaries.length > 0) {
                // 저장된 데이터가 있으면 results 상태 복원
                const savedResults: StaffSalaryResult[] = salaries.map((s: any) => {
                    const breakdown = s.breakdown || {};
                    return {
                        staff_id: s.staff_id,
                        staff_name: s.staff?.name || "알 수 없음",
                        job_position: s.staff?.job_title,
                        base_salary: breakdown.base_salary || 0,
                        incentive_salary: breakdown.incentive_salary || 0,
                        class_salary: breakdown.class_salary || 0,
                        total_salary: s.total_amount,
                        details: breakdown.details || [],
                        stats: breakdown.stats || {
                            pt_total_count: 0,
                            pt_inside_count: 0,
                            pt_outside_count: 0,
                            pt_weekend_count: 0,
                            pt_holiday_count: 0
                        },
                        reportStatus: breakdown.reportStatus || 'none'
                    };
                });
                setResults(savedResults);
                setIsSaved(true);
                setLastUpdated(new Date(salaries[0].updated_at).toLocaleString());
            } else {
                setResults([]);
                setIsSaved(false);
                setLastUpdated(null);
            }

        } catch (e) {
            console.error("데이터 로딩 실패", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSales = async () => {
        if (!gymId) return;
        
        try {
            const updates = Object.entries(salesData).map(([staffId, amount]) => ({
                staff_id: staffId,
                year_month: selectedMonth,
                metrics: { personal_sales: amount },
                updated_at: new Date().toISOString()
            }));

            // upsert
            const { error } = await supabase
                .from("monthly_performance")
                .upsert(updates, { onConflict: 'staff_id, year_month' });

            if (error) throw error;
            toast.success("매출 데이터가 저장되었습니다.");
        } catch (e: unknown) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
            toast.error("매출 저장 실패: " + errorMessage);
        }
    };

    const handleSaveSalaries = async () => {
        if (!gymId || results.length === 0) return;

        try {
            const updates = results.map(r => ({
                staff_id: r.staff_id,
                year_month: selectedMonth,
                total_amount: r.total_salary,
                breakdown: {
                    base_salary: r.base_salary,
                    class_salary: r.class_salary,
                    incentive_salary: r.incentive_salary,
                    details: r.details,
                    stats: r.stats,
                    reportStatus: r.reportStatus
                },
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from("calculated_salaries")
                .upsert(updates, { onConflict: 'staff_id, year_month' });

            if (error) throw error;

            setIsSaved(true);
            setLastUpdated(new Date().toLocaleString());
            toast.success("급여 정산 내역이 확정(저장)되었습니다.");
        } catch (e: unknown) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
            toast.error("저장 실패: " + errorMessage);
        }
    };

    const calculateSalaries = async () => {
        if (!gymId) return;
        setIsLoading(true);

        try {
            // 1. 필요한 데이터 모두 조회
            // 1-1. 직원 및 급여 설정 조회
            const { data: staffs } = await supabase
                .from("staffs")
                .select(`
                    id, name, job_title,
                    salary_setting:staff_salary_settings(
                        personal_parameters,
                        template:salary_templates(
                            items:salary_template_items(
                                rule:salary_rules(*)
                            )
                        )
                    )
                `)
                .eq("gym_id", gymId)
                .neq("role", "admin"); // 지점장 제외 여부는 정책에 따라 결정

            // 1-2. 해당 월 스케줄 조회 (통계용)
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            // 승인된 보고서가 있는 직원의 스케줄만 is_locked=true인 것을 조회
            // 미승인 직원은 모든 스케줄 조회 (임시 계산용)
            const { data: schedules } = await supabase
                .from("schedules")
                .select("staff_id, schedule_type, counted_for_salary, status, is_locked")
                .eq("gym_id", gymId)
                .gte("start_time", startDate.toISOString())
                .lte("start_time", endDate.toISOString());

            // 2. 직원별 급여 계산
            const calculatedResults: StaffSalaryResult[] = [];
            const staffList = staffs || [];

            // 매출 데이터가 없으면 직원 리스트라도 매출 입력칸에 띄우기 위해 results 미리 채움 (빈값으로)
            if (staffList.length > 0 && Object.keys(salesData).length === 0) {
                 // 매출 데이터가 하나도 없으면 초기화? 아니면 그냥 둠
            }

            for (const staff of staffList) {
                // @ts-ignore
                const setting = staff.salary_setting?.[0];

                // 해당 직원의 보고서 승인 상태 확인
                const staffReportStatus = reportApprovalStatus.staffStatuses[staff.id] || 'none';
                const isApproved = staffReportStatus === 'approved';

                // 승인된 직원: is_locked=true인 스케줄만 집계
                // 미승인 직원: 모든 스케줄 집계 (임시 계산)
                const staffSchedules = schedules?.filter(s => {
                    if (s.staff_id !== staff.id) return false;
                    if (isApproved) return s.is_locked === true;
                    return true;
                }) || [];

                const stats = calculateMonthlyStats(staffSchedules);
                const personalSales = salesData[staff.id] || 0;

                const result: StaffSalaryResult = {
                    staff_id: staff.id,
                    staff_name: staff.name,
                    job_position: staff.job_title,
                    base_salary: 0,
                    incentive_salary: 0,
                    class_salary: 0,
                    total_salary: 0,
                    details: [],
                    stats: stats,
                    reportStatus: staffReportStatus
                };

                if (setting && setting.template) {
                    // 규칙 적용
                    // @ts-ignore - template.items 타입 정의 필요
                    const rules = setting.template.items?.map((i: any) => i.rule) || [];
                    const params = setting.personal_parameters || {};

                    for (const rule of rules) {
                        const ruleParams = {
                            ...rule.default_parameters,
                            ...(params[rule.id] || {})
                        };

                        let amount = 0;
                        let desc = "";

                        // 계산 로직
                        if (rule.calculation_type === 'fixed') {
                            amount = Number(ruleParams.amount || 0);
                            desc = "고정급";
                            result.base_salary += amount;
                        } 
                        else if (rule.calculation_type === 'hourly') {
                            const rate = Number(ruleParams.rate || 0);
                            let count = 0;
                            
                            if (rule.name.includes("근무내") || rule.name.includes("PT IN")) count = stats.pt_inside_count;
                            else if (rule.name.includes("근무외") || rule.name.includes("PT OUT")) count = stats.pt_outside_count;
                            else if (rule.name.includes("주말")) count = stats.pt_weekend_count;
                            else if (rule.name.includes("공휴일")) count = stats.pt_holiday_count;
                            else count = stats.pt_total_count;

                            amount = count * rate;
                            desc = `${count}회 x ${rate.toLocaleString()}원`;
                            result.class_salary += amount;
                        }
                        else if (rule.calculation_type === 'percentage_total' || rule.calculation_type === 'percentage_personal') {
                            const rate = Number(ruleParams.rate || 0);
                            const targetSales = personalSales; 
                            amount = targetSales * (rate / 100);
                            desc = `매출 ${targetSales.toLocaleString()}원의 ${rate}%`;
                            result.incentive_salary += amount;
                        }
                        else if (rule.calculation_type === 'tiered') {
                            const tiers = ruleParams.tiers || [];
                            const targetSales = personalSales;
                            
                            const sortedTiers = [...tiers].sort((a: any, b: any) => a.min - b.min);
                            const matchedTier = sortedTiers.slice().reverse().find((t: any) => 
                                targetSales >= t.min && (t.max === null || t.max === 0 || targetSales < t.max)
                            );
                            
                            if (matchedTier) {
                                amount = Number(matchedTier.value);
                                desc = `매출 구간(${matchedTier.min/10000}만~) 적용`;
                            } else {
                                amount = 0;
                                desc = "해당 구간 없음";
                            }
                            result.incentive_salary += amount;
                        }

                        if (amount > 0) {
                            result.details.push({
                                rule_name: rule.name,
                                amount: amount,
                                calculation: desc
                            });
                            result.total_salary += amount;
                        }
                    }
                } else {
                    // 템플릿 미설정 직원도 리스트엔 표시 (경고)
                    result.details.push({
                        rule_name: "설정 없음",
                        amount: 0,
                        calculation: "급여 템플릿을 설정해주세요"
                    });
                }

                calculatedResults.push(result);
            }

            setResults(calculatedResults);
            setIsSaved(false); // 재계산했으므로 저장되지 않은 상태로 변경 (사용자가 저장 버튼을 눌러야 함)

        } catch (error) {
            console.error(error);
            toast.error("계산 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (results.length === 0) return;

        // 동적 import - 사용자가 내보내기 클릭 시에만 로드
        const XLSX = await import("xlsx");

        const wb = XLSX.utils.book_new();
        const wsData = [
            ["직원명", "직책", "기본급", "수업료", "인센티브", "총 지급액", "세부 내역"],
            ...results.map(r => [
                r.staff_name,
                r.job_position,
                r.base_salary,
                r.class_salary,
                r.incentive_salary,
                r.total_salary,
                r.details.map(d => `${d.rule_name}: ${d.amount.toLocaleString()}원`).join(", ")
            ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "급여대장");
        XLSX.writeFile(wb, `${gymName}_${selectedMonth}_급여대장.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 보고서 승인 상태 배너 */}
            {reportApprovalStatus.totalCount > 0 && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                    {reportApprovalStatus.allApproved ? (
                        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-5 rounded-[24px] shadow-sm shadow-emerald-100/50">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-black text-emerald-900 text-lg tracking-tight">모든 보고서 승인 완료</h4>
                                <p className="text-emerald-700 font-bold text-sm">
                                    {selectedMonth}월의 모든 직원 보고서가 승인되었습니다. 확정된 데이터로 정산이 가능합니다.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 p-5 rounded-[24px] shadow-sm shadow-amber-100/50">
                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-amber-900 text-lg tracking-tight">일부 보고서 승인 대기 중</h4>
                                <p className="text-amber-700 font-bold text-sm">
                                    승인됨: <span className="text-amber-900 font-black">{reportApprovalStatus.approvedCount}</span> / {reportApprovalStatus.totalCount}명
                                    <span className="mx-2 opacity-30">|</span>
                                    정확한 급여 계산을 위해 모든 보고서 승인 후 <span className="text-amber-900 font-black">최종 확정</span>을 권장합니다.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Calculator className="w-6 h-6 text-blue-600" />
                        </div>
                        월간 급여 정산
                        {isSaved && <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] tracking-widest px-2 py-0.5 rounded-lg shadow-sm">FINALIZED</Badge>}
                    </h3>
                    <div className="flex items-center gap-2 ml-13">
                        <p className="text-sm text-slate-400 font-bold">
                            템플릿 설정과 실적 데이터를 바탕으로 최종 지급액을 산출합니다.
                        </p>
                        {lastUpdated && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">Last: {lastUpdated}</span>}
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px] h-12 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100 transition-all">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                            {Array.from({length: 12}, (_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                return <SelectItem key={v} value={v} className="rounded-xl font-bold py-3">{v}</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                    <Button 
                        onClick={calculateSalaries} 
                        className="h-12 px-6 bg-[#2F80ED] hover:bg-[#1c6cd7] text-white rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center gap-2 transition-all hover:-translate-y-1"
                    >
                        <Calculator className="w-4 h-4" /> 정산 실행
                    </Button>
                    <Button 
                        onClick={handleSaveSalaries} 
                        className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                        disabled={results.length === 0}
                    >
                        <Save className="w-4 h-4" /> 결과 저장
                    </Button>
                    <Button 
                        onClick={handleDownloadExcel} 
                        variant="ghost" 
                        className="h-12 w-12 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                        disabled={results.length === 0}
                    >
                        <Download className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 매출 입력 섹션 - 좌측 1단 */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[40px] border-none bg-white shadow-xl shadow-slate-100/50 overflow-hidden">
                        <CardHeader className="p-8 pb-4 flex flex-row justify-between items-center border-b border-slate-50 bg-slate-50/30">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                    개인 매출 입력
                                </CardTitle>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Personal Sales Data</p>
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleSaveSales} 
                                className="h-9 rounded-xl border-blue-100 text-blue-600 font-black text-[11px] hover:bg-blue-50 transition-all"
                            >
                                데이터 임시 저장
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {results.length === 0 && Object.keys(salesData).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                    <AlertTriangle className="w-10 h-10 mb-4 opacity-20" />
                                    <p className="font-bold text-sm text-center">정산 실행 버튼을 눌러<br />직원 목록을 불러오세요.</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {(results.length > 0 ? results : Object.keys(salesData).map(id => ({ staff_id: id, staff_name: "직원 " + id.substring(0,4) }))).map((item: any) => {
                                        if (!item.staff_id) return null;
                                        return (
                                            <div key={item.staff_id} className="space-y-2 group">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-[13px] font-black text-slate-700 tracking-tight group-focus-within:text-blue-600 transition-colors">{item.staff_name}</label>
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-focus-within:opacity-100 transition-all">Revenue</span>
                                                </div>
                                                <div className="relative">
                                                    <Input 
                                                        type="number" 
                                                        placeholder="0"
                                                        value={salesData[item.staff_id] || ""}
                                                        onChange={(e) => setSalesData({...salesData, [item.staff_id]: Number(e.target.value)})}
                                                        className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-black text-right pr-12 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                                                    />
                                                    <span className="absolute right-5 top-3.5 text-xs font-black text-slate-300 uppercase">KRW</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 결과 테이블 - 우측 2단 */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-slate-100/50 overflow-hidden h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100/30">
                        <div className="overflow-x-auto flex-1">
                            <Table className="border-collapse">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 border-b border-gray-100 hover:bg-slate-50/50">
                                        <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">직원 정보</TableHead>
                                        <TableHead className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">기본급</TableHead>
                                        <TableHead className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">수업료</TableHead>
                                        <TableHead className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">인센티브</TableHead>
                                        <TableHead className="px-8 py-6 text-right text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">실수령액(예상)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="px-8 py-40 text-center">
                                                <div className="flex flex-col items-center justify-center animate-pulse">
                                                    <Calculator className="w-12 h-12 text-blue-200 mb-4" />
                                                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Calculating...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : results.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="px-8 py-40 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-200">
                                                    <Calculator className="w-16 h-16 mb-6 opacity-20" />
                                                    <h4 className="text-lg font-black text-slate-400 tracking-tight mb-2">정산 데이터가 없습니다</h4>
                                                    <p className="text-sm font-bold text-slate-300">상단 정산 실행 버튼을 클릭하여 정산을 시작하세요.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : results.map((result) => (
                                        <TableRow key={result.staff_id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                            <TableCell className="px-8 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-base tracking-tighter">{result.staff_name}</span>
                                                        {result.reportStatus === 'approved' ? (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-[9px] px-1.5 py-0 rounded-md">CONFIRMED</Badge>
                                                        ) : (
                                                            <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] px-1.5 py-0 rounded-md">PENDING</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                                        <span>{result.job_position || "Staff"}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <span className="text-blue-500 font-black uppercase tracking-tight">PT {result.stats.pt_total_count} sessions</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-6 text-right font-bold text-slate-500 text-sm">
                                                {result.base_salary.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="px-4 py-6 text-right font-bold text-emerald-600 text-sm">
                                                {result.class_salary.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="px-4 py-6 text-right font-bold text-orange-500 text-sm">
                                                {result.incentive_salary.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-right">
                                                <div className="text-xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">
                                                    {result.total_salary.toLocaleString()}
                                                    <span className="text-[10px] ml-1 opacity-30 font-bold uppercase">KRW</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {results.length > 0 && (
                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monthly Payroll</p>
                                    <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                        {results.reduce((acc, curr) => acc + curr.total_salary, 0).toLocaleString()}
                                        <span className="text-base ml-1 opacity-30 font-bold uppercase tracking-widest">KRW</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 font-bold text-right leading-relaxed">
                                    위 금액은 세전 금액이며,<br />
                                    정산 확정 시 각 직원의 실적으로 반영됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}