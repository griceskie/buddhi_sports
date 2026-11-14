<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use App\Support\AnalitikBisnis;
use App\Support\Pemesanan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Halaman Analisis bisnis Manager (App\Support\AnalitikBisnis). Hari ini: Sabtu 14 Nov 2026. */
class AnalitikBisnisTest extends TestCase
{
    use RefreshDatabase;

    private Manager $manager;

    private Admin $admin;

    private int $bt;

    private int $basket;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-11-14 10:00:00'));
        $this->manager = Manager::create(['namaManager' => 'Jarwo', 'username' => 'Manager1', 'password' => Hash::make('Manager123')]);
        $this->admin = Admin::create(['namaAdmin' => 'Budi', 'username' => 'Admin1', 'password' => Hash::make('Admin123')]);
        $this->bt = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Airlangga', 'jenisLapangan' => 'Bulu Tangkis', 'tarifPerJam' => 50000, 'status' => 'Tersedia'], 'idLapangan');
        $this->basket = DB::table('lapangans')->insertGetId(['namaLapangan' => 'Merpati', 'jenisLapangan' => 'Basket', 'tarifPerJam' => 100000, 'status' => 'Tersedia'], 'idLapangan');
    }

    private function penyewa(string $nama): int
    {
        return Penyewa::create(['namaPenyewa' => $nama, 'noHp' => '081', 'email' => uniqid().'@example.com', 'password' => Hash::make('rahasia123')])->idPenyewa;
    }

    /** Booking terkonfirmasi 18.00–20.00 dengan pembayaran Terverifikasi di tanggal main. */
    private function main(int $idPenyewa, string $tgl, int $idLapangan, int $jumlah = 100000, string $status = 'Terverifikasi'): int
    {
        $b = DB::table('bookings')->insertGetId([
            'idPenyewa' => $idPenyewa, 'idLapangan' => $idLapangan, 'tanggal' => $tgl, 'jamMulai' => '18:00:00', 'jamSelesai' => '20:00:00',
            'totalBayar' => $jumlah, 'status' => $status === 'Terverifikasi' ? 'Dikonfirmasi' : 'Dipesan', 'created_at' => $tgl.' 09:00:00',
        ], 'idBooking');
        DB::table('pembayarans')->insert(['idBooking' => $b, 'tglBayar' => $tgl, 'jumlahBayar' => $jumlah, 'status' => $status]);

        return $b;
    }

    private function halaman(array $q): array
    {
        return (new AnalitikBisnis)->halaman($q);
    }

    public function test_satuan_grafik_mengikuti_jenis_periode(): void
    {
        $p = $this->penyewa('Rina');
        $this->main($p, '2025-12-10', $this->bt);
        $this->main($p, '2026-10-10', $this->bt);

        $this->assertCount(12, $this->halaman(['jenis' => 'bulan', 'th' => 2026, 'bl' => 10])['data']['grafik']['titik']);
        $kuartal = $this->halaman(['jenis' => 'kuartal', 'th' => 2026, 'q' => 4])['data']['grafik']['titik'];
        $this->assertSame(['Q1', 'Q2', 'Q3', 'Q4'], array_column($kuartal, 'label'));
        $this->assertSame([false, false, false, true], array_column($kuartal, 'terpilih'));
        $this->assertSame(['2025', '2026'], array_column($this->halaman(['jenis' => 'tahun', 'th' => 2026])['data']['grafik']['titik'], 'label'));
        // 12 bulan terakhir yang sudah selesai, tapi data baru mulai Desember 2025
        $rentang = $this->halaman(['jenis' => 'rentang', 'rentang' => '12'])['data']['grafik']['titik'];
        $this->assertCount(11, $rentang);
        $this->assertSame('Des ’25', $rentang[0]['label']);
        // bulan sebelum data dimulai tidak bisa dipilih
        $bulan2025 = $this->halaman(['jenis' => 'bulan', 'th' => 2025, 'bl' => 12])['data']['grafik']['titik'];
        $this->assertTrue($bulan2025[10]['mati']);
        $this->assertFalse($bulan2025[11]['mati']);
        $this->assertSame(['bl' => 12, 'q' => 4], $bulan2025[11]['tujuan']);
    }

    public function test_pendapatan_pembanding_dan_belum_final(): void
    {
        $p = $this->penyewa('Rina');
        $this->main($p, '2026-09-05', $this->bt, 100000);
        $this->main($p, '2026-10-05', $this->bt, 100000);
        $this->main($p, '2026-10-06', $this->basket, 200000);
        $this->main($p, '2026-10-07', $this->bt, 50000, 'Menunggu Verifikasi');
        DB::table('laporan_pembayarans')->insert(['idAdmin' => $this->admin->idAdmin, 'idManager' => $this->manager->idManager, 'bulan' => 9, 'tahun' => 2026,
            'totalPemasukan' => 100000, 'tglLaporan' => '2026-10-02', 'filePdf' => 'laporan/x.pdf', 'diperiksaPada' => '2026-10-03 10:00:00']);

        $okt = $this->halaman(['jenis' => 'bulan', 'th' => 2026, 'bl' => 10]);
        $this->assertSame('Analisis Oktober 2026', $okt['judul']);
        $this->assertSame('Rp300.000', $okt['data']['metrik'][0]['nilai']);
        $this->assertSame('+200%', $okt['data']['metrik'][0]['delta']['teks']);
        $this->assertSame('Rp400.000', $okt['data']['metrik'][1]['nilai']); // Pemasukan 2026 sampai Oktober
        $this->assertStringContainsString('1 bukti Oktober masih menunggu verifikasi', $okt['belumFinal']);
        $this->assertSame(['Rp100.000', 'Rp200.000'], array_column($okt['data']['perLapangan'], 'nilai'));
        // September laporannya sudah diperiksa: final, batangnya tidak bergaris
        $sep = $this->halaman(['jenis' => 'bulan', 'th' => 2026, 'bl' => 9]);
        $this->assertNull($sep['belumFinal']);
        $this->assertFalse($sep['data']['grafik']['titik'][8]['bergaris']);
        // bulan berjalan dipotong sampai hari ini dan dibandingkan dengan tanggal yang sama bulan lalu
        $nov = $this->halaman(['jenis' => 'bulan', 'th' => 2026, 'bl' => 11]);
        $this->assertSame('Sampai 14 Nov 2026 · dibanding 1–14 Okt 2026', $nov['deskripsi']);
        $this->assertStringContainsString('November masih berjalan', $nov['belumFinal']);
    }

    public function test_penyewa_baru_dan_yang_berhenti_datang(): void
    {
        $lama = $this->penyewa('Andi');
        foreach (['2026-06-01', '2026-06-15', '2026-07-10'] as $t) {
            $this->main($lama, $t, $this->bt);
        }
        $baru = $this->penyewa('Sari');
        $this->main($baru, '2026-10-20', $this->bt);

        $d = $this->halaman(['jenis' => 'bulan', 'th' => 2026, 'bl' => 10, 'tab' => 'penyewa'])['data'];
        $this->assertSame('1', $d['metrik'][0]['nilai']);
        $this->assertSame('1', $d['metrik'][1]['nilai']);
        $this->assertSame('Sari', $d['top']['daftar'][0]['nama']);
        $this->assertSame([['nama' => 'Andi', 'ket' => 'Terakhir main 10 Jul 2026', 'rinci' => '3 booking', 'nilai' => 'Rp300.000']], $d['berhenti']['daftar']);
    }

    public function test_lama_periksa_dihitung_di_jam_operasional(): void
    {
        $p = $this->penyewa('Rina');
        $b = $this->main($p, '2026-10-12', $this->bt);
        // dikirim 21.30, diterima besok 08.45: 30 menit malam itu + 45 menit pagi = 75 menit
        DB::table('pembayarans')->where('idBooking', $b)->update(['dikirimPada' => '2026-10-10 21:30:00']);
        DB::table('log_aktivitas')->insert(['waktu' => '2026-10-11 08:45:00', 'idAdmin' => $this->admin->idAdmin, 'namaAdmin' => 'Budi', 'aksi' => 'terima',
            'jenisObjek' => 'Pembayaran', 'kodeObjek' => Pemesanan::kode($b), 'ringkasan' => '-', 'rincian' => '{}', 'hashSebelumnya' => str_repeat('0', 64), 'hash' => str_repeat('1', 64)]);

        $d = $this->halaman(['jenis' => 'bulan', 'th' => 2026, 'bl' => 10, 'tab' => 'admin'])['data'];
        $this->assertSame('1', $d['metrik'][0]['nilai']);
        $this->assertSame('1 jam 15 menit', $d['metrik'][2]['nilai']);
        $this->assertSame('0%', $d['metrik'][3]['nilai']);
        $this->assertSame('Budi', $d['perAdmin'][0]['nama']);
        $this->assertSame('Admin1', $d['perAdmin'][0]['ket']);
        $this->assertSame('Belum dibuat', $d['laporan'][0]['dibuat']);
        $this->assertSame('Terlambat 9 hari', $d['laporan'][0]['tepat']);
    }

    public function test_blok_jam_kosong_dan_ramai_tidak_tumpang_tindih(): void
    {
        $p = $this->penyewa('Rina');
        $this->main($p, '2026-10-05', $this->bt);

        $d = $this->halaman(['jenis' => 'bulan', 'th' => 2026, 'bl' => 10, 'tab' => 'pola'])['data'];
        foreach (['kosong', 'ramai'] as $mode) {
            $this->assertCount(4, $d['blok'][$mode]);
            $mulai = [];
            foreach ($d['blok'][$mode] as $b) {
                preg_match('/^(.+), (\d\d)\.00/', $b['judul'], $m);
                foreach ($mulai[$m[1]] ?? [] as $lain) {
                    $this->assertGreaterThanOrEqual(3, abs($lain - (int) $m[2]));
                }
                $mulai[$m[1]][] = (int) $m[2];
            }
        }
        // satu-satunya booking (Senin 18.00–20.00): blok paling ramai yang pertama 17.00–20.00 (seri dengan 18.00–21.00, jam awal lebih dulu)
        $this->assertSame('Senin–Jumat, 17.00–20.00', $d['blok']['ramai'][0]['judul']);
        $this->assertSame(0, $d['peta'][0]['sel'][10]['blok']['ramai']);
        $this->assertSame('2 dari 868 jam buka (2 lapangan × 14 jam × 31 hari)', $d['terisi']['ket']);
    }

    public function test_halaman_rentang_sendiri_dan_akses(): void
    {
        $p = $this->penyewa('Rina');
        $this->main($p, '2026-10-05', $this->bt);

        $this->actingAs($this->admin, 'admin')->get('/manager/analisis')->assertRedirect('/login-pengelola');
        $this->actingAs($this->manager, 'manager')
            ->get('/manager/analisis?jenis=rentang&rentang=pilih&dari=2026-10-01&sampai=2026-10-15&tab=pendapatan')
            ->assertOk()
            ->assertInertia(fn (Assert $a) => $a->component('Manager/Analisis')
                ->where('judul', 'Analisis 1–15 Okt 2026')
                ->where('periode.rentang', 'pilih')
                ->where('data.metrik.0.nilai', 'Rp100.000'));
        $this->get('/manager/analisis?jenis=rentang&rentang=pilih&dari=2026-10-15&sampai=2026-10-01')->assertSessionHasErrors('sampai');
    }
}
