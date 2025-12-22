import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "glass" | "neumorphic" | "gradient-primary" | "gradient-secondary" | "gradient-accent"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white border border-slate-100 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-bounce-in",
    elevated: "bg-white border border-slate-100 rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.06),0_24px_48px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_24px_48px_rgba(0,0,0,0.08),0_48px_96px_rgba(0,0,0,0.12)] hover:translate-y-[-8px] transition-all duration-400 ease-bounce-in",
    glass: "bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-white/80 transition-all duration-300",
    neumorphic: "bg-[#f0f4f8] rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.1),-8px_-8px_20px_rgba(255,255,255,0.9)] hover:shadow-[12px_12px_30px_rgba(0,0,0,0.12),-12px_-12px_30px_rgba(255,255,255,0.95)] transition-all duration-300",
    "gradient-primary": "bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] text-white rounded-3xl shadow-[0_4px_8px_rgba(47,128,237,0.35),0_12px_24px_rgba(47,128,237,0.35),0_24px_48px_rgba(47,128,237,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-8px] hover:shadow-[0_8px_16px_rgba(47,128,237,0.35),0_24px_48px_rgba(47,128,237,0.35),0_48px_96px_rgba(47,128,237,0.25)] transition-all duration-400 ease-bounce-in overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
    "gradient-secondary": "bg-gradient-to-br from-secondary to-teal-600 text-white rounded-3xl shadow-[0_4px_8px_rgba(20,184,166,0.35),0_12px_24px_rgba(20,184,166,0.35),0_24px_48px_rgba(20,184,166,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-8px] hover:shadow-[0_8px_16px_rgba(20,184,166,0.35),0_24px_48px_rgba(20,184,166,0.35),0_48px_96px_rgba(20,184,166,0.25)] transition-all duration-400 ease-bounce-in overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
    "gradient-accent": "bg-gradient-to-br from-accent to-orange-600 text-white rounded-3xl shadow-[0_4px_8px_rgba(249,115,22,0.35),0_12px_24px_rgba(249,115,22,0.35),0_24px_48px_rgba(249,115,22,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-8px] hover:shadow-[0_8px_16px_rgba(249,115,22,0.35),0_24px_48px_rgba(249,115,22,0.35),0_48px_96px_rgba(249,115,22,0.25)] transition-all duration-400 ease-bounce-in overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
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
    className={cn("flex flex-col space-y-1.5 p-6", className)}
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
    className={cn("font-heading font-bold text-lg tracking-tight leading-none", className)}
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
    className={cn("text-sm text-slate-500", className)}
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
