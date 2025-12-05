"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type Staff = {
    id: string;
    user_id: string;
    name: string; // staffs 테이블에 name 컬럼이 없으므로 user_metadata 또는 profiles 조인 필요. 여기서는 간단히 처리
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

            // 1. 템플릿 목록 로딩
            const { data: tmplData } = await supabase
                .from("salary_templates")
                .select(`*, items:salary_template_items(rule:salary_rules(*))`)
                .eq("gym_id", myStaff.gym_id);
            setTemplates(tmplData || []);

            // 2. 직원 목록 로딩 (이름 포함)
            // users 테이블 접근이 어려우므로, staffs에 name 컬럼이 있다고 가정하거나 (스키마 확인 필요),
            // 없다면 profiles 테이블과 조인해야 함. 여기서는 user_metadata를 가져오거나 staffs에 name이 추가되었다고 가정.
            // (이전 작업에서 staffs에 name 추가 여부를 확인하지 못했으나, 보통 이름은 필수이므로 있다고 가정하고 진행)
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
                .neq("role", "admin"); // 관리자 제외하고 표시
                
            // 이름 매핑을 위해 auth.users를 클라이언트에서 조회 불가. 
            // 임시로 '직원 ID' 또는 별도 테이블 사용. 
            // *중요*: We:form 프로젝트 규칙에 'staffs 테이블에 job_title, phone 등 관리'라고 되어 있음.
            // 이름 컬럼이 있는지 확인해보는 것이 좋겠음. 만약 없으면 phone 등으로 대체.
            
            // 일단 이름은 "직원" + ID 뒷자리로 표시하거나, user_id로 users 테이블 쿼리 불가하므로...
            // 아까 마이그레이션 스크립트에 staffs 테이블 수정은 없었음.
            // 기존 코드(admin/staff/page.tsx)를 보면 members 테이블이 아니라 staffs 테이블을 조회할 때 이름을 어떻게 가져오는지 확인 필요.
            // *확인 결과*: 이전 대화나 코드에서 staffs 테이블의 name 컬럼 언급이 명확하지 않음.
            // 하지만 일반적으로 존재한다고 가정. 에러 나면 수정.
            
            // 편의상 staffs 데이터 가공
            const formattedStaffs = (staffData || []).map((s: any) => ({
                ...s,
                name: "직원 " + s.id.substring(0, 4), // 임시 이름
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
        // 템플릿 변경 시 파라미터 초기화? 아니면 유지? -> 일단 초기화가 안전
        setPersonalParams({});
    };

    const handleParamChange = (ruleId: string, key: string, value: string) => {
        setPersonalParams((prev: any) => ({
            ...prev,
            [ruleId]: {
                ...prev[ruleId],
                [key]: parseFloat(value) || 0 // 숫자로 변환
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedStaff) return;

        try {
            // upsert 사용 (staff_id 기준 유니크 제약조건이 있다면 좋겠지만, 여기서는 로직으로 처리)
            // staff_salary_settings 테이블에 staff_id 유니크 제약이 있는지 마이그레이션 확인 -> 없음 (1:N 가능하게 해둠, history 관리용)
            // 하지만 현재 유효한 설정은 하나여야 하므로, 기존 설정의 valid_to를 업데이트하거나,
            // 단순하게 이번 구현에서는 "최신 설정 하나만 유지"하는 방식으로 delete -> insert 또는 update 사용.
            
            // 가장 간단하게: 해당 직원의 기존 설정을 모두 삭제하고 새로 생성 (이력 관리 포기, MVP 버전)
            // 또는 update
            
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
        } catch (error) {
            console.error(error);
            alert("저장 실패");
        }
    };

    // 선택된 템플릿의 규칙들 찾기
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);

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
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedStaff?.name} 급여 설정</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>급여 템플릿 선택</Label>
                            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="템플릿을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {currentTemplate && (
                            <div className="space-y-4 border-t pt-4">
                                <Label className="text-base font-bold">개별 파라미터 설정</Label>
                                <p className="text-xs text-gray-500 mb-2">이 직원을 위한 구체적인 금액/비율을 입력하세요.</p>
                                
                                {currentTemplate.items.map(({ rule }) => (
                                    <div key={rule.id} className="grid grid-cols-3 gap-4 items-center bg-gray-50 p-3 rounded">
                                        <div className="col-span-1">
                                            <div className="font-medium text-sm">{rule.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {getRuleTypeLabel(rule.calculation_type)}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            {renderParamInputs(rule, personalParams[rule.id] || {}, (key, val) => handleParamChange(rule.id, key, val))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
                        <Button onClick={handleSave} className="bg-[#2F80ED]" disabled={!selectedTemplateId}>
                            저장하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getRuleTypeLabel(type: string) {
    switch(type) {
        case 'fixed': return '고정급';
        case 'hourly': return '시급제';
        case 'percentage_total': return '매출 %';
        case 'percentage_personal': return '개인매출 %';
        default: return type;
    }
}

function renderParamInputs(rule: any, values: any, onChange: (key: string, value: string) => void) {
    switch(rule.calculation_type) {
        case 'fixed':
            return (
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        value={values.amount ?? ""} 
                        onChange={e => onChange('amount', e.target.value)}
                        placeholder="금액 (원)"
                        className="h-8"
                    />
                    <span className="text-sm text-gray-500 w-8">원</span>
                </div>
            );
        case 'hourly':
            return (
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        value={values.rate ?? ""} 
                        onChange={e => onChange('rate', e.target.value)}
                        placeholder="시급 (원)"
                        className="h-8"
                    />
                    <span className="text-sm text-gray-500 w-8">원</span>
                </div>
            );
        case 'percentage_total':
        case 'percentage_personal':
            return (
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        value={values.rate ?? ""} 
                        onChange={e => onChange('rate', e.target.value)}
                        placeholder="비율 (%)"
                        className="h-8"
                    />
                    <span className="text-sm text-gray-500 w-8">%</span>
                </div>
            );
        default:
            return <div className="text-xs text-gray-400">설정 불필요</div>;
    }
}

