import DateStrip, { HariItem } from '@/Components/booking/DateStrip';
import GaleriLapangan from '@/Components/booking/GaleriLapangan';
import HeaderBeranda from '@/Components/booking/HeaderBeranda';
import IslandStatus from '@/Components/booking/IslandStatus';
import {
    awalHari,
    HARI_KE_DEPAN,
    JAM_BUKA,
    isoTanggal,
    jam,
    jamKosong,
    jamKosongPertama,
    jamSudahLewat,
    Lapangan,
    Pilihan,
    sedangPerbaikan,
    sisaHariIni,
    statusGor,
    tambahHari,
    Terisi,
} from '@/Components/booking/jadwal';
import KartuJam from '@/Components/booking/KartuJam';
import RingkasanBooking, { BarBookingMobile } from '@/Components/booking/RingkasanBooking';
import { useSekarangPerMenit } from '@/Components/booking/StatusBuka';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/Components/ui/empty';
import { toMinutes } from '@/Components/ui/format';
import { TimeRange } from '@/Components/ui/slot-picker';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head, router } from '@inertiajs/react';
import { CalendarX, CircleAlert, MoonStar } from 'lucide-react';
import { useRef, useState } from 'react';

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
    // hari ini sudah habis (GOR tutup atau jam terakhir sudah dimulai): mulai dari besok, hari ini diberi label
    const akhirHari = sisaHariIni(sekarang);
    const [tanggal, setTanggal] = useState(() => tambahHari(hariIni, akhirHari ? 1 : 0));
    const [jamPilihan, setJamPilihan] = useState<Jam | 'auto' | null>('auto');
    const [galat, setGalat] = useState<string | null>(null);
    const [memproses, setMemproses] = useState(false);
    // titik status di header diklik: tampilkan island jam buka
    const [mintaIsland, setMintaIsland] = useState(0);
    const gor = statusGor(useSekarangPerMenit());
    const kartuJamRef = useRef<HTMLElement>(null);

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
        return {
            tanggal: d,
            kosong: lapAktif ? jamKosong(terisi, lapAktif, d, sekarang) : 0,
            tutup: i === 0 && akhirHari ? (akhirHari === 'tutup' ? 'Tutup' : 'Lewat') : undefined,
        };
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

    // "Pesan sekarang" di galeri: geser ke kartu jam (HP: header tidak menempel; mulai sm: di bawah header ringkas)
    const keKartuJam = () => {
        const el = kartuJamRef.current;
        if (!el) return;
        const jarak = window.matchMedia('(min-width: 640px)').matches ? 104 : 16;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - jarak, behavior: 'smooth' });
    };

    const header = (
        <HeaderBeranda
            jenisList={jenisList}
            jenis={jenis}
            onJenis={ubahJenis}
            lapangan={tampil}
            value={lapAktif?.idLapangan ?? null}
            onLapangan={ubahLapangan}
            jamKosong={(l) => jamKosong(terisi, l, tanggal, sekarang)}
            buka={gor.buka}
            onStatus={() => setMintaIsland((n) => n + 1)}
        />
    );

    return (
        <PenyewaLayout nav={header}>
            <Head title="Home" />

            <div className="-mt-2 grid grid-cols-[minmax(0,1fr)] gap-6 pb-40 sm:pb-24 lg:pb-0">
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
                        <section aria-labelledby="judul-lapangan" className="grid grid-cols-[minmax(0,1fr)] gap-4">
                            <h1 id="judul-lapangan" className="text-callout font-semibold sm:text-body">
                                {lapAktif.namaLapangan}
                            </h1>
                            <GaleriLapangan key={lapAktif.idLapangan} lapangan={lapAktif} onPesan={keKartuJam} />
                        </section>

                        <DateStrip hari={hari} terpilih={tanggal} batasTerbatas={BATAS_TERBATAS} onSelect={ubahTanggal} />

                        {akhirHari && (
                            <Alert variant="warning">
                                <MoonStar />
                                <AlertTitle>
                                    {akhirHari === 'tutup' ? 'GOR sudah tutup untuk hari ini' : 'Jam hari ini sudah habis'}
                                </AlertTitle>
                                <AlertDescription>
                                    {akhirHari === 'tutup'
                                        ? `Buka lagi besok pukul ${jam(JAM_BUKA)}. `
                                        : 'Jam terakhir hari ini sudah dimulai. '}
                                    Anda tetap bisa booking untuk besok dan seterusnya.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <section ref={kartuJamRef} aria-label="Pilih jam" className="min-w-0">
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

            <IslandStatus buka={gor.buka} bukaLagi={gor.bukaLagi} minta={mintaIsland} />

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
