<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        ]);

        $user->update([
            ($user instanceof Admin ? 'namaAdmin' : 'namaManager') => $validated['nama'],
            'username' => $validated['username'],
        ]);

        return back();
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }
}
