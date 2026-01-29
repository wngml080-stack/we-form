"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { calculateMonthlyStats } from "@/lib/schedule-utils";
import { Calculator, Download, Save, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { SalaryResultsTable, SalaryTotalFooter } from "./SalaryResultsTable";
import { SalaryMobileCards } from "./SalaryMobileCards";
import { SalarySettingsModal } from "./SalarySettingsModal";
import type { MonthlyScheduleStats } from "@/lib/schedule-utils";
import type {
    StaffSalaryResult,
    SalaryTemplate,
    SalaryTemplateItem,
    StaffSalarySetting,
    StaffStats,
} from "../types";

// Database response types for Supabase queries
type StaffBasicInfo = {
    id: string;
    name: string;
    job_title?: string;
};

type PaymentRecord = {
    amount: number | null;
    registrar: string | null;
    membership_category: string | null;
};

type SalaryTemplateItemRow = {
    template_id: string;
    rule_id: string;
};

type SalaryRuleRow = {
    id: string;
    name: string;
    calculation_type: string;
    default_parameters: Record<string, number>;
};

type StaffSalarySettingRow = {
    staff_id: string;
    template_id: string | null;
    personal_parameters: Record<string, Record<string, number>> | null;
};

type PerformanceMetrics = {
    personal_sales?: number;
};

type PerformanceRow = {
    staff_id: string;
    metrics: PerformanceMetrics | null;
};

type CalculatedSalaryRow = {
    staff_id: string;
    total_amount: number;
    breakdown: SalaryBreakdown | null;
    updated_at: string;
    staff: StaffBasicInfo | null;
};

type SalaryBreakdown = {
    base_salary?: number;
    incentive_salary?: number;
    class_salary?: number;
    tax_deduction?: number;
    total_salary?: number;
    net_salary?: number;
    details?: SalaryDetailItem[];
    stats?: MonthlyScheduleStats;
    reportStatus?: 'approved' | 'submitted' | 'rejected' | 'none';
};

type SalaryDetailItem = {
    rule_name: string;
    amount: number;
    calculation?: string;
    isDeduction?: boolean;
};

// Type for personal parameters (rule_id -> parameter values)
type PersonalParameters = Record<string, Record<string, number>>;

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
    const [personalParams, setPersonalParams] = useState<PersonalParameters>({});
    const [staffSalarySettings, setStaffSalarySettings] = useState<Record<string, StaffSalarySetting>>({});

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
            (staffList || []).forEach((s: StaffBasicInfo) => {
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

            (payments || []).forEach((p: PaymentRecord) => {
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
        } catch (error) {
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
            let itemsData: SalaryTemplateItemRow[] = [];
            let rulesData: SalaryRuleRow[] = [];

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
            (settingsData || []).forEach((s: StaffSalarySettingRow) => {
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
                const mergedParams: PersonalParameters = {};
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

    // 급여 설정 저장 (모달에서 호출)
    const handleSaveSettingFromModal = async (templateId: string, params: PersonalParameters) => {
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
                    template_id: templateId || null,
                    personal_parameters: params,
                    valid_from: new Date().toISOString()
                }).eq("id", existing.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from("staff_salary_settings").insert({
                    staff_id: selectedStaffForSetting.staff_id,
                    template_id: templateId || null,
                    personal_parameters: params,
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
                (performances as PerformanceRow[]).forEach((p) => {
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
                const savedResults: StaffSalaryResult[] = (salaries as CalculatedSalaryRow[]).map((s) => {
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
                        details: (breakdown.details || []).map(d => ({
                            rule_name: d.rule_name,
                            amount: d.amount,
                            calculation: d.calculation || "",
                            isDeduction: d.isDeduction
                        })),
                        stats: breakdown.stats || {
                            pt_total_count: 0,
                            pt_inside_count: 0,
                            pt_outside_count: 0,
                            pt_weekend_count: 0,
                            pt_holiday_count: 0,
                            bc_count: 0
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
                    const rules = template.items.map((i: SalaryTemplateItem) => i.rule).filter(Boolean);
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
                            <SalaryMobileCards
                                results={results as StaffSalaryResult[]}
                                isLoading={isLoading}
                                monthlySalesByTrainer={monthlySalesByTrainer}
                                onOpenSettings={handleOpenSettingModal}
                            />
                        </div>

                        {/* 데스크톱 테이블 뷰 */}
                        <div className="hidden md:block overflow-x-auto flex-1">
                            <SalaryResultsTable
                                results={results as StaffSalaryResult[]}
                                isLoading={isLoading}
                                monthlySalesByTrainer={monthlySalesByTrainer}
                                onOpenSettings={handleOpenSettingModal}
                            />
                        </div>

                        {/* 합계 푸터 */}
                        <SalaryTotalFooter results={results as StaffSalaryResult[]} />
                    </div>
            </div>

            {/* 급여 설정 모달 */}
            <SalarySettingsModal
                isOpen={isSettingModalOpen}
                onClose={() => setIsSettingModalOpen(false)}
                staff={selectedStaffForSetting}
                templates={templates}
                initialTemplateId={selectedTemplateId}
                initialParams={personalParams}
                onSave={handleSaveSettingFromModal}
            />
        </div>
    );
}