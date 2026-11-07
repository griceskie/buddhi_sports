<?php

namespace App\Support;

/** Foto lapangan: path di disk public (lapangan/...), disimpan sebagai JSON di lapangans.foto. */
class FotoLapangan
{
    public const MAKS = 6;

    /** @return list<string> path relatif */
    public static function paths(?string $json): array
    {
        return array_values(array_filter(json_decode($json ?? '[]', true) ?: [], 'is_string'));
    }

    /**
     * URL relatif ke host yang sedang dipakai (/storage/...). Sengaja bukan Storage::url(), yang memakai APP_URL:
     * kalau APP_URL tidak sama dengan alamat yang dibuka di browser (127.0.0.1:8000, port lain), fotonya rusak.
     */
    public static function url(string $path): string
    {
        return '/storage/'.ltrim($path, '/');
    }

    /** @return list<string> URL publik untuk <img src> */
    public static function urls(?string $json): array
    {
        return array_map([self::class, 'url'], self::paths($json));
    }
}
