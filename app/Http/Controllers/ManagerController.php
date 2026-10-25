<?php

namespace App\Http\Controllers;

use App\Support\Pemesanan;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Panel Manager (PRD bagian 4, Dashboard Manajer Lapangan): melihat pembayaran, lapangan, dan laporan,
 * serta mengelola akun Admin (lihat, tambah, reset password, hapus).
 */
class ManagerController extends Controller
{
    public function dashboard(): Response
    {
        $hariIni = today();
        $pemasukan = fn (Carbon $awal, Carbon $akhir) => (int) DB::table('pembayarans')
            ->where('status', 'Terverifikasi')
            ->whereBetween('tglBayar', [$awal->toDateString(), $akhir->toDateString()])
            ->sum('jumlahBayar');
        $bulanLalu = $hariIni->copy()->subMonthNoOverflow();

        // 12 bulan terakhir, bulan ini paling kiri lalu mundur; dijumlah di PHP agar sama di MySQL dan SQLite (tes)
        $awalGrafik = $hariIni->copy()->startOfMonth()->subMonths(11);
        $perBulan = DB::table('pembayarans')
            ->where('status', 'Terverifikasi')
            ->whereBetween('tglBayar', [$awalGrafik->toDateString(), $hariIni->copy()->endOfMonth()->toDateString()])
            ->get(['tglBayar', 'jumlahBayar'])
            ->groupBy(fn ($p) => substr($p->tglBayar, 0, 7));
        $grafik = collect(range(0, 11))->map(function ($i) use ($hariIni, $perBulan) {
            $bulan = $hariIni->copy()->startOfMonth()->subMonths($i);

            return [
                'bulan' => $bulan->month,
                'tahun' => $bulan->year,
                'totalPemasukan' => (int) ($perBulan->get($bulan->format('Y-m'))?->sum('jumlahBayar') ?? 0),
            ];
        });

        return Inertia::render('Dashboard/Manager', [
            'stat' => [
                'pemasukanBulanIni' => $pemasukan($hariIni->copy()->startOfMonth(), $hariIni->copy()->endOfMonth()),
                'pemasukanBulanLalu' => $pemasukan($bulanLalu->copy()->startOfMonth(), $bulanLalu->copy()->endOfMonth()),
                'pemasukanTahunIni' => $pemasukan($hariIni->copy()->startOfYear(), $hariIni->copy()->endOfYear()),
                'bookingBulanIni' => DB::table('bookings')
                    ->whereIn('status', Pemesanan::STATUS_MENAHAN_JAM)
                    ->whereBetween('tanggal', [$hariIni->copy()->startOfMonth()->toDateString(), $hariIni->copy()->endOfMonth()->toDateString()])
                    ->count(),
            ],
            'grafik' => $grafik,
            'bulanIni' => [
                'bulan' => $hariIni->month,
                'tahun' => $hariIni->year,
                'namaLaporan' => LaporanPembayaranController::namaLaporan($hariIni->month, $hariIni->year),
                'sudahDibuat' => DB::table('laporan_pembayarans')->where('bulan', $hariIni->month)->where('tahun', $hariIni->year)->exists(),
            ],
            'laporan' => $this->laporan()->limit(5)->get(),
        ]);
    }

