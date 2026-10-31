<?php

/*
 * English field names for validation messages. Laravel's own English messages are used for the rest:
 * this file is merged over them, so only 'attributes' lives here. Without it a message would show the
 * raw form field name ("The txtlapangan field is required."). Keep the keys in sync with lang/id.
 */

return [

    'attributes' => [
        // log in, register, profile
        'email' => 'email',
        'password' => 'password',
        'password_confirmation' => 'password confirmation',
        'current_password' => 'current password',
        'username' => 'username',
        'role' => 'role',
        'token' => 'token',
        'nama' => 'name',
        'namaPenyewa' => 'name',
        'noHp' => 'phone number',

        // master data forms (Add/Edit sheets)
        'txtnama' => 'name',
        'txtusername' => 'username',
        'txtnohp' => 'phone number',
        'txtemail' => 'email',
        'txtpassword' => 'password',
        'txtpenyewa' => 'renter',
        'txtlapangan' => 'court',
        'txtadmin' => 'admin',
        'txtmanager' => 'manager',
        'txtbooking' => 'booking',
        'txtpembayaran' => 'payment',
        'txttanggal' => 'date',
        'txtjammulai' => 'start time',
        'txtjamselesai' => 'end time',
        'txttotal' => 'total amount',
        'txtstatus' => 'status',
        'txtjenis' => 'court type',
        'txttarif' => 'hourly rate',
        'txttglbayar' => 'payment date',
        'txtjumlah' => 'amount paid',
        'txtbukti' => 'proof of payment',
        'txtalasan' => 'rejection reason',
        'txtbulan' => 'month',
        'txttahun' => 'year',
        'txttgllaporan' => 'report date',

        // renter booking, verification, PDF report
        'idLapangan' => 'court',
        'idManager' => 'manager',
        'tanggal' => 'date',
        'jamMulai' => 'start time',
        'jamSelesai' => 'end time',
        'bukti' => 'proof of payment',
        'alasan' => 'rejection reason',
        'bulan' => 'month',
        'tahun' => 'year',
        'tglLaporan' => 'report date',
        'tandaTangan' => 'signature',
    ],

];
