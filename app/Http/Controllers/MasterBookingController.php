<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MasterBookingController extends Controller
{

    public function tampilData(){

        $varbooking = DB::table('bookings')->get();
        return Inertia::render('Master/Booking/TampilData', [
            'databooking' => $varbooking,
            'datapenyewa' => DB::table('penyewas')->get(),
            'datalapangan' => DB::table('lapangans')->get(),
            'dataadmin' => DB::table('admins')->get(),
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
        $request->validate([
            'txtpenyewa' => 'required|integer',
            'txtlapangan' => 'required|integer',
            'txtadmin' => 'nullable|integer',
            'txttanggal' => 'required|date',
            'txtjammulai' => 'required',
            'txtjamselesai' => 'required',
            'txttotal' => 'required|integer|min:0',
            'txtstatus' => 'required|string|max:255',
        ]);

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
        $request->validate([
            'txtid' => 'required|integer',
            'txtpenyewa' => 'required|integer',
            'txtlapangan' => 'required|integer',
            'txtadmin' => 'nullable|integer',
            'txttanggal' => 'required|date',
            'txtjammulai' => 'required',
            'txtjamselesai' => 'required',
            'txttotal' => 'required|integer|min:0',
            'txtstatus' => 'required|string|max:255',
        ]);

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
