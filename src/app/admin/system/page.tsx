"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Building, Phone, User, Pencil, ArrowRight } from "lucide-react";

export default function SystemAdminPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 수정 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", representative_name: "", contact_phone: "", status: "" });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: me } = await supabase.from("staffs").select("role").eq("user_id", user.id).single();
      
      // 시스템 관리자가 아니면 쫓아내기
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
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
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

  // 수정 모달 열기
  const openEdit = (e: any, comp: any) => {
    e.stopPropagation(); // 카드 클릭 시 상세페이지 이동 방지
    setEditForm({
        id: comp.id,
        name: comp.name,
        representative_name: comp.representative_name,
        contact_phone: comp.contact_phone,
        status: comp.status
    });
    setIsEditOpen(true);
  };

  // 수정 저장
  const handleUpdate = async () => {
    try {
        const res = await fetch("/api/admin/system/update-company", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            alert("수정 완료!");
            setIsEditOpen(false);
            fetchCompanies();
        } else {
            alert("수정 실패: " + result.error);
        }
    } catch (error: any) {
        alert("오류 발생: " + error.message);
    }
  };

  if (isLoading) return <div className="p-10 text-center">데이터 로딩 중...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#2F80ED]">🛠️ 시스템 관리자 (We:form 본사)</h2>
      <p className="text-gray-500">서비스를 이용 중인 고객사(Company)를 관리하고 접속합니다.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((comp) => (
          <Card 
            key={comp.id} 
            className={`border-t-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${comp.status === 'active' ? 'border-t-[#2F80ED]' : 'border-t-[#F2994A]'}`}
            onClick={() => router.push(`/admin/system/${comp.id}`)} // 👈 상세 페이지 이동
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 truncate">
                <Building className="w-5 h-5 text-gray-400"/>
                {comp.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                 {comp.status === 'active' 
                    ? <Badge className="bg-[#2F80ED] hover:bg-[#2F80ED]">운영중</Badge>
                    : <Badge className="bg-[#F2994A] text-black hover:bg-[#F2994A]">대기</Badge>
                  }
                  {/* 수정 버튼 */}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => openEdit(e, comp)}>
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-[#2F80ED]"/>
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4"/> 대표: <span className="font-medium">{comp.representative_name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4"/> {comp.contact_phone || "-"}
                </div>
              </div>
              
              {/* 승인 대기 상태일 때만 승인 버튼 표시 */}
              {comp.status === 'pending' && (
                <Button 
                    onClick={(e) => { e.stopPropagation(); handleApprove(comp.id, comp.name); }}
                    className="w-full mb-2 bg-[#F2994A] hover:bg-[#d68238] text-black font-bold"
                >
                    <CheckCircle className="w-4 h-4 mr-2"/> 가입 승인하기
                </Button>
              )}

              <div className="flex justify-end text-xs text-blue-500 font-medium items-center mt-2">
                  직원 관리하러 가기 <ArrowRight className="w-3 h-3 ml-1"/>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>회사 정보 수정</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2"><Label>회사명</Label><Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}/></div>
                <div className="space-y-2"><Label>대표자</Label><Input value={editForm.representative_name} onChange={(e) => setEditForm({...editForm, representative_name: e.target.value})}/></div>
                <div className="space-y-2"><Label>연락처</Label><Input value={editForm.contact_phone} onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})}/></div>
                <div className="space-y-2"><Label>상태</Label>
                    <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="active">운영중</SelectItem>
                            <SelectItem value="pending">승인대기</SelectItem>
                            <SelectItem value="suspended">이용정지</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter><Button onClick={handleUpdate} className="bg-[#2F80ED]">저장</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}