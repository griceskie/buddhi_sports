import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"
import { X } from "lucide-react"
import { buttonVariants } from "./button"

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

const sideClasses = {
  right:
    "inset-y-0 right-0 h-full w-full border-l sm:max-w-md data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
  left: "inset-y-0 left-0 h-full w-full border-r sm:max-w-md data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full",
  top: "inset-x-0 top-0 h-auto border-b data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full",
  bottom:
    "inset-x-0 bottom-0 h-auto border-t data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & { side?: keyof typeof sideClasses; showCloseButton?: boolean }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 supports-backdrop-filter:backdrop-blur-xs data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background text-foreground shadow-xl outline-none transition-transform duration-300 ease-out",
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            aria-label="Tutup"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "absolute top-3 right-3 text-muted-foreground")}
          >
            <X />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1 border-b p-4 pe-14", className)} {...props} />
}

function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-body" className={cn("min-h-0 flex-1 overflow-y-auto px-4", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end", className)} {...props} />
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-base font-semibold text-foreground", className)} {...props} />
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription }
