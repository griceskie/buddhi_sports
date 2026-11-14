<?php

namespace App\Support;

use App\Http\Controllers\MasterLaporanPembayaranController;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Halaman Analisis bisnis (Manager). Semua angka dan kalimat dihitung di sini; React hanya menampilkan.
 *
 * Periode: Bulanan, Kuartal, Tahunan, atau Rentang (tiga pilihan cepat atau tanggal sendiri). Data dimuat
 * sekali per permintaan (semua baris sejak data pertama, cukup kecil untuk satu GOR) lalu dijumlah di PHP,
 * supaya grafik, pembanding, dan tahun berjalan memakai satu sumber dan query-nya sama di SQLite dan MySQL.
 * - Pendapatan: pembayaran Terverifikasi menurut tanggal bayar (sama dengan PDF laporan).
 * - Penyewa: penyewa dari pembayaran Terverifikasi.
 * - Pola booking: booking Dikonfirmasi menurut tanggal main.
 * - Kinerja Admin: baris log terima/tolak bukti; lama periksa dihitung di jam operasional.
 */
class AnalitikBisnis
{
    public const TAB = ['pendapatan', 'penyewa', 'pola', 'admin'];

    public const JENIS = ['bulan', 'kuartal', 'tahun', 'rentang'];

    public const RENTANG = ['awal' => 'Sejak awal tahun', '6' => '6 bulan terakhir', '12' => '12 bulan terakhir'];

    /** Warna per lapangan menurut urutan id, sama dengan grafik Laporan pembayaran Admin. */
    public const WARNA_LAPANGAN = ['var(--primary)', '#0891b2', '#7c3aed', '#f59e0b', '#16a34a', '#e11d48'];

    private const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    private const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    private const HARI_PANJANG = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    private const MINGGU_PER_BULAN = 4.345;

    private Carbon $hariIni;

    private Carbon $awalData;

    private Collection $lapangan;

    private int $jamBuka;

    /** @var array<string, object> laporan per 'YYYY-MM' */
    private array $laporan;

    public function __construct()
    {
        $this->hariIni = today();
        $mulai = collect([DB::table('pembayarans')->min('tglBayar'), DB::table('bookings')->min('tanggal')])->filter()->min();
        $this->awalData = $mulai ? Carbon::parse($mulai)->startOfMonth() : $this->hariIni->copy()->startOfMonth();
        if ($this->awalData->gt($this->hariIni)) {
            $this->awalData = $this->hariIni->copy()->startOfMonth();
        }
        $this->lapangan = DB::table('lapangans')->orderBy('idLapangan')->get(['idLapangan', 'namaLapangan', 'jenisLapangan', 'tarifPerJam'])
            ->values()->map(fn ($l, $i) => (object) ((array) $l + ['warna' => self::WARNA_LAPANGAN[$i % count(self::WARNA_LAPANGAN)]]));
        $this->jamBuka = Pemesanan::JAM_TUTUP - Pemesanan::JAM_BUKA;
        $this->laporan = DB::table('laporan_pembayarans')->get()
            ->keyBy(fn ($l) => sprintf('%04d-%02d', $l->tahun, $l->bulan))->all();
    }

    /** Props halaman untuk query string yang sudah divalidasi controller. */
    public function halaman(array $q): array
    {
        $p = $this->periode($q);
        $tab = in_array($q['tab'] ?? null, self::TAB, true) ? $q['tab'] : 'pendapatan';
        $lalu = $this->lalu($p);
        $bulanBelum = [];
        foreach ($this->bulanDi($p['awal'], $p['akhir']) as $b) {
            if ($alasan = $this->belumFinal($b)) {
                $bulanBelum[] = $alasan['ket'];
            }
        }

        $ctx = ['p' => $p, 'lalu' => $lalu, 'titik' => $this->titik($p)];

        return [
            'periode' => [
                'jenis' => $p['jenis'], 'th' => $p['th'], 'bl' => $p['bl'], 'q' => $p['q'], 'rentang' => $p['rentang'],
                'dari' => $p['jenis'] === 'rentang' ? $p['awal']->toDateString() : null,
                'sampai' => $p['jenis'] === 'rentang' ? $p['akhir']->toDateString() : null,
                'tab' => $tab,
            ],
            'pilihan' => $this->pilihan(),
            'judul' => 'Analisis '.$p['nama'],
            'deskripsi' => $p['cakupan'].' · '.($lalu ? 'dibanding '.$lalu['label'] : 'belum ada pembanding'),
            'belumFinal' => $bulanBelum ? implode(' ', $bulanBelum).' Angka akan tetap setelah laporannya Anda periksa.' : null,
            'rentangTeks' => $this->teksRentang($p['awal'], $p['akhir']),
            'data' => match ($tab) {
                'penyewa' => $this->tabPenyewa($ctx),
                'pola' => $this->tabPola($ctx),
                'admin' => $this->tabAdmin($ctx),
                default => $this->tabPendapatan($ctx),
            },
        ];
    }

    // ===== Periode

    private function periode(array $q): array
    {
        $kini = $this->hariIni->copy()->startOfMonth();
        $jenis = in_array($q['jenis'] ?? null, self::JENIS, true) ? $q['jenis'] : 'bulan';
        // bawaan: bulan terakhir yang sudah selesai (kalau datanya ada), seperti di kanvas
        $bawaan = $kini->copy()->subMonth()->gte($this->awalData) ? $kini->copy()->subMonth() : $kini;
        $th = max($this->awalData->year, min($kini->year, (int) ($q['th'] ?? $bawaan->year)));
        $bl = (int) ($q['bl'] ?? $bawaan->month);
        $bulanAda = $this->bulanTersedia($th);
        if (! in_array($bl, $bulanAda, true)) {
            $bl = in_array($bawaan->month, $bulanAda, true) && $th === $bawaan->year ? $bawaan->month : end($bulanAda);
        }
        $kuartalAda = $this->kuartalTersedia($th);
        $q4 = (int) ($q['q'] ?? ceil($bl / 3));
        if (! in_array($q4, $kuartalAda, true)) {
            $q4 = (int) ceil($bl / 3);
            $q4 = in_array($q4, $kuartalAda, true) ? $q4 : end($kuartalAda);
        }
        $rentang = array_key_exists($q['rentang'] ?? '', self::RENTANG + ['pilih' => 1]) ? (string) $q['rentang'] : '12';

        $selesai = $kini->copy()->subMonth();
        [$awal, $akhir, $geser, $nama] = match ($jenis) {
            'kuartal' => [Carbon::create($th, ($q4 - 1) * 3 + 1, 1), Carbon::create($th, $q4 * 3, 1)->endOfMonth(), 3, 'Kuartal '.$q4.' '.$th],
            'tahun' => [Carbon::create($th, 1, 1), Carbon::create($th, 12, 31), 12, 'tahun '.$th],
            'rentang' => match ($rentang) {
                'awal' => [$kini->copy()->startOfYear(), $kini->copy()->endOfMonth(), null, null],
                '6' => [$selesai->copy()->subMonths(5), $selesai->copy()->endOfMonth(), null, null],
                'pilih' => $this->rentangSendiri($q),
                default => [$selesai->copy()->subMonths(11), $selesai->copy()->endOfMonth(), null, null],
            },
            default => [Carbon::create($th, $bl, 1), Carbon::create($th, $bl, 1)->endOfMonth(), 1, self::BULAN[$bl - 1].' '.$th],
        };
        if ($jenis === 'rentang' && $rentang === 'pilih' && $awal === null) {
            $rentang = '12';
            [$awal, $akhir] = [$selesai->copy()->subMonths(11), $selesai->copy()->endOfMonth()];
        }
        $penuhAwal = $awal->copy();
        $penuhAkhir = $akhir->copy();
        $awal = $awal->lt($this->awalData) ? $this->awalData->copy() : $awal;
        $akhir = $akhir->gt($this->hariIni) ? $this->hariIni->copy() : $akhir;
        if ($akhir->lt($awal)) {
            $akhir = $awal->copy();
        }
        if ($jenis === 'rentang') {
            $nama = $this->teksRentang($awal, $akhir);
            // pilihan cepat dibandingkan dengan jumlah bulan yang sama sebelumnya; tanggal sendiri dengan jumlah hari yang sama
            $geser = $rentang === 'pilih' ? null : $this->bulanDi($awal, $akhir)->count();
        }

        return [
            'jenis' => $jenis, 'th' => $th, 'bl' => $bl, 'q' => $q4, 'rentang' => $rentang,
            'awal' => $awal, 'akhir' => $akhir, 'akhirPenuh' => $penuhAkhir->gt($this->hariIni) && $penuhAkhir->gte($awal) ? $penuhAkhir : $akhir,
            'geser' => $geser, 'nama' => $nama,
            'kata' => ['bulan' => 'bulan lalu', 'kuartal' => 'kuartal lalu', 'tahun' => 'tahun lalu', 'rentang' => 'periode sebelumnya'][$jenis],
            'cakupan' => $awal->gt($penuhAwal) ? 'Data mulai '.$this->bulanSingkat($this->awalData).' '.$this->awalData->year
                : ($penuhAkhir->gt($this->hariIni) ? 'Sampai '.$this->tgl($this->hariIni, true) : 'Periode penuh'),
        ];
    }

