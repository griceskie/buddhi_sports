import * as React from "react"
import { Link } from "@inertiajs/react"
import { cn } from "cn"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { buttonVariants } from "./button"

function Pagination({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      role="navigation"
      aria-label="Halaman"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />
}

function PaginationItem(props: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  href?: string | null
  isActive?: boolean
  size?: "icon" | "default"
  className?: string
  children?: React.ReactNode
  "aria-label"?: string
}

/** An Inertia Link styled as a button; renders a disabled span when `href` is null. */
function PaginationLink({ href, isActive, size = "icon", className, children, ...props }: PaginationLinkProps) {
  const cls = cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size }), className)
  if (!href)
    return (
      <span aria-disabled="true" data-slot="pagination-link" className={cn(cls, "pointer-events-none opacity-50")} {...props}>
        {children}
      </span>
    )
  return (
    <Link
      href={href}
      preserveScroll
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive || undefined}
      className={cls}
      {...props}
    >
      {children}
    </Link>
  )
}

function PaginationPrevious({ href, className }: { href?: string | null; className?: string }) {
  return (
    <PaginationLink href={href} size="default" aria-label="Halaman sebelumnya" className={cn("ps-1.5", className)}>
      <ChevronLeft />
      <span className="hidden sm:block">Sebelumnya</span>
    </PaginationLink>
  )
}

function PaginationNext({ href, className }: { href?: string | null; className?: string }) {
  return (
    <PaginationLink href={href} size="default" aria-label="Halaman berikutnya" className={cn("pe-1.5", className)}>
      <span className="hidden sm:block">Berikutnya</span>
      <ChevronRight />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" data-slot="pagination-ellipsis" className={cn("flex size-8 items-center justify-center [&_svg]:size-4", className)}>
      <MoreHorizontal />
    </span>
  )
}

type LaravelLink = { url: string | null; label: string; active: boolean }

/**
 * Renders the `links` array of a Laravel paginator (`DB::table(...)->paginate(10)`) as-is:
 * the first entry is Previous, the last is Next, "..." becomes an ellipsis.
 */
function LaravelPagination({ links, className }: { links: LaravelLink[]; className?: string }) {
  if (links.length <= 3) return null
  const prev = links[0]
  const next = links[links.length - 1]
  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={prev.url} />
        </PaginationItem>
        {links.slice(1, -1).map((l, i) => (
          <PaginationItem key={i}>
            {l.label === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={l.url} isActive={l.active}>
                {l.label}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href={next.url} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  LaravelPagination,
}
export type { LaravelLink }
