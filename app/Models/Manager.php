<?php

class Manager
{
    private $idManager;
    private $namaManager;
    private $username;
    private $password;

    public function __construct($idManager, $namaManager, $username, $password)
    {
        $this->idManager = $idManager;
        $this->namaManager = $namaManager;
        $this->username = $username;
        $this->password = $password;
    }
}