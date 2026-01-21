import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // 보호된 라우트 체크
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/staff");
  const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // 인증이 필요한 경우에만 세션 확인 (성능 최적화)
  if (isProtectedRoute || isAuthRoute) {
    // getSession()은 쿠키에서 읽기만 하므로 빠름 (서버 요청 없음)
    // getUser()는 서버 검증이 필요해 100-500ms 소요
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // 보호된 라우트에 미인증 사용자 접근 시 로그인으로 리다이렉트
    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }

    // 인증된 사용자가 로그인/회원가입 페이지 접근 시 admin으로 리다이렉트
    if (isAuthRoute && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // static 파일, _next 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
