import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-transparent text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "border-input bg-background focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        ghost:
          "border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted focus-visible:ring-0",
      },
      size: {
        sm: "h-7 px-2.5 text-xs rounded-md",
        default: "h-10 px-4 text-base",
        lg: "h-9 px-3.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Input = React.forwardRef<
  HTMLInputElement,
  Omit<InputPrimitive.Props, "className" | "size"> &
    VariantProps<typeof inputVariants> & { className?: string }
>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <InputPrimitive
    ref={ref}
    data-slot="input"
    className={cn(inputVariants({ variant, size, className }))}
    {...props}
  />
))

Input.displayName = "Input"

export { Input, inputVariants }
