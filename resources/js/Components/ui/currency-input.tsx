import * as React from "react"
import { cn } from "cn"
import { inputVariants } from "./input"

type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size"> & {
  /** Whole rupiah, e.g. 50000. */
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  size?: "sm" | "default" | "lg"
}

const show = (n: number | null | undefined) => (n == null ? "" : n.toLocaleString("id-ID"))

/**
 * Rupiah field for tarifPerJam, jumlahBayar and totalPemasukan.
 * Shows "50.000" with an "Rp" prefix; `name` submits the plain number (50000) through a hidden input.
 */
function CurrencyInput({
  value,
  defaultValue = null,
  onValueChange,
  name,
  size = "default",
  className,
  ...props
}: CurrencyInputProps) {
  const [inner, setInner] = React.useState<number | null>(defaultValue)
  const n = value !== undefined ? value : inner

  return (
    <div data-slot="currency-input" className={cn("relative", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
      >
        Rp
      </span>
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={show(n)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "")
          const next = digits === "" ? null : Math.min(Number(digits), Number.MAX_SAFE_INTEGER)
          setInner(next)
          onValueChange?.(next)
        }}
        className={cn(inputVariants({ size }), "ps-9 text-right tabular-nums")}
      />
      {name && <input type="hidden" name={name} value={n ?? ""} />}
    </div>
  )
}

export { CurrencyInput }
export type { CurrencyInputProps }
