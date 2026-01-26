"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function LeaveSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>휴가 유형 관리</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-[#8B95A1]">휴가 유형 설정 기능은 곧 추가될 예정입니다.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>연차 부여 관리</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-[#8B95A1]">연차 부여 기능은 곧 추가될 예정입니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
