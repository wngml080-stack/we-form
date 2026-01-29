"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Calendar } from "lucide-react";

type SalaryDetail = {
    rule_name: string;
    amount: number;
    calculation: string;
};

type SalaryData = {
    year_month: string;
    total_amount: number;
    breakdown: {
        base_salary: number;
        class_salary: number;
        incentive_salary: number;
        details: SalaryDetail[];
        stats?: {
            pt_total_count: number;
            pt_inside_count: number;
            pt_outside_count: number;
            pt_weekend_count: number;
            pt_holiday_count: number;
        };
    };
    updated_at: string;
};

export default function StaffSalaryPage() {
    const router = useRouter();
    const { user: authUser, isLoading: authLoading, isApproved, gymName: authGymName } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [myStaffId, setMyStaffId] = useState<string | null>(null);
    const [myName, setMyName] = useState<string>("");
    const [_gymName, setGymName] = useState<string>("");

    // Supabase 클라이언트 한 번만 생성 (메모이제이션)
    const supabase = useMemo(() => createSupabaseClient(), []);

    useEffect(() => {
        const init = async () => {
            // AuthContext 로딩 중이면 대기
            if (authLoading) return;

            // 로그인 안됨 또는 승인 안됨
            if (!authUser || !isApproved) {
                router.push("/sign-in");
                return;
            }

            // AuthContext의 user는 staffs 테이블의 정보
            setMyStaffId(authUser.id);
            setMyName(authUser.name);
            setGymName(authGymName || "");
        };
        init();
    }, [authLoading, authUser, isApproved, authGymName, router]);

    const fetchSalary = useCallback(async () => {
        if (!myStaffId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("calculated_salaries")
                .select("*")
                .eq("staff_id", myStaffId)
                .eq("year_month", selectedMonth)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // 데이터 없음
                    setSalaryData(null);
                } else {
                    throw error;
                }
            } else {
                setSalaryData(data);
            }
        } catch (e) {
            console.error("급여 조회 실패:", e);
        } finally {
            setIsLoading(false);
        }
    }, [myStaffId, selectedMonth, supabase]);

    useEffect(() => {
        if (myStaffId && selectedMonth) {
            fetchSalary();
        }
    }, [myStaffId, selectedMonth, fetchSalary]);

    const handleDownloadExcel = async () => {
        if (!salaryData) return;

        // 동적 import - 사용자가 내보내기 클릭 시에만 로드
        const XLSX = await import("xlsx");

        const wb = XLSX.utils.book_new();
        const wsData = [
            ["항목", "금액", "비고"],
            ["기본급", salaryData.breakdown.base_salary, ""],
            ["수업료", salaryData.breakdown.class_salary, ""],
            ["인센티브", salaryData.breakdown.incentive_salary, ""],
            ["", "", ""],
            ["총 지급액", salaryData.total_amount, ""],
            ["", "", ""],
            ["상세 내역", "", ""],
            ...salaryData.breakdown.details.map(d => [
                d.rule_name,
                d.amount,
                d.calculation
            ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "급여명세서");
        XLSX.writeFile(wb, `${myName}_${selectedMonth}_급여명세서.xlsx`);
    };

    // 월 선택 옵션 생성 (최근 12개월)
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    });

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            {/* 헤더 */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-[60px] flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/staff")}
                        className="h-9 w-9 rounded-lg hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <h1 className="text-xl font-black text-[#2F80ED] tracking-tighter">급여 명세서</h1>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="p-4 md:p-6 space-y-6">
                {/* 월 선택 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-[#2F80ED]" />
                        <label className="text-sm font-bold text-gray-700">조회 월 선택</label>
                    </div>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200 font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map((month) => (
                                <SelectItem key={month} value={month}>
                                    {month.replace('-', '년 ')}월
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2F80ED] mx-auto"></div>
                        <p className="text-gray-500 mt-4">급여 정보를 불러오는 중...</p>
                    </div>
                ) : !salaryData ? (
                    <Card className="border-2 border-dashed border-gray-200">
                        <CardContent className="py-12 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {selectedMonth.replace('-', '년 ')}월 급여 정보가 없습니다
                            </h3>
                            <p className="text-sm text-gray-500">
                                관리자가 아직 해당 월의 급여를 확정하지 않았습니다.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* 총액 카드 */}
                        <Card className="bg-gradient-to-br from-[#2F80ED] to-[#1c6cd7] text-white border-0 shadow-lg">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium opacity-90">총 지급액</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black mb-2">
                                    {salaryData.total_amount.toLocaleString()}원
                                </div>
                                <div className="text-xs opacity-80">
                                    확정일: {new Date(salaryData.updated_at).toLocaleDateString('ko-KR')}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 통계 카드 */}
                        {salaryData.breakdown.stats && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-bold text-gray-800">📊 근무 통계</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <div className="text-xs text-gray-600 mb-1">PT 총 횟수</div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {salaryData.breakdown.stats.pt_total_count}
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <div className="text-xs text-gray-600 mb-1">근무내</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {salaryData.breakdown.stats.pt_inside_count}
                                            </div>
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded-lg">
                                            <div className="text-xs text-gray-600 mb-1">근무외</div>
                                            <div className="text-2xl font-bold text-orange-600">
                                                {salaryData.breakdown.stats.pt_outside_count}
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded-lg">
                                            <div className="text-xs text-gray-600 mb-1">주말</div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {salaryData.breakdown.stats.pt_weekend_count}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 급여 구성 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-gray-800">💰 급여 구성</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-sm font-medium text-gray-600">기본급</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {salaryData.breakdown.base_salary.toLocaleString()}원
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-sm font-medium text-gray-600">수업료</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {salaryData.breakdown.class_salary.toLocaleString()}원
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <span className="text-sm font-medium text-gray-600">인센티브</span>
                                    <span className="text-lg font-bold text-orange-600">
                                        {salaryData.breakdown.incentive_salary.toLocaleString()}원
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 상세 내역 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-gray-800">📋 상세 내역</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {salaryData.breakdown.details.map((detail, idx) => (
                                        <div key={idx} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900">{detail.rule_name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{detail.calculation}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900">
                                                    {detail.amount.toLocaleString()}원
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 다운로드 버튼 */}
                        <Button
                            onClick={handleDownloadExcel}
                            className="w-full h-12 bg-[#2F80ED] hover:bg-[#1c6cd7] text-white font-bold rounded-xl shadow-lg"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            엑셀 다운로드
                        </Button>
                    </>
                )}
            </main>
        </div>
    );
}


