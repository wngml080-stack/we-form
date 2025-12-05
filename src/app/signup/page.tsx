"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, CheckCircle2, Search, ArrowLeft } from "lucide-react";

const JOB_TITLES = ["지점장", "팀장", "트레이너", "FC", "필라테스", "골프프로", "기타"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 회사찾기, 2: 정보입력
  const [isLoading, setIsLoading] = useState(false);
  
  // 회사 검색용 상태
  const [bizNum, setBizNum] = useState("");
  const [foundCompany, setFoundCompany] = useState<any>(null);

  // 직원 정보 상태
  const [formData, setFormData] = useState({
    email: "", password: "", name: "", phone: "", job_title: "", joined_at: ""
  });

  // 🏢 Step 1: 회사 찾기
  const handleSearchCompany = async () => {
    if (!bizNum) return alert("사업자 번호를 입력해주세요.");
    setIsLoading(true);
    try {
        const res = await fetch("/api/auth/find-company", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessNumber: bizNum })
        });
        const data = await res.json();
        
        if (data.found) {
            setFoundCompany(data.company);
        } else {
            alert("등록된 회사가 없습니다. 사업자 번호를 확인해주세요.");
            setFoundCompany(null);
        }
    } catch (e) { alert("검색 중 오류가 발생했습니다."); }
    setIsLoading(false);
  };

  // 📝 Step 2: 가입 신청
  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            company_id: foundCompany.id // 👈 찾은 회사 ID 포함
        }),
      });
      
      if (res.ok) {
        alert("가입 신청 완료! 본사 승인 후 이용 가능합니다.");
        router.push("/login");
      } else {
        const err = await res.json();
        alert("가입 실패: " + err.error);
      }
    } catch (e) { alert("에러 발생"); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2F80ED] via-[#667eea] to-[#764ba2] p-4">
      <Card className="w-full max-w-md shadow-soft-lg bg-white/95 backdrop-blur-sm border-0">
        <CardHeader className="text-center pb-2 pt-8">
          <CardTitle className="text-3xl font-heading font-bold bg-gradient-to-r from-[#2F80ED] to-[#764ba2] bg-clip-text text-transparent">
            {step === 1 ? "소속 회사 찾기" : "직원 정보 입력"}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2 font-sans">
            {step === 1 ? "근무하시는 센터(본사)의 사업자 번호를 입력해주세요." : `${foundCompany?.name} 소속으로 가입을 신청합니다.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Step 1: 회사 검색 */}
          {step === 1 && (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-gray-700">사업자 등록번호 (숫자만)</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="예: 1234567890" 
                            value={bizNum}
                            onChange={(e) => setBizNum(e.target.value)}
                            className="bg-white"
                        />
                        <Button onClick={handleSearchCompany} className="bg-gradient-to-r from-[#2F80ED] to-[#667eea] hover:from-[#1e5bb8] hover:to-[#5568d3] text-white font-sans font-medium rounded-lg shadow-soft transition-all" disabled={isLoading}>
                            <Search className="w-4 h-4"/>
                        </Button>
                    </div>
                </div>

                {/* 검색 결과 표시 */}
                {foundCompany && (
                    <div className="card-modern p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-0 mt-4 animate-fade-in">
                        <div className="flex items-center gap-3 text-[#2F80ED] font-heading font-bold mb-2">
                            <div className="p-2 rounded-lg bg-white/50">
                                <Building2 className="w-5 h-5"/> 
                            </div>
                            {foundCompany.name}
                        </div>
                        <p className="text-sm text-gray-600 mb-4 font-sans">대표자: {foundCompany.representative_name}</p>
                        <Button 
                            className="w-full bg-gradient-to-r from-[#F2994A] to-[#e27f34] hover:from-[#e27f34] hover:to-[#d16a1f] text-white font-heading font-bold rounded-xl shadow-soft transition-all hover:shadow-soft-lg hover:scale-[1.02]"
                            onClick={() => setStep(2)}
                        >
                            이 회사로 가입 진행 <CheckCircle2 className="w-4 h-4 ml-2"/>
                        </Button>
                    </div>
                )}
                
                <div className="border-t pt-4 mt-6 text-center">
                    <p className="text-xs text-gray-400 mb-2">혹시 회사를 새로 등록하시나요?</p>
                    <Button variant="outline" className="text-[#2F80ED] border-[#2F80ED] hover:bg-blue-50" onClick={() => router.push('/join-company')}>
                        회사(대표) 계정 생성하기
                    </Button>
                </div>
            </div>
          )}

          {/* Step 2: 정보 입력 */}
          {step === 2 && (
             <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                <div className="p-2 bg-gray-100 rounded text-center text-sm text-gray-500 mb-2">
                    소속: <span className="font-bold text-black">{foundCompany.name}</span>
                </div>
                <div className="space-y-1"><Label>이름 <span className="text-red-500">*</span></Label><Input onChange={(e) => setFormData({...formData, name: e.target.value})}/></div>
                <div className="space-y-1"><Label>연락처 <span className="text-red-500">*</span></Label><Input onChange={(e) => setFormData({...formData, phone: e.target.value})}/></div>
                <div className="space-y-1"><Label>이메일 (아이디) <span className="text-red-500">*</span></Label><Input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})}/></div>
                <div className="space-y-1"><Label>비밀번호 <span className="text-red-500">*</span></Label><Input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})}/></div>
                <div className="space-y-1"><Label>입사일</Label><Input type="date" onChange={(e) => setFormData({...formData, joined_at: e.target.value})}/></div>
                <div className="space-y-1"><Label>직급</Label>
                    <Select onValueChange={(v) => setFormData({...formData, job_title: v})}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent className="bg-white">{JOB_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="flex gap-3 mt-6">
                    <Button variant="ghost" onClick={() => setStep(1)} className="w-1/3 text-gray-500 font-sans hover:bg-gray-100 rounded-xl"><ArrowLeft className="w-4 h-4 mr-1"/> 이전</Button>
                    <Button onClick={handleSignup} className="w-2/3 bg-gradient-to-r from-[#F2994A] to-[#e27f34] hover:from-[#e27f34] hover:to-[#d16a1f] text-white font-heading font-bold rounded-xl shadow-soft transition-all hover:shadow-soft-lg hover:scale-[1.02]" disabled={isLoading}>
                        {isLoading ? "처리 중..." : "가입 신청 완료"}
                    </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}