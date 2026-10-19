# Implementation Plan — Buddhi Sports

Status (2026-10-18): CRUD master data (7 model, 42 route, 21 halaman TSX) dan autentikasi multi-role sudah selesai dan dihapus dari dokumen ini. Sisa pekerjaan ada di bawah. Progres ringkas ada di [CLAUDE.md](CLAUDE.md).

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

## 2. Temuan review sebelum merge (belum diperbaiki)

1. **Test suite gagal (8 dari 25)** — test bawaan Breeze di `tests/Feature/Auth/*` dan `tests/Feature/ProfileTest.php` masih memakai `User::factory()` dan field `name`. Perlu `PenyewaFactory` + update test ke field `namaPenyewa`/`noHp`. Daftar test: lihat [CLAUDE.md](CLAUDE.md).
2. **Booking: jam selesai tidak divalidasi > jam mulai** — `txtjamselesai` perlu `after:txtjammulai`; tanpa itu cek bentrok jadwal bisa lolos.
3. (Minor) ID relasi (`txtpenyewa`, `txtlapangan`, dst.) divalidasi `integer` saja, bukan `exists:`; ID tidak valid berujung error 500 dari FK, bukan pesan validasi.
4. (Minor) `/logout-pengelola` meng-invalidate seluruh session, jadi Penyewa yang login di browser yang sama ikut logout.

## 3. Verifikasi akhir

- Cek manual tiap halaman master: tambah → muncul di list → edit → delete (termasuk kasus delete gagal karena FK).
- `php artisan test` hijau semua.
