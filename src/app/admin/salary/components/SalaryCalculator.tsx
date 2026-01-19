"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { calculateMonthlyStats } from "@/lib/schedule-utils";
import { Calculator, Download, Save, AlertTriangle, CheckCircle, ExternalLink, Settings, Info, Plus, BarChart3 } from "lucide-react";
import Link from "next/link";

// 타입 정의
type StaffSalaryResult = {
    staff_id: string;
    staff_name: string;
    job_position?: string;
    base_salary: number; // 기본급 합계
    incentive_salary: number; // 인센티브 합계
    class_salary: number; // 수업료 합계
    tax_deduction: number; // 세금 공제 합계 (음수로 저장)
    total_salary: number; // 세전 총 급여
    net_salary: number; // 세후 실수령액 (total_salary - tax_deduction)
    details: {
        rule_name: string;
        amount: number;
        calculation: string; // "50회 x 20,000원" 등 설명
        isDeduction?: boolean; // 공제 항목 여부
    }[];
    stats: any; // 근무 통계
    reportStatus: 'approved' | 'submitted' | 'rejected' | 'none'; // 보고서 승인 상태
};

type SalaryTemplate = {
    id: string;
    name: string;
    items: { rule: { id: string; name: string; calculation_type: string; default_parameters: any } }[];
};

type StaffSalarySetting = {
    staff_id: string;
    template_id: string | null;
    template_name?: string;
    personal_parameters: any;
};

