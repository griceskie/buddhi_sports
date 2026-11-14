import DrawerVerifikasi, { BuktiAntrean } from '@/Components/admin/DrawerVerifikasi';
import BadgeTip, { tipPembayaran } from '@/Components/pengelola/BadgeTip';
import DataTable, { NilaiFilter } from '@/Components/pengelola/DataTable';
import JudulHalaman from '@/Components/pengelola/JudulHalaman';
import { Ringkasan } from '@/Components/RingkasanPembayaran';
import { PaymentStatusBadge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { formatJam, formatRupiah, formatTanggal, rentangJam } from '@/Components/ui/format';
import { Label } from '@/Components/ui/label';
import { Period, PeriodPicker } from '@/Components/ui/period-picker';
import AdminSidebarLayout from '@/Layouts/AdminSidebarLayout';
import { Head, router } from '@inertiajs/react';
import { cn } from 'cn';
import { Eye } from 'lucide-react';
import { useState } from 'react';

type Pembayaran = BuktiAntrean & { alasanTolak: string | null; diverifikasiPada: string | null };

const TAB = [
    { id: 'semua', label: 'Semua', ringkasan: null },
    { id: 'Menunggu Verifikasi', label: 'Menunggu verifikasi', ringkasan: 'menunggu' },
    { id: 'Terverifikasi', label: 'Terverifikasi', ringkasan: 'terverifikasi' },
    { id: 'Ditolak', label: 'Ditolak', ringkasan: 'ditolak' },
] as const;

/** Pembayaran untuk Manager: hanya dilihat. Klik baris membuka bukti dan rinciannya; Admin yang menerima atau menolak. */
export default function Pembayaran({ periode, ringkasan, pembayaran }: { periode: Period; ringkasan: Ringkasan; pembayaran: Pembayaran[] }) {
    const [filterStatus, setFilterStatus] = useState<NilaiFilter>({});
    const [dilihat, setDilihat] = useState<number | null>(null);
    const aktif = filterStatus.status?.[0] ?? 'semua';
    const daftar = aktif === 'semua' ? pembayaran : pembayaran.filter((p) => p.status === aktif);
    const posisi = daftar.findIndex((p) => p.idPembayaran === dilihat);
    const bukti = pembayaran.find((p) => p.idPembayaran === dilihat) ?? null;
    const totalSemua = pembayaran.reduce((t, p) => t + p.jumlahBayar, 0);

    const ubahPeriode = (p: Period) =>
        router.get(route('manager.pembayaran'), { periode: `${p.tahun}-${String(p.bulan).padStart(2, '0')}` }, { preserveScroll: true, preserveState: true, replace: true });

    return (
        <AdminSidebarLayout
            header={
                <JudulHalaman judul="Data pembayaran" deskripsi="Bukti transfer dari penyewa per bulan. Admin yang menerima atau menolak bukti.">
                    <Label>Periode</Label>
                    <PeriodPicker value={periode} onValueChange={ubahPeriode} />
                </JudulHalaman>
            }
        >
            <Head title="Pembayaran" />

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="tablist" aria-label="Status pembayaran">
                {TAB.map((t) => {
                    const isi = t.ringkasan ? ringkasan[t.ringkasan] : { jumlah: pembayaran.length, total: totalSemua };
                    return (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={aktif === t.id}
                            onClick={() => setFilterStatus(t.id === 'semua' ? {} : { status: [t.id] })}
                            className={cn(
                                'flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border bg-background px-3.5 py-2.5 text-left transition-colors hover:bg-muted',
                                aktif === t.id && 'border-primary ring-1 ring-primary',
                            )}
                        >
                            <span className={cn('text-sm font-medium', aktif === t.id ? 'text-primary' : 'text-muted-foreground')}>{t.label}</span>
                            <span className="text-lg leading-[26px] font-semibold tabular-nums">{isi.jumlah}</span>
                            <span className="text-muted-foreground tabular-nums">{formatRupiah(isi.total)}</span>
                        </button>
                    );
                })}
            </div>

            <DataTable
                baris={pembayaran}
                kunci={(r) => r.idPembayaran}
                satuan="pembayaran"
                cari={(r) => `${r.kode} ${r.namaPenyewa}`}
                placeholderCari="Cari kode booking atau penyewa…"
                nilaiFilter={filterStatus}
                onNilaiFilter={setFilterStatus}
                bukaBaris={(r) => setDilihat(r.idPembayaran)}
                filter={[
                    {
                        id: 'status',
                        label: 'Status',
                        nilai: (r) => r.status,
                        tersembunyi: true,
                        opsi: TAB.filter((t) => t.id !== 'semua').map((t) => ({ id: t.id, label: t.label })),
                    },
                ]}
                kolom={[
                    { id: 'kode', label: 'Kode', tetap: true, className: 'tabular-nums', urut: (r) => r.kode, render: (r) => r.kode },
                    { id: 'penyewa', label: 'Penyewa', className: 'font-medium', urut: (r) => r.namaPenyewa, render: (r) => r.namaPenyewa },
                    { id: 'lapangan', label: 'Lapangan', urut: (r) => r.namaLapangan, render: (r) => r.namaLapangan },
                    {
                        id: 'jadwal',
                        label: 'Jadwal main',
                        className: 'text-muted-foreground tabular-nums',
                        urut: (r) => `${r.tanggal} ${r.jamMulai}`,
                        render: (r) => `${formatTanggal(r.tanggal, 'd MMM')} · ${rentangJam(r.jamMulai, r.jamSelesai)}`,
                    },
                    {
                        id: 'tgl',
                        label: 'Dikirim',
                        className: 'text-muted-foreground tabular-nums',
                        urut: (r) => r.dikirimPada ?? r.tglBayar,
                        render: (r) => (r.dikirimPada ? `${formatTanggal(r.dikirimPada.slice(0, 10), 'd MMM')}, ${formatJam(r.dikirimPada.slice(11, 16))}` : formatTanggal(r.tglBayar, 'd MMM')),
                    },
                    {
                        id: 'jumlah',
                        label: 'Jumlah',
                        className: 'pr-8 text-right tabular-nums',
                        urut: (r) => r.jumlahBayar,
                        render: (r) => (
                            <>
                                {formatRupiah(r.jumlahBayar)}
                                {r.jumlahBayar < r.totalBayar && <span className="block text-accessible-red">Kurang {formatRupiah(r.totalBayar - r.jumlahBayar)}</span>}
                            </>
                        ),
                    },
                    {
                        id: 'status',
                        label: 'Status',
                        urut: (r) => TAB.findIndex((t) => t.id === r.status),
                        render: (r) => (
                            <BadgeTip tip={tipPembayaran(r)}>
                                <PaymentStatusBadge status={r.status} />
                            </BadgeTip>
                        ),
                    },
                ]}
                aksi={(r) => (
                    <Button variant="ghost" size="icon" aria-label={`Lihat ${r.kode}`} className="text-muted-foreground" onClick={() => setDilihat(r.idPembayaran)}>
                        <Eye />
                    </Button>
                )}
            />

            <DrawerVerifikasi
                hanyaLihat
                bukti={bukti}
                posisi={posisi}
                jumlah={daftar.length}
                adaBerikutnya={false}
                onSebelum={() => posisi > 0 && setDilihat(daftar[posisi - 1].idPembayaran)}
                onBerikut={() => posisi >= 0 && posisi < daftar.length - 1 && setDilihat(daftar[posisi + 1].idPembayaran)}
                onTutup={() => setDilihat(null)}
                memproses={false}
            />
        </AdminSidebarLayout>
    );
}
