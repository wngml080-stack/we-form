"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";

interface GoogleStatus {
  connected: boolean;
  email: string | null;
  needsRefresh?: boolean;
}

export function BannerWidget() {
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>({
    connected: false,
    email: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Google 연동 상태 확인
  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const response = await fetch("/api/auth/google/status");
        if (response.ok) {
          const data = await response.json();
          setGoogleStatus({
            connected: data.connected,
            email: data.email,
            needsRefresh: data.needsRefresh,
          });
        }
      } catch (error) {
        console.error("Failed to check Google status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkGoogleStatus();

    // URL 파라미터로 연동 결과 확인
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected") === "true") {
      const email = params.get("google_email");
      toast.success(`Google 계정 (${email})이 연동되었습니다.`);
      setGoogleStatus({ connected: true, email });
      // URL 정리
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("google_error")) {
      const errorMessages: Record<string, string> = {
        access_denied: "Google 연동이 취소되었습니다.",
        invalid_request: "잘못된 요청입니다.",
        invalid_state: "보안 검증에 실패했습니다. 다시 시도해주세요.",
        expired: "인증이 만료되었습니다. 다시 시도해주세요.",
        save_failed: "연동 정보 저장에 실패했습니다.",
        unknown: "알 수 없는 오류가 발생했습니다.",
      };
      toast.error(errorMessages[params.get("google_error") || "unknown"]);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Google 연동 시작
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/auth/google/connect");
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || "Google 연동을 시작할 수 없습니다.");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Failed to start Google connection:", error);
      toast.error("Google 연동 중 오류가 발생했습니다.");
      setIsConnecting(false);
    }
  };

  // Google 연동 해제
  const handleDisconnect = async () => {
    if (!confirm("Google 연동을 해제하시겠습니까?")) return;

    try {
      const response = await fetch("/api/auth/google/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setGoogleStatus({ connected: false, email: null });
        toast.success("Google 연동이 해제되었습니다.");
      } else {
        toast.error("연동 해제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to disconnect Google:", error);
      toast.error("연동 해제 중 오류가 발생했습니다.");
    }
  };

  // Sheets 내보내기
  const handleExport = async (type: "members" | "sales" | "schedules" | "all") => {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const response = await fetch("/api/google/sheets/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Google Sheets로 내보내기 완료!");
        // 새 탭에서 스프레드시트 열기
        window.open(data.spreadsheetUrl, "_blank");
      } else if (data.needsConnect) {
        toast.error("Google 계정을 먼저 연동해주세요.");
        setGoogleStatus({ connected: false, email: null });
      } else {
        toast.error(data.error || "내보내기에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("내보내기 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/4 mb-4" />
        <div className="h-4 bg-slate-700 rounded w-1/2" />
      </div>
    );
  }

  // Google 연동됨
  if (googleStatus.connected) {
    return (
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-green-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                연동됨
              </span>
              <span className="text-white/80 text-sm font-medium">Google 계정</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ color: '#ffffff' }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#2F80ED"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleStatus.email}
            </h3>
            <p className="text-white/60 text-sm">
              회원, 매출, 일정 데이터를 Google Sheets로 내보낼 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 내보내기 버튼 */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="px-5 py-2.5 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    내보내는 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Sheets로 내보내기
                  </>
                )}
              </button>

              {/* 내보내기 메뉴 */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                  <button
                    onClick={() => handleExport("all")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    전체 데이터
                  </button>
                  <button
                    onClick={() => handleExport("members")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    회원 목록
                  </button>
                  <button
                    onClick={() => handleExport("sales")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    매출 내역
                  </button>
                  <button
                    onClick={() => handleExport("schedules")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    수업 일정
                  </button>
                </div>
              )}
            </div>

            {/* 연동 해제 버튼 */}
            <button
              onClick={handleDisconnect}
              className="px-4 py-2.5 bg-slate-700 text-white/80 rounded-lg text-sm hover:bg-slate-600 transition-colors"
            >
              연동 해제
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Google 미연동 상태
  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            New
          </span>
          <span className="text-white/80 text-sm font-medium">업데이트 소식</span>
        </div>
        <h3 className="text-xl font-bold text-white" style={{ color: "white" }}>
          Google 계정 연동하기
        </h3>
        <p className="text-white/80 text-sm max-w-md">
          Google 계정을 연동하면 회원, 매출, 일정 데이터를 Google Sheets로 쉽게 내보낼 수 있습니다.
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-6 py-3 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            연결 중...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google 계정 연동
          </>
        )}
      </button>
    </div>
  );
}
