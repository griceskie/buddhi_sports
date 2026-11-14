import { useModeGelap } from '@/Components/pengelola/tema';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Switch } from '@/Components/ui/switch';
import { Pengelola } from '@/types';
import { Link } from '@inertiajs/react';
import { ComponentProps } from 'react';
import { ChevronDown, History, LogOut, Moon, User } from 'lucide-react';

export function inisial(nama: string) {
    return nama
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((k) => k[0]!.toUpperCase())
        .join('');
}

function Avatar({ nama, besar = false }: { nama: string; besar?: boolean }) {
    return (
        <span
            aria-hidden
            className={`flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ${besar ? 'size-8 text-xs' : 'size-7 text-[11px]'}`}
        >
            {inisial(nama)}
        </span>
    );
}

/** Isi menu akun pengelola (profil, log aktivitas, mode gelap, keluar); dipakai di header dan di sidebar bawah. */
export function IsiMenuAkunPengelola({ pengelola, ...props }: { pengelola: Pengelola } & ComponentProps<typeof DropdownMenuContent>) {
    const [gelap, setGelap] = useModeGelap();

    return (
        <DropdownMenuContent className="min-w-60" {...props}>
            <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-2 py-2 font-normal">
                    <Avatar nama={pengelola.nama} besar />
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">{pengelola.nama}</span>
                        <span className="truncate text-sm text-muted-foreground">
                            {pengelola.role === 'admin' ? 'Admin' : 'Manager'} · {pengelola.username}
                        </span>
                    </span>
                </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href={route('profile.pengelola')} />}>
                    <User />
                    Profil pengelola
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href={route('log.aktivitas')} />}>
                    <History />
                    Log aktivitas
                </DropdownMenuItem>
                <DropdownMenuItem closeOnClick={false} onClick={() => setGelap(!gelap)} className="justify-between">
                    <span className="flex items-center gap-2">
                        <Moon />
                        Mode gelap
                    </span>
                    <Switch size="sm" checked={gelap} tabIndex={-1} aria-hidden className="pointer-events-none" />
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href={route('logout.pengelola')} method="post" as="button" className="w-full" />}>
                    <LogOut />
                    Keluar
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    );
}

/** Menu akun di header pengelola. */
export default function MenuAkunPengelola({ pengelola }: { pengelola: Pengelola }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Menu akun"
                className="flex h-9 items-center gap-1.5 rounded-full py-0.5 pr-1.5 pl-0.5 text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 data-popup-open:bg-muted"
            >
                <Avatar nama={pengelola.nama} />
                <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <IsiMenuAkunPengelola pengelola={pengelola} align="end" sideOffset={6} />
        </DropdownMenu>
    );
}
