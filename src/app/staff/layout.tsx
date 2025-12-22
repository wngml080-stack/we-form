import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "강사 전용 | We:form",
  description: "강사용 모바일 스케줄러",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white pb-20 md:pb-0">
      <div className="mx-auto max-w-md min-h-screen bg-white shadow-[0_0_60px_rgba(0,0,0,0.08),0_0_120px_rgba(79,70,229,0.05)] overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
