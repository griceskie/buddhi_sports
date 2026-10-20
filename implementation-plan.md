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

## 2. Alur booking Penyewa (prioritas berikutnya)

Status: Home (pilih tanggal dan jam) sudah jadi. Tombol "Booking sekarang" belum menyimpan dan halaman `/booking` masih kosong. Dikerjakan berurutan karena tiap tahap butuh data dari tahap sebelumnya, dan Admin/Manager baru berguna kalau sudah ada booking dan pembayaran nyata.

1. **Simpan booking dan kirim jam terisi.**
   - `POST /booking`: idLapangan, tanggal, jamMulai, jamSelesai. idPenyewa dari akun yang login, status awal `Dipesan`, total dihitung server (tarif × jam).
   - `/dashboard` mengirim prop `terisi` (booking hari ini sampai 30 hari ke depan: idLapangan, tanggal, jamMulai, jamSelesai). Halamannya sudah siap menerima; lihat `Components/booking/jadwal.ts`.
   - Validasi di server: tanggal tidak lewat dan paling jauh 30 hari, jam penuh, 08:00–22:00, jam selesai setelah jam mulai, jam hari ini belum lewat, tidak bentrok (kunci baris lapangan di dalam transaksi supaya dua penyewa tidak lolos bersamaan).
   - Keputusan terbuka: status mana yang menahan jam (usulan: semua kecuali `Dibatalkan`), dan apakah `Dipesan` yang belum dibayar batal otomatis setelah 2 jam (butuh kolom `bookings.created_at` dan scheduler).
   - Dialog sukses dan instruksi transfer dari draf HTML dikerjakan di tahap ini.
   - Acuan: PR `origin/backend/booking-penyewa` (ditolak, belum di-merge). Ide yang boleh diambil: cek bentrok di server, total dari tarif, kunci baris. **Jangan jalankan `LapanganSeeder` dari PR itu**: namanya ("Lapangan Bulu Tangkis 1", dst.) berbeda dari data asli (Airlangga, Cendrawasih, Imam Bonjol, Lempar masuk), jadi lapangan akan dobel menjadi 8.
2. **Halaman "Booking saya" (`/booking`).** Daftar booking milik penyewa beserta status, unggah bukti transfer (pembayaran berstatus Menunggu Verifikasi), dan angka "belum dibayar" di dropdown profil.
3. **Verifikasi pembayaran di sisi Admin.** Ubah status pembayaran dan booking.
4. **Dashboard dan laporan Manager.** Saat ini hanya placeholder.

Catatan sementara di Home:
- `BLOKIR_JAM_LEWAT = false` di `Components/booking/jadwal.ts`: semua jam hari ini sengaja bisa dipilih saat mengisi data uji. Nyalakan sebelum dipakai pengguna sungguhan, dan tolak juga di server.
- Jam buka dan tutup (08:00–22:00) masih konstanta di `jadwal.ts`, bukan di database.
- "Hari ini" dan pengecekan jam lewat memakai jam browser. Zona waktu aplikasi masih UTC (`config/app.php`); pertimbangkan `Asia/Jakarta` di tahap 1.

## 3. Temuan review sebelum merge (belum diperbaiki)

1. **Test suite gagal (8 dari 25)** — test bawaan Breeze di `tests/Feature/Auth/*` dan `tests/Feature/ProfileTest.php` masih memakai `User::factory()` dan field `name`. Perlu `PenyewaFactory` + update test ke field `namaPenyewa`/`noHp`. Daftar test: lihat [CLAUDE.md](CLAUDE.md).
2. **Booking: jam selesai tidak divalidasi > jam mulai** — `txtjamselesai` perlu `after:txtjammulai`; tanpa itu cek bentrok jadwal bisa lolos.
3. (Minor) ID relasi (`txtpenyewa`, `txtlapangan`, dst.) divalidasi `integer` saja, bukan `exists:`; ID tidak valid berujung error 500 dari FK, bukan pesan validasi.
4. (Minor) `/logout-pengelola` meng-invalidate seluruh session, jadi Penyewa yang login di browser yang sama ikut logout.

## 4. Verifikasi akhir

- Cek manual tiap halaman master: tambah → muncul di list → edit → delete (termasuk kasus delete gagal karena FK).
- `php artisan test` hijau semua.
