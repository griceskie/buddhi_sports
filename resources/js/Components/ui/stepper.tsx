import * as React from "react"
import { cn } from "cn"
import { Check } from "lucide-react"

const BOOKING_STEPS = ["Pilih lapangan", "Jadwal", "Bayar", "Upload bukti"]

type StepperProps = {
  steps?: string[]
  /** Zero-based index of the step the renter is on. */
  current: number
  className?: string
}

function Stepper({ steps = BOOKING_STEPS, current, className }: StepperProps) {
  return (
    <ol data-slot="stepper" className={cn("flex w-full items-start", className)}>
      {steps.map((label, i) => {
        const state = i < current ? "complete" : i === current ? "current" : "upcoming"
        return (
          <li
            key={label}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
            className="group relative flex flex-1 flex-col items-center gap-1.5 text-center"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-3.5 right-[calc(50%+1rem)] left-[calc(-50%+1rem)] h-px",
                  i <= current ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums [&_svg]:size-3.5",
                state === "complete" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-primary bg-background text-foreground ring-3 ring-ring/30",
                state === "upcoming" && "border-input bg-background text-muted-foreground"
              )}
            >
              {state === "complete" ? <Check aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={cn(
                "px-1 text-xs leading-tight",
                state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground"
              )}
            >
              {label}
              {state === "complete" && <span className="sr-only"> (selesai)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper, BOOKING_STEPS }
export type { StepperProps }
