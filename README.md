# Buddhi Sports

Aplikasi web penyewaan 3 hall bulu tangkis dan 1 lapangan basket Universitas Buddhi Dharma. Penyewa memesan jam, mentransfer, lalu mengunggah bukti; Admin memverifikasi dan membuat laporan bulanan; Manager memantau, memeriksa laporan, dan mengelola akun Admin. Detail kebutuhan ada di [PRD.md](PRD.md).

Dibangun dengan Laravel 12, Inertia.js, React 18 (TypeScript), dan Tailwind CSS 4.

## Yang perlu dipasang

- PHP 8.2 atau lebih baru (dengan ekstensi `gd`, `pdo_mysql` atau `pdo_sqlite`, `mbstring`, `fileinfo`)
- Composer
- Node.js 20 atau lebih baru
- MySQL / MariaDB (misalnya lewat XAMPP), atau SQLite

## Memasang

```bash
composer install
npm install
cp .env.example .env        # Windows: copy .env.example .env
php artisan key:generate
```

Atur database di `.env`. Untuk MySQL, buat database kosong lebih dulu (misalnya `buddhi_sports`), lalu:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=buddhi_sports
DB_USERNAME=root
DB_PASSWORD=
```

Lalu buat tabel, data awal, dan tautan folder foto:

```bash
php artisan migrate:fresh --seed
php artisan storage:link
npm run build
```

`--seed` membuat akun pengelola dan empat lapangan (lihat Akun uji). Data contoh untuk pengujian dipasang terpisah (lihat Data contoh).

## Menjalankan

```bash
php artisan serve
```

Buka http://127.0.0.1:8000. Saat mengubah tampilan, jalankan juga `npm run dev` di terminal lain supaya halaman ikut diperbarui.

Pembatalan otomatis booking yang tidak dibayar juga berjalan setiap kali halaman penyewa atau dashboard Admin dibuka. Supaya tetap berjalan walau tidak ada yang membuka halaman, jalankan di terminal lain:

```bash
php artisan schedule:work
```

## Akun uji

| Peran | Masuk di | Username / email | Password |
| --- | --- | --- | --- |
| Admin | `/login-pengelola`, tab Admin | `Admin1` (Budi) | `Admin123` |
| Manager | `/login-pengelola`, tab Manager | `Manager1` (Jarwo) | `Manager123` |
| Penyewa | `/login` | daftar sendiri di `/register` | |

Password Manager tidak bisa direset dari aplikasi. Kalau lupa, jalankan `php artisan manager:reset-password Manager1`.

## Data contoh

```bash
php artisan db:seed --class=DemoSeeder
```

Hanya untuk database yang belum berisi booking (jalankan setelah `migrate:fresh --seed`). Isinya:

- 12 penyewa, semua dengan password `Penyewa123`, misalnya `rina@example.com`.
- Admin kedua: `Admin2` (Sari) / `Admin123`.
- Booking dan pembayaran dari awal bulan, tiga bulan lalu sampai seminggu ke depan. Sebagian besar dikonfirmasi, sisanya dibatalkan penyewa, batal otomatis, atau buktinya ditolak. Tanggalnya dihitung dari hari seeder dijalankan.
- Dua bukti yang menunggu verifikasi, untuk mencoba Terima dan Tolak.
- Milik Rina: satu booking besok yang sudah dikonfirmasi, dan satu booking lusa yang buktinya ditolak, untuk mencoba kirim ulang bukti.
- Laporan bulanan sengaja belum dibuat. Laporan bulan lalu bisa langsung dibuat Admin, lalu diperiksa Manager.

Semua bukti transfer contoh memakai gambar bertanda "CONTOH DATA DEMO".

## Catatan untuk penguji

- **Satu peran per browser.** Penyewa dan pengelola memakai sesi yang sama. Log Out di satu peran juga mengeluarkan peran lain di browser yang sama. Pakai browser berbeda atau jendela incognito untuk tiap peran.
- **Email tidak dikirim.** `MAIL_MAILER=log`: tautan reset password penyewa tertulis di `storage/logs/laravel.log`.
- **Batas bayar.** Booking tanpa bukti bayar batal otomatis setelah 60 menit. Untuk pengujian, isi `BATAS_BAYAR_MENIT=5` di `.env`.
- **Rekening tujuan** di halaman bayar berasal dari `BANK_*` di `.env` dan masih contoh.
- **Jam operasional** 08.00–22.00, booking per jam penuh, paling jauh 30 hari ke depan. Jam yang sudah lewat tidak bisa dipesan.
- **Foto lapangan.** Admin bisa mengunggahnya di halaman Lapangan. Untuk foto contoh, jalankan `php artisan lapangan:foto-contoh`.

## Tes otomatis

```bash
php artisan test
```

Tes memakai database SQLite di memori, jadi tidak menyentuh database Anda. Delapan tes bawaan Breeze (login, daftar, reset password, profil) masih gagal karena akun penyewa memakai model `Penyewa`, bukan `User`.
