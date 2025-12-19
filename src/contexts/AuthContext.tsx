"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

interface UserData {
  id: string;
  name: string;
  email?: string;
  role: string;
  gym_id: string;
  company_id: string;
  work_start_time?: string;
  work_end_time?: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  companyName: string;
  gymName: string;
  gyms: any[];
  companies: any[];
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  companyName: "",
  gymName: "",
  gyms: [],
  companies: [],
  refetch: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [gymName, setGymName] = useState("");
  const [gyms, setGyms] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const supabase = createSupabaseClient();

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      // 사용자 정보 가져오기
      const { data: me } = await supabase
        .from("staffs")
        .select("id, name, email, role, gym_id, company_id, work_start_time, work_end_time, companies(name)")
        .eq("user_id", authUser.id)
        .single();

      if (me) {
        setUser({
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          gym_id: me.gym_id,
          company_id: me.company_id,
          work_start_time: me.work_start_time,
          work_end_time: me.work_end_time,
        });
        // @ts-ignore
        setCompanyName(me.companies?.name || "");

        // 병렬로 지점, 회사 목록 가져오기
        const gymsPromise = supabase.from("gyms").select("id, name").eq("company_id", me.company_id).order("name");
        const companiesPromise = me.role === "system_admin"
          ? supabase.from("companies").select("id, name").eq("status", "active").order("name")
          : null;

        const [gymsResult, companiesResult] = await Promise.all([
          gymsPromise,
          companiesPromise,
        ]);

        if (gymsResult.data) {
          setGyms(gymsResult.data);
          const myGym = gymsResult.data.find((g: any) => g.id === me.gym_id);
          if (myGym) setGymName(myGym.name);
        }

        if (companiesResult?.data) {
          setCompanies(companiesResult.data);
        }
      }
    } catch (error) {
      console.error("AuthContext error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      companyName,
      gymName,
      gyms,
      companies,
      refetch: fetchUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
