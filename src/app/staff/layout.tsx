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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="mx-auto max-w-md min-h-screen bg-white shadow-2xl overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
