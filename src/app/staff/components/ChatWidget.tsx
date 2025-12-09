import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export function ChatWidget() {
  return (
    <Card className="border-none shadow-sm bg-white h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-gray-900">채팅방</CardTitle>
        <span className="text-xs text-gray-400">2개 안읽음</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#2F80ED] flex items-center justify-center text-white font-bold">
            W
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-bold text-sm text-gray-900">We:form 공지방</span>
              <span className="text-[10px] text-gray-400">오후 2:40</span>
            </div>
            <div className="text-xs text-gray-500 truncate">
              이번 주 시스템 점검 안내입니다.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

