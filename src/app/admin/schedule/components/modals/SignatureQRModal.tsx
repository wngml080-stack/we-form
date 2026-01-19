"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  QrCode,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface SignatureQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  memberName: string;
  scheduleType: string;
  onSignatureComplete?: () => void;
}

type ModalStatus = "loading" | "ready" | "polling" | "completed" | "error";

export function SignatureQRModal({
  isOpen,
  onClose,
  scheduleId,
  memberName,
  scheduleType,
  onSignatureComplete,
}: SignatureQRModalProps) {
  const [status, setStatus] = useState<ModalStatus>("loading");
  const [signUrl, setSignUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const onSignatureCompleteRef = useRef(onSignatureComplete);
  const pollingStartedRef = useRef(false);

  // ref 업데이트
  useEffect(() => {
    onSignatureCompleteRef.current = onSignatureComplete;
  }, [onSignatureComplete]);

  const createSignatureRequest = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/schedule/signature/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "서명 요청 생성에 실패했습니다.");
      }

      const data = await res.json();
      setSignUrl(data.signUrl);
      setExpiresAt(data.expiresAt);
      setStatus("ready");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "서명 요청 생성에 실패했습니다.";
      setErrorMessage(errorMsg);
      setStatus("error");
    }
  }, [scheduleId]);

  // 서명 상태 폴링 - signUrl이 설정되면 시작
  useEffect(() => {
    if (!isOpen || !signUrl || pollingStartedRef.current) return;

    pollingStartedRef.current = true;
    setStatus("polling");

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/schedule/signature/status?scheduleId=${scheduleId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.signature?.status === "completed") {
            setStatus("completed");
            clearInterval(pollInterval);
            onSignatureCompleteRef.current?.();
          }
        }
      } catch {
        // 폴링 에러는 무시
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isOpen, signUrl, scheduleId]);

  // 모달 열릴 때 서명 요청 생성
  useEffect(() => {
    if (isOpen && scheduleId) {
      pollingStartedRef.current = false; // 모달 열릴 때 리셋
      createSignatureRequest();
    }
  }, [isOpen, scheduleId, createSignatureRequest]);

  const handleCopyUrl = async () => {
    if (signUrl) {
      await navigator.clipboard.writeText(signUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRemainingTime = () => {
    if (!expiresAt) return "";
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return "만료됨";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분 남음`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1.5rem)] xs:w-[calc(100%-2rem)] sm:max-w-md bg-[#f8fafc] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[40px] gap-0">
        <DialogHeader className="px-8 py-8 bg-slate-900 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <DialogTitle className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white !text-white tracking-tight">
                서명 요청
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                QR Signature Request
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            회원 서명을 위한 QR코드입니다
          </DialogDescription>
          <button
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all group z-10 active:scale-90"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-[#f8fafc]">
          {/* 수업 정보 */}
          <div className="bg-white rounded-[24px] p-5 shadow-lg shadow-slate-100 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  회원
                </p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {memberName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  수업
                </p>
                <p className="text-lg font-black text-blue-600 mt-1">
                  {scheduleType}
                </p>
              </div>
            </div>
          </div>

          {/* QR코드 영역 */}
          <div className="bg-white rounded-[24px] p-6 shadow-lg shadow-slate-100 border border-slate-100">
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-bold">QR코드 생성 중...</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-rose-500" />
                </div>
                <p className="text-slate-900 font-black mb-2">오류 발생</p>
                <p className="text-slate-500 text-sm text-center mb-4">
                  {errorMessage}
                </p>
                <Button
                  onClick={createSignatureRequest}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            )}

            {(status === "ready" || status === "polling") && signUrl && (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100">
                  <QRCodeSVG value={signUrl} size={200} level="H" includeMargin />
                </div>

                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">{getRemainingTime()}</span>
                </div>

                {status === "polling" && (
                  <div className="flex items-center gap-2 mt-3 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-black">서명 대기 중...</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="mt-4 rounded-xl"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-500" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      URL 복사
                    </>
                  )}
                </Button>
              </div>
            )}

            {status === "completed" && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-xl font-black text-slate-900 mb-2">
                  서명 완료!
                </p>
                <p className="text-slate-500 text-sm text-center">
                  {memberName}님의 서명이
                  <br />
                  성공적으로 저장되었습니다.
                </p>
              </div>
            )}
          </div>

          {/* 안내 문구 */}
          {(status === "ready" || status === "polling") && (
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <p className="font-black text-blue-900 text-sm mb-2">
                회원에게 안내해주세요
              </p>
              <p className="text-blue-700 text-xs leading-relaxed">
                1. 스마트폰 카메라로 QR코드 스캔
                <br />
                2. 열리는 페이지에서 서명 입력
                <br />
                3. 제출 버튼 클릭
              </p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-8 bg-white border-t border-slate-100 flex-shrink-0">
          <Button
            onClick={onClose}
            className={cn(
              "w-full h-14 rounded-[22px] font-black text-base",
              status === "completed"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-slate-200 hover:bg-slate-300 text-slate-600"
            )}
          >
            {status === "completed" ? "완료" : "닫기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
