import { inisial } from '@/Components/pengelola/MenuAkunPengelola';
import FormSelect from '@/Components/FormSelect';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { LaravelLink, LaravelPagination } from '@/Components/ui/pagination';
import { SearchInput } from '@/Components/ui/search-input';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    ArrowRight,
    CalendarDays,
    Check,
    Clock,
    FilePlus,
    KeyRound,
    FileText,
    LandPlot,
    Lock,
    LucideIcon,
    Pencil,
    Plus,
    RotateCcw,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    User,
    UserCog,
    UserRound,
    Wallet,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';

type Rincian = [string, string, string];
type Entri = {
    id: number;
    waktu: string;
    namaAdmin: string;
    peran: 'admin' | 'manager' | 'sistem';
    aksi: keyof typeof AKSI;
    jenisObjek: string;
    kodeObjek: string;
    ringkasan: string;
    rincian: Rincian[];
    catatan: string | null;
};
type Pemeriksaan = { utuh: boolean; diperiksa: number; rusakPada: number | null; waktu: string } | null;
type Filter = { q?: string; admin?: string; aksi?: string; jenis?: string; peran?: string };

const AKSI = {
    tambah: { label: 'Menambah', ikon: Plus, warna: 'text-accessible-green' },
    ubah: { label: 'Mengubah', ikon: Pencil, warna: 'text-accessible-blue' },
    hapus: { label: 'Menghapus', ikon: Trash2, warna: 'text-accessible-red' },
    terima: { label: 'Menerima bukti', ikon: Check, warna: 'text-accessible-green' },
    tolak: { label: 'Menolak bukti', ikon: X, warna: 'text-accessible-red' },
    otomatis: { label: 'Membatalkan', ikon: Clock, warna: 'text-muted-foreground' },
    buat: { label: 'Membuat', ikon: FilePlus, warna: 'text-accessible-green' },
    periksa: { label: 'Menandai diperiksa', ikon: Check, warna: 'text-accessible-green' },
    revisi: { label: 'Meminta revisi', ikon: RotateCcw, warna: 'text-accessible-red' },
    reset: { label: 'Mereset password', ikon: KeyRound, warna: 'text-accessible-orange' },
} satisfies Record<string, { label: string; ikon: LucideIcon; warna: string }>;

const IKON_JENIS: Record<string, LucideIcon> = {
    Booking: CalendarDays,
    Pembayaran: Wallet,
    Penyewa: User,
    Lapangan: LandPlot,
    Laporan: FileText,
    Admin: UserCog,
    Profil: UserRound,
};

const PERAN = { admin: 'Admin', manager: 'Manager', sistem: 'Sistem' };

