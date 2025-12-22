import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "neumorphic" | "glass"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
      default: "flex h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base font-medium transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#2F80ED] focus-visible:ring-4 focus-visible:ring-[#2F80ED]/10 focus-visible:shadow-[0_4px_12px_rgba(47,128,237,0.15)] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(255,255,255,0.8)] md:text-sm",
      neumorphic: "flex h-11 w-full rounded-xl border-none bg-[#f0f4f8] px-4 py-2.5 text-base font-medium transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2F80ED]/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] focus:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.95),0_0_0_3px_rgba(47,128,237,0.1)] md:text-sm",
      glass: "flex h-11 w-full rounded-xl border border-white/50 bg-white/70 backdrop-blur-xl px-4 py-2.5 text-base font-medium transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#2F80ED] focus-visible:ring-4 focus-visible:ring-[#2F80ED]/10 focus-visible:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] md:text-sm",
    }

    return (
      <input
        type={type}
        className={cn(variants[variant], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
