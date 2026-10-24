import { buttonVariants } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import Wordmark from '@/Components/Wordmark';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { cn } from 'cn';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

type NavItem = { href: string; label: string };

const adminNav: NavItem[] = [
    { href: '/tampilpenyewa', label: 'Penyewa' },
    { href: '/tampillapangan', label: 'Lapangan' },
    { href: '/tampilbooking', label: 'Booking' },
    { href: '/tampilpembayaran', label: 'Pembayaran' },
    { href: '/tampillaporanpembayaran', label: 'Laporan Pembayaran' },
];

export const navLinkClass = (active: boolean) =>
    cn(
        'shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground',
    );

export default function AdminLayout({
    header,
    children,
    navItems,
}: PropsWithChildren<{ header?: ReactNode; navItems?: NavItem[] }>) {
    const { url, props } = usePage<PageProps>();
    const pengelola = props.pengelola;
    const items = navItems ?? (pengelola?.role === 'admin' ? adminNav : []);
    const dashboardRoute =
        pengelola?.role === 'manager' ? 'dashboard.manager' : 'dashboard.admin';

    return (
        <div className="min-h-screen bg-canvas">
            <nav className="border-b bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                            <Link href={route(dashboardRoute)} className="me-4 shrink-0">
                                <Wordmark />
                            </Link>
                            {items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={navLinkClass(url.startsWith(item.href))}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(buttonVariants({ variant: 'ghost' }), 'shrink-0')}
                            >
                                {pengelola?.nama}
                                <ChevronDown className="text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>
                                        {pengelola?.username} ·{' '}
                                        {pengelola?.role === 'admin' ? 'Admin' : 'Manager'}
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem render={<Link href={route('profile.pengelola')} />}>
                                        <User />
                                        Profile
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        render={<Link href={route('logout.pengelola')} method="post" as="button" />}
                                    >
                                        <LogOut />
                                        Log Out
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b bg-background">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
