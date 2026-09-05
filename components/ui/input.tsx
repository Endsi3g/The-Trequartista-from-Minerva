import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded border border-[#dddddd] bg-white px-3 py-2 text-sm text-[#000000] ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-[#0c8c5e] focus-visible:ring-1 focus-visible:ring-[#0c8c5e] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
