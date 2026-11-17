<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Support\LogAktivitas;
use App\Support\Pemesanan;
use Illuminate\Database\Seeder;
use Illuminate\Http\File;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Data contoh untuk pengujian: penyewa, booking dan pembayaran dari awal bulan, tiga bulan lalu sampai seminggu ke depan,
 * plus log aktivitasnya. Tanggal dihitung dari hari seeder dijalankan, jadi selalu ada bulan lalu yang lengkap
 * (laporan bisa dibuat) dan Analisis bisnis punya pembanding. Laporan bulanan sengaja tidak dibuat: itu bagian dari uji.
 *
 * Jalankan setelah DatabaseSeeder di database kosong: php artisan migrate:fresh --seed && php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    public const PASSWORD_PENYEWA = 'Penyewa123';

    private const PENYEWA = [
        ['Rina Wulandari', 'rina@example.com'],
        ['Andi Pratama', 'andi@example.com'],
        ['Siti Rahmawati', 'siti@example.com'],
        ['Kevin Wijaya', 'kevin@example.com'],
        ['Dewi Lestari', 'dewi@example.com'],
        ['Fajar Nugroho', 'fajar@example.com'],
        ['Maria Natalia', 'maria@example.com'],
        ['Yohanes Saputra', 'yohanes@example.com'],
        ['Putri Anggraini', 'putri@example.com'],
        ['Hendra Gunawan', 'hendra@example.com'],
        ['Lina Marlina', 'lina@example.com'],
        ['UKM Basket Buddhi', 'ukmbasket@example.com'],
    ];

    private const ALASAN_TOLAK = [
        'Foto bukti buram, nominal tidak terbaca.',
        'Nominal transfer tidak sesuai total booking.',
        'Bukti yang dikirim bukan bukti transfer.',
    ];

    /** @var array<string, list<array{0: int, 1: int}>> jam terpakai per "idLapangan|tanggal" */
    private array $terpakai = [];

    /** @var list<array{0: Carbon, 1: callable}> log ditulis setelah semua data, urut waktu */
    private array $log = [];

    private string $bukti;

    private int $salinan = 0;

    public function run(): void
    {
        if (DB::table('bookings')->exists()) {
            throw new RuntimeException('DemoSeeder hanya untuk database kosong. Jalankan: php artisan migrate:fresh --seed lalu db:seed --class=DemoSeeder');
        }
        $this->call(DatabaseSeeder::class);
        mt_srand(2026);
        $sekarang = now();

        // admin kedua supaya Kinerja Admin punya pembanding
        if (! DB::table('admins')->where('username', 'Admin2')->exists()) {
            DB::table('admins')->insert(['namaAdmin' => 'Sari', 'username' => 'Admin2', 'password' => Hash::make('Admin123')]);
        }
        $admin = Admin::whereIn('username', ['Admin1', 'Admin2'])->orderBy('idAdmin')->get()->all();

        $penyewa = [];
        foreach (self::PENYEWA as $i => [$nama, $email]) {
            $penyewa[] = DB::table('penyewas')->insertGetId([
                'namaPenyewa' => $nama,
                'noHp' => sprintf('0812%08d', 31415926 + $i * 271828),
                'email' => $email,
                'password' => Hash::make(self::PASSWORD_PENYEWA),
            ], 'idPenyewa');
        }
        $lapangan = DB::table('lapangans')->orderBy('idLapangan')->get(['idLapangan', 'tarifPerJam'])->all();

        // satu file contoh dipakai semua pembayaran lama; skenario yang bisa diunggah ulang memakai salinannya sendiri
        $this->bukti = Storage::disk('local')->putFileAs('bukti', new File(database_path('demo/bukti-transfer-contoh.jpg')), 'contoh-demo.jpg');

        $this->skenario($sekarang, $penyewa, $lapangan, $admin);

        $hari = $sekarang->copy()->startOfMonth()->subMonths(3)->startOfDay();
        $akhir = $sekarang->copy()->addDays(7)->startOfDay();
        for (; $hari->lte($akhir); $hari->addDay()) {
            foreach ($lapangan as $l) {
                $peluang = $hari->isWeekend() ? [5, 15, 30, 30, 20] : [15, 30, 30, 20, 5];
                for ($n = $this->pilih($peluang); $n > 0; $n--) {
                    $slot = $this->slotKosong($l->idLapangan, $hari);
                    if ($slot) {
                        $this->booking($sekarang, $hari, $slot, $l, $penyewa[mt_rand(0, count($penyewa) - 1)], $admin);
                    }
                }
            }
        }

        // log ditulis berurutan waktu supaya rantai hash dan waktu tiap baris masuk akal
        usort($this->log, fn ($a, $b) => $a[0] <=> $b[0]);
        DB::transaction(function () {
            foreach ($this->log as [$waktu, $tulis]) {
                Carbon::setTestNow($waktu);
                $tulis();
            }
        });
        Carbon::setTestNow();
        Auth::guard('admin')->forgetUser();
    }

    /** Keadaan yang perlu ada saat pengujian dimulai: antrean verifikasi, bukti ditolak, booking mendatang milik Rina. */
    private function skenario(Carbon $sekarang, array $penyewa, array $lapangan, array $admin): void
    {
        $besok = $sekarang->copy()->addDay()->startOfDay();
        $lusa = $sekarang->copy()->addDays(2)->startOfDay();

        // dua bukti menunggu verifikasi
        foreach ([[$besok, [16, 18], $lapangan[1], $penyewa[1]], [$lusa, [19, 21], $lapangan[3], $penyewa[11]]] as $i => [$tgl, $slot, $l, $p]) {
            $this->tandai($l->idLapangan, $tgl, $slot);
            $dibuat = $sekarang->copy()->subMinutes(90 - $i * 30);
            $id = $this->simpanBooking($p, $l, $tgl, $slot, 'Dipesan', $dibuat);
            DB::table('pembayarans')->insert([
                'idBooking' => $id, 'tglBayar' => $dibuat->toDateString(), 'jumlahBayar' => $l->tarifPerJam * ($slot[1] - $slot[0]),
                'buktiBayar' => $this->salinBukti(), 'dikirimPada' => $dibuat->copy()->addMinutes(12), 'status' => 'Menunggu Verifikasi',
            ]);
        }

        // milik Rina: satu sudah dikonfirmasi, satu buktinya ditolak dan bisa diunggah ulang
        $this->tandai($lapangan[0]->idLapangan, $besok, [19, 20]);
        $this->booking($sekarang, $besok, [19, 20], $lapangan[0], $penyewa[0], $admin, 'konfirmasi', $sekarang->copy()->subDays(2)->setTime(10, 0));

        $this->tandai($lapangan[0]->idLapangan, $lusa, [17, 19]);
        $dibuat = $sekarang->copy()->subHours(5);
        $id = $this->simpanBooking($penyewa[0], $lapangan[0], $lusa, [17, 19], 'Dipesan', $dibuat);
        $dikirim = $dibuat->copy()->addMinutes(15);
        $ditolak = $dikirim->copy()->addMinutes(40);
        DB::table('pembayarans')->insert([
            'idBooking' => $id, 'idAdmin' => $admin[0]->idAdmin, 'tglBayar' => $dikirim->toDateString(), 'jumlahBayar' => $lapangan[0]->tarifPerJam * 2,
            'buktiBayar' => $this->salinBukti(), 'dikirimPada' => $dikirim, 'status' => 'Ditolak', 'alasanTolak' => self::ALASAN_TOLAK[0],
        ]);
        $this->logTolak($ditolak, $admin[0], $id, self::ALASAN_TOLAK[0]);
    }

    /**
     * Satu booking dengan akhir ceritanya. Tanpa $hasil: booking yang sudah lewat kebanyakan dikonfirmasi, sisanya dibatalkan
     * penyewa, batal otomatis, atau buktinya ditolak dan tidak dikirim ulang; booking mendatang dikonfirmasi atau dibatalkan penyewa.
     */
    private function booking(Carbon $sekarang, Carbon $tgl, array $slot, object $l, int $idPenyewa, array $admin, ?string $hasil = null, ?Carbon $dibuat = null): void
    {
        $mulai = $tgl->copy()->setTime($slot[0], 0);
        $dibuat ??= $this->waktuPesan($mulai, $sekarang);
        if ($hasil === null) {
            $r = mt_rand(1, 100);
            $hasil = $mulai->lt($sekarang)
                ? ($r <= 82 ? 'konfirmasi' : ($r <= 89 ? 'batal' : ($r <= 96 ? 'otomatis' : 'tolak')))
                : ($r <= 90 ? 'konfirmasi' : 'batal');
        }
        $jumlah = $l->tarifPerJam * ($slot[1] - $slot[0]);

        if ($hasil === 'batal') {
            $this->simpanBooking($idPenyewa, $l, $tgl, $slot, 'Dibatalkan', $dibuat, true);

            return;
        }
        if ($hasil === 'otomatis') {
            $id = $this->simpanBooking($idPenyewa, $l, $tgl, $slot, 'Dibatalkan', $dibuat);
            $this->log[] = [$dibuat->copy()->addMinutes(61), fn () => LogAktivitas::catat('otomatis', 'Booking', Pemesanan::kode($id),
                [['Status', 'Dipesan', 'Dibatalkan']], 'Bukti bayar tidak dikirim dalam 60 menit.', true)];

            return;
        }

        $dikirim = $dibuat->copy()->addMinutes(mt_rand(5, 45));
        $putusan = $this->jamOperasional($dikirim->copy()->addMinutes(mt_rand(5, 120)));
        $oleh = $admin[mt_rand(1, 100) <= 65 ? 0 : count($admin) - 1];
        if ($putusan->gt($sekarang)) {
            // keputusan belum waktunya: biarkan menunggu verifikasi
            $id = $this->simpanBooking($idPenyewa, $l, $tgl, $slot, 'Dipesan', $dibuat);
            DB::table('pembayarans')->insert(['idBooking' => $id, 'tglBayar' => $dikirim->toDateString(), 'jumlahBayar' => $jumlah,
                'buktiBayar' => $this->salinBukti(), 'dikirimPada' => $dikirim, 'status' => 'Menunggu Verifikasi']);

            return;
        }

        if ($hasil === 'tolak') {
            $alasan = self::ALASAN_TOLAK[mt_rand(0, count(self::ALASAN_TOLAK) - 1)];
            $id = $this->simpanBooking($idPenyewa, $l, $tgl, $slot, 'Dipesan', $dibuat);
            DB::table('pembayarans')->insert(['idBooking' => $id, 'idAdmin' => $oleh->idAdmin, 'tglBayar' => $dikirim->toDateString(),
                'jumlahBayar' => $jumlah, 'buktiBayar' => $this->bukti, 'dikirimPada' => $dikirim, 'status' => 'Ditolak', 'alasanTolak' => $alasan]);
            $this->logTolak($putusan, $oleh, $id, $alasan);

            return;
        }

        $id = $this->simpanBooking($idPenyewa, $l, $tgl, $slot, 'Dikonfirmasi', $dibuat, false, $oleh->idAdmin);
        DB::table('pembayarans')->insert(['idBooking' => $id, 'idAdmin' => $oleh->idAdmin, 'tglBayar' => $dikirim->toDateString(),
            'jumlahBayar' => $jumlah, 'buktiBayar' => $this->bukti, 'dikirimPada' => $dikirim, 'diverifikasiPada' => $putusan, 'status' => 'Terverifikasi']);
        $this->log[] = [$putusan, function () use ($oleh, $id) {
            Auth::guard('admin')->setUser($oleh);
            LogAktivitas::catat('terima', 'Pembayaran', Pemesanan::kode($id), [
                ['Status pembayaran', 'Menunggu Verifikasi', 'Terverifikasi'],
                ['Status booking', 'Dipesan', 'Dikonfirmasi'],
            ]);
        }];
    }

    private function logTolak(Carbon $waktu, Admin $oleh, int $id, string $alasan): void
    {
        $this->log[] = [$waktu, function () use ($oleh, $id, $alasan) {
            Auth::guard('admin')->setUser($oleh);
            LogAktivitas::catat('tolak', 'Pembayaran', Pemesanan::kode($id), [
                ['Status pembayaran', 'Menunggu Verifikasi', 'Ditolak'],
                ['Alasan penolakan', '—', $alasan],
            ]);
        }];
    }

    private function simpanBooking(int $idPenyewa, object $l, Carbon $tgl, array $slot, string $status, Carbon $dibuat, bool $olehPenyewa = false, ?int $idAdmin = null): int
    {
        return DB::table('bookings')->insertGetId([
            'idPenyewa' => $idPenyewa,
            'idLapangan' => $l->idLapangan,
            'idAdmin' => $idAdmin,
            'tanggal' => $tgl->toDateString(),
            'jamMulai' => sprintf('%02d:00:00', $slot[0]),
            'jamSelesai' => sprintf('%02d:00:00', $slot[1]),
            'totalBayar' => $l->tarifPerJam * ($slot[1] - $slot[0]),
            'status' => $status,
            'dibatalkanPenyewa' => $olehPenyewa,
            'created_at' => $dibuat,
        ], 'idBooking');
    }

    /** Dipesan 0–10 hari sebelumnya (kebanyakan dekat hari main), di jam operasional, dan tidak setelah sekarang. */
    private function waktuPesan(Carbon $mulai, Carbon $sekarang): Carbon
    {
        $hariSebelum = [0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5, 7, 10][mt_rand(0, 12)];
        $waktu = $mulai->copy()->subDays($hariSebelum)->setTime(mt_rand(8, 21), mt_rand(0, 59));
        if ($waktu->gte($mulai->copy()->subHour())) {
            $waktu = $mulai->copy()->subHours(mt_rand(2, 5));
        }

        return $waktu->gt($sekarang) ? $sekarang->copy()->subHours(mt_rand(3, 30)) : $waktu;
    }

    /** Admin memeriksa bukti di jam operasional: malam digeser ke pagi berikutnya. */
    private function jamOperasional(Carbon $waktu): Carbon
    {
        if ($waktu->hour < 8) {
            return $waktu->setTime(8, mt_rand(5, 40));
        }
        if ($waktu->hour >= 22) {
            return $waktu->addDay()->setTime(8, mt_rand(5, 40));
        }

        return $waktu;
    }

    /** Jam mulai condong ke sore dan malam, lama main 1 atau 2 jam, tidak bertabrakan di lapangan dan tanggal yang sama. */
    private function slotKosong(int $idLapangan, Carbon $tgl): ?array
    {
        for ($coba = 0; $coba < 12; $coba++) {
            $mulai = mt_rand(1, 10) <= 6 ? mt_rand(16, 21) : mt_rand(8, 15);
            $selesai = min(22, $mulai + (mt_rand(1, 10) <= 7 ? 1 : 2));
            $bentrok = false;
            foreach ($this->terpakai[$idLapangan.'|'.$tgl->toDateString()] ?? [] as [$a, $b]) {
                $bentrok = $bentrok || ($mulai < $b && $selesai > $a);
            }
            if (! $bentrok) {
                $this->tandai($idLapangan, $tgl, [$mulai, $selesai]);

                return [$mulai, $selesai];
            }
        }

        return null;
    }

    private function tandai(int $idLapangan, Carbon $tgl, array $slot): void
    {
        $this->terpakai[$idLapangan.'|'.$tgl->toDateString()][] = $slot;
    }

    private function salinBukti(): string
    {
        $tujuan = 'bukti/contoh-demo-'.(++$this->salinan).'.jpg';
        Storage::disk('local')->copy($this->bukti, $tujuan);

        return $tujuan;
    }

    /** Indeks terpilih dari daftar bobot. */
    private function pilih(array $bobot): int
    {
        $r = mt_rand(1, array_sum($bobot));
        foreach ($bobot as $i => $b) {
            if (($r -= $b) <= 0) {
                return $i;
            }
        }

        return 0;
    }
}
