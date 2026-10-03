<?php

class Pembayaran
{
    private $idPembayaran;
    private $idAdmin;
    private $idBooking;
    private $tglBayar;
    private $jumlahBayar;
    private $buktiBayar;
    private $status;

    public function __construct(
        $idPembayaran,
        $idAdmin,
        $idBooking,
        $tglBayar,
        $jumlahBayar,
        $buktiBayar,
        $status
    ) {
        $this->idPembayaran = $idPembayaran;
        $this->idAdmin = $idAdmin;
        $this->idBooking = $idBooking;
        $this->tglBayar = $tglBayar;
        $this->jumlahBayar = $jumlahBayar;
        $this->buktiBayar = $buktiBayar;
        $this->status = $status;
    }
}