"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, FileText, Send, Video, MapPin, AlignLeft, Sparkles, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  MEETING_TYPE_LABELS,
  type MeetingCreateInput,
  type MeetingType,
  type AgendaCreateInput,
} from "@/types/meeting";
import { cn } from "@/lib/utils";

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingCreateInput) => Promise<boolean>;
  gymId: string | null;
  companyId: string | null;
}

type Staff = {
  id: string;
  name: string;
};

export function CreateMeetingModal({
  isOpen,
  onClose,
  onSubmit,
  gymId,
  companyId,
}: CreateMeetingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meeting_type: "regular" as MeetingType,
    scheduled_at: "",
    location: "",
    is_online: false,
    online_link: "",
    participant_ids: [] as string[],
  });
  const [agendas, setAgendas] = useState<AgendaCreateInput[]>([]);

  // 직원 목록 가져오기
  useEffect(() => {
    if (isOpen && gymId) {
      const fetchStaffs = async () => {
        try {
          const response = await fetch(`/api/admin/staffs?gym_id=${gymId}`);
          if (response.ok) {
            const data = await response.json();
            setStaffs(data.staffs || []);
          }
        } catch (error) {
          console.error("Failed to fetch staffs:", error);
        }
      };
      fetchStaffs();
    }
  }, [isOpen, gymId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_at) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        ...formData,
        company_id: companyId || "",
        gym_id: gymId,
        agendas,
      });

      if (success) {
        // 폼 리셋
        setFormData({
          title: "",
          description: "",
          meeting_type: "regular",
          scheduled_at: "",
          location: "",
          is_online: false,
          online_link: "",
          participant_ids: [],
        });
        setAgendas([]);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAgenda = () => {
    setAgendas([...agendas, { title: "", estimated_minutes: 10 }]);
  };

  const removeAgenda = (index: number) => {
    setAgendas(agendas.filter((_, i) => i !== index));
  };

  const updateAgenda = (index: number, field: keyof AgendaCreateInput, value: string | number) => {
    const updated = [...agendas];
    updated[index] = { ...updated[index], [field]: value };
    setAgendas(updated);
  };

  const toggleParticipant = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(staffId)
        ? prev.participant_ids.filter(id => id !== staffId)
        : [...prev.participant_ids, staffId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl rounded-[40px] [&>button]:hidden">
        {/* Header - Toss Modern Style */}
        <DialogHeader className="px-10 py-10 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <DialogTitle className="sr-only">새 회의 만들기</DialogTitle>
          <DialogDescription className="sr-only">새로운 회의 일정을 작성합니다.</DialogDescription>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight">새 회의 만들기</h2>
                <p className="text-base text-slate-400 font-bold mt-1.5">생산적인 회의를 위한 첫걸음을 시작하세요</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group active:scale-90"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#f8fafc] custom-scrollbar">
          <form id="meeting-form" onSubmit={handleSubmit} className="space-y-10">
            {/* Step 1: Basic Info */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">1</div>
                <h3 className="text-lg font-black text-slate-900">회의 기본 정보</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Title *</Label>
                  <div className="relative group">
                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="회의 제목을 입력하세요"
                      className="h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Type</Label>
                    <Select
                      value={formData.meeting_type}
                      onValueChange={(value: MeetingType) => setFormData({ ...formData, meeting_type: value })}
                    >
                      <SelectTrigger className="h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[24px] border-none shadow-2xl p-2">
                        {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="rounded-xl py-3 font-bold">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="scheduled_at" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date & Time *</Label>
                    <div className="relative group">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                        className="h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 참여 직원 선택 */}
                <div className="space-y-3">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Participants (회의참여직원)</Label>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {staffs.map((staff) => (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => toggleParticipant(staff.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                            formData.participant_ids.includes(staff.id)
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                              : "bg-white text-slate-600 border-slate-200 hover:border-blue-200"
                          )}
                        >
                          {staff.name}
                        </button>
                      ))}
                      {staffs.length === 0 && (
                        <p className="text-xs text-slate-400 font-bold p-2">참여할 직원이 없습니다.</p>
                      )}
                    </div>
                    {formData.participant_ids.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected ({formData.participant_ids.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.participant_ids.map(id => {
                            const staff = staffs.find(s => s.id === id);
                            return staff ? (
                              <Badge key={id} variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 font-black px-2 py-1 rounded-lg gap-1">
                                {staff.name}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleParticipant(id)} />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Meeting Content (회의내용) */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-black">2</div>
                  <h3 className="text-lg font-black text-slate-900">회의 내용 (Agendas)</h3>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={addAgenda}
                  className="h-10 px-4 rounded-xl font-black text-blue-600 hover:bg-blue-50 transition-all gap-2"
                >
                  <Plus className="w-4 h-4" />
                  내용 추가
                </Button>
              </div>

              <div className="space-y-4">
                {agendas.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200 group cursor-pointer hover:bg-slate-100 transition-all" onClick={addAgenda}>
                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3 group-hover:scale-110 transition-all" />
                    <p className="text-sm text-slate-400 font-bold">등록된 회의 내용이 없습니다.<br />효율적인 진행을 위해 논의할 내용을 추가해보세요.</p>
                    <p className="text-xs text-blue-500 font-black mt-3 uppercase tracking-widest">+ Add Content</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agendas.map((agenda, index) => (
                      <div key={index} className="flex flex-col gap-3 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 shadow-inner">
                              {index + 1}
                            </div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Agenda Item</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAgenda(index)}
                            className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <Input
                              value={agenda.title}
                              onChange={(e) => updateAgenda(index, "title", e.target.value)}
                              placeholder={`논의할 내용을 입력하세요 (예: 회원 관리 프로세스 개선)`}
                              className="h-12 px-5 rounded-xl bg-white border-slate-100 font-bold focus:ring-2 focus:ring-blue-100 shadow-sm"
                            />
                          </div>
                          <div className="w-full md:w-32 relative group">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                              type="number"
                              value={agenda.estimated_minutes || ""}
                              onChange={(e) =>
                                updateAgenda(index, "estimated_minutes", parseInt(e.target.value) || 0)
                              }
                              placeholder="분"
                              className="h-12 pl-10 pr-4 rounded-xl bg-white border-slate-100 font-bold focus:ring-2 focus:ring-blue-100 text-right shadow-sm"
                            />
                          </div>
                        </div>
                        <Textarea
                          value={agenda.description || ""}
                          onChange={(e) => updateAgenda(index, "description", e.target.value)}
                          placeholder="상세 내용을 입력하세요 (선택 사항)"
                          className="min-h-[80px] bg-white border-slate-100 rounded-2xl font-bold p-4 focus:ring-2 focus:ring-blue-100 shadow-sm"
                        />
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addAgenda}
                      className="w-full h-14 rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 font-black hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50 transition-all gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      내용 계속 추가하기
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Location & Settings */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black">3</div>
                  <h3 className="text-lg font-black text-slate-900">장소 및 상세 설정</h3>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Online Meeting</span>
                  <Switch
                    checked={formData.is_online}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {formData.is_online ? (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="online_link" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Meeting Link</Label>
                    <div className="relative group">
                      <Video className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <Input
                        id="online_link"
                        value={formData.online_link}
                        onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                        placeholder="회의 접속 링크(URL)를 입력하세요"
                        className="h-14 pl-14 pr-6 rounded-2xl bg-blue-50/50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="location" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Location</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="회의 장소를 입력하세요"
                        className="h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Overall Description</Label>
                  <div className="relative group">
                    <AlignLeft className="absolute left-5 top-6 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="회의의 주된 목적과 내용을 간략히 적어주세요"
                      className="min-h-[140px] pl-14 pr-6 pt-5 rounded-3xl bg-slate-50 border-none font-bold text-base focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t bg-white flex items-center justify-between flex-shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">All required fields must be filled</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all flex-1 sm:flex-none"
            >
              취소하기
            </Button>
            <Button 
              form="meeting-form"
              type="submit" 
              disabled={isSubmitting || !formData.title || !formData.scheduled_at}
              className="h-14 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black gap-3 shadow-xl shadow-blue-100 hover:-translate-y-1 transition-all active:scale-[0.98] flex-1 sm:flex-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  생성 중...
                </div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  회의 생성하기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
