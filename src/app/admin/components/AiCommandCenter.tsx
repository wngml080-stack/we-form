"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Sparkles, Command, X, ArrowRight, MessageSquare, Users, DollarSign, Calendar, Loader2, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AiCommandCenterProps {
  gymId?: string;
}

export function AiCommandCenter({ gymId }: AiCommandCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResponse(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, gymId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI 응답을 가져오는데 실패했습니다.");
      }

      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [query, gymId, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    setResponse(null);
    setError(null);
  };

  const suggestions = [
    { icon: Users, text: "재등록이 필요한 회원 목록 보여줘", category: "회원" },
    { icon: DollarSign, text: "이번 달 매출 현황 알려줘", category: "매출" },
    { icon: Calendar, text: "오늘 예약 현황 확인해줘", category: "스케줄" },
    { icon: MessageSquare, text: "최근 2주간 미출석 회원 알려줘", category: "운영" },
  ];

  if (!isOpen) {
    return (
      <div className="flex justify-center w-full mb-10">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-4 px-6 py-4 bg-white/40 backdrop-blur-xl border border-white/40 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_48px_rgba(47,128,237,0.12)] hover:border-blue-200/50 transition-all duration-500 w-full max-w-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div className="relative flex-1 text-left">
            <p className="text-base font-black text-slate-400 group-hover:text-slate-600 transition-colors">무엇이든 물어보세요...</p>
            <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest mt-0.5 group-hover:text-blue-500 transition-colors">Powered by Claude AI</p>
          </div>
          <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200/50 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
            <Command className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
            <span className="text-xs font-black text-slate-400 group-hover:text-blue-500">K</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose}></div>

      <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_128px_rgba(0,0,0,0.25)] overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-top-4 duration-500">
        <div className="p-8 space-y-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[30px] blur opacity-10 group-focus-within:opacity-25 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100/50">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                )}
              </div>
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (response) setResponse(null);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="어떤 데이터를 찾아드릴까요?"
                disabled={isLoading}
                className="h-20 pl-20 pr-16 text-xl font-black bg-white border-2 border-slate-100 focus-visible:border-blue-400 rounded-[28px] focus-visible:ring-0 placeholder:text-slate-300 transition-all shadow-sm disabled:opacity-50"
              />
              {query ? (
                <button
                  onClick={() => {
                    setQuery("");
                    setResponse(null);
                    setError(null);
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              ) : (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-400 text-[10px] font-black px-2 py-0.5">Claude AI</Badge>
                </div>
              )}
            </div>
          </div>

          {/* AI Response */}
          {(response || error) && (
            <div className={cn(
              "p-6 rounded-3xl border-2 animate-in slide-in-from-top-2 duration-300",
              error
                ? "bg-red-50 border-red-100"
                : "bg-blue-50/50 border-blue-100"
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                  error ? "bg-red-100" : "bg-blue-100"
                )}>
                  <Bot className={cn("w-5 h-5", error ? "text-red-600" : "text-blue-600")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-bold leading-relaxed whitespace-pre-wrap",
                    error ? "text-red-700" : "text-slate-700"
                  )}>
                    {error || response}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions - only show when no response */}
          {!response && !error && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Smart Recommendations</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter bg-blue-50 border-none text-blue-600 px-3 py-1">AI Prompt</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item.text)}
                    disabled={isLoading}
                    className="group relative flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-slate-100/50">
                        <item.icon className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-slate-700 group-hover:text-slate-900 transition-colors">{item.text}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 group-hover:text-blue-400 transition-colors">{item.category} Intelligence</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-500">
                      <ArrowRight className="w-4 h-4 text-blue-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-2 group cursor-help">
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 font-black group-hover:border-blue-300 transition-colors">ESC</span>
              <span className="group-hover:text-slate-600 transition-colors">Close</span>
            </div>
            <div className="flex items-center gap-2 group cursor-help">
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 font-black group-hover:border-blue-300 transition-colors">ENTER</span>
              <span className="group-hover:text-slate-600 transition-colors">Execute Query</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
              )}></div>
              <span className="text-[11px] font-black text-slate-900 tracking-tight">
                {isLoading ? "Processing..." : "System Ready"}
              </span>
            </div>
            <div className="w-px h-3 bg-slate-200"></div>
            <span className="text-[11px] font-black text-blue-600 tracking-tighter uppercase">Claude AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
