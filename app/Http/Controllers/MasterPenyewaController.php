<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\LogAktivitas;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MasterPenyewaController extends Controller
{

    public function tampilData(){

        // kolom yang dipakai tabel saja (tanpa hash password) plus jumlah booking per penyewa
        $varpenyewa = DB::table('penyewas')
            ->select('idPenyewa', 'namaPenyewa', 'noHp', 'email')
            ->selectSub(DB::table('bookings')->selectRaw('count(*)')->whereColumn('bookings.idPenyewa', 'penyewas.idPenyewa'), 'jumlahBooking')
            ->get()
            ->map(function ($p) {
                $p->jumlahBooking = (int) $p->jumlahBooking; // MySQL mengirim count sebagai teks

                return $p;
            });
        return Inertia::render('Master/Penyewa/TampilData', ['datapenyewa' => $varpenyewa]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtnama' => 'required|string|max:255',
            'txtnohp' => 'required|string|max:255',
            'txtemail' => 'required|email|max:255|unique:penyewas,email',
            'txtpassword' => 'required|string|min:6',
        ]);

        $data = [
            'namaPenyewa' => $request->txtnama,
            'noHp' => $request->txtnohp,
            'email' => $request->txtemail,
            'password' => Hash::make($request->txtpassword),
        ];
        DB::transaction(function () use ($data) {
            DB::table('penyewas')->insert($data);
            LogAktivitas::catat('tambah', 'Penyewa', $data['namaPenyewa'], LogAktivitas::selisih('Penyewa', null, $data));
        });

        return redirect('/tampilpenyewa');
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtnama' => 'required|string|max:255',
            'txtnohp' => 'required|string|max:255',
            'txtemail' => ['required', 'email', 'max:255', Rule::unique('penyewas', 'email')->ignore($request->txtid, 'idPenyewa')],
        ]);

        $data = [
            'namaPenyewa' => $request->txtnama,
            'noHp' => $request->txtnohp,
            'email' => $request->txtemail,
        ];

        // password penyewa tidak bisa diubah Admin (celah 8.12); penyewa menggantinya sendiri di Profile
        $lama = (array) DB::table('penyewas')->where('idPenyewa', $request->txtid)->first();
        abort_if(! $lama, 404);
        DB::transaction(function () use ($request, $data, $lama) {
            DB::table('penyewas')
            -> where('idPenyewa', $request->txtid)
            ->update($data);
            LogAktivitas::catat('ubah', 'Penyewa', $data['namaPenyewa'], LogAktivitas::selisih('Penyewa', $lama, $data));
        });

        return redirect('/tampilpenyewa');
    }

    public function deleteDataPenyewa($idhapus){
        try {
            $lama = (array) DB::table('penyewas')->where('idPenyewa', $idhapus)->first();
            abort_if(! $lama, 404);
            DB::transaction(function () use ($idhapus, $lama) {
                DB::table('penyewas')->where('idPenyewa', $idhapus)->delete();
                LogAktivitas::catat('hapus', 'Penyewa', $lama['namaPenyewa'] ?? '#'.$idhapus, LogAktivitas::selisih('Penyewa', $lama, null));
            });
        } catch (QueryException $e) {
            // masih punya data booking (foreign key)
            return redirect('/tampilpenyewa')->with('error', 'Penyewa tidak bisa dihapus karena masih memiliki data booking.');
        }

        return redirect('/tampilpenyewa');
    }
}
