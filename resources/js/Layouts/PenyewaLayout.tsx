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
import { Link, usePage } from '@inertiajs/react';
import { cn } from 'cn';
import { CalendarDays, ChevronDown, CircleUser, LogOut, User } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

export default function PenyewaLayout({
    header,
    band,
    navTengah,
    children,
}: PropsWithChildren<{
    header?: ReactNode;
    /** Blok putih di bawah navigasi (judul, foto, pilih lapangan); dipakai halaman Home. */
    band?: ReactNode;
    /** Isi di tengah nav, mis. status buka GOR di Home. */
    navTengah?: ReactNode;
}>) {
    const { auth, perluTindakan } = usePage().props;
    const user = auth.user;

    return (
        <div className="min-h-screen bg-canvas">
            <nav className="sticky top-0 z-30 border-b bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="relative flex h-16 items-center justify-between gap-3">
                        <div className="flex items-center gap-6">
                            <Link href={route('dashboard')} className="shrink-0">
                                <Wordmark className="whitespace-nowrap" />
                            </Link>
                        </div>

                        {navTengah && (
                            <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2">{navTengah}</div>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                aria-label={perluTindakan > 0 ? `Menu akun, ${perluTindakan} booking perlu tindakan` : 'Menu akun'}
                                className={cn(buttonVariants({ variant: 'ghost' }), 'relative max-sm:size-10 max-sm:px-0')}
                            >
                                {perluTindakan > 0 && (
                                    <span
                                        aria-hidden="true"
                                        className="size-2 rounded-full bg-destructive max-sm:absolute max-sm:top-2 max-sm:right-2"
                                    />
                                )}
                                <CircleUser className="size-5 sm:hidden" aria-hidden="true" />
                                <span className="max-sm:hidden">{user.namaPenyewa}</span>
                                <ChevronDown className="text-muted-foreground max-sm:hidden" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                                    <DropdownMenuItem render={<Link href={route('booking')} />}>
                                        <CalendarDays />
                                        Booking saya
                                        {perluTindakan > 0 && (
                                            <span className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-[5px] text-caption-2 font-bold text-white tabular-nums">
                                                {perluTindakan}
                                            </span>
                                        )}
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
                </div>
            </nav>

            {band && (
                <div className="border-b bg-background">
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
