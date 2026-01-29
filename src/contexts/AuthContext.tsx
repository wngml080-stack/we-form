"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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
  companies: { name: string }[] | null;
}

interface AuthContextType {
  user: UserData | null;
  authUser: User | null;
  isLoading: boolean;
  isApproved: boolean;
  companyName: string;
  gymName: string;
  gyms: GymData[];
  companies: CompanyData[];
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  isLoading: true,
  isApproved: false,
  companyName: "",
  gymName: "",
  gyms: [],
  companies: [],
  refetch: async () => {},
  signOut: async () => {},
});

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;
const AUTH_CACHE_KEY = "weform_auth_cache";

// localStorage 캐시 타입 - 최소 정보만 저장 (보안)
// 민감 정보(id, email, role, company_id, gym_id)는 저장하지 않음
interface AuthCache {
  hasSession: boolean;      // 로그인 상태 여부만
  displayName: string;      // UI 표시용 이름만
  timestamp: number;        // 만료 체크용
}

// localStorage 캐시 유틸리티
function _getStoredCache(): AuthCache | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as AuthCache;
    // 캐시 유효성 검사
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      return parsed;
    }
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // 캐시 파싱 실패 시 무시
  }
  return null;
}

function setStoredCache(cache: AuthCache) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 저장 실패 시 무시
  }
}

function clearStoredCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // 실패 시 무시
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
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

  // localStorage 캐시는 더 이상 isLoading 상태에 영향을 주지 않음
  // fetchUserData가 완료될 때까지 로딩 상태 유지 (race condition 방지)

  // Supabase Auth 상태 감지
  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setAuthLoaded(true);
    });

    // Auth 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    try {
      if (!authLoaded) return;

      if (!authUser) {
        setUser(null);
        setIsApproved(false);
        setIsLoading(false);
        cacheRef.current = { data: null, timestamp: 0, email: null };
        clearStoredCache();
        return;
      }

      const email = authUser.email;
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

      // 이메일로 staffs 테이블 조회 (회사 정보 조인)
      const { data: me, error } = await supabase
        .from("staffs")
        .select("id, name, email, role, gym_id, company_id, work_start_time, work_end_time, employment_status, companies(name)")
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
        clearStoredCache();
        return;
      }

      setIsApproved(true);

      // localStorage 캐시 저장 (승인된 사용자만) - 최소 정보만 저장
      // 민감 정보(id, email, role, company_id 등)는 저장하지 않음
      setStoredCache({
        hasSession: true,
        displayName: userData.name,
        timestamp: Date.now(),
      });

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
  }, [authLoaded, authUser, supabase]);

  // authUser의 email이 변경될 때만 데이터 다시 로드 (무한 루프 방지)
  const authEmail = authUser?.email;
  useEffect(() => {
    if (authLoaded) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, authEmail]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsApproved(false);
    cacheRef.current = { data: null, timestamp: 0, email: null };
    clearStoredCache();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        isLoading,
        isApproved,
        companyName,
        gymName,
        gyms,
        companies,
        refetch: fetchUserData,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
