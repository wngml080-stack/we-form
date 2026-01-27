"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useAuth } from "./AuthContext";

// 타입 정의
interface GymData {
  id: string;
  name: string;
}

interface StaffData {
  id: string;
  name: string;
  job_title?: string;
  role?: string;
}

interface CompanyData {
  id: string;
  name: string;
}

interface FilterState {
  selectedCompanyId: string;
  selectedGymId: string;
  selectedStaffId: string;
  gyms: GymData[];
  staffs: StaffData[];
}

interface AdminFilterContextType {
  selectedCompanyId: string;
  selectedGymId: string;
  selectedStaffId: string;
  gyms: GymData[];
  staffs: StaffData[];
  companies: CompanyData[];
  setCompany: (companyId: string) => void;
  setGym: (gymId: string) => void;
  setStaff: (staffId: string) => void;
  gymName: string;
  companyName: string;
  staffName: string;
  isInitialized: boolean;
  // 하위 호환성
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
  selectedStaffId: "",
  gyms: [],
  staffs: [],
};

const AdminFilterContext = createContext<AdminFilterContextType>({
  selectedCompanyId: "",
  selectedGymId: "",
  selectedStaffId: "",
  gyms: [],
  staffs: [],
  companies: [],
  setCompany: () => {},
  setGym: () => {},
  setStaff: () => {},
  gymName: "",
  companyName: "",
  staffName: "",
  isInitialized: false,
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
  const { user, isLoading: authLoading } = useAuth();

  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<FilterState>(defaultFilter);

  // 캐시 (메모리 캐싱)
  const gymsCache = useRef<Map<string, GymData[]>>(new Map());
  const staffsCache = useRef<Map<string, StaffData[]>>(new Map());

  // 지점 목록 가져오기 (캐싱 적용)
  const fetchGymsForCompany = useCallback(async (companyId: string): Promise<GymData[]> => {
    if (!companyId) return [];

    // 캐시 확인
    const cached = gymsCache.current.get(companyId);
    if (cached) return cached;

    try {
      const response = await fetch(`/api/admin/filter/gyms?company_id=${companyId}`);
      const result = await response.json();
      if (result.success) {
        const gyms = result.gyms || [];
        gymsCache.current.set(companyId, gyms);
        return gyms;
      }
    } catch (error) {
      console.error("Error fetching gyms:", error);
    }
    return [];
  }, []);

  // 직원 목록 가져오기 (캐싱 적용)
  const fetchStaffsForGym = useCallback(async (gymId: string): Promise<StaffData[]> => {
    if (!gymId) return [];

    // 캐시 확인
    const cached = staffsCache.current.get(gymId);
    if (cached) return cached;

    try {
      const response = await fetch(`/api/admin/filter/staffs?gym_id=${gymId}`);
      const result = await response.json();
      if (result.success) {
        const staffs = result.staffs || [];
        staffsCache.current.set(gymId, staffs);
        return staffs;
      }
    } catch {
      // Error fetching staffs - return empty array
    }
    return [];
  }, []);

  // 초기화 - 통합 API 사용으로 3개 요청을 1개로 줄임
  useEffect(() => {
    if (authLoading) return;

    // 유저가 없으면 초기화 완료로 간주 (로그인 페이지 등으로 리다이렉트될 것)
    if (!user) {
      setIsInitialized(true);
      return;
    }

    const initializeFilter = async () => {
      try {
        const userCompanyId = user.company_id || "";
        const userGymId = user.gym_id || "";

        // 통합 API로 한 번에 모든 데이터 조회
        const params = new URLSearchParams();
        if (userCompanyId) params.set("company_id", userCompanyId);
        if (userGymId) params.set("gym_id", userGymId);

        const response = await fetch(`/api/admin/filter/init?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          if (result.companies?.length > 0) {
            setCompanies(result.companies);
          }

          // 캐시 저장
          if (userCompanyId && result.gyms) {
            gymsCache.current.set(userCompanyId, result.gyms);
          }
          if (result.defaultGymId && result.staffs) {
            staffsCache.current.set(result.defaultGymId, result.staffs);
          }

          setGlobalFilter({
            selectedCompanyId: result.defaultCompanyId || userCompanyId,
            selectedGymId: result.defaultGymId || "",
            selectedStaffId: "",
            gyms: result.gyms || [],
            staffs: result.staffs || [],
          });
        }
      } catch {
        // Initialization error - silently fail
      } finally {
        setIsInitialized(true);
      }
    };

    initializeFilter();
  }, [authLoading, user]);

  // 회사 변경
  const setCompany = useCallback(
    async (companyId: string) => {
      if (!companyId || companyId === globalFilter.selectedCompanyId) return;

      const newGyms = await fetchGymsForCompany(companyId);
      const newGymId = newGyms.length > 0 ? newGyms[0].id : "";
      const newStaffs = newGymId ? await fetchStaffsForGym(newGymId) : [];

      setGlobalFilter({
        selectedCompanyId: companyId,
        selectedGymId: newGymId,
        selectedStaffId: "",
        gyms: newGyms,
        staffs: newStaffs,
      });
    },
    [globalFilter.selectedCompanyId, fetchGymsForCompany, fetchStaffsForGym]
  );

  // 지점 변경
  const setGym = useCallback(
    async (gymId: string) => {
      if (!gymId || gymId === globalFilter.selectedGymId) return;

      const newStaffs = await fetchStaffsForGym(gymId);

      setGlobalFilter((prev) => ({
        ...prev,
        selectedGymId: gymId,
        selectedStaffId: "",
        staffs: newStaffs,
      }));
    },
    [globalFilter.selectedGymId, fetchStaffsForGym]
  );

  // 직원 변경
  const setStaff = useCallback((staffId: string) => {
    setGlobalFilter((prev) => ({ ...prev, selectedStaffId: staffId }));
  }, []);

  // 현재 선택된 이름들
  const gymName = globalFilter.gyms.find((g) => g.id === globalFilter.selectedGymId)?.name || "";
  const companyName = companies.find((c) => c.id === globalFilter.selectedCompanyId)?.name || "";
  const staffName = globalFilter.staffs.find((s) => s.id === globalFilter.selectedStaffId)?.name || "";

  return (
    <AdminFilterContext.Provider
      value={{
        selectedCompanyId: globalFilter.selectedCompanyId,
        selectedGymId: globalFilter.selectedGymId,
        selectedStaffId: globalFilter.selectedStaffId,
        gyms: globalFilter.gyms,
        staffs: globalFilter.staffs,
        companies,
        setCompany,
        setGym,
        setStaff,
        gymName,
        companyName,
        staffName,
        isInitialized,
        // 하위 호환성
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
