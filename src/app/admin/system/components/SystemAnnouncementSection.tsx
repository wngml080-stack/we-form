"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Megaphone, Bell, Pencil, Trash2, Calendar, AlertTriangle, Info, Sparkles } from "lucide-react";

interface SystemAnnouncementSectionProps {
  announcements: any[];
  onAddClick: () => void;
  onEditClick: (announcement: any) => void;
  onDeleteClick: (id: string, title: string) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
}

export function SystemAnnouncementSection({
  announcements, onAddClick, onEditClick, onDeleteClick, onToggleActive
}: SystemAnnouncementSectionProps) {
  const priorityConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    urgent: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", label: "긴급" },
    normal: { icon: Bell, color: "text-blue-600", bg: "bg-blue-100", label: "일반" },
    info: { icon: Info, color: "text-cyan-600", bg: "bg-cyan-100", label: "안내" },
    update: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-100", label: "업데이트" }
  };

  const typeConfig: Record<string, string> = {
    general: "일반", update: "업데이트", maintenance: "점검", feature: "신기능", notice: "공지"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] rounded-xl">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">시스템 공지사항</h2>
              <p className="text-sm text-gray-500">전체 사용자에게 표시되는 공지사항을 관리합니다</p>
            </div>
          </div>
          <Button onClick={onAddClick} className="bg-[#2F80ED] hover:bg-[#1c6cd7] text-white w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            공지 추가
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {announcements.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">등록된 시스템 공지사항이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">새 공지사항을 추가하여 전체 사용자에게 알림을 보내세요</p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const priority = priorityConfig[announcement.priority] || priorityConfig.normal;
            const PriorityIcon = priority.icon;

            return (
              <div
                key={announcement.id}
                className={`p-4 sm:p-5 hover:bg-gray-50 transition-colors ${!announcement.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${priority.bg} flex-shrink-0`}>
                    <PriorityIcon className={`w-5 h-5 ${priority.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                          <Badge className={`text-xs ${priority.bg} ${priority.color} border-0`}>
                            {priority.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {typeConfig[announcement.announcement_type] || announcement.announcement_type}
                          </Badge>
                          {!announcement.is_active && (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">비활성</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{announcement.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {announcement.start_date}
                            {announcement.end_date && ` ~ ${announcement.end_date}`}
                          </span>
                          <span>조회 {announcement.view_count || 0}회</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2 ${announcement.is_active ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                          onClick={() => onToggleActive(announcement.id, announcement.is_active)}
                        >
                          {announcement.is_active ? "활성" : "비활성"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditClick(announcement)}>
                          <Pencil className="w-4 h-4 text-gray-400 hover:text-[#2F80ED]"/>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteClick(announcement.id, announcement.title)}>
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500"/>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
