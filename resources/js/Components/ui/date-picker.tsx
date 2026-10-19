import * as React from "react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "cn"
import { CalendarIcon } from "lucide-react"
import { buttonVariants } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

type DatePickerProps = {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  /** Dates that can't be picked, e.g. `{ before: new Date() }` for past days. */
  disabled?: React.ComponentProps<typeof Calendar>["disabled"]
  defaultOpen?: boolean
  id?: string
  name?: string
  "aria-invalid"?: boolean
  className?: string
}

function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  defaultOpen,
  id,
  name,
  className,
  ...rest
}: DatePickerProps) {
  const [inner, setInner] = React.useState<Date | undefined>(defaultValue)
  const [open, setOpen] = React.useState(!!defaultOpen)
  const date = value !== undefined ? value : inner
  const pick = (d: Date | undefined) => {
    setInner(d)
    onChange?.(d)
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        data-slot="date-picker-trigger"
        aria-invalid={rest["aria-invalid"]}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start px-3 text-left font-normal data-[popup-open]:border-ring data-[popup-open]:ring-3 data-[popup-open]:ring-ring/50",
          !date && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="text-muted-foreground" />
        {date ? format(date, "EEEE, d MMMM yyyy", { locale: localeId }) : placeholder}
      </PopoverTrigger>
      {name && <input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} />}
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={pick} disabled={disabled} defaultMonth={date} />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
export type { DatePickerProps }
