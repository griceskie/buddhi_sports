<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/** Foto lapangan: path di disk public (lapangan/...), disimpan sebagai JSON di lapangans.foto. */
class FotoLapangan
{
    public const MAKS = 6;

    /** @return list<string> path relatif */
    public static function paths(?string $json): array
    {
        return array_values(array_filter(json_decode($json ?? '[]', true) ?: [], 'is_string'));
    }

    /** @return list<string> URL publik untuk <img src> */
    public static function urls(?string $json): array
    {
        return array_map(fn ($p) => Storage::disk('public')->url($p), self::paths($json));
    }
}
