<?php

namespace App\Http\Controllers;

use App\Support\Pemesanan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LaporanPembayaranController extends Controller
{
    private const PREFIX_TTD = 'data:image/jpeg;base64,';

    public static function namaLaporan(int $bulan, int $tahun): string
    {
        return 'Laporan Pembayaran '.Carbon::create($tahun, $bulan, 1)->locale('id')->translatedFormat('F Y');
    }

    public function buat(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|between:2000,2100',
            'tglLaporan' => 'required|date_format:Y-m-d',
            'idManager' => 'required|integer|exists:managers,idManager',
            'tandaTangan' => ['required', 'string', 'starts_with:'.self::PREFIX_TTD, 'max:400000'],
        ], [
            'idManager.required' => 'Pilih Manager tujuan laporan.',
            'tandaTangan.required' => 'Tanda tangan wajib diisi.',
            'tandaTangan.starts_with' => 'Tanda tangan tidak valid.',
            'tandaTangan.max' => 'Tanda tangan terlalu besar.',
        ]);

        // pastikan isinya benar-benar JPEG, bukan sekadar teks berawalan data URL
        $jpeg = base64_decode(substr($data['tandaTangan'], strlen(self::PREFIX_TTD)), true);
        if ($jpeg === false || ! str_starts_with($jpeg, "\xFF\xD8\xFF")) {
            throw ValidationException::withMessages(['tandaTangan' => 'Tanda tangan tidak valid.']);
        }

        $bulan = (int) $data['bulan'];
        $tahun = (int) $data['tahun'];
        $awal = Carbon::create($tahun, $bulan, 1)->startOfMonth();

        $pembayaran = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->join('penyewas', 'penyewas.idPenyewa', '=', 'bookings.idPenyewa')
            ->join('lapangans', 'lapangans.idLapangan', '=', 'bookings.idLapangan')
            ->where('pembayarans.status', 'Terverifikasi')
            ->whereBetween('pembayarans.tglBayar', [$awal->toDateString(), $awal->copy()->endOfMonth()->toDateString()])
            ->orderBy('pembayarans.tglBayar')
            ->orderBy('pembayarans.idPembayaran')
            ->get([
                'pembayarans.tglBayar', 'pembayarans.jumlahBayar', 'bookings.idBooking', 'bookings.tanggal',
                'bookings.jamMulai', 'bookings.jamSelesai', 'penyewas.namaPenyewa', 'lapangans.namaLapangan',
            ]);
        $total = (int) $pembayaran->sum('jumlahBayar');
        $rupiah = fn (int $n) => 'Rp'.number_format($n, 0, ',', '.');
        $tanggal = fn (string $d) => Carbon::parse($d)->locale('id')->translatedFormat('j M Y');

        $nama = self::namaLaporan($bulan, $tahun);
        $pdf = Pdf::loadView('pdf.laporan-pembayaran', [
            'nama' => $nama,
            'periode' => $awal->locale('id')->translatedFormat('F Y'),
            'tanggalLaporan' => Carbon::parse($data['tglLaporan'])->locale('id')->translatedFormat('j F Y'),
            'admin' => Auth::guard('admin')->user()->namaAdmin,
            'manager' => DB::table('managers')->where('idManager', $data['idManager'])->value('namaManager'),
            'pembayaran' => $pembayaran->map(fn ($p) => [
                'kode' => Pemesanan::kode($p->idBooking),
                'penyewa' => $p->namaPenyewa,
                'lapangan' => $p->namaLapangan,
                'jadwal' => $tanggal($p->tanggal).', '.substr($p->jamMulai, 0, 5).'–'.substr($p->jamSelesai, 0, 5),
                'tglBayar' => $tanggal($p->tglBayar),
                'jumlah' => $rupiah((int) $p->jumlahBayar),
            ])->all(),
            'total' => $rupiah($total),
            'tandaTangan' => $data['tandaTangan'],
        ])->setPaper('a4')
            // tanpa subsetting, seluruh font DejaVu (±800 KB) ikut tertanam di tiap PDF
            ->setOption('isFontSubsettingEnabled', true);

        $path = sprintf('laporan/laporan-pembayaran-%04d-%02d.pdf', $tahun, $bulan);
        Storage::disk('local')->put($path, $pdf->output());

        // satu laporan per periode: membuat ulang menimpa catatan dan PDF yang lama
        $baris = [
            'idAdmin' => Auth::guard('admin')->id(),
            'idManager' => $data['idManager'],
            'totalPemasukan' => $total,
            'tglLaporan' => $data['tglLaporan'],
            'namaLaporan' => $nama,
            'filePdf' => $path,
        ];
        $ada = DB::table('laporan_pembayarans')->where('bulan', $bulan)->where('tahun', $tahun)->value('idLaporan');
        if ($ada) {
            DB::table('laporan_pembayarans')->where('idLaporan', $ada)->update($baris);
        } else {
            DB::table('laporan_pembayarans')->insert($baris + ['bulan' => $bulan, 'tahun' => $tahun]);
        }

        return back()->with('success', $nama.' berhasil dibuat dan tersimpan di Laporan Pembayaran.');
    }

    /** Dibuka di tab browser; dengan ?unduh=1 langsung tersimpan sebagai file .pdf. */
    public function unduh(Request $request, int $idLaporan): StreamedResponse
    {
        $laporan = DB::table('laporan_pembayarans')->where('idLaporan', $idLaporan)->first(['namaLaporan', 'filePdf']);
        abort_if(! $laporan?->filePdf || ! Storage::disk('local')->exists($laporan->filePdf), 404);

        $nama = $laporan->namaLaporan.'.pdf';

        return $request->boolean('unduh')
            ? Storage::disk('local')->download($laporan->filePdf, $nama)
            : Storage::disk('local')->response($laporan->filePdf, $nama);
    }
}
