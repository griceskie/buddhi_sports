import { HubungiPengelola } from '@/Components/booking/DialogBukti';
import { Terisi } from '@/Components/booking/jadwal';
import KartuBookingSaya from '@/Components/booking/KartuBookingSaya';
import KonfirmasiBatal from '@/Components/booking/KonfirmasiBatal';
import NavPenyewa from '@/Components/booking/NavPenyewa';
import PanelPembayaran from '@/Components/booking/PanelPembayaran';
import { BookingPenyewa, keadaan, Rekening } from '@/Components/booking/pembayaran';
import { kelasPopup } from '@/Components/booking/popup';
import { buttonVariants } from '@/Components/ui/button';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { formatTanggal } from '@/Components/ui/format';
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head, Link, router } from '@inertiajs/react';
import { cn } from 'cn';
import { Info } from 'lucide-react';
import { useCallback, useState } from 'react';

type Props = { bookings: BookingPenyewa[]; rekening: Rekening; terisi?: Terisi[] };
type Grup = { kunci: string; judul: string; sub?: string; item: BookingPenyewa[] };

const iso = (d: Date) => formatTanggal(d, 'yyyy-MM-dd');
const urutan = (b: BookingPenyewa) => b.tanggal + b.jamMulai;

export default function Booking({ bookings, rekening, terisi }: Props) {
    const [tab, setTab] = useState<'mendatang' | 'riwayat'>('mendatang');
    // booking yang batas bayarnya habis selagi halaman terbuka tetap di Mendatang sampai halaman dimuat ulang
    const [habis, setHabis] = useState<Set<number>>(() => new Set());
    const [popup, setPopup] = useState<{ id: number; buka: boolean } | null>(null);
    const [konfirmasi, setKonfirmasi] = useState(false);

    const sekarang = new Date();
    const hariIni = iso(sekarang);
    const besok = iso(new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() + 1));

    const mendatang = (b: BookingPenyewa) =>
        habis.has(b.idBooking) || (b.tanggal >= hariIni && keadaan(b) !== 'dibatalkan');
    const daftarMendatang = bookings.filter(mendatang).sort((a, b) => (urutan(a) < urutan(b) ? -1 : 1));
    const daftarRiwayat = bookings.filter((b) => !mendatang(b)).sort((a, b) => (urutan(a) > urutan(b) ? -1 : 1));
    const tampil = tab === 'mendatang' ? daftarMendatang : daftarRiwayat;

    const grup: Grup[] = [];
    for (const b of tampil) {
        const kunci = tab === 'mendatang' ? b.tanggal : b.tanggal.slice(0, 7);
        let g = grup.find((x) => x.kunci === kunci);
        if (!g) {
            const panjang = formatTanggal(b.tanggal, 'EEEE, d MMMM');
            g =
                tab === 'riwayat'
                    ? { kunci, judul: formatTanggal(b.tanggal, 'MMMM yyyy'), item: [] }
                    : b.tanggal === hariIni
                      ? { kunci, judul: 'Hari ini', sub: panjang, item: [] }
                      : b.tanggal === besok
                        ? { kunci, judul: 'Besok', sub: panjang, item: [] }
                        : { kunci, judul: panjang, item: [] };
            grup.push(g);
        }
        g.item.push(b);
    }

    const tandaiHabis = useCallback((id: number) => {
        setHabis((s) => (s.has(id) ? s : new Set(s).add(id)));
        // server membatalkan booking kedaluwarsa saat halaman dimuat; jumlah di menu akun ikut turun
        router.reload({ only: ['bookings', 'perluTindakan'] });
    }, []);

    const dipilih = popup ? bookings.find((b) => b.idBooking === popup.id) : undefined;
    const tutup = () => {
        setKonfirmasi(false);
        setPopup((p) => (p ? { ...p, buka: false } : p));
    };
    const habisDiPopup = useCallback(() => {
        setKonfirmasi(false);
        if (popup) tandaiHabis(popup.id);
    }, [popup, tandaiHabis]);

    const tabs = [
        { nilai: 'mendatang', label: 'Mendatang', n: daftarMendatang.length },
        { nilai: 'riwayat', label: 'Riwayat', n: daftarRiwayat.length },
    ] as const;

    return (
        <PenyewaLayout nav={<NavPenyewa />}>
            <Head title="Booking saya" />

            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-title-3 font-semibold">Booking saya</h1>
                        <p className="mt-0.5 text-subheadline text-muted-foreground">
                            Jadwal main Anda, dan pembayaran yang masih perlu diselesaikan.
                        </p>
                    </div>
                    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                        <TabsList
                            variant="line"
                            aria-label="Filter booking"
                            className="relative w-full justify-start gap-0 rounded-none border-b p-0 group-data-horizontal/tabs:h-auto"
                        >
                            {tabs.map((t) => (
                                <TabsTrigger
                                    key={t.nilai}
                                    value={t.nilai}
                                    className="h-auto w-[132px] flex-none gap-2 px-1 pt-0 pb-3 text-subheadline font-medium text-muted-foreground after:hidden data-active:font-semibold data-active:text-foreground max-sm:w-1/2"
                                >
                                    {t.label}
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground/8 px-1.5 text-caption-1 font-semibold text-muted-foreground tabular-nums in-data-active:bg-foreground in-data-active:text-background">
                                        {t.n}
                                    </span>
                                </TabsTrigger>
                            ))}
                            <TabsIndicator className="-bottom-px" />
                        </TabsList>
                    </Tabs>
                </div>

                {tampil.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 pt-12 pb-14 text-center">
                        <img
                            src="/images/booking/kalender-3d.png"
                            alt=""
                            width={96}
                            height={96}
                            className="mb-1 size-24"
                        />
                        <div className="grid gap-1">
                            <p className="text-callout font-semibold">
                                {tab === 'mendatang' ? 'Belum ada booking mendatang' : 'Belum ada riwayat'}
                            </p>
                            <p className="text-subheadline text-muted-foreground">
                                {tab === 'mendatang'
                                    ? 'Pilih lapangan dan jam di halaman pesan untuk mulai bermain.'
                                    : 'Booking yang sudah lewat atau dibatalkan akan muncul di sini.'}
                            </p>
                        </div>
                        <Link href={route('dashboard')} className={cn(buttonVariants({ size: 'lg' }), 'px-3.5 text-subheadline font-semibold')}>
                            Pesan lapangan
                        </Link>
                    </div>
                ) : (
                    <>
                        {grup.map((g) => (
                            <section key={g.kunci} className="flex flex-col gap-2.5">
                                <h2 className="flex items-baseline gap-2 text-subheadline font-semibold">
                                    {g.judul}
                                    {g.sub && <span className="font-normal text-muted-foreground">{g.sub}</span>}
                                </h2>
                                {g.item.map((b) => (
                                    <KartuBookingSaya
                                        key={b.idBooking}
                                        booking={b}
                                        riwayat={tab === 'riwayat'}
                                        habisLokal={habis.has(b.idBooking)}
                                        onBuka={() => setPopup({ id: b.idBooking, buka: true })}
                                        onHabis={tandaiHabis}
                                    />
                                ))}
                            </section>
                        ))}
                        <p className="flex items-start gap-2 text-footnote text-muted-foreground">
                            <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
                            <span>
                                Jadwal baru terkunci setelah pengelola mengonfirmasi pembayaran. Ada kendala?{' '}
                                <HubungiPengelola awalBesar />.
                            </span>
                        </p>
                    </>
                )}
            </div>

            <Dialog open={!!popup?.buka} onOpenChange={(o) => !o && tutup()}>
                <DialogContent
                    showCloseButton={false}
                    aria-label="Konfirmasi dan bayar"
                    className={cn(
                        kelasPopup,
                        'block bg-canvas sm:w-[min(720px,calc(100%-4rem))] sm:max-w-none',
                        // naik 40px saat muncul (bukan membesar), seperti rancangan
                        'duration-[380ms] ease-[cubic-bezier(.2,.8,.2,1)] sm:data-[ending-style]:translate-y-[calc(-50%+40px)] sm:data-[ending-style]:scale-100 sm:data-[starting-style]:translate-y-[calc(-50%+40px)] sm:data-[starting-style]:scale-100',
                        // konfirmasi batal terbuka: pop-up mengecil di desktop, turun keluar layar di HP
                        konfirmasi && 'sm:scale-[.94] max-sm:translate-y-full',
                    )}
                >
                    {dipilih && (
                        <>
                            <PanelPembayaran
                                // panel baru tiap booking yang dibuka: langkah dan lipatan mulai dari awal
                                key={dipilih.idBooking}
                                booking={dipilih}
                                rekening={rekening}
                                terisi={terisi}
                                tampilan="dialog"
                                onTutup={tutup}
                                onMintaBatal={() => setKonfirmasi(true)}
                                onHabis={habisDiPopup}
                            />
                            <KonfirmasiBatal booking={dipilih} open={konfirmasi} onOpenChange={setKonfirmasi} />
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </PenyewaLayout>
    );
}
