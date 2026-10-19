import * as React from "react"
import { Link, usePage } from "@inertiajs/react"
import { cn } from "cn"
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react"
import { buttonVariants } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

type NavItem = { href: string; label: string }

/** The product name set in type — the repository has no Buddhi Sports logo. */
function Wordmark({ className }: { className?: string }) {
  return (
    <span data-slot="wordmark" className={cn("shrink-0 font-semibold text-foreground", className)}>
      Buddhi Sports
    </span>
  )
}

function PageHeader({ children }: { children: React.ReactNode }) {
  return (
    <header data-slot="page-header" className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </header>
  )
}

const navLink = (active: boolean) =>
  cn(
    "shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
  )

/* -------------------------------------------------------------------------- */
/*  AdminLayout — remake of Layouts/AdminLayout.tsx                           */
/* -------------------------------------------------------------------------- */

const adminNav: NavItem[] = [
  { href: "/tampilpenyewa", label: "Penyewa" },
  { href: "/tampiladmin", label: "Admin" },
  { href: "/tampilmanager", label: "Manager" },
  { href: "/tampillapangan", label: "Lapangan" },
  { href: "/tampilbooking", label: "Booking" },
  { href: "/tampilpembayaran", label: "Pembayaran" },
  { href: "/tampillaporanpembayaran", label: "Laporan Pembayaran" },
]

function AdminLayout({
  header,
  children,
  navItems = adminNav,
  logoutHref = "/logout-pengelola",
}: {
  header?: React.ReactNode
  children?: React.ReactNode
  navItems?: NavItem[]
  logoutHref?: string
}) {
  const { url } = usePage()
  return (
    <div data-slot="admin-layout" className="min-h-screen bg-backgrounds-grouped-primary">
      <nav className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
              <Wordmark className="me-2" />
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={navLink(url.startsWith(item.href))}>
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href={logoutHref}
              method="post"
              as="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              <LogOut />
              Log Out
            </Link>
          </div>
        </div>
      </nav>
      {header && <PageHeader>{header}</PageHeader>}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  AuthenticatedLayout — remake of Layouts/AuthenticatedLayout.tsx           */
/* -------------------------------------------------------------------------- */

function AuthenticatedLayout({
  header,
  children,
  navItems = [{ href: "/dashboard", label: "Dashboard" }],
  profileHref = "/profile",
  logoutHref = "/logout",
}: {
  header?: React.ReactNode
  children?: React.ReactNode
  navItems?: NavItem[]
  profileHref?: string
  logoutHref?: string
}) {
  const page = usePage()
  // Guests have no user even though PageProps types it as always present.
  const user = page.props.auth?.user
  const [open, setOpen] = React.useState(false)

  return (
    <div data-slot="authenticated-layout" className="min-h-screen bg-backgrounds-grouped-primary">
      <nav className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <Wordmark />
              </Link>
              <div className="hidden items-center gap-1 sm:flex">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className={navLink(page.url.startsWith(item.href))}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger className={buttonVariants({ variant: "ghost" })}>
                  {user?.namaPenyewa ?? "Akun"}
                  <ChevronDown className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {user?.email && <DropdownMenuLabel>{user.email}</DropdownMenuLabel>}
                  <DropdownMenuItem render={<Link href={profileHref} />}>
                    <User />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href={logoutHref} method="post" as="button" />}>
                    <LogOut />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <button
              type="button"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "sm:hidden")}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t sm:hidden">
            <div className="space-y-1 p-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn(navLink(page.url.startsWith(item.href)), "block text-base")}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t p-2">
              <div className="px-2.5 py-2">
                <div className="text-base font-medium">{user?.namaPenyewa}</div>
                {user?.email && <div className="text-sm text-muted-foreground">{user.email}</div>}
              </div>
              <Link href={profileHref} className={cn(navLink(false), "block text-base")}>
                Profile
              </Link>
              <Link href={logoutHref} method="post" as="button" className={cn(navLink(false), "block w-full text-start text-base")}>
                Log Out
              </Link>
            </div>
          </div>
        )}
      </nav>
      {header && <PageHeader>{header}</PageHeader>}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  GuestLayout — remake of Layouts/GuestLayout.tsx                           */
/* -------------------------------------------------------------------------- */

function GuestLayout({
  title,
  description,
  children,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="guest-layout"
      className="flex min-h-screen flex-col items-center bg-backgrounds-grouped-primary px-4 pt-6 sm:justify-center sm:pt-0"
    >
      <Link href="/">
        <Wordmark className="text-xl" />
      </Link>
      <div className="mt-6 w-full rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:max-w-md">
        {(title || description) && (
          <div className="mb-6 space-y-1.5">
            {title && <h1 className="text-lg leading-none font-semibold">{title}</h1>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export { AdminLayout, AuthenticatedLayout, GuestLayout, PageHeader, Wordmark }
export type { NavItem }
