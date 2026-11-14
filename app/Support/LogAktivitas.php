<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Satu-satunya jalan menulis log aktivitas Admin. Tabelnya hanya bisa ditambah (trigger di migrasi), dan setiap baris
 * menyimpan hash dari isinya ditambah hash baris sebelumnya, jadi mengubah atau menghapus satu baris di luar aplikasi
 * memutus rantai dan terlihat di `periksa()`. Panggil `catat()` di dalam transaksi aksinya.
 */
class LogAktivitas
{
    public const AWAL = '0000000000000000000000000000000000000000000000000000000000000000';

    public const KATA_KERJA = [
        'tambah' => 'menambah',
        'ubah' => 'mengubah',
        'hapus' => 'menghapus',
        'terima' => 'menerima bukti bayar',
        'tolak' => 'menolak bukti bayar',
        'otomatis' => 'membatalkan otomatis',
        'buat' => 'membuat',
    ];

    /** Label isian per jenis data; kolom yang tidak ada di sini tidak dicatat (mis. path foto). */
    private const LABEL = [
        'Penyewa' => ['namaPenyewa' => 'Nama', 'noHp' => 'No HP', 'email' => 'Email', 'password' => 'Password'],
        'Lapangan' => ['namaLapangan' => 'Nama', 'jenisLapangan' => 'Jenis', 'tarifPerJam' => 'Tarif per jam', 'status' => 'Status', 'foto' => 'Foto'],
        'Booking' => ['idPenyewa' => 'Penyewa', 'idLapangan' => 'Lapangan', 'idAdmin' => 'Admin', 'tanggal' => 'Tanggal', 'jamMulai' => 'Jam mulai', 'jamSelesai' => 'Jam selesai', 'totalBayar' => 'Total bayar', 'status' => 'Status'],
        'Pembayaran' => ['idBooking' => 'Booking', 'tglBayar' => 'Tanggal bayar', 'jumlahBayar' => 'Jumlah', 'buktiBayar' => 'Bukti', 'status' => 'Status', 'alasanTolak' => 'Alasan penolakan', 'idAdmin' => 'Admin'],
        'Laporan' => ['namaLaporan' => 'Nama', 'idAdmin' => 'Admin', 'bulan' => 'Bulan', 'tahun' => 'Tahun', 'totalPemasukan' => 'Total pemasukan', 'tglLaporan' => 'Tanggal laporan', 'idManager' => 'Manager', 'filePdf' => 'PDF'],
    ];

    /**
     * @param  list<array{0: string, 1: string, 2: string}>  $rincian  [isian, sebelum, sesudah]
     */
    public static function catat(string $aksi, string $jenisObjek, string $kodeObjek, array $rincian = [], ?string $catatan = null, bool $olehSistem = false): void
    {
        // aksi otomatis (scheduler, halaman penyewa) dicatat atas nama "Sistem" walau ada sesi Admin di browser yang sama
        $admin = $olehSistem ? null : Auth::guard('admin')->user();
        $nama = $admin?->namaAdmin ?? 'Sistem';

        // kunci baris terakhir supaya dua aksi bersamaan tidak memakai hash sebelumnya yang sama
        $terakhir = DB::table('log_aktivitas')->orderByDesc('id')->lockForUpdate()->value('hash') ?? self::AWAL;

        $baris = [
            'waktu' => now()->format('Y-m-d H:i:s'),
            'idAdmin' => $admin?->idAdmin,
            'namaAdmin' => $nama,
            'aksi' => $aksi,
            'jenisObjek' => $jenisObjek,
            'kodeObjek' => $kodeObjek,
            'ringkasan' => $nama.' '.(self::KATA_KERJA[$aksi] ?? $aksi).' '.strtolower($jenisObjek).' '.$kodeObjek,
            'rincian' => json_encode(array_values($rincian), JSON_UNESCAPED_UNICODE),
            'catatan' => $catatan,
            'hashSebelumnya' => $terakhir,
        ];
        $baris['hash'] = self::hash($baris);

        DB::table('log_aktivitas')->insert($baris);
    }

    /** Hash isi baris + hash sebelumnya, dengan urutan kolom tetap. */
    public static function hash(array $baris): string
    {
        $isi = [];
        foreach (['waktu', 'idAdmin', 'namaAdmin', 'aksi', 'jenisObjek', 'kodeObjek', 'ringkasan', 'rincian', 'catatan', 'hashSebelumnya'] as $k) {
            $nilai = $baris[$k] ?? null;
            // waktu dan id dibaca kembali dari database sebagai teks; samakan bentuknya sebelum di-hash
            $isi[$k] = $nilai === null ? null : (string) $nilai;
        }
        $isi['waktu'] = Carbon::parse($isi['waktu'])->format('Y-m-d H:i:s');

        return hash('sha256', json_encode($isi, JSON_UNESCAPED_UNICODE));
    }

    /**
     * Telusuri rantai dari baris setelah $mulaiSetelah (id) dengan hash $hashMulai.
     *
     * @return array{utuh: bool, diperiksa: int, idTerakhir: ?int, hashTerakhir: string, rusakPada: ?int}
     */
    public static function periksa(int $mulaiSetelah = 0, string $hashMulai = self::AWAL): array
    {
        $sebelum = $hashMulai;
        $id = $mulaiSetelah ?: null;
        $jumlah = 0;
        $harapanId = null;

        foreach (DB::table('log_aktivitas')->where('id', '>', $mulaiSetelah)->lazyById(500) as $r) {
            $jumlah++;
            $baris = (array) $r;
            // baris yang hilang di tengah: hashSebelumnya tidak cocok lagi dengan hash baris sebelumnya
            if ($baris['hashSebelumnya'] !== $sebelum || self::hash($baris) !== $baris['hash']) {
                return ['utuh' => false, 'diperiksa' => $jumlah, 'idTerakhir' => $id, 'hashTerakhir' => $sebelum, 'rusakPada' => (int) $r->id];
            }
            $sebelum = $baris['hash'];
            $id = (int) $r->id;
        }

        return ['utuh' => true, 'diperiksa' => $jumlah, 'idTerakhir' => $id, 'hashTerakhir' => $sebelum, 'rusakPada' => null];
    }

