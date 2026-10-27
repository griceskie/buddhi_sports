<?php

namespace App\Http\Controllers;

use App\Support\Pemesanan;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingPenyewaController extends Controller
{
    public function home(): Response
    {
        $hariIni = today();

        return Inertia::render('Dashboard', [
            'lapangan' => DB::table('lapangans')->get(),
            'terisi' => DB::table('bookings')
                ->whereIn('status', Pemesanan::STATUS_MENAHAN_JAM)
                ->whereBetween('tanggal', [
                    $hariIni->toDateString(),
                    $hariIni->copy()->addDays(Pemesanan::HARI_KE_DEPAN - 1)->toDateString(),
                ])
                ->get(['idLapangan', 'tanggal', 'jamMulai', 'jamSelesai']),
            // untuk catatan di ringkasan booking
            'batasBayarMenit' => (int) config('pembayaran.batas_bayar_menit'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $hariIni = today();
        $data = $request->validate([
            'idLapangan' => 'required|integer|exists:lapangans,idLapangan',
            'tanggal' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:'.$hariIni->toDateString(),
                'before_or_equal:'.$hariIni->copy()->addDays(Pemesanan::HARI_KE_DEPAN - 1)->toDateString(),
            ],
            'jamMulai' => ['required', 'regex:/^\d{2}:00$/'],
            'jamSelesai' => ['required', 'regex:/^\d{2}:00$/'],
        ], [
            'tanggal.after_or_equal' => 'Tanggal sudah lewat.',
            'tanggal.before_or_equal' => 'Booking paling jauh '.Pemesanan::HARI_KE_DEPAN.' hari ke depan.',
            'jamMulai.regex' => 'Jam harus jam penuh, misalnya 08:00.',
            'jamSelesai.regex' => 'Jam harus jam penuh, misalnya 08:00.',
        ]);

        $mulai = (int) substr($data['jamMulai'], 0, 2);
        $selesai = (int) substr($data['jamSelesai'], 0, 2);

        if ($mulai < Pemesanan::JAM_BUKA || $selesai > Pemesanan::JAM_TUTUP) {
            throw ValidationException::withMessages(['jamMulai' => 'Lapangan buka pukul 08:00–22:00.']);
        }
        if ($selesai <= $mulai) {
            throw ValidationException::withMessages(['jamSelesai' => 'Jam selesai harus setelah jam mulai.']);
        }
        if ($data['tanggal'] === $hariIni->toDateString() && $mulai <= now()->hour) {
            throw ValidationException::withMessages(['jamMulai' => 'Jam tersebut sudah lewat.']);
        }

        $jamMulai = sprintf('%02d:00:00', $mulai);
        $jamSelesai = sprintf('%02d:00:00', $selesai);

        $idBooking = DB::transaction(function () use ($data, $jamMulai, $jamSelesai, $mulai, $selesai) {
            // kunci baris lapangan supaya dua penyewa tidak lolos cek bentrok di saat yang sama
            $lapangan = DB::table('lapangans')->where('idLapangan', $data['idLapangan'])->lockForUpdate()->first();

            if (strtolower($lapangan->status) === 'perbaikan') {
                throw ValidationException::withMessages(['idLapangan' => 'Lapangan sedang diperbaiki.']);
            }

            $bentrok = DB::table('bookings')
                ->where('idLapangan', $data['idLapangan'])
                ->where('tanggal', $data['tanggal'])
                ->whereIn('status', Pemesanan::STATUS_MENAHAN_JAM)
                ->where('jamMulai', '<', $jamSelesai)
                ->where('jamSelesai', '>', $jamMulai)
                ->exists();
            if ($bentrok) {
                throw ValidationException::withMessages(['jamMulai' => 'Lapangan sudah terbooking pada jam tersebut.']);
            }

            return DB::table('bookings')->insertGetId([
                'idPenyewa' => Auth::id(),
                'idLapangan' => $data['idLapangan'],
                'tanggal' => $data['tanggal'],
                'jamMulai' => $jamMulai,
                'jamSelesai' => $jamSelesai,
                'totalBayar' => $lapangan->tarifPerJam * ($selesai - $mulai),
                'status' => 'Dipesan',
                'created_at' => now(),
            ], 'idBooking');
        });

        return redirect()->route('booking.bayar', $idBooking);
    }

    public function bayar(int $idBooking): Response
    {
        Pemesanan::batalkanKedaluwarsa();

        return Inertia::render('Booking/Bayar', [
            'booking' => $this->detail($this->milikSaya($idBooking)),
            'rekening' => $this->rekening(),
        ]);
    }

    public function unggahBukti(Request $request, int $idBooking): RedirectResponse
    {
        Pemesanan::batalkanKedaluwarsa();
        $booking = $this->milikSaya($idBooking);

        if ($booking->statusPembayaran !== null && $booking->statusPembayaran !== 'Ditolak') {
            throw ValidationException::withMessages(['bukti' => 'Bukti untuk booking ini sudah dikirim.']);
        }
        if ($booking->status !== 'Dipesan') {
            throw ValidationException::withMessages(['bukti' => $booking->status === 'Dibatalkan'
                ? 'Booking sudah dibatalkan karena melewati batas bayar.'
                : 'Booking ini tidak sedang menunggu pembayaran.']);
        }

        $request->validate([
            'bukti' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ], [
            'bukti.required' => 'Pilih file bukti transfer.',
            'bukti.mimes' => 'File harus JPG, PNG, atau PDF.',
            'bukti.max' => 'Ukuran file maksimal 2 MB.',
        ]);

        $data = [
            'idAdmin' => null,
            'tglBayar' => today()->toDateString(),
            'jumlahBayar' => $booking->totalBayar,
            'buktiBayar' => $request->file('bukti')->store('bukti', 'local'),
            'status' => 'Menunggu Verifikasi',
            'alasanTolak' => null,
        ];

        if ($booking->statusPembayaran === 'Ditolak') {
            // unggah ulang: ganti bukti lama pada baris pembayaran yang sama (idBooking unik)
            $lama = DB::table('pembayarans')->where('idBooking', $booking->idBooking)->value('buktiBayar');
            if ($lama) {
                Storage::disk('local')->delete($lama);
            }
            DB::table('pembayarans')->where('idBooking', $booking->idBooking)->update($data);
        } else {
            DB::table('pembayarans')->insert($data + ['idBooking' => $booking->idBooking]);
        }

        return back()->with('success', 'Bukti terkirim. Admin akan memverifikasi pembayaran Anda.');
    }

    public function daftar(): Response
    {
        Pemesanan::batalkanKedaluwarsa();

        return Inertia::render('Booking', [
            'bookings' => $this->query()->orderByDesc('bookings.idBooking')->get()
                ->map(fn (object $b) => $this->detail($b)),
            'rekening' => $this->rekening(),
        ]);
    }

    // booking milik penyewa yang login saja, beserta lapangan dan status pembayarannya
    private function query(): Builder
    {
        return DB::table('bookings')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->leftJoin('pembayarans', 'pembayarans.idBooking', '=', 'bookings.idBooking')
            ->where('bookings.idPenyewa', Auth::id())
            ->select(
                'bookings.idBooking',
                'bookings.tanggal',
                'bookings.jamMulai',
                'bookings.jamSelesai',
                'bookings.totalBayar',
                'bookings.status',
                'bookings.created_at',
                'lapangans.namaLapangan',
                'lapangans.jenisLapangan',
                'lapangans.tarifPerJam',
                'pembayarans.status as statusPembayaran',
                'pembayarans.alasanTolak',
            );
    }

    private function milikSaya(int $idBooking): object
    {
        $booking = $this->query()->where('bookings.idBooking', $idBooking)->first();
        abort_if(! $booking, 404);

        return $booking;
    }

    private function detail(object $b): array
    {
        return [
            'idBooking' => $b->idBooking,
            'kode' => Pemesanan::kode($b->idBooking),
            'namaLapangan' => $b->namaLapangan,
            'jenisLapangan' => $b->jenisLapangan,
            'tarifPerJam' => (int) $b->tarifPerJam,
            'tanggal' => $b->tanggal,
            'jamMulai' => substr($b->jamMulai, 0, 5),
            'jamSelesai' => substr($b->jamSelesai, 0, 5),
            'totalBayar' => (int) $b->totalBayar,
            'status' => $b->status,
            'statusPembayaran' => $b->statusPembayaran,
            'alasanTolak' => $b->alasanTolak,
            'batasBayar' => Pemesanan::batasBayar($b->created_at)?->toIso8601String(),
        ];
    }

    private function rekening(): array
    {
        return [
            'bank' => config('pembayaran.bank'),
            'nomor' => config('pembayaran.nomor_rekening'),
            'atasNama' => config('pembayaran.atas_nama'),
        ];
    }
}
