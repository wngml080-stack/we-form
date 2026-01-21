"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Calculator, AlertTriangle, Info, Plus } from "lucide-react";
import type { StaffSalaryResult, SalaryTemplate, SalaryRule } from "../types";

interface SalarySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: StaffSalaryResult | null;
    templates: SalaryTemplate[];
    initialTemplateId: string;
    initialParams: Record<string, any>;
    onSave: (templateId: string, params: Record<string, any>) => Promise<void>;
}

export function SalarySettingsModal({
    isOpen,
    onClose,
    staff,
    templates,
    initialTemplateId,
    initialParams,
    onSave,
}: SalarySettingsModalProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
    const [personalParams, setPersonalParams] = useState<Record<string, any>>(initialParams);
    const [calcAmount, setCalcAmount] = useState("");
    const [calcRate, setCalcRate] = useState("");

    // 템플릿 변경
    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template && template.items) {
            const defaultParams: Record<string, any> = {};
            template.items.forEach(({ rule }) => {
                if (rule.default_parameters) {
                    defaultParams[rule.id] = { ...rule.default_parameters };
                }
            });
            setPersonalParams(defaultParams);
        } else {
            setPersonalParams({});
        }
    };

    // 파라미터 변경
    const handleParamChange = (ruleId: string, key: string, value: any) => {
        if (key === 'tiers') {
            setPersonalParams(prev => ({
                ...prev,
                [ruleId]: { ...prev[ruleId], [key]: value }
            }));
            return;
        }

        let finalValue = value;
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== "") {
            finalValue = Number(value);
        }

        setPersonalParams(prev => ({
            ...prev,
            [ruleId]: { ...prev[ruleId], [key]: finalValue }
        }));
    };

    const handleSave = async () => {
        await onSave(selectedTemplateId, personalParams);
    };

    // 현재 템플릿 및 규칙 그룹핑
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    const groupedRules = {
        basic: [] as SalaryRule[],
        class: [] as SalaryRule[],
        incentive: [] as SalaryRule[],
        deduction: [] as SalaryRule[],
    };

    if (currentTemplate) {
        currentTemplate.items.forEach(({ rule }) => {
            const type = rule.calculation_type;
            if (['base_salary', 'allowance', 'hourly', 'etc', 'fixed'].includes(type)) {
                groupedRules.basic.push(rule);
            } else if (type === 'class_fee') {
                groupedRules.class.push(rule);
            } else if (['sales_incentive', 'personal_incentive', 'bonus', 'percentage_total', 'percentage_personal'].includes(type)) {
                groupedRules.incentive.push(rule);
            } else if (type === 'tax_deduction') {
                groupedRules.deduction.push(rule);
            }
        });
    }

    const calculatedIncentive = (parseFloat(calcAmount || "0") * (parseFloat(calcRate || "0") / 100)).toLocaleString();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-none shadow-2xl p-0 rounded-[40px]">
                <div className="p-6 xs:p-8 lg:p-12 space-y-6 xs:space-y-8 lg:space-y-10">
                    <DialogHeader>
                        <div className="flex items-center gap-3 xs:gap-4 mb-3 xs:mb-4">
                            <div className="w-12 h-12 xs:w-16 xs:h-16 rounded-xl xs:rounded-[24px] bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                <Calculator className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl xs:text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">급여 템플릿 적용</DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold text-sm xs:text-base mt-1">
                                    <span className="text-blue-600">{staff?.staff_name}</span> / {staff?.job_position || "Staff"}
                                    <span className="block text-xs text-slate-400 mt-1">금액은 템플릿에서 설정됩니다. 수정하려면 템플릿 설계 탭에서 변경하세요.</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 xs:space-y-8 lg:space-y-10">
                        {/* 템플릿 선택 */}
                        <div className="space-y-3 xs:space-y-4 bg-slate-50 p-4 xs:p-6 lg:p-8 rounded-xl xs:rounded-2xl lg:rounded-[32px] border border-slate-100">
                            <Label className="text-[10px] xs:text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                Step 01. 급여 템플릿 적용
                            </Label>
                            {templates.length > 0 ? (
                                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                    <SelectTrigger className="h-12 xs:h-14 bg-white border border-slate-200 rounded-xl xs:rounded-2xl text-slate-900 font-black text-sm xs:text-lg focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm">
                                        <SelectValue placeholder="적용할 템플릿을 선택하세요" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl xs:rounded-2xl p-1 xs:p-2 shadow-2xl">
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="rounded-lg xs:rounded-xl font-bold py-2 xs:py-3 text-sm focus:bg-blue-600 focus:text-white">
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="bg-white rounded-xl xs:rounded-2xl p-4 xs:p-6 border border-dashed border-slate-200">
                                    <p className="text-slate-600 font-bold text-xs xs:text-sm mb-1 xs:mb-2">등록된 급여 템플릿이 없습니다.</p>
                                    <p className="text-slate-400 text-[10px] xs:text-xs">먼저 &quot;급여 템플릿 설계&quot; 탭에서 템플릿을 생성해주세요.</p>
                                </div>
                            )}
                        </div>

                        {currentTemplate ? (
                            <div className="space-y-6 xs:space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* 기본 정보 설정 */}
                                {groupedRules.basic.length > 0 && (
                                    <RuleSection
                                        title="기본 정보 및 지원금"
                                        icon={<Info className="w-3 h-3 xs:w-4 xs:h-4 text-slate-500" />}
                                        iconBg="bg-slate-100"
                                        labelColor="text-slate-400"
                                        rules={groupedRules.basic}
                                        personalParams={personalParams}
                                        onParamChange={handleParamChange}
                                        cardBg="bg-slate-50"
                                        cardBorder="border-slate-100"
                                        labelTextColor="text-slate-500"
                                    />
                                )}

                                {/* 수업료 설정 */}
                                {groupedRules.class.length > 0 && (
                                    <RuleSection
                                        title="수업료(단가) 설정"
                                        icon={<Calculator className="w-3 h-3 xs:w-4 xs:h-4 text-emerald-600" />}
                                        iconBg="bg-emerald-50"
                                        labelColor="text-emerald-500"
                                        rules={groupedRules.class}
                                        personalParams={personalParams}
                                        onParamChange={handleParamChange}
                                        cardBg="bg-emerald-50/50"
                                        cardBorder="border-emerald-100"
                                        labelTextColor="text-emerald-600"
                                    />
                                )}

                                {/* 인센티브 설정 */}
                                {groupedRules.incentive.length > 0 && (
                                    <RuleSection
                                        title="인센티브 및 요율 설정"
                                        icon={<Plus className="w-3 h-3 xs:w-4 xs:h-4 text-orange-600" />}
                                        iconBg="bg-orange-50"
                                        labelColor="text-orange-500"
                                        rules={groupedRules.incentive}
                                        personalParams={personalParams}
                                        onParamChange={handleParamChange}
                                        cardBg="bg-orange-50/50"
                                        cardBorder="border-orange-100"
                                        labelTextColor="text-orange-600"
                                    />
                                )}

                                {/* 세금 공제 설정 */}
                                {groupedRules.deduction.length > 0 && (
                                    <section className="space-y-4 xs:space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 xs:gap-3">
                                                <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                                    <AlertTriangle className="w-3 h-3 xs:w-4 xs:h-4 text-red-600" />
                                                </div>
                                                <h4 className="text-base xs:text-lg lg:text-xl font-black text-slate-900 tracking-tight">세금 공제 설정</h4>
                                            </div>
                                            <span className="text-[9px] xs:text-[10px] text-red-500 font-bold uppercase tracking-wider">템플릿 설정값</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
                                            {groupedRules.deduction.map(rule => (
                                                <div key={rule.id} className="space-y-2 xs:space-y-3 p-4 xs:p-6 bg-red-50/50 rounded-xl xs:rounded-2xl lg:rounded-[28px] border border-red-100">
                                                    <Label className="text-[10px] xs:text-xs font-black text-red-600 uppercase tracking-widest ml-1">{rule.name}</Label>
                                                    {renderParamInputs(rule, { ...rule.default_parameters, ...(personalParams[rule.id] || {}) })}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] xs:text-xs text-red-400 font-bold ml-1">
                                            세금 공제는 총 급여(세전)에서 자동으로 계산되어 차감됩니다.
                                        </p>
                                    </section>
                                )}

                                {/* 간편 인센티브 계산기 */}
                                <section className="bg-slate-50 rounded-xl xs:rounded-2xl lg:rounded-[32px] p-4 xs:p-6 lg:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 xs:w-64 h-48 xs:h-64 bg-blue-600/5 rounded-full -mr-16 xs:-mr-20 -mt-16 xs:-mt-20 blur-3xl group-hover:bg-blue-600/10 transition-all duration-700"></div>
                                    <div className="relative z-10 space-y-4 xs:space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-slate-900 flex items-center gap-2 xs:gap-3 text-sm xs:text-base lg:text-lg tracking-tight">
                                                <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white rounded-lg xs:rounded-xl flex items-center justify-center shadow-sm">
                                                    <Calculator className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
                                                </div>
                                                실시간 요율 계산기
                                            </h4>
                                            <Badge className="bg-blue-600/10 text-blue-600 border-none font-black text-[8px] xs:text-[10px] tracking-widest px-2 xs:px-3 py-1">PREVIEW</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 xs:gap-6">
                                            <div className="space-y-1 xs:space-y-2">
                                                <Label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sales Amount</Label>
                                                <Input
                                                    value={calcAmount}
                                                    onChange={e => setCalcAmount(e.target.value)}
                                                    placeholder="예: 10,000,000"
                                                    className="h-10 xs:h-12 bg-white border border-slate-200 rounded-lg xs:rounded-xl text-slate-900 font-black text-right pr-3 xs:pr-4 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm text-xs xs:text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1 xs:space-y-2">
                                                <Label className="text-[9px] xs:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Incentive Rate (%)</Label>
                                                <Input
                                                    value={calcRate}
                                                    onChange={e => setCalcRate(e.target.value)}
                                                    placeholder="예: 5"
                                                    className="h-10 xs:h-12 bg-white border border-slate-200 rounded-lg xs:rounded-xl text-slate-900 font-black text-right pr-3 xs:pr-4 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm text-xs xs:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center bg-white p-4 xs:p-6 rounded-xl xs:rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-slate-400 text-[10px] xs:text-xs font-bold uppercase tracking-widest mb-1">Estimated Result</p>
                                            <div className="text-xl xs:text-2xl lg:text-3xl font-black text-[#F2994A] tracking-tighter">
                                                {calculatedIncentive} <span className="text-xs xs:text-sm text-slate-400 ml-1 font-bold">KRW</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 xs:py-24 lg:py-32 bg-slate-50 rounded-xl xs:rounded-2xl lg:rounded-[40px] border border-dashed border-slate-200">
                                <Calculator className="w-12 h-12 xs:w-16 xs:h-16 text-slate-200 mb-4 xs:mb-6" />
                                <p className="text-slate-400 font-black text-sm xs:text-base lg:text-lg">템플릿을 먼저 선택해주세요.</p>
                                <p className="text-slate-300 font-bold text-xs xs:text-sm mt-1 xs:mt-2">직원의 기본 급여 체계를 선택하면 세부 설정이 활성화됩니다.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-6 xs:pt-8 lg:pt-10 border-t border-slate-100 flex flex-col xs:flex-row gap-3 xs:gap-4">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="h-12 xs:h-14 lg:h-16 px-6 xs:px-8 lg:px-10 rounded-xl xs:rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all w-full xs:w-auto text-sm xs:text-base"
                        >
                            창 닫기
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="h-12 xs:h-14 lg:h-16 px-8 xs:px-10 lg:px-12 bg-[#2F80ED] hover:bg-blue-600 text-white rounded-xl xs:rounded-2xl font-black text-sm xs:text-base lg:text-lg shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 w-full xs:w-auto"
                        >
                            설정 정보 저장하기
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// 규칙 섹션 컴포넌트
function RuleSection({
    title,
    icon,
    iconBg,
    labelColor,
    rules,
    personalParams,
    onParamChange,
    cardBg,
    cardBorder,
    labelTextColor,
}: {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    labelColor: string;
    rules: SalaryRule[];
    personalParams: Record<string, any>;
    onParamChange: (ruleId: string, key: string, value: any) => void;
    cardBg: string;
    cardBorder: string;
    labelTextColor: string;
}) {
    return (
        <section className="space-y-4 xs:space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 xs:gap-3">
                    <div className={`w-6 h-6 xs:w-8 xs:h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                        {icon}
                    </div>
                    <h4 className="text-base xs:text-lg lg:text-xl font-black text-slate-900 tracking-tight">{title}</h4>
                </div>
                <span className={`text-[9px] xs:text-[10px] ${labelColor} font-bold uppercase tracking-wider`}>템플릿 설정값</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
                {rules.map(rule => (
                    <div key={rule.id} className={`space-y-2 xs:space-y-3 p-4 xs:p-6 ${cardBg} rounded-xl xs:rounded-2xl lg:rounded-[28px] border ${cardBorder}`}>
                        <Label className={`text-[10px] xs:text-xs font-black ${labelTextColor} uppercase tracking-widest ml-1`}>{rule.name}</Label>
                        {renderParamInputs(rule, { ...rule.default_parameters, ...(personalParams[rule.id] || {}) })}
                    </div>
                ))}
            </div>
        </section>
    );
}

// 계산 타입 라벨 함수
function getCalculationTypeLabel(type: string): string {
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
        case 'fixed': return '고정급';
        case 'percentage_total': return '매출인센티브';
        case 'percentage_personal': return '개인인센티브';
        default: return type;
    }
}

// 파라미터 입력 렌더링 함수
function renderParamInputs(rule: SalaryRule, values: Record<string, any>) {
    const typeLabel = getCalculationTypeLabel(rule.calculation_type);
    const valueDisplayClass = "bg-slate-100 border border-slate-200 text-slate-700 h-10 xs:h-12 rounded-lg xs:rounded-xl font-black text-right pr-8 xs:pr-10 shadow-inner text-xs xs:text-sm flex items-center justify-end px-3 xs:px-4";

    switch(rule.calculation_type) {
        case 'base_salary':
        case 'fixed':
        case 'allowance':
        case 'bonus':
        case 'etc': {
            const fixedAmount = Number(values.amount || 0);
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">(고정금액)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>{fixedAmount > 0 ? fixedAmount.toLocaleString() : "0"}</div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">원</span>
                    </div>
                    {fixedAmount > 0 && <div className="text-right text-[10px] xs:text-xs text-blue-600 font-black">= {fixedAmount.toLocaleString()}원</div>}
                </div>
            );
        }
        case 'hourly': {
            const hourlyRate = Number(values.rate || 0);
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">(시급 × 근무시간)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>{hourlyRate > 0 ? hourlyRate.toLocaleString() : "0"}</div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">원/시간</span>
                    </div>
                    {hourlyRate > 0 && <div className="text-right text-[10px] xs:text-xs text-blue-600 font-black">시급 {hourlyRate.toLocaleString()}원</div>}
                </div>
            );
        }
        case 'class_fee': {
            const classRate = Number(values.rate || 0);
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">(횟수 × 단가)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>{classRate > 0 ? classRate.toLocaleString() : "0"}</div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">원/회</span>
                    </div>
                    {classRate > 0 && <div className="text-right text-[10px] xs:text-xs text-emerald-600 font-black">회당 {classRate.toLocaleString()}원</div>}
                </div>
            );
        }
        case 'sales_incentive':
        case 'personal_incentive':
        case 'percentage_total':
        case 'percentage_personal': {
            const incentiveRate = Number(values.rate || 0);
            const isPersonal = rule.calculation_type === 'personal_incentive' || rule.calculation_type === 'percentage_personal';
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">{typeLabel}</span>
                        <span className="text-[9px] xs:text-[10px] text-slate-400 font-bold">({isPersonal ? '개인매출' : '매출'} × %)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={valueDisplayClass}>{incentiveRate > 0 ? incentiveRate : "0"}</div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-slate-400">%</span>
                    </div>
                    {incentiveRate > 0 && <div className="text-right text-[10px] xs:text-xs text-orange-600 font-black">{isPersonal ? '개인매출' : '매출'}의 {incentiveRate}%</div>}
                </div>
            );
        }
        case 'tax_deduction': {
            const deductionRate = Number(values.rate || 0);
            const deductionDisplayClass = "bg-red-50 border border-red-200 text-red-600 h-10 xs:h-12 rounded-lg xs:rounded-xl font-black text-right pr-8 xs:pr-10 shadow-inner text-xs xs:text-sm flex items-center justify-end px-3 xs:px-4";
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] xs:text-[10px] font-black rounded-md uppercase tracking-wider">공제</span>
                        <span className="text-[9px] xs:text-[10px] text-red-400 font-bold">(총급여 × %)</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] xs:text-[9px] font-black rounded uppercase tracking-wider">LOCKED</span>
                    </div>
                    <div className="relative">
                        <div className={deductionDisplayClass}>{deductionRate > 0 ? `-${deductionRate}` : "0"}</div>
                        <span className="absolute right-3 xs:right-4 top-2.5 xs:top-3.5 text-[10px] xs:text-xs font-black text-red-400">%</span>
                    </div>
                    {deductionRate > 0 && <div className="text-right text-[10px] xs:text-xs text-red-600 font-black">총급여의 <span className="text-red-700">-{deductionRate}%</span> 차감</div>}
                </div>
            );
        }
        default:
            return <div className="text-[10px] xs:text-xs text-slate-400 font-bold py-2 px-1">자동 계산 혹은 기본값 사용</div>;
    }
}