const kapan = (w: string) => format(new Date(w.replace(' ', 'T')), 'EEE, d MMM yyyy, HH.mm', { locale: id });
const kapanPanjang = (w: string) => format(new Date(w.replace(' ', 'T')), 'EEEE, d MMMM yyyy, HH.mm', { locale: id });

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-flex h-[22px] max-w-full shrink-0 items-center gap-1 overflow-hidden rounded-md border bg-card px-1.5 text-xs whitespace-nowrap ${className}`}>
            {children}
        </span>
    );
}

function ChipAksi({ aksi }: { aksi: Entri['aksi'] }) {
    const a = AKSI[aksi] ?? AKSI.ubah;
    return (
        <Chip>
            <a.ikon className={`size-3 ${a.warna}`} aria-hidden />
            {a.label}
        </Chip>
    );
}

function ChipObjek({ e }: { e: Entri }) {
    const Ikon = IKON_JENIS[e.jenisObjek] ?? FileText;
    return (
        <Chip className="font-medium">
            <Ikon className="size-3 text-muted-foreground" aria-hidden />
            <span title={e.jenisObjek}>{e.kodeObjek}</span>
        </Chip>
    );
}

/** Ringkasan satu baris: perubahan pertama sebagai "isian: lama → baru", sisanya kata-kata. */
function ApaYangTerjadi({ e }: { e: Entri }) {
    const r = e.rincian[0];
    const berubah = (e.aksi === 'ubah' || e.aksi === 'terima' || e.aksi === 'tolak' || e.aksi === 'otomatis') && r;
    const lainnya = e.rincian.length > 1 ? `· ${e.rincian.length - 1} isian lain` : '';
    return (
        <span className="flex min-w-0 items-center gap-1.5">
            <ChipObjek e={e} />
            {berubah ? (
                <>
                    <span className="shrink-0 text-muted-foreground">{r[0]}</span>
                    <Chip className="text-muted-foreground">{r[1]}</Chip>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-label="menjadi" />
                    <Chip className="font-medium">{r[2]}</Chip>
                    <span className="truncate text-muted-foreground">{e.catatan ?? lainnya}</span>
                </>
            ) : (
                <span className="truncate text-muted-foreground">
                    {e.aksi === 'hapus' ? 'dihapus' : `${e.rincian.length} isian`}
                    {e.catatan ? ` · ${e.catatan}` : ''}
                </span>
            )}
        </span>
    );
}

export default function TampilData({
    log,
    filter,
    opsiAdmin,
    opsiJenis,
    pemeriksaan,
}: {
    log: { data: Entri[]; links: LaravelLink[]; total: number; from: number | null; to: number | null };
    filter: Filter;
    opsiAdmin: string[];
    opsiJenis: string[];
    pemeriksaan: Pemeriksaan;
}) {
    const [detail, setDetail] = useState<Entri | null>(null);
    const [memeriksa, setMemeriksa] = useState(false);
    const tunda = useRef<ReturnType<typeof setTimeout>>();

    const saring = (ubah: Filter) =>
        router.get(route('log.aktivitas'), { ...filter, ...ubah }, { preserveState: true, preserveScroll: true, replace: true });

    const periksa = () =>
        router.post(route('log.aktivitas.periksa'), {}, { preserveScroll: true, onStart: () => setMemeriksa(true), onFinish: () => setMemeriksa(false) });

    return (
        <AdminSidebarLayout>
            <Head title="Log aktivitas" />

            <div className="grid gap-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-xl leading-tight font-semibold">Log aktivitas</h2>
                        <p className="text-sm text-muted-foreground">Catatan tindakan Admin, Manager, dan sistem. Pilih baris untuk melihat data sebelum dan sesudah diubah.</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Button variant="outline" onClick={periksa} disabled={memeriksa}>
                            <ShieldCheck />
                            {memeriksa ? 'Memeriksa…' : 'Periksa keaslian log'}
                        </Button>
                        {pemeriksaan && (
                            <span className={`flex items-center gap-1 text-sm ${pemeriksaan.utuh ? 'text-muted-foreground' : 'text-destructive'}`}>
                                {pemeriksaan.utuh ? <ShieldCheck className="size-3.5 text-accessible-green" /> : <ShieldAlert className="size-3.5" />}
                                {pemeriksaan.utuh ? 'Utuh' : `Rantai putus di #${pemeriksaan.rusakPada}`} · diperiksa{' '}
                                {format(new Date(pemeriksaan.waktu), 'd MMM yyyy, HH.mm', { locale: id })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput
                        defaultValue={filter.q ?? ''}
                        placeholder="Cari kode atau nama…"
                        aria-label="Cari aktivitas"
                        onValueChange={(q) => {
                            clearTimeout(tunda.current);
                            tunda.current = setTimeout(() => saring({ q: q || undefined }), 300);
                        }}
                    />
                    <FormSelect
                        className="w-52"
                        value={filter.peran ?? 'semua'}
                        onChange={(v) => saring({ peran: v || 'semua', admin: undefined })}
                        placeholder="Peran"
                        options={[
                            { value: 'semua', label: 'Semua pengelola' },
                            { value: 'admin', label: 'Admin' },
                            { value: 'manager', label: 'Manager' },
                            { value: 'sistem', label: 'Sistem' },
                        ]}
                    />
                    <FormSelect
                        className="w-44"
                        value={filter.admin ?? ''}
                        onChange={(v) => saring({ admin: v || undefined })}
                        placeholder="Siapa"
                        options={[{ value: '', label: 'Semua orang' }, ...opsiAdmin.map((a) => ({ value: a, label: a }))]}
                    />
                    <FormSelect
                        className="w-44"
                        value={filter.aksi ?? ''}
                        onChange={(v) => saring({ aksi: v || undefined })}
                        placeholder="Apa"
                        options={[{ value: '', label: 'Semua aksi' }, ...Object.entries(AKSI).map(([k, a]) => ({ value: k, label: a.label }))]}
                    />
                    <FormSelect
                        className="w-40"
                        value={filter.jenis ?? ''}
                        onChange={(v) => saring({ jenis: v || undefined })}
                        placeholder="Data"
                        options={[{ value: '', label: 'Semua data' }, ...opsiJenis.map((j) => ({ value: j, label: j }))]}
                    />
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <Table className="[&_td+td]:border-l [&_th+th]:border-l">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-14 text-right">#</TableHead>
                                <TableHead>Siapa</TableHead>
                                <TableHead>Kapan</TableHead>
                                <TableHead>Apa</TableHead>
                                <TableHead>Apa yang terjadi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {log.data.map((e) => (
                                <TableRow
                                    key={e.id}
                                    className="cursor-pointer"
                                    tabIndex={0}
                                    onClick={() => setDetail(e)}
                                    onKeyDown={(k) => (k.key === 'Enter' || k.key === ' ') && (k.preventDefault(), setDetail(e))}
                                >
                                    <TableCell className="text-right text-muted-foreground tabular-nums">{e.id}</TableCell>
                                    <TableCell>
                                        <span className="flex items-center gap-2 whitespace-nowrap">
                                            <span aria-hidden className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                                                {inisial(e.namaAdmin)}
                                            </span>
                                            <span className="font-medium">{e.namaAdmin}</span>
                                            {e.peran !== 'sistem' && <span className="text-muted-foreground">· {PERAN[e.peran]}</span>}
                                        </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap tabular-nums">{kapan(e.waktu)}</TableCell>
                                    <TableCell>
                                        <ChipAksi aksi={e.aksi} />
                                    </TableCell>
                                    <TableCell className="max-w-0 w-full">
                                        <ApaYangTerjadi e={e} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {log.data.length === 0 && (
                                <TableEmpty colSpan={5}>
                                    {Object.values(filter).some(Boolean) ? 'Tidak ada aktivitas yang cocok.' : 'Belum ada aktivitas yang tercatat.'}
                                </TableEmpty>
                            )}
                        </TableBody>
                    </Table>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                        {log.total ? `${log.from}–${log.to} dari ${log.total} aktivitas` : ''}
                    </span>
                    <LaravelPagination links={log.links} className="mx-0 w-auto justify-end" />
                </div>
            </div>

            <Sheet open={!!detail} onOpenChange={(b) => !b && setDetail(null)}>
                <SheetContent className="w-full sm:max-w-md">
                    {detail && (
                        <>
                            <SheetHeader>
                                <SheetTitle>Detail aktivitas</SheetTitle>
                                <SheetDescription>{detail.ringkasan}.</SheetDescription>
                            </SheetHeader>
                            <SheetBody className="flex flex-col gap-6">
                                <dl className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 text-sm">
                                    <dt className="text-muted-foreground">Siapa</dt>
                                    <dd className="font-medium">{detail.namaAdmin}</dd>
                                    <dt className="text-muted-foreground">Kapan</dt>
                                    <dd className="tabular-nums">{kapanPanjang(detail.waktu)}</dd>
                                    <dt className="text-muted-foreground">Apa</dt>
                                    <dd className="flex flex-wrap items-center gap-1.5">
                                        <ChipAksi aksi={detail.aksi} />
                                        <ChipObjek e={detail} />
                                        <span className="text-muted-foreground">{detail.jenisObjek}</span>
                                    </dd>
                                </dl>
                                <div className="flex flex-col gap-2">
                                    <span className="text-sm font-medium">Apa yang terjadi</span>
                                    <div className="overflow-hidden rounded-lg border text-sm">
                                        <div className="grid grid-cols-[30%_35%_35%] bg-muted text-sm font-medium text-muted-foreground">
                                            <span className="px-3 py-2">Isian</span>
                                            <span className="px-3 py-2">Sebelum</span>
                                            <span className="px-3 py-2">Sesudah</span>
                                        </div>
                                        {detail.rincian.map(([label, lama, baru], i) => (
                                            <div key={i} className="grid grid-cols-[30%_35%_35%] border-t">
                                                <span className="px-3 py-2.5 text-muted-foreground">{label}</span>
                                                <span className="px-3 py-2.5 break-words text-muted-foreground">{lama}</span>
                                                <span className="px-3 py-2.5 font-medium break-words">{baru}</span>
                                            </div>
                                        ))}
                                        {detail.rincian.length === 0 && <p className="border-t px-3 py-2.5 text-muted-foreground">Tidak ada isian yang berubah.</p>}
                                    </div>
                                    {detail.catatan && <p className="text-sm text-muted-foreground">{detail.catatan}</p>}
                                </div>
                            </SheetBody>
                            <SheetFooter className="flex-row items-center justify-between border-t">
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Lock className="size-3.5" />
                                    Log tidak bisa diubah atau dihapus.
                                </span>
                                <Button variant="outline" onClick={() => setDetail(null)}>
                                    Tutup
                                </Button>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </AdminSidebarLayout>
    );
}
