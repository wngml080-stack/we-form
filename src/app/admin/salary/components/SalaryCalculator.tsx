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
import { Calculator, Download, Save } from "lucide-react";

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

    const supabase = createSupabaseClient();

    // 월이 바뀌거나 지점ID가 로드되면 저장된 데이터 불러오기
    useEffect(() => {
        if (filterInitialized && gymId && selectedMonth) {
            fetchSavedData();
        }
    }, [filterInitialized, gymId, selectedMonth]);

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
                        }
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
                    stats: r.stats
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

            const { data: schedules } = await supabase
                .from("schedules")
                .select("staff_id, schedule_type, counted_for_salary, status")
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
                
                // 스케줄 통계 계산 (설정이 없어도 통계는 계산 가능)
                const staffSchedules = schedules?.filter(s => s.staff_id === staff.id) || [];
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
                    stats: stats
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        💰 급여 정산
                        {isSaved && <Badge className="bg-green-600">저장됨</Badge>}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        설정된 템플릿과 근무 기록을 바탕으로 급여를 자동 계산합니다.
                        {lastUpdated && <span className="ml-2 text-xs text-gray-400"> (마지막 저장: {lastUpdated})</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[150px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({length: 12}, (_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                return <SelectItem key={v} value={v}>{v}</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                    <Button onClick={calculateSalaries} className="bg-[#2F80ED] hover:bg-[#1c6cd7]">
                        <Calculator className="w-4 h-4 mr-2" /> 급여 계산 실행
                    </Button>
                    <Button onClick={handleSaveSalaries} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={results.length === 0}>
                        <Save className="w-4 h-4 mr-2" /> 결과 저장
                    </Button>
                    <Button onClick={handleDownloadExcel} variant="outline" disabled={results.length === 0}>
                        <Download className="w-4 h-4 mr-2" /> 엑셀
                    </Button>
                </div>
            </div>

            {/* 매출 입력 */}
            <Card>
                <CardHeader className="flex flex-row justify-between items-center py-4">
                    <CardTitle className="text-sm font-bold text-gray-600">월 매출 입력 (개인 매출)</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleSaveSales} className="h-8">
                        매출 데이터 저장
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {results.length === 0 && Object.keys(salesData).length === 0 && (
                            <div className="text-sm text-gray-400 col-span-4">
                                저장된 데이터가 없습니다. '급여 계산 실행'을 눌러 직원 목록을 불러오세요.
                            </div>
                        )}
                        {(results.length > 0 ? results : Object.keys(salesData).map(id => ({ staff_id: id, staff_name: "직원 " + id.substring(0,4) }))).map((item: any) => {
                             // results가 있으면 그걸 쓰고, 없으면 salesData 키(ID)만이라도.. 
                             // 하지만 results가 없으면 위에서 staffs를 로드하지 않으므로 이름 표시가 어렵다.
                             // 따라서 results가 있을 때만 렌더링하도록 단순화.
                             if (!item.staff_id) return null;
                             return (
                                <div key={item.staff_id} className="space-y-1">
                                    <label className="text-xs text-gray-500">{item.staff_name}</label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            placeholder="매출 입력"
                                            value={salesData[item.staff_id] || ""}
                                            onChange={(e) => setSalesData({...salesData, [item.staff_id]: Number(e.target.value)})}
                                            className="h-9 pr-8"
                                        />
                                        <span className="absolute right-2 top-2.5 text-xs text-gray-400">원</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* 결과 테이블 */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-bold">직원정보</TableHead>
                            <TableHead className="text-right font-bold text-gray-600">기본급</TableHead>
                            <TableHead className="text-right font-bold text-blue-600">수업료</TableHead>
                            <TableHead className="text-right font-bold text-orange-600">인센티브</TableHead>
                            <TableHead className="text-right font-bold text-black text-lg">실수령액 (예상)</TableHead>
                            <TableHead className="text-center font-bold">상세내역</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">계산 중...</TableCell>
                            </TableRow>
                        ) : results.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                    '급여 계산 실행' 버튼을 눌러주세요.
                                </TableCell>
                            </TableRow>
                        ) : results.map((result) => (
                            <TableRow key={result.staff_id} className="hover:bg-gray-50">
                                <TableCell>
                                    <div className="font-bold text-gray-800">{result.staff_name}</div>
                                    <div className="text-xs text-gray-500">{result.job_position}</div>
                                    <div className="text-xs text-blue-500 mt-1">
                                        PT {result.stats.pt_total_count}회
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{result.base_salary.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-medium text-blue-600">
                                    {result.class_salary.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-medium text-orange-600">
                                    {result.incentive_salary.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-black text-lg">
                                    {result.total_salary.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs space-y-1 max-w-[300px] mx-auto text-gray-600">
                                        {result.details.map((detail, idx) => (
                                            <div key={idx} className="flex justify-between border-b border-gray-100 pb-0.5 last:border-0">
                                                <span>{detail.rule_name}</span>
                                                <span>{detail.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}