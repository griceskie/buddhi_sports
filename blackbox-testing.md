# Rencana Black Box Testing: Buddhi Sports

Rencana ini disusun dari route yang ada di aplikasi dan aturan validasi di controller.

## 1. Tujuan dan cakupan

Tujuannya memastikan setiap fitur memberi hasil yang benar dari sisi pengguna, tanpa melihat kode. Ada tiga peran yang diuji: **Penyewa**, **Admin**, dan **Manager**.

**Teknik yang dipakai:**
- **Equivalence Partitioning:** input dibagi ke kelompok valid dan tidak valid.
- **Boundary Value Analysis:** nilai batas diuji, misalnya jam 08:00/22:00, file 2 MB, rentang 30 hari, batas bayar 60 menit.
- **Uji hak akses:** halaman milik peran lain dibuka dengan login peran yang salah.

**Lingkungan uji:** XAMPP (MySQL `buddhi_sports`), `composer dev`, browser Chrome desktop dan lebar layar HP. Siapkan data uji: 1 Admin, 1 Manager (Jarwo / `Manager1`), 2 Penyewa, 4 lapangan (salah satunya berstatus `Perbaikan`), serta booking dengan berbagai status.

**Format setiap kasus uji:** ID · Skenario · Langkah/Input · Hasil yang diharapkan · Hasil aktual · Status (Valid/Tidak valid).

## 2. Daftar kasus uji

### A. Autentikasi Penyewa (`/register`, `/login`, lupa password)

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| A01 | Register dengan data lengkap dan valid | Akun dibuat, masuk ke Home |
| A02 | Register dengan field kosong (nama, no HP, email, password) | Muncul pesan wajib diisi per field |
| A03 | Email salah format / email sudah terdaftar | Ditolak dengan pesan error |
| A04 | Konfirmasi password tidak sama / password terlalu pendek | Ditolak |
| A05 | Login dengan email dan password benar | Masuk ke `/dashboard` |
| A06 | Login dengan password salah / email tidak terdaftar | Pesan "kredensial salah" |
| A07 | Login gagal berulang kali (sekitar 5x) | Akun dikunci sementara (throttle) |
| A08 | Lupa password, lalu email dikirim | Pesan link terkirim (cek log atau Mailtrap) |
| A09 | Logout | Diarahkan ke `/login` |

### B. Autentikasi Pengelola (`/login-pengelola`)

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| B01 | Tab Admin, username dan password benar | Masuk ke `/dashboard-admin` |
| B02 | Tab Manager, username dan password benar | Masuk ke `/dashboard-manager` |
| B03 | Akun Admin dipakai login di tab Manager (dan sebaliknya) | Ditolak |
| B04 | Field kosong / password salah | Pesan error |

### C. Hak akses

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| C01 | Belum login, buka `/dashboard`, `/dashboard-admin`, `/manager/admin` | Diarahkan ke halaman login |
| C02 | Penyewa membuka `/tampilbooking` | Ditolak atau diarahkan ke login |
| C03 | Admin membuka `/manager/admin` | Ditolak |
| C04 | Penyewa A membuka `/booking/{id milik B}/bayar` | Ditolak (403/404) |
| C05 | Penyewa A membuka `/pembayaran/{id milik B}/bukti` | 403 |
| C06 | Penyewa membuka `/laporanpembayaran/{id}/pdf` | Ditolak |

### D. Booking Penyewa (Home `/dashboard`)

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| D01 | Pilih lapangan, tanggal, dan jam kosong, lalu Booking sekarang | Booking `Dipesan` dibuat, masuk ke halaman Bayar |
| D02 | Batas jam: mulai 08:00, selesai 22:00 | Diterima |
| D03 | Jam di luar 08:00–22:00 | Ditolak |
| D04 | Tanggal hari ini + 30 hari / + 31 hari | Diterima / ditolak |
| D05 | Jam yang sudah lewat hari ini | Tidak bisa dipilih dan ditolak server |
| D06 | Slot yang sudah `Dikonfirmasi` milik orang lain | Tampil terisi, tidak bisa dipesan |
| D07 | Lapangan berstatus `Perbaikan` | Tidak bisa dipesan |
| D08 | Booking tanpa memilih jam | Tombol nonaktif / pesan error |

