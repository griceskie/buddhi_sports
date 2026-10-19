import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const toggleVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none select-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-miscellaneous-segmented-control-selected data-[pressed]:text-foreground data-[pressed]:shadow-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        sm: "h-6 px-2 text-xs",
        default: "h-7 px-2.5",
        lg: "h-8 px-3",
      },
    },
    defaultVariants: { size: "default" },
  }
)

type ToggleSize = VariantProps<typeof toggleVariants>["size"]
const ToggleGroupContext = React.createContext<{ size: ToggleSize }>({ size: "default" })

/** Segmented control, e.g. the Bulutangkis / Basket filter. Single-select unless `multiple`. */
function ToggleGroup({
  className,
  size = "default",
  children,
  ...props
}: ToggleGroupPrimitive.Props & { size?: ToggleSize }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "inline-flex w-fit items-center gap-0.5 rounded-lg bg-fills-tertiary p-[3px] text-muted-foreground",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props) {
  const { size } = React.useContext(ToggleGroupContext)
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ size }), className)}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem, toggleVariants }
