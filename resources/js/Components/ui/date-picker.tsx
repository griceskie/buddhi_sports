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
  /** Replaces the date text on the trigger, e.g. a short caption. */
  label?: React.ReactNode
  /** Where the popover sits relative to the trigger; use "end" for a trigger at the right edge. */
  align?: "start" | "center" | "end"
  /** Extra Calendar options, e.g. two months or day markers. */
  calendarProps?: Pick<
    React.ComponentProps<typeof Calendar>,
    "numberOfMonths" | "startMonth" | "endMonth" | "modifiers" | "modifiersClassNames"
  >
  /** Content under the calendar. `pick` selects a date and closes the popover. */
  footer?: (pick: (date: Date | undefined) => void) => React.ReactNode
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
  label,
  align = "start",
  calendarProps,
  footer,
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
        {label ?? (date ? format(date, "EEEE, d MMMM yyyy", { locale: localeId }) : placeholder)}
      </PopoverTrigger>
      {name && <input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} />}
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={pick}
          disabled={disabled}
          defaultMonth={date}
          {...calendarProps}
        />
        {footer?.(pick)}
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
export type { DatePickerProps }
