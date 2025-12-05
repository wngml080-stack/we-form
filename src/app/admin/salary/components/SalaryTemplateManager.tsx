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
    // ... (기존 state 유지)

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

    // ... (중간 생략)

                                            <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">항목 선택</Label>
                                                <div className="flex gap-2">
                                                    <Select 
                                                        value={PRESET_RULES.some(p => p.value === rule.name) ? rule.name : "custom"} 
                                                        onValueChange={(val) => handlePresetChange(index, val)}
                                                    >
                                                        <SelectTrigger className="h-9 w-[140px]">
                                                            <SelectValue placeholder="항목 선택" />
                                                        </SelectTrigger>
                                                        <SelectContent>
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
                                                            className="h-9 flex-1"
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

