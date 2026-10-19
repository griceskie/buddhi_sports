import * as React from "react"
import { cn } from "cn"

type StatCardProps = {
  label: React.ReactNode
  /** Already formatted, e.g. formatRupiah(totalPemasukan) or "12". */
  value: React.ReactNode
  /** One supporting line, e.g. "Oktober 2026" or "dari 15 booking". */
  description?: React.ReactNode
  /** A Lucide icon element. */
  icon?: React.ReactNode
  /** Optional footer, e.g. a link to the filtered list. */
  action?: React.ReactNode
  className?: string
}

function StatCard({ label, value, description, icon, action, className }: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn("flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span aria-hidden="true" className="text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export { StatCard }
export type { StatCardProps }
