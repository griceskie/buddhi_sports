import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const textareaVariants = cva(
  "flex w-full rounded-lg border bg-transparent text-sm transition-colors placeholder:text-muted-foreground outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "border-input bg-background focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        ghost:
          "border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted focus-visible:ring-0",
      },
      size: {
        sm: "min-h-[60px] px-2.5 py-1.5 text-xs rounded-md",
        default: "min-h-[80px] px-3 py-2 text-sm",
        lg: "min-h-[120px] px-3.5 py-2.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> &
    VariantProps<typeof textareaVariants>
>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    className={cn(textareaVariants({ variant, size, className }))}
    {...props}
  />
))

Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
