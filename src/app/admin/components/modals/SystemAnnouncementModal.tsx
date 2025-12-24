"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface SystemAnnouncementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcements: any[];
}

export function SystemAnnouncementModal({ isOpen, onOpenChange, announcements }: SystemAnnouncementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#56CCF2] flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            시스템 공지사항
          </DialogTitle>
          <DialogDescription className="sr-only">시스템 공지사항 내용입니다</DialogDescription>
        </DialogHeader>

        {announcements.length > 0 && (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {announcements.map((announcement) => (
              <div key={announcement.id} className={`border rounded-xl p-4 ${
                announcement.priority === 'urgent' ? 'bg-red-50 border-red-100' :
                announcement.priority === 'update' ? 'bg-purple-50 border-purple-100' :
                announcement.priority === 'info' ? 'bg-cyan-50 border-cyan-100' :
                'bg-blue-50 border-blue-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    announcement.priority === 'urgent' ? 'bg-red-500 text-white' :
                    announcement.priority === 'update' ? 'bg-purple-500 text-white' :
                    announcement.priority === 'info' ? 'bg-cyan-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {announcement.priority === 'urgent' ? '긴급' :
                     announcement.priority === 'update' ? '업데이트' :
                     announcement.priority === 'info' ? '안내' : '일반'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {announcement.start_date && new Date(announcement.start_date).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{announcement.title}</h4>
                <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                  {announcement.content}
                </p>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-[#2F80ED] hover:bg-[#2570d6] text-white">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
