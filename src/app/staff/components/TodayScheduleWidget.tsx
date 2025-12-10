import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TodayScheduleWidgetProps {
  schedules: any[];
  onViewAll: () => void;
}

export function TodayScheduleWidget({ schedules, onViewAll }: TodayScheduleWidgetProps) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const todaySchedules = schedules
    .filter(s => s.start_time.startsWith(todayStr))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <Card className="border-none shadow-sm bg-white h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#2F80ED]">
          <span className="w-3 h-3 rounded-full bg-[#2F80ED]"></span>
          오늘 예정된 수업
          <span className="text-gray-400 text-sm font-normal">{todaySchedules.length}</span>
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={onViewAll}>
          전체보기
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {todaySchedules.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            오늘 예정된 수업이 없습니다.
          </div>
        ) : (
          todaySchedules.slice(0, 3).map((schedule) => (
            <div key={schedule.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 gap-3">
              <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                  schedule.type === 'PT' ? 'bg-blue-100 text-blue-600' :
                  schedule.type === 'OT' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {schedule.type}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{schedule.member_name} 회원님</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span className="whitespace-nowrap">
                      {new Date(schedule.start_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} 시작
                    </span>
                    {schedule.trainer_name && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="truncate">{schedule.trainer_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs bg-white border shadow-sm h-8 w-full sm:w-auto shrink-0">
                상세
              </Button>
            </div>
          ))
        )}
        {todaySchedules.length > 3 && (
            <div className="text-center mt-2">
                <Button variant="link" size="sm" className="text-xs text-gray-500" onClick={onViewAll}>
                    + {todaySchedules.length - 3}개 더보기
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

