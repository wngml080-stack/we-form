import { createClient } from "@/lib/supabase/server";
import { AdminDashboardContent } from "./components/AdminDashboardContent";

// Server Component에서 사용자 이름을 미리 가져와서 LCP 최적화
async function getUserName(): Promise<string> {
  try {
    // Supabase Auth에서 현재 사용자 가져오기 (서버 사이드)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return "관리자";
    }

    // Supabase에서 사용자 이름 조회
    const { data } = await supabase
      .from("staffs")
      .select("name")
      .eq("email", user.email)
      .single();

    return data?.name || "관리자";
  } catch (error) {
    console.error("Server-side user fetch error:", error);
    return "관리자";
  }
}

export default async function AdminDashboardPage(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Next.js 15+에서 params와 searchParams는 Promise이므로 await해야 합니다.
  await props.params;
  await props.searchParams;

  // 서버에서 사용자 이름 미리 가져오기 (LCP 최적화)
  const serverUserName = await getUserName();

  return <AdminDashboardContent serverUserName={serverUserName} />;
}
