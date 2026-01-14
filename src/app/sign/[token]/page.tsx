"use client";

import { useState, useEffect, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Pen,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface SignatureInfo {
  signatureId: string;
  memberName: string;
  scheduleType: string;
  staffName: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
}

type PageStatus =
  | "loading"
  | "ready"
  | "submitting"
  | "success"
  | "error"
  | "expired"
  | "already_signed";

export default function SignaturePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [info, setInfo] = useState<SignatureInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const fetchSignatureInfo = async () => {
      try {
        const res = await fetch(`/api/public/signature/${token}`);

        if (res.status === 410) {
          setStatus("expired");
          return;
        }

        if (res.status === 409) {
          setStatus("already_signed");
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          setErrorMessage(data.error || "서명 정보를 불러올 수 없습니다.");
          setStatus("error");
          return;
        }

        const data = await res.json();
        setInfo(data);
        setStatus("ready");
      } catch {
        setErrorMessage("네트워크 오류가 발생했습니다.");
        setStatus("error");
      }
    };

    if (token) {
      fetchSignatureInfo();
    }
  }, [token]);

  const handleClear = () => {
    sigCanvasRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      alert("서명을 입력해주세요.");
      return;
    }

    setStatus("submitting");

    try {
      const signatureData = sigCanvasRef.current.toDataURL("image/png");

      const res = await fetch(`/api/public/signature/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "서명 제출에 실패했습니다.");
      }

      setStatus("success");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "서명 제출에 실패했습니다.";
      setErrorMessage(errorMsg);
      setStatus("error");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 로딩 상태
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            서명 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 만료 상태
  if (status === "expired") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            서명 요청 만료
          </h1>
          <p className="text-slate-500">
            이 서명 요청은 만료되었습니다.
            <br />
            담당자에게 새로운 서명 요청을 받으세요.
          </p>
        </div>
      </div>
    );
  }

  // 이미 서명 완료
  if (status === "already_signed") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            이미 서명 완료
          </h1>
          <p className="text-slate-500">
            이 수업에 대한 서명이 이미 완료되었습니다.
          </p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">오류 발생</h1>
          <p className="text-slate-500">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // 성공 상태
  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">서명 완료!</h1>
          <p className="text-slate-500 mb-6">
            {info?.memberName}님의 {info?.scheduleType} 수업 서명이
            <br />
            성공적으로 저장되었습니다.
          </p>
          <p className="text-sm text-slate-400">이 페이지를 닫으셔도 됩니다.</p>
        </div>
      </div>
    );
  }

  // 서명 입력 UI (ready 상태)
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-slate-900 text-center">
            PT 수업 서명
          </h1>
        </div>
      </header>

      {/* 수업 정보 */}
      <div className="p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Pen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{info?.memberName}님</h2>
                <p className="text-sm text-slate-500">
                  {info?.scheduleType} 수업 완료 확인
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">담당 트레이너</span>
                <span className="font-medium">{info?.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">수업 시간</span>
                <span className="font-medium">
                  {info?.startTime && formatDateTime(info.startTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 서명 영역 */}
      <div className="flex-1 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-600">서명란</span>
              <button
                onClick={handleClear}
                className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                다시 쓰기
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  className: "w-full h-48 touch-none",
                  style: { width: "100%", height: "192px" },
                }}
                backgroundColor="rgb(248 250 252)"
                penColor="black"
              />
            </div>

            <p className="text-xs text-slate-400 mt-2 text-center">
              위 영역에 손가락 또는 펜으로 서명해주세요
            </p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={status === "submitting"}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-lg shadow-lg shadow-blue-100"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                제출 중...
              </>
            ) : (
              "서명 제출하기"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
