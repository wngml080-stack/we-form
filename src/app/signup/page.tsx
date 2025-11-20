"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const JOB_TITLES = ["대표", "이사", "지점장", "팀장", "트레이너", "FC", "기타"];

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "", password: "", name: "", phone: "", job_title: "", joined_at: ""
  });

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("가입 신청 완료! 본사 승인 후 이용 가능합니다.");
        router.push("/login");
      } else {
        alert("가입 실패");
      }
    } catch (e) { alert("에러 발생"); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2F80ED] p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle className="text-center">We:form 가입신청</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>이름</Label><Input onChange={(e) => setFormData({...formData, name: e.target.value})}/></div>
          <div className="space-y-2"><Label>연락처</Label><Input onChange={(e) => setFormData({...formData, phone: e.target.value})}/></div>
          <div className="space-y-2"><Label>이메일</Label><Input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})}/></div>
          <div className="space-y-2"><Label>비밀번호</Label><Input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})}/></div>
          <div className="space-y-2"><Label>입사일</Label><Input type="date" onChange={(e) => setFormData({...formData, joined_at: e.target.value})}/></div>
          <div className="space-y-2"><Label>직급</Label>
            <Select onValueChange={(v) => setFormData({...formData, job_title: v})}>
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>{JOB_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSignup}
            className="w-full bg-[#2F80ED] hover:bg-[#1c6cd7]"
            disabled={isLoading}
          >
            가입 신청
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}