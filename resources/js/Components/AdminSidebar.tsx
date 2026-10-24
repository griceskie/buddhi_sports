import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from '@/Components/ui/sidebar';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronsUpDown,
    FileText,
    LandPlot,
    LayoutDashboard,
    LogOut,
    LucideIcon,
    Trophy,
    User,
    UserCog,
    Users,
    Wallet,
} from 'lucide-react';
import { ComponentProps } from 'react';

type Menu = { href: string; label: string; icon: LucideIcon };
type Kelompok = { label?: string; menu: Menu[] };

// Data Admin dan Manager sengaja tidak ada: Admin tidak boleh mengelola akun Admin lain maupun Manager.
const MENU_ADMIN: Kelompok[] = [
    { menu: [{ href: '/dashboard-admin', label: 'Dashboard', icon: LayoutDashboard }] },
    {
        label: 'Penyewaan',
        menu: [
            { href: '/tampilpenyewa', label: 'Penyewa', icon: Users },
            { href: '/tampillapangan', label: 'Lapangan', icon: LandPlot },
            { href: '/tampilbooking', label: 'Booking', icon: CalendarDays },
            { href: '/tampilpembayaran', label: 'Pembayaran', icon: Wallet },
        ],
    },
    { label: 'Laporan', menu: [{ href: '/tampillaporanpembayaran', label: 'Laporan Pembayaran', icon: FileText }] },
];

// Manager hanya melihat pembayaran, lapangan, dan laporan; yang bisa diubah hanya akun Admin (PRD bagian 4).
const MENU_MANAGER: Kelompok[] = [
    { menu: [{ href: '/dashboard-manager', label: 'Dashboard', icon: LayoutDashboard }] },
    {
        label: 'Pemantauan',
        menu: [
            { href: '/manager/pembayaran', label: 'Pembayaran', icon: Wallet },
            { href: '/manager/lapangan', label: 'Lapangan', icon: LandPlot },
        ],
    },
    { label: 'Laporan', menu: [{ href: '/manager/laporan', label: 'Laporan Pembayaran', icon: FileText }] },
    { label: 'Pengguna', menu: [{ href: '/manager/admin', label: 'Admin', icon: UserCog }] },
];

function PenggunaMenu() {
    const { isMobile } = useSidebar();
    const pengelola = usePage<PageProps>().props.pengelola;

    if (!pengelola) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuButton
                                size="lg"
                                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                            />
                        }
                    >
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                            <User className="size-4" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{pengelola.nama}</span>
                            <span className="truncate text-xs text-muted-foreground">{pengelola.username}</span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-56" side={isMobile ? 'top' : 'right'} align="end" sideOffset={8}>
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>
                                {pengelola.username} · {pengelola.role === 'admin' ? 'Admin' : 'Manager'}
                            </DropdownMenuLabel>
                            <DropdownMenuItem render={<Link href={route('profile.pengelola')} />}>
                                <User />
                                Profile
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem render={<Link href={route('logout.pengelola')} method="post" as="button" />}>
                                <LogOut />
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

export default function AdminSidebar(props: ComponentProps<typeof Sidebar>) {
    const { url, props: halaman } = usePage<PageProps>();
    const menungguVerifikasi = halaman.pengelola?.menungguVerifikasi ?? 0;
    const manager = halaman.pengelola?.role === 'manager';
    const kelompok = manager ? MENU_MANAGER : MENU_ADMIN;
    const beranda = kelompok[0].menu[0].href;

    const aktif = (href: string) => (href === beranda ? url.split('?')[0] === href : url.startsWith(href));

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="flex-row items-center gap-1 group-data-[collapsible=icon]:flex-col">
                <SidebarMenu className="min-w-0 flex-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href={beranda} />}>
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <Trophy className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Buddhi Sports</span>
                                <span className="truncate text-xs text-muted-foreground">{manager ? 'Panel Manager' : 'Panel Admin'}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarTrigger className="shrink-0 text-sidebar-foreground/70" />
            </SidebarHeader>

            <SidebarContent>
                {kelompok.map((k, i) => (
                    <SidebarGroup key={k.label ?? i}>
                        {k.label && <SidebarGroupLabel>{k.label}</SidebarGroupLabel>}
                        <SidebarMenu>
                            {k.menu.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        tooltip={item.label}
                                        isActive={aktif(item.href)}
                                        render={<Link href={item.href} />}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </SidebarMenuButton>
                                    {item.href === '/tampilpembayaran' && menungguVerifikasi > 0 && (
                                        <SidebarMenuBadge aria-label={`${menungguVerifikasi} menunggu verifikasi`}>
                                            {menungguVerifikasi}
                                        </SidebarMenuBadge>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <PenggunaMenu />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