    public function pembayaran(Request $request): Response
    {
        $awal = MasterPembayaranController::awalPeriode($request);
        $pembayaran = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->whereBetween('pembayarans.tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])
            ->orderBy('pembayarans.tglBayar')
            ->get([
                'pembayarans.idPembayaran', 'pembayarans.idBooking', 'pembayarans.tglBayar', 'pembayarans.jumlahBayar',
                'pembayarans.buktiBayar', 'pembayarans.status', 'pembayarans.alasanTolak', 'bookings.totalBayar', 'penyewas.namaPenyewa', 'lapangans.namaLapangan',
            ]);

        return Inertia::render('Manager/Pembayaran', [
            'periode' => ['bulan' => $awal->month, 'tahun' => $awal->year],
            'ringkasan' => MasterPembayaranController::ringkasan($pembayaran),
            'pembayaran' => $pembayaran->map(fn ($p) => [
                'idPembayaran' => $p->idPembayaran,
                'idBooking' => $p->idBooking,
                'kode' => Pemesanan::kode($p->idBooking),
                'namaPenyewa' => $p->namaPenyewa,
                'namaLapangan' => $p->namaLapangan,
                'tglBayar' => $p->tglBayar,
                'jumlahBayar' => (int) $p->jumlahBayar,
                'totalBayar' => (int) $p->totalBayar,
                'status' => $p->status,
                'alasanTolak' => $p->alasanTolak,
                'buktiBayar' => $p->buktiBayar ? route('pembayaran.bukti', $p->idPembayaran) : null,
                'buktiPdf' => str_ends_with(strtolower((string) $p->buktiBayar), '.pdf'),
            ]),
        ]);
    }

    public function lapangan(): Response
    {
        return Inertia::render('Manager/Lapangan', [
            'lapangan' => DB::table('lapangans')->orderBy('idLapangan')->get(),
        ]);
    }

    public function laporanPembayaran(): Response
    {
        return Inertia::render('Manager/LaporanPembayaran', [
            'laporan' => $this->laporan()->get(),
        ]);
    }

    /** Manager menandai laporan sudah diperiksa; sejak itu Admin tidak bisa membuat ulang, mengedit, atau menghapusnya. */
    public function tandaiDiperiksa(int $idLaporan): RedirectResponse
    {
        $laporan = DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->first(['namaLaporan', 'filePdf', 'diperiksaPada']);
        abort_if($laporan === null, 404);

        if (! $laporan->filePdf) {
            return back()->with('error', 'Laporan ini belum punya PDF, jadi belum bisa diperiksa.');
        }

        if (! $laporan->diperiksaPada) {
            DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->update(['diperiksaPada' => now()]);
        }

        return back()->with('success', "{$laporan->namaLaporan} ditandai sudah diperiksa.");
    }

    public function admin(): Response
    {
        return Inertia::render('Manager/Admin', [
            'admin' => DB::table('admins')->orderBy('namaAdmin')->get(['idAdmin', 'namaAdmin', 'username']),
        ]);
    }

    public function tambahAdmin(Request $request): RedirectResponse
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:admins,username',
            'password' => 'required|string|min:6',
        ]);

        DB::table('admins')->insert([
            'namaAdmin' => $request->nama,
            'username' => $request->username,
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', "Admin {$request->nama} ditambahkan.");
    }

    public function resetPasswordAdmin(Request $request, int $idAdmin): RedirectResponse
    {
        $request->validate(['password' => 'required|string|min:6']);
        $nama = DB::table('admins')->where('idAdmin', $idAdmin)->value('namaAdmin');
        abort_if($nama === null, 404);

        DB::table('admins')->where('idAdmin', $idAdmin)->update(['password' => Hash::make($request->password)]);

        return back()->with('success', "Password {$nama} diganti.");
    }

    public function hapusAdmin(int $idAdmin): RedirectResponse
    {
        try {
            DB::table('admins')->where('idAdmin', $idAdmin)->delete();
        } catch (QueryException $e) {
            // masih dirujuk booking/pembayaran/laporan (foreign key)
            return back()->with('error', 'Admin tidak bisa dihapus karena masih tercatat di booking, pembayaran, atau laporan.');
        }

        return back()->with('success', 'Admin dihapus.');
    }

    /** Laporan terbaru dulu, dengan nama Admin pembuatnya. */
    private function laporan()
    {
        return DB::table('laporan_pembayarans')
            ->leftJoin('admins', 'admins.idAdmin', '=', 'laporan_pembayarans.idAdmin')
            ->orderByDesc('laporan_pembayarans.tahun')
            ->orderByDesc('laporan_pembayarans.bulan')
            ->select([
                'laporan_pembayarans.idLaporan', 'laporan_pembayarans.namaLaporan', 'laporan_pembayarans.bulan',
                'laporan_pembayarans.tahun', 'laporan_pembayarans.totalPemasukan', 'laporan_pembayarans.tglLaporan',
                'laporan_pembayarans.filePdf', 'laporan_pembayarans.diperiksaPada', 'admins.namaAdmin',
            ]);
    }
}
