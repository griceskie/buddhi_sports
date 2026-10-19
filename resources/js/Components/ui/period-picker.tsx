import * as React from "react"
import { cn } from "cn"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { BULAN } from "./format"

type Period = { bulan: number; tahun: number }

type PeriodPickerProps = {
  /** laporan_pembayarans.bulan (1–12) and .tahun */
  value?: Period
  defaultValue?: Period
  onValueChange?: (value: Period) => void
  /** Years to offer, newest first. Defaults to this year and the two before. */
  years?: number[]
  disabled?: boolean
  className?: string
}

function PeriodPicker({ value, defaultValue, onValueChange, years, disabled, className }: PeriodPickerProps) {
  const now = new Date()
  const [inner, setInner] = React.useState<Period>(
    defaultValue ?? { bulan: now.getMonth() + 1, tahun: now.getFullYear() }
  )
  const v = value ?? inner
  const ys = years ?? [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]
  const set = (next: Period) => {
    setInner(next)
    onValueChange?.(next)
  }
  const monthItems = Object.fromEntries(BULAN.map((b, i) => [String(i + 1), b]))
  const yearItems = Object.fromEntries(ys.map((y) => [String(y), String(y)]))

  return (
    <div data-slot="period-picker" role="group" aria-label="Periode" className={cn("flex gap-2", className)}>
      <Select
        items={monthItems}
        value={String(v.bulan)}
        onValueChange={(m) => m && set({ ...v, bulan: Number(m) })}
        disabled={disabled}
      >
        <SelectTrigger aria-label="Bulan" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BULAN.map((b, i) => (
            <SelectItem key={b} value={String(i + 1)}>
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={yearItems}
        value={String(v.tahun)}
        onValueChange={(y) => y && set({ ...v, tahun: Number(y) })}
        disabled={disabled}
      >
        <SelectTrigger aria-label="Tahun" className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ys.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { PeriodPicker }
export type { PeriodPickerProps, Period }
