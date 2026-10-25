import CourtSlotCard from '@/Components/booking/CourtSlotCard';
import DateStrip, { HariItem } from '@/Components/booking/DateStrip';
import {
    awalHari,
    HAMPIR_PENUH,
    HARI_KE_DEPAN,
    isoTanggal,
    jam,
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

export default function Dashboard({
    lapangan,
    terisi = [],
}: {
    lapangan: Lapangan[];
    terisi?: Terisi[];
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

    return (
        <PenyewaLayout>
            <Head title="Home" />

            <div className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:pb-0">
                <section aria-labelledby="judul-pesan" className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1
                                id="judul-pesan"
                                className="text-xl leading-7 font-semibold tracking-tight"
                            >
                                Pesan lapangan
                            </h1>
                            <p className="mt-0.5 text-muted-foreground">
                                Pilih tanggal, lalu ketuk jam yang kosong.
                            </p>
                        </div>

                        {jenisList.length > 1 && (
                            <Tabs value={jenis} onValueChange={(v) => ubahJenis(v as string)}>
                                <TabsList aria-label="Jenis lapangan">
                                    {jenisList.map((j) => (
                                        <TabsTrigger key={j} value={j}>
                                            {j}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        )}
                    </div>

                    {galat && (
                        <Alert variant="destructive" className="mb-4">
                            <CircleAlert />
                            <AlertTitle>{galat}</AlertTitle>
                        </Alert>
                    )}

                    <DateStrip
                        hari={hari}
                        terpilih={tanggal}
                        penuh={penuh}
                        hampirPenuh={hampirPenuh}
                        onSelect={ubahTanggal}
                    />

                    <p className="mt-2.5 mb-4 font-semibold">{formatTanggal(tanggal)}</p>

                    <div className="grid gap-3">
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

                <aside className="hidden lg:block">
                    <RingkasanBooking
                        lapangan={lapPilihan}
                        pilihan={sel}
                        tanggal={tanggal}
                        memproses={memproses}
                        onBook={book}
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