// 직원별 실적 통계 타입
type StaffStats = {
    staff_id: string;
    staff_name: string;
    job_position?: string;
    pt_total_count: number;
    pt_inside_count: number;
    pt_outside_count: number;
    pt_weekend_count: number;
    pt_holiday_count: number;
    ot_count: number;
    ot_inbody_count: number;
    personal_inside_count: number;
    personal_outside_count: number;
    reserved_pt_count: number;
    reserved_ot_count: number;
    cancelled_pt_count: number;
    reportStatus: 'approved' | 'submitted' | 'rejected' | 'none';
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

    // 월별 총 매출 상태
    const [monthlyTotalSales, setMonthlyTotalSales] = useState<number>(0);
    const [monthlySalesByTrainer, setMonthlySalesByTrainer] = useState<Record<string, number>>({});

    // 직원별 실적 통계 상태
    const [staffStats, setStaffStats] = useState<StaffStats[]>([]);
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    // 급여 설정 모달 상태
    const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
    const [selectedStaffForSetting, setSelectedStaffForSetting] = useState<StaffSalaryResult | null>(null);
    const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [personalParams, setPersonalParams] = useState<any>({});
    const [staffSalarySettings, setStaffSalarySettings] = useState<Record<string, StaffSalarySetting>>({});
    const [calcAmount, setCalcAmount] = useState("");
    const [calcRate, setCalcRate] = useState("");

    const supabase = createSupabaseClient();

    // 월이 바뀌거나 지점ID가 로드되면 데이터 불러오기 및 자동 정산
    useEffect(() => {
        const initializeData = async () => {
            if (filterInitialized && gymId && selectedMonth) {
                const hasSavedData = await fetchSavedData();
                await checkReportApprovalStatus();
                await fetchMonthlySales(); // 월별 매출 조회
                await fetchStaffStats(); // 직원별 실적 통계 조회
                const { loadedTemplates, loadedSettings } = await fetchTemplatesAndSettings();
                // 저장된 데이터가 없으면 자동으로 정산 실행 (로드된 데이터 직접 전달)
                if (!hasSavedData) {
                    calculateSalaries(loadedTemplates, loadedSettings);
                }
            }
        };
        initializeData();
    }, [filterInitialized, gymId, selectedMonth]);

    // 월별 PT 매출 조회 (등록자별)
    const fetchMonthlySales = async () => {
        if (!gymId || !selectedMonth) return;

        try {
            // 선택된 월의 시작일과 종료일 계산
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = `${selectedMonth}-01`;
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;

            // 1. 직원 목록 조회 (이름 → ID 매핑용)
            const { data: staffList } = await supabase
                .from("staffs")
                .select("id, name")
                .eq("gym_id", gymId);

            const staffNameToId: Record<string, string> = {};
            (staffList || []).forEach((s: any) => {
                if (s.name) staffNameToId[s.name] = s.id;
            });

            // 2. PT 매출만 조회 (membership_category = 'PT', 등록자별)
            const { data: payments, error } = await supabase
                .from("member_payments")
                .select("amount, registrar, membership_category")
                .eq("gym_id", gymId)
                .eq("membership_category", "PT")
                .gte("created_at", `${startDate}T00:00:00`)
                .lt("created_at", `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`);

            if (error) {
                console.error("[SalaryCalculator] 월별 PT 매출 조회 오류:", error);
                return;
            }

            // 3. 등록자별 PT 매출 집계
            let totalPTSales = 0;
            const salesByRegistrar: Record<string, number> = {}; // 이름 기준
            const salesByStaffId: Record<string, number> = {}; // staff_id 기준

            (payments || []).forEach((p: any) => {
                const amount = Number(p.amount) || 0;
                totalPTSales += amount;

                // 등록자(이름)별 매출 집계
                const registrarName = p.registrar?.trim();
                if (registrarName) {
                    salesByRegistrar[registrarName] = (salesByRegistrar[registrarName] || 0) + amount;

                    // 이름으로 staff_id 찾아서 매핑
                    const staffId = staffNameToId[registrarName];
                    if (staffId) {
                        salesByStaffId[staffId] = (salesByStaffId[staffId] || 0) + amount;
                    }
                }
            });

            setMonthlyTotalSales(totalPTSales);
            setMonthlySalesByTrainer(salesByStaffId);
            // 개인 매출 데이터로 salesData 업데이트 (staff_id 기준)
            setSalesData(prev => ({ ...prev, ...salesByStaffId }));

        } catch (error) {
            console.error("[SalaryCalculator] 월별 PT 매출 조회 오류:", error);
        }
    };

    // 직원별 월별 실적 통계 조회
    const fetchStaffStats = async () => {
        if (!gymId) return;

        setIsStatsLoading(true);
        try {
            // 선택된 월의 시작일과 종료일
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            // 1. 해당 지점의 모든 직원 조회
            const { data: allStaffs, error: staffError } = await supabase
                .from("staffs")
                .select("id, name, job_title")
                .eq("gym_id", gymId);

            if (staffError) throw new Error(staffError.message || "직원 조회 실패");

            // 2. 보고서 승인 상태 조회
            const { data: reports } = await supabase
                .from("monthly_schedule_reports")
                .select("staff_id, status")
                .eq("gym_id", gymId)
                .eq("year_month", selectedMonth);

            const reportStatusMap: Record<string, 'approved' | 'submitted' | 'rejected' | 'none'> = {};
            reports?.forEach(r => {
                reportStatusMap[r.staff_id] = r.status as 'approved' | 'submitted' | 'rejected';
            });

            // 3. 해당 월의 모든 스케줄 조회
            const { data: schedules, error: schedulesError } = await supabase
                .from("schedules")
                .select("id, staff_id, type, schedule_type, status, inbody_checked")
                .eq("gym_id", gymId)
                .gte("start_time", startDate.toISOString())
                .lte("start_time", endDate.toISOString());

            if (schedulesError) throw new Error(schedulesError.message || "스케줄 조회 실패");

            // 4. 각 직원별 통계 계산
            const stats: StaffStats[] = (allStaffs || []).map((staff) => {
                const staffSchedules = schedules?.filter(s => s.staff_id === staff.id) || [];
                const staffReportStatus = reportStatusMap[staff.id] || 'none';

                // completed, no_show_deducted 상태만 카운트
                const countedSchedules = staffSchedules.filter(
                    s => s.status === "completed" || s.status === "no_show_deducted"
                );

                // 미처리 (예약 상태)
                const reservedSchedules = staffSchedules.filter(s => s.status === "reserved");

                // 서비스/취소/노쇼
                const cancelledSchedules = staffSchedules.filter(
                    s => s.status === "service" || s.status === "cancelled" || s.status === "no_show"
                );

                // PT 통계
                const pt_inside_count = countedSchedules.filter(
                    s => s.type === "PT" && (!s.schedule_type || s.schedule_type === "inside")
                ).length;
                const pt_outside_count = countedSchedules.filter(
                    s => s.type === "PT" && s.schedule_type === "outside"
                ).length;
                const pt_weekend_count = countedSchedules.filter(
                    s => s.type === "PT" && (s.schedule_type === "weekend" || s.schedule_type === "holiday")
                ).length;
                const pt_total_count = pt_inside_count + pt_outside_count + pt_weekend_count;

                // OT 통계
                const ot_count = countedSchedules.filter(s => s.type === "OT" && !s.inbody_checked).length;
                const ot_inbody_count = countedSchedules.filter(s => s.type === "OT" && s.inbody_checked).length;

                // 개인일정 통계
                const personal_inside_count = countedSchedules.filter(
                    s => s.type === "Personal" && s.schedule_type === "inside"
                ).length;
                const personal_outside_count = countedSchedules.filter(
                    s => s.type === "Personal" && s.schedule_type === "outside"
                ).length;

                // 미처리 통계
                const reserved_pt_count = reservedSchedules.filter(s => s.type === "PT").length;
                const reserved_ot_count = reservedSchedules.filter(s => s.type === "OT").length;

                // 서비스/취소/노쇼 통계
                const cancelled_pt_count = cancelledSchedules.filter(s => s.type === "PT").length;

                return {
                    staff_id: staff.id,
                    staff_name: staff.name,
                    job_position: staff.job_title,
                    reportStatus: staffReportStatus,
                    pt_total_count,
                    pt_inside_count,
                    pt_outside_count,
                    pt_weekend_count,
                    pt_holiday_count: 0,
                    ot_count,
                    ot_inbody_count,
                    personal_inside_count,
                    personal_outside_count,
                    reserved_pt_count,
                    reserved_ot_count,
                    cancelled_pt_count,
                };
            });

            // 총 횟수 기준 내림차순 정렬
            stats.sort((a, b) => b.pt_total_count - a.pt_total_count);
            setStaffStats(stats);
        } catch (error: any) {
            console.error("[SalaryCalculator] 월별 실적 조회 오류:", error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    // 템플릿 및 급여 설정 조회
    const fetchTemplatesAndSettings = async (): Promise<{ loadedTemplates: SalaryTemplate[], loadedSettings: Record<string, StaffSalarySetting> }> => {
        if (!gymId) return { loadedTemplates: [], loadedSettings: {} };

        try {
            // 1. 템플릿 기본 정보 조회
            const { data: basicTemplates, error: tmplError } = await supabase
                .from("salary_templates")
                .select("*")
                .eq("gym_id", gymId);

            if (tmplError) {
                setTemplates([]);
                return { loadedTemplates: [], loadedSettings: {} };
            }

            // 2. 템플릿 항목 조회 (template_items와 rules)
            const templateIds = (basicTemplates || []).map(t => t.id);
            let itemsData: any[] = [];
            let rulesData: any[] = [];

            if (templateIds.length > 0) {
                // salary_template_items 조회
                const { data: items } = await supabase
                    .from("salary_template_items")
                    .select("*")
                    .in("template_id", templateIds);
                itemsData = items || [];

                // salary_rules 조회
                const ruleIds = itemsData.map(i => i.rule_id).filter(Boolean);
                if (ruleIds.length > 0) {
                    const { data: rules } = await supabase
                        .from("salary_rules")
                        .select("*")
                        .in("id", ruleIds);
                    rulesData = rules || [];
                }
            }

            // 3. 템플릿 데이터 구성 (수동 조인)
            const templatesData: SalaryTemplate[] = (basicTemplates || []).map(tmpl => {
                const tmplItems = itemsData.filter(i => i.template_id === tmpl.id);
                const itemsWithRules = tmplItems.map(item => {
                    const rule = rulesData.find(r => r.id === item.rule_id);
                    return { rule };
                }).filter(i => i.rule);

                return {
                    id: tmpl.id,
                    name: tmpl.name,
                    items: itemsWithRules
                };
            });

            setTemplates(templatesData);

            // 4. 직원별 급여 설정 조회
            const { data: settingsData, error: settingsError } = await supabase
                .from("staff_salary_settings")
                .select("staff_id, template_id, personal_parameters");

            if (settingsError) {
                return { loadedTemplates: templatesData, loadedSettings: {} };
            }

            const settingsMap: Record<string, StaffSalarySetting> = {};
            (settingsData || []).forEach((s: any) => {
                const tmpl = templatesData.find(t => t.id === s.template_id);
                settingsMap[s.staff_id] = {
                    staff_id: s.staff_id,
                    template_id: s.template_id,
                    template_name: tmpl?.name,
                    personal_parameters: s.personal_parameters || {}
                };
            });

            setStaffSalarySettings(settingsMap);

            return { loadedTemplates: templatesData, loadedSettings: settingsMap };

        } catch (error) {
            console.error("[SalaryCalculator] 템플릿/설정 조회 실패:", error);
            return { loadedTemplates: [], loadedSettings: {} };
        }
    };

    // 급여 설정 모달 열기
    const handleOpenSettingModal = (staff: StaffSalaryResult) => {
        setSelectedStaffForSetting(staff);
        const setting = staffSalarySettings[staff.staff_id];
        if (setting && setting.template_id) {
            setSelectedTemplateId(setting.template_id);

            // 템플릿의 default_parameters와 저장된 personal_parameters 병합
            const template = templates.find(t => t.id === setting.template_id);
            if (template && template.items) {
                const mergedParams: Record<string, any> = {};
                template.items.forEach(({ rule }) => {
                    // 템플릿 기본값을 먼저 설정
                    mergedParams[rule.id] = { ...rule.default_parameters };
                    // 저장된 개인 설정이 있으면 덮어쓰기
                    if (setting.personal_parameters && setting.personal_parameters[rule.id]) {
                        mergedParams[rule.id] = { ...mergedParams[rule.id], ...setting.personal_parameters[rule.id] };
                    }
                });
                setPersonalParams(mergedParams);
            } else {
                setPersonalParams(setting.personal_parameters || {});
            }
        } else {
            setSelectedTemplateId("");
            setPersonalParams({});
        }
        setIsSettingModalOpen(true);
    };

    // 템플릿 변경
    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);

        // 선택한 템플릿의 기본값으로 personalParams 초기화
        const template = templates.find(t => t.id === templateId);
        if (template && template.items) {
            const defaultParams: Record<string, any> = {};
            template.items.forEach(({ rule }) => {
                if (rule.default_parameters) {
                    defaultParams[rule.id] = { ...rule.default_parameters };
                }
            });
            setPersonalParams(defaultParams);
        } else {
            setPersonalParams({});
        }
    };

    // 파라미터 변경
    const handleParamChange = (ruleId: string, key: string, value: any) => {
        if (key === 'tiers') {
            setPersonalParams((prev: any) => ({
                ...prev,
                [ruleId]: { ...prev[ruleId], [key]: value }
            }));
            return;
        }

        let finalValue = value;
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== "") {
            finalValue = Number(value);
        }

        setPersonalParams((prev: any) => ({
            ...prev,
            [ruleId]: { ...prev[ruleId], [key]: finalValue }
        }));
    };

    // 급여 설정 저장
    const handleSaveSalarySetting = async () => {
        if (!selectedStaffForSetting) return;

        try {
            const { error: checkError } = await supabase
                .from("staff_salary_settings")
                .select("id")
                .limit(1);

            if (checkError) {
                toast.error("급여 설정 테이블이 없습니다. 관리자에게 문의하세요.");
                return;
            }

            const { data: existing } = await supabase
                .from("staff_salary_settings")
                .select("id")
                .eq("staff_id", selectedStaffForSetting.staff_id)
                .single();

            if (existing) {
                const { error: updateError } = await supabase.from("staff_salary_settings").update({
                    template_id: selectedTemplateId || null,
                    personal_parameters: personalParams,
                    valid_from: new Date().toISOString()
                }).eq("id", existing.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from("staff_salary_settings").insert({
                    staff_id: selectedStaffForSetting.staff_id,
                    template_id: selectedTemplateId || null,
                    personal_parameters: personalParams,
                    valid_from: new Date().toISOString()
                });

                if (insertError) throw insertError;
            }

            setIsSettingModalOpen(false);
            await fetchTemplatesAndSettings();
            toast.success("급여 설정이 저장되었습니다.");
            // 설정 후 재정산
            calculateSalaries();
        } catch (error: unknown) {
            console.error("저장 실패:", error);
            const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
            toast.error(`저장 실패: ${errorMessage}`);
        }
    };

    // 그룹핑 함수 - calculation_type 기반으로 분류
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    const groupedRules = {
        basic: [] as any[],      // 기본급, 지원금, 시급, 기타
        class: [] as any[],      // 수업료
        incentive: [] as any[],  // 매출인센티브, 개인인센티브, 상금
        deduction: [] as any[],  // 세금 공제
        others: [] as any[]
    };

    if (currentTemplate) {
        currentTemplate.items.forEach(({ rule }) => {
            const type = rule.calculation_type;
            // 기본급, 지원금, 시급, 기타 → basic 그룹
            if (['base_salary', 'allowance', 'hourly', 'etc', 'fixed'].includes(type)) {
                groupedRules.basic.push(rule);
            // 수업료 → class 그룹
            } else if (type === 'class_fee') {
                groupedRules.class.push(rule);
            // 매출인센티브, 개인인센티브, 상금 → incentive 그룹
            } else if (['sales_incentive', 'personal_incentive', 'bonus', 'percentage_total', 'percentage_personal'].includes(type)) {
                groupedRules.incentive.push(rule);
            // 세금 공제 → deduction 그룹
            } else if (type === 'tax_deduction') {
                groupedRules.deduction.push(rule);
            } else {
                groupedRules.others.push(rule);
            }
        });
    }

    const calculatedIncentive = (parseFloat(calcAmount || "0") * (parseFloat(calcRate || "0") / 100)).toLocaleString();

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

            // 제출된 보고서 수 (submitted + approved 상태)
            const submittedCount = (reports || []).filter(r => r.status === 'submitted' || r.status === 'approved').length;
            const approvedCount = (reports || []).filter(r => r.status === 'approved').length;

            setReportApprovalStatus({
                hasReports: submittedCount > 0,
                allApproved: submittedCount > 0 && approvedCount === submittedCount,
                approvedCount,
                totalCount: submittedCount, // 제출된 보고서 수로 변경
                staffStatuses
            });
        } catch (error) {
            console.error("보고서 상태 확인 실패:", error);
        }
    };

    const fetchSavedData = async (): Promise<boolean> => {
        if (!gymId) return false;
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
                    // 이전 버전 호환성: tax_deduction, net_salary가 없는 경우
                    const taxDeduction = breakdown.tax_deduction || 0;
                    const totalSalary = breakdown.total_salary || s.total_amount || 0;
                    const netSalary = breakdown.net_salary || (totalSalary - taxDeduction);
                    return {
                        staff_id: s.staff_id,
                        staff_name: s.staff?.name || "알 수 없음",
                        job_position: s.staff?.job_title,
                        base_salary: breakdown.base_salary || 0,
                        incentive_salary: breakdown.incentive_salary || 0,
                        class_salary: breakdown.class_salary || 0,
                        tax_deduction: taxDeduction,
                        total_salary: totalSalary,
                        net_salary: netSalary,
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
                return true; // 저장된 데이터 있음
            } else {
                setResults([]);
                setIsSaved(false);
                setLastUpdated(null);
                return false; // 저장된 데이터 없음
            }

        } catch (e) {
            console.error("데이터 로딩 실패", e);
            return false;
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

            if (updates.length === 0) {
                toast.warning("저장할 매출 데이터가 없습니다.");
                return;
            }

            // upsert
            const { error } = await supabase
                .from("monthly_performance")
                .upsert(updates, { onConflict: 'staff_id, year_month' });

            if (error) {
                console.error("[SalaryCalculator] 매출 저장 에러:", error);
                if (error.code === '42P01') {
                    toast.error("monthly_performance 테이블이 없습니다. DB 마이그레이션을 확인해주세요.");
                } else {
                    toast.error(`매출 저장 실패: ${error.message || JSON.stringify(error)}`);
                }
                return;
            }
            toast.success("매출 데이터가 저장되었습니다.");
        } catch (e: unknown) {
            console.error("[SalaryCalculator] 매출 저장 예외:", e);
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
                total_amount: r.net_salary, // 실수령액으로 저장
                breakdown: {
                    base_salary: r.base_salary,
                    class_salary: r.class_salary,
                    incentive_salary: r.incentive_salary,
                    tax_deduction: r.tax_deduction,
                    total_salary: r.total_salary, // 세전 총액
                    net_salary: r.net_salary, // 세후 실수령액
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

    const calculateSalaries = async (
        passedTemplates?: SalaryTemplate[],
        passedSettings?: Record<string, StaffSalarySetting>
    ) => {
        if (!gymId) return;
        setIsLoading(true);

        // 전달된 데이터가 있으면 사용, 없으면 상태에서 가져옴
        const templatesData = passedTemplates || templates;
        const settingsData = passedSettings || staffSalarySettings;

        try {
            // 1. 필요한 데이터 모두 조회
            // 1-1. 직원 조회 (급여 설정은 별도 조회 - 테이블이 없을 수 있음)
            const { data: staffs, error: staffError } = await supabase
                .from("staffs")
                .select("id, name, job_title, role")
                .eq("gym_id", gymId)
                .neq("role", "admin");

            if (staffError) {
                console.error("[SalaryCalculator] 직원 조회 에러:", staffError);
            }

            // 1-2. 해당 월의 승인된 보고서 직접 조회
            const { data: approvedReports, error: reportError } = await supabase
                .from("monthly_schedule_reports")
                .select("staff_id, status, year_month")
                .eq("gym_id", gymId)
                .eq("year_month", selectedMonth)
                .eq("status", "approved");

            const approvedStaffIds = new Set(approvedReports?.map(r => r.staff_id) || []);

            // 1-3. 해당 월 스케줄 조회 (통계용)
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const { data: schedules } = await supabase
                .from("schedules")
                .select("staff_id, schedule_type, counted_for_salary, status, is_locked")
                .eq("gym_id", gymId)
                .gte("start_time", startDate.toISOString())
                .lte("start_time", endDate.toISOString());

            // 2. 직원별 급여 계산
            const calculatedResults: StaffSalaryResult[] = [];
            const staffList = staffs || [];

            for (const staff of staffList) {
                // 승인된 직원만 정산 대상 (직접 조회한 데이터 사용)
                const isApproved = approvedStaffIds.has(staff.id);
                if (!isApproved) {
                    continue;
                }

                // 승인된 직원: is_locked=true인 스케줄만 집계
                const staffSchedules = schedules?.filter(s => {
                    if (s.staff_id !== staff.id) return false;
                    return s.is_locked === true;
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
                    tax_deduction: 0,
                    total_salary: 0,
                    net_salary: 0,
                    details: [],
                    stats: stats,
                    reportStatus: 'approved'
                };

                // 직원의 급여 설정 및 템플릿 조회 (전달된 데이터 사용)
                const setting = settingsData[staff.id];
                const template = setting ? templatesData.find(t => t.id === setting.template_id) : null;
                const hasSalarySettings = template && template.items && template.items.length > 0;

                if (hasSalarySettings && template) {
                    // 규칙 적용
                    const rules = template.items.map((i: any) => i.rule).filter(Boolean);
                    const params = setting.personal_parameters || {};

                    for (const rule of rules) {
                        const ruleParams = {
                            ...rule.default_parameters,
                            ...(params[rule.id] || {})
                        };

                        let amount = 0;
                        let desc = "";

                        // 계산 로직 - 새로운 계산 타입 지원
                        if (rule.calculation_type === 'base_salary' || rule.calculation_type === 'fixed') {
                            // 기본급: 고정 금액
                            amount = Number(ruleParams.amount || 0);
                            desc = "기본급";
                            result.base_salary += amount;
                        }
                        else if (rule.calculation_type === 'allowance') {
                            // 지원금: 고정 금액 (영업지원금, 직책수당 등)
                            amount = Number(ruleParams.amount || 0);
                            desc = "지원금";
                            result.base_salary += amount;
                        }
                        else if (rule.calculation_type === 'hourly') {
                            // 시급제: 알바, 청소이모 등 시급 근무자용
                            const rate = Number(ruleParams.rate || 0);
                            amount = rate;
                            desc = `시급 ${rate.toLocaleString()}원`;
                            result.base_salary += amount;
                        }
                        else if (rule.calculation_type === 'class_fee') {
                            // 수업료: PT 세션 횟수 × 단가
                            const rate = Number(ruleParams.rate || 0);
                            let count = 0;

                            if (rule.name.includes("근무내") || rule.name.includes("PT IN")) count = stats.pt_inside_count;
                            else if (rule.name.includes("근무외") || rule.name.includes("PT OUT")) count = stats.pt_outside_count;
                            else if (rule.name.includes("주말")) count = stats.pt_weekend_count;
                            else if (rule.name.includes("공휴일")) count = stats.pt_holiday_count;
                            else if (rule.name.includes("BC") || rule.name.includes("바디챌린지")) count = stats.bc_count || 0;
                            else count = stats.pt_total_count;

                            amount = count * rate;
                            desc = `${count}회 x ${rate.toLocaleString()}원`;
                            result.class_salary += amount;
                        }
                        else if (rule.calculation_type === 'sales_incentive' || rule.calculation_type === 'percentage_total') {
                            // 매출인센티브: 개인 PT 매출의 %
                            const rate = Number(ruleParams.rate || 0);
                            const targetSales = personalSales; // 개인 PT 매출 사용
                            amount = targetSales * (rate / 100);
                            desc = `PT매출 ${targetSales.toLocaleString()}원의 ${rate}%`;
                            result.incentive_salary += amount;
                        }
                        else if (rule.calculation_type === 'personal_incentive' || rule.calculation_type === 'percentage_personal') {
                            // 개인인센티브: 개인 PT 매출의 %
                            const rate = Number(ruleParams.rate || 0);
                            const targetSales = personalSales; // 개인 PT 매출 사용
                            amount = targetSales * (rate / 100);
                            desc = `PT매출 ${targetSales.toLocaleString()}원의 ${rate}%`;
                            result.incentive_salary += amount;
                        }
                        else if (rule.calculation_type === 'bonus') {
                            // 상금: 고정 금액 (A클래스 상금, 바디챌린지 상금 등)
                            amount = Number(ruleParams.amount || 0);
                            desc = "상금";
                            result.incentive_salary += amount;
                        }
                        else if (rule.calculation_type === 'etc') {
                            // 기타: 고정 금액 (식대 등)
                            amount = Number(ruleParams.amount || 0);
                            desc = "기타";
                            result.base_salary += amount;
                        }

                        // 세금 공제는 나중에 처리 (total_salary 계산 후)
                        if (rule.calculation_type !== 'tax_deduction') {
                            if (amount > 0) {
                                result.details.push({
                                    rule_name: rule.name,
                                    amount: amount,
                                    calculation: desc
                                });
                                result.total_salary += amount;
                            }
                        }
                    }

                    // 세금 공제 계산 (총 급여 계산 후)
                    for (const rule of rules) {
                        if (rule.calculation_type === 'tax_deduction') {
                            const ruleParams = {
                                ...rule.default_parameters,
                                ...(params[rule.id] || {})
                            };
                            const rate = Number(ruleParams.rate || 0);
                            const deductionAmount = Math.round(result.total_salary * (rate / 100));

                            if (deductionAmount > 0) {
                                result.tax_deduction += deductionAmount;
                                result.details.push({
                                    rule_name: rule.name,
                                    amount: -deductionAmount,
                                    calculation: `${result.total_salary.toLocaleString()}원의 ${rate}%`,
                                    isDeduction: true
                                });
                            }
                        }
                    }

                    // 실수령액 계산
                    result.net_salary = result.total_salary - result.tax_deduction;
                } else {
                    // 템플릿 미설정 - "설정 없음" 추가
                    result.details.push({
                        rule_name: "설정 없음",
                        amount: 0,
                        calculation: "급여 템플릿 미설정"
                    });
                }

                calculatedResults.push(result);
            }

            setResults(calculatedResults);
            setIsSaved(false); // 재계산했으므로 저장되지 않은 상태로 변경 (사용자가 저장 버튼을 눌러야 함)

            if (calculatedResults.length === 0 && approvedStaffIds.size > 0) {
                console.warn("[SalaryCalculator] 승인된 보고서는 있지만 결과가 0명 - 직원 ID 매칭 문제 가능성");
            }

        } catch (error) {
            console.error("[SalaryCalculator] 계산 중 에러:", error);
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
            ["직원명", "직책", "기본급", "수업료", "인센티브", "세전 합계", "공제액", "실수령액", "세부 내역"],
            ...results.map(r => [
                r.staff_name,
                r.job_position,
                r.base_salary,
                r.class_salary,
                r.incentive_salary,
                r.total_salary,
                r.tax_deduction,
                r.net_salary,
                r.details.map(d => `${d.rule_name}: ${d.amount.toLocaleString()}원`).join(", ")
            ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "급여대장");
        XLSX.writeFile(wb, `${gymName}_${selectedMonth}_급여대장.xlsx`);
    };

    return (
        <div className="space-y-4 xs:space-y-6 lg:space-y-8 animate-in fade-in duration-500">

            {/* 월간 급여 정산 컨트롤 */}
            <div className="flex flex-col gap-3 xs:gap-4 bg-white p-3 xs:p-4 sm:p-6 rounded-xl xs:rounded-2xl sm:rounded-[32px] border border-gray-100 shadow-sm">
                {/* 헤더: 타이틀 + 월 선택 */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-2 xs:gap-3">
                        <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-lg xs:rounded-xl flex items-center justify-center shrink-0">
                            <Calculator className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">월간 급여 정산</h3>
                                {isSaved && <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] xs:text-[10px] tracking-widest px-1.5 xs:px-2 py-0.5 rounded-md xs:rounded-lg shadow-sm">FINALIZED</Badge>}
                            </div>
                            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 xs:gap-2 mt-0.5">
                                <p className="text-[10px] xs:text-xs text-slate-400 font-bold">
                                    템플릿과 실적 기반 최종 지급액 산출
                                </p>
                                {lastUpdated && <span className="text-[8px] xs:text-[9px] font-black text-slate-300 uppercase tracking-wider bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">Last: {lastUpdated}</span>}
                            </div>
                        </div>
                    </div>
                    {/* 월 선택기 */}
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[140px] h-10 xs:h-11 bg-slate-50 border-none rounded-xl xs:rounded-2xl font-black text-slate-900 text-xs xs:text-sm focus:ring-2 focus:ring-blue-100 transition-all">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl xs:rounded-2xl border-none shadow-2xl p-1 xs:p-2">
                            {Array.from({length: 12}, (_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                return <SelectItem key={v} value={v} className="rounded-lg xs:rounded-xl font-bold py-2 xs:py-3 text-xs xs:text-sm">{v}</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* 보고서 승인 상태 배너 */}
                {reportApprovalStatus.totalCount > 0 && (
                    <div className="animate-in slide-in-from-top-4 duration-500">
                        {reportApprovalStatus.allApproved ? (
                            <div className="flex items-center gap-2 xs:gap-3 bg-emerald-50 border border-emerald-100 px-3 py-2 xs:py-2.5 rounded-lg xs:rounded-xl">
                                <div className="w-6 h-6 xs:w-7 xs:h-7 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                                    <CheckCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-black text-emerald-800 text-[10px] xs:text-xs">
                                        {selectedMonth}월 모든 직원 보고서 승인됨 · 정산 가능
                                    </span>
                                </div>
                                <Link href="/admin/reports" className="shrink-0">
                                    <Button variant="ghost" size="sm" className="h-6 xs:h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg font-black text-[9px] xs:text-[10px] flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        보기
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 xs:gap-3 bg-amber-50 border border-amber-100 px-3 py-2 xs:py-2.5 rounded-lg xs:rounded-xl">
                                <div className="w-6 h-6 xs:w-7 xs:h-7 bg-amber-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
                                    <AlertTriangle className="h-3 w-3 xs:h-3.5 xs:w-3.5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-black text-amber-800 text-[10px] xs:text-xs">
                                        승인 대기 · 제출 {reportApprovalStatus.totalCount}건 중 <span className="text-amber-900">{reportApprovalStatus.approvedCount}</span>건 승인
                                    </span>
                                </div>
                                <Link href="/admin/reports" className="shrink-0">
                                    <Button size="sm" className="h-6 xs:h-7 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-black text-[9px] xs:text-[10px] shadow-sm shadow-amber-200 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        승인
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => calculateSalaries()}
                        className="h-9 xs:h-10 px-3 xs:px-4 bg-[#2F80ED] hover:bg-[#1c6cd7] text-white rounded-lg xs:rounded-xl font-black shadow-md shadow-blue-100 flex items-center gap-1.5 xs:gap-2 transition-all hover:-translate-y-0.5 text-[11px] xs:text-xs"
                    >
                        <Calculator className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
                        정산 실행
                    </Button>
                    <Button
                        onClick={handleSaveSalaries}
                        className="h-9 xs:h-10 px-3 xs:px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg xs:rounded-xl font-black shadow-md shadow-emerald-100 flex items-center gap-1.5 xs:gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 text-[11px] xs:text-xs"
                        disabled={results.length === 0}
                    >
                        <Save className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
                        결과 저장
                    </Button>
                    <Button
                        onClick={handleDownloadExcel}
                        variant="ghost"
                        className="h-9 xs:h-10 w-9 xs:w-10 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg xs:rounded-xl transition-all"
                        disabled={results.length === 0}
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* 급여 정산 결과 */}
            <div className="space-y-4 xs:space-y-6">
                    <div className="bg-white rounded-xl xs:rounded-2xl sm:rounded-[40px] border border-gray-100 shadow-xl shadow-slate-100/50 overflow-hidden h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-blue-100/30">
                        {/* 모바일 카드 뷰 */}
                        <div className="md:hidden">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 xs:py-20 animate-pulse">
                                    <Calculator className="w-10 h-10 xs:w-12 xs:h-12 text-blue-200 mb-3 xs:mb-4" />
                                    <p className="text-slate-400 font-black text-[10px] xs:text-xs uppercase tracking-widest">Calculating...</p>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 xs:py-16 px-4">
                                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-amber-50 rounded-xl xs:rounded-2xl flex items-center justify-center mb-4 xs:mb-6">
                                        <AlertTriangle className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-amber-400" />
                                    </div>
                                    <h4 className="text-sm xs:text-base sm:text-lg font-black text-slate-700 tracking-tight mb-1.5 xs:mb-2 text-center">승인된 보고서가 없습니다</h4>
                                    <p className="text-xs xs:text-sm font-bold text-slate-400 mb-4 xs:mb-6 text-center">
                                        급여 정산을 위해 먼저 직원 보고서를 승인해주세요.
                                    </p>
                                    <Link href="/admin/reports">
                                        <Button className="h-8 xs:h-9 sm:h-10 px-3 xs:px-4 sm:px-5 bg-[#2F80ED] hover:bg-[#1c6cd7] text-white rounded-lg xs:rounded-xl font-black text-[10px] xs:text-xs shadow-lg shadow-blue-100 flex items-center gap-1.5 xs:gap-2 transition-all">
                                            <ExternalLink className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                                            보고서 승인하러 가기
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {results.map((result) => (
                                        <div key={result.staff_id} className="p-3 xs:p-4 space-y-2 xs:space-y-3">
                                            {/* 직원 정보 + 실수령액 */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                                                        <span className="font-black text-slate-900 text-sm xs:text-base tracking-tighter">{result.staff_name}</span>
                                                        {result.total_salary === 0 && result.details.some(d => d.rule_name === "설정 없음") && (
                                                            <Badge className="bg-amber-50 text-amber-600 border border-amber-100 font-black text-[8px] xs:text-[9px] px-1 xs:px-1.5 py-0 rounded-md">
                                                                템플릿 미설정
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] xs:text-[10px] font-bold text-slate-400">
                                                        {result.job_position || "Staff"}
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="text-right shrink-0">
                                                        <div className="text-base xs:text-lg sm:text-xl font-black text-blue-600 tracking-tighter">
                                                            {result.net_salary.toLocaleString()}
                                                        </div>
                                                        <span className="text-[8px] xs:text-[10px] font-bold text-slate-300 uppercase">실수령액</span>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleOpenSettingModal(result)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all shrink-0"
                                                    >
                                                        <Settings className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* PT/OT/개인 실적 섹션 */}
                                            <div className="space-y-1.5">
                                                {/* PT */}
                                                <div className="bg-blue-50/50 rounded-lg px-2.5 py-1.5">
                                                    <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                                                        <span className="text-blue-600 font-black">PT</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span><span className="text-blue-600 font-bold">근무내</span> {result.stats.pt_inside_count}회</span>
                                                        <span className="text-slate-300">/</span>
                                                        <span><span className="text-orange-500 font-bold">근무외</span> {result.stats.pt_outside_count}회</span>
                                                        <span className="text-slate-300">/</span>
                                                        <span><span className="text-purple-600 font-bold">주말</span> {result.stats.pt_weekend_count}회</span>
                                                        <span className="text-slate-300">/</span>
                                                        <span><span className="text-slate-400 font-bold">서비스</span> {result.stats.cancelled_pt_count || 0}회</span>
                                                    </div>
                                                </div>
                                                {/* OT & 개인일정 */}
                                                <div className="flex gap-1.5">
                                                    <div className="flex-1 bg-teal-50/50 rounded-lg px-2.5 py-1.5">
                                                        <div className="flex items-center gap-1.5 text-[9px]">
                                                            <span className="text-teal-600 font-black">OT</span>
                                                            <span className="text-slate-300">|</span>
                                                            <span>OT {result.stats.ot_count || 0}회</span>
                                                            <span className="text-slate-300">/</span>
                                                            <span>인바디 {result.stats.ot_inbody_count || 0}회</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-indigo-50/50 rounded-lg px-2.5 py-1.5">
                                                        <div className="flex items-center gap-1.5 text-[9px]">
                                                            <span className="text-indigo-500 font-black">개인</span>
                                                            <span className="text-slate-300">|</span>
                                                            <span>내 {result.stats.personal_inside_count || 0}h</span>
                                                            <span className="text-slate-300">/</span>
                                                            <span>외 {result.stats.personal_outside_count || 0}h</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* PT 매출 */}
                                                <div className="bg-emerald-50/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                                                    <span className="text-emerald-600 font-black text-[9px]">PT 매출</span>
                                                    <span className="text-emerald-700 font-black text-xs">{(monthlySalesByTrainer[result.staff_id] || 0).toLocaleString()}원</span>
                                                </div>
                                            </div>

                                            {/* 급여 내역 */}
                                            <div className="grid grid-cols-4 gap-1 xs:gap-1.5 text-center">
                                                <div className="bg-slate-50 rounded-lg p-1.5 xs:p-2">
                                                    <p className="text-[7px] xs:text-[8px] font-black text-slate-400 mb-0.5">기본급</p>
                                                    <p className="text-[10px] xs:text-[11px] font-bold text-slate-600">{result.base_salary.toLocaleString()}<span className="text-[7px] ml-0.5">원</span></p>
                                                </div>
                                                <div className="bg-emerald-50 rounded-lg p-1.5 xs:p-2">
                                                    <p className="text-[7px] xs:text-[8px] font-black text-emerald-500 mb-0.5">수업료</p>
                                                    <p className="text-[10px] xs:text-[11px] font-bold text-emerald-600">{result.class_salary.toLocaleString()}<span className="text-[7px] ml-0.5">원</span></p>
                                                </div>
                                                <div className="bg-orange-50 rounded-lg p-1.5 xs:p-2">
                                                    <p className="text-[7px] xs:text-[8px] font-black text-orange-400 mb-0.5">인센티브</p>
                                                    <p className="text-[10px] xs:text-[11px] font-bold text-orange-500">{result.incentive_salary.toLocaleString()}<span className="text-[7px] ml-0.5">원</span></p>
                                                </div>
                                                <div className="bg-red-50 rounded-lg p-1.5 xs:p-2">
                                                    <p className="text-[7px] xs:text-[8px] font-black text-red-400 mb-0.5">공제</p>
                                                    <p className="text-[10px] xs:text-[11px] font-bold text-red-500">{result.tax_deduction > 0 ? `-${result.tax_deduction.toLocaleString()}원` : '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 데스크톱 테이블 뷰 */}
                        <div className="hidden md:block overflow-x-auto flex-1">
                            <Table className="border-collapse w-full">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 border-b border-gray-100 hover:bg-slate-50/80">
                                        <TableHead className="px-4 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">직원 정보</TableHead>
                                        <TableHead className="px-2 py-5 text-center text-xs font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">PT 세션</TableHead>
                                        <TableHead className="px-2 py-5 text-center text-xs font-black text-teal-600 uppercase tracking-widest whitespace-nowrap">OT 세션</TableHead>
                                        <TableHead className="px-2 py-5 text-center text-xs font-black text-indigo-500 uppercase tracking-widest whitespace-nowrap">개인 일정</TableHead>
                                        <TableHead className="px-4 py-5 text-center text-xs font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">PT 매출액</TableHead>
                                        <TableHead className="px-3 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">기본급</TableHead>
                                        <TableHead className="px-3 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">수업료</TableHead>
                                        <TableHead className="px-3 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">인센티브</TableHead>
                                        <TableHead className="px-3 py-5 text-center text-xs font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">공제액</TableHead>
                                        <TableHead className="px-6 py-5 text-center text-xs font-black text-[#2F80ED] uppercase tracking-widest whitespace-nowrap">실수령액 (예상)</TableHead>
                                        <TableHead className="px-2 py-5 w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="px-8 py-40 text-center">
                                                <div className="flex flex-col items-center justify-center animate-pulse">
                                                    <Calculator className="w-12 h-12 text-blue-200 mb-4" />
                                                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Calculating...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : results.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                                                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-700 tracking-tight mb-2">승인된 보고서가 없습니다</h4>
                                                    <p className="text-sm font-bold text-slate-400 mb-6">
                                                        급여 정산을 위해 먼저 직원 보고서를 승인해주세요.
                                                    </p>
                                                    <Link href="/admin/reports">
                                                        <Button className="h-10 px-5 bg-[#2F80ED] hover:bg-[#1c6cd7] text-white rounded-xl font-black text-xs shadow-lg shadow-blue-100 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                                            <ExternalLink className="w-4 h-4" />
                                                            보고서 승인하러 가기
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : results.map((result) => (
                                        <TableRow key={result.staff_id} className="group hover:bg-blue-50/40 transition-all duration-300 border-b border-slate-50">
                                            {/* 직원 정보 */}
                                            <TableCell className="px-4 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                        {result.staff_name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 text-sm tracking-tight">{result.staff_name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{result.job_position || "Staff"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* PT 섹션: 근무내/근무외/주말&휴일/서비스,취소,노쇼 */}
                                            {/* PT 섹션 */}
                                            <TableCell className="px-2 py-6 text-center">
                                                <div className="inline-flex flex-col gap-1 bg-blue-50/30 px-3 py-2 rounded-xl border border-blue-50 min-w-[120px]">
                                                    <div className="flex items-center justify-center gap-2 text-[10px]">
                                                        <span className="text-blue-600 font-black">내</span>
                                                        <span className="font-black text-slate-700">{result.stats.pt_inside_count}</span>
                                                        <span className="text-orange-500 font-black ml-1">외</span>
                                                        <span className="font-black text-slate-700">{result.stats.pt_outside_count}</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2 text-[10px]">
                                                        <span className="text-purple-600 font-black">주</span>
                                                        <span className="font-black text-slate-700">{result.stats.pt_weekend_count}</span>
                                                        <span className="text-slate-400 font-black ml-1">서</span>
                                                        <span className="font-black text-slate-500">{result.stats.cancelled_pt_count || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* OT 섹션: OT/인바디 */}
                                            {/* OT 섹션 */}
                                            <TableCell className="px-2 py-6 text-center">
                                                <div className="inline-flex flex-col gap-1 bg-teal-50/30 px-3 py-2 rounded-xl border border-teal-50 min-w-[80px]">
                                                    <div className="flex items-center justify-center gap-2 text-[10px]">
                                                        <span className="text-teal-600 font-black">OT</span>
                                                        <span className="font-black text-slate-700">{result.stats.ot_count || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2 text-[10px]">
                                                        <span className="text-teal-500 font-black">IB</span>
                                                        <span className="font-black text-slate-700">{result.stats.ot_inbody_count || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* 개인일정 섹션: 근무내/근무외 */}
                                            <TableCell className="px-2 py-6 text-center">
                                                <div className="inline-flex flex-col gap-1 bg-indigo-50/30 px-3 py-2 rounded-xl border border-indigo-50 min-w-[90px]">
                                                    <div className="flex items-center justify-center gap-2 text-[10px]">
                                                        <span className="text-indigo-500 font-black">내</span>
                                                        <span className="font-black text-slate-700">{result.stats.personal_inside_count || 0}h</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2 text-[10px]">
                                                        <span className="text-indigo-400 font-black">외</span>
                                                        <span className="font-black text-slate-700">{result.stats.personal_outside_count || 0}h</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* PT 매출 */}
                                            <TableCell className="px-4 py-6 text-center">
                                                <div className="text-sm font-black text-emerald-600">
                                                    {(monthlySalesByTrainer[result.staff_id] || 0).toLocaleString()}<span className="text-[10px] font-bold text-emerald-400 ml-0.5">원</span>
                                                </div>
                                            </TableCell>

                                            {/* 기본급 */}
                                            <TableCell className="px-2 py-6 text-center">
                                                <div className="inline-block px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 font-bold text-slate-500 text-sm min-w-[80px]">
                                                    {result.base_salary.toLocaleString()}
                                                </div>
                                            </TableCell>

                                            {/* 수업료 */}
                                            <TableCell className="px-2 py-6 text-center">
                                                <div className="inline-block px-3 py-1.5 bg-emerald-50/50 rounded-lg border border-emerald-100 font-bold text-emerald-600 text-sm min-w-[80px]">
                                                    {result.class_salary.toLocaleString()}
                                                </div>
                                            </TableCell>

                                            {/* 인센티브 */}
                                            <TableCell className="px-2 py-6 text-center">
                                                <div className="inline-block px-3 py-1.5 bg-orange-50/50 rounded-lg border border-orange-100 font-bold text-orange-500 text-sm min-w-[80px]">
                                                    {result.incentive_salary.toLocaleString()}
                                                </div>
                                            </TableCell>

                                            {/* 공제액 */}
                                            <TableCell className="px-2 py-6 text-center text-rose-500 font-bold text-sm">
                                                {result.tax_deduction > 0 ? `-${result.tax_deduction.toLocaleString()}` : '-'}
                                            </TableCell>

                                            {/* 실수령액 */}
                                            <TableCell className="px-6 py-6 text-center">
                                                <div className="text-base font-black text-slate-900 tracking-tighter group-hover:text-[#2F80ED] transition-colors">
                                                    {result.net_salary.toLocaleString()}
                                                    <span className="text-[9px] ml-1 opacity-30 font-bold uppercase tracking-widest">KRW</span>
                                                </div>
                                            </TableCell>

                                            {/* 설정 버튼 */}
                                            <TableCell className="px-2 py-6 text-center">
                                                <Button
                                                    onClick={() => handleOpenSettingModal(result)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                                >
                                                    <Settings className="w-4.5 h-4.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {results.length > 0 && (
                            <div className="p-3 xs:p-4 sm:p-6 lg:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-4">
                                <p className="text-[10px] xs:text-xs text-slate-400 font-bold leading-relaxed order-2 xs:order-1">
                                    세금 공제가 반영된 실수령액입니다.<br className="hidden xs:block" />
                                    <span className="xs:hidden"> </span>정산 확정 시 각 직원의 실적으로 반영됩니다.
                                </p>
                                <div className="space-y-0.5 xs:space-y-1 text-right order-1 xs:order-2 w-full xs:w-auto">
                                    <p className="text-[8px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Net Payroll (실수령 합계)</p>
                                    <div className="text-xl xs:text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                                        {results.reduce((acc, curr) => acc + curr.net_salary, 0).toLocaleString()}
                                        <span className="text-xs xs:text-sm sm:text-base ml-1 opacity-30 font-bold uppercase tracking-widest">KRW</span>
                                    </div>
                                    {results.reduce((acc, curr) => acc + curr.tax_deduction, 0) > 0 && (
                                        <div className="flex items-center justify-end gap-2 xs:gap-3 text-[10px] xs:text-xs font-bold text-slate-400 mt-1">
                                            <span>세전: {results.reduce((acc, curr) => acc + curr.total_salary, 0).toLocaleString()}원</span>
                                            <span className="text-red-500">공제: -{results.reduce((acc, curr) => acc + curr.tax_deduction, 0).toLocaleString()}원</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
            </div>

            {/* 급여 설정 모달 */}
            <Dialog open={isSettingModalOpen} onOpenChange={setIsSettingModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-none shadow-2xl p-0 rounded-[40px]">
                    <div className="p-6 xs:p-8 lg:p-12 space-y-6 xs:space-y-8 lg:space-y-10">
                        <DialogHeader>
                            <div className="flex items-center gap-3 xs:gap-4 mb-3 xs:mb-4">
                                <div className="w-12 h-12 xs:w-16 xs:h-16 rounded-xl xs:rounded-[24px] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <Calculator className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl xs:text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">급여 템플릿 적용</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold text-sm xs:text-base mt-1">
                                        <span className="text-blue-600">{selectedStaffForSetting?.staff_name}</span> / {selectedStaffForSetting?.job_position || "Staff"}
                                        <span className="block text-xs text-slate-400 mt-1">금액은 템플릿에서 설정됩니다. 수정하려면 템플릿 설계 탭에서 변경하세요.</span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 xs:space-y-8 lg:space-y-10">
                            {/* 템플릿 선택 */}
                            <div className="space-y-3 xs:space-y-4 bg-slate-50 p-4 xs:p-6 lg:p-8 rounded-xl xs:rounded-2xl lg:rounded-[32px] border border-slate-100">
                                <Label className="text-[10px] xs:text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                    Step 01. 급여 템플릿 적용
                                </Label>
                                {templates.length > 0 ? (
                                    <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                        <SelectTrigger className="h-12 xs:h-14 bg-white border border-slate-200 rounded-xl xs:rounded-2xl text-slate-900 font-black text-sm xs:text-lg focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm">
                                            <SelectValue placeholder="적용할 템플릿을 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl xs:rounded-2xl p-1 xs:p-2 shadow-2xl">
                                            {templates.map(t => (
                                                <SelectItem key={t.id} value={t.id} className="rounded-lg xs:rounded-xl font-bold py-2 xs:py-3 text-sm focus:bg-blue-600 focus:text-white">
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-6 border border-dashed border-slate-200">
                                        <p className="text-slate-600 font-bold text-xs xs:text-sm mb-1 xs:mb-2">등록된 급여 템플릿이 없습니다.</p>
                                        <p className="text-slate-400 text-[10px] xs:text-xs">먼저 &quot;급여 템플릿 설계&quot; 탭에서 템플릿을 생성해주세요.</p>
                                    </div>
                                )}
                            </div>

                            {currentTemplate ? (
                                <div className="space-y-6 xs:space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {/* 기본 정보 설정 - 읽기 전용 */}
                                    {groupedRules.basic.length > 0 && (
                                        <section className="space-y-4 xs:space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 xs:gap-3">
                                                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        <Info className="w-3 h-3 xs:w-4 xs:h-4 text-slate-500" />
                                                    </div>
                                                    <h4 className="text-base xs:text-lg lg:text-xl font-black text-slate-900 tracking-tight">기본 정보 및 지원금</h4>
                                                </div>
                                                <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold uppercase tracking-wider">템플릿 설정값</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
                                                {groupedRules.basic.map(rule => (
                                                    <div key={rule.id} className="space-y-2 xs:space-y-3 p-4 xs:p-6 bg-slate-50 rounded-xl xs:rounded-2xl lg:rounded-[28px] border border-slate-100">
                                                        <Label className="text-[10px] xs:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                        {renderParamInputs(rule, { ...rule.default_parameters, ...(personalParams[rule.id] || {}) }, (key, val) => handleParamChange(rule.id, key, val))}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* 수업료 설정 - 읽기 전용 */}
                                    {groupedRules.class.length > 0 && (
                                        <section className="space-y-4 xs:space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 xs:gap-3">
                                                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                        <Calculator className="w-3 h-3 xs:w-4 xs:h-4 text-emerald-600" />
                                                    </div>
                                                    <h4 className="text-base xs:text-lg lg:text-xl font-black text-slate-900 tracking-tight">수업료(단가) 설정</h4>
                                                </div>
                                                <span className="text-[9px] xs:text-[10px] text-emerald-500 font-bold uppercase tracking-wider">템플릿 설정값</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
                                                {groupedRules.class.map(rule => (
                                                    <div key={rule.id} className="space-y-2 xs:space-y-3 p-4 xs:p-6 bg-emerald-50/50 rounded-xl xs:rounded-2xl lg:rounded-[28px] border border-emerald-100">
                                                        <Label className="text-[10px] xs:text-xs font-black text-emerald-600 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                        {renderParamInputs(rule, { ...rule.default_parameters, ...(personalParams[rule.id] || {}) }, (key, val) => handleParamChange(rule.id, key, val))}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* 인센티브 설정 - 읽기 전용 */}
                                    {groupedRules.incentive.length > 0 && (
                                        <section className="space-y-4 xs:space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 xs:gap-3">
                                                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                                        <Plus className="w-3 h-3 xs:w-4 xs:h-4 text-orange-600" />
                                                    </div>
                                                    <h4 className="text-base xs:text-lg lg:text-xl font-black text-slate-900 tracking-tight">인센티브 및 요율 설정</h4>
                                                </div>
                                                <span className="text-[9px] xs:text-[10px] text-orange-500 font-bold uppercase tracking-wider">템플릿 설정값</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
                                                {groupedRules.incentive.map(rule => (
                                                    <div key={rule.id} className="space-y-2 xs:space-y-3 p-4 xs:p-6 bg-orange-50/50 rounded-xl xs:rounded-2xl lg:rounded-[28px] border border-orange-100">
                                                        <Label className="text-[10px] xs:text-xs font-black text-orange-600 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                        {renderParamInputs(rule, { ...rule.default_parameters, ...(personalParams[rule.id] || {}) }, (key, val) => handleParamChange(rule.id, key, val))}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* 세금 공제 설정 - 읽기 전용 */}
                                    {groupedRules.deduction.length > 0 && (
                                        <section className="space-y-4 xs:space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 xs:gap-3">
                                                    <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                                        <AlertTriangle className="w-3 h-3 xs:w-4 xs:h-4 text-red-600" />
                                                    </div>
                                                    <h4 className="text-base xs:text-lg lg:text-xl font-black text-slate-900 tracking-tight">세금 공제 설정</h4>
                                                </div>
                                                <span className="text-[9px] xs:text-[10px] text-red-500 font-bold uppercase tracking-wider">템플릿 설정값</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
                                                {groupedRules.deduction.map(rule => (
                                                    <div key={rule.id} className="space-y-2 xs:space-y-3 p-4 xs:p-6 bg-red-50/50 rounded-xl xs:rounded-2xl lg:rounded-[28px] border border-red-100">
                                                        <Label className="text-[10px] xs:text-xs font-black text-red-600 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                        {renderParamInputs(rule, { ...rule.default_parameters, ...(personalParams[rule.id] || {}) }, (key, val) => handleParamChange(rule.id, key, val))}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] xs:text-xs text-red-400 font-bold ml-1">
                                                세금 공제는 총 급여(세전)에서 자동으로 계산되어 차감됩니다.
                                            </p>
                                        </section>
                                    )}

                                    {/* 간편 인센티브 계산기 */}
                                    <section className="bg-slate-50 rounded-xl xs:rounded-2xl lg:rounded-[32px] p-4 xs:p-6 lg:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-48 xs:w-64 h-48 xs:h-64 bg-blue-600/5 rounded-full -mr-16 xs:-mr-20 -mt-16 xs:-mt-20 blur-3xl group-hover:bg-blue-600/10 transition-all duration-700"></div>
                                        <div className="relative z-10 space-y-4 xs:space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-slate-900 flex items-center gap-2 xs:gap-3 text-sm xs:text-base lg:text-lg tracking-tight">
                                                    <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white rounded-lg xs:rounded-xl flex items-center justify-center shadow-sm">
                                                        <Calculator className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
                                                    </div>
                                                    실시간 요율 계산기
                                                </h4>
                                                <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[8px] xs:text-[10px] tracking-widest px-2 xs:px-3 py-1">PREVIEW</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 xs:gap-6">
                                                <div className="space-y-1 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sales Amount</Label>
                                                    <Input
                                                        value={calcAmount}
                                                        onChange={e => setCalcAmount(e.target.value)}
                                                        placeholder="예: 10,000,000"
                                                        className="h-10 xs:h-12 bg-white border border-slate-200 rounded-lg xs:rounded-xl text-slate-900 font-black text-right pr-3 xs:pr-4 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm text-xs xs:text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Incentive Rate (%)</Label>
                                                    <Input
                                                        value={calcRate}
                                                        onChange={e => setCalcRate(e.target.value)}
                                                        placeholder="예: 5"
                                                        className="h-10 xs:h-12 bg-white border border-slate-200 rounded-lg xs:rounded-xl text-slate-900 font-black text-right pr-3 xs:pr-4 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm text-xs xs:text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center bg-white p-4 xs:p-6 rounded-xl xs:rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-slate-400 text-[10px] xs:text-xs font-bold uppercase tracking-widest mb-1">Estimated Result</p>
                                                <div className="text-xl xs:text-2xl lg:text-3xl font-black text-[#F2994A] tracking-tighter">
                                                    {calculatedIncentive} <span className="text-xs xs:text-sm text-slate-400 ml-1 font-bold">KRW</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 xs:py-24 lg:py-32 bg-slate-50 rounded-xl xs:rounded-2xl lg:rounded-[40px] border border-dashed border-slate-200">
                                    <Calculator className="w-12 h-12 xs:w-16 xs:h-16 text-slate-200 mb-4 xs:mb-6" />
                                    <p className="text-slate-400 font-black text-sm xs:text-base lg:text-lg">템플릿을 먼저 선택해주세요.</p>
                                    <p className="text-slate-300 font-bold text-xs xs:text-sm mt-1 xs:mt-2">직원의 기본 급여 체계를 선택하면 세부 설정이 활성화됩니다.</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-6 xs:pt-8 lg:pt-10 border-t border-slate-100 flex flex-col xs:flex-row gap-3 xs:gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsSettingModalOpen(false)}
                                className="h-12 xs:h-14 lg:h-16 px-6 xs:px-8 lg:px-10 rounded-xl xs:rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all w-full xs:w-auto text-sm xs:text-base"
                            >
                                창 닫기
                            </Button>
                            <Button
                                onClick={handleSaveSalarySetting}
                                className="h-12 xs:h-14 lg:h-16 px-8 xs:px-10 lg:px-12 bg-[#2F80ED] hover:bg-blue-600 text-white rounded-xl xs:rounded-2xl font-black text-sm xs:text-base lg:text-lg shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 w-full xs:w-auto"
                            >
                                설정 정보 저장하기
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// 계산 타입 라벨 함수
function getCalculationTypeLabel(type: string): string {
    switch(type) {
        case 'base_salary': return '기본급';
        case 'allowance': return '지원금';
        case 'hourly': return '시급';
        case 'class_fee': return '수업료';
        case 'sales_incentive': return '매출인센티브';
        case 'personal_incentive': return '개인인센티브';
        case 'bonus': return '상금';
        case 'etc': return '기타';
        case 'tax_deduction': return '세금공제';
        case 'fixed': return '고정급';
        case 'percentage_total': return '매출인센티브';
        case 'percentage_personal': return '개인인센티브';
        default: return type;
    }
}

// 파라미터 입력 렌더링 함수 - 읽기 전용 (템플릿 값 락)
function renderParamInputs(rule: any, values: any, onChange: (key: string, value: any) => void) {
    const typeLabel = getCalculationTypeLabel(rule.calculation_type);

    // 값 표시용 스타일 (읽기 전용)
    const valueDisplayClass = "bg-slate-100 border border-slate-200 text-slate-700 h-10 xs:h-12 rounded-lg xs:rounded-xl font-black text-right pr-8 xs:pr-10 shadow-inner text-xs xs:text-sm flex items-center justify-end px-3 xs:px-4";

    switch(rule.calculation_type) {
        // 고정 금액 타입들 (amount)
        case 'base_salary':
        case 'fixed':
        case 'allowance':
        case 'bonus':
        case 'etc':
            const fixedAmount = Number(values.amount || 0);
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">(고정금액)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>
                            {fixedAmount > 0 ? fixedAmount.toLocaleString() : "0"}
                        </div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">원</span>
                    </div>
                    {fixedAmount > 0 && (
                        <div className="text-right text-[10px] xs:text-xs text-blue-600 font-black">
                            = {fixedAmount.toLocaleString()}원
                        </div>
                    )}
                </div>
            );
        case 'hourly':
            const hourlyRate = Number(values.rate || 0);
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">(시급 × 근무시간)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>
                            {hourlyRate > 0 ? hourlyRate.toLocaleString() : "0"}
                        </div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">원/시간</span>
                    </div>
                    {hourlyRate > 0 && (
                        <div className="text-right text-[10px] xs:text-xs text-blue-600 font-black">
                            시급 {hourlyRate.toLocaleString()}원
                        </div>
                    )}
                </div>
            );
        case 'class_fee':
            const classRate = Number(values.rate || 0);
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">(횟수 × 단가)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>
                            {classRate > 0 ? classRate.toLocaleString() : "0"}
                        </div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">원/회</span>
                    </div>
                    {classRate > 0 && (
                        <div className="text-right text-[10px] xs:text-xs text-emerald-600 font-black">
                            회당 {classRate.toLocaleString()}원
                        </div>
                    )}
                </div>
            );
        // 퍼센트 타입들 (rate)
        case 'sales_incentive':
        case 'personal_incentive':
        case 'percentage_total':
        case 'percentage_personal':
            const incentiveRate = Number(values.rate || 0);
            const isPersonal = rule.calculation_type === 'personal_incentive' || rule.calculation_type === 'percentage_personal';
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">({isPersonal ? '개인매출' : '매출'} × %)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>
                            {incentiveRate > 0 ? incentiveRate : "0"}
                        </div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">%</span>
                    </div>
                    {incentiveRate > 0 && (
                        <div className="text-right text-[10px] xs:text-xs text-orange-600 font-black">
                            {isPersonal ? '개인매출' : '매출'}의 {incentiveRate}%
                        </div>
                    )}
                </div>
            );
        case 'tax_deduction':
            const deductionRate = Number(values.rate || 0);
            // 공제 항목 전용 스타일 (빨간색 배경)
            const deductionDisplayClass = "bg-red-50 border border-red-200 text-red-600 h-10 xs:h-12 rounded-lg xs:rounded-xl font-black text-right pr-8 xs:pr-10 shadow-inner text-xs xs:text-sm flex items-center justify-end px-3 xs:px-4";
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">공제</span>
                        <span className="text-[9px] xs:text-[10px] text-red-400 font-bold">(총급여 × %)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={deductionDisplayClass}>
                            {deductionRate > 0 ? `-${deductionRate}` : "0"}
                        </div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-red-400">%</span>
                    </div>
                    {deductionRate > 0 && (
                        <div className="text-right text-[10px] xs:text-xs text-red-600 font-black">
                            총급여의 <span className="text-red-700">-{deductionRate}%</span> 차감
                        </div>
                    )}
                </div>
            );
        default:
            return <div className="text-[10px] xs:text-xs text-slate-400 font-bold py-2 px-1">자동 계산 혹은 기본값 사용</div>;
    }
}