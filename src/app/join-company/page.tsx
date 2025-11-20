"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function JoinCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    companyName: "", repName: "", phone: "", businessNum: "", email: "", password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/join-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert("가입 신청이 완료되었습니다!\n시스템 관리자 승인 후 이용 가능합니다.");
      router.push("/login");

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 배경: 밝은 파랑 (#2F80ED)
    <div className="flex min-h-screen items-center justify-center bg-[#2F80ED] p-4">
      
      {/* 카드: 배경 흰색 (bg-white) 강제 적용 */}
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-[#2F80ED]">We:form 파트너스 가입</CardTitle>
          <CardDescription className="text-gray-500">
            본사/법인 단위로 서비스를 도입할 때 사용하는 신청 폼입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-gray-700">회사명 (법인명)</Label>
              <Input id="companyName" placeholder="예: 헬스보이짐 본사" onChange={handleChange} required className="bg-white border-gray-300 focus:ring-[#2F80ED]"/>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="repName" className="text-gray-700">대표자명</Label>
                    <Input id="repName" placeholder="홍길동" onChange={handleChange} required className="bg-white border-gray-300"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">연락처</Label>
                    <Input id="phone" placeholder="010-0000-0000" onChange={handleChange} required className="bg-white border-gray-300"/>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessNum" className="text-gray-700">사업자 등록번호 (선택)</Label>
              <Input id="businessNum" placeholder="000-00-00000" onChange={handleChange} className="bg-white border-gray-300"/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">이메일 (관리자 ID)</Label>
              <Input id="email" type="email" placeholder="admin@company.com" onChange={handleChange} required className="bg-white border-gray-300"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">비밀번호</Label>
              <Input id="password" type="password" placeholder="8자리 이상 입력" onChange={handleChange} required className="bg-white border-gray-300"/>
            </div>

            {errorMsg && (
              <p className="text-sm font-medium text-red-500 text-center animate-pulse">
                🚨 {errorMsg}
              </p>
            )}

            {/* 버튼: 오렌지 배경 (#F2994A) + 검정 글씨 (text-black) */}
            <Button 
                type="submit" 
                className="w-full bg-[#F2994A] hover:bg-[#d68238] text-black font-bold h-12 text-lg mt-4" 
                disabled={isLoading}
            >
              {isLoading ? "신청 처리 중..." : "가입 신청하기"}
            </Button>
            
            <div className="text-center text-sm text-gray-500 mt-4">
                이미 계정을 보유하신 경우 <span className="text-[#2F80ED] cursor-pointer hover:underline font-bold" onClick={() => router.push('/login')}>로그인</span> 화면으로 이동해주세요.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}