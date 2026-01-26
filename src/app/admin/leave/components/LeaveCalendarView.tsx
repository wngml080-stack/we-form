"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function LeaveCalendarView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>캘린더 뷰</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-[#8B95A1]">캘린더 뷰는 곧 추가될 예정입니다.</p>
      </CardContent>
    </Card>
  );
}
