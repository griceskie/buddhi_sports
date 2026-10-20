<?php

namespace App\Http\Controllers;

use App\Support\JadwalBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BookingPenyewaController extends Controller
{
    // Home penyewa: lapangan + jam yang sudah terisi untuk 30 hari ke depan
    public function index(Request $request)
    {
        $idPenyewa = $request->user()->idPenyewa;
        $hariIni = now()->toDateString();
        $sampai = now()->addDays(JadwalBooking::HARI_KE_DEPAN)->toDateString();

        $terisi = JadwalBooking::aktif()
            ->whereBetween('tanggal', [$hariIni, $sampai])
            ->orderBy('tanggal')
            ->orderBy('jamMulai')
            ->get(['idLapangan', 'idPenyewa', 'tanggal', 'jamMulai', 'jamSelesai'])
            ->map(fn ($booking) => [
                'idLapangan' => $booking->idLapangan,
                'tanggal' => $booking->tanggal,
                'jamMulai' => substr($booking->jamMulai, 0, 5),
                'jamSelesai' => substr($booking->jamSelesai, 0, 5),
                'milikSaya' => $booking->idPenyewa == $idPenyewa,
            ]);

        $belumDibayar = JadwalBooking::aktif()
            ->where('idPenyewa', $idPenyewa)
            ->where('status', 'Dipesan')
            ->whereNotExists(fn ($query) => $query->select(DB::raw(1))
                ->from('pembayarans')
                ->whereColumn('pembayarans.idBooking', 'bookings.idBooking'))
            ->count();

        return Inertia::render('Dashboard', [
            'lapangan' => DB::table('lapangans')->orderBy('idLapangan')->get(),
            'terisi' => $terisi,
            'belumDibayar' => $belumDibayar,
            'aturan' => [
                'jamBuka' => JadwalBooking::JAM_BUKA,
                'jamTutup' => JadwalBooking::JAM_TUTUP,
                'hariKeDepan' => JadwalBooking::HARI_KE_DEPAN,
                'batasBayarMenit' => JadwalBooking::BATAS_BAYAR_MENIT,
                'hariIni' => $hariIni,
                'jamSekarang' => now()->hour,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $hariIni = now()->toDateString();
        $hariTerakhir = now()->addDays(JadwalBooking::HARI_KE_DEPAN)->toDateString();

        $request->validate([
            'idLapangan' => 'required|integer|exists:lapangans,idLapangan',
            'tanggal' => 'required|date_format:Y-m-d|after_or_equal:'.$hariIni.'|before_or_equal:'.$hariTerakhir,
            'jamMulai' => 'required|date_format:H:i',
            'jamSelesai' => 'required|date_format:H:i|after:jamMulai',
        ], [
            'idLapangan.*' => 'Lapangan tidak ditemukan.',
            'tanggal.after_or_equal' => 'Tanggal sudah lewat.',
            'tanggal.before_or_equal' => 'Booking paling jauh '.JadwalBooking::HARI_KE_DEPAN.' hari ke depan.',
            'tanggal.*' => 'Tanggal tidak valid.',
            'jamSelesai.after' => 'Jam selesai harus setelah jam mulai.',
            'jamMulai.*' => 'Jam mulai tidak valid.',
            'jamSelesai.*' => 'Jam selesai tidak valid.',
        ]);

        [$jamMulai, $menitMulai] = array_map('intval', explode(':', $request->jamMulai));
        [$jamSelesai, $menitSelesai] = array_map('intval', explode(':', $request->jamSelesai));

        if ($menitMulai !== 0 || $menitSelesai !== 0) {
            return back()->withErrors(['jamMulai' => 'Booking dihitung per jam penuh.']);
        }

        if ($jamMulai < JadwalBooking::JAM_BUKA || $jamSelesai > JadwalBooking::JAM_TUTUP) {
            return back()->withErrors(['jamMulai' => 'Lapangan buka pukul 08:00–22:00.']);
        }

        if ($request->tanggal === $hariIni && $jamMulai <= now()->hour) {
            return back()->withErrors(['jamMulai' => 'Jam tersebut sudah lewat.']);
        }

        // kunci baris lapangan agar dua penyewa tidak lolos cek di jam yang sama
        $idBooking = DB::transaction(function () use ($request) {
            $lapangan = DB::table('lapangans')
                ->where('idLapangan', $request->idLapangan)
                ->lockForUpdate()
                ->first();

            if (JadwalBooking::isTerbooking($lapangan->idLapangan, $request->tanggal, $request->jamMulai, $request->jamSelesai)) {
                return null;
            }

            return DB::table('bookings')->insertGetId([
                'idPenyewa' => $request->user()->idPenyewa,
                'idLapangan' => $lapangan->idLapangan,
                'idAdmin' => null,
                'tanggal' => $request->tanggal,
                'jamMulai' => JadwalBooking::jam($request->jamMulai),
                'jamSelesai' => JadwalBooking::jam($request->jamSelesai),
                'totalBayar' => JadwalBooking::hitungTotal($lapangan->tarifPerJam, $request->jamMulai, $request->jamSelesai),
                'status' => 'Dipesan',
                'created_at' => now(),
            ], 'idBooking');
        });

        if (! $idBooking) {
            return back()->with('error', 'Lapangan sudah terbooking pada jam tersebut.');
        }

        return redirect()->route('dashboard')->with('success', 'Booking berhasil disimpan.');
    }
}
