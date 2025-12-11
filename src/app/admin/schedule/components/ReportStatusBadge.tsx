import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

type Props = { status: "submitted" | "approved" | "rejected" };

export function ReportStatusBadge({ status }: Props) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> 승인
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
        <XCircle className="w-3.5 h-3.5" /> 거절
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
      <AlertCircle className="w-3.5 h-3.5" /> 승인 대기
    </span>
  );
}

