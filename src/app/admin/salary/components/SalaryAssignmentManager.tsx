"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
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

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: myStaff } = await supabase.from("staffs").select("gym_id").eq("user_id", user.id).single();
            if (!myStaff) return;

            const { data: tmplData } = await supabase
                .from("salary_templates")
                .select(`*, items:salary_template_items(rule:salary_rules(*))`)
                .eq("gym_id", myStaff.gym_id);
            setTemplates(tmplData || []);

            const { data: staffData } = await supabase
                .from("staffs")
                .select(`
                    id, user_id, role, gym_id,
                    salary_setting:staff_salary_settings(
                        id, template_id, personal_parameters,
                        template:salary_templates(name)
                    )
                `)
                .eq("gym_id", myStaff.gym_id)
                .neq("role", "admin");
                
            const formattedStaffs = (staffData || []).map((s: any) => ({
                ...s,
                name: "직원 " + s.id.substring(0, 4),
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

    const handleParamChange = (ruleId: string, key: string, value: string) => {
        setPersonalParams((prev: any) => ({
            ...prev,
            [ruleId]: {
                ...prev[ruleId],
                [key]: parseFloat(value) || 0
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
            fetchData();
            alert("저장되었습니다.");
        } catch (error: any) {
            console.error("상세 에러:", error);
            alert(`저장 실패: ${error.message || JSON.stringify(error)}`);
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
            } else if (name.includes("pt") || name.includes("수업") || name.includes("ot") || name.includes("bc")) {
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
                                <td className="px-6 py-4 text-gray-500">{staff.role}</td>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A1D21] text-white border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">급여 및 인센티브 설정</DialogTitle>
                        <p className="text-sm text-gray-400">{selectedStaff?.name} / {selectedStaff?.role}</p>
                    </DialogHeader>
                    
                    <div className="space-y-8 py-4">
                        {/* 1. 템플릿 선택 */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">1. 급여 템플릿 선택</Label>
                            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                <SelectTrigger className="bg-[#2B2F36] border-gray-700 text-white">
                                    <SelectValue placeholder="템플릿을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2B2F36] border-gray-700 text-white">
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
                                    <div className="grid grid-cols-2 gap-4">
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
                                    <div className="grid grid-cols-2 gap-4">
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
                                    <div className="grid grid-cols-2 gap-4">
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
                                        <div className="grid grid-cols-2 gap-4">
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
                            <h4 className="font-bold mb-4">간편 인센티브 계산기</h4>
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
                                계산된 인센티브: {calculatedIncentive} 원
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

function renderParamInputs(rule: any, values: any, onChange: (key: string, value: string) => void) {
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
        default:
            return <div className="text-xs text-gray-500 py-2">설정 불필요</div>;
    }
}
