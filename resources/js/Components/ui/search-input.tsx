import * as React from "react"
import { cn } from "cn"
import { Search, X } from "lucide-react"
import { inputVariants } from "./input"

type SearchInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "value" | "defaultValue" | "onChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  size?: "sm" | "default" | "lg"
}

/** Search box for list pages. Wire `onValueChange` to `router.get(url, { q }, { preserveState: true, replace: true })`. */
function SearchInput({
  value,
  defaultValue = "",
  onValueChange,
  size = "default",
  placeholder = "Cari…",
  className,
  ...props
}: SearchInputProps) {
  const [inner, setInner] = React.useState(defaultValue)
  const v = value !== undefined ? value : inner
  const set = (s: string) => {
    setInner(s)
    onValueChange?.(s)
  }
  return (
    <div data-slot="search-input" className={cn("relative w-full max-w-xs", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={v}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className={cn(inputVariants({ size }), "ps-8 pe-8 [&::-webkit-search-cancel-button]:hidden")}
        {...props}
      />
      {v && (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => set("")}
          className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
        >
          <X />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
export type { SearchInputProps }
