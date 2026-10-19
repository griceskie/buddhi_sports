<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MasterManagerController extends Controller
{

    public function tampilData(){

        $varmanager = DB::table('managers')->get();
        return Inertia::render('Master/Manager/TampilData', ['datamanager' => $varmanager]);
    }

    public function tampilFormTambah(){
        return Inertia::render('Master/Manager/FormTambah');
    }

    public function tampilFormEdit($idedit){
        $varmanager = DB::table('managers')->where('idManager', $idedit)->first();
        return Inertia::render('Master/Manager/FormEdit', ['datamanager' => $varmanager]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtnama' => 'required|string|max:255',
            'txtusername' => 'required|string|max:255|unique:managers,username',
            'txtpassword' => 'required|string|min:6',
        ]);

        DB::table('managers') -> insert ([
            'namaManager' => $request->txtnama,
            'username' => $request->txtusername,
            'password' => Hash::make($request->txtpassword),
        ]);

        return redirect('/tampilmanager');
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtnama' => 'required|string|max:255',
            'txtusername' => ['required', 'string', 'max:255', Rule::unique('managers', 'username')->ignore($request->txtid, 'idManager')],
            'txtpassword' => 'nullable|string|min:6',
        ]);

        $data = [
            'namaManager' => $request->txtnama,
            'username' => $request->txtusername,
        ];

        // password hanya diubah jika diisi
        if ($request->filled('txtpassword')) {
            $data['password'] = Hash::make($request->txtpassword);
        }

        DB::table('managers')
        -> where('idManager', $request->txtid)
        ->update($data);

        return redirect('/tampilmanager');
    }

    public function deleteDataManager($idhapus){
        try {
            DB::table('managers')->where('idManager', $idhapus)->delete();
        } catch (QueryException $e) {
            // masih punya data laporan pembayaran (foreign key)
            return redirect('/tampilmanager')->with('error', 'Manager tidak bisa dihapus karena masih memiliki data laporan pembayaran.');
        }

        return redirect('/tampilmanager');
    }
}
