import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign } from "lucide-react";

interface CenterStats {
  totalMembers: number;
  activeMembers?: number;
  newMembers?: number;
  monthlyRevenue?: number;
  revenueGoalPercent?: number;
}

interface MonthlyStatsWidgetProps {
  stats: CenterStats | null;
}

export function MonthlyStatsWidget({ stats }: MonthlyStatsWidgetProps) {
  return (
    <Card className="border-none shadow-sm bg-white h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold border-l-4 border-[#2F80ED] pl-3 text-gray-900">
          센터 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">전체 회원</div>
              <div className="font-bold text-gray-900">{stats?.totalMembers || 0}명</div>
            </div>
          </div>
          <span className="text-xs text-gray-400">신규 1명</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">활성 회원</div>
              <div className="font-bold text-gray-900">1명</div>
            </div>
          </div>
          <span className="text-xs text-gray-400">100% 활성</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">이번 달 매출</div>
              <div className="font-bold text-gray-900">1,980,000원</div>
            </div>
          </div>
          <span className="text-xs text-gray-400">목표 대비 85%</span>
        </div>
      </CardContent>
    </Card>
  );
}

