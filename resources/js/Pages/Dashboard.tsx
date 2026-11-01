import DateStrip, { HariItem } from '@/Components/booking/DateStrip';
import GaleriLapangan from '@/Components/booking/GaleriLapangan';
import {
    awalHari,
    HARI_KE_DEPAN,
    isoTanggal,
    jam,
    jamKosong,
    jamKosongPertama,
    jamSudahLewat,
    Lapangan,
    Pilihan,
    sedangPerbaikan,
    tambahHari,
    Terisi,
} from '@/Components/booking/jadwal';
import KartuJam from '@/Components/booking/KartuJam';
import PilihLapangan from '@/Components/booking/PilihLapangan';
import RingkasanBooking, { BarBookingMobile } from '@/Components/booking/RingkasanBooking';
import StatusBuka from '@/Components/booking/StatusBuka';
import { Alert, AlertTitle } from '@/Components/ui/alert';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/Components/ui/empty';
import { toMinutes } from '@/Components/ui/format';
import { TimeRange } from '@/Components/ui/slot-picker';
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head, router } from '@inertiajs/react';
import { CalendarX, CircleAlert } from 'lucide-react';
import { useState } from 'react';

// gambar ikon tab per jenis lapangan
const IKON_JENIS: Record<string, string> = {
    'Bulu Tangkis': '/images/olahraga/kok.png',
    Basket: '/images/olahraga/basket.png',
};

// tanggal ditandai "Terbatas" bila jam kosong lapangan terpilih tinggal 3 atau kurang (sekitar seperempat dari 14 jam)
const BATAS_TERBATAS = 3;

// 'auto' = 1 jam kosong pertama di lapangan dan tanggal terpilih (hari ini: setelah jam berjalan)
type Jam = { start: number; end: number };

