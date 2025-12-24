"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface BranchAnnouncementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: any | null;
}

export function BranchAnnouncementModal({ isOpen, onOpenChange, announcement }: BranchAnnouncementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            지점 공지사항
          </DialogTitle>
          <DialogDescription className="sr-only">지점 공지사항 상세 내용입니다</DialogDescription>
        </DialogHeader>

        {announcement && (
          <div className="py-4">
            <div className={`border rounded-xl p-5 ${
              announcement.priority === 'urgent' ? 'bg-red-50 border-red-200' :
              announcement.priority === 'low' ? 'bg-gray-50 border-gray-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  announcement.priority === 'urgent' ? 'bg-red-500 text-white' :
                  announcement.priority === 'low' ? 'bg-gray-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {announcement.priority === 'urgent' ? '긴급' :
                   announcement.priority === 'low' ? '참고' : '일반'}
                </span>
                {announcement.gym_id ? (
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">지점 공지</span>
                ) : (
                  <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded">전사 공지</span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-3">{announcement.title}</h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mb-4">
                {announcement.content}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                <span>
                  게시일: {new Date(announcement.start_date || announcement.created_at).toLocaleDateString('ko-KR')}
                </span>
                {announcement.end_date && (
                  <span>
                    종료일: {new Date(announcement.end_date).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
            </div>
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
