import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium ring-offset-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c8c5e] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#08090a] text-white hover:bg-[#27272a] shadow-mv-sm",
        primary: "bg-[#08090a] text-white hover:bg-[#27272a] shadow-mv-sm",
        mint: "bg-[#0c8c5e] text-white hover:bg-[#09734d] shadow-mv-sm",
        lime: "bg-[#0c8c5e] text-white hover:bg-[#09734d] shadow-mv-sm",
        destructive: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
        danger: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
        outline: "border border-[#dddddd] bg-white text-[#000000] hover:bg-[#f2f2f2]",
        secondary: "bg-[#f2f2f2] text-[#000000] hover:bg-[#e4e4e7] border border-[#dddddd]",
        ghost: "text-[#000000] hover:bg-[#f2f2f2]",
        link: "text-[#0c8c5e] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded px-3 text-xs",
        lg: "h-11 rounded px-6 text-base",
        icon: "h-10 w-10 p-0",
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
  asChild?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {!asChild && icon && <span className="shrink-0">{icon}</span>}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
