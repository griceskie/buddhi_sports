import * as React from "react"
import { cn } from "cn"
import { FileText, Upload, X } from "lucide-react"
import { buttonVariants } from "./button"

type FileUploadProps = {
  /** The chosen file, e.g. Inertia `data.buktiBayar`. */
  value?: File | null
  onChange?: (file: File | null) => void
  /** Passed to the file input, e.g. "image/*,application/pdf". */
  accept?: string
  label?: React.ReactNode
  /** One line under the label: allowed types and size, as the controller validates them. */
  description?: React.ReactNode
  name?: string
  id?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  className?: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`
}

function FileUpload({
  value,
  onChange,
  accept,
  label = "Unggah bukti pembayaran",
  description,
  name,
  id,
  disabled,
  className,
  ...rest
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [inner, setInner] = React.useState<File | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const file = value !== undefined ? value : inner
  const invalid = rest["aria-invalid"]

  const set = (f: File | null) => {
    setInner(f)
    onChange?.(f)
    if (!f && inputRef.current) inputRef.current.value = ""
  }

  const input = (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="file"
      accept={accept}
      disabled={disabled}
      className="sr-only"
      onChange={(e) => set(e.target.files?.[0] ?? null)}
    />
  )

  if (file) {
    return (
      <div
        data-slot="file-upload"
        data-state="filled"
        className={cn(
          "flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2.5",
          invalid && "border-destructive ring-3 ring-destructive/20",
          className
        )}
      >
        {input}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
          <FileText aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{file.name}</span>
          <span className="block text-xs text-muted-foreground">{formatSize(file.size)}</span>
        </span>
        <button
          type="button"
          aria-label="Hapus file"
          disabled={disabled}
          onClick={() => set(null)}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <X />
        </button>
      </div>
    )
  }

  return (
    <label
      data-slot="file-upload"
      data-state="empty"
      data-dragging={dragging || undefined}
      aria-invalid={invalid}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f && !disabled) set(f)
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-background px-6 py-8 text-center transition-colors hover:bg-muted/50 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 data-[dragging]:border-ring data-[dragging]:bg-muted aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {input}
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
        <Upload aria-hidden="true" />
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">
        Tarik file ke sini atau <span className="font-medium text-foreground underline underline-offset-4">pilih file</span>
      </span>
      {description && <span className="text-xs text-muted-foreground">{description}</span>}
    </label>
  )
}

export { FileUpload }
export type { FileUploadProps }
