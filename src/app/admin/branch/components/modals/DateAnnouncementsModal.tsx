"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bell, Activity, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface DateAnnouncementsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  announcements: any[];
  onToggleActive: (announcement: any) => void;
  onEdit: (announcement: any) => void;
  onDelete: (id: string) => void;
}

export function DateAnnouncementsModal({
  isOpen,
  onOpenChange,
  selectedDate,
  announcements,
  onToggleActive,
  onEdit,
  onDelete
}: DateAnnouncementsModalProps) {
  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    normal: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-gray-100 text-gray-700 border-gray-200"
  };
  const priorityLabels: Record<string, string> = {
    urgent: "긴급",
    normal: "일반",
    low: "참고"
  };

  const getDateAnnouncements = () => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return announcements.filter(announcement => {
      const startDate = new Date(announcement.start_date);
      const endDate = announcement.end_date ? new Date(announcement.end_date) : new Date(announcement.start_date);
      const selected = new Date(dateKey);
      return selected >= startDate && selected <= endDate;
    });
  };

  const dateAnnouncements = getDateAnnouncements();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedDate && format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko })} 지점 공지사항
          </DialogTitle>
          <DialogDescription className="sr-only">선택한 날짜의 지점 공지사항 목록입니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {dateAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">이 날짜에 등록된 지점 공지사항이 없습니다.</p>
            </div>
          ) : (
            dateAnnouncements.map((announcement) => (
              <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className={priorityColors[announcement.priority]}>
                        {priorityLabels[announcement.priority]}
                      </Badge>
                      {announcement.gym_id ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {announcement.gyms?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          전사 공지
                        </Badge>
                      )}
                      {!announcement.is_active && (
                        <Badge className="bg-gray-400">비활성</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{announcement.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                    <div className="text-xs text-gray-500 flex gap-3 items-center flex-wrap">
                      <span>작성자: {announcement.staffs?.name || '알 수 없음'}</span>
                      <span>시작: {announcement.start_date}</span>
                      {announcement.end_date && <span>종료: {announcement.end_date}</span>}
                      <span>조회: {announcement.view_count || 0}회</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-purple-50"
                      onClick={() => onToggleActive(announcement)}
                      title={announcement.is_active ? "비활성화" : "활성화"}
                    >
                      <Activity className={`h-4 w-4 ${announcement.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-purple-50"
                      onClick={() => {
                        onOpenChange(false);
                        onEdit(announcement);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-50"
                      onClick={() => onDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
