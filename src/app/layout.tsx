import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit } from "next/font/google";
import localFont from "next/font/local";

export const dynamic = 'force-dynamic';
import { koKR } from "@clerk/localizations";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Outfit 폰트 (포인트/헤딩용) - next/font로 최적화
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-outfit",
});

// Pretendard 가변 폰트 (Variable Font) - 단일 파일로 모든 굵기 지원
// 파일 크기: ~700KB (개별 파일 4개 합계 3.1MB 대비 77% 절감)
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900", // 가변 폰트: 100~900 모든 굵기 지원
  variable: "--font-pretendard",
  fallback: ["-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "sans-serif"],
});

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
      <html lang="ko" className={`${outfit.variable} ${pretendard.variable}`}>
        <body className="font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
