"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Settings, FileText } from "lucide-react";
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

// 타입 정의 (이전 버전 호환성 포함)
type CalculationType = 'base_salary' | 'allowance' | 'hourly' | 'class_fee' | 'sales_incentive' | 'personal_incentive' | 'bonus' | 'etc' | 'fixed' | 'percentage_total' | 'percentage_personal' | 'tax_deduction';

type SalaryRuleParameters = {
    amount?: number;
    rate?: number;
};

type SalaryRule = {
    id?: string;
    name: string;
    calculation_type: CalculationType;
    default_parameters: SalaryRuleParameters;
};

type SalaryTemplate = {
    id: string;
    name: string;
    description: string | null;
    items?: { rule: SalaryRule }[];
};

// 프리셋 정의
const PRESET_RULES: { label: string; value: string; defaultType: CalculationType }[] = [
    { label: "기본급", value: "기본급", defaultType: "base_salary" },
    { label: "식대", value: "식대", defaultType: "etc" },
    { label: "영업지원금", value: "영업지원금", defaultType: "allowance" },
    { label: "직책수당 (팀장)", value: "직책수당 (팀장)", defaultType: "allowance" },
    { label: "매니저 수당", value: "매니저 수당", defaultType: "allowance" },
    { label: "PT IN (근무내)", value: "PT IN (근무내)", defaultType: "class_fee" },
    { label: "PT OUT (근무외)", value: "PT OUT (근무외)", defaultType: "class_fee" },
    { label: "PT (주말)", value: "PT (주말)", defaultType: "class_fee" },
    { label: "BC (바디챌린지)", value: "BC (바디챌린지)", defaultType: "class_fee" },
    { label: "본사 A클래스 상금", value: "본사 A클래스 상금", defaultType: "bonus" },
    { label: "상,하반기&지사상금", value: "상,하반기&지사상금", defaultType: "bonus" },
    { label: "맞다이 승리 인센", value: "맞다이 승리 인센", defaultType: "sales_incentive" },
    { label: "팀장 승리 인센", value: "팀장 승리 인센", defaultType: "sales_incentive" },
    { label: "바디챌린지 상금", value: "바디챌린지 상금", defaultType: "bonus" },
    { label: "기타", value: "기타", defaultType: "allowance" },
    // 세금 공제 항목
    { label: "소득세", value: "소득세", defaultType: "tax_deduction" },
    { label: "국민연금", value: "국민연금", defaultType: "tax_deduction" },
    { label: "건강보험", value: "건강보험", defaultType: "tax_deduction" },
    { label: "장기요양보험", value: "장기요양보험", defaultType: "tax_deduction" },
    { label: "고용보험", value: "고용보험", defaultType: "tax_deduction" },
    { label: "기타 공제", value: "기타 공제", defaultType: "tax_deduction" },
];

