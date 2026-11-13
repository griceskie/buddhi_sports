<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Manager;
use App\Models\Penyewa;
use App\Support\NotifikasiAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // closure: dievaluasi setelah middleware auth:admin/manager memilih guard, jadi $request->user() sudah benar
            'pengelola' => function () use ($request) {
                $user = $request->user();

                if ($user instanceof Admin) {
                    return [
                        'role' => 'admin',
                        'nama' => $user->namaAdmin,
                        'username' => $user->username,
                        'menungguVerifikasi' => DB::table('pembayarans')->where('status', 'Menunggu Verifikasi')->count(),
                        'notifikasi' => NotifikasiAdmin::untuk($user),
                    ];
                }

                if ($user instanceof Manager) {
                    return [
                        'role' => 'manager',
                        'nama' => $user->namaManager,
                        'username' => $user->username,
                        'laporanBelumDiperiksa' => DB::table('laporan_pembayarans')->whereNotNull('filePdf')->whereNull('diperiksaPada')->count(),
                    ];
                }

                return null;
            },
            // Tema panel pengelola (Design System Administrator) hanya untuk Admin dan halaman login pengelola; Manager dan penyewa tidak
            'temaPanel' => fn () => $request->user() instanceof Admin || $request->routeIs('login.pengelola'),
            // Penyewa: jumlah booking mendatang yang menunggu tindakannya (belum bayar atau bukti ditolak), untuk titik merah di menu akun
            'perluTindakan' => function () use ($request) {
                $user = $request->user();
                if (! $user instanceof Penyewa) {
                    return 0;
                }

                return DB::table('bookings')
                    ->leftJoin('pembayarans', 'pembayarans.idBooking', '=', 'bookings.idBooking')
                    ->where('bookings.idPenyewa', $user->idPenyewa)
                    ->where('bookings.status', 'Dipesan')
                    ->where('bookings.tanggal', '>=', today()->toDateString())
                    ->where(fn ($q) => $q->whereNull('pembayarans.idPembayaran')->orWhere('pembayarans.status', 'Ditolak'))
                    ->count();
            },
            // selalu dikirim, juga pada partial reload; kalau tidak, flash lama ikut terbawa dan toast muncul dua kali
            'flash' => Inertia::always(fn () => [
                'error' => session('error'),
                'success' => session('success'),
            ]),
        ];
    }
}
