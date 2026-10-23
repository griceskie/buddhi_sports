import { buttonVariants } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-canvas">
            <nav className="border-b bg-background">
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
                                <DropdownMenuContent className="w-56 p-0">
                                    <DropdownMenuLabel className="border-b px-3 py-2">
                                        {user.email}
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        className="rounded-none px-3 py-2"
                                        render={<Link href={route('booking')} />}
                                    >
                                        <CalendarDays />
                                        Booking saya
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="rounded-none px-3 py-2"
                                        render={<Link href={route('profile.edit')} />}
                                    >
                                        <User />
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        className="rounded-none px-3 py-2"
                                        render={
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                            />
                                        }
                                    >
                                        <LogOut className="text-destructive" />
                                        Log Out
                                    </DropdownMenuItem>
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
                                    'block w-full text-start text-base text-destructive hover:text-destructive',
                                )}
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                )}
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