    /**
     * Titik yang pernah lolos pemeriksaan harus tetap ada dengan hash yang sama. Menangkap tabel yang dikosongkan
     * (TRUNCATE di MySQL melewati trigger) atau ditulis ulang seluruhnya: rantai barunya bisa utuh, tapi titik lama hilang.
     */
    public static function titikMasihAda(?array $titik): bool
    {
        if (! $titik) {
            return true;
        }

        return DB::table('log_aktivitas')->where('id', $titik['id'])->value('hash') === $titik['hash'];
    }

    /**
     * Baris log terakhir saat ini (id + hash). Dicetak di PDF laporan bulanan sebagai jangkar di luar sistem: kalau log
     * kemudian ditulis ulang, hash baris itu tidak akan cocok lagi dengan yang tercetak di PDF yang sudah ditandatangani.
     *
     * @return array{id: int, hash: string}|null
     */
    public static function jangkar(): ?array
    {
        $r = DB::table('log_aktivitas')->orderByDesc('id')->first(['id', 'hash']);

        return $r ? ['id' => (int) $r->id, 'hash' => $r->hash] : null;
    }

    /**
     * Isian yang berubah, dalam kata-kata: [label, sebelum, sesudah]. $lama null = data baru, $baru null = data dihapus.
     *
     * @return list<array{0: string, 1: string, 2: string}>
     */
    public static function selisih(string $jenis, ?array $lama, ?array $baru): array
    {
        $hasil = [];
        foreach (self::LABEL[$jenis] ?? [] as $kolom => $label) {
            $ada = fn ($d) => $d !== null && array_key_exists($kolom, $d);
            // tidak disentuh sama sekali, atau pada perubahan tidak ikut dikirim (mis. password yang dikosongkan)
            if ((! $ada($lama) && ! $ada($baru)) || ($lama !== null && $baru !== null && ! $ada($baru))) {
                continue;
            }
            $a = $ada($lama) ? $lama[$kolom] : null;
            $b = $ada($baru) ? $baru[$kolom] : null;
            if ($lama !== null && $baru !== null && (string) $a === (string) $b) {
                continue;
            }
            if ($kolom === 'password') {
                // isi password tidak pernah dicatat
                $hasil[] = [$label, $lama === null ? '—' : '••••••', $baru === null ? '—' : ($lama === null ? '••••••' : 'diganti')];

                continue;
            }
            $ta = $lama === null ? '—' : self::tampil($kolom, $a);
            $tb = $baru === null ? '—' : self::tampil($kolom, $b);
            if ($lama !== null && $baru !== null && $ta === $tb) {
                // mis. foto kosong null vs "[]"; foto yang diganti dengan jumlah sama tetap dicatat
                if ($kolom !== 'foto' || FotoLapangan::paths($a) === FotoLapangan::paths($b)) {
                    continue;
                }
                $tb = $tb.' (diganti)';
            }
            $hasil[] = [$label, $ta, $tb];
        }

        return $hasil;
    }

    private static function tampil(string $kolom, mixed $nilai): string
    {
        if ($kolom === 'foto') {
            return count(FotoLapangan::paths($nilai)).' foto';
        }
        if ($nilai === null || $nilai === '') {
            return '—';
        }

        return match ($kolom) {
            'noHp' => self::sensorHp((string) $nilai),
            'email' => self::sensorEmail((string) $nilai),
            'tarifPerJam', 'totalBayar', 'jumlahBayar', 'totalPemasukan' => 'Rp'.number_format((int) $nilai, 0, ',', '.'),
            'jamMulai', 'jamSelesai' => str_replace(':', '.', substr((string) $nilai, 0, 5)),
            'tanggal', 'tglBayar', 'tglLaporan' => Carbon::parse($nilai)->locale('id')->translatedFormat('j M Y'),
            'idPenyewa' => (string) (DB::table('penyewas')->where('idPenyewa', $nilai)->value('namaPenyewa') ?? '#'.$nilai),
            'idLapangan' => (string) (DB::table('lapangans')->where('idLapangan', $nilai)->value('namaLapangan') ?? '#'.$nilai),
            'idAdmin' => (string) (DB::table('admins')->where('idAdmin', $nilai)->value('namaAdmin') ?? '#'.$nilai),
            'idManager' => (string) (DB::table('managers')->where('idManager', $nilai)->value('namaManager') ?? '#'.$nilai),
            'idBooking' => Pemesanan::kode((int) $nilai),
            'buktiBayar', 'filePdf' => 'ada',
            'status' => $nilai === 'Perbaikan' ? 'Dalam perbaikan' : (string) $nilai,
            default => (string) $nilai,
        };
    }

    /** "081234567890" -> "0812 **** 7890": log tidak bisa dihapus, jadi data pribadi disimpan tersensor. */
    public static function sensorHp(string $hp): string
    {
        $d = preg_replace('/\D/', '', $hp);

        return strlen($d) <= 8 ? str_repeat('*', strlen($d)) : substr($d, 0, 4).' **** '.substr($d, -4);
    }

    public static function sensorEmail(string $email): string
    {
        [$nama, $domain] = array_pad(explode('@', $email, 2), 2, '');

        return mb_substr($nama, 0, 1).'***@'.$domain;
    }
}