    /** Rentang tanggal sendiri (?dari=&sampai=), dipotong ke data yang ada. Null bila tidak sah. */
    private function rentangSendiri(array $q): array
    {
        try {
            $dari = Carbon::createFromFormat('!Y-m-d', (string) ($q['dari'] ?? ''));
            $sampai = Carbon::createFromFormat('!Y-m-d', (string) ($q['sampai'] ?? ''));
        } catch (\Throwable) {
            return [null, null, null, null];
        }
        if (! $dari || ! $sampai || $sampai->lt($dari) || $sampai->lt($this->awalData) || $dari->gt($this->hariIni)) {
            return [null, null, null, null];
        }

        return [$dari, $sampai, null, null];
    }

    /** Periode pembanding: digeser sebanyak satuannya, bulan berjalan dipotong ke tanggal yang sama. */
    private function lalu(array $p): ?array
    {
        if ($p['geser'] === null) {
            $hari = (int) $p['awal']->diffInDays($p['akhir']) + 1;
            $akhir = $p['awal']->copy()->subDay();
            $awal = $akhir->copy()->subDays($hari - 1);
        } else {
            $awal = $p['awal']->copy()->subMonthsNoOverflow($p['geser']);
            $akhir = $p['akhir']->isSameDay($p['akhir']->copy()->endOfMonth())
                ? $p['akhir']->copy()->subMonthsNoOverflow($p['geser'])->endOfMonth()
                : $p['akhir']->copy()->subMonthsNoOverflow($p['geser']);
        }
        if ($awal->lt($this->awalData)) {
            return null;
        }

        return ['awal' => $awal, 'akhir' => $akhir, 'label' => $this->teksRentang($awal, $akhir)];
    }

    /** Satuan grafik: bulan (Jan–Des), kuartal (Q1–Q4), tahun, atau bulan di dalam rentang. */
    private function titik(array $p): array
    {
        $out = [];
        $buat = function (Carbon $awal, Carbon $akhir, string $label, string $judul, array $tujuan) use ($p, &$out) {
            $ef0 = $awal->lt($this->awalData) ? $this->awalData->copy() : $awal->copy();
            $ef1 = $akhir->gt($this->hariIni) ? $this->hariIni->copy() : $akhir->copy();
            if ($p['jenis'] === 'rentang') {
                $ef0 = $ef0->lt($p['awal']) ? $p['awal']->copy() : $ef0;
                $ef1 = $ef1->gt($p['akhir']) ? $p['akhir']->copy() : $ef1;
            }
            $ada = $ef1->gte($ef0);
            $terpilih = $ada && $awal->lte($p['akhir']) && $akhir->gte($p['awal']);
            $belum = $ada && $this->bulanDi($ef0, $ef1)->contains(fn ($b) => $this->belumFinal($b) !== null);
            $kini = $ada && $akhir->gte($this->hariIni) && $awal->lte($this->hariIni);
            $out[] = [
                'awal' => $ef0, 'akhir' => $ef1, 'ada' => $ada, 'terpilih' => $terpilih, 'bergaris' => $terpilih && $belum,
                'resmi' => ! $belum, 'label' => $label, 'tujuan' => $tujuan, 'depan' => $awal->gt($this->hariIni),
                'awalan' => $ada && $awal->lt($this->awalData),
                'judul' => $judul.($kini ? ($awal->isSameMonth($akhir) ? ' (1–'.$this->hariIni->day.' '.$this->bulanSingkat($this->hariIni).')' : ' (sampai '.$this->tgl($this->hariIni).')') : ''),
            ];
        };
        if ($p['jenis'] === 'bulan') {
            for ($m = 1; $m <= 12; $m++) {
                $a = Carbon::create($p['th'], $m, 1);
                $buat($a, $a->copy()->endOfMonth(), $this->bulanSingkat($a), self::BULAN[$m - 1].' '.$p['th'], ['bl' => $m, 'q' => (int) ceil($m / 3)]);
            }
        } elseif ($p['jenis'] === 'kuartal') {
            for ($k = 1; $k <= 4; $k++) {
                $a = Carbon::create($p['th'], ($k - 1) * 3 + 1, 1);
                $z = $a->copy()->addMonths(2)->endOfMonth();
                $buat($a, $z, 'Q'.$k, 'Kuartal '.$k.' '.$p['th'].' ('.$this->bulanSingkat($a).'–'.$this->bulanSingkat($z).')', ['q' => $k]);
            }
        } elseif ($p['jenis'] === 'tahun') {
            for ($y = $this->awalData->year; $y <= $this->hariIni->year; $y++) {
                $buat(Carbon::create($y, 1, 1), Carbon::create($y, 12, 31), (string) $y, 'Tahun '.$y, ['th' => $y]);
            }
        } else {
            foreach ($this->bulanDi($p['awal'], $p['akhir']) as $i => $a) {
                $label = $this->bulanSingkat($a).($a->month === 1 || $i === 0 ? ' ’'.substr((string) $a->year, 2) : '');
                $buat($a, $a->copy()->endOfMonth(), $label, self::BULAN[$a->month - 1].' '.$a->year, ['jenis' => 'bulan', 'th' => $a->year, 'bl' => $a->month, 'q' => (int) ceil($a->month / 3)]);
            }
        }

        return $out;
    }

    private function pilihan(): array
    {
        $tahun = range($this->awalData->year, $this->hariIni->year);

        return [
            'tahun' => array_reverse($tahun),
            'bulan' => collect($tahun)->mapWithKeys(fn ($y) => [$y => $this->bulanTersedia($y)])->all(),
            'kuartal' => collect($tahun)->mapWithKeys(fn ($y) => [$y => $this->kuartalTersedia($y)])->all(),
            'rentang' => self::RENTANG,
            'awalData' => $this->awalData->toDateString(),
            'hariIni' => $this->hariIni->toDateString(),
        ];
    }

    private function bulanTersedia(int $th): array
    {
        return array_values(array_filter(range(1, 12), function ($m) use ($th) {
            $a = Carbon::create($th, $m, 1);

            return $a->gte($this->awalData) && $a->lte($this->hariIni);
        }));
    }

    private function kuartalTersedia(int $th): array
    {
        $bulan = $this->bulanTersedia($th);

        return array_values(array_unique(array_map(fn ($m) => (int) ceil($m / 3), $bulan)));
    }

    /** @return Collection<int, Carbon> awal tiap bulan yang tersentuh rentang */
    private function bulanDi(Carbon $awal, Carbon $akhir): Collection
    {
        $out = collect();
        for ($b = $awal->copy()->startOfMonth(); $b->lte($akhir); $b->addMonth()) {
            $out->push($b->copy());
        }

        return $out;
    }

