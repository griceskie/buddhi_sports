import CourtSlotCard from '@/Components/booking/CourtSlotCard';
import DateStrip, { HariItem } from '@/Components/booking/DateStrip';
import {
    awalHari,
    HAMPIR_PENUH,
    HARI_KE_DEPAN,
    isoTanggal,
    jamKosong,
    Lapangan,
    Pilihan,
    pilihJam,
    sedangPerbaikan,
    statusJam,
    tambahHari,
    Terisi,
} from '@/Components/booking/jadwal';
import RingkasanBooking, { BarBookingMobile } from '@/Components/booking/RingkasanBooking';
import { formatTanggal } from '@/Components/ui/format';
import { ToggleGroup, ToggleGroupItem } from '@/Components/ui/toggle-group';
import PenyewaLayout from '@/Layouts/PenyewaLayout';
import { Head } from '@inertiajs/react';
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
    const [bentrok, setBentrok] = useState<number | null>(null);
    const [catatan, setCatatan] = useState(false);

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
            setBentrok(null);
            setCatatan(false);
        }
        setTanggal(d);
    };

    const ubahJenis = (j: string) => {
        if (!lapPilihan || lapPilihan.jenisLapangan !== j) setSel(null);
        setBentrok(null);
        setCatatan(false);
        setJenis(j);
    };

    const klikJam = (l: Lapangan, h: number) => {
        const hasil = pilihJam(
            sel,
            l.idLapangan,
            h,
            (x) => statusJam(terisi, l.idLapangan, x, tanggal, sekarang) === 'free',
        );
        setSel(hasil.sel);
        setBentrok(hasil.bentrok ? l.idLapangan : null);
        setCatatan(false);
    };

    const book = () => setCatatan(true);

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
                            <ToggleGroup
                                aria-label="Jenis lapangan"
                                value={[jenis]}
                                onValueChange={(v) => v[0] && ubahJenis(v[0])}
                            >
                                {jenisList.map((j) => (
                                    <ToggleGroupItem key={j} value={j}>
                                        {j}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        )}
                    </div>

                    <DateStrip
                        hari={hari}
                        terpilih={tanggal}
                        penuh={penuh}
                        hampirPenuh={hampirPenuh}
                        onSelect={ubahTanggal}
                    />

                    <div className="mt-2.5 mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                        <span className="font-semibold">{formatTanggal(tanggal)}</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <i className="size-3.5 rounded-[4px] border bg-background" />
                                Kosong
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="size-3.5 rounded-[4px] bg-primary" />
                                Dipilih
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="size-3.5 rounded-[4px] bg-fills-tertiary" />
                                Sudah dipesan
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {tampil.length === 0 && (
                            <p className="rounded-lg border bg-card p-4 text-muted-foreground">
                                Belum ada lapangan yang tersedia.
                            </p>
                        )}
                        {tampil.map((l) => (
                            <CourtSlotCard
                                key={l.idLapangan}
                                lapangan={l}
                                perbaikan={sedangPerbaikan(l)}
                                jamKosong={jamKosong(terisi, l, tanggal, sekarang)}
                                statusJam={(h) =>
                                    statusJam(terisi, l.idLapangan, h, tanggal, sekarang)
                                }
                                pilihan={sel && sel.court === l.idLapangan ? sel : null}
                                bentrok={bentrok === l.idLapangan}
                                onPick={(h) => klikJam(l, h)}
                            />
                        ))}
                    </div>
                </section>

                <aside className="hidden lg:block">
                    <RingkasanBooking
                        lapangan={lapPilihan}
                        pilihan={sel}
                        tanggal={tanggal}
                        catatan={catatan}
                        onBook={book}
                    />
                </aside>
            </div>

            <BarBookingMobile
                lapangan={lapPilihan}
                pilihan={sel}
                tanggal={tanggal}
                onBook={book}
            />
        </PenyewaLayout>
    );
}
