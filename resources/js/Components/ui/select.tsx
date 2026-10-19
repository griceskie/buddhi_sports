import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { ChevronDown, Check } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Variants                                                                  */
/* -------------------------------------------------------------------------- */

const selectTriggerVariants = cva(
  "group/trigger inline-flex w-full items-center justify-between rounded-lg border bg-transparent text-sm whitespace-nowrap transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&>span]:line-clamp-1",
  {
    variants: {
      variant: {
        default:
          "border-input bg-background focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:border-ring data-[popup-open]:ring-3 data-[popup-open]:ring-ring/50",
        ghost:
          "border-transparent bg-transparent hover:bg-muted focus-visible:bg-muted focus-visible:ring-0",
      },
      size: {
        sm: "h-7 gap-1 px-2.5 text-xs rounded-md",
        default: "h-10 gap-1.5 px-4 text-base",
        lg: "h-9 gap-2 px-3.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/* -------------------------------------------------------------------------- */
/*  Select (Root)                                                             */
/* -------------------------------------------------------------------------- */

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

/* -------------------------------------------------------------------------- */
/*  SelectTrigger                                                             */
/* -------------------------------------------------------------------------- */

function SelectTrigger({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props &
  VariantProps<typeof selectTriggerVariants>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(selectTriggerVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        data-slot="select-icon"
        className="shrink-0 text-muted-foreground transition-transform group-data-[popup-open]/trigger:rotate-180"
      >
        <ChevronDown className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/* -------------------------------------------------------------------------- */
/*  SelectValue                                                               */
/* -------------------------------------------------------------------------- */

function SelectValue({ ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

/* -------------------------------------------------------------------------- */
/*  SelectPortal + Positioner + Popup (content)                               */
/* -------------------------------------------------------------------------- */

function SelectContent({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner>
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "z-50 max-h-[min(var(--available-height),20rem)] min-w-[max(var(--anchor-width),8rem)] overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity",
            className
          )}
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow className="flex w-full items-center justify-center py-1 text-muted-foreground">
            <ChevronDown className="size-3.5 rotate-180" />
          </SelectPrimitive.ScrollUpArrow>
          {children}
          <SelectPrimitive.ScrollDownArrow className="flex w-full items-center justify-center py-1 text-muted-foreground">
            <ChevronDown className="size-3.5" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

/* -------------------------------------------------------------------------- */
/*  SelectItem                                                                */
/* -------------------------------------------------------------------------- */

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pl-8 pr-2 text-sm outline-none select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2 flex size-3.5 items-center justify-center">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

/* -------------------------------------------------------------------------- */
/*  SelectGroup + GroupLabel + Separator                                       */
/* -------------------------------------------------------------------------- */

function SelectGroup({ ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectGroupLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn(
        "py-1.5 pl-8 pr-2 text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
  selectTriggerVariants,
}
