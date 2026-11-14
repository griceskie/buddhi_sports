<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BuktiBayarController extends Controller
{
    /** Bukti transfer disimpan privat; hanya Admin, Manager, dan penyewa pemilik booking yang boleh membukanya. */
    public function tampil(int $idPembayaran): StreamedResponse
    {
        $p = DB::table('pembayarans')
            ->join('bookings', 'bookings.idBooking', '=', 'pembayarans.idBooking')
            ->where('pembayarans.idPembayaran', $idPembayaran)
            ->first(['pembayarans.buktiBayar', 'bookings.idPenyewa']);
        // hanya file di folder bukti/: disk privat juga menyimpan PDF laporan
        $aman = $p?->buktiBayar && str_starts_with($p->buktiBayar, 'bukti/') && ! str_contains($p->buktiBayar, '..');
        abort_if(! $aman || ! Storage::disk('local')->exists($p->buktiBayar), 404);

        $boleh = Auth::guard('admin')->check()
            || Auth::guard('manager')->check()
            || Auth::guard('web')->id() === $p->idPenyewa;
        abort_unless($boleh, 403);

        return Storage::disk('local')->response($p->buktiBayar);
    }
}
