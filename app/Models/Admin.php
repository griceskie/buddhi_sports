<?php

class Admin
{
    private $idAdmin;
    private $namaAdmin;
    private $username;
    private $password;

    public function __construct($idAdmin, $namaAdmin, $username, $password)
    {
        $this->idAdmin = $idAdmin;
        $this->namaAdmin = $namaAdmin;
        $this->username = $username;
        $this->password = $password;
    }
}