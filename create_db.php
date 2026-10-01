<?php
try { 
    $db = new PDO('mysql:host=127.0.0.1', 'root', ''); 
    $db->exec('CREATE DATABASE IF NOT EXISTS buddhi_sports;'); 
    echo "Database MySQL siap digunakan.\n"; 
} catch(Exception $e) { 
    echo "Gagal konek MySQL. Pastikan MySQL di XAMPP menyala!\n"; 
}
