<?php

class LaporanPembayaran
{
    private $idLaporan;
    private $idAdmin;
    private $idManager;
    private $bulan;
    private $tahun;
    private $totalPemasukan;
    private $tglLaporan;
    private $idPembayaran;

    public function __construct(
        $idLaporan,
        $idAdmin,
        $idManager,
        $bulan,
        $tahun,
        $totalPemasukan,
        $tglLaporan,
        $idPembayaran
    ) {
        $this->idLaporan = $idLaporan;
        $this->idAdmin = $idAdmin;
        $this->idManager = $idManager;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
        $this->totalPemasukan = $totalPemasukan;
        $this->tglLaporan = $tglLaporan;
        $this->idPembayaran = $idPembayaran;
    }
}