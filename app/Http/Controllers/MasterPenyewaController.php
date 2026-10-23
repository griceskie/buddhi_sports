<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MasterPenyewaController extends Controller
{

    public function tampilData(){

        $varpenyewa = DB::table('penyewas')->get();
        return Inertia::render('Master/Penyewa/TampilData', ['datapenyewa' => $varpenyewa]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtnama' => 'required|string|max:255',
            'txtnohp' => 'required|string|max:255',
            'txtemail' => 'required|email|max:255|unique:penyewas,email',
            'txtpassword' => 'required|string|min:6',
        ]);

        DB::table('penyewas') -> insert ([
            'namaPenyewa' => $request->txtnama,
            'noHp' => $request->txtnohp,
            'email' => $request->txtemail,
            'password' => Hash::make($request->txtpassword),
        ]);

        return redirect('/tampilpenyewa');
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtnama' => 'required|string|max:255',
            'txtnohp' => 'required|string|max:255',
            'txtemail' => ['required', 'email', 'max:255', Rule::unique('penyewas', 'email')->ignore($request->txtid, 'idPenyewa')],
            'txtpassword' => 'nullable|string|min:6',
        ]);

        $data = [
            'namaPenyewa' => $request->txtnama,
            'noHp' => $request->txtnohp,
            'email' => $request->txtemail,
        ];

        // password hanya diubah jika diisi
        if ($request->filled('txtpassword')) {
            $data['password'] = Hash::make($request->txtpassword);
        }

        DB::table('penyewas')
        -> where('idPenyewa', $request->txtid)
        ->update($data);

        return redirect('/tampilpenyewa');
    }

    public function deleteDataPenyewa($idhapus){
        try {
            DB::table('penyewas')->where('idPenyewa', $idhapus)->delete();
        } catch (QueryException $e) {
            // masih punya data booking (foreign key)
            return redirect('/tampilpenyewa')->with('error', 'Penyewa tidak bisa dihapus karena masih memiliki data booking.');
        }

        return redirect('/tampilpenyewa');
    }
}
