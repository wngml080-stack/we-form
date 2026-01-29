"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Info, Calculator, Users } from "lucide-react";

type SalaryParameter = Record<string, string | number | boolean | SalaryTier[]>;
type SalaryTier = { min: number; max: number; rate: number };

interface StaffDbRow {
    id: string;
    user_id: string;
    name: string;
    job_title?: string;
    role: string;
    gym_id: string;
    salary_setting?: Array<{
        id: string;
        template_id: string;
        template?: { name: string };
        personal_parameters: SalaryParameter;
    }>;
}

type Staff = {
    id: string;
    user_id: string;
    name: string;
    role: string;
    gym_id: string;
    job_title?: string;
    salary_setting?: {
        id: string;
        template_id: string;
        template_name: string;
        personal_parameters: SalaryParameter;
    };
};

type SalaryTemplate = {
    id: string;
    name: string;
    items: { rule: { id: string; name: string; calculation_type: string; default_parameters: SalaryParameter } }[];
};

export default function SalaryAssignmentManager() {
    const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();
    const selectedGymId = branchFilter.selectedGymId;
    const selectedCompanyId = branchFilter.selectedCompanyId;

    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 폼 상태
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [personalParams, setPersonalParams] = useState<SalaryParameter>({});

    // 계산기 상태
    const [calcAmount, setCalcAmount] = useState("");
    const [calcRate, setCalcRate] = useState("");

    const supabase = createSupabaseClient();

    const fetchData = useCallback(async (gymId: string, _companyId: string) => {
        try {
            // 템플릿 조회: 먼저 기본 조회 시도
            let templatesData: SalaryTemplate[] = [];
            try {
                const { data: tmplData, error: tmplError } = await supabase
                    .from("salary_templates")
                    .select(`*, items:salary_template_items(rule:salary_rules(*))`)
                    .eq("gym_id", gymId);

                if (tmplError) {
                    console.warn("템플릿 조회 (조인) 실패, 기본 조회 시도:", tmplError);
                    // 조인 쿼리 실패시 기본 조회
                    const { data: basicTmpl } = await supabase
                        .from("salary_templates")
                        .select("*")
                        .eq("gym_id", gymId);
                    templatesData = (basicTmpl || []).map(t => ({ ...t, items: [] }));
                } else {
                    templatesData = tmplData || [];
                }
            } catch {
                // 테이블이 없는 경우
                templatesData = [];
            }
            setTemplates(templatesData);

            // 직원 목록 조회: 먼저 기본 조회 시도
            let formattedStaffs: Staff[] = [];
            try {
                const { data: staffData, error: staffError } = await supabase
                    .from("staffs")
                    .select(`
                        id, user_id, name, job_title, role, gym_id,
                        salary_setting:staff_salary_settings(
                            id, template_id, personal_parameters,
                            template:salary_templates(name)
                        )
                    `)
                    .eq("gym_id", gymId);

                if (staffError) {
                    console.warn("직원 조회 (조인) 실패, 기본 조회 시도:", staffError);
                    // 조인 쿼리 실패시 기본 조회
                    const { data: basicStaffs } = await supabase
                        .from("staffs")
                        .select("id, user_id, name, job_title, role, gym_id")
                        .eq("gym_id", gymId);
                    formattedStaffs = (basicStaffs || []).map((s: StaffDbRow) => ({
                        ...s,
                        salary_setting: undefined
                    }));
                } else {
                    formattedStaffs = (staffData || []).map((s: StaffDbRow) => ({
                        ...s,
                        salary_setting: s.salary_setting?.[0] ? {
                            id: s.salary_setting[0].id,
                            template_id: s.salary_setting[0].template_id,
                            template_name: s.salary_setting[0].template?.name,
                            personal_parameters: s.salary_setting[0].personal_parameters
                        } : undefined
                    }));
                }
            } catch {
                // 테이블이 없는 경우
                const { data: basicStaffs } = await supabase
                    .from("staffs")
                    .select("id, user_id, name, job_title, role, gym_id")
                    .eq("gym_id", gymId);
                formattedStaffs = (basicStaffs || []).map((s: StaffDbRow) => ({
                    ...s,
                    salary_setting: undefined
                }));
            }

            setStaffs(formattedStaffs);

        } catch (error) {
            console.error("데이터 조회 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (filterInitialized && selectedGymId && selectedCompanyId) {
            fetchData(selectedGymId, selectedCompanyId);
        }
    }, [filterInitialized, selectedGymId, selectedCompanyId, fetchData]);

    const handleOpenModal = (staff: Staff) => {
        setSelectedStaff(staff);
        if (staff.salary_setting) {
            setSelectedTemplateId(staff.salary_setting.template_id);
            setPersonalParams(staff.salary_setting.personal_parameters || {});
        } else {
            setSelectedTemplateId("");
            setPersonalParams({});
        }
        setIsModalOpen(true);
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        setPersonalParams({});
    };

    const handleParamChange = (ruleId: string, key: string, value: string | number | boolean | SalaryTier[]) => {
        // value가 배열(tiers)인 경우 그대로 저장
        if (key === 'tiers') {
            setPersonalParams((prev) => ({
                ...prev,
                [ruleId]: {
                    ...(typeof prev[ruleId] === 'object' && prev[ruleId] !== null ? prev[ruleId] as Record<string, unknown> : {}),
                    [key]: value
                }
            }));
            return;
        }

        // 숫자형 입력 처리
        let finalValue: string | number | boolean = value as string | number | boolean;
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== "") {
             finalValue = Number(value);
        }

        setPersonalParams((prev) => ({
            ...prev,
            [ruleId]: {
                ...prev[ruleId],
                [key]: finalValue
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedStaff) return;

        try {
            // 먼저 테이블 존재 여부 확인
            const { error: checkError } = await supabase
                .from("staff_salary_settings")
                .select("id")
                .limit(1);

            if (checkError) {
                // 테이블이 없는 경우
                console.error("staff_salary_settings 테이블 조회 실패:", checkError);
                toast.error("급여 설정 테이블이 없습니다. 관리자에게 문의하세요.");
                return;
            }

            const { data: existing } = await supabase
                .from("staff_salary_settings")
                .select("id")
                .eq("staff_id", selectedStaff.id)
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
                    staff_id: selectedStaff.id,
                    template_id: selectedTemplateId || null,
                    personal_parameters: personalParams,
                    valid_from: new Date().toISOString()
                });

                if (insertError) throw insertError;
            }

            setIsModalOpen(false);
            if (selectedGymId && selectedCompanyId) fetchData(selectedGymId, selectedCompanyId);
            toast.success("저장되었습니다.");
        } catch (error: unknown) {
            console.error("상세 에러:", error);
            const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
            toast.error(`저장 실패: ${errorMessage}`);
        }
    };

    // 그룹핑 함수
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    const groupedRules: { basic: SalaryRule[]; class: SalaryRule[]; incentive: SalaryRule[]; others: SalaryRule[] } = {
        basic: [],
        class: [],
        incentive: [],
        others: []
    };

    if (currentTemplate) {
        currentTemplate.items.forEach(({ rule }) => {
            const name = rule.name.toLowerCase();
            if (name.includes("기본급") || name.includes("식대") || name.includes("지원금") || name.includes("근무")) {
                groupedRules.basic.push(rule);
            } else if (name.includes("pt") || name.includes("수업") || name.includes("ot") || name.includes("bc") || name.includes("레슨") || name.includes("프로")) {
                groupedRules.class.push(rule);
            } else if (name.includes("인센") || name.includes("상금") || name.includes("보장") || name.includes("매출")) {
                groupedRules.incentive.push(rule);
            } else {
                groupedRules.others.push(rule);
            }
        });
    }

    const calculatedIncentive = (parseFloat(calcAmount || "0") * (parseFloat(calcRate || "0") / 100)).toLocaleString();

    if (isLoading) return <div className="flex flex-col items-center justify-center py-40 animate-pulse text-slate-400 font-black text-xs uppercase tracking-widest">Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        직원 개별 급여 설정
                    </h3>
                    <p className="text-sm text-slate-400 font-bold ml-13">
                        각 직원별로 적용될 급여 템플릿을 선택하고 세부 단가 및 인센티브 요율을 설정합니다.
                    </p>
                </div>
            </div>
            
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-slate-100/50 overflow-hidden transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">직원 정보</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">현재 직책</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">적용된 템플릿</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {staffs.map(staff => (
                                <tr key={staff.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <span className="font-black text-slate-900 text-base tracking-tight">{staff.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-slate-500 font-bold text-sm bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                            {staff.job_title || staff.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        {staff.salary_setting ? (
                                            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 font-black text-[11px] px-3 py-1 rounded-xl shadow-sm shadow-blue-50/50">
                                                {staff.salary_setting.template_name}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-300 border-slate-200 font-bold text-[11px] px-3 py-1 rounded-xl">미설정</Badge>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Button 
                                            onClick={() => handleOpenModal(staff)}
                                            className="h-10 px-5 bg-white hover:bg-blue-600 border border-blue-100 text-blue-600 hover:text-white rounded-xl font-black text-xs transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100"
                                        >
                                            <Calculator className="w-3.5 h-3.5 mr-2" /> 상세 설정하기
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {staffs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <Users className="w-16 h-16 mb-4 opacity-20" />
                                            <p className="font-black text-lg">등록된 직원 데이터가 없습니다.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-none shadow-2xl p-0 rounded-[40px]">
                    <div className="p-8 lg:p-12 space-y-10">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-[24px] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <Calculator className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">급여 및 인센티브 설정</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-bold text-base mt-1">
                                        <span className="text-blue-600">{selectedStaff?.name}</span> / {selectedStaff?.job_title || selectedStaff?.role}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        
                        <div className="space-y-10">
                            {/* 1. 템플릿 선택 */}
                            <div className="space-y-4 bg-slate-50 p-8 rounded-[32px] border border-slate-100 transition-all hover:bg-slate-100/50">
                                <Label className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                    Step 01. 급여 템플릿 적용
                                </Label>
                                {templates.length > 0 ? (
                                    <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                        <SelectTrigger className="h-14 bg-white border border-slate-200 rounded-2xl text-slate-900 font-black text-lg focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm">
                                            <SelectValue placeholder="적용할 템플릿을 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-2xl p-2 shadow-2xl">
                                            {templates.map(t => (
                                                <SelectItem key={t.id} value={t.id} className="rounded-xl font-bold py-3 focus:bg-blue-600 focus:text-white">
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-200">
                                        <p className="text-slate-600 font-bold text-sm mb-2">등록된 급여 템플릿이 없습니다.</p>
                                        <p className="text-slate-400 text-xs">먼저 &quot;급여 템플릿 관리&quot; 탭에서 템플릿을 생성해주세요.</p>
                                    </div>
                                )}
                            </div>

                            {currentTemplate ? (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {/* 3. 기본 정보 설정 */}
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <Info className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">기본 정보 및 지원금</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {groupedRules.basic.map(rule => (
                                                <div key={rule.id} className="space-y-3 p-6 bg-slate-50 rounded-[28px] border border-slate-100">
                                                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                    {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* 4. 수업료 설정 */}
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <Calculator className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">수업료(단가) 설정</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {groupedRules.class.map(rule => (
                                                <div key={rule.id} className="space-y-3 p-6 bg-emerald-50/50 rounded-[28px] border border-emerald-100">
                                                    <Label className="text-xs font-black text-emerald-600 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                    {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* 5. 인센티브 및 특수 매출 */}
                                    <section className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                                <Plus className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">인센티브 및 요율 설정</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {groupedRules.incentive.map(rule => (
                                                <div key={rule.id} className="space-y-3 p-6 bg-orange-50/50 rounded-[28px] border border-orange-100">
                                                    <Label className="text-xs font-black text-orange-600 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                    {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* 간편 인센티브 계산기 - 라이트 버전 */}
                                    <section className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-600/10 transition-all duration-700"></div>
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-slate-900 flex items-center gap-3 text-lg tracking-tight">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                        <Calculator className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    실시간 요율 계산기
                                                </h4>
                                                <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[10px] tracking-widest px-3 py-1">PREVIEW</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sales Amount</Label>
                                                    <Input 
                                                        value={calcAmount} 
                                                        onChange={e => setCalcAmount(e.target.value)} 
                                                        placeholder="예: 10,000,000" 
                                                        className="h-12 bg-white border border-slate-200 rounded-xl text-slate-900 font-black text-right pr-4 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Incentive Rate (%)</Label>
                                                    <Input 
                                                        value={calcRate} 
                                                        onChange={e => setCalcRate(e.target.value)} 
                                                        placeholder="예: 5" 
                                                        className="h-12 bg-white border border-slate-200 rounded-xl text-slate-900 font-black text-right pr-4 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Estimated Result</p>
                                                <div className="text-3xl font-black text-[#F2994A] tracking-tighter">
                                                    {calculatedIncentive} <span className="text-sm text-slate-400 ml-1 font-bold">KRW</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                                    <Calculator className="w-16 h-16 text-slate-200 mb-6" />
                                    <p className="text-slate-400 font-black text-lg">템플릿을 먼저 선택해주세요.</p>
                                    <p className="text-slate-300 font-bold text-sm mt-2">직원의 기본 급여 체계를 선택하면 세부 설정이 활성화됩니다.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Note</Label>
                            <Textarea className="bg-white border-slate-200 text-slate-900 min-h-[100px] rounded-2xl p-5 font-bold focus:ring-2 focus:ring-blue-500/50 shadow-sm" placeholder="해당 직원의 특이사항이나 메모를 입력하세요." />
                        </div>

                        <DialogFooter className="pt-10 border-t border-slate-100 flex gap-4">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsModalOpen(false)} 
                                className="h-16 px-10 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                창 닫기
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                className="h-16 px-12 bg-[#2F80ED] hover:bg-blue-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95"
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

interface SalaryRule {
    id: string;
    name: string;
    calculation_type: string;
    default_parameters: SalaryParameter;
}

interface ParamValues {
    amount?: string | number;
    rate?: string | number;
    tiers?: SalaryTier[];
}

function renderParamInputs(rule: SalaryRule, values: ParamValues, onChange: (key: string, value: string | number | SalaryTier[]) => void) {
    const inputClass = "bg-white border border-slate-200 text-slate-900 h-12 rounded-xl font-black text-right pr-10 focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all";

    switch(rule.calculation_type) {
        case 'fixed':
            return (
                <div className="relative">
                    <Input
                        type="number"
                        value={values.amount ?? ""}
                        onChange={e => onChange('amount', e.target.value)}
                        className={inputClass}
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-black text-slate-400">원</span>
                </div>
            );
        case 'hourly':
            return (
                <div className="relative">
                    <Input
                        type="number"
                        value={values.rate ?? ""}
                        onChange={e => onChange('rate', e.target.value)}
                        className={inputClass}
                        placeholder="시급"
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-black text-slate-400">원/시간</span>
                </div>
            );
        case 'class_fee':
            return (
                <div className="relative">
                    <Input
                        type="number"
                        value={values.rate ?? ""}
                        onChange={e => onChange('rate', e.target.value)}
                        className={inputClass}
                        placeholder="단가"
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-black text-slate-400">원/회</span>
                </div>
            );
        case 'percentage_total':
        case 'percentage_personal':
            return (
                <div className="relative">
                    <Input
                        type="number"
                        value={values.rate ?? ""}
                        onChange={e => onChange('rate', e.target.value)}
                        className={inputClass}
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-black text-slate-400">%</span>
                </div>
            );
        default:
            return <div className="text-xs text-slate-400 font-bold py-2 px-1">자동 계산 혹은 기본값 사용</div>;
    }
}

// 구간별 설정 컴포넌트 (향후 사용 예정)
interface TierItem { min: number; max: number | null; value: number }
// eslint-disable-next-line unused-imports/no-unused-vars
function TieredConfig({ tiers, onChange }: { tiers: TierItem[], onChange: (tiers: TierItem[]) => void }) {
    const [testSales, setTestSales] = useState<string>("");

    const handleAddTier = () => {
        onChange([...tiers, { min: 0, max: null, value: 0 }]);
    };

    const handleRemoveTier = (index: number) => {
        const newTiers = tiers.filter((_, i) => i !== index);
        onChange(newTiers);
    };

    const handleUpdateTier = (index: number, field: string, value: string) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value === "" ? null : Number(value) };
        onChange(newTiers);
    };

    // 테스트 계산 로직
    const sales = parseFloat(testSales || "0");
    const sortedTiers = [...(tiers || [])].sort((a, b) => (a.min || 0) - (b.min || 0));
    
    let matchedValue = 0;
    const activeTier = sortedTiers.slice().reverse().find(t => sales >= (t.min || 0) && (t.max === null || t.max === 0 || sales < t.max));
    
    if (activeTier) matchedValue = activeTier.value;

    return (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[10px] tracking-widest px-3 py-1">TIERED PRICING</Badge>
                <Button size="sm" variant="ghost" onClick={handleAddTier} className="h-8 text-xs font-black text-blue-600 hover:text-white hover:bg-blue-600 transition-all rounded-lg px-3">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> 구간 추가
                </Button>
            </div>

            <div className="space-y-3">
                {tiers.map((tier, idx) => (
                    <div key={idx} className="flex gap-3 items-center group">
                        <div className="grid grid-cols-3 gap-3 flex-1">
                            <div className="relative">
                                <Input 
                                    placeholder="최소 매출" 
                                    className="h-10 bg-slate-50 border border-slate-100 text-slate-900 text-xs font-bold rounded-xl pr-8 focus:ring-1 focus:ring-blue-500/50 shadow-sm"
                                    value={tier.min || ""}
                                    type="number"
                                    onChange={e => handleUpdateTier(idx, 'min', e.target.value)}
                                />
                                <span className="absolute right-3 top-3 text-[10px] font-black text-slate-300 uppercase">Min</span>
                            </div>
                            <div className="relative">
                                <Input 
                                    placeholder="최대 매출" 
                                    className="h-10 bg-slate-50 border border-slate-100 text-slate-900 text-xs font-bold rounded-xl pr-8 focus:ring-1 focus:ring-blue-500/50 shadow-sm"
                                    value={tier.max || ""}
                                    type="number"
                                    onChange={e => handleUpdateTier(idx, 'max', e.target.value)}
                                />
                                <span className="absolute right-3 top-3 text-[10px] font-black text-slate-300 uppercase">Max</span>
                            </div>
                            <div className="relative">
                                <Input 
                                    placeholder="금액/단가" 
                                    className="h-10 bg-slate-50 border border-slate-100 text-[#F2994A] text-xs font-black rounded-xl pr-8 focus:ring-1 focus:ring-blue-500/50 shadow-sm"
                                    value={tier.value || ""}
                                    type="number"
                                    onChange={e => handleUpdateTier(idx, 'value', e.target.value)}
                                />
                                <span className="absolute right-3 top-3 text-[10px] font-black text-slate-300 uppercase">Val</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" onClick={() => handleRemoveTier(idx)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                {tiers.length === 0 && (
                    <div className="text-xs text-center text-slate-400 font-bold py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">구간 정보를 추가해주세요.</div>
                )}
            </div>

            {/* 테스트 섹션 */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulate Result</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <Input 
                        className="h-6 w-24 bg-transparent border-none text-xs font-black text-slate-900 p-0 focus-visible:ring-0 text-right pr-1"
                        placeholder="매출 입력"
                        value={testSales}
                        onChange={e => setTestSales(e.target.value)}
                        type="number"
                    />
                    <div className="w-px h-3 bg-slate-200"></div>
                    <span className="text-xs font-black text-[#F2994A] tracking-tight">{matchedValue.toLocaleString()} 원</span>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line unused-imports/no-unused-vars
function getCalculationLabel(type: string) {
    switch(type) {
        case 'fixed': return '고정급';
        case 'hourly': return '시급제';
        case 'class_fee': return '수업료';
        case 'percentage_total': return '매출 인센티브';
        case 'percentage_personal': return '개인 인센티브';
        default: return type;
    }
}
