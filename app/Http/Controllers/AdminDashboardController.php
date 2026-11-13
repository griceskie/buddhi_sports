<?php

namespace App\Http\Controllers;

use App\Support\LogAktivitas;
use App\Support\Pemesanan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        Pemesanan::batalkanKedaluwarsa();
        $hariIni = today();
        // ?tanggal=YYYY-MM-DD hanya mengganti kartu Jadwal; angka statistik tetap untuk hari ini
        $tanggal = $request->query('tanggal');
        $dipilih = is_string($tanggal) && Carbon::canBeCreatedFromFormat($tanggal, '!Y-m-d')
            ? Carbon::createFromFormat('!Y-m-d', $tanggal)
            : null;
        // tanggal yang meluap (2026-02-30) dianggap tidak sah
        $tanggalJadwal = $dipilih && $dipilih->toDateString() === $tanggal ? $dipilih : $hariIni;
        $jam = fn (object $b) => (int) substr($b->jamSelesai, 0, 2) - (int) substr($b->jamMulai, 0, 2);

        $lapangan = DB::table('lapangans')->orderBy('idLapangan')->get(['idLapangan', 'namaLapangan', 'jenisLapangan']);

        $jadwalAntara = fn (Carbon $dari, Carbon $sampai) => DB::table('bookings')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->leftJoin('pembayarans', 'pembayarans.idBooking', '=', 'bookings.idBooking')
            ->whereBetween('bookings.tanggal', [$dari->toDateString(), $sampai->toDateString()])
            // yang belum bayar tidak ditampilkan: tidak menahan jam dan bisa banyak yang bertumpuk di jam yang sama
            ->where(fn ($q) => $q->whereIn('bookings.status', Pemesanan::STATUS_MENAHAN_JAM)
                ->orWhere(fn ($q) => $q->where('bookings.status', 'Dipesan')->where('pembayarans.status', 'Menunggu Verifikasi')))
            ->orderBy('bookings.tanggal')->orderBy('bookings.jamMulai')
            ->get([
                'bookings.idBooking', 'bookings.idLapangan', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.status',
                'penyewas.namaPenyewa', 'pembayarans.idPembayaran', 'pembayarans.status as statusPembayaran',
            ]);
        $jadwalHariIni = $jadwalAntara($hariIni, $hariIni);
        // kartu Jadwal menerima beberapa minggu sekaligus agar pindah hari di browser tanpa request
        $jadwalDari = $tanggalJadwal->copy()->subDays(7);
        $jadwalSampai = $tanggalJadwal->copy()->addDays(Pemesanan::HARI_KE_DEPAN);
        $jadwal = $jadwalAntara($jadwalDari, $jadwalSampai);

        $hariIniIso = $hariIni->toDateString();
        $bulanLalu = $hariIni->copy()->subMonthNoOverflow()->startOfMonth();

        // Booking yang masuk hari ini (dibuat penyewa; baris yang diisi Admin tidak punya created_at)
        $masuk = DB::table('bookings')
            ->leftJoin('pembayarans', 'pembayarans.idBooking', '=', 'bookings.idBooking')
            ->whereDate('bookings.created_at', $hariIniIso)
            ->get(['bookings.status', 'pembayarans.idPembayaran']);
        $verifikasiHariIni = DB::table('pembayarans')->where('status', 'Terverifikasi')->whereDate('diverifikasiPada', $hariIniIso);

        // Antrean verifikasi FIFO: bukti yang paling lama dikirim di atas
        $antrean = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->where('pembayarans.status', 'Menunggu Verifikasi')
            ->orderByRaw('pembayarans.dikirimPada IS NULL')->orderBy('pembayarans.dikirimPada')->orderBy('pembayarans.idPembayaran')
            ->get([
                'pembayarans.idPembayaran', 'pembayarans.tglBayar', 'pembayarans.jumlahBayar', 'pembayarans.buktiBayar', 'pembayarans.status', 'pembayarans.dikirimPada',
                'bookings.idBooking', 'bookings.idLapangan', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.totalBayar',
                'penyewas.namaPenyewa', 'lapangans.namaLapangan',
            ])
            ->map(fn ($p) => self::bukti($p));

        return Inertia::render('Dashboard/Admin', [
            'stat' => [
                'jamTerisi' => $jadwalHariIni->filter(fn ($b) => in_array($b->status, Pemesanan::STATUS_MENAHAN_JAM))->sum($jam),
                'jamTotal' => $lapangan->count() * (Pemesanan::JAM_TUTUP - Pemesanan::JAM_BUKA),
                'bookingMasuk' => $masuk->count(),
                'bookingMasukBatal' => $masuk->where('status', 'Dibatalkan')->count(),
                'bookingMasukBelumBayar' => $masuk->where('status', 'Dipesan')->whereNull('idPembayaran')->count(),
                'terverifikasiJumlah' => (int) (clone $verifikasiHariIni)->sum('jumlahBayar'),
                'terverifikasiN' => (clone $verifikasiHariIni)->count(),
            ],
            'lapangan' => $lapangan,
            'tanggalJadwal' => $tanggalJadwal->toDateString(),
            'jadwalDari' => $jadwalDari->toDateString(),
            'jadwalSampai' => $jadwalSampai->toDateString(),
            // KPI "Sesi hari ini" selalu dari hari ini, berapa pun tanggal yang tampil di kartu Jadwal
            'jadwalHariIni' => $jadwalHariIni->map(fn ($b) => [
                'idBooking' => $b->idBooking,
                'idLapangan' => $b->idLapangan,
                'tanggal' => $b->tanggal,
                'jamMulai' => substr($b->jamMulai, 0, 5),
                'jamSelesai' => substr($b->jamSelesai, 0, 5),
                'namaPenyewa' => $b->namaPenyewa,
                'status' => $b->status,
                'statusPembayaran' => $b->statusPembayaran,
                'idPembayaran' => $b->idPembayaran,
            ]),
            'jadwal' => $jadwal->map(fn ($b) => [
                'idBooking' => $b->idBooking,
                'idLapangan' => $b->idLapangan,
                'tanggal' => $b->tanggal,
                'jamMulai' => substr($b->jamMulai, 0, 5),
                'jamSelesai' => substr($b->jamSelesai, 0, 5),
                'namaPenyewa' => $b->namaPenyewa,
                'status' => $b->status,
                'statusPembayaran' => $b->statusPembayaran,
                'idPembayaran' => $b->idPembayaran,
            ]),
            'antrean' => $antrean,
            'tugas' => $this->tugasLain($bulanLalu),
            // 16 booking terakhir; tab status disaring di browser
            'terbaru' => DB::table('bookings')
                ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
                ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
                ->leftJoin('pembayarans', 'pembayarans.idBooking', '=', 'bookings.idBooking')
                ->orderByDesc('bookings.idBooking')
                ->limit(16)
                ->get([
                    'bookings.idBooking', 'bookings.tanggal', 'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.totalBayar', 'bookings.status',
                    'penyewas.namaPenyewa', 'penyewas.noHp', 'lapangans.namaLapangan', 'pembayarans.idPembayaran', 'pembayarans.status as statusPembayaran',
                ])
                ->map(fn ($b) => [
                    'idBooking' => $b->idBooking,
                    'kode' => Pemesanan::kode($b->idBooking),
                    'namaPenyewa' => $b->namaPenyewa,
                    'noHp' => $b->noHp,
                    'namaLapangan' => $b->namaLapangan,
                    'tanggal' => $b->tanggal,
                    'jamMulai' => substr($b->jamMulai, 0, 5),
                    'jamSelesai' => substr($b->jamSelesai, 0, 5),
                    'totalBayar' => (int) $b->totalBayar,
                    'status' => $b->status,
                    'idPembayaran' => $b->idPembayaran,
                    'statusPembayaran' => $b->statusPembayaran,
                ]),
        ]);
    }

    /**
     * "Tugas lain" di kartu Perlu tindakan, hanya yang memang ada: laporan bulan lalu yang belum dibuat
     * (tertahan bila masih ada bukti bulan itu yang menunggu) dan bukti ditolak yang belum dikirim ulang.
     *
     * @return list<array<string, mixed>>
     */
    /**
     * Satu baris bukti bayar untuk DrawerVerifikasi (dipakai dashboard dan halaman Pembayaran).
     * $p harus memuat kolom pembayaran, booking (incl. idLapangan, totalBayar), namaPenyewa dan namaLapangan.
     */
    public static function bukti(object $p): array
    {
        // jam yang sudah dikonfirmasi untuk booking lain: Terima dinonaktifkan di drawer
        $bentrok = DB::table('bookings')
            ->where('idLapangan', $p->idLapangan)->where('tanggal', $p->tanggal)->where('idBooking', '!=', $p->idBooking)
            ->whereIn('status', Pemesanan::STATUS_MENAHAN_JAM)
            ->where('jamMulai', '<', $p->jamSelesai)->where('jamSelesai', '>', $p->jamMulai)
            ->value('idBooking');

        return [
            'idPembayaran' => $p->idPembayaran,
            'idBooking' => $p->idBooking,
            'kode' => Pemesanan::kode($p->idBooking),
            'namaPenyewa' => $p->namaPenyewa,
            'namaLapangan' => $p->namaLapangan,
            'tanggal' => $p->tanggal,
            'jamMulai' => substr($p->jamMulai, 0, 5),
            'jamSelesai' => substr($p->jamSelesai, 0, 5),
            'tglBayar' => $p->tglBayar,
            'dikirimPada' => $p->dikirimPada ? Carbon::parse($p->dikirimPada)->toIso8601String() : null,
            'jumlahBayar' => (int) $p->jumlahBayar,
            'totalBayar' => (int) $p->totalBayar,
            'buktiBayar' => $p->buktiBayar ? route('pembayaran.bukti', $p->idPembayaran) : null,
            'buktiPdf' => str_ends_with(strtolower((string) $p->buktiBayar), '.pdf'),
            'status' => $p->status,
            'bentrokDengan' => $bentrok ? Pemesanan::kode($bentrok) : null,
        ];
    }

    private function tugasLain(Carbon $bulanLalu): array
    {
        $tugas = [];
        $namaBulan = $bulanLalu->locale('id')->translatedFormat('F');
        $adaLaporan = DB::table('laporan_pembayarans')->where('bulan', $bulanLalu->month)->where('tahun', $bulanLalu->year)->whereNotNull('filePdf')->exists();
        if (! $adaLaporan) {
            $tertahan = DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')
                ->whereBetween('tglBayar', [$bulanLalu->toDateString(), $bulanLalu->copy()->endOfMonth()->toDateString()])
                ->orderBy('idPembayaran')->pluck('idPembayaran');
            $tugas[] = $tertahan->isNotEmpty()
                ? ['jenis' => 'tertahan', 'judul' => "Laporan $namaBulan tertahan", 'ket' => $tertahan->count()." bukti $namaBulan belum diverifikasi", 'aksi' => 'Tinjau', 'idPembayaran' => $tertahan->first(), 'href' => null]
                : ['jenis' => 'siap', 'judul' => "Laporan $namaBulan siap dibuat", 'ket' => "Semua bukti $namaBulan sudah diproses", 'aksi' => 'Buat', 'idPembayaran' => null, 'href' => '/tampilpembayaran?periode='.$bulanLalu->format('Y-m')];
        }

        $ditolak = DB::table('pembayarans')->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->where('pembayarans.status', 'Ditolak')->where('bookings.status', 'Dipesan')
            ->where('bookings.tanggal', '>=', today()->toDateString())->count();
        if ($ditolak) {
            $tugas[] = ['jenis' => 'ditolak', 'judul' => "$ditolak bukti ditolak belum dikirim ulang", 'ket' => 'Booking tetap Dipesan tanpa batas waktu. Hubungi penyewa atau batalkan.', 'aksi' => 'Lihat', 'idPembayaran' => null, 'href' => '/tampilpembayaran'];
        }

        return $tugas;
    }

    public function terima(int $idPembayaran): RedirectResponse
    {
        $hasil = DB::transaction(function () use ($idPembayaran) {
            $p = $this->pembayaran($idPembayaran);
            if ($pesan = $this->belumBisaDiputuskan($p)) {
                return ['error' => $pesan];
            }

            // kunci lapangan: dua Admin yang menerima jam yang sama bersamaan tidak boleh sama-sama lolos
            DB::table('lapangans')->where('idLapangan', $p->idLapangan)->lockForUpdate()->first();
            $bentrok = DB::table('bookings')
                ->where('idLapangan', $p->idLapangan)
                ->where('tanggal', $p->tanggal)
                ->where('idBooking', '!=', $p->idBooking)
                ->whereIn('status', Pemesanan::STATUS_MENAHAN_JAM)
                ->where('jamMulai', '<', $p->jamSelesai)
                ->where('jamSelesai', '>', $p->jamMulai)
                ->exists();
            if ($bentrok) {
                return ['error' => Pemesanan::kode($p->idBooking).' bentrok dengan booking lain yang sudah dikonfirmasi di jam yang sama. Tolak pembayaran ini.'];
            }

            DB::table('pembayarans')->where('idPembayaran', $idPembayaran)
                ->update(['status' => 'Terverifikasi', 'alasanTolak' => null, 'idAdmin' => Auth::guard('admin')->id(), 'diverifikasiPada' => now()]);
            DB::table('bookings')->where('idBooking', $p->idBooking)
                ->update(['status' => 'Dikonfirmasi', 'idAdmin' => Auth::guard('admin')->id()]);
            LogAktivitas::catat('terima', 'Pembayaran', Pemesanan::kode($p->idBooking), [
                ['Status pembayaran', 'Menunggu Verifikasi', 'Terverifikasi'],
                ['Status booking', 'Dipesan', 'Dikonfirmasi'],
            ]);

            return ['success' => Pemesanan::kode($p->idBooking).' ('.$p->namaPenyewa.') kini Dikonfirmasi.'];
        });

        return back()->with($hasil);
    }

    public function tolak(Request $request, int $idPembayaran): RedirectResponse
    {
        // penyewa perlu tahu apa yang salah sebelum mengunggah ulang
        $request->validate(
            ['alasan' => 'required|string|max:500'],
            ['alasan.required' => 'Tulis alasan penolakan untuk penyewa.', 'alasan.max' => 'Alasan maksimal 500 karakter.'],
        );
        $p = $this->pembayaran($idPembayaran);
        if ($pesan = $this->belumBisaDiputuskan($p)) {
            return back()->with('error', $pesan);
        }

        DB::transaction(function () use ($request, $idPembayaran, $p) {
            DB::table('pembayarans')->where('idPembayaran', $idPembayaran)
                ->update(['status' => 'Ditolak', 'alasanTolak' => trim($request->alasan), 'idAdmin' => Auth::guard('admin')->id()]);
            LogAktivitas::catat('tolak', 'Pembayaran', Pemesanan::kode($p->idBooking), [
                ['Status pembayaran', 'Menunggu Verifikasi', 'Ditolak'],
                ['Alasan penolakan', '—', trim($request->alasan)],
            ]);
        });

        return back()->with('error', 'Bukti '.Pemesanan::kode($p->idBooking).' ('.$p->namaPenyewa.') ditolak. Booking tetap Dipesan, penyewa bisa mengunggah ulang.');
    }

    private function pembayaran(int $idPembayaran): object
    {
        $p = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->where('pembayarans.idPembayaran', $idPembayaran)
            ->first([
                'pembayarans.status as statusPembayaran', 'bookings.idBooking', 'bookings.idLapangan', 'bookings.tanggal',
                'bookings.jamMulai', 'bookings.jamSelesai', 'bookings.status', 'penyewas.namaPenyewa',
            ]);
        abort_if(! $p, 404);

        return $p;
    }

    private function belumBisaDiputuskan(object $p): ?string
    {
        if ($p->statusPembayaran !== 'Menunggu Verifikasi') {
            return 'Pembayaran '.Pemesanan::kode($p->idBooking).' sudah diproses sebelumnya.';
        }
        if ($p->status !== 'Dipesan') {
            return 'Booking '.Pemesanan::kode($p->idBooking).' berstatus '.$p->status.', tidak sedang menunggu pembayaran.';
        }

        return null;
    }

    /** "Tandai sudah dibaca" di notifikasi header: disimpan per akun Admin, jadi berlaku di semua perangkat. */
    public function tandaiNotifikasiDibaca(): RedirectResponse
    {
        DB::table('admins')->where('idAdmin', Auth::guard('admin')->id())->update(['notifDibacaPada' => now()]);

        return back();
    }
}
