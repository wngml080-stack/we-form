"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  FileText,
  CheckSquare,
  Play,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Clock,
  ExternalLink,
  X,
  Info,
  Sparkles,
  ArrowRight,
  UserCheck,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
  MEETING_TYPE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  ACTION_ITEM_STATUS_LABELS,
  PARTICIPANT_ROLE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  type MeetingDetail,
  type MeetingUpdateInput,
  type MeetingStatus,
} from "@/types/meeting";
import { cn } from "@/lib/utils";

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingDetail;
  isLoading: boolean;
  onUpdate: (meetingId: string, data: MeetingUpdateInput) => Promise<boolean>;
  onDelete: (meetingId: string) => Promise<boolean>;
  onStatusChange: (meetingId: string, status: MeetingStatus) => Promise<boolean>;
  onAddParticipants: (meetingId: string, staffIds: string[]) => Promise<boolean>;
  onAddNote: (meetingId: string, content: string) => Promise<boolean>;
  onAddActionItem: (
    meetingId: string,
    data: { title: string; assignee_id?: string; due_date?: string; priority?: string }
  ) => Promise<boolean>;
  onUpdateActionItemStatus: (
    meetingId: string,
    actionItemId: string,
    status: string
  ) => Promise<boolean>;
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string; bg: string; border: string; icon: typeof Calendar }> = {
  scheduled: { label: "예정", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: Calendar },
  in_progress: { label: "진행중", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: Clock },
  completed: { label: "완료", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle },
  cancelled: { label: "취소", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100", icon: XCircle },
  postponed: { label: "연기", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: Clock },
};

export function MeetingDetailModal({
  isOpen,
  onClose,
  meeting,
  isLoading,
  onUpdate,
  onDelete,
  onStatusChange,
  onAddParticipants,
  onAddNote,
  onAddActionItem,
  onUpdateActionItemStatus,
}: MeetingDetailModalProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [newNote, setNewNote] = useState("");
  const [newActionItem, setNewActionItem] = useState({ title: "", due_date: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    const success = await onAddNote(meeting.id, newNote);
    if (success) setNewNote("");
    setIsSubmitting(false);
  };

  const handleAddActionItem = async () => {
    if (!newActionItem.title.trim()) return;
    setIsSubmitting(true);
    const success = await onAddActionItem(meeting.id, newActionItem);
    if (success) setNewActionItem({ title: "", due_date: "" });
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 회의를 삭제하시겠습니까?")) return;
    await onDelete(meeting.id);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white rounded-[40px] border-none shadow-2xl p-0">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-hex)] mb-4" />
            <p className="text-[var(--foreground-subtle)] font-bold">회의 정보를 불러오는 중...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
  const StatusIcon = status.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white border-none shadow-2xl rounded-[40px] [&>button]:hidden">
        {/* Header - Toss Modern Style */}
        <DialogHeader className="px-10 py-10 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className={cn("flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white")}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </div>
                  <span className="text-[10px] font-black text-white/50 bg-white/5 px-2.5 py-1.5 rounded-xl uppercase tracking-[0.2em]">
                    {MEETING_TYPE_LABELS[meeting.meeting_type]}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">{meeting.title}</h2>
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

        {/* 회의 기본 정보 바 */}
        <div className="flex flex-wrap items-center gap-6 px-10 py-6 bg-slate-50 border-b border-slate-100 text-sm font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {format(new Date(meeting.scheduled_at), "yyyy년 M월 d일 (EEE) HH:mm", {
              locale: ko,
            })}
          </div>
          {meeting.duration_minutes && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              {meeting.duration_minutes}분 소요 예정
            </div>
          )}
          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
          {meeting.is_online ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Video className="w-4 h-4" />
              온라인 회의
              {meeting.online_link && (
                <a
                  href={meeting.online_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 bg-blue-50 flex items-center justify-center rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : meeting.location ? (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              {meeting.location}
            </div>
          ) : null}
        </div>

        {/* Content with Tabs */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-10 pt-8">
              <TabsList className="bg-slate-50 p-1.5 rounded-[20px] border border-slate-100 w-full lg:w-auto h-14">
                <TabsTrigger value="info" className="rounded-2xl px-8 h-full text-xs font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100/50 transition-all duration-300">
                  정보
                </TabsTrigger>
                <TabsTrigger value="participants" className="rounded-2xl px-8 h-full text-xs font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100/50 transition-all duration-300">
                  참석자 ({meeting.participants.length})
                </TabsTrigger>
                <TabsTrigger value="notes" className="rounded-2xl px-8 h-full text-xs font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100/50 transition-all duration-300">
                  회의록 ({meeting.notes.length})
                </TabsTrigger>
                <TabsTrigger value="actions" className="rounded-2xl px-8 h-full text-xs font-black tracking-tight data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100/50 transition-all duration-300">
                  액션 ({meeting.action_items.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-10">
              {/* 정보 탭 */}
              <TabsContent value="info" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {meeting.description && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                      <h4 className="text-lg font-black text-slate-900">회의 설명</h4>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[32px] text-base text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                      {meeting.description}
                    </div>
                  </div>
                )}

                {/* 안건 목록 */}
                {meeting.agendas.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                      <h4 className="text-lg font-black text-slate-900">회의 안건 (Agenda)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {meeting.agendas.map((agenda, index) => (
                        <div key={agenda.id} className="flex items-center gap-4 p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-extrabold text-slate-900">{agenda.title}</p>
                            {agenda.estimated_minutes && (
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                {agenda.estimated_minutes} min estimated
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 요약 */}
                {meeting.ai_summary && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      <h4 className="text-lg font-black text-slate-900">AI 회의 요약</h4>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[32px] border border-blue-100 shadow-sm">
                      <p className="text-base text-blue-900 leading-relaxed font-bold">
                        {meeting.ai_summary}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* 참석자 탭 */}
              <TabsContent value="participants" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meeting.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shadow-inner">
                          <UserCheck className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-none">
                            {participant.staff?.name || "알 수 없음"}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                            {PARTICIPANT_ROLE_LABELS[participant.role]}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn("px-3 py-1 rounded-full border-none font-black text-[10px] uppercase tracking-tighter", 
                        participant.attendance_status === 'attended' ? "bg-emerald-50 text-emerald-600" :
                        participant.attendance_status === 'absent' ? "bg-rose-50 text-rose-600" :
                        "bg-slate-50 text-slate-400"
                      )}>
                        {ATTENDANCE_STATUS_LABELS[participant.attendance_status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* 회의록 탭 */}
              <TabsContent value="notes" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-900">회의록 작성</h4>
                  </div>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="회의에서 논의된 내용을 자세히 기록하세요..."
                    className="min-h-[160px] bg-white border-none rounded-3xl font-bold p-6 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isSubmitting}
                      className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-100 transition-all gap-2"
                    >
                      <Send className="w-4 h-4" />
                      회의록 저장하기
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-slate-300 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-900">이전 기록 목록</h4>
                  </div>
                  {meeting.notes.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 font-bold">작성된 회의록이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {meeting.notes.map((note) => (
                        <div key={note.id} className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                                v{note.version}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 leading-none">{note.author?.name}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Author</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                              {format(new Date(note.created_at), "M월 d일 HH:mm")}
                            </span>
                          </div>
                          <p className="text-base text-slate-600 whitespace-pre-wrap font-medium leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* 액션 아이템 탭 */}
              <TabsContent value="actions" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-900">새로운 할 일 (Action Item)</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative group">
                      <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        value={newActionItem.title}
                        onChange={(e) => setNewActionItem({ ...newActionItem, title: e.target.value })}
                        placeholder="누가, 무엇을 할지 입력하세요..."
                        className="h-14 pl-12 pr-6 rounded-2xl bg-white border-none font-bold shadow-sm focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div className="w-full sm:w-48 relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500" />
                      <Input
                        type="date"
                        value={newActionItem.due_date}
                        onChange={(e) => setNewActionItem({ ...newActionItem, due_date: e.target.value })}
                        className="h-14 pl-12 pr-6 rounded-2xl bg-white border-none font-bold shadow-sm focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <Button
                      onClick={handleAddActionItem}
                      disabled={!newActionItem.title.trim() || isSubmitting}
                      className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-100 transition-all gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      추가
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-5 bg-slate-300 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-900">할 일 목록</h4>
                  </div>
                  {meeting.action_items.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 font-bold">등록된 할 일이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {meeting.action_items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-start gap-6 p-6 rounded-[24px] border transition-all duration-300",
                            item.status === "completed"
                              ? "bg-emerald-50/30 border-emerald-100"
                              : "bg-white border-slate-100 shadow-sm"
                          )}
                        >
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={item.status === "completed"}
                              onChange={(e) =>
                                onUpdateActionItemStatus(
                                  meeting.id,
                                  item.id,
                                  e.target.checked ? "completed" : "pending"
                                )
                              }
                              className="w-6 h-6 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-lg font-bold tracking-tight",
                                item.status === "completed"
                                  ? "text-slate-400 line-through"
                                  : "text-slate-900"
                              )}
                            >
                              {item.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              {item.assignee && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                  <Users className="w-3.5 h-3.5" />
                                  @{item.assignee.name}
                                </div>
                              )}
                              {item.due_date && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  마감: {format(new Date(item.due_date), "M월 d일")}
                                </div>
                              )}
                              <Badge
                                className={cn(
                                  "px-2.5 py-0.5 rounded-lg border-none font-black text-[9px] uppercase tracking-wider",
                                  PRIORITY_COLORS[item.priority]
                                )}
                              >
                                {PRIORITY_LABELS[item.priority]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer with Status Actions */}
        <div className="px-10 py-8 border-t bg-white flex flex-col sm:flex-row items-center justify-between gap-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            {meeting.status === "scheduled" && (
              <>
                <Button
                  onClick={() => onStatusChange(meeting.id, "in_progress")}
                  className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-100 transition-all gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  회의 시작하기
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onStatusChange(meeting.id, "cancelled")}
                  className="h-12 px-6 rounded-xl text-rose-500 hover:bg-rose-50 font-bold transition-all"
                >
                  일정 취소
                </Button>
              </>
            )}
            {meeting.status === "in_progress" && (
              <Button
                onClick={() => onStatusChange(meeting.id, "completed")}
                className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-100 transition-all gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                회의 종료 및 완료
              </Button>
            )}
            {meeting.status === "completed" && (
              <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-black uppercase tracking-widest">
                <CheckCircle className="w-4 h-4" />
                처리 완료된 회의
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDelete}
              className="h-12 w-12 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-8 rounded-xl font-black text-slate-600 border-slate-200 hover:bg-slate-50 transition-all flex-1 sm:flex-none"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
