<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AnalitikLaporan;
use App\Support\LogAktivitas;
use App\Support\Pemesanan;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MasterLaporanPembayaranController extends Controller
{

    /** Laporan diserahkan paling lambat tanggal ini bulan berikutnya. */
    public const BATAS_SERAH = 5;

    public function tampilData(Request $request){

        $varlaporan = DB::table('laporan_pembayarans')->get();

        // periode yang dilihat: ?periode=YYYY-MM, bawaannya bulan ini (sama seperti halaman Pembayaran)
        $periode = $request->query('periode');
        $awal = is_string($periode) && preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $periode, $m)
            ? Carbon::create((int) $m[1], (int) $m[2], 1)
            : today()->startOfMonth();

        $laporan = $varlaporan->first(fn ($l) => (int) $l->bulan === $awal->month && (int) $l->tahun === $awal->year);
        $menunggu = DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')
            ->whereBetween('tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])->count();
        $mulaiCatat = collect([DB::table('pembayarans')->min('tglBayar'), DB::table('bookings')->min('tanggal')])->filter()->min();
        $kini = today()->startOfMonth();
        $batas = $awal->copy()->addMonth()->day(self::BATAS_SERAH);

        $keadaan = match (true) {
            $mulaiCatat && $awal->lt(Carbon::parse($mulaiCatat)->startOfMonth()) => 'kosong',
            $awal->gt($kini) => 'depan',
            $awal->eq($kini) => 'berjalan',
            $laporan && $laporan->diperiksaPada => 'cek',
            $laporan && $laporan->revisiPada => 'revisi',
            $laporan && $laporan->filePdf => 'belum',
            $menunggu > 0 => 'tertahan',
            default => 'siap',
        };

        return Inertia::render('Master/LaporanPembayaran/TampilData', [
            'tinjauan' => [
                'periode' => ['bulan' => $awal->month, 'tahun' => $awal->year],
                'namaLaporan' => LaporanPembayaranController::namaLaporan($awal->month, $awal->year),
                'keadaan' => $keadaan,
                'menunggu' => $menunggu,
                'laporan' => $laporan ? [
                    'idLaporan' => $laporan->idLaporan, 'tglLaporan' => $laporan->tglLaporan, 'filePdf' => $laporan->filePdf,
                    'diperiksaPada' => $laporan->diperiksaPada, 'revisiPada' => $laporan->revisiPada, 'catatanRevisi' => $laporan->catatanRevisi,
                    'idManager' => $laporan->idManager, 'idAdmin' => $laporan->idAdmin,
                ] : null,
                'awalBerikut' => $awal->copy()->addMonth()->toDateString(),
                'batasSerah' => $batas->toDateString(),
                'hariTerlambat' => max(0, (int) $batas->diffInDays(today(), false)),
                'ringkasan' => MasterPembayaranController::ringkasan(DB::table('pembayarans')
                    ->whereBetween('tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])->get()),
                'tahunTersedia' => range($kini->year, min($kini->year, $mulaiCatat ? Carbon::parse($mulaiCatat)->year : $kini->year)),
                'kini' => AnalitikLaporan::untuk($awal),
                'lalu' => AnalitikLaporan::untuk($awal->copy()->subMonth()),
            ],
            'datalaporan' => $varlaporan,
            'dataadmin' => DB::table('admins')->get(),
            'datamanager' => DB::table('managers')->get(),
            // kode booking dan penyewa untuk pilihan Pembayaran di form
            'datapembayaran' => DB::table('pembayarans')
                ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
                ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
                ->orderByDesc('pembayarans.idPembayaran')
                ->get(['pembayarans.idPembayaran', 'pembayarans.idBooking', 'pembayarans.jumlahBayar', 'penyewas.namaPenyewa'])
                ->map(fn ($p) => (array) $p + ['kode' => Pemesanan::kode($p->idBooking)]),
        ]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtadmin' => 'required|integer',
            'txtmanager' => 'required|integer',
            'txtbulan' => 'required|integer|min:1|max:12',
            'txttahun' => 'required|integer',
            'txttgllaporan' => 'required|date',
            'txtpembayaran' => 'nullable|integer',
        ]);

        if (DB::table('laporan_pembayarans')->where('bulan', $request->txtbulan)->where('tahun', $request->txttahun)->exists()) {
            return back()->withErrors(['txtbulan' => 'Laporan periode ini sudah ada. Ubah laporan yang ada, atau buat ulang dari tombol Buat laporan.']);
        }

        $data = [
            'idAdmin' => $request->txtadmin,
            'idManager' => $request->txtmanager,
            'bulan' => $request->txtbulan,
            'tahun' => $request->txttahun,
            'totalPemasukan' => self::totalPeriode((int) $request->txtbulan, (int) $request->txttahun),
            'tglLaporan' => $request->txttgllaporan,
            'idPembayaran' => $request->txtpembayaran,
        ];
        DB::transaction(function () use ($data) {
            DB::table('laporan_pembayarans')->insert($data);
            LogAktivitas::catat('tambah', 'Laporan', LaporanPembayaranController::namaLaporan((int) $data['bulan'], (int) $data['tahun']), LogAktivitas::selisih('Laporan', null, $data));
        });

        return redirect('/tampillaporanpembayaran');
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtadmin' => 'required|integer',
            'txtmanager' => 'required|integer',
            'txtbulan' => 'required|integer|min:1|max:12',
            'txttahun' => 'required|integer',
            'txttgllaporan' => 'required|date',
            'txtpembayaran' => 'nullable|integer',
        ]);

        if ($this->sudahDiperiksa($request->txtid)) {
            return back()->with('error', 'Laporan ini sudah diperiksa Manager, jadi tidak bisa diubah.');
        }

        $lama = (array) DB::table('laporan_pembayarans')->where('idLaporan', $request->txtid)->first();
        abort_if(! $lama, 404);
        // periode tidak bisa dipindah dan total selalu dihitung dari pembayaran terverifikasi bulan itu
        $data = [
            'idAdmin' => $request->txtadmin,
            'idManager' => $request->txtmanager,
            'totalPemasukan' => self::totalPeriode((int) $lama['bulan'], (int) $lama['tahun']),
            'tglLaporan' => $request->txttgllaporan,
            'idPembayaran' => $request->txtpembayaran,
        ];
        DB::transaction(function () use ($request, $data, $lama) {
            DB::table('laporan_pembayarans')
            -> where('idLaporan', $request->txtid)
            ->update($data);
            LogAktivitas::catat('ubah', 'Laporan', LaporanPembayaranController::namaLaporan((int) $lama['bulan'], (int) $lama['tahun']), LogAktivitas::selisih('Laporan', $lama, $data));
        });

        return redirect('/tampillaporanpembayaran');
    }

    public function deleteDataLaporanPembayaran($idhapus){
        if ($this->sudahDiperiksa($idhapus)) {
            return redirect('/tampillaporanpembayaran')->with('error', 'Laporan ini sudah diperiksa Manager, jadi tidak bisa dihapus.');
        }

        // laporan yang sudah diserahkan ke Manager (dan tidak sedang direvisi) mengunci pembayaran bulannya; menghapusnya membuka kunci itu
        $diserahkan = DB::table('laporan_pembayarans')->where('idLaporan', $idhapus)->whereNotNull('filePdf')->whereNull('revisiPada')->exists();
        if ($diserahkan) {
            return redirect('/tampillaporanpembayaran')->with('error', 'Laporan ini sudah diserahkan ke Manager, jadi tidak bisa dihapus. Minta Manager mengembalikannya untuk direvisi bila ada yang salah.');
        }

        $pdf = DB::table('laporan_pembayarans')->where('idLaporan', $idhapus)->value('filePdf');
        try {
            $lama = (array) DB::table('laporan_pembayarans')->where('idLaporan', $idhapus)->first();
            DB::transaction(function () use ($idhapus, $lama) {
                DB::table('laporan_pembayarans')->where('idLaporan', $idhapus)->delete();
                LogAktivitas::catat('hapus', 'Laporan', LaporanPembayaranController::namaLaporan((int) ($lama['bulan'] ?? 1), (int) ($lama['tahun'] ?? 0)), LogAktivitas::selisih('Laporan', $lama, null));
            });
        } catch (QueryException $e) {
            return redirect('/tampillaporanpembayaran')->with('error', 'Laporan tidak bisa dihapus.');
        }
        if ($pdf) {
            Storage::disk('local')->delete($pdf);
        }

        return redirect('/tampillaporanpembayaran');
    }

    /** Total pembayaran Terverifikasi menurut tanggal bayar dalam satu bulan (sama dengan PDF laporan). */
    private static function totalPeriode(int $bulan, int $tahun): int
    {
        $awal = Carbon::create($tahun, $bulan, 1);

        return (int) DB::table('pembayarans')->where('status', 'Terverifikasi')
            ->whereBetween('tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])->sum('jumlahBayar');
    }

    // laporan yang sudah diperiksa Manager terkunci
    private function sudahDiperiksa($idLaporan): bool
    {
        return DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->whereNotNull('diperiksaPada')->exists();
    }
}
