"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Building, Phone, User } from "lucide-react";

export default function SystemAdminPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      // 1. 권한 체크 (system_admin만 통과)
      const { data: me } = await supabase
        .from("staffs")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (me?.role !== "system_admin") {
        alert("접근 권한이 없습니다.");
        return router.push("/admin");
      }

      fetchCompanies();
    };
    init();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    // 모든 회사 목록 가져오기 (최신순)
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCompanies(data);
    setIsLoading(false);
  };

  // 승인 처리 함수
  const handleApprove = async (companyId: string, companyName: string) => {
    if (!confirm(`'${companyName}' 업체의 가입을 승인하시겠습니까?`)) return;

    const { error } = await supabase
      .from("companies")
      .update({ status: "active" })
      .eq("id", companyId);

    if (!error) {
      alert("승인 완료! 이제 해당 업체 대표가 로그인할 수 있습니다.");
      fetchCompanies();
    } else {
      alert("에러: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#2F80ED]">🛠️ 시스템 관리자 (We:form 본사)</h2>
      <p className="text-gray-500">서비스를 이용 중인 고객사(Company) 현황입니다.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((comp) => (
          <Card key={comp.id} className={`border-t-4 shadow-md ${comp.status === 'active' ? 'border-t-[#2F80ED]' : 'border-t-[#F2994A]'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-400"/>
                {comp.name}
              </CardTitle>
              {comp.status === 'active' 
                ? <Badge className="bg-[#2F80ED]">운영중</Badge>
                : <Badge className="bg-[#F2994A] text-black">승인대기</Badge>
              }
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4"/> 代表: <span className="font-medium">{comp.representative_name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4"/> {comp.contact_phone || "-"}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                    가입일: {new Date(comp.created_at).toLocaleDateString()}
                </div>
              </div>

              {comp.status === 'pending' && (
                <Button 
                    onClick={() => handleApprove(comp.id, comp.name)}
                    className="w-full bg-[#F2994A] hover:bg-[#d68238] text-black font-bold"
                >
                    <CheckCircle className="w-4 h-4 mr-2"/> 가입 승인하기
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}