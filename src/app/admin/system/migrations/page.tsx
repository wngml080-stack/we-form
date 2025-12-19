"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, Database, CheckCircle, XCircle, Clock, FileCode } from "lucide-react";
import Link from "next/link";

interface MigrationInfo {
  name: string;
  date: string;
  description: string;
  status: "applied" | "pending" | "unknown";
}

// 마이그레이션 파일 목록 (하드코딩 - 실제 파일과 동기화 필요)
const MIGRATIONS: MigrationInfo[] = [
  { name: "00_migration_tracker", date: "2025-12-08", description: "마이그레이션 추적 시스템", status: "unknown" },
  { name: "20251208164318_salary_system_tables", date: "2025-12-08", description: "급여 시스템 테이블 (8개)", status: "unknown" },
  { name: "20251208164319_alter_existing_tables_fixed", date: "2025-12-08", description: "기존 테이블 수정", status: "unknown" },
  { name: "20251208164320_salary_rls_policies", date: "2025-12-08", description: "급여 RLS 정책", status: "unknown" },
  { name: "20251208164321_seed_basic_data", date: "2025-12-08", description: "초기 데이터 시드", status: "unknown" },
  { name: "20251208170000_monthly_schedule_reports", date: "2025-12-08", description: "월별 스케줄 보고서", status: "unknown" },
  { name: "20251209000000_extend_member_payments", date: "2025-12-09", description: "결제 테이블 확장", status: "unknown" },
  { name: "20251210000000_add_salary_templates", date: "2025-12-10", description: "급여 템플릿 시스템", status: "unknown" },
  { name: "20251211000000_remove_duplicate_schedules", date: "2025-12-11", description: "중복 스케줄 제거", status: "unknown" },
  { name: "20251211010000_update_schedule_types", date: "2025-12-11", description: "스케줄 타입 분류", status: "unknown" },
  { name: "20251211020000_add_schedule_submission_columns", date: "2025-12-11", description: "스케줄 제출 컬럼", status: "unknown" },
  { name: "20251217000000_add_member_indexes", date: "2025-12-17", description: "회원 인덱스 추가", status: "unknown" },
  { name: "20251218000001_add_membership_products", date: "2025-12-18", description: "회원권 상품 템플릿", status: "unknown" },
  { name: "20251218000002_add_gym_bep", date: "2025-12-18", description: "지점 BEP 설정", status: "unknown" },
  { name: "20251218000003_add_company_id_to_staffs", date: "2025-12-18", description: "직원에 회사ID 추가", status: "unknown" },
  { name: "20251218010000_add_announcements_and_events", date: "2025-12-18", description: "공지사항 및 행사", status: "unknown" },
  { name: "20251218100001_cleanup_unused_tables", date: "2025-12-18", description: "미사용 테이블 정리", status: "unknown" },
  { name: "20251219000000_add_salary_settings", date: "2025-12-19", description: "급여 설정 테이블", status: "unknown" },
];

export default function MigrationsPage() {
  const router = useRouter();
  const [migrations, setMigrations] = useState<MigrationInfo[]>(MIGRATIONS);
  const [tables, setTables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  const supabase = createSupabaseClient();

  useEffect(() => {
    checkAccess();
    fetchTableList();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: me } = await supabase
      .from("staffs")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (me?.role !== "system_admin") {
      router.push("/admin");
      return;
    }

    setUserRole(me.role);
  };

  const fetchTableList = async () => {
    try {
      // 테이블 목록 조회 (information_schema 사용)
      const { data, error } = await supabase.rpc('get_table_list');

      if (error) {
        // RPC가 없으면 기본 테이블 목록 사용
        console.log("RPC not available, using default table check");
        await checkMigrationStatus();
      } else if (data) {
        setTables(data.map((t: any) => t.table_name));
      }
    } catch (error) {
      console.error("테이블 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkMigrationStatus = async () => {
    // migration_history 테이블 확인
    const { data: history } = await supabase
      .from("migration_history")
      .select("migration_name, executed_at");

    if (history) {
      const appliedMigrations = history.map(h => h.migration_name);
      setMigrations(prev => prev.map(m => ({
        ...m,
        status: appliedMigrations.includes(m.name) ? "applied" : "pending"
      })));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "applied":
        return "적용됨";
      case "pending":
        return "대기중";
      default:
        return "확인필요";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-[#2F80ED] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/system" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">마이그레이션 현황</h1>
            <p className="text-sm text-gray-500">데이터베이스 스키마 변경 이력</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">{migrations.length}</div>
          <div className="text-sm text-gray-500">전체 마이그레이션</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-green-600">
            {migrations.filter(m => m.status === "applied").length}
          </div>
          <div className="text-sm text-gray-500">적용됨</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {migrations.filter(m => m.status === "pending").length}
          </div>
          <div className="text-sm text-gray-500">대기중</div>
        </div>
      </div>

      {/* 마이그레이션 목록 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-900">마이그레이션 파일 목록</h2>
        </div>
        <div className="divide-y">
          {migrations.map((migration, index) => (
            <div key={migration.name} className="px-4 py-3 hover:bg-gray-50 flex items-center gap-4">
              <div className="w-8 text-center text-sm text-gray-400">{index + 1}</div>
              {getStatusIcon(migration.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-sm text-gray-700">{migration.name}.sql</span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{migration.description}</div>
              </div>
              <div className="text-sm text-gray-400">{migration.date}</div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                migration.status === "applied" ? "bg-green-100 text-green-700" :
                migration.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {getStatusText(migration.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">마이그레이션 실행 방법</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Supabase Dashboard 접속</li>
          <li>SQL Editor 열기</li>
          <li>마이그레이션 파일 내용 복사</li>
          <li>SQL 실행</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          파일 위치: <code className="bg-blue-100 px-1 rounded">supabase/migrations/</code>
        </p>
      </div>
    </div>
  );
}
