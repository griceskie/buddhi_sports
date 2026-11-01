<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\FotoLapangan;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class MasterLapanganController extends Controller
{

    public function tampilData(){

        // foto dikirim sebagai path (untuk dipertahankan saat edit) + URL (untuk ditampilkan)
        $varlapangan = DB::table('lapangans')->get()->map(function ($l) {
            $l->foto = array_map(
                fn ($p) => ['path' => $p, 'url' => Storage::disk('public')->url($p)],
                FotoLapangan::paths($l->foto),
            );
            return $l;
        });
        return Inertia::render('Master/Lapangan/TampilData', ['datalapangan' => $varlapangan]);
    }

    public function insertData(Request $request){
        $request->validate([
            'txtnama' => 'required|string|max:255',
            'txtjenis' => 'required|string|max:255',
            'txttarif' => 'required|integer|min:0',
            'txtstatus' => 'required|in:Tersedia,Perbaikan',
        ] + self::aturanFoto());

        DB::table('lapangans') -> insert ([
            'namaLapangan' => $request->txtnama,
            'jenisLapangan' => $request->txtjenis,
            'tarifPerJam' => $request->txttarif,
            'status' => $request->txtstatus,
            'foto' => json_encode(self::simpanFoto($request, [])),
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
            'fotoLama' => 'nullable|array',
            'fotoLama.*' => 'string',
        ] + self::aturanFoto());

        $lama = FotoLapangan::paths(DB::table('lapangans')->where('idLapangan', $request->txtid)->value('foto'));
        // hanya path yang memang milik lapangan ini yang boleh dipertahankan
        $tetap = array_values(array_intersect($lama, $request->input('fotoLama', [])));
        $foto = self::simpanFoto($request, $tetap);

        DB::table('lapangans')
        -> where('idLapangan', $request->txtid)
        ->update([
            'namaLapangan' => $request->txtnama,
            'jenisLapangan' => $request->txtjenis,
            'tarifPerJam' => $request->txttarif,
            'status' => $request->txtstatus,
            'foto' => json_encode($foto),
        ]);
        Storage::disk('public')->delete(array_values(array_diff($lama, $tetap)));

        return redirect('/tampillapangan');
    }

    public function deleteDataLapangan($idhapus){
        $foto = FotoLapangan::paths(DB::table('lapangans')->where('idLapangan', $idhapus)->value('foto'));
        try {
            DB::table('lapangans')->where('idLapangan', $idhapus)->delete();
        } catch (QueryException $e) {
            // masih punya data booking (foreign key)
            return redirect('/tampillapangan')->with('error', 'Lapangan tidak bisa dihapus karena masih memiliki data booking.');
        }
        Storage::disk('public')->delete($foto);

        return redirect('/tampillapangan');
    }

    private static function aturanFoto(): array
    {
        return [
            'foto' => 'nullable|array|max:'.FotoLapangan::MAKS,
            'foto.*' => 'file|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }

    /** Simpan foto baru setelah foto yang dipertahankan; total paling banyak FotoLapangan::MAKS. */
    private static function simpanFoto(Request $request, array $tetap): array
    {
        $baru = $request->file('foto', []);
        if (count($tetap) + count($baru) > FotoLapangan::MAKS) {
            throw ValidationException::withMessages(['foto' => 'Foto lapangan paling banyak '.FotoLapangan::MAKS.'.']);
        }

        return array_merge($tetap, array_map(fn ($f) => $f->store('lapangan', 'public'), $baru));
    }
}
