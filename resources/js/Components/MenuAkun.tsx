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
import { Link, usePage } from '@inertiajs/react';
import { cn } from 'cn';
import { CalendarDays, ChevronDown, CircleUser, LogOut, Menu, User } from 'lucide-react';

/** Inisial dari dua kata pertama nama (seperti avatar di Profile). */
const inisial = (nama: string) =>
    nama
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((k) => k[0]?.toUpperCase() ?? '')
        .join('');

/**
 * Menu akun penyewa: Booking saya (dengan jumlah perlu tindakan), Profile, Log Out.
 * `nama`: tombol nama + chevron (ikon orang di HP). `avatar`: avatar inisial ke Profile + tombol menu bulat (Home).
 */
export default function MenuAkun({ tampilan = 'nama' }: { tampilan?: 'nama' | 'avatar' }) {
    const { auth, perluTindakan } = usePage().props;
    const user = auth.user;
    const label = perluTindakan > 0 ? `Menu akun, ${perluTindakan} booking perlu tindakan` : 'Menu akun';

    const menu = (
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
                <DropdownMenuLabel>
                    {tampilan === 'avatar' && <span className="block font-semibold text-foreground">{user.namaPenyewa}</span>}
                    {user.email}
                </DropdownMenuLabel>
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
                <DropdownMenuItem render={<Link href={route('logout')} method="post" as="button" />}>
                    <LogOut />
                    Log Out
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    );

    if (tampilan === 'avatar') {
        return (
            <div className="flex items-center gap-1">
                <Link
                    href={route('profile.edit')}
                    aria-label="Profile"
                    className="flex size-11 items-center justify-center rounded-full outline-none transition-shadow hover:shadow-[0_2px_6px_rgb(0_0_0/0.14)] focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-[13px] font-semibold tracking-[0.3px] text-primary-foreground">
                        {inisial(user.namaPenyewa)}
                    </span>
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        aria-label={label}
                        className="relative flex size-11 cursor-pointer items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,var(--background))] outline-none transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                        <Menu className="size-[18px]" strokeWidth={2.25} aria-hidden="true" />
                        {perluTindakan > 0 && (
                            <span
                                aria-hidden="true"
                                className="absolute top-1.5 right-1.5 size-2.5 rounded-full border-2 border-background bg-destructive"
                            />
                        )}
                    </DropdownMenuTrigger>
                    {menu}
                </DropdownMenu>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={label}
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
            {menu}
        </DropdownMenu>
    );
}
