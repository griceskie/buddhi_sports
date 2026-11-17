<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Penyewa extends Authenticatable
{
    use HasFactory, Notifiable;

    // No HP disimpan sebagai angka saja (lihat PhoneInput): diawali 08, 10-13 digit, supaya tautan WhatsApp selalu benar.
    public const ATURAN_NO_HP = 'regex:/^08\d{8,11}$/';

    public const PESAN_NO_HP = 'Nomor HP harus diawali 08 dan berisi 10–13 angka.';

    protected $primaryKey = 'idPenyewa';
    public $timestamps = false;

    protected $fillable = [
        'namaPenyewa',
        'noHp',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'idPenyewa', 'idPenyewa');
    }
}