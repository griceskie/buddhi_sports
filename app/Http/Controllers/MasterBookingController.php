<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\JadwalBooking;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MasterBookingController extends Controller
{

    public function tampilData(){

        $varbooking = DB::table('bookings')->get();
        return Inertia::render('Master/Booking/TampilData', ['databooking' => $varbooking]);
    }

    public function tampilFormTambah(){
        return Inertia::render('Master/Booking/FormTambah', [
            'datapenyewa' => DB::table('penyewas')->get(),
            'datalapangan' => DB::table('lapangans')->get(),
            'dataadmin' => DB::table('admins')->get(),
        ]);
    }

    public function tampilFormEdit($idedit){
        $varbooking = DB::table('bookings')->where('idBooking', $idedit)->first();
        return Inertia::render('Master/Booking/FormEdit', [
            'databooking' => $varbooking,
            'datapenyewa' => DB::table('penyewas')->get(),
            'datalapangan' => DB::table('lapangans')->get(),
            'dataadmin' => DB::table('admins')->get(),
        ]);
    }

    // total dihitung dari tarif lapangan, bukan dari isian form
    private function hitungTotal($idLapangan, $jamMulai, $jamSelesai){
        $tarif = DB::table('lapangans')->where('idLapangan', $idLapangan)->value('tarifPerJam');

        return JadwalBooking::hitungTotal((int) $tarif, $jamMulai, $jamSelesai);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtpenyewa' => 'required|integer',
            'txtlapangan' => 'required|integer',
            'txtadmin' => 'nullable|integer',
            'txttanggal' => 'required|date',
            'txtjammulai' => 'required',
            'txtjamselesai' => 'required|after:txtjammulai',
            'txttotal' => 'nullable|integer|min:0',
            'txtstatus' => 'required|string|max:255',
        ]);

        $menahanSlot = in_array($request->txtstatus, JadwalBooking::STATUS_MENAHAN_SLOT);
        if ($menahanSlot && JadwalBooking::isTerbooking($request->txtlapangan, $request->txttanggal, $request->txtjammulai, $request->txtjamselesai)) {
            return redirect('/formbooking')->with('error', 'Lapangan sudah terbooking pada tanggal dan jam tersebut. Silakan pilih lapangan atau jam lain.');
        }

        DB::table('bookings') -> insert ([
            'idPenyewa' => $request->txtpenyewa,
            'idLapangan' => $request->txtlapangan,
            'idAdmin' => $request->txtadmin,
            'tanggal' => $request->txttanggal,
            'jamMulai' => JadwalBooking::jam($request->txtjammulai),
            'jamSelesai' => JadwalBooking::jam($request->txtjamselesai),
            'totalBayar' => $this->hitungTotal($request->txtlapangan, $request->txtjammulai, $request->txtjamselesai),
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
            'txtjamselesai' => 'required|after:txtjammulai',
            'txttotal' => 'nullable|integer|min:0',
            'txtstatus' => 'required|string|max:255',
        ]);

        $menahanSlot = in_array($request->txtstatus, JadwalBooking::STATUS_MENAHAN_SLOT);
        if ($menahanSlot && JadwalBooking::isTerbooking($request->txtlapangan, $request->txttanggal, $request->txtjammulai, $request->txtjamselesai, $request->txtid)) {
            return redirect('/editbooking/'.$request->txtid)->with('error', 'Lapangan sudah terbooking pada tanggal dan jam tersebut. Silakan pilih lapangan atau jam lain.');
        }

        DB::table('bookings')
        -> where('idBooking', $request->txtid)
        ->update([
            'idPenyewa' => $request->txtpenyewa,
            'idLapangan' => $request->txtlapangan,
            'idAdmin' => $request->txtadmin,
            'tanggal' => $request->txttanggal,
            'jamMulai' => JadwalBooking::jam($request->txtjammulai),
            'jamSelesai' => JadwalBooking::jam($request->txtjamselesai),
            'totalBayar' => $this->hitungTotal($request->txtlapangan, $request->txtjammulai, $request->txtjamselesai),
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
