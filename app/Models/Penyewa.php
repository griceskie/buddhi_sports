<?php

class Penyewa
{
    private $idPenyewa;
    private $namaPenyewa;
    private $noHp;
    private $email;
    private $password;

    public function __construct($idPenyewa, $namaPenyewa, $noHp, $email, $password)
    {
        $this->idPenyewa = $idPenyewa;
        $this->namaPenyewa = $namaPenyewa;
        $this->noHp = $noHp;
        $this->email = $email;
        $this->password = $password;
    }
}