    /** Alasan bulan belum final (laporannya belum diperiksa Manager), atau null. */
    private function belumFinal(Carbon $bulan): ?array
    {
        $nama = self::BULAN[$bulan->month - 1];
        if ($bulan->isSameMonth($this->hariIni)) {
            return ['teks' => 'Berjalan', 'ket' => $nama.' masih berjalan. Angkanya dihitung sampai hari ini.'];
        }
        $l = $this->laporan[$bulan->format('Y-m')] ?? null;
        if ($l && $l->diperiksaPada) {
            return null;
        }
        if ($l && $l->revisiPada) {
            return ['teks' => 'Perlu revisi', 'ket' => 'Laporan '.$nama.' sedang direvisi, jadi angkanya bisa berubah.'];
        }
        if ($l && $l->filePdf) {
            return ['teks' => 'Menunggu diperiksa', 'ket' => 'Laporan '.$nama.' belum Anda periksa.'];
        }
        $menunggu = $this->menungguDi($bulan);
        if ($menunggu > 0) {
            return ['teks' => 'Belum bisa dibuat', 'ket' => $nama.' sudah selesai, tapi '.$menunggu.' bukti '.$nama.' masih menunggu verifikasi, jadi laporannya belum bisa dibuat dan angkanya masih bisa naik.'];
        }

        return ['teks' => 'Belum dibuat', 'ket' => 'Laporan '.$nama.' belum dibuat Admin.'];
    }

    private array $menunggu = [];

    private function menungguDi(Carbon $bulan): int
    {
        if (! $this->menunggu) {
            $this->menunggu = ['-' => 0];
            foreach (DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')->pluck('tglBayar') as $t) {
                $k = substr((string) $t, 0, 7);
                $this->menunggu[$k] = ($this->menunggu[$k] ?? 0) + 1;
            }
        }

        return $this->menunggu[$bulan->format('Y-m')] ?? 0;
    }

    // ===== Tab Pendapatan

    private function tabPendapatan(array $c): array
    {
        $p = $c['p'];
        $bayar = $this->bayarTerverifikasi();
        $kini = $this->jumlahPendapatan($bayar, $p['awal'], $p['akhir']);
        $lalu = $c['lalu'] ? $this->jumlahPendapatan($bayar, $c['lalu']['awal'], $c['lalu']['akhir']) : null;
        $banding = fn (string $nilai) => 'Dibanding '.($c['lalu']['label'] ?? '').': '.$nilai;

        if (in_array($p['jenis'], ['bulan', 'kuartal'], true)) {
            $y0 = Carbon::create($p['th'], 1, 1)->max($this->awalData);
            $ytd = $this->jumlahPendapatan($bayar, $y0, $p['akhir']);
            $y0Lalu = $y0->copy()->subYear();
            $ytdLalu = $y0Lalu->gte($this->awalData) ? $this->jumlahPendapatan($bayar, $y0Lalu, $p['akhir']->copy()->subYearNoOverflow()) : null;
            $rTh = $y0->isSameMonth($p['akhir']) ? $this->bulanSingkat($y0) : $this->bulanSingkat($y0).'–'.$this->bulanSingkat($p['akhir']);
            $metrik2 = [
                'judul' => 'Pemasukan '.$p['th'], 'nilai' => self::rp($ytd['rev']),
                'ket' => $rTh.' '.$p['th'].'. '.($ytdLalu ? ($p['th'] - 1).' periode sama '.self::rp($ytdLalu['rev']) : 'Belum ada data '.($p['th'] - 1).' untuk periode yang sama'),
                'delta' => $this->delta($ytd['rev'], $ytdLalu['rev'] ?? null, 'Dibanding '.($p['th'] - 1).': '.($ytdLalu ? self::rp($ytdLalu['rev']) : '-')),
            ];
        } else {
            $bln = $this->jumlahBulan($p['awal'], $p['akhir']);
            $rata = $bln ? $kini['rev'] / $bln : 0;
            $rataLalu = $lalu ? $lalu['rev'] / max(0.01, $this->jumlahBulan($c['lalu']['awal'], $c['lalu']['akhir'])) : null;
            $metrik2 = [
                'judul' => 'Rata-rata per bulan', 'nilai' => self::rp(round($rata / 1000) * 1000),
                'ket' => 'Dari '.self::desimal($bln).' bulan data'.($lalu ? '. Sebelumnya '.self::rp(round($rataLalu / 1000) * 1000) : ''),
                'delta' => $this->delta($rata, $rataLalu, $banding($lalu ? self::rp(round($rataLalu / 1000) * 1000) : '-')),
            ];
        }
        $perBk = $kini['booking'] ? $kini['rev'] / $kini['booking'] : 0;
        $perBkLalu = $lalu && $lalu['booking'] ? $lalu['rev'] / $lalu['booking'] : null;
        $metrik = [
            [
                'judul' => 'Pemasukan', 'nilai' => self::rp($kini['rev']),
                'ket' => self::angka($kini['booking']).' booking terverifikasi. '.($lalu ? 'Sebelumnya '.self::rp($lalu['rev']) : 'Belum ada data '.$p['kata']),
                'delta' => $this->delta($kini['rev'], $lalu['rev'] ?? null, $banding($lalu ? self::rp($lalu['rev']) : '-')),
            ],
            $metrik2,
            [
                'judul' => 'Rata-rata per booking', 'nilai' => self::rp(round($perBk / 1000) * 1000),
                'ket' => 'Rata-rata '.self::desimal($kini['booking'] ? $kini['jam'] / $kini['booking'] : 0).' jam main per booking',
                'delta' => $this->delta($perBk, $perBkLalu, $banding($perBkLalu ? self::rp(round($perBkLalu / 1000) * 1000) : '-')),
            ],
        ];

        // grafik bertumpuk per lapangan
        $nilai = array_map(fn ($t) => $t['ada'] ? $this->jumlahPendapatan($bayar, $t['awal'], $t['akhir']) : null, $c['titik']);
        $maks = max(array_map(fn ($d) => $d['rev'] ?? 0, $nilai) ?: [0]);
        $atas = max(5_000_000, (int) ceil($maks / 5_000_000) * 5_000_000);
        $grafik = $this->grafik($c, $nilai, fn ($d) => $d['rev'] / $atas, function ($d, $t) {
            return [
                'nilai' => self::rp($d['rev']),
                'ket' => self::angka($d['booking']).' booking · '.($t['resmi'] ? 'laporan sudah diperiksa' : 'belum final').($t['awalan'] ? ' · data mulai '.$this->bulanSingkat($this->awalData).' '.$this->awalData->year : ''),
                'segmen' => $this->lapangan->map(fn ($l) => ['warna' => $l->warna, 'porsi' => $d['rev'] ? round(($d['lapRev'][$l->idLapangan] ?? 0) / $d['rev'] * 100, 2) : 0])->all(),
                'rinci' => $this->lapangan->map(fn ($l) => ['warna' => $l->warna, 'nama' => $l->namaLapangan, 'nilai' => self::rp($d['lapRev'][$l->idLapangan] ?? 0)])->all(),
            ];
        });
        $grafik['judul'] = ['tahun' => 'Pemasukan per tahun', 'kuartal' => 'Pemasukan per kuartal '.$p['th'], 'bulan' => 'Pemasukan per bulan '.$p['th'], 'rentang' => 'Pemasukan per bulan'][$p['jenis']];
        $grafik['sumbu'] = array_map(fn ($v) => ['pos' => $v * 25, 'label' => self::juta($atas * $v / 4)], range(0, 4));
        $grafik['legenda'] = $this->lapangan->map(fn ($l) => ['warna' => $l->warna, 'nama' => $l->namaLapangan])->push(['warna' => 'garis', 'nama' => 'Belum final'])->all();

        $tot = $kini['rev'] ?: 1;
        $maksLap = max($kini['lapRev'] ?: [0]) ?: 1;
        $jenisOlahraga = $this->lapangan->groupBy('jenisLapangan');

        return [
            'metrik' => $metrik,
            'grafik' => $grafik,
            'perLapangan' => $this->lapangan->map(fn ($l) => [
                'nama' => $l->namaLapangan, 'warna' => $l->warna, 'nilai' => self::rp($kini['lapRev'][$l->idLapangan] ?? 0),
                'porsi' => self::persen(($kini['lapRev'][$l->idLapangan] ?? 0) / $tot), 'lebar' => round(($kini['lapRev'][$l->idLapangan] ?? 0) / $maksLap * 100, 2),
            ])->all(),
            'perOlahraga' => $jenisOlahraga->map(function ($ls, $jenis) use ($kini, $tot) {
                $rev = $ls->sum(fn ($l) => $kini['lapRev'][$l->idLapangan] ?? 0);
                $jam = $ls->sum(fn ($l) => $kini['lapJam'][$l->idLapangan] ?? 0);
                $tarif = $ls->pluck('tarifPerJam')->unique()->sort()->values();

                return [
                    'nama' => ucfirst(strtolower($jenis)), 'warna' => strtolower($jenis) === 'basket' ? '#f59e0b' : 'var(--primary)',
                    'nilai' => self::rp($rev), 'lebar' => round($rev / $tot * 100, 2),
                    'ket' => self::persen($rev / $tot).' · '.self::angka($jam).' jam · '.$ls->count().' lapangan, '
                        .($tarif->count() > 1 ? self::rp($tarif->first()).'–'.self::rp($tarif->last()) : self::rp($tarif->first() ?? 0)).'/jam',
                ];
            })->values()->all(),
            'bocor' => $this->bocor($p, $kini['booking']),
        ];
    }

