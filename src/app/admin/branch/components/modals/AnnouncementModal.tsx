"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AnnouncementForm } from "../../hooks/useBranchData";

interface AnnouncementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAnnouncement: any | null;
  announcementForm: AnnouncementForm;
  setAnnouncementForm: (form: AnnouncementForm) => void;
  gyms: any[];
  onSave: () => void;
  isLoading: boolean;
}

export function AnnouncementModal({
  isOpen,
  onOpenChange,
  editingAnnouncement,
  announcementForm,
  setAnnouncementForm,
  gyms,
  onSave,
  isLoading
}: AnnouncementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {editingAnnouncement ? '지점 공지사항 수정' : '새 지점 공지사항 등록'}
          </DialogTitle>
          <DialogDescription className="sr-only">지점 공지사항 정보를 입력합니다</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 제목 */}
          <div>
            <Label htmlFor="announcement-title" className="text-sm font-semibold text-gray-700">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="announcement-title"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              placeholder="지점 공지사항 제목을 입력하세요"
              className="mt-1"
            />
          </div>

          {/* 내용 */}
          <div>
            <Label htmlFor="announcement-content" className="text-sm font-semibold text-gray-700">
              내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="announcement-content"
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              placeholder="공지사항 내용을 입력하세요"
              className="mt-1 min-h-[120px]"
            />
          </div>

          {/* 우선순위 */}
          <div>
            <Label htmlFor="announcement-priority" className="text-sm font-semibold text-gray-700">
              우선순위 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={announcementForm.priority}
              onValueChange={(value) => setAnnouncementForm({ ...announcementForm, priority: value })}
            >
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue placeholder="우선순위 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="urgent">긴급</SelectItem>
                <SelectItem value="normal">일반</SelectItem>
                <SelectItem value="low">참고</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 대상 지점 */}
          <div>
            <Label htmlFor="announcement-gym" className="text-sm font-semibold text-gray-700">
              대상 지점
            </Label>
            <Select
              value={announcementForm.gym_id}
              onValueChange={(value) => setAnnouncementForm({ ...announcementForm, gym_id: value })}
            >
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue placeholder="지점 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {gyms.map((gym) => (
                  <SelectItem key={gym.id} value={gym.id}>
                    {gym.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              현재 지점에 대한 공지사항이 등록됩니다.
            </p>
          </div>

          {/* 날짜 범위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                시작일 <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !announcementForm.start_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {announcementForm.start_date ? (
                      format(new Date(announcementForm.start_date), "PPP", { locale: ko })
                    ) : (
                      <span>날짜를 선택하세요</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={announcementForm.start_date ? new Date(announcementForm.start_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setAnnouncementForm({
                          ...announcementForm,
                          start_date: format(date, "yyyy-MM-dd")
                        });
                      }
                    }}
                    locale={ko}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">
                종료일
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !announcementForm.end_date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {announcementForm.end_date ? (
                      format(new Date(announcementForm.end_date), "PPP", { locale: ko })
                    ) : (
                      <span>무기한</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={announcementForm.end_date ? new Date(announcementForm.end_date) : undefined}
                    onSelect={(date) => {
                      setAnnouncementForm({
                        ...announcementForm,
                        end_date: date ? format(date, "yyyy-MM-dd") : ""
                      });
                    }}
                    locale={ko}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => setAnnouncementForm({ ...announcementForm, end_date: "" })}
                    >
                      무기한으로 설정
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 mt-1">
                비워두면 무기한으로 표시됩니다.
              </p>
            </div>
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center gap-2 pt-2">
            <input
              id="announcement-active"
              type="checkbox"
              checked={announcementForm.is_active}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <Label htmlFor="announcement-active" className="text-sm text-gray-700 cursor-pointer">
              즉시 활성화 (체크 해제 시 비활성 상태로 저장)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? '저장 중...' : (editingAnnouncement ? '수정' : '등록')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
