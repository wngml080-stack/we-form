import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outline" | "interactive" | "primary"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    // 토스 스타일 기본 카드
    default: "bg-white border border-[#E5E8EB] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200",
    // 토스 스타일 상승 카드
    elevated: "bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200",
    // 토스 스타일 아웃라인 카드
    outline: "bg-white border border-[#E5E8EB] rounded-2xl hover:-translate-y-1 hover:border-[#3182F6] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200",
    // 토스 스타일 인터랙티브 카드
    interactive: "bg-white border border-[#E5E8EB] rounded-2xl cursor-pointer hover:bg-[#F4F5F7] hover:-translate-y-1 active:bg-[#EBEDF0] active:translate-y-0 transition-all duration-150",
    // 토스 스타일 Primary 카드
    primary: "bg-[#3182F6] text-white rounded-2xl shadow-[0_4px_12px_rgba(49,130,246,0.25)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(49,130,246,0.3)] transition-all duration-200",
  }

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-heading font-bold text-lg text-[#191F28] tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[#8B95A1]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
