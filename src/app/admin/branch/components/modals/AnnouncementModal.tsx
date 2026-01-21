"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, X, Megaphone, Info, AlertCircle, Clock, Save } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AnnouncementForm, BranchAnnouncement, GymInfo } from "../../hooks/useBranchData";

interface AnnouncementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAnnouncement: BranchAnnouncement | null;
  announcementForm: AnnouncementForm;
  setAnnouncementForm: (form: AnnouncementForm) => void;
  gyms: GymInfo[];
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
      <DialogContent className="w-full max-w-4xl bg-[#f8fafc] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[40px]">
        <DialogHeader className="px-10 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingAnnouncement ? '지점 공지 수정' : '새 지점 공지 등록'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-sm text-slate-400 font-bold">지점의 소식을 구성원과 공유하세요</p>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">지점 공지사항 정보를 입력합니다</DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-10 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#f8fafc]">
          {/* 주요 정보 섹션 */}
          <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">1</div>
              <h3 className="text-lg font-black text-slate-900">기본 정보 설정</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="announcement-title" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="announcement-title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                  className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-content" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Content <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="announcement-content"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="내용을 자세히 입력하세요"
                  className="min-h-[160px] bg-slate-50 border-none rounded-[24px] font-bold p-6 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 설정 섹션 */}
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</div>
                <h3 className="text-lg font-black text-slate-900">분류 및 대상</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Priority</Label>
                  <Select
                    value={announcementForm.priority}
                    onValueChange={(value) => setAnnouncementForm({ ...announcementForm, priority: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="우선순위 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="urgent" className="rounded-xl font-bold py-3 text-rose-600 bg-rose-50 mb-1">긴급</SelectItem>
                      <SelectItem value="normal" className="rounded-xl font-bold py-3 text-blue-600 bg-blue-50 mb-1">일반</SelectItem>
                      <SelectItem value="low" className="rounded-xl font-bold py-3 text-slate-500 bg-slate-50">참고</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Target Gym</Label>
                  <Select
                    value={announcementForm.gym_id}
                    onValueChange={(value) => setAnnouncementForm({ ...announcementForm, gym_id: value })}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="대상 지점 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                      {gyms.map((gym) => (
                        <SelectItem key={gym.id} value={gym.id} className="rounded-xl font-bold py-3">
                          {gym.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <Info className="w-3 h-3" /> Selected gym only
                  </p>
                </div>
              </div>
            </div>

            {/* 일정 섹션 */}
            <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">3</div>
                <h3 className="text-lg font-black text-slate-900">게시 기간</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 bg-slate-50 border-none rounded-2xl font-bold justify-start text-left px-4 focus:ring-2 focus:ring-blue-100",
                            !announcementForm.start_date && "text-slate-300"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
                          {announcementForm.start_date ? (
                            format(new Date(announcementForm.start_date), "yyyy-MM-dd")
                          ) : (
                            <span>시작일</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[32px] overflow-hidden" align="start">
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
                          className="p-4"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 bg-slate-50 border-none rounded-2xl font-bold justify-start text-left px-4 focus:ring-2 focus:ring-blue-100",
                            !announcementForm.end_date && "text-slate-300"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
                          {announcementForm.end_date ? (
                            format(new Date(announcementForm.end_date), "yyyy-MM-dd")
                          ) : (
                            <span className="text-emerald-600 font-black">무기한</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-none shadow-2xl rounded-2xl xs:rounded-3xl sm:rounded-[32px] overflow-hidden" align="start">
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
                          className="p-4"
                        />
                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                          <Button
                            variant="ghost"
                            className="w-full h-10 rounded-xl font-black text-xs text-slate-500 hover:bg-white transition-all"
                            onClick={() => setAnnouncementForm({ ...announcementForm, end_date: "" })}
                          >
                            기간 설정 없이 무기한으로 게시
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                  <div className="relative flex items-center h-6">
                    <input
                      id="announcement-active"
                      type="checkbox"
                      checked={announcementForm.is_active}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })}
                      className="w-5 h-5 rounded-lg border-emerald-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all"
                    />
                  </div>
                  <Label htmlFor="announcement-active" className="text-sm font-black text-emerald-800 cursor-pointer">
                    저장 즉시 구성원에게 게시
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-10 py-8 bg-white border-t flex items-center justify-end gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-14 px-8 rounded-2xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
          >
            취소
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">저장 중...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {editingAnnouncement ? '수정 내용 저장' : '공지사항 등록하기'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