### E. Pembayaran Penyewa (`/booking/{id}/bayar`, `/booking`)

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| E01 | Unggah bukti JPG/PNG/PDF ≤ 2 MB | Status pembayaran `Menunggu Verifikasi` |
| E02 | File tepat 2 MB / 2,1 MB | Diterima / ditolak |
| E03 | File .docx atau .exe | Ditolak |
| E04 | Tidak mengunggah dalam 60 menit | Booking otomatis `Dibatalkan` |
| E05 | Bukti ditolak Admin | Alasan penolakan tampil, Penyewa bisa unggah ulang |
| E06 | Halaman Booking saya tanpa data | Tampil keadaan kosong |
| E07 | Tab Aktif/Riwayat dan dialog Detail booking | Data sesuai |

### F. Dashboard Admin dan verifikasi

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| F01 | Kartu statistik hari ini | Angka sesuai data |
| F02 | Jadwal: hari sebelum/sesudah, date picker, tombol "Hari ini" | Timeline berganti sesuai tanggal |
| F03 | Terima bukti bayar | Pembayaran `Terverifikasi`, booking `Dikonfirmasi`, badge sidebar berkurang |
| F04 | Terima bukti yang jadwalnya bentrok dengan booking yang sudah dikonfirmasi | Ditolak dengan pesan |
| F05 | Tolak bukti tanpa alasan / dengan alasan | Ditolak / berhasil |

### G. Data master Admin (Penyewa, Lapangan, Booking, Pembayaran, Laporan)

Untuk setiap modul, uji: tampil data (dan tabel kosong), Tambah valid, Tambah dengan field kosong, Edit, Hapus (dengan dialog konfirmasi dan Batal). Kasus khusus:

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| G01 | Lapangan dengan tarif negatif / huruf | Ditolak |
| G02 | Status lapangan selain Tersedia/Perbaikan | Ditolak |
| G03 | Email Penyewa duplikat | Ditolak |
| G04 | Booking yang bentrok dengan jadwal lain | Error di field |
| G05 | Jam selesai booking lebih awal dari jam mulai | **Seharusnya ditolak** (sudah diketahui belum divalidasi, kemungkinan gagal) |
| G06 | Pembayaran dibuat dua kali untuk booking yang sama | Error di field |
| G07 | Edit pembayaran menjadi Ditolak tanpa alasan | Ditolak |
| G08 | Pembayaran: ganti `?periode` | Ringkasan dan tabel sesuai bulan |

### H. Laporan Pembayaran (PDF)

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| H01 | Buat laporan dengan tanggal, Manager, dan tanda tangan | PDF dibuat, satu baris per bulan |
| H02 | Tanpa tanda tangan / tanpa Manager | Ditolak |
| H03 | Buat ulang laporan untuk bulan yang sama | Baris lama diperbarui, tidak dobel |
| H04 | Buka dan unduh PDF | Isi dan total sesuai, kolom nominal rata kanan |

### I. Panel Manager

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| I01 | Dashboard: kartu pemasukan dan grafik 12 bulan | Sesuai pembayaran `Terverifikasi` |
| I02 | Halaman Pembayaran dan Lapangan | Hanya bisa dilihat, tidak ada tombol ubah |
| I03 | Tambah Admin dengan username duplikat | Ditolak |
| I04 | Reset password Admin, lalu login dengan password baru | Berhasil |
| I05 | Hapus Admin yang masih dipakai di data lain | Ditolak dengan toast error |

### J. Profil

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| J01 | Penyewa/Pengelola mengubah nama | Tersimpan, toast sukses |
| J02 | Ganti password dengan password lama salah / konfirmasi tidak sama | Ditolak |
| J03 | Username Pengelola duplikat | Ditolak |

## 3. Jadwal pelaksanaan

1. Siapkan data uji, lalu jalankan modul A–C (akses dulu, karena modul lain bergantung padanya).
2. Jalankan D–E (alur Penyewa dari awal sampai akhir).
3. Jalankan F–H (Admin), lalu I–J.
4. Catat hasil aktual, laporkan bug, perbaiki, lalu uji ulang (retest) kasus yang gagal.

## 4. Kriteria lulus

Semua kasus di modul A–F lulus, dan tidak ada bug yang membuat pengguna bisa mengakses data peran atau pengguna lain.

## 5. Temuan dari daftar route yang perlu diuji khusus

- **Hapus data memakai GET** (`/deletebooking/{id}` dan lainnya). Data bisa terhapus hanya dengan membuka URL, tanpa dialog konfirmasi. Uji dengan membuka URL itu langsung di browser.
- **Route `/test`** masih aktif. Cek apa isinya, lalu hapus kalau tidak dipakai.
