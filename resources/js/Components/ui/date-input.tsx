import * as React from "react"
import { cn } from "cn"
import { CalendarIcon } from "lucide-react"
import { Button, buttonVariants } from "./button"
import { Calendar } from "./calendar"
import { Input } from "./input"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

/* -------------------------------------------------------------------------- */
/*  Typed date field: "8 6" becomes 08/06/<this year>                         */
/* -------------------------------------------------------------------------- */

/** One part of the text, e.g. the day. A first digit above `padAbove` cannot start a 2-digit value, so it is padded ("8" -> "08"). */
type Part = { length: number; padAbove: number }

/** Splits typed text into parts. Digits fill the current part; a separator (space / . - :) closes a 1-digit part. */
function split(input: string, parts: Part[]): string[] {
  const out = parts.map(() => "")
  let k = 0
  for (const c of input) {
    if (k >= parts.length) break
    const p = parts[k]
    if (c >= "0" && c <= "9") {
      out[k] += c
      if (out[k].length === 1 && Number(c) > p.padAbove) {
        out[k] = "0" + c
        k++
      } else if (out[k].length === p.length) k++
    } else if (out[k] !== "" && p.length === 2) {
      out[k] = out[k].padStart(2, "0")
      k++
    }
  }
  return out
}

/** Joins parts with `sep`. With `trailing`, a finished part is followed by the separator so the next part can be typed. */
function join(values: string[], parts: Part[], sep: string, trailing: boolean) {
  let text = values[0]
  for (let j = 1; j < values.length; j++) {
    const prevDone = values[j - 1].length === parts[j - 1].length
    if (values[j] !== "" || (trailing && prevDone)) text += sep + values[j]
    else break
  }
  return text
}

type SegmentedProps = {
  id?: string
  className?: string
  value: string
  onValueChange: (value: string) => void
  "aria-invalid"?: boolean
  parts: Part[]
  sep: string
  placeholder: string
  /** Parts to show right after a keystroke, e.g. this year once day and month are typed; null keeps them. */
  autofill: (v: string[]) => string[] | null
  /** Parts to keep when the field loses focus, e.g. pad "8" to "08". */
  complete: (v: string[]) => string[]
  /** The form value for these parts, or null while incomplete or invalid. */
  toValue: (v: string[]) => string | null
  fromValue: (value: string) => string[]
  icon: React.ReactNode
  iconLabel: string
  popup: (close: () => void) => React.ReactNode
  popupClassName?: string
}

function SegmentedInput({
  id,
  className,
  value,
  onValueChange,
  parts,
  sep,
  placeholder,
  autofill,
  complete,
  toValue,
  fromValue,
  icon,
  iconLabel,
  popup,
  popupClassName,
  ...rest
}: SegmentedProps) {
  const ref = React.useRef<HTMLInputElement>(null)
  const select = React.useRef<[number, number] | null>(null)
  const [text, setText] = React.useState(() => (value ? join(fromValue(value), parts, sep, false) : ""))
  const [open, setOpen] = React.useState(false)

  // A value set from outside (Edit sheet, picker, form reset) replaces the text in the same render.
  // Not in an effect: a blur fired in between would read the old text and clear the new value.
  const [synced, setSynced] = React.useState(value)
  if (value !== synced) {
    setSynced(value)
    const current = toValue(split(text, parts))
    if (value && value !== current) setText(join(fromValue(value), parts, sep, false))
    if (!value && current) setText("")
  }

  // autofilled part stays selected, so typing replaces it
  React.useLayoutEffect(() => {
    if (select.current && ref.current === document.activeElement) ref.current?.setSelectionRange(...select.current)
    select.current = null
  })

  const apply = (values: string[], trailing: boolean) => {
    setText(join(values, parts, sep, trailing))
    const next = toValue(values) ?? ""
    if (next !== value) onValueChange(next)
  }

  const full = (values: string[]) => values.every((v, j) => v.length === parts[j].length)
  const invalid = rest["aria-invalid"] || (full(split(text, parts)) && !toValue(split(text, parts)))

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={ref}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        aria-invalid={invalid || undefined}
        className="pe-11"
        onChange={(e) => {
          const typed = e.target.value
          const deleting = typed.length < text.length
          let values = split(typed, parts)
          const auto = deleting ? null : autofill(values)
          if (auto) {
            select.current = [join(values, parts, sep, true).length, join(auto, parts, sep, false).length]
            values = auto
          }
          apply(values, !deleting)
        }}
        onBlur={() => apply(complete(split(text, parts)), false)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={iconLabel}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
          )}
        >
          {icon}
        </PopoverTrigger>
        <PopoverContent align="end" className={cn("w-auto p-0", popupClassName)}>
          {popup(() => setOpen(false))}
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  DateInput – value "YYYY-MM-DD", shown and typed as dd/mm/yyyy             */
/* -------------------------------------------------------------------------- */

const DATE_PARTS: Part[] = [
  { length: 2, padAbove: 3 },
  { length: 2, padAbove: 1 },
  { length: 4, padAbove: 9 },
]

const thisYear = () => String(new Date().getFullYear())
const pad2 = (v: string) => (v.length === 1 ? "0" + v : v)

function dateValue([d, m, y]: string[]) {
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return null
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  const real = date.getFullYear() === Number(y) && date.getMonth() === Number(m) - 1 && date.getDate() === Number(d)
  return real ? `${y}-${m}-${d}` : null
}

type DateInputProps = {
  id?: string
  className?: string
  /** "YYYY-MM-DD" or "" */
  value: string
  onValueChange: (value: string) => void
  "aria-invalid"?: boolean
}

/** Date field you can type into ("8 6" -> 08/06/this year) or pick from the calendar on the right. */
function DateInput(props: DateInputProps) {
  const selected = props.value ? new Date(`${props.value}T00:00:00`) : undefined
  return (
    <SegmentedInput
      {...props}
      parts={DATE_PARTS}
      sep="/"
      placeholder="dd/mm/yyyy"
      autofill={([d, m, y]) => (d.length === 2 && m.length === 2 && y === "" ? [d, m, thisYear()] : null)}
      complete={([d, m, y]) => {
        if (!d || !m) return [d, m, y]
        if (y === "") y = thisYear()
        else if (y.length === 2) y = "20" + y
        return [pad2(d), pad2(m), y]
      }}
      toValue={dateValue}
      fromValue={(v) => {
        const [y, m, d] = v.split("-")
        return [d ?? "", m ?? "", y ?? ""]
      }}
      icon={<CalendarIcon />}
      iconLabel="Buka kalender"
      popup={(close) => {
        const pick = (d: Date) => {
          props.onValueChange(`${d.getFullYear()}-${pad2(String(d.getMonth() + 1))}-${pad2(String(d.getDate()))}`)
          close()
        }
        return (
          <>
            <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={(d) => d && pick(d)} />
            <div className="flex justify-end border-t px-4 py-2">
              <Button type="button" variant="link" size="sm" onClick={() => pick(new Date())}>
                Hari ini
              </Button>
            </div>
          </>
        )
      }}
    />
  )
}

export { DateInput }
export type { DateInputProps }
