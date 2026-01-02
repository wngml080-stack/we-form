"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAdminFilter } from "@/contexts/AdminFilterContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// 타입 정의
type SalaryRule = {
    id?: string;
    name: string;
    calculation_type: 'fixed' | 'hourly' | 'percentage_total' | 'percentage_personal' | 'tiered';
    default_parameters: any;
};

type SalaryTemplate = {
    id: string;
    name: string;
    description: string | null;
    items?: { rule: SalaryRule }[];
};

// 프리셋 정의
const PRESET_RULES = [
    { label: "기본급", value: "기본급", defaultType: "fixed" },
    { label: "식대", value: "식대", defaultType: "fixed" },
    { label: "영업지원금", value: "영업지원금", defaultType: "fixed" },
    { label: "직책수당 (팀장)", value: "직책수당 (팀장)", defaultType: "fixed" },
    { label: "매니저 수당", value: "매니저 수당", defaultType: "fixed" },
    { label: "PT IN (근무내)", value: "PT IN (근무내)", defaultType: "hourly" },
    { label: "PT OUT (근무외)", value: "PT OUT (근무외)", defaultType: "hourly" },
    { label: "PT (주말)", value: "PT (주말)", defaultType: "hourly" },
    { label: "BC (바디챌린지)", value: "BC (바디챌린지)", defaultType: "hourly" },
    { label: "본사 A클래스 상금", value: "본사 A클래스 상금", defaultType: "fixed" },
    { label: "상,하반기&지사상금", value: "상,하반기&지사상금", defaultType: "fixed" },
    { label: "맞다이 승리 인센", value: "맞다이 승리 인센", defaultType: "fixed" },
    { label: "팀장 승리 인센", value: "팀장 승리 인센", defaultType: "fixed" },
    { label: "바디챌린지 상금", value: "바디챌린지 상금", defaultType: "fixed" },
    { label: "기타", value: "기타", defaultType: "fixed" },
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

    useEffect(() => {
        if (filterInitialized && selectedGymId) {
            fetchTemplates(selectedGymId);
        }
    }, [filterInitialized, selectedGymId]);

    const fetchTemplates = async (gymId: string) => {
        try {
            // 템플릿과 연결된 규칙들을 가져옵니다 (조인 쿼리)
            const { data, error } = await supabase
                .from("salary_templates")
                .select(`
                    *,
                    items:salary_template_items (
                        rule:salary_rules (*)
                    )
                `)
                .eq("gym_id", gymId)
                .order("created_at", { ascending: false });

            if (error) {
                // 에러 상세 로깅 (개발용)
                console.error("Supabase Select Error:", error);
                // 테이블이 존재하지 않는 경우 (42P01) 등에 대한 처리 가능
                if (error.code === '42P01') {
                    toast.error("급여 관련 테이블이 아직 생성되지 않은 것 같습니다. 관리자에게 문의하거나 SQL 마이그레이션을 실행해주세요.");
                }
                throw error;
            }
            setTemplates(data || []);
        } catch (error: unknown) {
            console.error("템플릿 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (template?: SalaryTemplate) => {
        if (template) {
            setEditingTemplate({
                id: template.id,
                name: template.name,
                description: template.description || "",
                rules: template.items?.map(i => i.rule) || []
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
                // 이름과 기본 타입을 함께 업데이트
                const newRules = [...editingTemplate.rules];
                newRules[index] = { 
                    ...newRules[index], 
                    name: preset.value,
                    // @ts-ignore
                    calculation_type: preset.defaultType 
                };
                setEditingTemplate(prev => ({ ...prev, rules: newRules }));
            }
        }
    };

    const handleUpdateRule = (index: number, field: keyof SalaryRule, value: any) => {
        const newRules = [...editingTemplate.rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setEditingTemplate(prev => ({ ...prev, rules: newRules }));
    };

    const handleRemoveRule = (index: number) => {
        const newRules = editingTemplate.rules.filter((_, i) => i !== index);
        setEditingTemplate(prev => ({ ...prev, rules: newRules }));
    };

    const handleSave = async () => {
        try {
            if (!selectedGymId) {
                toast.warning("지점을 선택해주세요.");
                return;
            }

            // 1. 템플릿 저장/수정
            let templateId = editingTemplate.id;

            if (!templateId) {
                const { data, error } = await supabase
                    .from("salary_templates")
                    .insert({
                        gym_id: selectedGymId,
                        name: editingTemplate.name,
                        description: editingTemplate.description
                    })
                    .select()
                    .single();
                if (error) throw error;
                templateId = data.id;
            } else {
                await supabase
                    .from("salary_templates")
                    .update({
                        name: editingTemplate.name,
                        description: editingTemplate.description
                    })
                    .eq("id", templateId);
            }

            // 2. 규칙 저장
            if (editingTemplate.id) {
                await supabase.from("salary_template_items").delete().eq("template_id", templateId);
            }

            for (const rule of editingTemplate.rules) {
                let ruleId = rule.id;
                
                if (!ruleId) {
                    let compId;
                    const { data: comp } = await supabase.from("salary_components").select("id").eq("gym_id", selectedGymId).eq("name", rule.name).single();
                    
                    if (comp) {
                        compId = comp.id;
                    } else {
                        const { data: newComp, error: compError } = await supabase.from("salary_components").insert({
                            gym_id: selectedGymId,
                            name: rule.name || "기타", 
                            type: rule.calculation_type === 'fixed' ? 'fixed' : 'computed'
                        }).select().single();
                        
                        if (compError) throw compError;
                        compId = newComp.id;
                    }

                    const { data: newRuleData, error: ruleError } = await supabase.from("salary_rules").insert({
                        gym_id: selectedGymId,
                        component_id: compId,
                        name: rule.name || "새 항목",
                        calculation_type: rule.calculation_type,
                        default_parameters: rule.default_parameters
                    }).select().single();
                    
                    if (ruleError) throw ruleError;
                    ruleId = newRuleData.id;
                }

                const { error: itemError } = await supabase.from("salary_template_items").insert({
                    template_id: templateId,
                    rule_id: ruleId
                });
                
                if (itemError) throw itemError;
            }

            setIsModalOpen(false);
            if (selectedGymId) fetchTemplates(selectedGymId);
            toast.success("저장되었습니다.");

        } catch (error: unknown) {
            console.error("상세 에러:", error);
            const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
            toast.error(`저장 실패: ${errorMessage}`);
        }
    };

    if (isLoading) return <div>로딩 중...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 상단 액션 바 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Settings className="w-6 h-6 text-blue-600" />
                        </div>
                        급여 템플릿 설계
                    </h3>
                    <p className="text-sm text-slate-400 font-bold ml-13">
                        직군별, 고용 형태별 최적화된 급여 체계를 템플릿으로 미리 구성합니다.
                    </p>
                </div>
                <Button 
                    onClick={() => handleOpenModal()} 
                    className="h-12 px-6 bg-[#2F80ED] hover:bg-[#1e5bb8] text-white rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center gap-2 transition-all hover:-translate-y-1"
                >
                    <Plus className="w-5 h-5" /> 새 템플릿 만들기
                </Button>
            </div>

            {/* 템플릿 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {templates.map(template => (
                    <Card key={template.id} className="group hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 border-none rounded-[40px] overflow-hidden bg-white shadow-lg shadow-slate-100/50 flex flex-col h-full relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="text-2xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">
                                        {template.name}
                                    </div>
                                    <div className="text-sm font-bold text-slate-400">
                                        {template.description || "등록된 설명이 없습니다."}
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(template); }}
                                    className="w-10 h-10 rounded-xl hover:bg-blue-50 text-slate-300 hover:text-blue-600 transition-all"
                                >
                                    <Edit className="w-5 h-5" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 flex-1">
                            <div className="space-y-3">
                                {template.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 group-hover:bg-blue-50/30 rounded-2xl border border-slate-50 group-hover:border-blue-100 transition-all duration-300">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 opacity-40"></div>
                                            <span className="font-black text-slate-700 text-sm tracking-tight">{item.rule.name}</span>
                                        </div>
                                        <Badge variant="outline" className="font-black text-[10px] tracking-tighter bg-white border-slate-200 text-slate-400 rounded-lg group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                                            {getCalculationLabel(item.rule.calculation_type)}
                                        </Badge>
                                    </div>
                                ))}
                                {(!template.items || template.items.length === 0) && (
                                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                        <FileText className="w-8 h-8 text-slate-200 mb-2" />
                                        <p className="text-xs font-bold text-slate-400">구성 항목이 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 빈 상태 안내 */}
            {templates.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-40 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <FileText className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">등록된 템플릿이 없습니다</h3>
                    <p className="text-slate-400 font-bold mb-8 max-w-sm text-center">
                        직원별 고용 형태에 맞는 급여 규칙을 템플릿으로 만들어두시면 정산 작업이 훨씬 간편해집니다.
                    </p>
                    <Button 
                        onClick={() => handleOpenModal()} 
                        className="h-14 px-8 bg-[#2F80ED] hover:bg-[#1e5bb8] text-white rounded-[20px] font-black shadow-xl shadow-blue-200 flex items-center gap-2 transition-all hover:-translate-y-1"
                    >
                        <Plus className="w-6 h-6" /> 첫 번째 템플릿 만들기
                    </Button>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[40px] border-none shadow-2xl p-0">
                    <div className="p-8 lg:p-10 space-y-8">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">
                                {editingTemplate.id ? "템플릿 정보 수정" : "새로운 급여 템플릿"}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold">
                                템플릿 이름과 설명을 입력하고, 급여를 구성하는 규칙들을 추가하세요.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</Label>
                                <Input 
                                    value={editingTemplate.name} 
                                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                    placeholder="예: 정규직 트레이너 A형"
                                    className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</Label>
                                <Input 
                                    value={editingTemplate.description} 
                                    onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                                    placeholder="간단한 설명을 입력하세요"
                                    className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <Label className="text-xl font-black text-slate-900 tracking-tight">급여 구성 규칙</Label>
                                    <p className="text-sm text-slate-400 font-medium">이 템플릿에 포함될 모든 급여 항목을 설정하세요.</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleAddRule}
                                    className="h-10 rounded-xl border-blue-100 text-blue-600 font-black px-4 hover:bg-blue-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> 규칙 추가
                                </Button>
                            </div>
                            
                            <div className="space-y-4">
                                {editingTemplate.rules.map((rule, index) => (
                                    <div key={index} className="flex gap-4 items-start bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rule Name</Label>
                                                <div className="flex gap-2">
                                                    <Select 
                                                        value={PRESET_RULES.some(p => p.value === rule.name) ? rule.name : "custom"} 
                                                        onValueChange={(val) => handlePresetChange(index, val)}
                                                    >
                                                        <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl font-bold">
                                                            <SelectValue placeholder="항목 선택" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white rounded-xl border-none shadow-2xl">
                                                            {PRESET_RULES.map(preset => (
                                                                <SelectItem key={preset.value} value={preset.value} className="rounded-lg font-bold">
                                                                    {preset.label}
                                                                </SelectItem>
                                                            ))}
                                                            <SelectItem value="custom" className="rounded-lg font-bold border-t mt-1 text-blue-600">직접 입력</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    
                                                    {(!PRESET_RULES.some(p => p.value === rule.name) || rule.name === "") && (
                                                        <Input 
                                                            value={rule.name}
                                                            onChange={e => handleUpdateRule(index, 'name', e.target.value)}
                                                            placeholder="항목명 입력"
                                                            className="h-11 bg-white border-slate-200 rounded-xl font-bold"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calculation Type</Label>
                                                <Select 
                                                    value={rule.calculation_type}
                                                    onValueChange={val => handleUpdateRule(index, 'calculation_type', val)}
                                                >
                                                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white rounded-xl border-none shadow-2xl">
                                                        <SelectItem value="fixed" className="font-bold rounded-lg">고정급 (매월 고정)</SelectItem>
                                                        <SelectItem value="hourly" className="font-bold rounded-lg">시급제 (시간 x 단가)</SelectItem>
                                                        <SelectItem value="percentage_total" className="font-bold rounded-lg">총매출 인센티브 (%)</SelectItem>
                                                        <SelectItem value="percentage_personal" className="font-bold rounded-lg">개인매출 인센티브 (%)</SelectItem>
                                                        <SelectItem value="tiered" className="font-bold rounded-lg">구간별 (매출 연동)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-11 w-11 mt-6 rounded-xl transition-all"
                                            onClick={() => handleRemoveRule(index)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                                {editingTemplate.rules.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-14 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                        <Settings className="w-10 h-10 text-slate-200 mb-4" />
                                        <p className="text-sm font-bold text-slate-400">급여 항목을 추가하여 템플릿을 구성하세요.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-8 border-t border-slate-100 flex gap-3">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsModalOpen(false)}
                                className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:bg-slate-50"
                            >
                                취소하기
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                className="h-14 px-10 bg-[#2F80ED] hover:bg-[#1e5bb8] text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all hover:-translate-y-1"
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
        case 'fixed': return '고정급';
        case 'hourly': return '시급제';
        case 'percentage_total': return '매출 인센티브';
        case 'percentage_personal': return '개인 인센티브';
        case 'tiered': return '구간별';
        default: return type;
    }
}
