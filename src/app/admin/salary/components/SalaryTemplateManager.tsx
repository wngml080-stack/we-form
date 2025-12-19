"use client";

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
                    alert("급여 관련 테이블이 아직 생성되지 않은 것 같습니다. 관리자에게 문의하거나 SQL 마이그레이션을 실행해주세요.");
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
                alert("지점을 선택해주세요.");
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
            alert("저장되었습니다.");

        } catch (error: unknown) {
            console.error("상세 에러:", error);
            const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
            alert(`저장 실패: ${errorMessage}`);
        }
    };

    if (isLoading) return <div>로딩 중...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-700">급여 템플릿 목록</h3>
                <Button onClick={() => handleOpenModal()} className="bg-[#2F80ED] hover:bg-[#1e5bb8]">
                    <Plus className="w-4 h-4 mr-2" /> 새 템플릿 만들기
                </Button>
            </div>

            {/* 템플릿 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow border-2 hover:border-[#2F80ED]/30 cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#2F80ED]"></div>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{template.name}</span>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenModal(template); }}>
                                    <Edit className="w-4 h-4 text-gray-400 hover:text-[#2F80ED]" />
                                </Button>
                            </CardTitle>
                            <CardDescription>{template.description || "설명 없음"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {template.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border">
                                        <span className="font-medium">{item.rule.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {getCalculationLabel(item.rule.calculation_type)}
                                        </Badge>
                                    </div>
                                ))}
                                {(!template.items || template.items.length === 0) && (
                                    <div className="text-xs text-gray-400 text-center py-2">설정된 규칙이 없습니다.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 빈 상태 안내 (Empty State) */}
            {templates.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">등록된 급여 템플릿이 없습니다</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        직원들에게 적용할 급여 체계(기본급, 수업료, 인센티브 등)를 미리 템플릿으로 만들어두세요.
                    </p>
                    <Button onClick={() => handleOpenModal()} className="bg-[#2F80ED] hover:bg-[#1e5bb8]">
                        <Plus className="w-4 h-4 mr-2" /> 첫 번째 템플릿 만들기
                    </Button>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate.id ? "템플릿 수정" : "새 템플릿 생성"}</DialogTitle>
                        <DialogDescription className="sr-only">급여 템플릿을 설정합니다</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>템플릿 이름</Label>
                            <Input 
                                value={editingTemplate.name} 
                                onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                placeholder="예: 정규직 트레이너 A형"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>설명</Label>
                            <Input 
                                value={editingTemplate.description} 
                                onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                                placeholder="템플릿에 대한 간단한 설명"
                            />
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <Label className="text-base font-bold">급여 구성요소 (Rules)</Label>
                                <Button size="sm" variant="outline" onClick={handleAddRule}>
                                    <Plus className="w-4 h-4 mr-1" /> 항목 추가
                                </Button>
                            </div>
                            
                            <div className="space-y-4">
                                {editingTemplate.rules.map((rule, index) => (
                                    <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border relative group">
                                        <div className="grid grid-cols-2 gap-4 flex-1">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">항목 선택</Label>
                                                <div className="flex gap-2">
                                                    <Select 
                                                        value={PRESET_RULES.some(p => p.value === rule.name) ? rule.name : "custom"} 
                                                        onValueChange={(val) => handlePresetChange(index, val)}
                                                    >
                                                        <SelectTrigger className="h-9 w-[140px] bg-white">
                                                            <SelectValue placeholder="항목 선택" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            {PRESET_RULES.map(preset => (
                                                                <SelectItem key={preset.value} value={preset.value}>
                                                                    {preset.label}
                                                                </SelectItem>
                                                            ))}
                                                            <SelectItem value="custom">직접 입력</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    
                                                    {(!PRESET_RULES.some(p => p.value === rule.name) || rule.name === "") && (
                                                        <Input 
                                                            value={rule.name}
                                                            onChange={e => handleUpdateRule(index, 'name', e.target.value)}
                                                            placeholder="항목명 입력"
                                                            className="h-9 flex-1 bg-white"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">계산 방식</Label>
                                                <Select 
                                                    value={rule.calculation_type}
                                                    onValueChange={val => handleUpdateRule(index, 'calculation_type', val)}
                                                >
                                                    <SelectTrigger className="h-9 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white">
                                                        <SelectItem value="fixed">고정급 (매월 고정)</SelectItem>
                                                        <SelectItem value="hourly">시급제 (시간 x 단가)</SelectItem>
                                                        <SelectItem value="percentage_total">총매출 인센티브 (%)</SelectItem>
                                                        <SelectItem value="percentage_personal">개인매출 인센티브 (%)</SelectItem>
                                                        <SelectItem value="tiered">구간별 (매출 연동)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 mt-6"
                                            onClick={() => handleRemoveRule(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {editingTemplate.rules.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                                        급여 항목을 추가해주세요.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
                        <Button onClick={handleSave} className="bg-[#2F80ED]">저장하기</Button>
                    </DialogFooter>
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
