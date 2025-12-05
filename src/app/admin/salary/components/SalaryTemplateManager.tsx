"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function SalaryTemplateManager() {
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

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: staff } = await supabase
                .from("staffs")
                .select("gym_id")
                .eq("user_id", user.id)
                .single();
            
            if (!staff) return;

            // 템플릿과 연결된 규칙들을 가져옵니다 (조인 쿼리)
            const { data, error } = await supabase
                .from("salary_templates")
                .select(`
                    *,
                    items:salary_template_items (
                        rule:salary_rules (*)
                    )
                `)
                .eq("gym_id", staff.gym_id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
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
        // 새 규칙 추가 (임시)
        const newRule: SalaryRule = {
            name: "새 급여 항목",
            calculation_type: 'fixed',
            default_parameters: { amount: 0 }
        };
        setEditingTemplate(prev => ({
            ...prev,
            rules: [...prev.rules, newRule]
        }));
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: staff } = await supabase.from("staffs").select("gym_id").eq("user_id", user.id).single();
            if (!staff) return;

            // 1. 템플릿 저장/수정
            let templateId = editingTemplate.id;

            if (!templateId) {
                const { data, error } = await supabase
                    .from("salary_templates")
                    .insert({
                        gym_id: staff.gym_id,
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

            // 2. 규칙 저장 (단순화를 위해 기존 매핑 삭제 후 재생성 방식 사용)
            // 실제로는 규칙(Rules) 테이블과 매핑(Items) 테이블을 관리해야 함.
            // 여기서는 "템플릿 전용 규칙"을 생성한다고 가정하거나, 공용 규칙을 참조해야 함.
            // 사용자 요구사항의 "유연함"을 위해, 템플릿 생성 시 규칙도 새로 생성해주는 것이 직관적임.
            
            // 기존 매핑 삭제
            if (editingTemplate.id) {
                await supabase.from("salary_template_items").delete().eq("template_id", templateId);
            }

            // 규칙 생성 및 매핑
            for (const rule of editingTemplate.rules) {
                // 규칙이 이미 ID가 있다면(공용 규칙) 그대로 사용, 없다면 새로 생성
                let ruleId = rule.id;
                
                if (!ruleId) {
                    // 컴포넌트가 필요함 (임시로 기본 컴포넌트 생성 또는 조회)
                    // 여기서는 단순화를 위해 '기본급'이라는 이름의 컴포넌트를 찾거나 만듦
                    let compId;
                    const { data: comp } = await supabase.from("salary_components").select("id").eq("gym_id", staff.gym_id).eq("name", rule.name).single();
                    
                    if (comp) {
                        compId = comp.id;
                    } else {
                        const { data: newComp } = await supabase.from("salary_components").insert({
                            gym_id: staff.gym_id,
                            name: rule.name, // 규칙 이름을 컴포넌트 이름으로 사용
                            type: rule.calculation_type === 'fixed' ? 'fixed' : 'computed'
                        }).select().single();
                        compId = newComp.id;
                    }

                    const { data: newRuleData } = await supabase.from("salary_rules").insert({
                        gym_id: staff.gym_id,
                        component_id: compId,
                        name: rule.name,
                        calculation_type: rule.calculation_type,
                        default_parameters: rule.default_parameters
                    }).select().single();
                    ruleId = newRuleData.id;
                }

                // 매핑 생성
                await supabase.from("salary_template_items").insert({
                    template_id: templateId,
                    rule_id: ruleId
                });
            }

            setIsModalOpen(false);
            fetchTemplates();
            alert("저장되었습니다.");

        } catch (error) {
            console.error(error);
            alert("저장 실패");
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate.id ? "템플릿 수정" : "새 템플릿 생성"}</DialogTitle>
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
                                                <Label className="text-xs text-gray-500">항목 이름</Label>
                                                <Input 
                                                    value={rule.name}
                                                    onChange={e => handleUpdateRule(index, 'name', e.target.value)}
                                                    placeholder="예: 기본급, 직책수당"
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">계산 방식</Label>
                                                <Select 
                                                    value={rule.calculation_type}
                                                    onValueChange={val => handleUpdateRule(index, 'calculation_type', val)}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">고정급 (매월 고정)</SelectItem>
                                                        <SelectItem value="hourly">시급제 (시간 x 단가)</SelectItem>
                                                        <SelectItem value="percentage_total">총매출 인센티브 (%)</SelectItem>
                                                        <SelectItem value="percentage_personal">개인매출 인센티브 (%)</SelectItem>
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

