<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\FotoLapangan;
use App\Support\LogAktivitas;
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
                fn ($p) => ['path' => $p, 'url' => FotoLapangan::url($p)],
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

        $data = [
            'namaLapangan' => $request->txtnama,
            'jenisLapangan' => $request->txtjenis,
            'tarifPerJam' => $request->txttarif,
            'status' => $request->txtstatus,
            'foto' => json_encode(self::simpanFoto($request, [])),
        ];
        DB::transaction(function () use ($data) {
            DB::table('lapangans')->insert($data);
            LogAktivitas::catat('tambah', 'Lapangan', $data['namaLapangan'], LogAktivitas::selisih('Lapangan', null, $data));
        });

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

        $data = [
            'namaLapangan' => $request->txtnama,
            'jenisLapangan' => $request->txtjenis,
            'tarifPerJam' => $request->txttarif,
            'status' => $request->txtstatus,
            'foto' => json_encode($foto),
        ];
        $barisLama = (array) DB::table('lapangans')->where('idLapangan', $request->txtid)->first();
        DB::transaction(function () use ($request, $data, $barisLama) {
            DB::table('lapangans')
            -> where('idLapangan', $request->txtid)
            ->update($data);
            LogAktivitas::catat('ubah', 'Lapangan', $data['namaLapangan'], LogAktivitas::selisih('Lapangan', $barisLama, $data));
        });
        Storage::disk('public')->delete(array_values(array_diff($lama, $tetap)));

        return redirect('/tampillapangan');
    }

    public function deleteDataLapangan($idhapus){
        $foto = FotoLapangan::paths(DB::table('lapangans')->where('idLapangan', $idhapus)->value('foto'));
        try {
            $barisLama = (array) DB::table('lapangans')->where('idLapangan', $idhapus)->first();
            DB::transaction(function () use ($idhapus, $barisLama) {
                DB::table('lapangans')->where('idLapangan', $idhapus)->delete();
                LogAktivitas::catat('hapus', 'Lapangan', $barisLama['namaLapangan'] ?? '#'.$idhapus, LogAktivitas::selisih('Lapangan', $barisLama, null));
            });
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
