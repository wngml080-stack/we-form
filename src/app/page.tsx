import { redirect } from "next/navigation";

/**
 * 루트 페이지
 * 랜딩 페이지로 리다이렉트합니다.
 */
export default function Home() {
  redirect("/landing.html");
}
