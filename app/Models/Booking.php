<?php

class Booking
{
    private $idBooking;
    private $idPenyewa;
    private $idLapangan;
    private $tanggal;
    private $jamMulai;
    private $jamSelesai;
    private $totalBayar;
    private $status;

    public function __construct(
        $idBooking,
        $idPenyewa,
        $idLapangan,
        $tanggal,
        $jamMulai,
        $jamSelesai,
        $totalBayar,
        $status
    ) {
        $this->idBooking = $idBooking;
        $this->idPenyewa = $idPenyewa;
        $this->idLapangan = $idLapangan;
        $this->tanggal = $tanggal;
        $this->jamMulai = $jamMulai;
        $this->jamSelesai = $jamSelesai;
        $this->totalBayar = $totalBayar;
        $this->status = $status;
    }
}