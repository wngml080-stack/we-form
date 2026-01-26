import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "filled"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
      // 토스 스타일 기본 인풋
      default: "flex h-12 w-full rounded-xl border-2 border-[#E5E8EB] bg-white px-4 py-3 text-base text-[#191F28] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#4E5968] placeholder:text-[#B0B8C1] focus-visible:outline-none focus-visible:border-[#3182F6] focus-visible:bg-[#F0F6FF] focus-visible:ring-4 focus-visible:ring-[#3182F6]/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#F4F5F7] md:text-sm",
      // 토스 스타일 채워진 인풋
      filled: "flex h-12 w-full rounded-xl border-none bg-[#F4F5F7] px-4 py-3 text-base text-[#191F28] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#4E5968] placeholder:text-[#B0B8C1] focus-visible:outline-none focus-visible:bg-[#EBEDF0] focus-visible:ring-4 focus-visible:ring-[#3182F6]/10 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
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
