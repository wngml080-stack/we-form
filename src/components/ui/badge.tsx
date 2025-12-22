import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold font-heading transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] text-white shadow-[0_2px_6px_rgba(47,128,237,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:shadow-[0_4px_8px_rgba(47,128,237,0.4)]",
        secondary:
          "bg-gradient-to-br from-secondary to-teal-600 text-white shadow-[0_2px_6px_rgba(20,184,166,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:shadow-[0_4px_8px_rgba(20,184,166,0.4)]",
        accent:
          "bg-gradient-to-br from-accent to-orange-600 text-white shadow-[0_2px_6px_rgba(249,115,22,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:shadow-[0_4px_8px_rgba(249,115,22,0.4)]",
        success:
          "bg-gradient-to-br from-success to-emerald-600 text-white shadow-[0_2px_6px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:shadow-[0_4px_8px_rgba(16,185,129,0.4)]",
        warning:
          "bg-gradient-to-br from-warning to-amber-600 text-white shadow-[0_2px_6px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:shadow-[0_4px_8px_rgba(245,158,11,0.4)]",
        destructive:
          "bg-gradient-to-br from-danger to-red-600 text-white shadow-[0_2px_6px_rgba(239,68,68,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:shadow-[0_4px_8px_rgba(239,68,68,0.4)]",
        outline:
          "border-2 border-slate-200 bg-white text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-primary hover:text-primary hover:translate-y-[-2px]",
        soft:
          "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15",
        "soft-secondary":
          "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15",
        "soft-accent":
          "bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15",
        "soft-success":
          "bg-success/10 text-success border border-success/20 hover:bg-success/15",
        "soft-warning":
          "bg-warning/10 text-warning border border-warning/20 hover:bg-warning/15",
        "soft-danger":
          "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/15",
        glass:
          "bg-white/70 backdrop-blur-xl border border-white/50 text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]",
      },
      size: {
        default: "px-3 py-1.5 text-xs",
        sm: "px-2 py-1 text-[10px]",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
