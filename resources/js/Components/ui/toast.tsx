import * as React from "react"
import { Toast } from "@base-ui/react/toast"
import { cn } from "cn"
import { CircleAlert, CircleCheck, X } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Toast – short notices that slide up from the bottom and close themselves  */
/* -------------------------------------------------------------------------- */

const toastManager = Toast.createToastManager()

type ToastType = "success" | "error"

/** Call from anywhere, e.g. `toast.success("Admin ditambahkan.")`. */
const toast = {
  success: (title: React.ReactNode, description?: React.ReactNode) =>
    toastManager.add({ title, description, type: "success" }),
  error: (title: React.ReactNode, description?: React.ReactNode) =>
    // errors stay a little longer so they can be read
    toastManager.add({ title, description, type: "error", timeout: 7000, priority: "high" }),
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CircleCheck className="text-success" />,
  error: <CircleAlert className="text-destructive" />,
}

function ToastList() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      swipeDirection={["right", "down"]}
      data-slot="toast"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg",
        "[transform:translate(var(--toast-swipe-movement-x),var(--toast-swipe-movement-y))] transition-[opacity,transform] duration-300 ease-out",
        "data-[starting-style]:translate-y-full data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        "data-[ending-style]:data-[swipe-direction=right]:translate-x-full data-[ending-style]:data-[swipe-direction=down]:translate-y-full",
        "[&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0"
      )}
    >
      {icons[t.type as ToastType]}
      <div className="grid flex-1 gap-1">
        <Toast.Title className="font-medium" />
        <Toast.Description className="text-muted-foreground" />
      </div>
      <Toast.Close
        aria-label="Tutup"
        className="-m-1 rounded-sm p-1 text-muted-foreground opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
      >
        <X />
      </Toast.Close>
    </Toast.Root>
  ))
}

/** Mount once at the app root. Toasts stack at the bottom: full width on phones, bottom-right on larger screens. */
function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager} timeout={4500} limit={3}>
      <Toast.Portal>
        <Toast.Viewport
          data-slot="toaster"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col-reverse gap-2 outline-none sm:left-auto sm:w-96"
        >
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

export { Toaster, toast }
