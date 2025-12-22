import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold font-heading transition-all duration-300 ease-bounce-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80ED] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#2F80ED] to-[#1c60b8] text-white rounded-xl shadow-[0_4px_0_#1c60b8,0_6px_12px_rgba(47,128,237,0.35)] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#1c60b8,0_10px_20px_rgba(47,128,237,0.4)] active:translate-y-[2px] active:shadow-[0_2px_0_#1c60b8,0_3px_6px_rgba(47,128,237,0.35)]",
        secondary:
          "bg-gradient-to-br from-[#14b8a6] to-[#0d9488] text-white rounded-xl shadow-[0_4px_0_#0d9488,0_6px_12px_rgba(20,184,166,0.35)] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#0d9488,0_10px_20px_rgba(20,184,166,0.4)] active:translate-y-[2px] active:shadow-[0_2px_0_#0d9488,0_3px_6px_rgba(20,184,166,0.35)]",
        accent:
          "bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white rounded-xl shadow-[0_4px_0_#ea580c,0_6px_12px_rgba(249,115,22,0.35)] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#ea580c,0_10px_20px_rgba(249,115,22,0.4)] active:translate-y-[2px] active:shadow-[0_2px_0_#ea580c,0_3px_6px_rgba(249,115,22,0.35)]",
        destructive:
          "bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white rounded-xl shadow-[0_4px_0_#dc2626,0_6px_12px_rgba(239,68,68,0.35)] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#dc2626,0_10px_20px_rgba(239,68,68,0.4)] active:translate-y-[2px] active:shadow-[0_2px_0_#dc2626,0_3px_6px_rgba(239,68,68,0.35)]",
        success:
          "bg-gradient-to-br from-[#10b981] to-[#059669] text-white rounded-xl shadow-[0_4px_0_#059669,0_6px_12px_rgba(16,185,129,0.35)] hover:translate-y-[-2px] hover:shadow-[0_6px_0_#059669,0_10px_20px_rgba(16,185,129,0.4)] active:translate-y-[2px] active:shadow-[0_2px_0_#059669,0_3px_6px_rgba(16,185,129,0.35)]",
        outline:
          "border-2 border-slate-200 bg-white text-slate-700 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[#2F80ED] hover:text-[#2F80ED] hover:translate-y-[-2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08),0_16px_32px_rgba(0,0,0,0.1)]",
        ghost:
          "text-slate-700 rounded-xl hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        link:
          "text-[#2F80ED] underline-offset-4 hover:underline rounded-lg",
        glass:
          "bg-white/70 backdrop-blur-xl border border-white/50 text-slate-700 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-white/80 hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]",
        neumorphic:
          "bg-[#f8fafc] text-slate-700 rounded-xl shadow-[8px_8px_20px_rgba(0,0,0,0.1),-8px_-8px_20px_rgba(255,255,255,0.9)] hover:shadow-[12px_12px_30px_rgba(0,0,0,0.12),-12px_-12px_30px_rgba(255,255,255,0.95)] active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1),inset_-4px_-4px_10px_rgba(255,255,255,0.8)]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-13 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-13 w-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
