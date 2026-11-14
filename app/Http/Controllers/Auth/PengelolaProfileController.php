<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Support\LogAktivitas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PengelolaProfileController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Pengelola/Profile');
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique($user->getTable(), 'username')->ignore($user->getKey(), $user->getKeyName()),
            ],
        ], [
            'nama.required' => 'Nama wajib diisi.',
            'nama.max' => 'Nama paling banyak 255 karakter.',
            'username.required' => 'Username wajib diisi.',
            'username.max' => 'Username paling banyak 255 karakter.',
            'username.unique' => 'Username ini sudah dipakai akun lain.',
        ]);

        $kolomNama = $user instanceof Admin ? 'namaAdmin' : 'namaManager';
        $lama = ['nama' => $user->{$kolomNama}, 'username' => $user->username];
        DB::transaction(function () use ($user, $kolomNama, $validated, $lama) {
            $user->update([$kolomNama => $validated['nama'], 'username' => $validated['username']]);
            $ubah = array_values(array_filter([
                $lama['nama'] !== $validated['nama'] ? ['Nama', $lama['nama'], $validated['nama']] : null,
                $lama['username'] !== $validated['username'] ? ['Username', $lama['username'], $validated['username']] : null,
            ]));
            if ($ubah) {
                LogAktivitas::catat('ubah', 'Profil', $validated['username'], $ubah);
            }
        });

        return back()->with('success', 'Profile disimpan.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'current_password.current_password' => 'Password saat ini salah.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal :min karakter.',
            'password.confirmed' => 'Konfirmasi password tidak sama.',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $request->user()->update(['password' => Hash::make($validated['password'])]);
            // isi password tidak pernah dicatat
            LogAktivitas::catat('ubah', 'Profil', $request->user()->username, [['Password', '—', 'Diganti']]);
        });

        return back()->with('success', 'Password diganti. Pakai password baru saat masuk berikutnya.');
    }
}
