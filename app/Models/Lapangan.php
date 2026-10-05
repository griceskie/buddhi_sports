<?php

class Lapangan
{
    private $idLapangan;
    private $namaLapangan;
    private $jenisLapangan;
    private $tarifPerJam;
    private $status;

    public function __construct(
        $idLapangan,
        $namaLapangan,
        $jenisLapangan,
        $tarifPerJam,
        $status
    ) {
        $this->idLapangan = $idLapangan;
        $this->namaLapangan = $namaLapangan;
        $this->jenisLapangan = $jenisLapangan;
        $this->tarifPerJam = $tarifPerJam;
        $this->status = $status;
    }
}