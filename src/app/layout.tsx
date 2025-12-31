import type { Metadata } from "next";
import { Outfit, Noto_Sans_KR } from "next/font/google";

export const dynamic = 'force-dynamic';
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Outfit 폰트 (포인트/헤딩용) - 필수 가중치만 로드
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700"], // 헤딩에 필요한 가중치만
  display: "swap",
  variable: "--font-outfit",
});

// Noto Sans KR (본문용) - 필수 가중치만 로드
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"], // 본문(400)과 강조(700)만
  display: "swap",
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
    <html lang="ko" className={`${outfit.variable} ${notoSansKR.variable}`}>
      <head>
        {/* Google Fonts preconnect - next/font가 사용 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
