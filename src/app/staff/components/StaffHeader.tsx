import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface StaffHeaderProps {
  staffName: string | null;
  gymName: string | null;
}

export function StaffHeader({ staffName, gymName }: StaffHeaderProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const hours = today.getHours();
  let greeting = "좋은 하루 되세요";
  if (hours < 12) greeting = "활기찬 아침입니다";
  else if (hours < 18) greeting = "즐거운 오후입니다";
  else greeting = "편안한 저녁 되세요";

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          {staffName || "선생님"}님 {greeting} <span className="text-2xl">😊</span>
        </h1>
        <p className="text-gray-500 mt-1">
          오늘도 <span className="font-semibold text-[#2F80ED]">{gymName || "We:form"}</span>의 성장을 응원합니다!
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm text-gray-500">{dateStr}</span>
        <Button variant="outline" size="sm" className="text-xs h-8">
          <Settings className="w-3 h-3 mr-1" />
          위젯 설정
        </Button>
      </div>
    </div>
  );
}

