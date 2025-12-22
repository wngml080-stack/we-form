import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 보호할 라우트 정의 (페이지만)
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/staff(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 보호된 라우트에 접근 시 인증 필요
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // static 파일, _next 제외 (API 포함)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
