"use client";

import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
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
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Info, Calculator } from "lucide-react";

type Staff = {
    id: string;
    user_id: string;
    name: string;
    role: string;
    gym_id: string;
    salary_setting?: {
        id: string;
        template_id: string;
        template_name: string;
        personal_parameters: any;
    };
};

type SalaryTemplate = {
    id: string;
    name: string;
    items: { rule: { id: string; name: string; calculation_type: string; default_parameters: any } }[];
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
    const [personalParams, setPersonalParams] = useState<any>({});

    // 계산기 상태
    const [calcAmount, setCalcAmount] = useState("");
    const [calcRate, setCalcRate] = useState("");

    const supabase = createSupabaseClient();

    useEffect(() => {
        if (filterInitialized && selectedGymId && selectedCompanyId) {
            fetchData(selectedGymId, selectedCompanyId);
        }
    }, [filterInitialized, selectedGymId, selectedCompanyId]);

    const fetchData = async (gymId: string, companyId: string) => {
        try {
            // 템플릿 조회: gym_id 기준 (템플릿은 지점별로 관리)
            const { data: tmplData } = await supabase
                .from("salary_templates")
                .select(`*, items:salary_template_items(rule:salary_rules(*))`)
                .eq("gym_id", gymId);
            setTemplates(tmplData || []);

            // 직원 목록 조회: 선택한 지점 기준
            const { data: staffData } = await supabase
                .from("staffs")
                .select(`
                    id, user_id, name, job_title, role, gym_id,
                    salary_setting:staff_salary_settings(
                        id, template_id, personal_parameters,
                        template:salary_templates(name)
                    )
                `)
                .eq("gym_id", gymId);

            const formattedStaffs = (staffData || []).map((s: any) => ({
                ...s,
                salary_setting: s.salary_setting?.[0] ? {
                    id: s.salary_setting[0].id,
                    template_id: s.salary_setting[0].template_id,
                    template_name: s.salary_setting[0].template?.name,
                    personal_parameters: s.salary_setting[0].personal_parameters
                } : undefined
            }));

            setStaffs(formattedStaffs);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

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

    const handleParamChange = (ruleId: string, key: string, value: any) => {
        // value가 배열(tiers)인 경우 그대로 저장
        if (key === 'tiers') {
            setPersonalParams((prev: any) => ({
                ...prev,
                [ruleId]: {
                    ...prev[ruleId],
                    [key]: value
                }
            }));
            return;
        }

        // 숫자형 입력 처리
        let finalValue = value;
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== "") {
             finalValue = Number(value);
        }
        
        setPersonalParams((prev: any) => ({
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
            const { data: existing } = await supabase
                .from("staff_salary_settings")
                .select("id")
                .eq("staff_id", selectedStaff.id)
                .single();

            if (existing) {
                await supabase.from("staff_salary_settings").update({
                    template_id: selectedTemplateId,
                    personal_parameters: personalParams,
                    valid_from: new Date().toISOString()
                }).eq("id", existing.id);
            } else {
                await supabase.from("staff_salary_settings").insert({
                    staff_id: selectedStaff.id,
                    template_id: selectedTemplateId,
                    personal_parameters: personalParams,
                    valid_from: new Date().toISOString()
                });
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
    const groupedRules = {
        basic: [] as any[],
        class: [] as any[],
        incentive: [] as any[],
        others: [] as any[]
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

    if (isLoading) return <div>로딩 중...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-700">직원 급여 설정</h3>
            
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">직원명</th>
                            <th className="px-6 py-3">직책</th>
                            <th className="px-6 py-3">적용 템플릿</th>
                            <th className="px-6 py-3 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {staffs.map(staff => (
                            <tr key={staff.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{staff.name}</td>
                                <td className="px-6 py-4 text-gray-500">{(staff as any).job_title || staff.role}</td>
                                <td className="px-6 py-4">
                                    {staff.salary_setting ? (
                                        <Badge className="bg-[#2F80ED] hover:bg-[#2F80ED]">
                                            {staff.salary_setting.template_name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-400 border-gray-300">미설정</Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(staff)}>
                                        설정하기
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {staffs.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-gray-400">직원 데이터가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1A1D21] text-white border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">급여 및 인센티브 설정</DialogTitle>
                        <DialogDescription className="text-sm text-gray-400">{selectedStaff?.name} / {(selectedStaff as any)?.job_title || selectedStaff?.role}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-8 py-4">
                        {/* 1. 템플릿 선택 */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">1. 급여 템플릿 선택</Label>
                            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                <SelectTrigger className="bg-[#2B2F36] border-gray-700 text-white">
                                    <SelectValue placeholder="템플릿을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-black">
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {currentTemplate ? (
                            <>
                                {/* 3. 기본 정보 설정 (가정) */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        3. 기본 정보 및 지원금 설정
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {groupedRules.basic.map(rule => (
                                            <div key={rule.id} className="space-y-1">
                                                <Label className="text-xs text-gray-400">{rule.name}</Label>
                                                {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. 수업료 설정 */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        4. 수업료 설정
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {groupedRules.class.map(rule => (
                                            <div key={rule.id} className="space-y-1">
                                                <Label className="text-xs text-gray-400">{rule.name}</Label>
                                                {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. 인센티브 및 특수 매출 */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        5. 인센티브 및 특수 매출
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {groupedRules.incentive.map(rule => (
                                            <div key={rule.id} className="space-y-1">
                                                <Label className="text-xs text-gray-400">{rule.name}</Label>
                                                {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 기타 항목 */}
                                {groupedRules.others.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-300">기타 항목</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {groupedRules.others.map(rule => (
                                                <div key={rule.id} className="space-y-1">
                                                    <Label className="text-xs text-gray-400">{rule.name}</Label>
                                                    {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                                템플릿을 먼저 선택해주세요.
                            </div>
                        )}

                        {/* 특이사항 */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">특이사항</Label>
                            <Textarea className="bg-[#2B2F36] border-gray-700 text-white min-h-[80px]" placeholder="메모를 입력하세요." />
                        </div>

                        {/* 간편 인센티브 계산기 */}
                        <Card className="p-4 bg-gray-100 border-none text-black">
                            <h4 className="font-bold mb-4 flex items-center gap-2">
                                <Calculator className="w-4 h-4" /> 간편 퍼센트 계산기
                            </h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">금액</Label>
                                    <Input 
                                        value={calcAmount} 
                                        onChange={e => setCalcAmount(e.target.value)} 
                                        placeholder="e.g. 10,000,000" 
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">퍼센트 (%)</Label>
                                    <Input 
                                        value={calcRate} 
                                        onChange={e => setCalcRate(e.target.value)} 
                                        placeholder="e.g. 5" 
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                            <div className="text-center bg-gray-200 py-3 rounded font-bold text-lg text-[#F2994A]">
                                계산 결과: {calculatedIncentive} 원
                            </div>
                        </Card>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/10">취소</Button>
                        <Button onClick={handleSave} className="bg-[#2F80ED] hover:bg-[#1e5bb8] text-white font-bold px-8">
                            저장하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function renderParamInputs(rule: any, values: any, onChange: (key: string, value: any) => void) {
    const inputClass = "bg-[#2B2F36] border-gray-700 text-white h-10";
    
    switch(rule.calculation_type) {
        case 'fixed':
        case 'hourly':
            return (
                <div className="relative">
                    <Input 
                        type="number" 
                        value={values.amount ?? values.rate ?? ""} 
                        onChange={e => onChange(rule.calculation_type === 'hourly' ? 'rate' : 'amount', e.target.value)}
                        className={`${inputClass} pr-8`}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-500">원</span>
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
                        className={`${inputClass} pr-8`}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-500">%</span>
                </div>
            );
        case 'tiered':
            return (
                <TieredConfig 
                    tiers={values.tiers || []} 
                    onChange={(newTiers) => onChange('tiers', newTiers)} 
                />
            );
        default:
            return <div className="text-xs text-gray-500 py-2">설정 불필요 (자동 계산 혹은 기본값 사용)</div>;
    }
}

// 구간별 설정 컴포넌트
function TieredConfig({ tiers, onChange }: { tiers: any[], onChange: (tiers: any[]) => void }) {
    const [testSales, setTestSales] = useState<string>("");

    const handleAddTier = () => {
        onChange([...tiers, { min: 0, max: null, value: 0 }]);
    };

    const handleRemoveTier = (index: number) => {
        const newTiers = tiers.filter((_, i) => i !== index);
        onChange(newTiers);
    };

    const handleUpdateTier = (index: number, field: string, value: any) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value === "" ? null : Number(value) };
        onChange(newTiers);
    };

    // 테스트 계산 로직
    const sales = parseFloat(testSales || "0");
    // min 오름차순 정렬 후, 조건에 맞는 마지막(가장 큰 min) 구간 찾기 OR 순차적으로 확인
    // 여기서는 min이 작은 순서대로 정렬되어 있다고 가정하고 로직 수행
    const sortedTiers = [...(tiers || [])].sort((a, b) => (a.min || 0) - (b.min || 0));
    
    let matchedValue = 0;
    // 매출이 min보다 크거나 같고, max보다 작거나(max가 있으면) 같은 구간 찾기
    // 보통 구간은 순차적이므로, sales >= min 을 만족하는 가장 큰 min을 찾으면 됨
    const activeTier = sortedTiers.slice().reverse().find(t => sales >= (t.min || 0) && (t.max === null || t.max === 0 || sales < t.max));
    
    if (activeTier) matchedValue = activeTier.value;

    return (
        <div className="space-y-3 bg-[#22252b] p-3 rounded border border-gray-700">
            <div className="flex justify-between items-center">
                <Badge variant="secondary" className="bg-[#2F80ED]/20 text-[#2F80ED] border-none">
                    자동 계산 적용됨
                </Badge>
                <Button size="sm" variant="ghost" onClick={handleAddTier} className="h-6 text-xs text-[#2F80ED] hover:text-white">
                    <Plus className="w-3 h-3 mr-1" /> 구간 추가
                </Button>
            </div>

            <div className="space-y-2">
                {tiers.map((tier, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <div className="grid grid-cols-3 gap-2 flex-1">
                            <div className="relative">
                                <Input 
                                    placeholder="최소 매출 (이상)" 
                                    className="h-8 bg-[#2B2F36] border-gray-600 text-white text-xs"
                                    value={tier.min || ""}
                                    type="number"
                                    onChange={e => handleUpdateTier(idx, 'min', e.target.value)}
                                />
                                <span className="absolute right-2 top-2 text-[10px] text-gray-500">이상</span>
                            </div>
                            <div className="relative">
                                <Input 
                                    placeholder="최대 매출 (미만)" 
                                    className="h-8 bg-[#2B2F36] border-gray-600 text-white text-xs"
                                    value={tier.max || ""}
                                    type="number"
                                    onChange={e => handleUpdateTier(idx, 'max', e.target.value)}
                                />
                                <span className="absolute right-2 top-2 text-[10px] text-gray-500">미만</span>
                            </div>
                            <div className="relative">
                                <Input 
                                    placeholder="적용 금액/단가" 
                                    className="h-8 bg-[#2B2F36] border-gray-600 text-white text-xs font-bold text-[#F2994A]"
                                    value={tier.value || ""}
                                    type="number"
                                    onChange={e => handleUpdateTier(idx, 'value', e.target.value)}
                                />
                                <span className="absolute right-2 top-2 text-[10px] text-gray-500">원</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400" onClick={() => handleRemoveTier(idx)}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
                {tiers.length === 0 && (
                    <div className="text-xs text-center text-gray-500 py-2">구간을 추가해주세요 (예: 0 ~ 1000만원 : 50만원)</div>
                )}
            </div>

            {/* 테스트 섹션 */}
            <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <Info className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400">매출 기준: 개인 매출 (또는 설정)</span>
                </div>
                <div className="flex items-center gap-2 bg-[#1A1D21] px-3 py-1 rounded border border-gray-700">
                    <span className="text-xs text-gray-400">Sim:</span>
                    <Input 
                        className="h-6 w-24 bg-transparent border-none text-xs text-white p-0 focus-visible:ring-0 text-right"
                        placeholder="예상 매출 입력"
                        value={testSales}
                        onChange={e => setTestSales(e.target.value)}
                        type="number"
                    />
                    <span className="text-xs text-gray-500">→</span>
                    <span className="text-xs font-bold text-[#F2994A]">{matchedValue.toLocaleString()} 원</span>
                </div>
            </div>
        </div>
    );
}
