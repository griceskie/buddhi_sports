<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Manager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                    ];
                }

                if ($user instanceof Manager) {
                    return ['role' => 'manager', 'nama' => $user->namaManager, 'username' => $user->username];
                }

                return null;
            },
            'flash' => [
                'error' => session('error'),
                'success' => session('success'),
            ],
        ];
    }
}
