import { Button, buttonVariants } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { SearchInput } from '@/Components/ui/search-input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { cn } from 'cn';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CirclePlus,
    EyeOff,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

export type KolomTabel<T> = {
    id: string;
    label: string;
    render: (baris: T) => ReactNode;
    /** Nilai untuk mengurutkan; tanpa ini header kolom tidak punya menu urut. */
    urut?: (baris: T) => string | number;
    className?: string;
    /** Kolom wajib tampil (tidak muncul di menu Tampilan). */
    tetap?: boolean;
};

export type FilterTabel<T> = {
    id: string;
    label: string;
    nilai: (baris: T) => string;
    opsi: { id: string; label: string }[];
};

type Urutan = { kolom: string; arah: 'asc' | 'desc' } | null;
export type NilaiFilter = Record<string, string[]>;

type Props<T> = {
    baris: T[];
    kunci: (baris: T) => string | number;
    kolom: KolomTabel<T>[];
    filter?: FilterTabel<T>[];
    /** Teks yang dicari dari satu baris. */
    cari: (baris: T) => string;
    placeholderCari?: string;
    satuan: string;
    /** Kolom aksi di kanan (Edit, Hapus, dst.). */
    aksi?: (baris: T) => ReactNode;
    /** Tombol di kanan toolbar, mis. "Tambah lapangan". */
    toolbarKanan?: ReactNode;
    /** Filter dikendalikan dari luar (mis. tab status); tanpa ini state ada di dalam. */
    nilaiFilter?: NilaiFilter;
    onNilaiFilter?: (nilai: NilaiFilter) => void;
    /** Slot di atas toolbar (mis. tab status). */
    atas?: ReactNode;
    bisaPilih?: boolean;
    perHalaman?: number;
    bukaBaris?: (baris: T) => void;
    kosong?: ReactNode;
    /** Mengganti isi sel pertama kolom pilih (jarang dipakai). */
    className?: string;
};

const PER_HALAMAN = [5, 10, 20];

function tombolKecil(className?: string) {
    return cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8', className);
}

/**
 * Tabel data panel pengelola, mengikuti desain "Admin: halaman data" di canvas (shadcn DataTable):
 * cari, filter per kolom dengan jumlah, pilihan kolom, urut lewat header, kotak centang, dan halaman.
 * Pencarian, filter dan urutan berjalan di browser; data tiap halaman master memang sudah dikirim utuh oleh server.
 */
