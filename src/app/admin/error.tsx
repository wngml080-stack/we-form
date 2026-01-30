"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">
            페이지를 불러올 수 없습니다
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            일시적인 오류가 발생했습니다. 다시 시도해 주세요.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="rounded-xl font-bold gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
          <Button
            variant="outline"
            asChild
            className="rounded-xl font-bold gap-2"
          >
            <Link href="/admin">
              <Home className="w-4 h-4" />
              대시보드
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
