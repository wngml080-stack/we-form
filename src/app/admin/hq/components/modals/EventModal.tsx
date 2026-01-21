"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EventForm } from "../../hooks/useHqData";

interface EventModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: any | null;
  eventForm: EventForm;
  setEventForm: (form: EventForm) => void;
  gyms: any[];
  onSubmit: () => void;
  isLoading: boolean;
}

import { cn } from "@/lib/utils";
import { Calendar, MapPin, Clock, Save, Plus, Pencil, Info, Users } from "lucide-react";

export function EventModal({
  isOpen,
  onOpenChange,
  editingEvent,
  eventForm,
  setEventForm,
  gyms,
  onSubmit,
  isLoading
}: EventModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl bg-[#f8fafc] p-0 border-none rounded-2xl xs:rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {editingEvent ? <Pencil className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {editingEvent ? '회사 일정 & 행사 수정' : '새 회사 일정 & 행사 등록'}
              </h2>
              <p className="text-indigo-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
                {editingEvent ? 'Update Company Event' : 'Register New Corporate Event'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* 행사명 */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">행사명 *</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="행사 이름을 입력하세요"
                className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">설명</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="행사 관련 상세 설명을 입력하세요 (선택사항)"
                className="min-h-[100px] bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all resize-none p-4"
              />
            </div>

            {/* 행사 유형과 대상 지점 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">행사 유형 *</Label>
                <Select
                  value={eventForm.event_type}
                  onValueChange={(value) => setEventForm({ ...eventForm, event_type: value })}
                >
                  <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all">
                    <SelectValue placeholder="행사 유형 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="general" className="rounded-xl font-bold py-3 text-slate-600">일반</SelectItem>
                    <SelectItem value="training" className="rounded-xl font-bold py-3 text-blue-600">교육</SelectItem>
                    <SelectItem value="meeting" className="rounded-xl font-bold py-3 text-indigo-600">회의</SelectItem>
                    <SelectItem value="holiday" className="rounded-xl font-bold py-3 text-rose-600 font-black">휴무</SelectItem>
                    <SelectItem value="celebration" className="rounded-xl font-bold py-3 text-orange-600 font-black">행사</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">대상 지점</Label>
                <Select
                  value={eventForm.gym_id}
                  onValueChange={(value) => setEventForm({ ...eventForm, gym_id: value })}
                >
                  <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all">
                    <SelectValue placeholder="전사 행사 (모든 지점)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2 max-h-[250px]">
                    <SelectItem value="all" className="rounded-xl font-bold py-3 text-indigo-600 font-black">전사 행사 (모든 지점)</SelectItem>
                    {gyms.map((gym) => (
                      <SelectItem key={gym.id} value={gym.id} className="rounded-xl font-bold py-3">
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 행사 날짜 */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">행사 날짜 *</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                  className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* 시간 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">시작 시간</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all pl-10"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">종료 시간</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all pl-10"
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* 장소 */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">장소</Label>
              <div className="relative">
                <Input
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="행사 장소를 입력하세요 (선택사항)"
                  className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* 참석 대상 */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">참석 대상</Label>
              <Select
                value={eventForm.target_audience}
                onValueChange={(value) => setEventForm({ ...eventForm, target_audience: value })}
              >
                <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all">
                  <SelectValue placeholder="참석 대상 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="all" className="rounded-xl font-bold py-3">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400"/> 전체</div>
                  </SelectItem>
                  <SelectItem value="management" className="rounded-xl font-bold py-3 text-blue-600">관리자</SelectItem>
                  <SelectItem value="trainers" className="rounded-xl font-bold py-3 text-indigo-600">트레이너</SelectItem>
                  <SelectItem value="specific" className="rounded-xl font-bold py-3 text-orange-600">특정 인원</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 색상 */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">캘린더 색상</Label>
              <Select
                value={eventForm.color}
                onValueChange={(value) => setEventForm({ ...eventForm, color: value })}
              >
                <SelectTrigger className="h-12 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all">
                  <SelectValue placeholder="색상 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="blue" className="rounded-xl font-bold py-3 text-blue-600">파란색</SelectItem>
                  <SelectItem value="red" className="rounded-xl font-bold py-3 text-rose-600">빨간색</SelectItem>
                  <SelectItem value="green" className="rounded-xl font-bold py-3 text-emerald-600">초록색</SelectItem>
                  <SelectItem value="yellow" className="rounded-xl font-bold py-3 text-amber-600">노란색</SelectItem>
                  <SelectItem value="purple" className="rounded-xl font-bold py-3 text-purple-600">보라색</SelectItem>
                  <SelectItem value="orange" className="rounded-xl font-bold py-3 text-orange-600">주황색</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 활성 상태 */}
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
              <input
                type="checkbox"
                id="event-active"
                checked={eventForm.is_active}
                onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-200 text-indigo-500 focus:ring-indigo-100 transition-all cursor-pointer"
              />
              <Label htmlFor="event-active" className="text-sm font-black text-slate-700 cursor-pointer">즉시 활성화하여 캘린더에 노출</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
              취소
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={isLoading}
              className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : (editingEvent ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
              {editingEvent ? '수정사항 저장' : '행사 등록하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
