import { redirect } from "next/navigation";

/**
 * 루트 페이지
 * 로그인 페이지로 리다이렉트합니다.
 */
export default function Home() {
  redirect("/sign-in");
}
