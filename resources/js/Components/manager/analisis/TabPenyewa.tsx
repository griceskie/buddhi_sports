import { DeretMetrik, Grafik, GrafikBatang, Kartu, Metrik, Sub, Tujuan } from './bagian';

export type DataPenyewa = {
    metrik: Metrik[];
    grafik: Grafik;
    top: { porsi: string; ket: string; daftar: { no: number; nama: string; ket: string; nilai: string; porsi: string; lebar: number }[] };
    berhenti: { daftar: { nama: string; ket: string; rinci: string; nilai: string }[]; sisa: string };
};

export default function TabPenyewa({ data, onPilih }: { data: DataPenyewa; onPilih: (t: Tujuan) => void }) {
    return (
        <>
            <Kartu judul="Penyewa" ket="Dihitung dari penyewa yang pembayarannya diterima di periode ini.">
                <DeretMetrik metrik={data.metrik} />
                <Sub>
                    <GrafikBatang grafik={data.grafik} onPilih={onPilih} tinggi={200} />
                </Sub>
            </Kartu>
            <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-6 lg:grid-cols-2">
                <Kartu judul="Penyewa dengan pembayaran terbesar" ket="Lima penyewa dengan total pembayaran terbesar di periode ini." className="gap-5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2.5">
                            <span className="text-3xl font-semibold tracking-tight tabular-nums">{data.top.porsi}</span>
                            <span className="text-muted-foreground">dari pemasukan</span>
                        </div>
                        <span className="min-h-10 text-sm text-muted-foreground">{data.top.ket}</span>
                    </div>
                    <ul className="flex flex-col">
                        {data.top.daftar.map((p) => (
                            <li key={p.no} className="grid h-[60px] grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 border-t">
                                <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-muted text-sm font-medium tabular-nums">
                                    {p.no}
                                </span>
                                <span className="flex min-w-0 flex-col gap-1">
                                    <span className="flex items-baseline justify-between gap-2">
                                        <span className="truncate font-medium">{p.nama}</span>
                                        <span className="text-sm whitespace-nowrap text-muted-foreground">{p.ket}</span>
                                    </span>
                                    <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <span className="block h-full rounded-full bg-primary" style={{ width: `${p.lebar}%` }} />
                                    </span>
                                </span>
                                <span className="flex min-w-24 flex-col items-end">
                                    <span className="font-medium whitespace-nowrap tabular-nums">{p.nilai}</span>
                                    <span className="text-sm text-muted-foreground">{p.porsi}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-auto rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">Kalau persen ini terlalu besar, pemasukan bergantung pada sedikit penyewa.</p>
                </Kartu>
                <Kartu judul="Penyewa yang berhenti datang" ket="Pernah booking minimal 3 kali, tapi tidak booking lagi dalam 60 hari terakhir periode." className="gap-5">
                    <div className="relative flex min-h-[300px] flex-col">
                        {data.berhenti.daftar.length ? (
                            <>
                                <ul>
                                    {data.berhenti.daftar.map((x) => (
                                        <li key={x.nama} className="grid h-[60px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t">
                                            <span className="flex min-w-0 flex-col">
                                                <span className="truncate font-medium">{x.nama}</span>
                                                <span className="text-sm whitespace-nowrap text-muted-foreground">{x.ket}</span>
                                            </span>
                                            <span className="flex flex-col items-end">
                                                <span className="font-medium whitespace-nowrap tabular-nums">{x.nilai}</span>
                                                <span className="text-sm text-muted-foreground">{x.rinci}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <span className="min-h-5 pt-2 font-medium">{data.berhenti.sisa}</span>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                                Tidak ada penyewa tetap yang berhenti datang di periode ini.
                            </div>
                        )}
                    </div>
                    <p className="mt-auto rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">Penyewa ini bisa dihubungi Admin untuk ditawari jadwal lagi.</p>
                </Kartu>
            </div>
        </>
    );
}
