import { BarisBatang, DaftarBatang, DeretMetrik, Grafik, GrafikBatang, Kartu, Metrik, Sub, Tujuan } from './bagian';

export type DataPendapatan = {
    metrik: Metrik[];
    grafik: Grafik;
    perLapangan: { nama: string; warna: string; nilai: string; porsi: string; lebar: number }[];
    perOlahraga: { nama: string; warna: string; nilai: string; lebar: number; ket: string }[];
    bocor: {
        batal: string;
        batalKet: string;
        tolak: string;
        tolakKet: string;
        sebab: (BarisBatang & { nilai: string; wawasan: string })[];
        daftarTolak: { judul: string; rinci: string; nilai: string }[];
        sisaTolak: string;
    };
};

export default function TabPendapatan({ data, onPilih }: { data: DataPendapatan; onPilih: (t: Tujuan) => void }) {
    const b = data.bocor;
    return (
        <>
            <Kartu judul="Pendapatan" ket="Dihitung dari pembayaran terverifikasi menurut tanggal bayar, sama seperti laporan pembayaran">
                <DeretMetrik metrik={data.metrik} />
                <Sub>
                    <GrafikBatang grafik={data.grafik} onPilih={onPilih} />
                </Sub>
                <div className="grid grid-cols-[minmax(0,1fr)] gap-8 border-t pt-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                    <div className="flex min-w-0 flex-col gap-3.5">
                        <span className="font-medium">Per lapangan</span>
                        <ul className="flex flex-col gap-3.5">
                            {data.perLapangan.map((l) => (
                                <li key={l.nama} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto_48px] items-center gap-3">
                                    <span className="flex items-center gap-2 truncate font-medium">
                                        <span aria-hidden className="size-2.5 shrink-0 rounded-[2px]" style={{ background: l.warna }} />
                                        {l.nama}
                                    </span>
                                    <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full" style={{ width: `${l.lebar}%`, background: l.warna }} />
                                    </div>
                                    <span className="text-right font-medium tabular-nums">{l.nilai}</span>
                                    <span className="text-right text-muted-foreground tabular-nums">{l.porsi}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex min-w-0 flex-col gap-3.5">
                        <span className="font-medium">Per olahraga</span>
                        <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
                            {data.perOlahraga.map((o) => (
                                <div key={o.nama} style={{ width: `${o.lebar}%`, background: o.warna }} />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {data.perOlahraga.map((o) => (
                                <div key={o.nama} className="flex flex-col gap-0.5">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: o.warna }} />
                                        {o.nama}
                                    </span>
                                    <span className="text-xl font-semibold tabular-nums">{o.nilai}</span>
                                    <span className="min-h-10 text-sm text-muted-foreground">{o.ket}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Kartu>

            <Kartu judul="Pemasukan yang tidak jadi masuk" ket="Booking yang batal dan bukti bayar yang ditolak di periode ini.">
                <div className="grid gap-6 sm:grid-cols-2">
                    <Angka judul="Nilai booking yang batal" nilai={b.batal} ket={b.batalKet} />
                    <Angka judul="Bukti yang masih ditolak" nilai={b.tolak} ket={b.tolakKet} garis />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-2">
                    <div className="flex flex-col gap-3.5 border-t pt-5">
                        <span className="font-medium">Kenapa dibatalkan</span>
                        <DaftarBatang baris={b.sebab} />
                    </div>
                    <div className="flex flex-col gap-3 border-t pt-5">
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium">Bukti yang belum dikirim ulang</span>
                            <span className="text-sm text-muted-foreground">Admin sudah menolak bukti ini. Penyewa belum mengirim yang baru.</span>
                        </div>
                        {/* tinggi tetap 3 baris supaya kartu tidak bergeser saat periode berganti */}
                        <div className="relative h-[170px] overflow-hidden rounded-lg border">
                            {b.daftarTolak.length ? (
                                <ul className="divide-y">
                                    {b.daftarTolak.map((r) => (
                                        <li key={r.judul} className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3.5">
                                            <span className="flex min-w-0 flex-col">
                                                <span className="truncate font-medium">{r.judul}</span>
                                                <span className="truncate text-sm text-muted-foreground">{r.rinci}</span>
                                            </span>
                                            <span className="font-medium whitespace-nowrap tabular-nums">{r.nilai}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Tidak ada bukti yang ditolak di periode ini.</div>
                            )}
                        </div>
                        <div className="flex min-h-11 flex-col gap-0.5">
                            <span className="min-h-5 font-medium">{b.sisaTolak}</span>
                            <span className="text-sm text-muted-foreground">Bukti yang sudah dikirim ulang tidak muncul lagi di daftar ini.</span>
                        </div>
                    </div>
                </div>
            </Kartu>
        </>
    );
}

export function Angka({ judul, nilai, ket, garis }: { judul: string; nilai: string; ket: string; garis?: boolean }) {
    return (
        <div className={garis ? 'flex flex-col gap-1.5 sm:border-l sm:pl-6' : 'flex flex-col gap-1.5'}>
            <span className="font-medium text-muted-foreground">{judul}</span>
            <span className="text-3xl font-semibold tracking-tight tabular-nums">{nilai}</span>
            <span className="min-h-[60px] text-sm text-muted-foreground">{ket}</span>
        </div>
    );
}
