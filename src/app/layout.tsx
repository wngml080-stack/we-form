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

// Pretendard 가변 폰트 (Variable Font)
// 파일 크기: ~2MB (한글 전체 포함)
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900", // 가변 폰트: 100~900 모든 굵기 지원
  variable: "--font-pretendard",
  fallback: ["-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "sans-serif"],
  preload: true, // 폰트 사전 로드
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
  // Supabase URL에서 호스트 추출
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko" className={`${outfit.variable} ${pretendard.variable}`}>
        <head>
          {/* Preconnect hints - 외부 서비스 연결 시간 단축 */}
          <link rel="preconnect" href="https://clerk.weform.co.kr" />
          <link rel="preconnect" href="https://api.clerk.com" />
          {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
          <link rel="dns-prefetch" href="https://clerk.weform.co.kr" />
          <link rel="dns-prefetch" href="https://api.clerk.com" />
        </head>
        <body className="font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
