<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\LogAktivitas;
use App\Support\Pemesanan;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MasterPembayaranController extends Controller
{

    /** Awal bulan dari ?periode=YYYY-MM, bawaannya bulan ini. Dipakai juga halaman Pembayaran Manager. */
    public static function awalPeriode(Request $request): Carbon
    {
        $periode = $request->query('periode');

        return is_string($periode) && preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $periode, $m)
            ? Carbon::create((int) $m[1], (int) $m[2], 1)
            : today()->startOfMonth();
    }

    /** Jumlah dan total pembayaran per status untuk widget Total pemasukan dan Status pembayaran. */
    public static function ringkasan(Collection $pembayaran): array
    {
        $per = fn (string $status) => [
            'jumlah' => $pembayaran->where('status', $status)->count(),
            'total' => (int) $pembayaran->where('status', $status)->sum('jumlahBayar'),
        ];

        return [
            'terverifikasi' => $per('Terverifikasi'),
            'menunggu' => $per('Menunggu Verifikasi'),
            'ditolak' => $per('Ditolak'),
        ];
    }

    public function tampilData(Request $request){

        $awal = self::awalPeriode($request);
        $bulan = $awal->month;
        $tahun = $awal->year;

        $varpembayaran = DB::table('pembayarans')
            ->whereBetween('tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])
            ->orderBy('tglBayar')
            ->get();

        // bukti bayar periode ini untuk DrawerVerifikasi (klik baris tabel), terlama dikirim di atas
        $bukti = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->whereBetween('pembayarans.tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])
            ->orderByRaw('pembayarans.dikirimPada IS NULL')->orderBy('pembayarans.dikirimPada')->orderBy('pembayarans.idPembayaran')
            ->get([
                'pembayarans.idPembayaran', 'pembayarans.tglBayar', 'pembayarans.jumlahBayar', 'pembayarans.buktiBayar', 'pembayarans.status', 'pembayarans.dikirimPada',
                'bookings.idBooking', 'bookings.idLapangan', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.totalBayar',
                'penyewas.namaPenyewa', 'lapangans.namaLapangan',
            ])
            ->map(fn ($p) => AdminDashboardController::bukti($p));

        return Inertia::render('Master/Pembayaran/TampilData', [
            'datapembayaran' => $varpembayaran,
            'bukti' => $bukti,
            'periode' => ['bulan' => $bulan, 'tahun' => $tahun],
            'namaLaporan' => LaporanPembayaranController::namaLaporan($bulan, $tahun),
            'ringkasan' => self::ringkasan($varpembayaran),
            'laporan' => DB::table('laporan_pembayarans')->where('bulan', $bulan)->where('tahun', $tahun)
                ->first(['idLaporan', 'namaLaporan', 'tglLaporan', 'filePdf', 'diperiksaPada']),
            'datamanager' => DB::table('managers')->orderBy('namaManager')->get(['idManager', 'namaManager']),
            // kode, penyewa, dan jadwal untuk tabel dan pilihan Booking di form
            'databooking' => DB::table('bookings')
                ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
                ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
                ->orderByDesc('bookings.idBooking')
                ->get(['bookings.idBooking', 'bookings.tanggal', 'penyewas.namaPenyewa', 'lapangans.namaLapangan'])
                ->map(fn ($b) => (array) $b + ['kode' => Pemesanan::kode($b->idBooking)]),
            'dataadmin' => DB::table('admins')->get(),
        ]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtadmin' => 'nullable|integer',
            'txtbooking' => 'required|integer',
            'txttglbayar' => 'required|date',
            'txtjumlah' => 'required|integer|min:0',
            'txtbukti' => 'nullable|string|max:255',
            'txtstatus' => 'required|string|max:255',
            'txtalasan' => 'required_if:txtstatus,Ditolak|nullable|string|max:500',
        ], ['txtalasan.required_if' => 'Tulis alasan penolakan untuk penyewa.']);

        // satu booking hanya boleh punya satu pembayaran
        $sudahAda = DB::table('pembayarans')->where('idBooking', $request->txtbooking)->exists();
        if ($sudahAda) {
            return back()->withErrors(['txtbooking' => 'Booking ini sudah memiliki data pembayaran.']);
        }

        $data = [
            'idAdmin' => $request->txtadmin,
            'idBooking' => $request->txtbooking,
            'tglBayar' => $request->txttglbayar,
            'jumlahBayar' => $request->txtjumlah,
            'buktiBayar' => $request->txtbukti,
            'status' => $request->txtstatus,
            'alasanTolak' => $request->txtstatus === 'Ditolak' ? $request->txtalasan : null,
        ];
        if ($data['status'] === 'Terverifikasi') {
            $data['diverifikasiPada'] = now();
        }
        DB::transaction(function () use ($data) {
            DB::table('pembayarans')->insert($data);
            LogAktivitas::catat('tambah', 'Pembayaran', Pemesanan::kode((int) $data['idBooking']), LogAktivitas::selisih('Pembayaran', null, $data));
        });

        return back();
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtadmin' => 'nullable|integer',
            'txtbooking' => 'required|integer',
            'txttglbayar' => 'required|date',
            'txtjumlah' => 'required|integer|min:0',
            'txtbukti' => 'nullable|string|max:255',
            'txtstatus' => 'required|string|max:255',
            'txtalasan' => 'required_if:txtstatus,Ditolak|nullable|string|max:500',
        ], ['txtalasan.required_if' => 'Tulis alasan penolakan untuk penyewa.']);

        // booking tidak boleh dipindah ke booking lain yang sudah punya pembayaran
        $sudahAda = DB::table('pembayarans')
            ->where('idBooking', $request->txtbooking)
            ->where('idPembayaran', '!=', $request->txtid)
            ->exists();
        if ($sudahAda) {
            return back()->withErrors(['txtbooking' => 'Booking ini sudah memiliki data pembayaran lain.']);
        }

        $data = [
            'idAdmin' => $request->txtadmin,
            'idBooking' => $request->txtbooking,
            'tglBayar' => $request->txttglbayar,
            'jumlahBayar' => $request->txtjumlah,
            'buktiBayar' => $request->txtbukti,
            'status' => $request->txtstatus,
            'alasanTolak' => $request->txtstatus === 'Ditolak' ? $request->txtalasan : null,
        ];
        $lama = (array) DB::table('pembayarans')->where('idPembayaran', $request->txtid)->first();
        // waktu verifikasi hanya diisi saat status berubah menjadi Terverifikasi (KPI dashboard)
        if ($data['status'] === 'Terverifikasi' && ($lama['status'] ?? null) !== 'Terverifikasi') {
            $data['diverifikasiPada'] = now();
        }
        DB::transaction(function () use ($request, $data, $lama) {
            DB::table('pembayarans')
            -> where('idPembayaran', $request->txtid)
            ->update($data);
            LogAktivitas::catat('ubah', 'Pembayaran', Pemesanan::kode((int) $data['idBooking']), LogAktivitas::selisih('Pembayaran', $lama, $data));
        });

        return back();
    }

    public function deleteDataPembayaran($idhapus){
        try {
            $lama = (array) DB::table('pembayarans')->where('idPembayaran', $idhapus)->first();
            DB::transaction(function () use ($idhapus, $lama) {
                DB::table('pembayarans')->where('idPembayaran', $idhapus)->delete();
                LogAktivitas::catat('hapus', 'Pembayaran', isset($lama['idBooking']) ? Pemesanan::kode((int) $lama['idBooking']) : '#'.$idhapus, LogAktivitas::selisih('Pembayaran', $lama, null));
            });
        } catch (QueryException $e) {
            // masih dirujuk oleh laporan pembayaran
            return redirect('/tampilpembayaran')->with('error', 'Pembayaran tidak bisa dihapus karena masih digunakan pada laporan pembayaran.');
        }

        return redirect('/tampilpembayaran');
    }
}
