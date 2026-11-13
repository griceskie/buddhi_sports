<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Angka halaman Laporan pembayaran (Admin) untuk satu bulan. Sumbernya data asli, tanpa tabel baru.
 * - Pemasukan, grafik: pembayaran Terverifikasi menurut tanggal bayar (sama dengan isi PDF laporan).
 * - Keterisian, jam tersibuk: booking Dikonfirmasi menurut tanggal main.
 * - Booking dan pembatalan: semua booking dengan tanggal main di bulan itu.
 */
class AnalitikLaporan
{
    public static function untuk(Carbon $awal): array
    {
        $dari = $awal->copy()->startOfMonth();
        $sampai = $dari->copy()->endOfMonth();
        $hariBulan = $dari->daysInMonth;
        $rentang = [$dari->toDateString(), $sampai->toDateString()];
        $lapangan = DB::table('lapangans')->orderBy('idLapangan')->get(['idLapangan', 'namaLapangan']);
        $jamBuka = Pemesanan::JAM_TUTUP - Pemesanan::JAM_BUKA;

        $bayar = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->where('pembayarans.status', 'Terverifikasi')
            ->whereBetween('pembayarans.tglBayar', $rentang)
            ->get(['pembayarans.tglBayar', 'pembayarans.jumlahBayar', 'bookings.idLapangan']);

        $terkonfirmasi = DB::table('bookings')
            ->where('status', 'Dikonfirmasi')
            ->whereBetween('tanggal', $rentang)
            ->get(['idBooking', 'idLapangan', 'tanggal', 'jamMulai', 'jamSelesai', 'totalBayar']);
        $jam = fn ($b) => (int) substr($b->jamSelesai, 0, 2) - (int) substr($b->jamMulai, 0, 2);
        $jamTerisi = (int) $terkonfirmasi->sum($jam);
        $kapasitas = $hariBulan * $jamBuka * max(1, $lapangan->count());

        // pemasukan per hari per lapangan: [tanggal => [idLapangan => [rupiah, jumlah]]]
        $harian = [];
        foreach ($bayar as $p) {
            $d = (int) substr($p->tglBayar, 8, 2);
            $harian[$d][$p->idLapangan][0] = ($harian[$d][$p->idLapangan][0] ?? 0) + (int) $p->jumlahBayar;
            $harian[$d][$p->idLapangan][1] = ($harian[$d][$p->idLapangan][1] ?? 0) + 1;
        }

        // jam tersibuk: jam terisi per hari dalam seminggu (0 = Senin) dan jam mulai
        $isi = array_fill(0, 7, array_fill(0, $jamBuka, 0));
        foreach ($terkonfirmasi as $b) {
            $h = Carbon::parse($b->tanggal)->dayOfWeekIso - 1;
            for ($j = (int) substr($b->jamMulai, 0, 2); $j < (int) substr($b->jamSelesai, 0, 2); $j++) {
                if ($j >= Pemesanan::JAM_BUKA && $j < Pemesanan::JAM_TUTUP) {
                    $isi[$h][$j - Pemesanan::JAM_BUKA]++;
                }
            }
        }
        $tanggalPerHari = array_fill(0, 7, []);
        for ($d = 1; $d <= $hariBulan; $d++) {
            $tanggalPerHari[$dari->copy()->day($d)->dayOfWeekIso - 1][] = $d;
        }

        // booking dengan jadwal main di bulan ini: terkonfirmasi, dibatalkan per sebab, bukti ditolak
        $semua = DB::table('bookings')
            ->whereBetween('tanggal', $rentang)
            ->get(['idBooking', 'status', 'dibatalkanPenyewa', 'totalBayar']);
        $otomatis = DB::table('log_aktivitas')->where('aksi', 'otomatis')->where('jenisObjek', 'Booking')->pluck('kodeObjek')->flip();
        $sebab = fn ($b) => $b->dibatalkanPenyewa ? 'penyewa' : ($otomatis->has(Pemesanan::kode($b->idBooking)) ? 'otomatis' : 'pengelola');
        $batal = $semua->where('status', 'Dibatalkan');
        $tolak = $semua->where('status', 'Dipesan')->filter(fn ($b) => DB::table('pembayarans')->where('idBooking', $b->idBooking)->where('status', 'Ditolak')->exists());
        $perSebab = [];
        foreach (['otomatis', 'penyewa', 'pengelola'] as $k) {
            $a = $batal->filter(fn ($b) => $sebab($b) === $k);
            $perSebab[$k] = ['n' => $a->count(), 'rp' => (int) $a->sum('totalBayar')];
        }

        return [
            'pemasukan' => (int) $bayar->sum('jumlahBayar'),
            'booking' => $bayar->count(),
            'jamTerisi' => $jamTerisi,
            'kapasitas' => $kapasitas,
            'hariBulan' => $hariBulan,
            // hari pertama bulan, Senin = 0, untuk mengelompokkan minggu di grafik
            'geser' => $dari->dayOfWeekIso - 1,
            'lapangan' => $lapangan->map(fn ($l) => ['id' => $l->idLapangan, 'nama' => $l->namaLapangan])->all(),
            'harian' => $harian,
            'peta' => ['isi' => $isi, 'tanggal' => $tanggalPerHari, 'jumlahLapangan' => $lapangan->count()],
            'perLapangan' => $lapangan->map(function ($l) use ($terkonfirmasi, $jam, $hariBulan, $jamBuka) {
                $b = $terkonfirmasi->where('idLapangan', $l->idLapangan);

                return ['nama' => $l->namaLapangan, 'jam' => (int) $b->sum($jam), 'kapasitas' => $hariBulan * $jamBuka, 'booking' => $b->count()];
            })->all(),
            'funnel' => [
                'masuk' => $terkonfirmasi->count() + $batal->count() + $tolak->count(),
                'terkonfirmasi' => ['n' => $terkonfirmasi->count(), 'rp' => (int) $terkonfirmasi->sum('totalBayar')],
                'batal' => $perSebab,
                'tolak' => ['n' => $tolak->count(), 'rp' => (int) $tolak->sum('totalBayar')],
            ],
        ];
    }
}
