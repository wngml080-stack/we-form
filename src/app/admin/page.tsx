import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { AdminDashboardContent } from "./components/AdminDashboardContent";

// Server Component에서 사용자 이름을 미리 가져와서 LCP 최적화
async function getUserName(): Promise<string> {
  try {
    // Clerk에서 현재 사용자 가져오기 (서버 사이드)
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return "관리자";
    }

    const email = user.primaryEmailAddress.emailAddress;

    // Supabase에서 사용자 이름 조회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return "관리자";
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("staffs")
      .select("name")
      .eq("email", email)
      .single();

    return data?.name || "관리자";
  } catch (error) {
    console.error("Server-side user fetch error:", error);
    return "관리자";
  }
}

export default async function AdminDashboardPage() {
  // 서버에서 사용자 이름 미리 가져오기 (LCP 최적화)
  const serverUserName = await getUserName();

  return <AdminDashboardContent serverUserName={serverUserName} />;
}
