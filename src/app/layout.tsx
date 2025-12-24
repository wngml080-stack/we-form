import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';
import { koKR } from "@clerk/localizations";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "We:form - 피트니스 센터 관리",
  description: "피트니스 센터 통합 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body className="font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
