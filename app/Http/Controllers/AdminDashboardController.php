<?php

namespace App\Http\Controllers;

use App\Support\Pemesanan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        Pemesanan::batalkanKedaluwarsa();
        $hariIni = today();
        // ?tanggal=YYYY-MM-DD hanya mengganti kartu Jadwal; angka statistik tetap untuk hari ini
        $tanggal = $request->query('tanggal');
        $dipilih = is_string($tanggal) && Carbon::canBeCreatedFromFormat($tanggal, '!Y-m-d')
            ? Carbon::createFromFormat('!Y-m-d', $tanggal)
            : null;
        // tanggal yang meluap (2026-02-30) dianggap tidak sah
        $tanggalJadwal = $dipilih && $dipilih->toDateString() === $tanggal ? $dipilih : $hariIni;
        $jam = fn (object $b) => (int) substr($b->jamSelesai, 0, 2) - (int) substr($b->jamMulai, 0, 2);

        $lapangan = DB::table('lapangans')->orderBy('idLapangan')->get(['idLapangan', 'namaLapangan', 'jenisLapangan']);

        $jadwalAntara = fn (Carbon $dari, Carbon $sampai) => DB::table('bookings')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->leftJoin('pembayarans', 'pembayarans.idBooking', '=', 'bookings.idBooking')
            ->whereBetween('bookings.tanggal', [$dari->toDateString(), $sampai->toDateString()])
            // yang belum bayar tidak ditampilkan: tidak menahan jam dan bisa banyak yang bertumpuk di jam yang sama
            ->where(fn ($q) => $q->whereIn('bookings.status', Pemesanan::STATUS_MENAHAN_JAM)
                ->orWhere(fn ($q) => $q->where('bookings.status', 'Dipesan')->where('pembayarans.status', 'Menunggu Verifikasi')))
            ->orderBy('bookings.tanggal')->orderBy('bookings.jamMulai')
            ->get([
                'bookings.idBooking', 'bookings.idLapangan', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.status',
                'penyewas.namaPenyewa', 'pembayarans.idPembayaran', 'pembayarans.status as statusPembayaran',
            ]);
        $jadwalHariIni = $jadwalAntara($hariIni, $hariIni);
        // kartu Jadwal menerima beberapa minggu sekaligus agar pindah hari di browser tanpa request
        $jadwalDari = $tanggalJadwal->copy()->subDays(7);
        $jadwalSampai = $tanggalJadwal->copy()->addDays(Pemesanan::HARI_KE_DEPAN);
        $jadwal = $jadwalAntara($jadwalDari, $jadwalSampai);

        $pendapatan = fn ($awal, $akhir) => (int) DB::table('pembayarans')
            ->where('status', 'Terverifikasi')
            ->whereBetween('tglBayar', [$awal->toDateString(), $akhir->toDateString()])
            ->sum('jumlahBayar');

        return Inertia::render('Dashboard/Admin', [
            'stat' => [
                'bookingHariIni' => $jadwalHariIni->count(),
                'menungguVerifikasi' => DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')->count(),
                'pendapatanBulanIni' => $pendapatan($hariIni->copy()->startOfMonth(), $hariIni->copy()->endOfMonth()),
                'pendapatanBulanLalu' => $pendapatan($hariIni->copy()->subMonthNoOverflow()->startOfMonth(), $hariIni->copy()->subMonthNoOverflow()->endOfMonth()),
                'jamTerisi' => $jadwalHariIni->filter(fn ($b) => in_array($b->status, Pemesanan::STATUS_MENAHAN_JAM))->sum($jam),
                'jamTotal' => $lapangan->count() * (Pemesanan::JAM_TUTUP - Pemesanan::JAM_BUKA),
            ],
            'lapangan' => $lapangan,
            'tanggalJadwal' => $tanggalJadwal->toDateString(),
            'jadwalDari' => $jadwalDari->toDateString(),
            'jadwalSampai' => $jadwalSampai->toDateString(),
            'jadwal' => $jadwal->map(fn ($b) => [
                'idBooking' => $b->idBooking,
                'idLapangan' => $b->idLapangan,
                'tanggal' => $b->tanggal,
                'jamMulai' => substr($b->jamMulai, 0, 5),
                'jamSelesai' => substr($b->jamSelesai, 0, 5),
                'namaPenyewa' => $b->namaPenyewa,
                'status' => $b->status,
                'statusPembayaran' => $b->statusPembayaran,
                'idPembayaran' => $b->idPembayaran,
            ]),
            'antrean' => DB::table('pembayarans')
                ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
                ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
                ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
                ->where('pembayarans.status', 'Menunggu Verifikasi')
                ->orderBy('pembayarans.idPembayaran')
                ->get([
                    'pembayarans.idPembayaran', 'pembayarans.tglBayar', 'pembayarans.jumlahBayar', 'pembayarans.buktiBayar', 'pembayarans.status',
                    'bookings.idBooking', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.totalBayar',
                    'penyewas.namaPenyewa', 'lapangans.namaLapangan',
                ])
                ->map(fn ($p) => [
                    'idPembayaran' => $p->idPembayaran,
                    'idBooking' => $p->idBooking,
                    'kode' => Pemesanan::kode($p->idBooking),
                    'namaPenyewa' => $p->namaPenyewa,
                    'namaLapangan' => $p->namaLapangan,
                    'tanggal' => $p->tanggal,
                    'jamMulai' => substr($p->jamMulai, 0, 5),
                    'jamSelesai' => substr($p->jamSelesai, 0, 5),
                    'tglBayar' => $p->tglBayar,
                    'jumlahBayar' => (int) $p->jumlahBayar,
                    'totalBayar' => (int) $p->totalBayar,
                    'buktiBayar' => $p->buktiBayar ? route('pembayaran.bukti', $p->idPembayaran) : null,
                    'buktiPdf' => str_ends_with(strtolower((string) $p->buktiBayar), '.pdf'),
                    'status' => $p->status,
                ]),
            'terbaru' => DB::table('bookings')
                ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
                ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
                ->leftJoin('pembayarans', 'pembayarans.idBooking', '=', 'bookings.idBooking')
                ->orderByDesc('bookings.idBooking')
                ->limit(6)
                ->get([
                    'bookings.idBooking', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.totalBayar', 'bookings.status',
                    'penyewas.namaPenyewa', 'lapangans.namaLapangan', 'pembayarans.status as statusPembayaran',
                ])
                ->map(fn ($b) => [
                    'idBooking' => $b->idBooking,
                    'kode' => Pemesanan::kode($b->idBooking),
                    'namaPenyewa' => $b->namaPenyewa,
                    'namaLapangan' => $b->namaLapangan,
                    'tanggal' => $b->tanggal,
                    'jamMulai' => substr($b->jamMulai, 0, 5),
                    'jamSelesai' => substr($b->jamSelesai, 0, 5),
                    'totalBayar' => (int) $b->totalBayar,
                    'status' => $b->status,
                    'statusPembayaran' => $b->statusPembayaran,
                ]),
        ]);
    }

    public function terima(int $idPembayaran): RedirectResponse
    {
        $hasil = DB::transaction(function () use ($idPembayaran) {
            $p = $this->pembayaran($idPembayaran);
            if ($pesan = $this->belumBisaDiputuskan($p)) {
                return ['error' => $pesan];
            }

            // kunci lapangan: dua Admin yang menerima jam yang sama bersamaan tidak boleh sama-sama lolos
            DB::table('lapangans')->where('idLapangan', $p->idLapangan)->lockForUpdate()->first();
            $bentrok = DB::table('bookings')
                ->where('idLapangan', $p->idLapangan)
                ->where('tanggal', $p->tanggal)
                ->where('idBooking', '!=', $p->idBooking)
                ->whereIn('status', Pemesanan::STATUS_MENAHAN_JAM)
                ->where('jamMulai', '<', $p->jamSelesai)
                ->where('jamSelesai', '>', $p->jamMulai)
                ->exists();
            if ($bentrok) {
                return ['error' => Pemesanan::kode($p->idBooking).' bentrok dengan booking lain yang sudah dikonfirmasi di jam yang sama. Tolak pembayaran ini.'];
            }

            DB::table('pembayarans')->where('idPembayaran', $idPembayaran)
                ->update(['status' => 'Terverifikasi', 'alasanTolak' => null, 'idAdmin' => Auth::guard('admin')->id()]);
            DB::table('bookings')->where('idBooking', $p->idBooking)
                ->update(['status' => 'Dikonfirmasi', 'idAdmin' => Auth::guard('admin')->id()]);

            return ['success' => Pemesanan::kode($p->idBooking).' ('.$p->namaPenyewa.') kini Dikonfirmasi.'];
        });

        return back()->with($hasil);
    }

    public function tolak(Request $request, int $idPembayaran): RedirectResponse
    {
        // penyewa perlu tahu apa yang salah sebelum mengunggah ulang
        $request->validate(
            ['alasan' => 'required|string|max:500'],
            ['alasan.required' => 'Tulis alasan penolakan untuk penyewa.', 'alasan.max' => 'Alasan maksimal 500 karakter.'],
        );
        $p = $this->pembayaran($idPembayaran);
        if ($pesan = $this->belumBisaDiputuskan($p)) {
            return back()->with('error', $pesan);
        }

        DB::table('pembayarans')->where('idPembayaran', $idPembayaran)
            ->update(['status' => 'Ditolak', 'alasanTolak' => trim($request->alasan), 'idAdmin' => Auth::guard('admin')->id()]);

        return back()->with('error', 'Bukti '.Pemesanan::kode($p->idBooking).' ('.$p->namaPenyewa.') ditolak. Booking tetap Dipesan, penyewa bisa mengunggah ulang.');
    }

    private function pembayaran(int $idPembayaran): object
    {
        $p = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->where('pembayarans.idPembayaran', $idPembayaran)
            ->first([
                'pembayarans.status as statusPembayaran', 'bookings.idBooking', 'bookings.idLapangan', 'bookings.tanggal',
                'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.status', 'penyewas.namaPenyewa',
            ]);
        abort_if(! $p, 404);

        return $p;
    }

    private function belumBisaDiputuskan(object $p): ?string
    {
        if ($p->statusPembayaran !== 'Menunggu Verifikasi') {
            return 'Pembayaran '.Pemesanan::kode($p->idBooking).' sudah diproses sebelumnya.';
        }
        if ($p->status !== 'Dipesan') {
            return 'Booking '.Pemesanan::kode($p->idBooking).' berstatus '.$p->status.', tidak sedang menunggu pembayaran.';
        }

        return null;
    }
}
