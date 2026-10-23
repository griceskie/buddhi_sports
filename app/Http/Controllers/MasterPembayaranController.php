<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MasterPembayaranController extends Controller
{

    public function tampilData(Request $request){

        // periode bulanan dari ?periode=YYYY-MM, bawaannya bulan ini
        $periode = $request->query('periode');
        $awal = is_string($periode) && preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $periode, $m)
            ? Carbon::create((int) $m[1], (int) $m[2], 1)
            : today()->startOfMonth();
        $bulan = $awal->month;
        $tahun = $awal->year;

        $varpembayaran = DB::table('pembayarans')
            ->whereBetween('tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])
            ->orderBy('tglBayar')
            ->get();
        $per = fn (string $status) => [
            'jumlah' => $varpembayaran->where('status', $status)->count(),
            'total' => (int) $varpembayaran->where('status', $status)->sum('jumlahBayar'),
        ];

        return Inertia::render('Master/Pembayaran/TampilData', [
            'datapembayaran' => $varpembayaran,
            'periode' => ['bulan' => $bulan, 'tahun' => $tahun],
            'namaLaporan' => LaporanPembayaranController::namaLaporan($bulan, $tahun),
            'ringkasan' => [
                'terverifikasi' => $per('Terverifikasi'),
                'menunggu' => $per('Menunggu Verifikasi'),
                'ditolak' => $per('Ditolak'),
            ],
            'laporan' => DB::table('laporan_pembayarans')->where('bulan', $bulan)->where('tahun', $tahun)
                ->first(['idLaporan', 'namaLaporan', 'tglLaporan', 'filePdf']),
            'datamanager' => DB::table('managers')->orderBy('namaManager')->get(['idManager', 'namaManager']),
            'databooking' => DB::table('bookings')->get(),
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
        ]);

        // satu booking hanya boleh punya satu pembayaran
        $sudahAda = DB::table('pembayarans')->where('idBooking', $request->txtbooking)->exists();
        if ($sudahAda) {
            return back()->withErrors(['txtbooking' => 'Booking ini sudah memiliki data pembayaran.']);
        }

        DB::table('pembayarans') -> insert ([
            'idAdmin' => $request->txtadmin,
            'idBooking' => $request->txtbooking,
            'tglBayar' => $request->txttglbayar,
            'jumlahBayar' => $request->txtjumlah,
            'buktiBayar' => $request->txtbukti,
            'status' => $request->txtstatus,
        ]);

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
        ]);

        // booking tidak boleh dipindah ke booking lain yang sudah punya pembayaran
        $sudahAda = DB::table('pembayarans')
            ->where('idBooking', $request->txtbooking)
            ->where('idPembayaran', '!=', $request->txtid)
            ->exists();
        if ($sudahAda) {
            return back()->withErrors(['txtbooking' => 'Booking ini sudah memiliki data pembayaran lain.']);
        }

        DB::table('pembayarans')
        -> where('idPembayaran', $request->txtid)
        ->update([
            'idAdmin' => $request->txtadmin,
            'idBooking' => $request->txtbooking,
            'tglBayar' => $request->txttglbayar,
            'jumlahBayar' => $request->txtjumlah,
            'buktiBayar' => $request->txtbukti,
            'status' => $request->txtstatus,
        ]);

        return back();
    }

    public function deleteDataPembayaran($idhapus){
        try {
            DB::table('pembayarans')->where('idPembayaran', $idhapus)->delete();
        } catch (QueryException $e) {
            // masih dirujuk oleh laporan pembayaran
            return redirect('/tampilpembayaran')->with('error', 'Pembayaran tidak bisa dihapus karena masih digunakan pada laporan pembayaran.');
        }

        return redirect('/tampilpembayaran');
    }
}