export default function Dashboard({ lapangan, terisi = [] }: { lapangan: Lapangan[]; terisi?: Terisi[] }) {
    const sekarang = new Date();
    const hariIni = awalHari(sekarang);

    const jenisList = [...new Set(lapangan.map((l) => l.jenisLapangan))];
    const [jenis, setJenis] = useState(jenisList[0] ?? '');
    // lapangan terpilih diingat per jenis, supaya pindah tab bolak-balik tidak mengulang pilihan
    const [pilihanLapangan, setPilihanLapangan] = useState<Record<string, number>>({});
    const [tanggal, setTanggal] = useState(hariIni);
    const [jamPilihan, setJamPilihan] = useState<Jam | 'auto' | null>('auto');
    const [galat, setGalat] = useState<string | null>(null);
    const [memproses, setMemproses] = useState(false);

    const tampil = lapangan.filter((l) => l.jenisLapangan === jenis);
    const lapAktif =
        tampil.find((l) => l.idLapangan === pilihanLapangan[jenis]) ??
        tampil.find((l) => !sedangPerbaikan(l)) ??
        tampil[0] ??
        null;
    const perbaikan = !!lapAktif && sedangPerbaikan(lapAktif);
    const kosong = lapAktif ? jamKosong(terisi, lapAktif, tanggal, sekarang) : 0;

    let jamTerpilih: Jam | null = null;
    if (jamPilihan === 'auto') {
        const h = lapAktif ? jamKosongPertama(terisi, lapAktif, tanggal, sekarang) : null;
        jamTerpilih = h === null ? null : { start: h, end: h + 1 };
    } else {
        jamTerpilih = jamPilihan;
    }
    const pilihan: Pilihan | null = lapAktif && jamTerpilih ? { court: lapAktif.idLapangan, ...jamTerpilih } : null;

    const hari: HariItem[] = Array.from({ length: HARI_KE_DEPAN }, (_, i) => {
        const d = tambahHari(hariIni, i);
        return { tanggal: d, kosong: lapAktif ? jamKosong(terisi, lapAktif, d, sekarang) : 0 };
    });

    const mulaiUlang = () => {
        setJamPilihan('auto');
        setGalat(null);
    };
    const ubahJenis = (j: string) => {
        setJenis(j);
        mulaiUlang();
    };
    const ubahLapangan = (id: number) => {
        setPilihanLapangan((p) => ({ ...p, [jenis]: id }));
        mulaiUlang();
    };
    const ubahTanggal = (d: Date) => {
        setTanggal(d);
        mulaiUlang();
    };
    const ubahJam = (r: TimeRange | null) => {
        setJamPilihan(r ? { start: toMinutes(r.start) / 60, end: toMinutes(r.end) / 60 } : null);
        setGalat(null);
    };

    const terisiLapangan: TimeRange[] = lapAktif
        ? terisi
              .filter((t) => t.idLapangan === lapAktif.idLapangan && t.tanggal === isoTanggal(tanggal))
              .map((t) => ({ start: t.jamMulai.slice(0, 5), end: t.jamSelesai.slice(0, 5) }))
        : [];

    const book = () => {
        if (!pilihan || !lapAktif) return;
        router.post(
            route('booking.store'),
            {
                idLapangan: lapAktif.idLapangan,
                tanggal: isoTanggal(tanggal),
                jamMulai: jam(pilihan.start),
                jamSelesai: jam(pilihan.end),
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setMemproses(true);
                    setGalat(null);
                },
                onFinish: () => setMemproses(false),
                onError: (e) => setGalat(Object.values(e)[0] ?? 'Booking gagal disimpan.'),
            },
        );
    };

    const band = (
        // minmax(0,1fr): deretan lapangan yang bisa digeser di HP tidak boleh ikut melebarkan halaman
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
            <h1 id="judul-pesan" className="text-body font-semibold lg:text-headline">
                Pesan lapangan
            </h1>

            {/* tinggi tetap mulai sm: pindah ke jenis dengan lebih sedikit lapangan tidak menggeser isi di bawahnya */}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:h-72 sm:grid-cols-[minmax(0,1fr)_280px] sm:grid-rows-[minmax(0,1fr)] sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
                <GaleriLapangan lapangan={lapAktif} ikon={IKON_JENIS[jenis]} />

                <div className="grid min-w-0 content-start gap-3 sm:-m-1 sm:overflow-y-auto sm:p-1">
                    {jenisList.length > 1 && (
                        <Tabs value={jenis} onValueChange={(v) => ubahJenis(v as string)}>
                            <TabsList
                                variant="line"
                                aria-label="Jenis lapangan"
                                className="relative w-full gap-0 rounded-none border-b p-0 group-data-horizontal/tabs:h-auto"
                            >
                                {jenisList.map((j) => (
                                    <TabsTrigger
                                        key={j}
                                        value={j}
                                        className="h-auto gap-2 px-1 pt-0 pb-2.5 text-footnote font-semibold text-muted-foreground after:hidden data-active:text-foreground"
                                    >
                                        {IKON_JENIS[j] && (
                                            <img src={IKON_JENIS[j]} alt="" width={28} height={28} className="size-7 object-contain" />
                                        )}
                                        {j}
                                    </TabsTrigger>
                                ))}
                                <TabsIndicator className="-bottom-px" />
                            </TabsList>
                        </Tabs>
                    )}
                    <h2 className="text-subheadline font-semibold">Pilih lapangan</h2>
                    <PilihLapangan
                        lapangan={tampil}
                        value={lapAktif?.idLapangan ?? null}
                        onChange={ubahLapangan}
                        jamKosong={(l) => jamKosong(terisi, l, tanggal, sekarang)}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <PenyewaLayout band={band} navTengah={<StatusBuka />}>
            <Head title="Home" />

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-28 lg:pb-0">
                {galat && (
                    <Alert variant="destructive">
                        <CircleAlert />
                        <AlertTitle>{galat}</AlertTitle>
                    </Alert>
                )}

                {!lapAktif ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia>
                                <CalendarX aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>Belum ada lapangan</EmptyTitle>
                            <EmptyDescription>
                                Lapangan akan tampil di sini setelah ditambahkan oleh pengelola.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <>
                        <DateStrip hari={hari} terpilih={tanggal} batasTerbatas={BATAS_TERBATAS} onSelect={ubahTanggal} />

                        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <section aria-labelledby="judul-pesan" className="min-w-0">
                                <KartuJam
                                    // SlotPicker menyimpan jam awal pilihan; mulai bersih saat lapangan atau tanggal ganti
                                    key={`${lapAktif.idLapangan}-${isoTanggal(tanggal)}`}
                                    lapangan={lapAktif}
                                    perbaikan={perbaikan}
                                    jamKosong={kosong}
                                    booked={terisiLapangan}
                                    isPast={(start) => jamSudahLewat(toMinutes(start) / 60, tanggal, sekarang)}
                                    value={pilihan ? { start: jam(pilihan.start), end: jam(pilihan.end) } : null}
                                    onValueChange={ubahJam}
                                />
                            </section>

                            <aside className="hidden lg:sticky lg:top-24 lg:block">
                                <RingkasanBooking
                                    lapangan={lapAktif}
                                    pilihan={pilihan}
                                    tanggal={tanggal}
                                    memproses={memproses}
                                    onBook={book}
                                />
                            </aside>
                        </div>
                    </>
                )}
            </div>

            {lapAktif && (
                <BarBookingMobile
                    lapangan={lapAktif}
                    pilihan={pilihan}
                    tanggal={tanggal}
                    onBook={book}
                    memproses={memproses}
                />
            )}
        </PenyewaLayout>
    );
}
