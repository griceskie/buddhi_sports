<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\Pemesanan;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MasterBookingController extends Controller
{

    public function tampilData(){

        $varbooking = DB::table('bookings')->get();
        return Inertia::render('Master/Booking/TampilData', [
            'databooking' => $varbooking,
            // hanya kolom yang dipakai form; jangan kirim hash password ke browser
            'datapenyewa' => DB::table('penyewas')->orderBy('namaPenyewa')->get(['idPenyewa', 'namaPenyewa', 'email']),
            'datalapangan' => DB::table('lapangans')->get(),
            'dataadmin' => DB::table('admins')->get(['idAdmin', 'namaAdmin']),
            // form Tambah langsung memilih Admin yang sedang bertugas
            'idAdminLogin' => Auth::guard('admin')->id(),
        ]);
    }

    // aturan bersama Tambah dan Edit booking
    private function validasiBooking(Request $request, array $tambahan = []): void
    {
        $jam = fn (int $dari, int $sampai) => array_map(fn ($h) => sprintf('%02d:00', $h), range($dari, $sampai));
        $buka = sprintf('%02d:00', Pemesanan::JAM_BUKA);
        $tutup = sprintf('%02d:00', Pemesanan::JAM_TUTUP);

        $request->validate($tambahan + [
            'txtpenyewa' => 'required|integer',
            'txtlapangan' => 'required|integer',
            // booking manual diisi di lokasi, jadi Admin yang bertugas wajib tercatat
            'txtadmin' => 'required|integer|exists:admins,idAdmin',
            'txttanggal' => 'required|date',
            // jam bulat dalam jam operasional; jam selesai harus setelah jam mulai
            'txtjammulai' => ['required', Rule::in($jam(Pemesanan::JAM_BUKA, Pemesanan::JAM_TUTUP - 1))],
            'txtjamselesai' => ['required', Rule::in($jam(Pemesanan::JAM_BUKA + 1, Pemesanan::JAM_TUTUP)), 'after:txtjammulai'],
            'txttotal' => 'required|integer|min:0',
            'txtstatus' => ['required', Rule::in(Pemesanan::STATUS)],
        ], [
            'txtjammulai.in' => "Pilih jam mulai antara {$buka} dan ".sprintf('%02d:00', Pemesanan::JAM_TUTUP - 1).'.',
            'txtjamselesai.in' => 'Pilih jam selesai antara '.sprintf('%02d:00', Pemesanan::JAM_BUKA + 1)." dan {$tutup}.",
            'txtjamselesai.after' => 'Jam selesai harus setelah jam mulai.',
        ]);
    }

    // lapangan yang sama tidak boleh dibooking di jam yang tumpang tindih pada tanggal yang sama
    private function isLapanganTerbooking($idLapangan, $tanggal, $jamMulai, $jamSelesai, $idBookingKecuali = null){
        $query = DB::table('bookings')
            ->where('idLapangan', $idLapangan)
            ->where('tanggal', $tanggal)
            ->where('jamMulai', '<', $jamSelesai)
            ->where('jamSelesai', '>', $jamMulai);

        if ($idBookingKecuali) {
            $query->where('idBooking', '!=', $idBookingKecuali);
        }

        return $query->exists();
    }

    public function insertData(Request $request){
        $this->validasiBooking($request);

        if ($this->isLapanganTerbooking($request->txtlapangan, $request->txttanggal, $request->txtjammulai, $request->txtjamselesai)) {
            return back()->withErrors(['txtlapangan' => 'Lapangan sudah terbooking pada tanggal dan jam tersebut. Silakan pilih lapangan atau jam lain.']);
        }

        DB::table('bookings') -> insert ([
            'idPenyewa' => $request->txtpenyewa,
            'idLapangan' => $request->txtlapangan,
            'idAdmin' => $request->txtadmin,
            'tanggal' => $request->txttanggal,
            'jamMulai' => $request->txtjammulai,
            'jamSelesai' => $request->txtjamselesai,
            'totalBayar' => $request->txttotal,
            'status' => $request->txtstatus,
        ]);

        return redirect('/tampilbooking');
    }

    public function updateData(Request $request){
        $this->validasiBooking($request, ['txtid' => 'required|integer']);

        if ($this->isLapanganTerbooking($request->txtlapangan, $request->txttanggal, $request->txtjammulai, $request->txtjamselesai, $request->txtid)) {
            return back()->withErrors(['txtlapangan' => 'Lapangan sudah terbooking pada tanggal dan jam tersebut. Silakan pilih lapangan atau jam lain.']);
        }

        DB::table('bookings')
        -> where('idBooking', $request->txtid)
        ->update([
            'idPenyewa' => $request->txtpenyewa,
            'idLapangan' => $request->txtlapangan,
            'idAdmin' => $request->txtadmin,
            'tanggal' => $request->txttanggal,
            'jamMulai' => $request->txtjammulai,
            'jamSelesai' => $request->txtjamselesai,
            'totalBayar' => $request->txttotal,
            'status' => $request->txtstatus,
        ]);

        return redirect('/tampilbooking');
    }

    public function deleteDataBooking($idhapus){
        try {
            DB::table('bookings')->where('idBooking', $idhapus)->delete();
        } catch (QueryException $e) {
            // masih punya data pembayaran (foreign key)
            return redirect('/tampilbooking')->with('error', 'Booking tidak bisa dihapus karena masih memiliki data pembayaran.');
        }

        return redirect('/tampilbooking');
    }
}
