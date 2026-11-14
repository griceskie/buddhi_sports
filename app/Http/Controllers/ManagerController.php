<?php

namespace App\Http\Controllers;

use App\Support\AnalitikBisnis;
use App\Support\LogAktivitas;
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
    /**
     * Pemantauan: cermin dashboard Admin tanpa tombol tindakan (data dari AdminDashboardController::dataHariIni),
     * ditambah aktivitas hari ini. Halaman ini diperbarui otomatis lewat polling Inertia.
     */
    public function dashboard(Request $request): Response
    {
        return Inertia::render('Manager/Pemantauan', [
            ...app(AdminDashboardController::class)->dataHariIni($request),
            'aktivitas' => $this->aktivitasHariIni(),
        ]);
    }

    /**
     * Bukti bayar yang dikirim penyewa hari ini dan tindakan pengelola hari ini (dari Log aktivitas), terbaru di atas.
     *
     * @return list<array<string, mixed>>
     */
    private function aktivitasHariIni(): array
    {
        $hariIni = today()->toDateString();
        $kirim = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->whereDate('pembayarans.dikirimPada', $hariIni)
            ->get(['pembayarans.idPembayaran', 'pembayarans.dikirimPada', 'bookings.idBooking', 'penyewas.namaPenyewa'])
            ->map(fn ($r) => [
                'id' => 'kirim-'.$r->idPembayaran,
                'waktu' => Carbon::parse($r->dikirimPada)->toIso8601String(),
                'siapa' => $r->namaPenyewa,
                'peran' => 'penyewa',
                'aksi' => 'kirim',
                'teks' => 'mengirim bukti bayar '.Pemesanan::kode($r->idBooking),
                'catatan' => null,
            ]);
        $log = DB::table('log_aktivitas')
            ->whereDate('waktu', $hariIni)
            ->orderByDesc('id')->limit(30)
            ->get(['id', 'waktu', 'idAdmin', 'namaAdmin', 'peran', 'aksi', 'jenisObjek', 'kodeObjek', 'catatan'])
            ->map(fn ($r) => [
                'id' => 'log-'.$r->id,
                'waktu' => Carbon::parse($r->waktu)->toIso8601String(),
                'siapa' => $r->namaAdmin,
                'peran' => $r->peran ?? ($r->idAdmin ? 'admin' : 'sistem'),
                'aksi' => $r->aksi,
                'teks' => (LogAktivitas::KATA_KERJA[$r->aksi] ?? $r->aksi).' '.strtolower($r->jenisObjek).' '.$r->kodeObjek,
                'catatan' => $r->catatan,
            ]);

        return $kirim->concat($log)->sortByDesc('waktu')->take(30)->values()->all();
    }

    /** Analisis bisnis: periode dan tab dari query string, semua angka dihitung di AnalitikBisnis. */
    public function analisis(Request $request)
    {
        $q = $request->validate([
            'jenis' => 'nullable|in:'.implode(',', AnalitikBisnis::JENIS),
            'tab' => 'nullable|in:'.implode(',', AnalitikBisnis::TAB),
            'th' => 'nullable|integer|min:2000|max:2100',
            'bl' => 'nullable|integer|min:1|max:12',
            'q' => 'nullable|integer|min:1|max:4',
            'rentang' => 'nullable|in:awal,6,12,pilih',
            'dari' => 'nullable|date_format:Y-m-d',
            'sampai' => 'nullable|date_format:Y-m-d|after_or_equal:dari',
        ]);

        return Inertia::render('Manager/Analisis', (new AnalitikBisnis)->halaman($q));
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
            DB::transaction(function () use ($idLaporan, $laporan) {
                DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->update(['diperiksaPada' => now(), 'catatanRevisi' => null, 'revisiPada' => null]);
                LogAktivitas::catat('periksa', 'Laporan', $laporan->namaLaporan ?? '#'.$idLaporan, [['Status', 'Menunggu diperiksa', 'Sudah diperiksa']]);
            });
        }

        return back()->with('success', "{$laporan->namaLaporan} ditandai sudah diperiksa.");
    }

    /** Manager meminta Admin memperbaiki laporan; Admin melihat catatannya dan membuat ulang laporan (itu mengosongkan permintaan ini). */
    public function mintaRevisi(Request $request, int $idLaporan): RedirectResponse
    {
        $request->validate(
            ['catatan' => 'required|string|max:500'],
            ['catatan.required' => 'Tulis catatan revisi untuk Admin.', 'catatan.max' => 'Catatan maksimal 500 karakter.'],
        );
        $laporan = DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->first(['namaLaporan', 'filePdf', 'diperiksaPada']);
        abort_if($laporan === null, 404);

        if ($laporan->diperiksaPada) {
            return back()->with('error', 'Laporan ini sudah diperiksa, jadi tidak bisa diminta revisi.');
        }
        if (! $laporan->filePdf) {
            return back()->with('error', 'Laporan ini belum punya PDF.');
        }

        DB::transaction(function () use ($request, $idLaporan, $laporan) {
            DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->update(['catatanRevisi' => trim($request->catatan), 'revisiPada' => now()]);
            LogAktivitas::catat('revisi', 'Laporan', $laporan->namaLaporan ?? '#'.$idLaporan, [['Status', 'Menunggu diperiksa', 'Perlu revisi']], mb_substr(trim($request->catatan), 0, 255));
        });

        return back()->with('success', "Permintaan revisi {$laporan->namaLaporan} dikirim ke Admin.");
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

        DB::transaction(function () use ($request) {
            DB::table('admins')->insert([
                'namaAdmin' => $request->nama,
                'username' => $request->username,
                'password' => Hash::make($request->password),
            ]);
            LogAktivitas::catat('tambah', 'Admin', $request->username, [['Nama', '—', $request->nama], ['Username', '—', $request->username]]);
        });

        return back()->with('success', "Admin {$request->nama} ditambahkan.");
    }

    public function resetPasswordAdmin(Request $request, int $idAdmin): RedirectResponse
    {
        $request->validate(['password' => 'required|string|min:6']);
        $admin = DB::table('admins')->where('idAdmin', $idAdmin)->first(['namaAdmin', 'username']);
        abort_if($admin === null, 404);
        $nama = $admin->namaAdmin;

        DB::transaction(function () use ($request, $idAdmin, $admin) {
            DB::table('admins')->where('idAdmin', $idAdmin)->update(['password' => Hash::make($request->password)]);
            // isi password tidak pernah dicatat
            LogAktivitas::catat('reset', 'Admin', $admin->username, [['Password', '••••••', 'Diganti']]);
        });

        return back()->with('success', "Password {$nama} diganti.");
    }

    public function hapusAdmin(int $idAdmin): RedirectResponse
    {
        $admin = DB::table('admins')->where('idAdmin', $idAdmin)->first(['namaAdmin', 'username']);
        try {
            DB::transaction(function () use ($idAdmin, $admin) {
                DB::table('admins')->where('idAdmin', $idAdmin)->delete();
                if ($admin) {
                    LogAktivitas::catat('hapus', 'Admin', $admin->username, [['Nama', $admin->namaAdmin, '—']]);
                }
            });
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
                'laporan_pembayarans.filePdf', 'laporan_pembayarans.diperiksaPada', 'laporan_pembayarans.catatanRevisi',
                'laporan_pembayarans.revisiPada', 'admins.namaAdmin',
            ]);
    }
}
