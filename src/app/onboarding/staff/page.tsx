"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Users, Search, Building2, CheckCircle2, Loader2 } from "lucide-react";

const JOB_TITLES = ["지점장", "팀장", "트레이너", "FC", "필라테스", "골프프로", "기타"];

export default function OnboardingStaffPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 회사 검색
  const [bizNum, setBizNum] = useState("");
  const [foundCompany, setFoundCompany] = useState<any>(null);

  // 직원 정보
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    jobTitle: "",
    joinedAt: "",
  });

  const handleSearchCompany = async () => {
    if (!bizNum) {
      setErrorMsg("사업자 번호를 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/find-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber: bizNum }),
      });
      const data = await res.json();

      if (data.found) {
        setFoundCompany(data.company);
      } else {
        setErrorMsg("등록된 회사가 없습니다. 사업자 번호를 확인해주세요.");
        setFoundCompany(null);
      }
    } catch (e) {
      setErrorMsg("검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/onboarding/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId: foundCompany.id,
          clerkUserId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/onboarding/pending?type=staff");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white border-0">
        <CardHeader className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
            <Users className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-500">
            {step === 1 ? "소속 회사 찾기" : "직원 정보 입력"}
          </CardTitle>
          <CardDescription className="text-gray-500">
            {step === 1
              ? "근무하시는 회사의 사업자 번호를 입력해주세요."
              : `${foundCompany?.name} 소속으로 가입합니다.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: 회사 검색 */}
          {step === 1 && (
            <>
              <div className="p-3 bg-gray-50 rounded-lg text-center text-sm">
                <span className="text-gray-500">가입 이메일:</span>{" "}
                <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>

              <div className="space-y-2">
                <Label>사업자 등록번호 (숫자만)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="예: 1234567890"
                    value={bizNum}
                    onChange={(e) => setBizNum(e.target.value)}
                  />
                  <Button
                    onClick={handleSearchCompany}
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={isLoading}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {errorMsg && <p className="text-sm text-red-500 text-center">{errorMsg}</p>}

              {foundCompany && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 animate-in fade-in">
                  <div className="flex items-center gap-3 text-orange-600 font-bold mb-2">
                    <Building2 className="w-5 h-5" />
                    {foundCompany.name}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    대표자: {foundCompany.representative_name}
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    onClick={() => setStep(2)}
                  >
                    이 회사로 가입 진행 <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => router.push("/onboarding")}
                className="w-full text-gray-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> 이전으로
              </Button>
            </>
          )}

          {/* Step 2: 정보 입력 */}
          {step === 2 && (
            <>
              <div className="p-2 bg-orange-50 rounded text-center text-sm">
                소속: <span className="font-bold text-orange-600">{foundCompany.name}</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>이름 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>연락처 *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-0000-0000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>입사일</Label>
                  <Input
                    type="date"
                    value={formData.joinedAt}
                    onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>직급</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, jobTitle: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {JOB_TITLES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {errorMsg && <p className="text-sm text-red-500 text-center">{errorMsg}</p>}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="w-1/3"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> 이전
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="w-2/3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 처리 중...
                    </>
                  ) : (
                    "가입 신청 완료"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
