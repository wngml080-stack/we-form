"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase/client";

// 타입 정의
interface UserData {
  id: string;
  name: string;
  email?: string;
  role: "system_admin" | "company_admin" | "admin" | "staff";
  gym_id: string;
  company_id: string;
  work_start_time?: string;
  work_end_time?: string;
}

interface GymData {
  id: string;
  name: string;
}

interface CompanyData {
  id: string;
  name: string;
}

interface StaffWithCompany {
  id: string;
  name: string;
  email: string;
  role: string;
  gym_id: string | null;
  company_id: string | null;
  work_start_time: string | null;
  work_end_time: string | null;
  employment_status: string;
  clerk_user_id: string | null;
  companies: { name: string }[] | null;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isApproved: boolean;
  companyName: string;
  gymName: string;
  gyms: GymData[];
  companies: CompanyData[];
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isApproved: false,
  companyName: "",
  gymName: "",
  gyms: [],
  companies: [],
  refetch: async () => {},
});

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [gymName, setGymName] = useState("");
  const [gyms, setGyms] = useState<GymData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);

  // 캐시 관리
  const cacheRef = useRef<{
    data: UserData | null;
    timestamp: number;
    email: string | null;
  }>({ data: null, timestamp: 0, email: null });

  // Supabase 클라이언트 한번만 생성
  const supabase = useMemo(() => createSupabaseClient(), []);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    try {
      if (!clerkLoaded) return;

      if (!clerkUser) {
        setUser(null);
        setIsApproved(false);
        setIsLoading(false);
        cacheRef.current = { data: null, timestamp: 0, email: null };
        return;
      }

      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (!email) {
        setIsLoading(false);
        return;
      }

      // 캐시 체크 (같은 이메일 & 유효 시간 내)
      const now = Date.now();
      if (
        !forceRefresh &&
        cacheRef.current.email === email &&
        cacheRef.current.data &&
        now - cacheRef.current.timestamp < CACHE_TTL
      ) {
        // 캐시된 데이터 사용
        setUser(cacheRef.current.data);
        setIsLoading(false);
        return;
      }

      // Clerk 이메일로 staffs 테이블 조회 (회사 정보 조인)
      const { data: me, error } = await supabase
        .from("staffs")
        .select("id, name, email, role, gym_id, company_id, work_start_time, work_end_time, employment_status, clerk_user_id, companies(name)")
        .eq("email", email)
        .single();

      if (error || !me) {
        setUser(null);
        setIsApproved(false);
        setIsLoading(false);
        return;
      }

      const staffData = me as StaffWithCompany;
      const companyNameFromJoin = staffData.companies?.[0]?.name || "";

      // 유저 기본 정보 설정
      const userData: UserData = {
        id: staffData.id,
        name: staffData.name,
        email: staffData.email,
        role: staffData.role as UserData["role"],
        gym_id: staffData.gym_id || "",
        company_id: staffData.company_id || "",
        work_start_time: staffData.work_start_time || undefined,
        work_end_time: staffData.work_end_time || undefined,
      };

      setUser(userData);
      setCompanyName(companyNameFromJoin);

      // 캐시 업데이트
      cacheRef.current = { data: userData, timestamp: Date.now(), email };

      // 퇴사자 또는 가입대기 상태 체크
      if (staffData.employment_status === "퇴사" || staffData.employment_status === "가입대기") {
        setIsApproved(false);
        setIsLoading(false);
        return;
      }

      // clerk_user_id가 없으면 업데이트
      if (!staffData.clerk_user_id) {
        await supabase
          .from("staffs")
          .update({ clerk_user_id: clerkUser.id })
          .eq("id", staffData.id);
      }

      setIsApproved(true);

      // 지점 목록과 회사 목록 병렬 조회
      if (staffData.company_id) {
        const gymsPromise = supabase
          .from("gyms")
          .select("id, name")
          .eq("company_id", staffData.company_id)
          .order("name");

        const companiesPromise = staffData.role === "system_admin"
          ? supabase
              .from("companies")
              .select("id, name")
              .eq("status", "active")
              .order("name")
          : Promise.resolve({ data: null });

        const [gymsResult, companiesResult] = await Promise.all([
          gymsPromise,
          companiesPromise,
        ]);

        if (gymsResult.data) {
          setGyms(gymsResult.data as GymData[]);
          const myGym = gymsResult.data.find((g: GymData) => g.id === staffData.gym_id);
          if (myGym) setGymName(myGym.name);
        }

        if (companiesResult?.data) {
          setCompanies(companiesResult.data as CompanyData[]);
        }
      }
    } catch (error) {
      console.error("AuthContext error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clerkLoaded, clerkUser, supabase]);

  useEffect(() => {
    if (clerkLoaded) {
      fetchUserData();
    }
  }, [clerkLoaded, clerkUser, fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isApproved,
        companyName,
        gymName,
        gyms,
        companies,
        refetch: fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
