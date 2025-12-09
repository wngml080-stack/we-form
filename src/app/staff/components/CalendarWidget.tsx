import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import { Settings } from "lucide-react";

export function CalendarWidget() {
  return (
    <Card className="border-none shadow-sm bg-white h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-gray-900">일정</CardTitle>
        <Settings className="w-4 h-4 text-gray-400 cursor-pointer" />
      </CardHeader>
      <CardContent className="p-2">
        <div className="text-xs custom-calendar-widget">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={koLocale}
            headerToolbar={{
              left: 'title',
              center: '',
              right: 'prev,next'
            }}
            height="auto"
            contentHeight="auto"
            dayCellClassNames="hover:bg-blue-50 cursor-pointer rounded transition-colors"
            fixedWeekCount={false}
            showNonCurrentDates={false}
          />
        </div>
        <div className="mt-4 px-2">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-[#2F80ED] rounded-full"></div>
                <span className="text-sm font-bold text-[#2F80ED]">오늘의 주요 일정</span>
            </div>
            <ul className="text-xs text-gray-500 space-y-1 ml-3 list-disc">
                <li>오후 2:00 전체 강사 회의</li>
                <li>오후 5:00 시설 점검</li>
            </ul>
        </div>
      </CardContent>
    </Card>
  );
}

