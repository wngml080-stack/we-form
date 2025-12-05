"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; // params 사용
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams(); // URL에서 회사 ID 가져오기
  const companyId = params.id;

  const [company, setCompany] = useState<any>(null);
  const [staffs, setStaffs] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      // 1. 회사 정보 가져오기
      const { data: comp } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      
      if (comp) setCompany(comp);

      // 2. 이 회사 소속 직원들만 가져오기 (보안 격리)
      const { data: staffList } = await supabase
        .from("staffs")
        .select("*, gyms(name)")
        .eq("company_id", companyId) // 👈 여기가 핵심 필터링!
        .order("name", { ascending: true });

      if (staffList) setStaffs(staffList);
    };

    fetchData();
  }, [companyId]);

  if (!company) return <div className="p-10">로딩 중...</div>;

  return (
    <div className="space-y-6 p-4 md:p-6 md:space-y-8">
      <div className="flex items-start md:items-center gap-4 mb-6 md:mb-8">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4"/>
        </Button>
        <div>
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-[#2F80ED] mb-2">{company.name} 직원 목록</h2>
            <p className="text-sm md:text-base text-gray-600 font-sans">대표자: {company.representative_name} | 연락처: {company.contact_phone}</p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">소속 지점</th>
              <th className="px-4 py-3">직책</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">이메일</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((staff) => (
              <tr key={staff.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{staff.name}</td>
                <td className="px-4 py-3 text-gray-600">
                    {
                        // @ts-ignore
                        staff.gyms?.name || "본사/미정"
                    }
                </td>
                <td className="px-4 py-3">{staff.job_title}</td>
                <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-slate-100">{staff.employment_status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">{staff.email}</td>
              </tr>
            ))}
            {staffs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">소속된 직원이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}