<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MasterAdminController extends Controller
{

    public function tampilData(){

        $varadmin = DB::table('admins')->get();
        return Inertia::render('Master/Admin/TampilData', ['dataadmin' => $varadmin]);
    }

    public function tampilFormTambah(){
        return Inertia::render('Master/Admin/FormTambah');
    }

    public function tampilFormEdit($idedit){
        $varadmin = DB::table('admins')->where('idAdmin', $idedit)->first();
        return Inertia::render('Master/Admin/FormEdit', ['dataadmin' => $varadmin]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtnama' => 'required|string|max:255',
            'txtusername' => 'required|string|max:255|unique:admins,username',
            'txtpassword' => 'required|string|min:6',
        ]);

        DB::table('admins') -> insert ([
            'namaAdmin' => $request->txtnama,
            'username' => $request->txtusername,
            'password' => Hash::make($request->txtpassword),
        ]);

        return redirect('/tampiladmin');
    }

    public function updateData(Request $request){
        $request->validate([
            'txtid' => 'required|integer',
            'txtnama' => 'required|string|max:255',
            'txtusername' => ['required', 'string', 'max:255', Rule::unique('admins', 'username')->ignore($request->txtid, 'idAdmin')],
            'txtpassword' => 'nullable|string|min:6',
        ]);

        $data = [
            'namaAdmin' => $request->txtnama,
            'username' => $request->txtusername,
        ];

        // password hanya diubah jika diisi
        if ($request->filled('txtpassword')) {
            $data['password'] = Hash::make($request->txtpassword);
        }

        DB::table('admins')
        -> where('idAdmin', $request->txtid)
        ->update($data);

        return redirect('/tampiladmin');
    }

    public function deleteDataAdmin($idhapus){
        try {
            DB::table('admins')->where('idAdmin', $idhapus)->delete();
        } catch (QueryException $e) {
            // masih punya data booking/pembayaran/laporan (foreign key)
            return redirect('/tampiladmin')->with('error', 'Admin tidak bisa dihapus karena masih memiliki data terkait.');
        }

        return redirect('/tampiladmin');
    }
}
