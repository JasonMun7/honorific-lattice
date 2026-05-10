import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(function Input(
  { className, type, ...props },
  ref
) {
  return (
    <input
      type={type}
      data-slot="input"
      ref={ref}
      className={cn(
        "flex h-10 min-h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }
