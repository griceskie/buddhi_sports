import { Button } from '@/Components/ui/button';
import { PaymentStatusBadge } from '@/Components/ui/badge';
import { formatRupiah, formatTanggal, rentangJam } from '@/Components/ui/format';
import { Label } from '@/Components/ui/label';
import { ProofPreview } from '@/Components/ui/proof-review';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/Components/ui/sheet';
import { Textarea } from '@/Components/ui/textarea';
import { ChevronLeft, ChevronRight, CircleAlert, OctagonAlert } from 'lucide-react';
import { useRef, useState } from 'react';

export type BuktiAntrean = {
    idPembayaran: number;
    idBooking: number;
    kode: string;
    namaPenyewa: string;
    namaLapangan: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    tglBayar: string;
    dikirimPada: string | null;
    /** Lama menunggu di jam operasional (08.00–22.00), dalam menit. */
    menitTunggu?: number | null;
    jumlahBayar: number;
    totalBayar: number;
    buktiBayar: string | null;
    buktiPdf: boolean;
    status: string;
    /** Kode booking lain yang sudah dikonfirmasi di jam yang sama; Terima dinonaktifkan. */
    bentrokDengan: string | null;
};

/**
 * Drawer verifikasi bukti bayar (Design System Administrator, DrawerVerifikasi): bukti di kiri, rincian di kanan.
 * Tidak menyimpulkan selisih: Total booking dan Jumlah dibayar ditampilkan berdampingan, Admin yang mencocokkan.
 * Pager "n dari N" mengikuti urutan antrean (FIFO); "Terima & berikutnya" langsung membuka bukti berikutnya.
 */
export default function DrawerVerifikasi({
    buka = true,
    ...props
}: Props & { buka?: boolean }) {
    // isi terakhir dipertahankan selama sheet meluncur keluar; tanpa ini sheet langsung hilang tanpa animasi
    const terakhir = useRef(props.bukti);
    if (props.bukti) terakhir.current = props.bukti;
    const bukti = props.bukti ?? terakhir.current;

    return (
        <Sheet open={buka && !!props.bukti} onOpenChange={(b) => !b && props.onTutup()}>
            <SheetContent className="w-full gap-0 sm:max-w-[880px]">
                {bukti && <IsiDrawer key={bukti.idPembayaran} {...props} bukti={bukti} />}
            </SheetContent>
        </Sheet>
    );
}

type Props = {
    bukti: BuktiAntrean | null;
    /** 0-based di antrean; -1 kalau tidak ada di antrean (sudah diproses). */
    posisi: number;
    jumlah: number;
    adaBerikutnya: boolean;
    onSebelum: () => void;
    onBerikut: () => void;
    onTutup: () => void;
    onTerima?: () => void;
    onTolak?: (alasan: string) => void;
    /** Manager: hanya melihat bukti dan rinciannya, tanpa Terima/Tolak. */
    hanyaLihat?: boolean;
    galatAlasan?: string;
    memproses: boolean;
};

function IsiDrawer({
    bukti,
    posisi,
    jumlah,
    adaBerikutnya,
    onSebelum,
    onBerikut,
    onTutup,
    onTerima,
    onTolak,
    galatAlasan,
    memproses,
    hanyaLihat,
}: Props & { bukti: BuktiAntrean }) {
    const [menolak, setMenolak] = useState(false);
    const [alasan, setAlasan] = useState('');
    const menunggu = bukti.status === 'Menunggu Verifikasi';
    const bentrok = menunggu && !!bukti.bentrokDengan;
    const baris = (label: string, nilai: React.ReactNode) => (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{nilai}</dd>
        </div>
    );

    return (
        <>
        <SheetHeader>
            <SheetTitle>{hanyaLihat ? 'Detail pembayaran' : 'Verifikasi pembayaran'}</SheetTitle>
            <SheetDescription>
                {bukti.kode} · {bukti.namaPenyewa} · {bukti.namaLapangan}
            </SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3 bg-muted/60 p-4 md:p-6">
                <ProofPreview src={bukti.buktiBayar} pdf={bukti.buktiPdf} />
            </div>

            <div className="flex flex-col gap-5 p-4 md:p-6">
                {bentrok ? (
                    <div role="alert" className="flex gap-2.5 rounded-lg bg-accessible-red/10 p-3 text-sm">
                        <OctagonAlert className="mt-0.5 size-4 shrink-0 text-accessible-red" />
                        <span>
                            <span className="block font-medium">Jam bentrok</span>
                            <span className="text-muted-foreground">
                                Jam ini sudah dikonfirmasi untuk booking {bukti.bentrokDengan}. Pembayaran tidak bisa diterima; tolak dengan alasan dan minta penyewa memilih jam lain.
                            </span>
                        </span>
                    </div>
                ) : (
                    menunggu && (
                        <div className="flex gap-2.5 rounded-lg bg-accessible-orange/10 p-3 text-sm">
                            <CircleAlert className="mt-0.5 size-4 shrink-0 text-accessible-orange" />
                            <span>
                                <span className="block font-medium">Perlu dicek</span>
                                <span className="text-muted-foreground">Cocokkan nominal dan nama pengirim dengan booking sebelum menerima.</span>
                            </span>
                        </div>
                    )
                )}

                <dl className="grid gap-2.5 text-sm">
                    {baris('Status', <PaymentStatusBadge status={bukti.status} />)}
                    {baris('Penyewa', bukti.namaPenyewa)}
                    {baris('Lapangan', bukti.namaLapangan)}
                    {baris('Jadwal main', `${formatTanggal(bukti.tanggal, 'd MMM')} · ${rentangJam(bukti.jamMulai, bukti.jamSelesai)}`)}
                    {baris('Tanggal bayar', formatTanggal(bukti.tglBayar, 'EEE, d MMM yyyy'))}
                    <div className="my-1 border-t" />
                    {baris('Total booking', formatRupiah(bukti.totalBayar))}
                    {baris('Jumlah dibayar', formatRupiah(bukti.jumlahBayar))}
                </dl>

                {menolak && (
                    <div className="grid gap-1.5">
                        <Label htmlFor="alasan-tolak">Alasan penolakan</Label>
                        <Textarea
                            id="alasan-tolak"
                            autoFocus
                            rows={3}
                            maxLength={500}
                            placeholder="Contoh: nominal transfer kurang Rp50.000, atau foto bukti tidak terbaca."
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value)}
                            aria-invalid={!!galatAlasan}
                        />
                        {galatAlasan ? (
                            <p className="text-sm text-destructive">{galatAlasan}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Ditampilkan ke penyewa agar bisa mengunggah ulang bukti yang benar.</p>
                        )}
                    </div>
                )}
            </div>
        </div>

        <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 sm:justify-between">
            {posisi >= 0 ? (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label="Bukti sebelumnya" disabled={posisi <= 0} onClick={onSebelum}>
                        <ChevronLeft />
                    </Button>
                    <span className="min-w-16 text-center text-sm text-muted-foreground tabular-nums">
                        {posisi + 1} dari {jumlah}
                    </span>
                    <Button variant="ghost" size="icon" aria-label="Bukti berikutnya" disabled={posisi >= jumlah - 1} onClick={onBerikut}>
                        <ChevronRight />
                    </Button>
                </div>
            ) : (
                <span />
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
                {hanyaLihat ? (
                    <>
                        {menunggu && <span className="text-sm text-muted-foreground">Admin yang menerima atau menolak bukti ini.</span>}
                        <Button variant="outline" onClick={onTutup}>
                            Tutup
                        </Button>
                    </>
                ) : !menunggu ? (
                    <Button variant="outline" onClick={onTutup}>
                        Tutup
                    </Button>
                ) : menolak ? (
                    <>
                        <Button variant="outline" disabled={memproses} onClick={() => setMenolak(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" disabled={memproses || !alasan.trim()} onClick={() => onTolak?.(alasan.trim())}>
                            Tolak pembayaran
                        </Button>
                    </>
                ) : (
                    <>
                        {bentrok && <span className="text-sm text-muted-foreground">Tidak bisa diterima: jam bentrok.</span>}
                        <Button variant="destructive" disabled={memproses || !bukti.buktiBayar} onClick={() => setMenolak(true)}>
                            Tolak
                        </Button>
                        <Button
                            disabled={memproses || !bukti.buktiBayar || bentrok}
                            title={bentrok ? `Jam ini sudah dikonfirmasi untuk ${bukti.bentrokDengan}` : undefined}
                            onClick={onTerima}
                        >
                            {adaBerikutnya ? 'Terima & berikutnya' : 'Terima pembayaran'}
                        </Button>
                    </>
                )}
            </div>
        </SheetFooter>
        </>
    );
}
