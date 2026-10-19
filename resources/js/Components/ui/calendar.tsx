import * as React from "react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { id as localeId } from "date-fns/locale"
import { cn } from "cn"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { buttonVariants } from "./button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = localeId,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames()
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      data-slot="calendar"
      className={cn("w-fit bg-background p-3 [--cell-size:--spacing(8)]", className)}
      classNames={{
        root: cn("w-fit", d.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", d.months),
        month: cn("flex w-full flex-col gap-4", d.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", d.nav),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          d.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          d.button_next
        ),
        month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", d.month_caption),
        caption_label: cn("text-sm font-medium capitalize select-none", d.caption_label),
        month_grid: "w-full border-collapse",
        weekdays: cn("flex", d.weekdays),
        weekday: cn("flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground capitalize select-none", d.weekday),
        week: cn("mt-2 flex w-full", d.week),
        day: cn("group/day relative aspect-square h-full w-full p-0 text-center select-none", d.day),
        today: cn("rounded-md bg-accent text-accent-foreground data-[selected=true]:rounded-none", d.today),
        outside: cn("text-muted-foreground aria-selected:text-muted-foreground", d.outside),
        disabled: cn("text-muted-foreground opacity-50", d.disabled),
        hidden: cn("invisible", d.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...p }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...p} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...p} />
          ),
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString("id-ID")}
      data-selected-single={modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal data-[range-end=true]:rounded-md data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:rounded-md data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
