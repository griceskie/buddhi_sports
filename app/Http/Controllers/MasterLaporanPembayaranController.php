<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\Pemesanan;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MasterLaporanPembayaranController extends Controller
{

    public function tampilData(){

        $varlaporan = DB::table('laporan_pembayarans')->get();
        return Inertia::render('Master/LaporanPembayaran/TampilData', [
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
            'txttotal' => 'required|integer|min:0',
            'txttgllaporan' => 'required|date',
            'txtpembayaran' => 'nullable|integer',
        ]);

        DB::table('laporan_pembayarans') -> insert ([
            'idAdmin' => $request->txtadmin,
            'idManager' => $request->txtmanager,
            'bulan' => $request->txtbulan,
            'tahun' => $request->txttahun,
            'totalPemasukan' => $request->txttotal,
            'tglLaporan' => $request->txttgllaporan,
            'idPembayaran' => $request->txtpembayaran,
        ]);

        return redirect('/tampillaporanpembayaran');
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtadmin' => 'required|integer',
            'txtmanager' => 'required|integer',
            'txtbulan' => 'required|integer|min:1|max:12',
            'txttahun' => 'required|integer',
            'txttotal' => 'required|integer|min:0',
            'txttgllaporan' => 'required|date',
            'txtpembayaran' => 'nullable|integer',
        ]);

        if ($this->sudahDiperiksa($request->txtid)) {
            return back()->with('error', 'Laporan ini sudah diperiksa Manager, jadi tidak bisa diubah.');
        }

        DB::table('laporan_pembayarans')
        -> where('idLaporan', $request->txtid)
        ->update([
            'idAdmin' => $request->txtadmin,
            'idManager' => $request->txtmanager,
            'bulan' => $request->txtbulan,
            'tahun' => $request->txttahun,
            'totalPemasukan' => $request->txttotal,
            'tglLaporan' => $request->txttgllaporan,
            'idPembayaran' => $request->txtpembayaran,
        ]);

        return redirect('/tampillaporanpembayaran');
    }

    public function deleteDataLaporanPembayaran($idhapus){
        if ($this->sudahDiperiksa($idhapus)) {
            return redirect('/tampillaporanpembayaran')->with('error', 'Laporan ini sudah diperiksa Manager, jadi tidak bisa dihapus.');
        }

        $pdf = DB::table('laporan_pembayarans')->where('idLaporan', $idhapus)->value('filePdf');
        try {
            DB::table('laporan_pembayarans')->where('idLaporan', $idhapus)->delete();
        } catch (QueryException $e) {
            return redirect('/tampillaporanpembayaran')->with('error', 'Laporan tidak bisa dihapus.');
        }
        if ($pdf) {
            Storage::disk('local')->delete($pdf);
        }

        return redirect('/tampillaporanpembayaran');
    }

    // laporan yang sudah diperiksa Manager terkunci
    private function sudahDiperiksa($idLaporan): bool
    {
        return DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->whereNotNull('diperiksaPada')->exists();
    }
}
