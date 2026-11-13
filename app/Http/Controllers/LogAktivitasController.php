<?php

namespace App\Http\Controllers;

use App\Support\LogAktivitas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** Log aktivitas Admin: hanya baca. Sengaja tidak ada method simpan, ubah, atau hapus. */
class LogAktivitasController extends Controller
{
    public const CACHE_PERIKSA = 'log-aktivitas-periksa';

    /** Entri terakhir yang lolos pemeriksaan (id + hash). */
    public const CACHE_TITIK = 'log-aktivitas-titik';

    public function tampilData(Request $request): Response
    {
        $filter = $request->validate([
            'q' => 'nullable|string|max:100',
            'admin' => 'nullable|string|max:255',
            'aksi' => 'nullable|string|in:'.implode(',', array_keys(LogAktivitas::KATA_KERJA)),
            'jenis' => 'nullable|string|max:30',
        ]);

        $log = DB::table('log_aktivitas')
            ->when($filter['q'] ?? null, fn ($q, $cari) => $q->where(fn ($w) => $w
                ->where('ringkasan', 'like', "%$cari%")
                ->orWhere('kodeObjek', 'like', "%$cari%")
                ->orWhere('namaAdmin', 'like', "%$cari%")))
            ->when($filter['admin'] ?? null, fn ($q, $v) => $q->where('namaAdmin', $v))
            ->when($filter['aksi'] ?? null, fn ($q, $v) => $q->where('aksi', $v))
            ->when($filter['jenis'] ?? null, fn ($q, $v) => $q->where('jenisObjek', $v))
            ->orderByDesc('id')
            ->paginate(25, ['id', 'waktu', 'namaAdmin', 'aksi', 'jenisObjek', 'kodeObjek', 'ringkasan', 'rincian', 'catatan'])
            ->withQueryString()
            ->through(fn ($r) => [...(array) $r, 'rincian' => json_decode($r->rincian, true) ?: []]);

        return Inertia::render('Admin/LogAktivitas/TampilData', [
            'log' => $log,
            'filter' => (object) $filter,
            'opsiAdmin' => DB::table('log_aktivitas')->distinct()->orderBy('namaAdmin')->pluck('namaAdmin'),
            'opsiJenis' => DB::table('log_aktivitas')->distinct()->orderBy('jenisObjek')->pluck('jenisObjek'),
            'pemeriksaan' => Cache::get(self::CACHE_PERIKSA),
        ]);
    }

    /** Telusuri seluruh rantai hash dan simpan hasilnya (tampil di halaman log). */
    public function periksa(): RedirectResponse
    {
        $hasil = LogAktivitas::periksa();
        $titik = Cache::get(self::CACHE_TITIK);
        if ($hasil['utuh'] && ! LogAktivitas::titikMasihAda($titik)) {
            $hasil = [...$hasil, 'utuh' => false, 'rusakPada' => $titik['id']];
        }
        if ($hasil['utuh'] && $hasil['idTerakhir']) {
            Cache::forever(self::CACHE_TITIK, ['id' => $hasil['idTerakhir'], 'hash' => $hasil['hashTerakhir']]);
        }
        Cache::forever(self::CACHE_PERIKSA, [...$hasil, 'waktu' => now()->toIso8601String()]);

        return back()->with(
            $hasil['utuh'] ? 'success' : 'error',
            $hasil['utuh']
                ? 'Log utuh: '.$hasil['diperiksa'].' entri diperiksa, rantainya tidak putus.'
                : 'Log tidak utuh: rantai putus di entri #'.$hasil['rusakPada'].'. Ada data yang diubah atau dihapus di luar aplikasi.',
        );
    }
}
