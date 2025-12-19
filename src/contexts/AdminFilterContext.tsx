"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

interface FilterState {
  selectedCompanyId: string;
  selectedGymId: string;
  gyms: { id: string; name: string }[];
}

interface AdminFilterContextType {
  // 전역 필터 상태
  selectedCompanyId: string;
  selectedGymId: string;
  gyms: { id: string; name: string }[];

  // 회사 목록 (system_admin용)
  companies: { id: string; name: string }[];

  // 필터 설정 함수들
  setCompany: (companyId: string) => void;
  setGym: (gymId: string) => void;

  // 현재 선택된 지점명
  gymName: string;
  companyName: string;

  // 초기화 완료 여부
  isInitialized: boolean;

  // 하위 호환성을 위해 기존 필터들도 유지 (모두 같은 값 반환)
  dashboardFilter: FilterState;
  branchFilter: FilterState;
  staffFilter: FilterState;
  membersFilter: FilterState;
  setDashboardCompany: (companyId: string) => void;
  setDashboardGym: (gymId: string) => void;
  setBranchCompany: (companyId: string) => void;
  setBranchGym: (gymId: string) => void;
  setStaffCompany: (companyId: string) => void;
  setStaffGym: (gymId: string) => void;
  setMembersCompany: (companyId: string) => void;
  setMembersGym: (gymId: string) => void;
}

const defaultFilter: FilterState = {
  selectedCompanyId: "",
  selectedGymId: "",
  gyms: [],
};

const AdminFilterContext = createContext<AdminFilterContextType>({
  selectedCompanyId: "",
  selectedGymId: "",
  gyms: [],
  companies: [],
  setCompany: () => {},
  setGym: () => {},
  gymName: "",
  companyName: "",
  isInitialized: false,
  // 하위 호환성
  dashboardFilter: defaultFilter,
  branchFilter: defaultFilter,
  staffFilter: defaultFilter,
  membersFilter: defaultFilter,
  setDashboardCompany: () => {},
  setDashboardGym: () => {},
  setBranchCompany: () => {},
  setBranchGym: () => {},
  setStaffCompany: () => {},
  setStaffGym: () => {},
  setMembersCompany: () => {},
  setMembersGym: () => {},
});

export function AdminFilterProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, gyms: authGyms, companies: authCompanies } = useAuth();

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 전역 필터 상태 (단일)
  const [globalFilter, setGlobalFilter] = useState<FilterState>(defaultFilter);

  const supabase = createSupabaseClient();

  // 특정 회사의 지점 목록 가져오기
  const fetchGymsForCompany = useCallback(async (companyId: string): Promise<{ id: string; name: string }[]> => {
    if (!companyId) return [];

    const { data } = await supabase
      .from("gyms")
      .select("id, name")
      .eq("company_id", companyId)
      .order("name");

    return data || [];
  }, []);

  // 초기화: AuthContext 데이터가 로드되면 필터 초기화
  useEffect(() => {
    if (authLoading || !user) return;

    const initializeFilter = async () => {
      const userCompanyId = user.company_id;
      const userGymId = user.gym_id;
      const isSystemAdmin = user.role === "system_admin";

      // 회사 목록 설정 (system_admin만)
      if (isSystemAdmin && authCompanies.length > 0) {
        setCompanies(authCompanies);
      }

      // 기본 지점 목록 (사용자의 회사)
      const defaultGyms = authGyms.length > 0 ? authGyms : await fetchGymsForCompany(userCompanyId);

      // 기본 선택 지점 (사용자 지점 또는 첫 번째 지점)
      const defaultGymId = userGymId || (defaultGyms.length > 0 ? defaultGyms[0].id : "");

      setGlobalFilter({
        selectedCompanyId: userCompanyId,
        selectedGymId: defaultGymId,
        gyms: defaultGyms,
      });

      setIsInitialized(true);
    };

    initializeFilter();
  }, [authLoading, user, authGyms, authCompanies, fetchGymsForCompany]);

  // 회사 변경
  const setCompany = useCallback(
    async (companyId: string) => {
      if (!companyId || companyId === globalFilter.selectedCompanyId) return;

      const newGyms = await fetchGymsForCompany(companyId);
      const newGymId = newGyms.length > 0 ? newGyms[0].id : "";

      setGlobalFilter({
        selectedCompanyId: companyId,
        selectedGymId: newGymId,
        gyms: newGyms,
      });
    },
    [globalFilter.selectedCompanyId, fetchGymsForCompany]
  );

  // 지점 변경
  const setGym = useCallback((gymId: string) => {
    setGlobalFilter((prev) => ({ ...prev, selectedGymId: gymId }));
  }, []);

  // 현재 선택된 지점명/회사명
  const gymName = globalFilter.gyms.find((g) => g.id === globalFilter.selectedGymId)?.name || "";
  const companyName = companies.find((c) => c.id === globalFilter.selectedCompanyId)?.name || "";

  return (
    <AdminFilterContext.Provider
      value={{
        // 새로운 전역 필터
        selectedCompanyId: globalFilter.selectedCompanyId,
        selectedGymId: globalFilter.selectedGymId,
        gyms: globalFilter.gyms,
        companies,
        setCompany,
        setGym,
        gymName,
        companyName,
        isInitialized,
        // 하위 호환성: 모든 필터가 동일한 전역 필터를 참조
        dashboardFilter: globalFilter,
        branchFilter: globalFilter,
        staffFilter: globalFilter,
        membersFilter: globalFilter,
        setDashboardCompany: setCompany,
        setDashboardGym: setGym,
        setBranchCompany: setCompany,
        setBranchGym: setGym,
        setStaffCompany: setCompany,
        setStaffGym: setGym,
        setMembersCompany: setCompany,
        setMembersGym: setGym,
      }}
    >
      {children}
    </AdminFilterContext.Provider>
  );
}

export const useAdminFilter = () => useContext(AdminFilterContext);
