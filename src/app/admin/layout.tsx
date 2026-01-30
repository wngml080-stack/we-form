"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminFilterProvider, useAdminFilter } from "@/contexts/AdminFilterContext";
import { MessengerWidget } from "./components/messenger";
import { AdminSidebar } from "./components/sidebar/AdminSidebar";
import { AdminTopBar } from "./components/topbar/AdminTopBar";
import { MobileSidebarDrawer } from "./components/mobile/MobileSidebarDrawer";

const SystemAnnouncementModal = dynamic(
  () => import("./components/modals/SystemAnnouncementModal").then(mod => ({ default: mod.SystemAnnouncementModal })),
  { ssr: false }
);

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, authUser, isLoading, isApproved, companyName: authCompanyName } = useAuth();
  const { companyName: filterCompanyName } = useAdminFilter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [systemAnnouncements, setSystemAnnouncements] = useState<Array<{ id: string; title: string; priority: string; is_active: boolean }>>([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const announcementsFetched = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 시스템 공지 데이터 조회 (캐싱으로 중복 호출 방지)
  useEffect(() => {
    if (!isMounted || announcementsFetched.current) return;

    const CACHE_KEY = "weform_system_announcements";
    const CACHE_EXPIRY_KEY = "weform_system_announcements_expiry";
    const CACHE_DURATION = 5 * 60 * 1000; // 5분

    // 캐시 확인
    const cached = sessionStorage.getItem(CACHE_KEY);
    const expiry = sessionStorage.getItem(CACHE_EXPIRY_KEY);

    if (cached && expiry && Date.now() < parseInt(expiry, 10)) {
      try {
        setSystemAnnouncements(JSON.parse(cached));
        announcementsFetched.current = true;
        return;
      } catch {
        // 캐시 파싱 실패 시 새로 조회
      }
    }

    const fetchSystemAnnouncements = async () => {
      try {
        const response = await fetch("/api/admin/system/announcements");
        const data = await response.json();
        const activeAnnouncements = (data.announcements || []).filter((a: { is_active: boolean }) => a.is_active);
        setSystemAnnouncements(activeAnnouncements);

        // 캐시 저장
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(activeAnnouncements));
        sessionStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
        announcementsFetched.current = true;
      } catch {
        // 조회 실패 시 빈 배열 유지
      }
    };

    fetchSystemAnnouncements();
  }, [isMounted]);

  const companyName = filterCompanyName || authCompanyName || "";

  // 인증 체크 및 리다이렉트
  useEffect(() => {
    if (isLoading) return;

    if (!authUser) {
      router.push("/sign-in");
      return;
    }

    if (!isApproved) {
      if (!user) {
        router.push("/onboarding");
      } else {
        const pendingType = user.role === "company_admin" ? "company" : "staff";
        router.push(`/onboarding/pending?type=${pendingType}`);
      }
    }
  }, [authUser, isLoading, isApproved, user, router]);

  if (!isMounted) return null;

  if (isLoading || !isApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--primary-hex)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading We:form</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Fixed Left Sidebar (desktop) */}
      <AdminSidebar />

      {/* Mobile Sidebar Overlay */}
      <MobileSidebarDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <AdminTopBar
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          companyName={companyName}
        />

        {/* System Announcement Banner */}
        {systemAnnouncements.length > 0 && (
          <div
            className="bg-slate-900 py-2 overflow-hidden cursor-pointer"
            onClick={() => setIsAnnouncementModalOpen(true)}
          >
            <div className="flex whitespace-nowrap animate-marquee-scroll">
              {[0, 1].map((setIndex) => (
                <div key={setIndex} className="flex shrink-0 items-center px-4">
                  {systemAnnouncements.map((announcement, idx) => (
                    <div key={`${setIndex}-${idx}`} className="flex items-center text-white text-sm">
                      <span className="mx-8 opacity-30">•</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded mr-3 ${
                        announcement.priority === 'urgent' ? 'bg-rose-500' : 'bg-blue-500'
                      }`}>
                        {announcement.priority.toUpperCase()}
                      </span>
                      <span className="font-medium mr-2">{announcement.title}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 transition-all duration-500">
          <div className="p-4 sm:p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>

      {/* Messenger Widget */}
      <MessengerWidget />

      {/* System Announcement Modal */}
      <SystemAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onOpenChange={setIsAnnouncementModalOpen}
        announcements={systemAnnouncements}
      />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminFilterProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminFilterProvider>
    </AuthProvider>
  );
}
