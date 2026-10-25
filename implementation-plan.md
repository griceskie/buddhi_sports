# Implementation Plan — Buddhi Sports

Status (2026-10-20): CRUD master data (7 model, 42 route, 21 halaman TSX), autentikasi multi-role, profil pengelola, dan tampilan Home Penyewa sudah selesai dan dihapus dari dokumen ini. Sisa pekerjaan ada di bawah. Progres ringkas ada di [CLAUDE.md](CLAUDE.md).

## 1. Email / SMTP untuk lupa password (sedang dikerjakan)

Tujuan: email reset password Penyewa benar-benar terkirim (saat ini `MAIL_MAILER=log`, email hanya tertulis di `storage/logs/laravel.log`). Alur reset password sudah diverifikasi berfungsi via tinker.

Provider dipilih: **Mailtrap Email Testing (sandbox)** — email ditangkap di inbox Mailtrap, tidak dikirim ke alamat asli. Tidak perlu menambahkan domain (halaman "add a domain" itu untuk produk Email Sending/produksi, bukan sandbox).

Langkah:
1. User ambil kredensial dari Mailtrap → **Email Testing → Inboxes → (inbox) → SMTP Settings**. Kredensial tidak boleh dikarang; harus dari akun user.
2. Isi `.env`:
   ```
   APP_NAME="Buddhi Sports"
   MAIL_MAILER=smtp
   MAIL_HOST=sandbox.smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=<dari Mailtrap>
   MAIL_PASSWORD=<dari Mailtrap>
   MAIL_FROM_ADDRESS=noreply@buddhisports.test
   MAIL_FROM_NAME="${APP_NAME}"
   ```
3. `php artisan config:clear`.
4. Verifikasi: kirim reset link ke Penyewa yang ada (form `/forgot-password` atau `Password::sendResetLink()` via tinker) → email muncul di inbox Mailtrap → link reset bisa dipakai.

Di luar cakupan tahap ini: lupa password untuk Admin/Manager (tidak punya kolom email), pengiriman email ke inbox asli (butuh provider produksi + domain).

## 2. Alur booking Penyewa

Tahap 1 (simpan booking + jam terisi) dan tahap 2 (halaman bayar + Booking saya + unggah bukti) **selesai 2026-10-23**. Ringkasan dan keputusannya ada di [CLAUDE.md](CLAUDE.md).

Sisa:
3. ~~Verifikasi pembayaran di sisi Admin~~ — **selesai 2026-10-23** di dashboard Admin (Terima/Tolak, unggah ulang setelah ditolak). Lihat CLAUDE.md.
4. ~~Dashboard Manager~~ — **selesai 2026-10-24** (lihat CLAUDE.md). Catatan rencana awal: Rincian di [PRD.md](PRD.md) bagian 4 "Dashboard Manajer Lapangan". Urutan:
   1. `ManagerDashboardController@index` (DB::table): ringkasan pemasukan bulan ini/bulan lalu/tahun ini (`pembayarans.status = Terverifikasi`), booking terkonfirmasi bulan ini, pemasukan 12 bulan, daftar `laporan_pembayarans` + laporan bulan berjalan. Tes feature.
   2. `Pages/Dashboard/Manager.tsx` di layout sidebar (perlu `ManagerSidebar` atau `AdminSidebar` dengan menu per peran): `StatCard` x3, grafik bar `ui/chart.tsx` (recharts), kartu laporan terbaru, tabel laporan dengan link `laporan.pdf`.
   3. Cek browser hanya-baca (Manager `Manager1` / `Manager123`).
   - Wewenang dan sidebar Manager sudah diputuskan 2026-10-24 (PRD bagian 4): lihat Pembayaran dan Lapangan, kelola akun Admin (lihat, tambah, hapus dengan konfirmasi, reset password), unduh PDF laporan. Perlu route GET hanya-baca untuk Manager dan `AdminSidebar` dengan menu per peran.
   - ~~Manager memverifikasi laporan bulanan~~ — **selesai 2026-10-25**: Manager menandai laporan sudah diperiksa, laporan itu terkunci untuk Admin, dan badge di menu Laporan Pembayaran menghitung laporan yang belum diperiksa. Lihat CLAUDE.md.

Sebelum dipakai sungguhan:
- Ganti `BANK_NAMA`, `BANK_NO_REKENING`, `BANK_ATAS_NAMA` di `.env` dengan rekening asli (sekarang placeholder `0000000000`).
- Pasang cron `* * * * * php artisan schedule:run` agar `booking:batalkan-kedaluwarsa` berjalan; tanpa cron, pembatalan tetap terjadi saat penyewa membuka halaman booking, tapi tidak otomatis di belakang layar.
- Jalankan `composer install`, `npm install`, `php artisan migrate`, dan `php artisan storage:link` di setiap mesin (migrasi memindahkan bukti bayar ke disk privat dan menambah kolom `alasanTolak`).
- Batas waktu bayar (saat ini 60 menit) diubah di `config/pembayaran.php` (`batas_bayar_menit`); ubah hanya dengan sadar, karena berlaku juga untuk booking yang sudah ada.

## 3. Temuan review sebelum merge (belum diperbaiki)

1. **Test suite gagal (8 dari 70)** — test bawaan Breeze di `tests/Feature/Auth/*` dan `tests/Feature/ProfileTest.php` masih memakai `User::factory()` dan field `name`. Perlu `PenyewaFactory` + update test ke field `namaPenyewa`/`noHp`. Daftar test: lihat [CLAUDE.md](CLAUDE.md).
2. ~~Booking: jam selesai tidak divalidasi > jam mulai~~ — **selesai 2026-10-24**: form Booking Admin memvalidasi jam bulat dalam jam operasional dan `after:txtjammulai`.
3. (Minor) ID relasi (`txtpenyewa`, `txtlapangan`, dst.) divalidasi `integer` saja, bukan `exists:`; ID tidak valid berujung error 500 dari FK, bukan pesan validasi.
4. (Minor) `/logout-pengelola` meng-invalidate seluruh session, jadi Penyewa yang login di browser yang sama ikut logout.

## 4. Verifikasi akhir

- Cek manual tiap halaman master: tambah → muncul di list → edit → delete (termasuk kasus delete gagal karena FK).
- `php artisan test` hijau semua.