    /** Booking batal dan bukti yang masih ditolak dengan jadwal main di periode (sampai akhir periode, termasuk yang akan datang). */
    private function bocor(array $p, int $bookingTerverifikasi): array
    {
        $rentang = [$p['awal']->toDateString(), $p['akhirPenuh']->toDateString()];
        $batal = DB::table('bookings')->where('status', 'Dibatalkan')->whereBetween('tanggal', $rentang)->get(['idBooking', 'dibatalkanPenyewa', 'totalBayar']);
        $otomatis = DB::table('log_aktivitas')->where('aksi', 'otomatis')->where('jenisObjek', 'Booking')->pluck('kodeObjek')->flip();
        $sebab = fn ($b) => $b->dibatalkanPenyewa ? 'penyewa' : ($otomatis->has(Pemesanan::kode($b->idBooking)) ? 'otomatis' : 'pengelola');
        $nB = $batal->count();
        $per = collect(['otomatis', 'penyewa', 'pengelola'])->mapWithKeys(fn ($k) => [$k => $batal->filter(fn ($b) => $sebab($b) === $k)]);
        $maksS = max(1, ...$per->map->count()->values()->all());
        $tolak = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->where('pembayarans.status', 'Ditolak')->where('bookings.status', 'Dipesan')
            ->whereBetween('bookings.tanggal', $rentang)
            ->orderBy('bookings.tanggal')->orderBy('bookings.jamMulai')
            ->get(['bookings.idBooking', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.totalBayar', 'penyewas.namaPenyewa', 'lapangans.namaLapangan']);
        $rpTolak = (int) $tolak->sum('totalBayar');

        return [
            'batal' => self::rp($batal->sum('totalBayar')),
            'batalKet' => self::angka($nB).' booking batal. Itu '.self::persen($nB + $bookingTerverifikasi ? $nB / ($nB + $bookingTerverifikasi) : 0).' dari semua booking di periode ini.',
            'tolak' => $tolak->count().' bukti',
            'tolakKet' => $tolak->count() ? self::rp($rpTolak).' belum masuk. Penyewa belum mengirim bukti baru.' : 'Tidak ada di periode ini.',
            'sebab' => collect([
                ['otomatis', 'Tidak dibayar dalam '.config('pembayaran.batas_bayar_menit', 60).' menit', '#f59e0b', 'Booking tanpa bukti bayar dibatalkan sistem setelah '.config('pembayaran.batas_bayar_menit', 60).' menit.'],
                ['penyewa', 'Dibatalkan penyewa', '#0ea5e9', 'Penyewa hanya bisa membatalkan sebelum mengirim bukti bayar.'],
                ['pengelola', 'Dibatalkan pengelola', '#7c3aed', 'Admin wajib menulis alasan. Alasannya bisa dibaca di Log aktivitas.'],
            ])->map(fn ($s) => [
                'judul' => $s[1], 'warna' => $s[2], 'wawasan' => $s[3],
                'n' => $per[$s[0]]->count().' booking', 'nilai' => self::rp($per[$s[0]]->sum('totalBayar')),
                'porsi' => self::persen($nB ? $per[$s[0]]->count() / $nB : 0), 'lebar' => round($per[$s[0]]->count() / $maksS * 100, 2),
            ])->all(),
            'daftarTolak' => $tolak->take(3)->map(fn ($r) => [
                'judul' => Pemesanan::kode($r->idBooking).' · '.$r->namaPenyewa,
                'rinci' => $r->namaLapangan.' · '.$this->tgl($t = Carbon::parse($r->tanggal), $t->year !== $this->hariIni->year).' · '.substr($r->jamMulai, 0, 2).'.00–'.substr($r->jamSelesai, 0, 2).'.00',
                'nilai' => self::rp($r->totalBayar),
            ])->values()->all(),
            'sisaTolak' => $tolak->count() > 3 ? 'Dan '.($tolak->count() - 3).' bukti lainnya.' : '',
        ];
    }

    private ?Collection $bayar = null;

    /** Semua pembayaran Terverifikasi dengan lapangan, lama main, dan penyewanya. */
    private function bayarTerverifikasi(): Collection
    {
        return $this->bayar ??= DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->where('pembayarans.status', 'Terverifikasi')
            ->orderBy('pembayarans.tglBayar')
            ->get(['pembayarans.tglBayar', 'pembayarans.jumlahBayar', 'bookings.idBooking', 'bookings.idLapangan', 'bookings.idPenyewa', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai'])
            ->map(function ($r) {
                $r->tglBayar = substr((string) $r->tglBayar, 0, 10);
                $r->jam = (int) substr($r->jamSelesai, 0, 2) - (int) substr($r->jamMulai, 0, 2);

                return $r;
            });
    }

    private function jumlahPendapatan(Collection $bayar, Carbon $awal, Carbon $akhir): array
    {
        [$a, $b] = [$awal->toDateString(), $akhir->toDateString()];
        $out = ['rev' => 0, 'booking' => 0, 'jam' => 0, 'lapRev' => [], 'lapJam' => []];
        foreach ($bayar as $r) {
            if ($r->tglBayar < $a || $r->tglBayar > $b) {
                continue;
            }
            $out['rev'] += (int) $r->jumlahBayar;
            $out['booking']++;
            $out['jam'] += $r->jam;
            $out['lapRev'][$r->idLapangan] = ($out['lapRev'][$r->idLapangan] ?? 0) + (int) $r->jumlahBayar;
            $out['lapJam'][$r->idLapangan] = ($out['lapJam'][$r->idLapangan] ?? 0) + $r->jam;
        }

        return $out;
    }

    // ===== Tab Penyewa

    private function tabPenyewa(array $c): array
    {
        $p = $c['p'];
        $bayar = $this->bayarTerverifikasi();
        $pertama = [];
        foreach ($bayar as $r) {
            $pertama[$r->idPenyewa] ??= $r->tglBayar;
        }
        $hitung = function (Carbon $awal, Carbon $akhir) use ($bayar, $pertama) {
            [$a, $b] = [$awal->toDateString(), $akhir->toDateString()];
            $peny = [];
            foreach ($bayar as $r) {
                if ($r->tglBayar >= $a && $r->tglBayar <= $b) {
                    $peny[$r->idPenyewa] ??= [0, 0];
                    $peny[$r->idPenyewa][0]++;
                    $peny[$r->idPenyewa][1] += (int) $r->jumlahBayar;
                }
            }
            $baru = count(array_filter(array_keys($peny), fn ($id) => $pertama[$id] >= $a && $pertama[$id] <= $b));

            return ['peny' => $peny, 'total' => count($peny), 'baru' => $baru, 'booking' => array_sum(array_column($peny, 0)), 'rev' => array_sum(array_column($peny, 1))];
        };
        $kini = $hitung($p['awal'], $p['akhir']);
        $lalu = $c['lalu'] ? $hitung($c['lalu']['awal'], $c['lalu']['akhir']) : null;
        $banding = fn (string $v) => 'Dibanding '.($c['lalu']['label'] ?? '').': '.$v;
        $perPeny = $kini['total'] ? $kini['booking'] / $kini['total'] : 0;
        $perPenyLalu = $lalu && $lalu['total'] ? $lalu['booking'] / $lalu['total'] : null;
        $kembali = $kini['total'] - $kini['baru'];

        $nilai = array_map(fn ($t) => $t['ada'] ? $hitung($t['awal'], $t['akhir']) : null, $c['titik']);
        $atas = max(10, (int) ceil(max(array_map(fn ($d) => $d['total'] ?? 0, $nilai) ?: [0]) / 10) * 10);
        $grafik = $this->grafik($c, $nilai, fn ($d) => $d['total'] / $atas, fn ($d) => [
            'nilai' => self::angka($d['total']).' penyewa',
            'ket' => self::angka($d['total'] - $d['baru']).' kembali · '.self::angka($d['baru']).' baru',
            'segmen' => [
                ['warna' => 'var(--primary)', 'porsi' => $d['total'] ? round(($d['total'] - $d['baru']) / $d['total'] * 100, 2) : 0],
                ['warna' => '#0ea5e9', 'porsi' => $d['total'] ? round($d['baru'] / $d['total'] * 100, 2) : 0],
            ],
            'rinci' => [],
        ]);
        $grafik['judul'] = 'Penyewa per '.(['tahun' => 'tahun', 'kuartal' => 'kuartal'][$p['jenis']] ?? 'bulan');
        $grafik['sumbu'] = array_map(fn ($v) => ['pos' => $v * 25, 'label' => self::angka($atas * $v / 4)], range(0, 4));
        $grafik['legenda'] = [['warna' => 'var(--primary)', 'nama' => 'Penyewa yang kembali'], ['warna' => '#0ea5e9', 'nama' => 'Penyewa baru']];

        $nama = DB::table('penyewas')->pluck('namaPenyewa', 'idPenyewa');
        $urut = collect($kini['peny'])->map(fn ($v, $id) => ['nama' => $nama[$id] ?? 'Penyewa terhapus', 'n' => $v[0], 'rp' => $v[1]])
            ->sort(fn ($x, $y) => $y['rp'] <=> $x['rp'] ?: strcmp($x['nama'], $y['nama']))->values();
        $top = $urut->take(5);
        $rpTop = $top->sum('rp');
        $maksP = $top->first()['rp'] ?? 1;

        // berhenti datang: minimal 3 booking terbayar sampai akhir periode, main terakhir lebih dari 60 hari sebelum akhir periode
        $akhir = $p['akhir']->toDateString();
        $riwayat = [];
        foreach ($bayar as $r) {
            $tgl = substr((string) $r->tanggal, 0, 10);
            if ($tgl > $akhir) {
                continue;
            }
            $x = $riwayat[$r->idPenyewa] ?? ['n' => 0, 'rp' => 0, 'akhir' => ''];
            $x['n']++;
            $x['rp'] += (int) $r->jumlahBayar;
            $x['akhir'] = max($x['akhir'], $tgl);
            $riwayat[$r->idPenyewa] = $x;
        }
        $batasHilang = $p['akhir']->copy()->subDays(60)->toDateString();
        $hilang = collect($riwayat)->filter(fn ($x) => $x['n'] >= 3 && $x['akhir'] < $batasHilang)
            ->map(fn ($x, $id) => $x + ['nama' => $nama[$id] ?? 'Penyewa terhapus'])->sortByDesc('rp')->values();

        return [
            'metrik' => [
                ['judul' => 'Penyewa yang membayar', 'nilai' => self::angka($kini['total']), 'ket' => $lalu ? 'Sebelumnya '.self::angka($lalu['total']).' penyewa' : 'Belum ada data '.$p['kata'],
                    'delta' => $this->delta($kini['total'], $lalu['total'] ?? null, $banding($lalu ? self::angka($lalu['total']) : '-'))],
                ['judul' => 'Penyewa baru', 'nilai' => self::angka($kini['baru']), 'ket' => 'Baru pertama kali membayar di periode ini',
                    'delta' => $this->delta($kini['baru'], $lalu['baru'] ?? null, $banding($lalu ? self::angka($lalu['baru']) : '-'))],
                ['judul' => 'Penyewa yang kembali', 'nilai' => self::persen($kini['total'] ? $kembali / $kini['total'] : 0), 'ket' => self::angka($kembali).' penyewa sudah pernah membayar sebelumnya', 'delta' => null],
                ['judul' => 'Booking per penyewa', 'nilai' => self::desimal($perPeny), 'ket' => 'Rata-rata booking tiap penyewa di periode ini',
                    'delta' => $this->delta($perPeny, $perPenyLalu, $banding($perPenyLalu ? self::desimal($perPenyLalu) : '-'))],
            ],
            'grafik' => $grafik,
            'top' => [
                'porsi' => self::persen($kini['rev'] ? $rpTop / $kini['rev'] : 0),
                'ket' => self::rp($rpTop).' dari '.self::rp($kini['rev']).'. Ada '.self::angka($urut->count()).' penyewa yang membayar di periode ini.',
                'daftar' => $top->map(fn ($x, $i) => [
                    'no' => $i + 1, 'nama' => $x['nama'], 'ket' => self::angka($x['n']).' booking', 'nilai' => self::rp($x['rp']),
                    'porsi' => self::persen($kini['rev'] ? $x['rp'] / $kini['rev'] : 0), 'lebar' => round($x['rp'] / $maksP * 100, 2),
                ])->all(),
            ],
            'berhenti' => [
                'daftar' => $hilang->take(5)->map(fn ($x) => [
                    'nama' => $x['nama'], 'ket' => 'Terakhir main '.$this->tgl(Carbon::parse($x['akhir']), true), 'rinci' => self::angka($x['n']).' booking', 'nilai' => self::rp($x['rp']),
                ])->all(),
                'sisa' => $hilang->count() > 5 ? 'Dan '.($hilang->count() - 5).' penyewa lainnya.' : '',
            ],
        ];
    }

    // ===== Tab Pola booking

    private function tabPola(array $c): array
    {
        $p = $c['p'];
        $nLap = max(1, $this->lapangan->count());
        $hitung = function (Carbon $awal, Carbon $akhir) use ($nLap) {
            $rows = DB::table('bookings')->where('status', 'Dikonfirmasi')->whereBetween('tanggal', [$awal->toDateString(), $akhir->toDateString()])
                ->get(['idLapangan', 'tanggal', 'jamMulai', 'jamSelesai', 'created_at']);
            $hari = (int) $awal->diffInDays($akhir) + 1;
            $hariDow = array_fill(0, 7, 0);
            for ($d = $awal->copy(); $d->lte($akhir); $d->addDay()) {
                $hariDow[$d->dayOfWeekIso - 1]++;
            }
            $heat = array_fill(0, 7, array_fill(0, $this->jamBuka, 0));
            $heatLap = [];
            $lapJam = [];
            $jam = 0;
            foreach ($rows as $b) {
                $dw = Carbon::parse($b->tanggal)->dayOfWeekIso - 1;
                for ($h = (int) substr($b->jamMulai, 0, 2); $h < (int) substr($b->jamSelesai, 0, 2); $h++) {
                    if ($h < Pemesanan::JAM_BUKA || $h >= Pemesanan::JAM_TUTUP) {
                        continue;
                    }
                    $heat[$dw][$h - Pemesanan::JAM_BUKA]++;
                    $heatLap[$b->idLapangan][$dw][$h - Pemesanan::JAM_BUKA] = ($heatLap[$b->idLapangan][$dw][$h - Pemesanan::JAM_BUKA] ?? 0) + 1;
                    $lapJam[$b->idLapangan] = ($lapJam[$b->idLapangan] ?? 0) + 1;
                    $jam++;
                }
            }

            return ['rows' => $rows, 'hari' => $hari, 'hariDow' => $hariDow, 'heat' => $heat, 'heatLap' => $heatLap, 'lapJam' => $lapJam, 'jam' => $jam,
                'kapLap' => $hari * $this->jamBuka, 'kap' => $hari * $this->jamBuka * $nLap];
        };
        $kini = $hitung($p['awal'], $p['akhir']);
        $lalu = $c['lalu'] ? $hitung($c['lalu']['awal'], $c['lalu']['akhir']) : null;
        $pT = $kini['kap'] ? $kini['jam'] / $kini['kap'] : 0;
        $pL = $lalu && $lalu['kap'] ? $lalu['jam'] / $lalu['kap'] : null;

        // peta jam tersibuk: porsi lapangan terisi per hari dalam seminggu dan jam
        $nilai = [];
        $terbesar = ['v' => -1];
        $peta = [];
        $rataHari = [];
        foreach (self::HARI as $d => $hr) {
            $n = $kini['hariDow'][$d];
            $rataHari[$d] = $n ? array_sum($kini['heat'][$d]) / $n : 0;
            $jamRamai = 0;
            $sel = [];
            foreach ($kini['heat'][$d] as $h => $cnt) {
                $v = $n ? $cnt / ($n * $nLap) : 0;
                $nilai[$d][$h] = $v;
                if ($v > $terbesar['v']) {
                    $terbesar = ['v' => $v, 'd' => $d, 'h' => $h];
                }
                if ($cnt > $kini['heat'][$d][$jamRamai]) {
                    $jamRamai = $h;
                }
                $sel[] = [
                    'tingkat' => $v < 0.05 ? 0 : ($v < 0.2 ? 1 : ($v < 0.4 ? 2 : ($v < 0.6 ? 3 : 4))),
                    'tip' => self::HARI_PANJANG[$d].' '.self::jamTitik($h + Pemesanan::JAM_BUKA).'–'.self::jamTitik($h + Pemesanan::JAM_BUKA + 1)
                        .', rata-rata '.self::desimal($v * $nLap).' dari '.$nLap.' lapangan terisi',
                    'blok' => ['kosong' => null, 'ramai' => null],
                ];
            }
            $peta[] = [
                'hari' => $hr, 'panjang' => self::HARI_PANJANG[$d], 'total' => self::desimal($rataHari[$d]).' jam',
                'rata' => self::desimal($rataHari[$d]), 'persen' => self::persen($rataHari[$d] / ($this->jamBuka * $nLap)),
                'jamRamai' => self::jamTitik($jamRamai + Pemesanan::JAM_BUKA).'–'.self::jamTitik($jamRamai + Pemesanan::JAM_BUKA + 1),
                'sel' => $sel,
            ];
        }
        $iMaks = array_search(max($rataHari), $rataHari, true);

        // blok 3 jam paling kosong / paling ramai di Senin–Jumat dan Sabtu–Minggu
        $kelompok = [['nama' => 'Senin–Jumat', 'hari' => [0, 1, 2, 3, 4]], ['nama' => 'Sabtu–Minggu', 'hari' => [5, 6]]];
        $semua = [];
        foreach ($kelompok as $ki => $kl) {
            for ($h0 = 0; $h0 + 3 <= $this->jamBuka; $h0++) {
                $sm = 0;
                foreach ($kl['hari'] as $d) {
                    for ($j = $h0; $j < $h0 + 3; $j++) {
                        $sm += $nilai[$d][$j];
                    }
                }
                $semua[] = ['ki' => $ki, 'h0' => $h0, 'v' => $sm / (count($kl['hari']) * 3)];
            }
        }
        $blok = [];
        foreach (['kosong' => false, 'ramai' => true] as $mode => $ramai) {
            $urut = $semua;
            usort($urut, fn ($a, $b) => ($ramai ? $b['v'] <=> $a['v'] : $a['v'] <=> $b['v']) ?: $a['h0'] <=> $b['h0']);
            $calon = [];
            foreach ($urut as $x) {
                if (count($calon) < 4 && collect($calon)->every(fn ($o) => $o['ki'] !== $x['ki'] || abs($o['h0'] - $x['h0']) >= 3)) {
                    $calon[] = $x;
                }
            }
            $blok[$mode] = array_map(function ($x, $n) use ($kelompok, $kini, $ramai, $nLap, $mode, &$peta) {
                $kl = $kelompok[$x['ki']];
                $perLap = count($kl['hari']) * 3;
                $sel = $perLap * $nLap;
                $rinci = $this->lapangan->map(function ($l) use ($kl, $x, $kini, $perLap, $ramai) {
                    $sm = 0;
                    foreach ($kl['hari'] as $d) {
                        for ($j = $x['h0']; $j < $x['h0'] + 3; $j++) {
                            $sm += $kini['hariDow'][$d] ? ($kini['heatLap'][$l->idLapangan][$d][$j] ?? 0) / $kini['hariDow'][$d] : 0;
                        }
                    }
                    $vk = $sm / $perLap;
                    $rk = $kini['kapLap'] ? ($kini['lapJam'][$l->idLapangan] ?? 0) / $kini['kapLap'] : 0;
                    $t = $ramai ? $vk * $perLap * $l->tarifPerJam * self::MINGGU_PER_BULAN : max(0, $rk - $vk) * $perLap * $l->tarifPerJam * self::MINGGU_PER_BULAN;

                    return ['warna' => $l->warna, 'nama' => $l->namaLapangan, 'isi' => self::persen($vk), 'rata' => self::persen($rk), 't' => $t,
                        'nilai' => $ramai ? self::rp(round($t / 10000) * 10000) : ($t >= 10000 ? '+'.self::rp(round($t / 10000) * 10000) : 'sudah seramai rata-rata')];
                });
                $tambah = $rinci->sum('t');
                foreach ($kl['hari'] as $d) {
                    for ($j = $x['h0']; $j < $x['h0'] + 3; $j++) {
                        $peta[$d]['sel'][$j]['blok'][$mode] = $n;
                    }
                }
                $mulai = $x['h0'] + Pemesanan::JAM_BUKA;

                return [
                    'no' => $n + 1, 'judul' => $kl['nama'].', '.self::jamTitik($mulai).'–'.self::jamTitik($mulai + 3),
                    'ket' => $ramai ? 'Sekitar '.self::angka(round($sel * $x['v'])).' jam lapangan terisi tiap minggu' : 'Sekitar '.self::angka(round($sel * (1 - $x['v']))).' jam lapangan kosong tiap minggu',
                    'persen' => self::persen($x['v']), 'lebar' => round(max($x['v'] > 0 ? 2 : 0, $x['v'] * 100), 2),
                    'nilai' => $ramai ? self::rp(round($tambah / 10000) * 10000) : ($tambah >= 10000 ? '+'.self::rp(round($tambah / 10000) * 10000) : 'Rp0'),
                    'nilaiKet' => $ramai || $tambah >= 10000 ? 'per bulan' : 'sudah seramai rata-rata',
                    'rinci' => $rinci->map(fn ($r) => array_diff_key($r, ['t' => 1]))->all(),
                ];
            }, $calon, array_keys($calon));
        }

        $nRow = max(1, $kini['rows']->count());
        $ember = function (string $judul, callable $f, string $warna, Collection $rows, int $nRow) {
            $c = $rows->filter($f)->count();

            return ['judul' => $judul, 'warna' => $warna, 'n' => self::angka($c).' booking', 'porsi' => self::persen($c / $nRow), 'lebar' => round($c / $nRow * 100, 2)];
        };
        $lama = fn ($b) => (int) substr($b->jamSelesai, 0, 2) - (int) substr($b->jamMulai, 0, 2);
        $denganDibuat = $kini['rows']->filter(fn ($b) => $b->created_at)->map(function ($b) {
            $b->jarak = (int) Carbon::parse($b->created_at)->startOfDay()->diffInDays(Carbon::parse($b->tanggal), false);

            return $b;
        });
        $nJarak = max(1, $denganDibuat->count());

        return [
            'terisi' => [
                'persen' => self::persen($pT),
                'ket' => self::angka($kini['jam']).' dari '.self::angka($kini['kap']).' jam buka ('.$nLap.' lapangan × '.$this->jamBuka.' jam × '.$kini['hari'].' hari)',
                'delta' => $this->delta($pT, $pL, 'Dibanding '.($c['lalu']['label'] ?? '').': '.($pL !== null ? self::persen($pL) : '-')),
            ],
            'perLapangan' => $this->lapangan->map(function ($l) use ($kini) {
                $j = $kini['lapJam'][$l->idLapangan] ?? 0;
                $v = $kini['kapLap'] ? $j / $kini['kapLap'] : 0;

                return ['nama' => $l->namaLapangan, 'warna' => $l->warna, 'persen' => self::persen($v), 'jam' => self::angka($j).' dari '.self::angka($kini['kapLap']).' jam', 'lebar' => round(min(100, $v * 100), 2)];
            })->all(),
            'peta' => $peta,
            'jamLabel' => array_map(fn ($h) => str_pad((string) $h, 2, '0', STR_PAD_LEFT), range(Pemesanan::JAM_BUKA, Pemesanan::JAM_TUTUP - 1)),
            'hariRamai' => $kini['jam'] ? $iMaks : null,
            'petaAria' => 'Peta jam tersibuk. '.($terbesar['v'] > 0
                ? 'Paling ramai '.self::HARI_PANJANG[$terbesar['d']].' '.self::jamTitik($terbesar['h'] + Pemesanan::JAM_BUKA).'–'.self::jamTitik($terbesar['h'] + Pemesanan::JAM_BUKA + 1).'.'
                : 'Belum ada booking.'),
            'blok' => $blok,
            'lamaMain' => [
                $ember('1 jam', fn ($b) => $lama($b) === 1, 'var(--primary)', $kini['rows'], $nRow),
                $ember('2 jam', fn ($b) => $lama($b) === 2, '#0891b2', $kini['rows'], $nRow),
                $ember('3 jam atau lebih', fn ($b) => $lama($b) >= 3, '#7c3aed', $kini['rows'], $nRow),
            ],
            'jarak' => [
                $ember('Di hari yang sama', fn ($b) => $b->jarak <= 0, '#f59e0b', $denganDibuat, $nJarak),
                $ember('1–2 hari sebelumnya', fn ($b) => $b->jarak >= 1 && $b->jarak <= 2, 'var(--primary)', $denganDibuat, $nJarak),
                $ember('3–7 hari sebelumnya', fn ($b) => $b->jarak >= 3 && $b->jarak <= 7, '#0891b2', $denganDibuat, $nJarak),
                $ember('8 hari atau lebih', fn ($b) => $b->jarak >= 8, '#7c3aed', $denganDibuat, $nJarak),
            ],
        ];
    }

    // ===== Tab Kinerja Admin

    private function tabAdmin(array $c): array
    {
        $p = $c['p'];
        // keputusan bukti: baris log terima/tolak; lama periksa = dikirimPada -> waktu keputusan, di jam operasional
        $dikirim = DB::table('pembayarans')->whereNotNull('dikirimPada')->pluck('dikirimPada', 'idBooking');
        $keputusan = DB::table('log_aktivitas')->whereIn('aksi', ['terima', 'tolak'])->where('jenisObjek', 'Pembayaran')->orderBy('waktu')
            ->get(['waktu', 'idAdmin', 'namaAdmin', 'aksi', 'kodeObjek'])
            ->map(function ($r) use ($dikirim) {
                $id = (int) substr($r->kodeObjek, 3);
                $waktu = Carbon::parse($r->waktu);
                $kirim = isset($dikirim[$id]) ? Carbon::parse($dikirim[$id]) : null;
                $r->tgl = $waktu->toDateString();
                $r->menit = $kirim && $kirim->lte($waktu) ? Pemesanan::menitOperasional($kirim, $waktu) : null;

                return $r;
            });
        $ringkas = function (Collection $v) {
            if ($v->isEmpty()) {
                return null;
            }
            $ber = $v->whereNotNull('menit');

            return ['n' => $v->count(), 'tolak' => $v->where('aksi', 'tolak')->count(), 'rata' => $ber->isEmpty() ? null : $ber->avg('menit'),
                'cepat' => $ber->isEmpty() ? null : $ber->filter(fn ($x) => $x->menit <= 60)->count() / $ber->count()];
        };
        $di = fn (Carbon $a, Carbon $b) => $keputusan->filter(fn ($r) => $r->tgl >= $a->toDateString() && $r->tgl <= $b->toDateString());
        $vK = $ringkas($di($p['awal'], $p['akhir']));
        $vL = $c['lalu'] ? $ringkas($di($c['lalu']['awal'], $c['lalu']['akhir'])) : null;
        $banding = fn (string $v) => 'Dibanding '.($c['lalu']['label'] ?? '').': '.$v;
        $pTolak = fn ($v) => $v ? $v['tolak'] / $v['n'] : null;

        $nilai = array_map(fn ($t) => $t['ada'] ? $ringkas($di($t['awal'], $t['akhir'])) : null, $c['titik']);
        $nilai = array_map(fn ($v) => $v && $v['rata'] !== null ? $v : null, $nilai);
        $atas = max(90, (int) ceil(max(array_map(fn ($v) => $v['rata'] ?? 0, $nilai) ?: [0]) / 30) * 30);
        $grafik = $this->grafik($c, $nilai, fn ($v) => $v['rata'] / $atas, fn ($v) => [
            'nilai' => self::lamaTeks($v['rata']),
            'ket' => self::persen($v['cepat']).' selesai dalam 1 jam · '.self::angka($v['n']).' bukti',
            'segmen' => [['warna' => $v['rata'] > 60 ? 'var(--accessible-orange)' : 'var(--primary)', 'porsi' => 100]],
            'rinci' => [],
        ]);
        $grafik['judul'] = 'Rata-rata lama periksa per '.(['tahun' => 'tahun', 'kuartal' => 'kuartal'][$p['jenis']] ?? 'bulan');
        $grafik['sumbu'] = array_map(fn ($v) => ['pos' => round($v / 3 * 100, 2), 'label' => str_replace(' menit', ' mnt', self::lamaTeks($atas * $v / 3))], range(0, 3));
        $grafik['lebarSumbu'] = 112;
        $grafik['legenda'] = [['warna' => 'var(--primary)', 'nama' => 'Dalam batas'], ['warna' => 'var(--accessible-orange)', 'nama' => 'Lewat batas'], ['warna' => 'batas', 'nama' => 'Batas 1 jam']];
        $grafik['batas'] = ['pos' => round(60 / $atas * 100, 2), 'label' => 'Batas 1 jam'];

        $vSemua = $di($p['awal'], $p['akhir'])->whereNotNull('menit');
        $nV = max(1, $vSemua->count());
        $sebaran = collect([['Kurang dari 15 menit', -1, 15, 'var(--accessible-green)'], ['15–60 menit', 15, 60, 'color-mix(in oklab, var(--accessible-green) 55%, var(--card))'], ['1–3 jam', 60, 180, 'var(--accessible-orange)'], ['Lebih dari 3 jam', 180, PHP_INT_MAX, 'var(--accessible-red)']])
            ->map(function ($b) use ($vSemua, $nV) {
                $n = $vSemua->filter(fn ($v) => $v->menit > $b[1] && $v->menit <= $b[2])->count();

                return ['judul' => $b[0], 'warna' => $b[3], 'n' => self::angka($n).' bukti', 'porsi' => self::persen($n / $nV), 'lebar' => round($n / $nV * 100, 2)];
            })->all();
        $akun = DB::table('admins')->pluck('username', 'idAdmin');
        $perAdmin = $di($p['awal'], $p['akhir'])->groupBy(fn ($r) => $r->idAdmin ?? 'x'.$r->namaAdmin)->map(function ($rows) use ($ringkas, $akun) {
            $r = $ringkas($rows);
            $first = $rows->first();

            return [
                'nama' => $first->namaAdmin, 'inisial' => mb_strtoupper(mb_substr($first->namaAdmin, 0, 2)),
                'ket' => $first->idAdmin && isset($akun[$first->idAdmin]) ? $akun[$first->idAdmin] : 'Akun sudah dihapus',
                'n' => self::angka($r['n']), 'rata' => $r['rata'] === null ? '–' : self::lamaTeks($r['rata']),
                'cepat' => $r['cepat'] === null ? '–' : self::persen($r['cepat']), 'cepatBaik' => $r['cepat'] !== null && $r['cepat'] >= 0.8,
                'tolak' => self::persen($r['tolak'] / $r['n']),
            ];
        })->sortBy('nama')->values()->all();

        // laporan bulanan di periode, selain bulan berjalan
        $laporan = $this->bulanDi($p['awal'], $p['akhir'])->reject(fn ($b) => $b->isSameMonth($this->hariIni))->map(function (Carbon $b) {
            $l = $this->laporan[$b->format('Y-m')] ?? null;
            $batas = $b->copy()->addMonth()->day(MasterLaporanPembayaranController::BATAS_SERAH);
            $o = ['bulan' => self::BULAN[$b->month - 1].' '.$b->year, 'batas' => $this->tgl($batas)];
            if ($l && $l->filePdf) {
                $dibuat = Carbon::parse($l->tglLaporan);
                $telat = (int) $batas->diffInDays($dibuat, false);
                $o += ['dibuat' => $this->tgl($dibuat), 'tepat' => $telat > 0 ? 'Terlambat '.$telat.' hari' : 'Tepat waktu', 'nadaTepat' => $telat > 0 ? 'oranye' : 'hijau'];
            } else {
                $telat = (int) $batas->diffInDays($this->hariIni, false);
                $o += ['dibuat' => 'Belum dibuat', 'tepat' => $telat > 0 ? 'Terlambat '.$telat.' hari' : 'Batas belum lewat', 'nadaTepat' => $telat > 0 ? 'merah' : 'abu'];
            }
            $o['diperiksa'] = $l && $l->diperiksaPada ? $this->tgl(Carbon::parse($l->diperiksaPada))
                : ($l && $l->revisiPada ? 'Diminta revisi '.$this->tgl(Carbon::parse($l->revisiPada)) : '—');
            $alasan = $this->belumFinal($b);
            $o['status'] = $alasan['teks'] ?? 'Sudah diperiksa';
            $o['nadaStatus'] = match ($o['status']) {
                'Sudah diperiksa' => 'hijau', 'Perlu revisi' => 'merah', 'Menunggu diperiksa' => 'oranye', default => 'abu',
            };

            return $o;
        })->values()->all();

        return [
            'metrik' => [
                ['judul' => 'Bukti diperiksa', 'nilai' => self::angka($vK['n'] ?? 0), 'ket' => $vK ? self::angka($vK['n'] - $vK['tolak']).' diterima, '.self::angka($vK['tolak']).' ditolak' : 'Belum ada bukti', 'delta' => null],
                ['judul' => 'Bukti ditolak', 'nilai' => $vK ? self::persen($pTolak($vK)) : '–', 'ket' => 'Penyewa perlu mengirim bukti baru',
                    'delta' => $this->delta($pTolak($vK) ?? 0, $pTolak($vL), $banding($vL ? self::persen($pTolak($vL)) : '-'), true)],
                ['judul' => 'Rata-rata lama periksa', 'nilai' => isset($vK['rata']) ? self::lamaTeks($vK['rata']) : '–', 'ket' => 'Dari bukti dikirim sampai diterima atau ditolak, di jam buka',
                    'delta' => $this->delta($vK['rata'] ?? 0, $vL['rata'] ?? null, $banding(isset($vL['rata']) ? self::lamaTeks($vL['rata']) : '-'), true)],
                ['judul' => 'Selesai dalam 1 jam', 'nilai' => isset($vK['cepat']) ? self::persen($vK['cepat']) : '–', 'ket' => 'Batas yang Anda tetapkan untuk Admin',
                    'delta' => $this->delta($vK['cepat'] ?? 0, $vL['cepat'] ?? null, $banding(isset($vL['cepat']) ? self::persen($vL['cepat']) : '-'))],
            ],
            'grafik' => $grafik,
            'sebaran' => $sebaran,
            'perAdmin' => $perAdmin,
            'laporan' => $laporan,
            'laporanKosong' => 'Laporan '.self::BULAN[$this->hariIni->month - 1].' dibuat setelah bulan selesai. Pilih periode lain untuk melihat laporan sebelumnya.',
        ];
    }

    // ===== Bantuan

    /** Satu grafik batang: titik dari periode, tinggi dan isi dari $nilai per titik. */
    private function grafik(array $c, array $nilai, callable $tinggi, callable $isi): array
    {
        $n = count($c['titik']);

        return [
            'lebarBatang' => $n <= 4 ? 80 : 48,
            'aria' => implode(', ', array_map(fn ($t, $d) => $t['judul'].' '.($d ? $isi($d, $t)['nilai'] : 'tidak ada data'), $c['titik'], $nilai)),
            'titik' => array_map(function ($t, $d, $i) use ($tinggi, $isi, $n) {
                $x = $d ? $isi($d, $t) : ['nilai' => $t['depan'] ? 'Belum berjalan' : 'Belum ada data', 'ket' => $t['depan'] ? 'Periode ini belum tiba' : 'Data mulai '.self::BULAN[$this->awalData->month - 1].' '.$this->awalData->year, 'segmen' => [], 'rinci' => []];

                return $x + [
                    'label' => $t['label'], 'judul' => $t['judul'], 'tujuan' => $t['tujuan'],
                    'tinggi' => $d ? round(min(1, $tinggi($d)) * 100, 2) : 0,
                    'terpilih' => $t['terpilih'], 'mati' => ! $t['ada'] || ! $d, 'bergaris' => $t['bergaris'] && (bool) $d, 'kiri' => $i < $n / 2,
                ];
            }, $c['titik'], $nilai, array_keys($c['titik'])),
        ];
    }

    /** Perubahan dibanding periode lalu. $turunBaik: angka yang turun berarti membaik (lama periksa, persen ditolak). */
    private function delta(float|int $a, float|int|null $b, string $banding, bool $turunBaik = false): ?array
    {
        if ($b === null || $b == 0) {
            return null;
        }
        $p = ($a - $b) / $b;

        return ['teks' => ($p >= 0 ? '+' : '−').self::desimal(abs($p) * 100).'%', 'naik' => $p >= 0, 'baik' => $turunBaik ? $a <= $b : $p >= 0, 'banding' => $banding];
    }

    private function jumlahBulan(Carbon $awal, Carbon $akhir): float
    {
        return $this->bulanDi($awal, $akhir)->sum(function (Carbon $b) use ($awal, $akhir) {
            $a = $b->lt($awal) ? $awal : $b;
            $z = $b->copy()->endOfMonth()->gt($akhir) ? $akhir : $b->copy()->endOfMonth();

            return ((int) $a->diffInDays($z) + 1) / $b->daysInMonth;
        });
    }

    private function teksRentang(Carbon $awal, Carbon $akhir): string
    {
        $penuhAwal = $awal->day === 1;
        $penuhAkhir = $akhir->isSameDay($akhir->copy()->endOfMonth());
        if ($awal->isSameMonth($akhir)) {
            return $penuhAwal && $penuhAkhir ? $this->bulanSingkat($awal).' '.$awal->year
                : $awal->day.'–'.$akhir->day.' '.$this->bulanSingkat($awal).' '.$awal->year;
        }

        return ($penuhAwal ? '' : $awal->day.' ').$this->bulanSingkat($awal).' '.$awal->year.' – '
            .($penuhAkhir ? '' : $akhir->day.' ').$this->bulanSingkat($akhir).' '.$akhir->year;
    }

    private function bulanSingkat(Carbon $t): string
    {
        return substr(self::BULAN[$t->month - 1], 0, 3);
    }

    private function tgl(Carbon $t, bool $tahun = false): string
    {
        return $t->day.' '.$this->bulanSingkat($t).($tahun ? ' '.$t->year : '');
    }

    public static function rp(float|int $n): string
    {
        return 'Rp'.number_format((float) round($n), 0, ',', '.');
    }

    public static function persen(float|int $x): string
    {
        return self::desimal($x * 100).'%';
    }

    public static function desimal(float|int $x): string
    {
        $r = round($x, 1);

        return $r == floor($r) ? number_format($r, 0, ',', '.') : number_format($r, 1, ',', '.');
    }

    public static function angka(float|int $x): string
    {
        return number_format((float) round($x), 0, ',', '.');
    }

    private static function juta(float|int $n): string
    {
        return $n == 0 ? 'Rp0' : 'Rp'.self::desimal($n / 1_000_000).' jt';
    }

    private static function jamTitik(int $h): string
    {
        return str_pad((string) $h, 2, '0', STR_PAD_LEFT).'.00';
    }

    public static function lamaTeks(float|int $menit): string
    {
        $m = (int) round($menit);

        return $m < 60 ? $m.' menit' : intdiv($m, 60).' jam'.($m % 60 ? ' '.($m % 60).' menit' : '');
    }
}
