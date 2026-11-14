<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\Pemesanan;
use App\Support\LogAktivitas;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class MasterBookingController extends Controller
{

    public function tampilData(){

        // tanpaBayar: Dikonfirmasi tetapi tanpa pembayaran Terverifikasi (mengisi okupansi, tidak masuk pemasukan laporan)
        $varbooking = DB::table('bookings')->select('bookings.*')
            ->selectRaw("(bookings.status = 'Dikonfirmasi' and not exists (select 1 from pembayarans where pembayarans.idBooking = bookings.idBooking and pembayarans.status = 'Terverifikasi')) as tanpaBayar")
            ->get()
            ->map(fn ($b) => tap($b, fn ($b) => $b->tanpaBayar = (bool) $b->tanpaBayar));
        return Inertia::render('Master/Booking/TampilData', [
            'databooking' => $varbooking,
            // hanya kolom yang dipakai form; jangan kirim hash password ke browser
            'datapenyewa' => DB::table('penyewas')->orderBy('namaPenyewa')->get(['idPenyewa', 'namaPenyewa', 'email']),
            'datalapangan' => DB::table('lapangans')->get(),
            'dataadmin' => DB::table('admins')->get(['idAdmin', 'namaAdmin']),
            // form Tambah langsung memilih Admin yang sedang bertugas
            'idAdminLogin' => Auth::guard('admin')->id(),
        ]);
    }

    // aturan bersama Tambah dan Edit booking
    /**
     * Dijalankan di dalam transaksi simpan: kunci baris lapangan (seperti sisi penyewa) supaya dua simpan bersamaan
     * tidak menghasilkan booking ganda, lalu cek bentrok jam. Lapangan Perbaikan ditolak untuk booking baru
     * atau saat booking dipindah ke lapangan itu; membatalkan tetap boleh.
     */
    private function kunciDanCekJadwal(Request $request, ?int $idBooking, bool $lapanganBaru): void
    {
        $lapangan = DB::table('lapangans')->where('idLapangan', $request->txtlapangan)->lockForUpdate()->first();
        if ($request->txtstatus !== 'Dibatalkan' && $lapanganBaru && strtolower((string) $lapangan->status) === 'perbaikan') {
            throw ValidationException::withMessages(['txtlapangan' => 'Lapangan sedang dalam perbaikan, jadi tidak bisa dipesan.']);
        }
        if ($this->isLapanganTerbooking($request->txtlapangan, $request->txttanggal, $request->txtjammulai, $request->txtjamselesai, $idBooking, $request->txtstatus)) {
            throw ValidationException::withMessages(['txtlapangan' => 'Lapangan sudah terbooking pada tanggal dan jam tersebut. Silakan pilih lapangan atau jam lain.']);
        }
    }

    private function validasiBooking(Request $request, array $tambahan = []): void
    {
        $jam = fn (int $dari, int $sampai) => array_map(fn ($h) => sprintf('%02d:00', $h), range($dari, $sampai));
        $buka = sprintf('%02d.00', Pemesanan::JAM_BUKA);
        $tutup = sprintf('%02d.00', Pemesanan::JAM_TUTUP);

        $request->validate($tambahan + [
            'txtpenyewa' => 'required|integer|exists:penyewas,idPenyewa',
            'txtlapangan' => 'required|integer|exists:lapangans,idLapangan',
            // booking manual diisi di lokasi, jadi Admin yang bertugas wajib tercatat
            'txtadmin' => 'required|integer|exists:admins,idAdmin',
            'txttanggal' => 'required|date',
            // jam bulat dalam jam operasional; jam selesai harus setelah jam mulai
            'txtjammulai' => ['required', Rule::in($jam(Pemesanan::JAM_BUKA, Pemesanan::JAM_TUTUP - 1))],
            'txtjamselesai' => ['required', Rule::in($jam(Pemesanan::JAM_BUKA + 1, Pemesanan::JAM_TUTUP)), 'after:txtjammulai'],
            'txttotal' => 'required|integer|min:0',
            'txtstatus' => ['required', Rule::in(Pemesanan::STATUS)],
        ], [
            'txtjammulai.in' => "Pilih jam mulai antara {$buka} dan ".sprintf('%02d.00', Pemesanan::JAM_TUTUP - 1).'.',
            'txtjamselesai.in' => 'Pilih jam selesai antara '.sprintf('%02d.00', Pemesanan::JAM_BUKA + 1)." dan {$tutup}.",
            'txtjamselesai.after' => 'Jam selesai harus setelah jam mulai.',
        ]);
    }

    // lapangan yang sama tidak boleh dibooking di jam yang tumpang tindih pada tanggal yang sama;
    // booking Dibatalkan tidak menahan jam, baik yang sudah ada maupun yang sedang disimpan
    private function isLapanganTerbooking($idLapangan, $tanggal, $jamMulai, $jamSelesai, $idBookingKecuali = null, $status = null){
        if ($status === 'Dibatalkan') {
            return false;
        }

        $query = DB::table('bookings')
            ->where('idLapangan', $idLapangan)
            ->where('tanggal', $tanggal)
            ->where('status', '!=', 'Dibatalkan')
            ->where('jamMulai', '<', $jamSelesai)
            ->where('jamSelesai', '>', $jamMulai);

        if ($idBookingKecuali) {
            $query->where('idBooking', '!=', $idBookingKecuali);
        }

        return $query->exists();
    }

    public function insertData(Request $request){
        $this->validasiBooking($request);

        $data = [
            'idPenyewa' => $request->txtpenyewa,
            'idLapangan' => $request->txtlapangan,
            'idAdmin' => $request->txtadmin,
            'tanggal' => $request->txttanggal,
            'jamMulai' => $request->txtjammulai,
            'jamSelesai' => $request->txtjamselesai,
            'totalBayar' => $request->txttotal,
            'status' => $request->txtstatus,
        ];
        DB::transaction(function () use ($request, $data) {
            $this->kunciDanCekJadwal($request, null, true);
            $id = DB::table('bookings')->insertGetId($data, 'idBooking');
            LogAktivitas::catat('tambah', 'Booking', Pemesanan::kode($id), LogAktivitas::selisih('Booking', null, $data));
        });

        return redirect('/tampilbooking');
    }

    public function updateData(Request $request){
        $this->validasiBooking($request, ['txtid' => 'required|integer']);
        $lama = (array) DB::table('bookings')->where('idBooking', $request->txtid)->first();
        abort_if(! $lama, 404);

        // membatalkan booking wajib dengan alasan; disimpan di catatan Log aktivitas, tanpa kolom baru
        $membatalkan = $request->txtstatus === 'Dibatalkan' && ($lama['status'] ?? null) !== 'Dibatalkan';
        if ($membatalkan) {
            $request->validate(['txtalasanbatal' => 'required|string|max:255'], [
                'txtalasanbatal.required' => 'Tulis alasan pembatalan.',
                'txtalasanbatal.max' => 'Alasan pembatalan paling banyak 255 karakter.',
            ]);
        }


        $data = [
            'idPenyewa' => $request->txtpenyewa,
            'idLapangan' => $request->txtlapangan,
            'idAdmin' => $request->txtadmin,
            'tanggal' => $request->txttanggal,
            'jamMulai' => $request->txtjammulai,
            'jamSelesai' => $request->txtjamselesai,
            'totalBayar' => $request->txttotal,
            'status' => $request->txtstatus,
        ];
        DB::transaction(function () use ($request, $data, $lama, $membatalkan) {
            $this->kunciDanCekJadwal($request, (int) $request->txtid, (int) $lama['idLapangan'] !== (int) $request->txtlapangan);
            DB::table('bookings')
            -> where('idBooking', $request->txtid)
            ->update($data);
            LogAktivitas::catat('ubah', 'Booking', Pemesanan::kode((int) $request->txtid), LogAktivitas::selisih('Booking', $lama, $data), $membatalkan ? trim($request->txtalasanbatal) : null);
        });

        return redirect('/tampilbooking');
    }

    public function deleteDataBooking($idhapus){
        try {
            $lama = (array) DB::table('bookings')->where('idBooking', $idhapus)->first();
            abort_if(! $lama, 404);
            DB::transaction(function () use ($idhapus, $lama) {
                DB::table('bookings')->where('idBooking', $idhapus)->delete();
                LogAktivitas::catat('hapus', 'Booking', Pemesanan::kode((int) $idhapus), LogAktivitas::selisih('Booking', $lama, null));
            });
        } catch (QueryException $e) {
            // masih punya data pembayaran (foreign key)
            return redirect('/tampilbooking')->with('error', 'Booking tidak bisa dihapus karena masih memiliki data pembayaran.');
        }

        return redirect('/tampilbooking');
    }
}
