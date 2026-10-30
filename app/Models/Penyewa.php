<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Penyewa extends Authenticatable
{
    use HasFactory, Notifiable;

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