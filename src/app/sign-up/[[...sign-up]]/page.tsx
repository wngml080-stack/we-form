import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-secondary/30 to-teal-600/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary/30 to-indigo-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-accent/20 to-orange-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* 로고 */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] flex items-center justify-center shadow-[0_4px_12px_rgba(47,128,237,0.35)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-lg font-heading font-bold text-slate-800">We:form</span>
      </div>

      <div className="relative z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_32px_64px_rgba(0,0,0,0.08)] rounded-3xl border border-white/50",
              headerTitle: "font-heading font-bold text-slate-900",
              headerSubtitle: "text-slate-500",
              socialButtonsBlockButton: "bg-white border-2 border-slate-200 hover:border-secondary/50 hover:bg-slate-50 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300",
              formButtonPrimary: "bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] hover:from-[#2570d6] hover:to-[#1c60b8] rounded-xl shadow-[0_4px_12px_rgba(47,128,237,0.35)] transition-all duration-300",
              formFieldInput: "rounded-xl border-2 border-slate-200 focus:border-[#2F80ED] focus:ring-4 focus:ring-[#2F80ED]/10 transition-all duration-300",
              footerActionLink: "text-[#2F80ED] hover:text-[#2F80ED]/80 font-semibold",
              identityPreviewEditButton: "text-[#2F80ED] hover:text-[#2F80ED]/80",
            },
          }}
          fallbackRedirectUrl="/admin"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