export default function DataTable<T>({
    baris,
    kunci,
    kolom,
    filter = [],
    cari,
    placeholderCari = 'Cari…',
    satuan,
    aksi,
    toolbarKanan,
    nilaiFilter,
    onNilaiFilter,
    atas,
    bisaPilih = true,
    perHalaman = 10,
    bukaBaris,
    kosong,
    className,
}: Props<T>) {
    const [q, setQ] = useState('');
    const [filterDalam, setFilterDalam] = useState<NilaiFilter>({});
    const [sembunyi, setSembunyi] = useState<Record<string, boolean>>({});
    const [urutan, setUrutan] = useState<Urutan>(null);
    const [hal, setHal] = useState(1);
    const [per, setPer] = useState(perHalaman);
    const [dipilih, setDipilih] = useState<Set<string | number>>(new Set());

    const nilai = nilaiFilter ?? filterDalam;
    const ubahFilter = (n: NilaiFilter) => {
        (onNilaiFilter ?? setFilterDalam)(n);
        setHal(1);
    };

    const lolos = (b: T, kecuali?: string) =>
        (!q.trim() || cari(b).toLowerCase().includes(q.trim().toLowerCase())) &&
        filter.every((f) => f.id === kecuali || !(nilai[f.id]?.length) || nilai[f.id].includes(f.nilai(b)));

    const tersaring = useMemo(() => {
        let r = baris.filter((b) => lolos(b));
        const k = kolom.find((c) => c.id === urutan?.kolom);
        if (k?.urut && urutan) {
            const ambil = k.urut;
            r = r.slice().sort((x, y) => {
                const a = ambil(x);
                const c = ambil(y);
                const h = typeof a === 'string' ? a.localeCompare(String(c), 'id') : (a as number) - (c as number);
                return urutan.arah === 'asc' ? h : -h;
            });
        }
        return r;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baris, q, nilai, urutan]);

    const jmlHal = Math.max(1, Math.ceil(tersaring.length / per));
    const halIni = Math.min(hal, jmlHal);
    const awal = (halIni - 1) * per;
    const tampil = tersaring.slice(awal, awal + per);
    const kolomTampil = kolom.filter((k) => !sembunyi[k.id]);

    const dipilihHalaman = tampil.filter((b) => dipilih.has(kunci(b))).length;
    const semua = tampil.length > 0 && dipilihHalaman === tampil.length;
    const adaFilter = !!q.trim() || filter.some((f) => nilai[f.id]?.length);
    const jmlDipilih = [...dipilih].filter((k) => baris.some((b) => kunci(b) === k)).length;

    const togglePilih = (k: string | number) =>
        setDipilih((s) => {
            const n = new Set(s);
            if (n.has(k)) n.delete(k);
            else n.add(k);
            return n;
        });
    const pilihSemua = () =>
        setDipilih((s) => {
            const n = new Set(s);
            tampil.forEach((b) => (semua ? n.delete(kunci(b)) : n.add(kunci(b))));
            return n;
        });

    const jmlKolom = kolomTampil.length + (bisaPilih ? 1 : 0) + (aksi ? 1 : 0);

    return (
        <section className={cn('flex flex-col gap-4', className)}>
            {atas}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput
                        size="sm"
                        value={q}
                        onValueChange={(v) => {
                            setQ(v);
                            setHal(1);
                        }}
                        placeholder={placeholderCari}
                        aria-label={placeholderCari}
                        className="w-[250px]"
                    />
                    {filter.map((f) => (
                        <FilterFacet
                            key={f.id}
                            f={f}
                            dipilih={nilai[f.id] ?? []}
                            jumlah={(o) => baris.filter((b) => lolos(b, f.id) && f.nilai(b) === o).length}
                            ubah={(v) => ubahFilter({ ...nilai, [f.id]: v })}
                        />
                    ))}
                    {adaFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                                setQ('');
                                ubahFilter({});
                            }}
                        >
                            Reset
                            <X />
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger className={tombolKecil('data-popup-open:bg-muted')}>
                            <SlidersHorizontal className="size-4" />
                            Tampilan
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-52 p-1">
                            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Tampilkan kolom</p>
                            <div className="-mx-1 my-1 h-px bg-border" />
                            {kolom
                                .filter((k) => !k.tetap)
                                .map((k) => (
                                    <button
                                        key={k.id}
                                        type="button"
                                        role="menuitemcheckbox"
                                        aria-checked={!sembunyi[k.id]}
                                        onClick={() => setSembunyi((s) => ({ ...s, [k.id]: !s[k.id] }))}
                                        className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
                                    >
                                        <span className="flex w-4 justify-center">{!sembunyi[k.id] && <Check className="size-4" />}</span>
                                        {k.label}
                                    </button>
                                ))}
                        </PopoverContent>
                    </Popover>
                    {toolbarKanan}
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                    <TableHeader className="bg-tabel-header">
                        <TableRow className="hover:bg-transparent">
                            {bisaPilih && (
                                <TableHead className="w-10 pr-0">
                                    <Checkbox
                                        className="flex"
                                        aria-label="Pilih semua di halaman ini"
                                        checked={semua}
                                        indeterminate={dipilihHalaman > 0 && !semua}
                                        onCheckedChange={pilihSemua}
                                    />
                                </TableHead>
                            )}
                            {kolomTampil.map((k) => (
                                <TableHead key={k.id} className={k.className}>
                                    {k.urut ? (
                                        <KepalaUrut
                                            label={k.label}
                                            arah={urutan?.kolom === k.id ? urutan.arah : null}
                                            urut={(arah) => {
                                                setUrutan({ kolom: k.id, arah });
                                                setHal(1);
                                            }}
                                            sembunyi={k.tetap ? undefined : () => setSembunyi((s) => ({ ...s, [k.id]: true }))}
                                        />
                                    ) : (
                                        k.label
                                    )}
                                </TableHead>
                            ))}
                            {aksi && <TableHead className="text-right">Aksi</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tampil.map((b) => {
                            const k = kunci(b);
                            const on = dipilih.has(k);
                            return (
                                <TableRow
                                    key={k}
                                    data-state={on ? 'selected' : undefined}
                                    className={cn(on && 'bg-muted', bukaBaris && 'cursor-pointer')}
                                    onClick={bukaBaris ? () => bukaBaris(b) : undefined}
                                >
                                    {bisaPilih && (
                                        <TableCell className="pr-0" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox className="flex" aria-label="Pilih baris" checked={on} onCheckedChange={() => togglePilih(k)} />
                                        </TableCell>
                                    )}
                                    {kolomTampil.map((c) => (
                                        <TableCell key={c.id} className={c.className}>
                                            {c.render(b)}
                                        </TableCell>
                                    ))}
                                    {aksi && (
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            {aksi(b)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                        {tersaring.length === 0 && (
                            <TableEmpty colSpan={jmlKolom}>
                                {kosong ?? (adaFilter ? `Tidak ada ${satuan} yang cocok.` : `Belum ada ${satuan}.`)}
                            </TableEmpty>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                    {jmlDipilih > 0
                        ? `${jmlDipilih} dari ${tersaring.length} ${satuan} dipilih.`
                        : tersaring.length
                          ? `Menampilkan ${awal + 1}–${awal + tampil.length} dari ${tersaring.length} ${satuan}`
                          : `Tidak ada ${satuan}`}
                </p>
                <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Baris per halaman</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger className={tombolKecil('w-[70px] justify-between')}>
                                {per}
                                <ChevronRight className="size-4 rotate-90 opacity-60" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[70px]">
                                {PER_HALAMAN.map((n) => (
                                    <DropdownMenuItem
                                        key={n}
                                        onClick={() => {
                                            setPer(n);
                                            setHal(1);
                                        }}
                                    >
                                        {n}
                                        {n === per && <Check className="ml-auto size-4" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <span className="font-medium text-foreground">
                        Halaman {halIni} dari {jmlHal}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon-sm" aria-label="Halaman pertama" disabled={halIni <= 1} onClick={() => setHal(1)}>
                            <ChevronsLeft />
                        </Button>
                        <Button variant="outline" size="icon-sm" aria-label="Halaman sebelumnya" disabled={halIni <= 1} onClick={() => setHal(halIni - 1)}>
                            <ChevronLeft />
                        </Button>
                        <Button variant="outline" size="icon-sm" aria-label="Halaman berikutnya" disabled={halIni >= jmlHal} onClick={() => setHal(halIni + 1)}>
                            <ChevronRight />
                        </Button>
                        <Button variant="outline" size="icon-sm" aria-label="Halaman terakhir" disabled={halIni >= jmlHal} onClick={() => setHal(jmlHal)}>
                            <ChevronsRight />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FilterFacet<T>({
    f,
    dipilih,
    jumlah,
    ubah,
}: {
    f: FilterTabel<T>;
    dipilih: string[];
    jumlah: (opsi: string) => number;
    ubah: (v: string[]) => void;
}) {
    const label = f.opsi.filter((o) => dipilih.includes(o.id)).map((o) => o.label);
    return (
        <Popover>
            <PopoverTrigger className={tombolKecil('border-dashed data-popup-open:bg-muted')}>
                <CirclePlus className="size-4" />
                {f.label}
                {dipilih.length > 0 && (
                    <>
                        <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
                        <span className="rounded-sm bg-secondary px-1.5 text-xs font-normal text-secondary-foreground">
                            {dipilih.length > 2 ? `${dipilih.length} dipilih` : label.join(', ')}
                        </span>
                    </>
                )}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-1">
                {f.opsi.map((o) => {
                    const on = dipilih.includes(o.id);
                    return (
                        <button
                            key={o.id}
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={on}
                            onClick={() => ubah(on ? dipilih.filter((x) => x !== o.id) : [...dipilih, o.id])}
                            className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
                        >
                            <Checkbox tabIndex={-1} checked={on} className="pointer-events-none flex" aria-hidden />
                            <span className="flex-1 text-left">{o.label}</span>
                            <span className="font-mono text-xs text-muted-foreground">{jumlah(o.id)}</span>
                        </button>
                    );
                })}
                {dipilih.length > 0 && (
                    <>
                        <div className="-mx-1 my-1 h-px bg-border" />
                        <button
                            type="button"
                            onClick={() => ubah([])}
                            className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md px-2 text-sm hover:bg-muted"
                        >
                            Hapus filter
                        </button>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}

function KepalaUrut({
    label,
    arah,
    urut,
    sembunyi,
}: {
    label: string;
    arah: 'asc' | 'desc' | null;
    urut: (arah: 'asc' | 'desc') => void;
    sembunyi?: () => void;
}) {
    const Ikon = arah === 'asc' ? ArrowUp : arah === 'desc' ? ArrowDown : ArrowUpDown;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    '-ml-2 h-8 gap-1.5 px-2 font-medium data-popup-open:bg-accent',
                )}
            >
                {label}
                <Ikon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px]">
                <DropdownMenuItem onClick={() => urut('asc')}>
                    <ArrowUp /> Urutkan naik
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => urut('desc')}>
                    <ArrowDown /> Urutkan turun
                </DropdownMenuItem>
                {sembunyi && (
                    <DropdownMenuItem onClick={sembunyi}>
                        <EyeOff /> Sembunyikan
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
