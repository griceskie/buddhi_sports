<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MasterLapanganController extends Controller
{

    public function tampilData(){

        $varlapangan = DB::table('lapangans')->get();
        return Inertia::render('Master/Lapangan/TampilData', ['datalapangan' => $varlapangan]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtnama' => 'required|string|max:255',
            'txtjenis' => 'required|string|max:255',
            'txttarif' => 'required|integer|min:0',
            'txtstatus' => 'required|in:Tersedia,Perbaikan',
        ]);

        DB::table('lapangans') -> insert ([
            'namaLapangan' => $request->txtnama,
            'jenisLapangan' => $request->txtjenis,
            'tarifPerJam' => $request->txttarif,
            'status' => $request->txtstatus,
        ]);

        return redirect('/tampillapangan');
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtnama' => 'required|string|max:255',
            'txtjenis' => 'required|string|max:255',
            'txttarif' => 'required|integer|min:0',
            'txtstatus' => 'required|in:Tersedia,Perbaikan',
        ]);

        DB::table('lapangans')
        -> where('idLapangan', $request->txtid)
        ->update([
            'namaLapangan' => $request->txtnama,
            'jenisLapangan' => $request->txtjenis,
            'tarifPerJam' => $request->txttarif,
            'status' => $request->txtstatus,
        ]);

        return redirect('/tampillapangan');
    }

    public function deleteDataLapangan($idhapus){
        try {
            DB::table('lapangans')->where('idLapangan', $idhapus)->delete();
        } catch (QueryException $e) {
            // masih punya data booking (foreign key)
            return redirect('/tampillapangan')->with('error', 'Lapangan tidak bisa dihapus karena masih memiliki data booking.');
        }

        return redirect('/tampillapangan');
    }
}
