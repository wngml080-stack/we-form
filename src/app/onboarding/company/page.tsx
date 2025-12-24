"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

export default function OnboardingCompanyPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    repName: "",
    phone: "",
    businessNum: "",
    branchCount: "",
    staffCount: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/onboarding/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          clerkUserId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/onboarding/pending?type=company");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4">
      <Card className="w-full max-w-lg shadow-2xl bg-white border-0">
        <CardHeader className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">회사(본사) 가입</CardTitle>
          <CardDescription className="text-gray-500">
            서비스를 도입할 회사 정보를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center text-sm">
              <span className="text-gray-500">가입 이메일:</span>{" "}
              <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">회사명 (법인명) *</Label>
              <Input
                id="companyName"
                placeholder="예: 위폼짐"
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repName">대표자명 *</Label>
                <Input id="repName" placeholder="홍길동" onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">연락처 *</Label>
                <Input id="phone" placeholder="010-0000-0000" onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessNum">사업자 등록번호</Label>
              <Input id="businessNum" placeholder="000-00-00000 (선택)" onChange={handleChange} />
              <p className="text-xs text-gray-400">직원 가입 시 회사 검색에 사용됩니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branchCount">지점 수</Label>
                <Input
                  id="branchCount"
                  type="number"
                  placeholder="예: 3"
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffCount">직원 규모</Label>
                <Input
                  id="staffCount"
                  type="number"
                  placeholder="예: 15"
                  onChange={handleChange}
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-sm font-medium text-red-500 text-center">{errorMsg}</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/onboarding")}
                className="w-1/3"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> 이전
              </Button>
              <Button
                type="submit"
                className="w-2/3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 처리 중...
                  </>
                ) : (
                  "가입 신청하기"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
