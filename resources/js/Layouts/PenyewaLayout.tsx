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
import { navLinkClass } from '@/Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import { cn } from 'cn';
import { CalendarDays, ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function PenyewaLayout({
    header,
    band,
    children,
}: PropsWithChildren<{
    header?: ReactNode;
    /** Blok putih menyambung di bawah navigasi (judul, tab, pilihan tanggal); dipakai halaman Home. */
    band?: ReactNode;
}>) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-canvas">
            <nav className={cn('bg-background', !band && 'border-b')}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link href={route('dashboard')}>
                                <Wordmark />
                            </Link>
                        </div>

                        <div className="hidden sm:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={buttonVariants({ variant: 'ghost' })}
                                >
                                    {user.namaPenyewa}
                                    <ChevronDown className="text-muted-foreground" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                                        <DropdownMenuItem render={<Link href={route('booking')} />}>
                                            <CalendarDays />
                                            Booking saya
                                        </DropdownMenuItem>
                                        <DropdownMenuItem render={<Link href={route('profile.edit')} />}>
                                            <User />
                                            Profile
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem
                                            render={<Link href={route('logout')} method="post" as="button" />}
                                        >
                                            <LogOut />
                                            Log Out
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <button
                            type="button"
                            aria-label={
                                showingNavigationDropdown ? 'Tutup menu' : 'Buka menu'
                            }
                            aria-expanded={showingNavigationDropdown}
                            onClick={() =>
                                setShowingNavigationDropdown(
                                    (previousState) => !previousState,
                                )
                            }
                            className={cn(
                                buttonVariants({ variant: 'ghost', size: 'icon' }),
                                'sm:hidden',
                            )}
                        >
                            {showingNavigationDropdown ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {showingNavigationDropdown && (
                    <div className="border-t sm:hidden">
                        <div className="p-2">
                            <div className="px-2.5 py-2">
                                <div className="text-base font-medium">
                                    {user.namaPenyewa}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {user.email}
                                </div>
                            </div>
                            <Link
                                href={route('booking')}
                                className={cn(navLinkClass(false), 'block text-base')}
                            >
                                Booking saya
                            </Link>
                            <Link
                                href={route('profile.edit')}
                                className={cn(navLinkClass(false), 'block text-base')}
                            >
                                Profile
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className={cn(
                                    navLinkClass(false),
                                    'mt-2 block w-full border-t text-start text-base',
                                )}
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {band && (
                <div className="relative border-b bg-background shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 sm:px-6 lg:px-8">{band}</div>
                </div>
            )}

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
