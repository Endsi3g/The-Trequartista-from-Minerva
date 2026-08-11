import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-mv-green text-white hover:bg-mv-green/90 shadow-mv-sm",
        primary: "bg-mv-green text-white hover:bg-mv-green/90 shadow-mv-sm",
        lime: "bg-mv-green text-mv-warm font-bold hover:bg-mv-green/90 shadow-mv-sm",
        destructive: "bg-mv-red text-white hover:bg-mv-red/90",
        danger: "bg-mv-red text-white hover:bg-mv-red/90",
        outline: "border border-mv-border bg-mv-surface text-mv-ink hover:bg-mv-green-tint hover:border-mv-green/40",
        secondary: "bg-mv-cream-soft text-mv-ink hover:bg-mv-border/60 border border-mv-border",
        ghost: "text-mv-ink-soft hover:bg-mv-green-tint hover:text-mv-ink",
        link: "text-mv-green underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
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
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