export default function SalaryTemplateManager() {
    const { branchFilter, isInitialized: filterInitialized } = useAdminFilter();
    const selectedGymId = branchFilter.selectedGymId;

    const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 편집 중인 템플릿 상태
    const [editingTemplate, setEditingTemplate] = useState<{
        id?: string;
        name: string;
        description: string;
        rules: SalaryRule[];
    }>({
        name: "",
        description: "",
        rules: []
    });

    const supabase = createSupabaseClient();

    const fetchTemplates = useCallback(async (gymId: string) => {
        try {
            // 먼저 기본 템플릿만 조회 시도
            const { data: basicData, error: basicError } = await supabase
                .from("salary_templates")
                .select("*")
                .eq("gym_id", gymId)
                .order("created_at", { ascending: false });

            if (basicError) {
                console.error("Supabase Select Error:", basicError);
                if (basicError.code === '42P01' || basicError.message?.includes('does not exist')) {
                    toast.error("급여 템플릿 테이블이 아직 생성되지 않았습니다. DB 마이그레이션을 확인해주세요.");
                } else {
                    toast.error("템플릿 조회 중 오류가 발생했습니다.");
                }
                setTemplates([]);
                return;
            }

            // 기본 템플릿이 있으면 연결된 규칙들도 가져오기 시도
            if (basicData && basicData.length > 0) {
                try {
                    // 먼저 salary_template_items 테이블 존재 확인
                    const { data: _itemsCheck, error: itemsCheckError } = await supabase
                        .from("salary_template_items")
                        .select("template_id, rule_id")
                        .limit(1);

                    if (itemsCheckError) {
                        setTemplates(basicData.map(t => ({ ...t, items: [] })));
                        return;
                    }

                    // 각 템플릿별로 연결된 규칙 조회 (조인 대신 개별 쿼리)
                    const templatesWithItems = await Promise.all(
                        basicData.map(async (template) => {
                            // 먼저 template_items 조회
                            const { data: templateItems, error: templateItemsError } = await supabase
                                .from("salary_template_items")
                                .select("rule_id")
                                .eq("template_id", template.id);

                            if (templateItemsError || !templateItems || templateItems.length === 0) {
                                return { ...template, items: [] };
                            }

                            // rule_ids로 규칙들 조회
                            const ruleIds = templateItems.map(item => item.rule_id);
                            const { data: rules, error: rulesError } = await supabase
                                .from("salary_rules")
                                .select("*")
                                .in("id", ruleIds);

                            if (rulesError || !rules) {
                                return { ...template, items: [] };
                            }

                            // items 형태로 변환
                            const items = rules.map(rule => ({ rule }));
                            return { ...template, items };
                        })
                    );

                    setTemplates(templatesWithItems);
                    return;
                } catch (err) {
                    // 조인 쿼리 실패시 기본 데이터 사용
                    console.error("템플릿 규칙 조회 실패:", err);
                }
            }

            // 기본 데이터로 폴백
            setTemplates(basicData?.map(t => ({ ...t, items: [] })) || []);
        } catch (error: unknown) {
            console.error("템플릿 로딩 실패:", error);
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (filterInitialized && selectedGymId) {
            fetchTemplates(selectedGymId);
        }
    }, [filterInitialized, selectedGymId, fetchTemplates]);

    const handleOpenModal = (template?: SalaryTemplate) => {
        if (template) {
            const extractedRules = template.items?.map(i => i.rule) || [];
            setEditingTemplate({
                id: template.id,
                name: template.name,
                description: template.description || "",
                rules: extractedRules
            });
        } else {
            setEditingTemplate({
                name: "",
                description: "",
                rules: []
            });
        }
        setIsModalOpen(true);
    };

    const handleAddRule = () => {
        const newRule: SalaryRule = {
            name: "", // 이름 비워둠 (선택 유도)
            calculation_type: 'fixed',
            default_parameters: { amount: 0 }
        };
        setEditingTemplate(prev => ({
            ...prev,
            rules: [...prev.rules, newRule]
        }));
    };

    const handlePresetChange = (index: number, value: string) => {
        if (value === "custom") {
            handleUpdateRule(index, 'name', "");
        } else {
            const preset = PRESET_RULES.find(p => p.value === value);
            if (preset) {
                // 이름과 기본 타입을 함께 업데이트 (functional update로 stale closure 방지)
                setEditingTemplate(prev => {
                    const newRules = [...prev.rules];
                    newRules[index] = {
                        ...newRules[index],
                        name: preset.value,
                        calculation_type: preset.defaultType
                    };
                    return { ...prev, rules: newRules };
                });
            }
        }
    };

    const handleUpdateRule = (index: number, field: keyof SalaryRule, value: string | CalculationType | SalaryRuleParameters) => {
        // functional update로 stale closure 방지
        setEditingTemplate(prev => {
            const newRules = [...prev.rules];
            newRules[index] = { ...newRules[index], [field]: value };
            return { ...prev, rules: newRules };
        });
    };

    const handleRemoveRule = (index: number) => {
        // functional update로 stale closure 방지
        setEditingTemplate(prev => {
            const newRules = prev.rules.filter((_, i) => i !== index);
            return { ...prev, rules: newRules };
        });
    };

    const handleSave = async () => {
        try {
            if (!selectedGymId) {
                toast.warning("지점을 선택해주세요.");
                return;
            }

            if (!editingTemplate.name.trim()) {
                toast.warning("템플릿 이름을 입력해주세요.");
                return;
            }

            // 규칙 데이터를 JSON으로 직렬화 (description에 임시 저장용)
            const _rulesJson = JSON.stringify(editingTemplate.rules);

            // 1. 템플릿 저장/수정
            let templateId = editingTemplate.id;

            if (!templateId) {
                const { data, error } = await supabase
                    .from("salary_templates")
                    .insert({
                        gym_id: selectedGymId,
                        name: editingTemplate.name,
                        description: editingTemplate.description || null
                    })
                    .select()
                    .single();

                if (error) {
                    console.error("템플릿 저장 에러:", error);
                    if (error.code === '42P01') {
                        toast.error("salary_templates 테이블이 없습니다. DB 마이그레이션을 실행해주세요.");
                    } else {
                        toast.error(`템플릿 저장 실패: ${error.message || JSON.stringify(error)}`);
                    }
                    return;
                }
                templateId = data.id;
            } else {
                const { error: updateError } = await supabase
                    .from("salary_templates")
                    .update({
                        name: editingTemplate.name,
                        description: editingTemplate.description || null
                    })
                    .eq("id", templateId);

                if (updateError) {
                    console.error("템플릿 수정 에러:", updateError);
                    toast.error(`템플릿 수정 실패: ${updateError.message || JSON.stringify(updateError)}`);
                    return;
                }
            }

            // 2. salary_rules 테이블 존재 여부 확인
            const { error: rulesCheckError } = await supabase
                .from("salary_rules")
                .select("id")
                .limit(1);

            if (rulesCheckError) {
                // salary_rules 테이블이 없음 - 템플릿만 저장하고 완료
                console.warn("salary_rules 테이블이 없습니다. 템플릿만 저장됩니다:", rulesCheckError);
                setIsModalOpen(false);
                if (selectedGymId) fetchTemplates(selectedGymId);
                toast.success("템플릿이 저장되었습니다. (규칙 테이블이 없어 규칙은 저장되지 않았습니다)");
                return;
            }

            // 3. 기존 규칙 연결 삭제
            if (editingTemplate.id) {
                await supabase.from("salary_template_items").delete().eq("template_id", templateId);
            }

            // 4. 규칙 저장
            for (const rule of editingTemplate.rules) {
                let ruleId = rule.id;

                if (!ruleId) {
                    // 새 규칙: salary_components 처리
                    let compId;
                    const { data: comp, error: compFindError } = await supabase
                        .from("salary_components")
                        .select("id")
                        .eq("gym_id", selectedGymId)
                        .eq("name", rule.name)
                        .single();

                    if (compFindError && compFindError.code !== 'PGRST116') {
                        // PGRST116 = 결과 없음 (정상)
                        console.warn("salary_components 조회 경고:", compFindError);
                    }

                    if (comp) {
                        compId = comp.id;
                    } else {
                        const { data: newComp, error: compError } = await supabase
                            .from("salary_components")
                            .insert({
                                gym_id: selectedGymId,
                                name: rule.name || "기타",
                                type: rule.calculation_type === 'fixed' ? 'fixed' : 'computed'
                            })
                            .select()
                            .single();

                        if (compError) {
                            console.error("salary_components 생성 에러:", compError);
                            // 컴포넌트 생성 실패해도 계속 진행 (compId = null)
                        } else {
                            compId = newComp?.id;
                        }
                    }

                    // 규칙 생성
                    const { data: newRuleData, error: ruleError } = await supabase
                        .from("salary_rules")
                        .insert({
                            gym_id: selectedGymId,
                            component_id: compId || null,
                            name: rule.name || "새 항목",
                            calculation_type: rule.calculation_type,
                            default_parameters: rule.default_parameters
                        })
                        .select()
                        .single();

                    if (ruleError) {
                        console.error("규칙 생성 에러:", ruleError);
                        toast.error(`규칙 "${rule.name}" 저장 실패: ${ruleError.message || JSON.stringify(ruleError)}`);
                        continue; // 다음 규칙으로 진행
                    }
                    ruleId = newRuleData?.id;
                } else {
                    // 기존 규칙 업데이트: calculation_type, default_parameters, name 변경 반영
                    const { error: updateRuleError } = await supabase
                        .from("salary_rules")
                        .update({
                            name: rule.name,
                            calculation_type: rule.calculation_type,
                            default_parameters: rule.default_parameters
                        })
                        .eq("id", ruleId);

                    if (updateRuleError) {
                        console.error("규칙 업데이트 에러:", updateRuleError);
                        toast.error(`규칙 "${rule.name}" 업데이트 실패: ${updateRuleError.message}`);
                    }
                }

                // 템플릿-규칙 연결
                if (ruleId) {
                    const { error: itemError } = await supabase
                        .from("salary_template_items")
                        .insert({
                            template_id: templateId,
                            rule_id: ruleId
                        });

                    if (itemError) {
                        console.error("템플릿-규칙 연결 에러:", itemError);
                    }
                }
            }

            setIsModalOpen(false);
            if (selectedGymId) fetchTemplates(selectedGymId);
            toast.success("저장되었습니다.");

        } catch (error: unknown) {
            console.error("상세 에러:", error);
            const err = error as Error | { message?: string; error?: string };
            const errorMessage = (err as Error)?.message || (err as { error?: string })?.error || JSON.stringify(error) || "알 수 없는 오류가 발생했습니다.";
            toast.error(`저장 실패: ${errorMessage}`);
        }
    };

    const handleDelete = async (templateId: string, templateName: string) => {
        if (!confirm(`"${templateName}" 템플릿을 삭제하시겠습니까?\n\n삭제된 템플릿은 복구할 수 없습니다.`)) {
            return;
        }

        try {
            // 연결된 template_items 먼저 삭제 (CASCADE가 없을 경우 대비)
            await supabase
                .from("salary_template_items")
                .delete()
                .eq("template_id", templateId);

            // 템플릿 삭제
            const { error } = await supabase
                .from("salary_templates")
                .delete()
                .eq("id", templateId);

            if (error) {
                console.error("템플릿 삭제 에러:", error);
                toast.error(`삭제 실패: ${error.message || JSON.stringify(error)}`);
                return;
            }

            toast.success("템플릿이 삭제되었습니다.");
            if (selectedGymId) fetchTemplates(selectedGymId);
        } catch (error: unknown) {
            console.error("삭제 에러:", error);
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    if (isLoading) return <div className="p-4 text-sm text-slate-500">로딩 중...</div>;

    return (
        <div className="space-y-4 xs:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
            {/* 상단 액션 바 */}
            <div className="flex flex-col gap-3 xs:gap-4 md:gap-6 bg-white p-3 xs:p-4 sm:p-6 rounded-xl xs:rounded-2xl sm:rounded-[32px] border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2 xs:gap-3">
                        <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-lg xs:rounded-xl flex items-center justify-center shrink-0">
                            <Settings className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <span className="break-keep">급여 템플릿 설계</span>
                    </h3>
                    <p className="text-xs xs:text-sm text-slate-400 font-bold ml-10 xs:ml-12 sm:ml-13 break-keep">
                        직군별, 고용 형태별 최적화된 급여 체계를 템플릿으로 미리 구성합니다.
                    </p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="h-10 xs:h-11 sm:h-12 px-4 xs:px-5 sm:px-6 bg-[#2F80ED] hover:bg-[#1e5bb8] text-white rounded-xl xs:rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 xs:gap-2 transition-all hover:-translate-y-1 text-xs xs:text-sm w-full md:w-auto"
                >
                    <Plus className="w-4 h-4 xs:w-5 xs:h-5 shrink-0" />
                    <span className="hidden xs:inline">새 템플릿 만들기</span>
                    <span className="xs:hidden">템플릿 추가</span>
                </Button>
            </div>

            {/* 템플릿 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 lg:gap-8">
                {templates.map(template => (
                    <Card key={template.id} className="group hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 border-none rounded-xl xs:rounded-2xl sm:rounded-[40px] overflow-hidden bg-white shadow-lg shadow-slate-100/50 flex flex-col h-full relative">
                        <div className="absolute top-0 left-0 w-full h-1 xs:h-2 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CardHeader className="p-3 xs:p-4 sm:p-6 lg:p-8 pb-2 xs:pb-3 sm:pb-4">
                            <CardTitle className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5 xs:space-y-1 min-w-0 flex-1">
                                    <div className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors truncate">
                                        {template.name}
                                    </div>
                                    <div className="text-xs xs:text-sm font-bold text-slate-400 truncate">
                                        {template.description || "등록된 설명이 없습니다."}
                                    </div>
                                </div>
                                <div className="flex gap-0.5 xs:gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(template); }}
                                        className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-lg xs:rounded-xl hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-all"
                                    >
                                        <Edit className="w-4 h-4 xs:w-5 xs:h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(template.id, template.name); }}
                                        className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-lg xs:rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4 xs:w-5 xs:h-5" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 xs:p-4 sm:p-6 lg:p-8 pt-2 xs:pt-3 sm:pt-4 flex-1">
                            <div className="space-y-2 xs:space-y-3">
                                {template.items?.map((item, idx) => (
                                    <div key={idx} className="flex flex-col xs:flex-row justify-between xs:items-center gap-1 xs:gap-2 p-2 xs:p-3 sm:p-4 bg-slate-50 group-hover:bg-blue-50/30 rounded-lg xs:rounded-xl sm:rounded-2xl border border-slate-50 group-hover:border-blue-100 transition-all duration-300">
                                        <div className="flex items-center gap-1.5 xs:gap-2">
                                            <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-blue-600 opacity-40 shrink-0"></div>
                                            <span className="font-black text-slate-700 text-xs xs:text-sm tracking-tight truncate">{item.rule.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 xs:gap-2 ml-2.5 xs:ml-0">
                                            <span className="font-black text-xs xs:text-sm text-blue-600">
                                                {formatRuleValue(item.rule)}
                                            </span>
                                            <Badge variant="outline" className="font-black text-[8px] xs:text-[10px] tracking-tighter bg-white border-slate-200 text-slate-400 rounded-md xs:rounded-lg group-hover:border-blue-200 group-hover:text-blue-500 transition-colors px-1 xs:px-1.5">
                                                {getCalculationLabel(item.rule.calculation_type)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {(!template.items || template.items.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-6 xs:py-8 sm:py-10 bg-slate-50 rounded-xl xs:rounded-2xl sm:rounded-[32px] border border-dashed border-slate-200">
                                        <FileText className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-slate-200 mb-1.5 xs:mb-2" />
                                        <p className="text-[10px] xs:text-xs font-bold text-slate-400">구성 항목이 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 빈 상태 안내 */}
            {templates.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 xs:py-24 sm:py-32 lg:py-40 px-4 bg-slate-50 rounded-xl xs:rounded-2xl sm:rounded-[40px] border border-dashed border-slate-200">
                    <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mb-4 xs:mb-5 sm:mb-6 shadow-sm">
                        <FileText className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-slate-200" />
                    </div>
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 tracking-tighter mb-1.5 xs:mb-2 text-center">등록된 템플릿이 없습니다</h3>
                    <p className="text-xs xs:text-sm text-slate-400 font-bold mb-5 xs:mb-6 sm:mb-8 max-w-sm text-center px-2">
                        직원별 고용 형태에 맞는 급여 규칙을 템플릿으로 만들어두시면 정산 작업이 훨씬 간편해집니다.
                    </p>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="h-10 xs:h-12 sm:h-14 px-5 xs:px-6 sm:px-8 bg-[#2F80ED] hover:bg-[#1e5bb8] text-white rounded-xl xs:rounded-2xl sm:rounded-[20px] font-black shadow-xl shadow-blue-200 flex items-center gap-1.5 xs:gap-2 transition-all hover:-translate-y-1 text-xs xs:text-sm"
                    >
                        <Plus className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                        <span className="hidden xs:inline">첫 번째 템플릿 만들기</span>
                        <span className="xs:hidden">템플릿 추가</span>
                    </Button>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl xs:rounded-2xl sm:rounded-[40px] border-none shadow-2xl p-0">
                    <div className="p-3 xs:p-4 sm:p-6 lg:p-10 space-y-4 xs:space-y-6 lg:space-y-8">
                        <DialogHeader>
                            <DialogTitle className="text-xl xs:text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
                                {editingTemplate.id ? "템플릿 정보 수정" : "새로운 급여 템플릿"}
                            </DialogTitle>
                            <DialogDescription className="text-xs xs:text-sm text-slate-400 font-bold">
                                템플릿 이름과 설명을 입력하고, 급여를 구성하는 규칙들을 추가하세요.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
                            <div className="space-y-1.5 xs:space-y-2">
                                <Label className="text-[10px] xs:text-xs font-black text-slate-400 uppercase tracking-widest ml-0.5 xs:ml-1">Template Name</Label>
                                <Input
                                    value={editingTemplate.name}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setEditingTemplate(prev => ({...prev, name: val}));
                                    }}
                                    placeholder="예: 정규직 트레이너 A형"
                                    className="h-10 xs:h-11 sm:h-12 bg-slate-50 border-none rounded-xl xs:rounded-2xl px-3 xs:px-4 sm:px-5 font-bold text-sm xs:text-base focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5 xs:space-y-2">
                                <Label className="text-[10px] xs:text-xs font-black text-slate-400 uppercase tracking-widest ml-0.5 xs:ml-1">Description</Label>
                                <Input
                                    value={editingTemplate.description}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setEditingTemplate(prev => ({...prev, description: val}));
                                    }}
                                    placeholder="간단한 설명을 입력하세요"
                                    className="h-10 xs:h-11 sm:h-12 bg-slate-50 border-none rounded-xl xs:rounded-2xl px-3 xs:px-4 sm:px-5 font-bold text-sm xs:text-base focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 xs:space-y-6 pt-3 xs:pt-4 border-t border-slate-100">
                            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-end gap-2 xs:gap-3">
                                <div className="space-y-0.5 xs:space-y-1">
                                    <Label className="text-base xs:text-lg sm:text-xl font-black text-slate-900 tracking-tight">급여 구성 규칙</Label>
                                    <p className="text-xs xs:text-sm text-slate-400 font-medium">이 템플릿에 포함될 모든 급여 항목을 설정하세요.</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAddRule}
                                    className="h-8 xs:h-9 sm:h-10 rounded-lg xs:rounded-xl border-blue-100 text-blue-600 font-black px-3 xs:px-4 hover:bg-blue-50 text-xs xs:text-sm w-full xs:w-auto"
                                >
                                    <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-1 xs:mr-2" /> 규칙 추가
                                </Button>
                            </div>
                            
                            <div className="space-y-3 xs:space-y-4">
                                {editingTemplate.rules.map((rule, index) => (
                                    <div key={index} className="bg-slate-50/50 p-3 xs:p-4 sm:p-6 rounded-xl xs:rounded-2xl sm:rounded-[28px] border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100">
                                        <div className="flex gap-2 xs:gap-3 sm:gap-4 items-start">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5 xs:ml-1">Rule Name</Label>
                                                    <div className="flex flex-col xs:flex-row gap-1.5 xs:gap-2">
                                                        <Select
                                                            value={PRESET_RULES.some(p => p.value === rule.name) ? rule.name : "custom"}
                                                            onValueChange={(val) => handlePresetChange(index, val)}
                                                        >
                                                            <SelectTrigger className="h-9 xs:h-10 sm:h-11 bg-white border-slate-200 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm">
                                                                <SelectValue placeholder="항목 선택" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white rounded-lg xs:rounded-xl border-none shadow-2xl">
                                                                {PRESET_RULES.map(preset => (
                                                                    <SelectItem key={preset.value} value={preset.value} className="rounded-lg font-bold text-xs xs:text-sm">
                                                                        {preset.label}
                                                                    </SelectItem>
                                                                ))}
                                                                <SelectItem value="custom" className="rounded-lg font-bold border-t mt-1 text-blue-600 text-xs xs:text-sm">직접 입력</SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        {(!PRESET_RULES.some(p => p.value === rule.name) || rule.name === "") && (
                                                            <Input
                                                                value={rule.name}
                                                                onChange={e => handleUpdateRule(index, 'name', e.target.value)}
                                                                placeholder="항목명 입력"
                                                                className="h-9 xs:h-10 sm:h-11 bg-white border-slate-200 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5 xs:ml-1">Calculation Type</Label>
                                                    <Select
                                                        value={rule.calculation_type}
                                                        onValueChange={val => {
                                                            const isFixedType = ['base_salary', 'allowance', 'bonus', 'etc'].includes(val);
                                                            const newParams = isFixedType
                                                                ? { amount: 0 }
                                                                : { rate: 0 };
                                                            // functional update로 stale closure 방지
                                                            setEditingTemplate(prev => {
                                                                const newRules = [...prev.rules];
                                                                newRules[index] = {
                                                                    ...newRules[index],
                                                                    calculation_type: val as CalculationType,
                                                                    default_parameters: newParams
                                                                };
                                                                return { ...prev, rules: newRules };
                                                            });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-9 xs:h-10 sm:h-11 bg-white border-slate-200 rounded-lg xs:rounded-xl font-bold text-xs xs:text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white rounded-lg xs:rounded-xl border-none shadow-2xl">
                                                            <SelectItem value="base_salary" className="font-bold rounded-lg text-xs xs:text-sm">기본급 (매월 고정)</SelectItem>
                                                            <SelectItem value="allowance" className="font-bold rounded-lg text-xs xs:text-sm">지원금 (매월 고정)</SelectItem>
                                                            <SelectItem value="hourly" className="font-bold rounded-lg text-xs xs:text-sm">시급 (시급 × 근무시간)</SelectItem>
                                                            <SelectItem value="class_fee" className="font-bold rounded-lg text-xs xs:text-sm">수업료 (횟수 × 단가)</SelectItem>
                                                            <SelectItem value="sales_incentive" className="font-bold rounded-lg text-xs xs:text-sm">매출인센티브 (매출 × %)</SelectItem>
                                                            <SelectItem value="personal_incentive" className="font-bold rounded-lg text-xs xs:text-sm">개인인센티브 (개인매출 × %)</SelectItem>
                                                            <SelectItem value="bonus" className="font-bold rounded-lg text-xs xs:text-sm">상금 (고정 금액)</SelectItem>
                                                            <SelectItem value="etc" className="font-bold rounded-lg text-xs xs:text-sm">기타 (고정 금액)</SelectItem>
                                                            <SelectItem value="tax_deduction" className="font-bold rounded-lg text-xs xs:text-sm text-red-600">세금 공제 (총급여 × %)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-8 w-8 xs:h-9 xs:w-9 sm:h-11 sm:w-11 mt-5 xs:mt-6 rounded-lg xs:rounded-xl transition-all shrink-0"
                                                onClick={() => handleRemoveRule(index)}
                                            >
                                                <Trash2 className="w-4 h-4 xs:w-5 xs:h-5" />
                                            </Button>
                                        </div>

                                        {/* 금액/단가/요율 입력 영역 */}
                                        <div className="mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-slate-100">
                                            {['base_salary', 'allowance', 'bonus', 'etc'].includes(rule.calculation_type) && (
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-blue-500 uppercase tracking-widest ml-0.5 xs:ml-1">고정 금액</Label>
                                                    <div className="relative max-w-full xs:max-w-xs">
                                                        <Input
                                                            type="number"
                                                            value={rule.default_parameters?.amount || ""}
                                                            onChange={e => handleUpdateRule(index, 'default_parameters', { ...rule.default_parameters, amount: Number(e.target.value) })}
                                                            placeholder="0"
                                                            className="h-9 xs:h-10 sm:h-11 bg-white border-slate-200 rounded-lg xs:rounded-xl font-bold text-right pr-10 xs:pr-12 text-xs xs:text-sm"
                                                        />
                                                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3 text-[10px] xs:text-xs font-bold text-slate-400">원</span>
                                                    </div>
                                                </div>
                                            )}

                                            {rule.calculation_type === 'hourly' && (
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-0.5 xs:ml-1">시급</Label>
                                                    <div className="relative max-w-full xs:max-w-xs">
                                                        <Input
                                                            type="number"
                                                            value={rule.default_parameters?.rate || ""}
                                                            onChange={e => handleUpdateRule(index, 'default_parameters', { ...rule.default_parameters, rate: Number(e.target.value) })}
                                                            placeholder="0"
                                                            className="h-9 xs:h-10 sm:h-11 bg-white border-slate-200 rounded-lg xs:rounded-xl font-bold text-right pr-10 xs:pr-12 text-xs xs:text-sm"
                                                        />
                                                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3 text-[10px] xs:text-xs font-bold text-slate-400">원</span>
                                                    </div>
                                                    <p className="text-[9px] xs:text-[10px] text-slate-400 ml-0.5 xs:ml-1">알바, 청소이모 등 시급제 근무자용 (예: 12,000원/시간 × 8시간 = 96,000원)</p>
                                                </div>
                                            )}

                                            {rule.calculation_type === 'class_fee' && (
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-violet-500 uppercase tracking-widest ml-0.5 xs:ml-1">단가 (1회당)</Label>
                                                    <div className="relative max-w-full xs:max-w-xs">
                                                        <Input
                                                            type="number"
                                                            value={rule.default_parameters?.rate || ""}
                                                            onChange={e => handleUpdateRule(index, 'default_parameters', { ...rule.default_parameters, rate: Number(e.target.value) })}
                                                            placeholder="0"
                                                            className="h-9 xs:h-10 sm:h-11 bg-white border-slate-200 rounded-lg xs:rounded-xl font-bold text-right pr-10 xs:pr-12 text-xs xs:text-sm"
                                                        />
                                                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3 text-[10px] xs:text-xs font-bold text-slate-400">원</span>
                                                    </div>
                                                    <p className="text-[9px] xs:text-[10px] text-slate-400 ml-0.5 xs:ml-1">PT 수업료 (예: PT IN 20,000원/회 × 50회 = 1,000,000원)</p>
                                                </div>
                                            )}

                                            {(rule.calculation_type === 'sales_incentive' || rule.calculation_type === 'personal_incentive') && (
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-orange-500 uppercase tracking-widest ml-0.5 xs:ml-1">인센티브 요율</Label>
                                                    <div className="relative max-w-full xs:max-w-xs">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={rule.default_parameters?.rate || ""}
                                                            onChange={e => handleUpdateRule(index, 'default_parameters', { ...rule.default_parameters, rate: Number(e.target.value) })}
                                                            placeholder="0"
                                                            className="h-9 xs:h-10 sm:h-11 bg-white border-slate-200 rounded-lg xs:rounded-xl font-bold text-right pr-10 xs:pr-12 text-xs xs:text-sm"
                                                        />
                                                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3 text-[10px] xs:text-xs font-bold text-slate-400">%</span>
                                                    </div>
                                                    <p className="text-[9px] xs:text-[10px] text-slate-400 ml-0.5 xs:ml-1">
                                                        개인 PT 매출 기준으로 계산됩니다
                                                    </p>
                                                </div>
                                            )}

                                            {rule.calculation_type === 'tax_deduction' && (
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <Label className="text-[9px] xs:text-[10px] font-black text-red-500 uppercase tracking-widest ml-0.5 xs:ml-1">공제 요율</Label>
                                                    <div className="relative max-w-full xs:max-w-xs">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={rule.default_parameters?.rate || ""}
                                                            onChange={e => handleUpdateRule(index, 'default_parameters', { ...rule.default_parameters, rate: Number(e.target.value) })}
                                                            placeholder="0"
                                                            className="h-9 xs:h-10 sm:h-11 bg-white border-red-200 rounded-lg xs:rounded-xl font-bold text-right pr-10 xs:pr-12 text-xs xs:text-sm focus:ring-red-100"
                                                        />
                                                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3 text-[10px] xs:text-xs font-bold text-red-400">%</span>
                                                    </div>
                                                    <p className="text-[9px] xs:text-[10px] text-red-400 ml-0.5 xs:ml-1">
                                                        총 급여에서 자동 공제됩니다 (예: 소득세 3.3%, 국민연금 4.5%)
                                                    </p>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                ))}
                                {editingTemplate.rules.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 xs:py-10 sm:py-14 bg-slate-50 rounded-xl xs:rounded-2xl sm:rounded-[32px] border border-dashed border-slate-200">
                                        <Settings className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 text-slate-200 mb-2 xs:mb-3 sm:mb-4" />
                                        <p className="text-xs xs:text-sm font-bold text-slate-400 text-center px-4">급여 항목을 추가하여 템플릿을 구성하세요.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-4 xs:pt-6 sm:pt-8 border-t border-slate-100 flex flex-col xs:flex-row gap-2 xs:gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="h-10 xs:h-12 sm:h-14 px-4 xs:px-6 sm:px-8 rounded-xl xs:rounded-2xl font-black text-slate-400 hover:bg-slate-50 text-xs xs:text-sm order-2 xs:order-1"
                            >
                                취소하기
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="h-10 xs:h-12 sm:h-14 px-5 xs:px-8 sm:px-10 bg-[#2F80ED] hover:bg-[#1e5bb8] text-white rounded-xl xs:rounded-2xl font-black shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 text-xs xs:text-sm order-1 xs:order-2"
                            >
                                템플릿 저장하기
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getCalculationLabel(type: string) {
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
        // 이전 버전 호환성
        case 'fixed': return '고정급';
        case 'percentage_total': return '매출인센티브';
        case 'percentage_personal': return '개인인센티브';
        default: return type;
    }
}

function formatRuleValue(rule: SalaryRule): string {
    const params = rule.default_parameters || {};

    switch(rule.calculation_type) {
        case 'base_salary':
        case 'allowance':
        case 'bonus':
        case 'etc':
        case 'fixed': // 이전 버전 호환성
            return params.amount ? `${Number(params.amount).toLocaleString()}원` : '-';
        case 'hourly':
            return params.rate ? `${Number(params.rate).toLocaleString()}원/시간` : '-';
        case 'class_fee':
            return params.rate ? `${Number(params.rate).toLocaleString()}원/회` : '-';
        case 'sales_incentive':
        case 'personal_incentive':
        case 'percentage_total': // 이전 버전 호환성
        case 'percentage_personal': // 이전 버전 호환성
            return params.rate ? `${params.rate}%` : '-';
        case 'tax_deduction':
            return params.rate ? `-${params.rate}%` : '-';
        default:
            return '-';
    }
}
