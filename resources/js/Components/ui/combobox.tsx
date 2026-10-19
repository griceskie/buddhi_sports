import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { cn } from "cn"
import { Check, ChevronDown, X } from "lucide-react"

/**
 * Searchable select for long lists (Penyewa, Lapangan, Booking in the Master forms).
 * Pass `items` and render `<ComboboxList>{(item) => <ComboboxItem value={item}>…</ComboboxItem>}</ComboboxList>`.
 */
const Combobox = ComboboxPrimitive.Root

function ComboboxInput({
  className,
  showClear = true,
  ...props
}: ComboboxPrimitive.Input.Props & { showClear?: boolean }) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn(
        "group/combobox relative flex h-8 w-full items-center rounded-lg border border-input bg-background transition-colors has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-disabled:pointer-events-none has-disabled:opacity-50",
        className
      )}
    >
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className="h-full min-w-0 flex-1 bg-transparent ps-3 text-sm outline-none placeholder:text-muted-foreground"
        {...props}
      />
      <div className="flex items-center pe-1 text-muted-foreground [&_svg]:size-4">
        {showClear && (
          <ComboboxPrimitive.Clear
            aria-label="Hapus pilihan"
            className="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
          >
            <X />
          </ComboboxPrimitive.Clear>
        )}
        <ComboboxPrimitive.Trigger
          aria-label="Buka daftar"
          className="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="transition-transform group-has-data-[popup-open]/combobox:rotate-180" />
        </ComboboxPrimitive.Trigger>
      </div>
    </ComboboxPrimitive.InputGroup>
  )
}

function ComboboxContent({ className, children, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "max-h-[min(var(--available-height),20rem)] w-(--anchor-width) min-w-48 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList(props: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" {...props} />
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 ps-8 pe-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className
      )}
      {...props}
    >
      <ComboboxPrimitive.ItemIndicator className="absolute left-2 flex size-3.5 items-center justify-center">
        <Check className="size-4" />
      </ComboboxPrimitive.ItemIndicator>
      {children}
    </ComboboxPrimitive.Item>
  )
}

function ComboboxEmpty({ className, children = "Tidak ditemukan.", ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn("px-2 py-4 text-center text-sm text-muted-foreground empty:hidden empty:p-0", className)}
      {...props}
    >
      {children}
    </ComboboxPrimitive.Empty>
  )
}

export { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty }
