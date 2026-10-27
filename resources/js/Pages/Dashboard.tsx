import CourtSlotCard from '@/Components/booking/CourtSlotCard';
import DateStrip, { HariItem } from '@/Components/booking/DateStrip';
import {
    awalHari,
    HAMPIR_PENUH,
    HARI_KE_DEPAN,
    isoTanggal,
    jam,
    JAM_BUKA,
    JAM_TUTUP,
    jamKosong,
    jamSudahLewat,
    Lapangan,
    Pilihan,
    sedangPerbaikan,
    tambahHari,
    Terisi,
} from '@/Components/booking/jadwal';
import RingkasanBooking, { BarBookingMobile } from '@/Components/booking/RingkasanBooking';
import { Alert, AlertTitle } from '@/Components/ui/alert';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/Components/ui/empty';
import { formatTanggal, toMinutes } from '@/Components/ui/format';
import { TimeRange } from '@/Components/ui/slot-picker';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head, router } from '@inertiajs/react';
import { CalendarX, CircleAlert } from 'lucide-react';
import { useState } from 'react';

// gambar ikon tab per jenis lapangan
const IKON_JENIS: Record<string, string> = {
    'Bulu Tangkis': '/images/olahraga/kok.png',
    Basket: '/images/olahraga/basket.png',
};

// tanggal ditandai "Terbatas" bila jam kosongnya tinggal seperempat dari kapasitas jenis itu atau kurang
const PORSI_TERBATAS = 0.25;

export default function Dashboard({
    lapangan,
    terisi = [],
    batasBayarMenit,
}: {
    lapangan: Lapangan[];
    terisi?: Terisi[];
    batasBayarMenit: number;
}) {
    const sekarang = new Date();
    const hariIni = awalHari(sekarang);

    const jenisList = [...new Set(lapangan.map((l) => l.jenisLapangan))];
    const [jenis, setJenis] = useState(jenisList[0] ?? '');
    const [tanggal, setTanggal] = useState(hariIni);
    const [sel, setSel] = useState<Pilihan | null>(null);
    const [galat, setGalat] = useState<string | null>(null);
    const [memproses, setMemproses] = useState(false);

    const tampil = lapangan.filter((l) => l.jenisLapangan === jenis);
    const lapPilihan = sel ? (lapangan.find((l) => l.idLapangan === sel.court) ?? null) : null;

    const hari: HariItem[] = Array.from({ length: HARI_KE_DEPAN }, (_, i) => {
        const d = tambahHari(hariIni, i);
        return {
            tanggal: d,
            kosong: tampil.reduce((n, l) => n + jamKosong(terisi, l, d, sekarang), 0),
        };
    });
    const kosongSemua = hari.map((h) => ({
        tanggal: h.tanggal,
        kosong: lapangan.reduce((n, l) => n + jamKosong(terisi, l, h.tanggal, sekarang), 0),
    }));
    const kapasitas = tampil.filter((l) => !sedangPerbaikan(l)).length * (JAM_TUTUP - JAM_BUKA);
    const sudahTutup = isoTanggal(tanggal) === isoTanggal(sekarang) && sekarang.getHours() >= JAM_TUTUP;
    const penuh = kosongSemua.filter((h) => h.kosong === 0).map((h) => h.tanggal);
    const hampirPenuh = kosongSemua
        .filter((h) => h.kosong > 0 && h.kosong <= HAMPIR_PENUH)
        .map((h) => h.tanggal);

    const ubahTanggal = (d: Date) => {
        if (isoTanggal(d) !== isoTanggal(tanggal)) {
            setSel(null);
            setGalat(null);
        }
        setTanggal(d);
    };

    const ubahJenis = (j: string) => {
        if (!lapPilihan || lapPilihan.jenisLapangan !== j) setSel(null);
        setGalat(null);
        setJenis(j);
    };

    const ubahPilihan = (l: Lapangan, r: TimeRange | null) => {
        setSel(
            r
                ? { court: l.idLapangan, start: toMinutes(r.start) / 60, end: toMinutes(r.end) / 60 }
                : null,
        );
        setGalat(null);
    };

    const terisiHariIni = (l: Lapangan): TimeRange[] =>
        terisi
            .filter((t) => t.idLapangan === l.idLapangan && t.tanggal === isoTanggal(tanggal))
            .map((t) => ({ start: t.jamMulai.slice(0, 5), end: t.jamSelesai.slice(0, 5) }));

    const book = () => {
        if (!sel || !lapPilihan) return;
        router.post(
            route('booking.store'),
            {
                idLapangan: lapPilihan.idLapangan,
                tanggal: isoTanggal(tanggal),
                jamMulai: jam(sel.start),
                jamSelesai: jam(sel.end),
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
        // minmax(0,1fr): pita tanggal yang bisa digeser tidak boleh ikut melebarkan halaman
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
            <div className="grid gap-1">
                <h1 id="judul-pesan" className="text-[22px] leading-7 font-semibold tracking-tight">
                    Pesan lapangan
                </h1>
                <p className="text-[15px] text-muted-foreground">
                    Pilih jenis lapangan dan tanggal, lalu ketuk jam yang kosong.
                </p>
            </div>

            {jenisList.length > 1 && (
                <Tabs value={jenis} onValueChange={(v) => ubahJenis(v as string)}>
                    <TabsList
                        variant="line"
                        aria-label="Jenis lapangan"
                        className="w-full justify-start gap-9 rounded-none border-b p-0 group-data-horizontal/tabs:h-auto"
                    >
                        {jenisList.map((j) => (
                            <TabsTrigger
                                key={j}
                                value={j}
                                className="h-auto flex-none justify-start gap-2.5 px-0.5 pt-0 pb-3 text-left text-muted-foreground group-data-horizontal/tabs:after:-bottom-px data-active:text-foreground"
                            >
                                {IKON_JENIS[j] && (
                                    <img src={IKON_JENIS[j]} alt="" width={44} height={44} className="size-11 object-contain" />
                                )}
                                <span className="flex flex-col">
                                    <span className="text-[15px] font-semibold">{j}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {lapangan.filter((l) => l.jenisLapangan === j).length} lapangan
                                    </span>
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            )}

            <DateStrip
                hari={hari}
                terpilih={tanggal}
                penuh={penuh}
                hampirPenuh={hampirPenuh}
                batasTerbatas={kapasitas * PORSI_TERBATAS}
                onSelect={ubahTanggal}
            />
        </div>
    );

    return (
        <PenyewaLayout band={band}>
            <Head title="Home" />

            <div className="grid gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:pb-0">
                <section aria-labelledby="judul-pesan" className="grid min-w-0 gap-4">
                    {galat && (
                        <Alert variant="destructive">
                            <CircleAlert />
                            <AlertTitle>{galat}</AlertTitle>
                        </Alert>
                    )}

                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h2 className="text-[17px] leading-6 font-semibold">{formatTanggal(tanggal)}</h2>
                        <p className="text-sm text-muted-foreground">
                            {sudahTutup ? (
                                <>
                                    <span className="font-medium text-destructive">Tutup</span> · Buka besok pukul{' '}
                                    {jam(JAM_BUKA)}
                                </>
                            ) : (
                                <>
                                    <span className="font-medium text-success">Buka</span> · Tutup pukul {jam(JAM_TUTUP)}
                                </>
                            )}
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {tampil.length === 0 && (
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
                        )}
                        {tampil.map((l) => (
                            <CourtSlotCard
                                key={l.idLapangan}
                                lapangan={l}
                                perbaikan={sedangPerbaikan(l)}
                                jamKosong={jamKosong(terisi, l, tanggal, sekarang)}
                                booked={terisiHariIni(l)}
                                isPast={(start) =>
                                    jamSudahLewat(toMinutes(start) / 60, tanggal, sekarang)
                                }
                                value={
                                    sel && sel.court === l.idLapangan
                                        ? { start: jam(sel.start), end: jam(sel.end) }
                                        : null
                                }
                                onValueChange={(r) => ubahPilihan(l, r)}
                                resetKey={`${isoTanggal(tanggal)}-${sel && sel.court !== l.idLapangan ? 'lain' : 'sendiri'}`}
                            />
                        ))}
                    </div>
                </section>

                <aside className="hidden self-stretch lg:block">
                    <RingkasanBooking
                        lapangan={lapPilihan}
                        pilihan={sel}
                        tanggal={tanggal}
                        memproses={memproses}
                        onBook={book}
                        batasBayarMenit={batasBayarMenit}
                    />
                </aside>
            </div>

            <BarBookingMobile
                lapangan={lapPilihan}
                pilihan={sel}
                tanggal={tanggal}
                onBook={book}
                memproses={memproses}
            />
        </PenyewaLayout>
    );
}
