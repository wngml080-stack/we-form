"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, Smartphone, Monitor, Apple, Chrome, Share, Plus, MoreVertical, Download } from "lucide-react";

export function PWAInstallGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 도움말 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-white z-50"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      {/* 설치 가이드 모달 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg bg-white rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black">앱 설치하기</DialogTitle>
                  <p className="text-blue-100 text-sm font-bold mt-1">We:form을 앱처럼 사용하세요</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* 콘텐츠 */}
          <div className="p-6 space-y-6">
            {/* iOS 가이드 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Apple className="w-4 h-4 text-slate-600" />
                </div>
                <h3 className="font-black text-slate-900">iPhone / iPad (Safari)</h3>
              </div>
              <div className="ml-10 space-y-2">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">Safari로 사이트에 접속합니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-700">하단 공유 버튼</p>
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <Share className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">탭</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">3</div>
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-700">"홈 화면에 추가"</p>
                    <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">선택</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Android 가이드 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-black text-slate-900">Android (Chrome)</h3>
              </div>
              <div className="ml-10 space-y-2">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">Chrome으로 사이트에 접속합니다</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-700">우측 상단 메뉴</p>
                    <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                      <MoreVertical className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">탭</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">3</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">"앱 설치" 또는 "홈 화면에 추가" 선택</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop 가이드 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-black text-slate-900">데스크톱 (Chrome / Edge)</h3>
              </div>
              <div className="ml-10 space-y-2">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">1</div>
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-700">주소창 오른쪽 설치 아이콘</p>
                    <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                      <Download className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">클릭</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">2</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700">"설치" 버튼 클릭</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-xs font-bold text-blue-600 text-center">
                설치 후 홈 화면에서 We:form 아이콘을 탭하면<br/>
                앱처럼 바로 실행됩니다!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
