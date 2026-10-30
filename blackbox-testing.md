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

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| A01 | Register dengan data lengkap dan valid | Akun dibuat, masuk ke Home | Akun tersimpan di `penyewas`, langsung terautentikasi, redirect ke `/dashboard` | Valid |
| A02 | Register dengan field kosong (nama, no HP, email, password) | Muncul pesan wajib diisi per field | Error muncul di keempat field (`namaPenyewa`, `noHp`, `email`, `password`), tidak ada akun dibuat | Valid |
| A03 | Email salah format / email sudah terdaftar | Ditolak dengan pesan error | Keduanya ditolak dengan error pada field `email` (format tidak valid dan duplikat), tidak ada akun dibuat | Valid |
| A04 | Konfirmasi password tidak sama / password terlalu pendek | Ditolak | Keduanya ditolak dengan error pada field `password` | Valid |
| A05 | Login dengan email dan password benar | Masuk ke `/dashboard` | Terautentikasi, redirect ke `/dashboard` | Valid |
| A06 | Login dengan password salah / email tidak terdaftar | Pesan "kredensial salah" | Keduanya ditolak dengan error pada field `email` (`auth.failed`), tetap guest | Valid |
| A07 | Login gagal berulang kali (sekitar 5x) | Akun dikunci sementara (throttle) | Percobaan ke-6 memberi pesan "Terlalu banyak percobaan login..." (`auth.throttle`), bukan lagi pesan kredensial salah biasa | Valid |
| A08 | Lupa password, lalu email dikirim | Pesan link terkirim (cek log atau Mailtrap) | Notifikasi `ResetPassword` terkirim ke Penyewa yang emailnya cocok | Valid |
| A09 | Logout | Diarahkan ke `/login` | Sesi berakhir (guest), redirect ke `/login` | Valid |

Diuji otomatis lewat request HTTP sungguhan ke route (bukan memanggil kode internal), pakai Laravel feature test (`tests/Feature/BlackboxAutentikasiPenyewaTest.php`, 12 skenario/39 assertion, DB sqlite in-memory terpisah dari data XAMPP) — perilakunya sama seperti yang dilihat browser (redirect, pesan error per field, status sesi). Jalankan ulang dengan `php artisan test tests/Feature/BlackboxAutentikasiPenyewaTest.php`. Dibutuhkan `database/factories/PenyewaFactory.php` (baru) dan trait `HasFactory` pada `App\Models\Penyewa` (ditambahkan untuk pengujian ini, tidak mengubah perilaku aplikasi).

### B. Autentikasi Pengelola (`/login-pengelola`)

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| B01 | Tab Admin, username dan password benar | Masuk ke `/dashboard-admin` | Terautentikasi di guard `admin`, redirect ke `/dashboard-admin` | Valid |
| B02 | Tab Manager, username dan password benar | Masuk ke `/dashboard-manager` | Terautentikasi di guard `manager`, redirect ke `/dashboard-manager` | Valid |
| B03 | Akun Admin dipakai login di tab Manager (dan sebaliknya) | Ditolak | Keduanya ditolak dengan error pada field `password` ("Username atau password salah."), tetap guest di kedua guard | Valid |
| B04 | Field kosong / password salah | Pesan error | Field kosong: error pada `role`, `username`, `password`. Password salah: error pada `password` | Valid |

Diuji otomatis lewat request HTTP ke `/login-pengelola` (`tests/Feature/BlackboxAutentikasiPengelolaTest.php`, 6 skenario/23 assertion); akun Admin/Manager dibuat langsung lewat `Admin::create`/`Manager::create` (hash password), tidak perlu factory baru. Catatan di luar daftar kasus: middleware `guest` pada `/login-pengelola` hanya memeriksa guard `web` (Penyewa) secara default — Admin/Manager yang sudah login tetap bisa membuka halaman ini lagi (bukan bug yang diminta untuk diuji di sini, tapi perlu diketahui).

### C. Hak akses

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| C01 | Belum login, buka `/dashboard`, `/dashboard-admin`, `/manager/admin` | Diarahkan ke halaman login | `/dashboard` -> `/login`; `/dashboard-admin` dan `/manager/admin` -> `/login-pengelola` | Valid |
| C02 | Penyewa membuka `/tampilbooking` | Ditolak atau diarahkan ke login | Redirect ke `/login-pengelola` (guard `admin` menganggap Penyewa sebagai tamu) | Valid |
| C03 | Admin membuka `/manager/admin` | Ditolak | Redirect ke `/login-pengelola` (guard `manager` menganggap Admin sebagai tamu) | Valid |
| C04 | Penyewa A membuka `/booking/{id milik B}/bayar` | Ditolak (403/404) | 404 (`milikSaya()` di `BookingPenyewaController` tidak menemukan booking untuk Penyewa yang login) | Valid |
| C05 | Penyewa A membuka `/pembayaran/{id milik B}/bukti` | 403 | 403 (`BuktiBayarController`: bukan Admin/Manager dan `idPenyewa` tidak cocok) | Valid |
| C06 | Penyewa membuka `/laporanpembayaran/{id}/pdf` | Ditolak | Redirect ke `/login-pengelola` (route ini khusus guard `admin`/`manager`) | Valid |

Diuji otomatis lewat request HTTP (`tests/Feature/BlackboxHakAksesTest.php`, 8 skenario/14 assertion). Mekanisme hak akses diatur di `bootstrap/app.php` (`redirectGuestsTo`): request yang tidak lolos `auth:admin`/`auth:manager` selalu diarahkan ke `/login-pengelola`, termasuk saat yang mengakses sudah login tapi di guard yang salah (C02, C03, C06) — bukan status 403, tapi tetap tidak bisa melihat halamannya.

### D. Booking Penyewa (Home `/dashboard`)

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| D01 | Pilih lapangan, tanggal, dan jam kosong, lalu Booking sekarang | Booking `Dipesan` dibuat, masuk ke halaman Bayar | Baris `bookings` dibuat dengan status `Dipesan`, redirect ke `/booking/{id}/bayar` | Valid |
| D02 | Batas jam: mulai 08:00, selesai 22:00 | Diterima | Keduanya diterima (tidak ada error validasi) | Valid |
| D03 | Jam di luar 08:00–22:00 | Ditolak | Mulai 07:00 dan selesai 23:00 keduanya ditolak dengan error pada `jamMulai` | Valid |
| D04 | Tanggal hari ini + 30 hari / + 31 hari | Diterima / ditolak | **Lihat catatan** — batas sebenarnya hari ini **+29** hari diterima, **+30** hari ditolak | Valid, dengan catatan |
| D05 | Jam yang sudah lewat hari ini | Tidak bisa dipilih dan ditolak server | Jam yang sudah lewat (relatif ke waktu sekarang) ditolak server dengan error pada `jamMulai`; jam yang belum lewat diterima | Valid |
| D06 | Slot yang sudah `Dikonfirmasi` milik orang lain | Tampil terisi, tidak bisa dipesan | Server menolak dengan error pada `jamMulai` ("Lapangan sudah terbooking..."); tampilan "terisi" di UI tidak diuji di sini (lihat catatan) | Valid, sebagian |
| D07 | Lapangan berstatus `Perbaikan` | Tidak bisa dipesan | Server menolak dengan error pada `idLapangan` ("Lapangan sedang diperbaiki.") | Valid |
| D08 | Booking tanpa memilih jam | Tombol nonaktif / pesan error | Tanpa `jamMulai`/`jamSelesai`, server menolak dengan error wajib diisi pada kedua field; tombol nonaktif di UI tidak diuji di sini (lihat catatan) | Valid, sebagian |

Diuji otomatis lewat request HTTP ke `POST /booking` (`tests/Feature/BlackboxBookingPenyewaTest.php`, 12 skenario/34 assertion; D05 memakai `Carbon::setTestNow()` untuk membekukan jam).

**Catatan D04 (koreksi dari rencana awal):** konstanta `Pemesanan::HARI_KE_DEPAN = 30` dipakai sebagai `addDays(HARI_KE_DEPAN - 1)`, jadi rentang yang diterima adalah hari ini sampai **hari ini + 29 hari** (30 hari terhitung termasuk hari ini), bukan "hari ini + 30 hari" seperti tertulis di rencana. Ini bukan bug — hasilnya tetap 30 hari ke depan secara hitungan kalender — hanya salah tulis angka batasnya di rencana awal, sudah dikoreksi di atas.

**Catatan D06 dan D08:** pengujian ini memverifikasi penolakan di sisi server (yang pasti berlaku meski JavaScript dimatikan atau di-bypass), bukan perilaku tampilan di browser (slot tampil "terisi"/dashed, tombol Booking nonaktif). Bagian tampilan itu perlu dicek manual lewat UI.

### E. Pembayaran Penyewa (`/booking/{id}/bayar`, `/booking`)

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| E01 | Unggah bukti JPG/PNG/PDF ≤ 2 MB | Status pembayaran `Menunggu Verifikasi` | Ketiga format diterima, baris `pembayarans` dibuat dengan status `Menunggu Verifikasi` | Valid |
| E02 | File tepat 2 MB / 2,1 MB | Diterima / ditolak | 2048 KB (tepat 2 MB) diterima; 2150 KB (±2,1 MB) ditolak dengan error pada `bukti` | Valid |
| E03 | File .docx atau .exe | Ditolak | Keduanya ditolak dengan error pada `bukti` (`mimes:jpg,jpeg,png,pdf`) | Valid |
| E04 | Tidak mengunggah dalam 60 menit | Booking otomatis `Dibatalkan` | Booking yang lewat `batas_bayar_menit` (dari `config/pembayaran.php`) menjadi `Dibatalkan` begitu halaman Booking saya dibuka; yang belum lewat tetap `Dipesan` | Valid |
| E05 | Bukti ditolak Admin | Alasan penolakan tampil, Penyewa bisa unggah ulang | Prop `alasanTolak` terkirim ke halaman `/booking`; unggah ulang berhasil dan mengganti baris pembayaran yang sama (status balik `Menunggu Verifikasi`, `alasanTolak` kosong) | Valid |
| E06 | Halaman Booking saya tanpa data | Tampil keadaan kosong | Prop `bookings` dikirim sebagai array kosong saat Penyewa belum punya booking | Valid, sebagian |
| E07 | Tab Aktif/Riwayat dan dialog Detail booking | Data sesuai | Server mengirim seluruh booking (diurutkan `idBooking` menurun) dengan field yang dibutuhkan frontend untuk membagi Aktif/Riwayat dan mengisi dialog Detail | Valid, sebagian |

Diuji otomatis lewat request HTTP ke `POST /booking/{id}/bukti` dan `GET /booking` (`tests/Feature/BlackboxPembayaranPenyewaTest.php`, 12 skenario/64 assertion).

**Catatan E06 dan E07:** keadaan kosong, pembagian tab Aktif/Riwayat (`bookings.filter(...)` di `Pages/Booking.tsx`), dan dialog Detail booking dihitung/ditampilkan di React (frontend), bukan dari server. Yang diuji di sini adalah bahwa server mengirim data mentah yang benar (array kosong, atau daftar lengkap dengan `tanggal`/`status`/`alasanTolak` per baris) — tampilannya sendiri di browser belum diverifikasi.

### F. Dashboard Admin dan verifikasi

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| F01 | Kartu statistik hari ini | Angka sesuai data | `bookingHariIni`, `menungguVerifikasi`, `pendapatanBulanIni`, `pendapatanBulanLalu`, `jamTerisi`, `jamTotal` semua cocok dengan data yang disiapkan | Valid |
| F02 | Jadwal: hari sebelum/sesudah, date picker, tombol "Hari ini" | Timeline berganti sesuai tanggal | `?tanggal=` valid mengubah `tanggalJadwal`/`jadwalDari`/`jadwalSampai` (-7/+30 hari dari tanggal itu); tanggal tidak valid (`2026-02-30`) dan tanpa parameter kembali ke hari ini | Valid, sebagian |
| F03 | Terima bukti bayar | Pembayaran `Terverifikasi`, booking `Dikonfirmasi`, badge sidebar berkurang | Pembayaran jadi `Terverifikasi`, booking jadi `Dikonfirmasi`, jumlah "Menunggu Verifikasi" berkurang 1 | Valid |
| F04 | Terima bukti yang jadwalnya bentrok dengan booking yang sudah dikonfirmasi | Ditolak dengan pesan | Ditolak, flash error berisi "bentrok", pembayaran tetap `Menunggu Verifikasi` dan booking tetap `Dipesan` | Valid |
| F05 | Tolak bukti tanpa alasan / dengan alasan | Ditolak / berhasil | Tanpa alasan: error pada field `alasan`. Dengan alasan: pembayaran jadi `Ditolak` dengan `alasanTolak` tersimpan, booking tetap `Dipesan` | Valid |

Diuji otomatis lewat request HTTP ke `/dashboard-admin`, `/verifikasi/{id}/terima`, `/verifikasi/{id}/tolak` (`tests/Feature/BlackboxDashboardAdminTest.php`, 8 skenario/72 assertion).

**Catatan F02:** pergantian hari lewat tombol prev/next dan date picker di kartu Jadwal dikerjakan di browser (lihat catatan Progress 2026-10-24 di CLAUDE.md: data -7..+30 hari dikirim sekali, pindah tanggal di dalam rentang itu difilter di JavaScript tanpa request baru) — yang diuji di sini adalah bahwa server mengirim jendela data yang benar dan jatuh kembali ke hari ini untuk tanggal tidak valid; interaksi tombolnya sendiri di browser belum diverifikasi.

### G. Data master Admin (Penyewa, Lapangan, Booking, Pembayaran, Laporan)

Untuk setiap modul, uji: tampil data (dan tabel kosong), Tambah valid, Tambah dengan field kosong, Edit, Hapus (dengan dialog konfirmasi dan Batal). Kasus khusus:

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| G01 | Lapangan dengan tarif negatif / huruf | Ditolak | Keduanya ditolak dengan error pada `txttarif` (`integer\|min:0`) | Valid |
| G02 | Status lapangan selain Tersedia/Perbaikan | Ditolak | Ditolak dengan error pada `txtstatus` (`in:Tersedia,Perbaikan`) | Valid |
| G03 | Email Penyewa duplikat | Ditolak | Ditolak dengan error pada `txtemail` (`unique:penyewas,email`) | Valid |
| G04 | Booking yang bentrok dengan jadwal lain | Error di field | Ditolak dengan error pada `txtlapangan` ("Lapangan sudah terbooking...") | Valid |
| G05 | Jam selesai booking lebih awal dari jam mulai | **Seharusnya ditolak** (sudah diketahui belum divalidasi, kemungkinan gagal) | **Sudah tervalidasi** — ditolak dengan error pada `txtjamselesai` lewat rule `after:txtjammulai` | **Valid — temuan: catatan "belum divalidasi" di rencana ini sudah usang** |
| G06 | Pembayaran dibuat dua kali untuk booking yang sama | Error di field | Ditolak dengan error pada `txtbooking` ("Booking ini sudah memiliki data pembayaran.") | Valid |
| G07 | Edit pembayaran menjadi Ditolak tanpa alasan | Ditolak | Ditolak dengan error pada `txtalasan` (`required_if:txtstatus,Ditolak`) | Valid |
| G08 | Pembayaran: ganti `?periode` | Ringkasan dan tabel sesuai bulan | `datapembayaran` dan `ringkasan` berganti sesuai bulan pada `?periode=YYYY-MM`, tidak tercampur dengan bulan lain | Valid |

Diuji otomatis lewat request HTTP ke `/insertlapangan`, `/insertpenyewa`, `/insertbooking`, `/insertpembayaran`, `/updatepembayaran`, `/tampilpembayaran` (`tests/Feature/BlackboxMasterDataTest.php`, 9 skenario/53 assertion).

**Temuan penting (G05):** rencana awal (dan item "Open" di CLAUDE.md: "booking end time not validated after start time") mengira jam selesai lebih awal dari jam mulai *belum* divalidasi. Pengujian langsung membuktikan sebaliknya: `MasterBookingController::validasiBooking` sudah memvalidasinya lewat rule `'txtjamselesai' => [..., 'after:txtjammulai']` — kombinasi mulai 15:00/selesai 10:00 (keduanya lolos daftar jam operasional sendiri-sendiri) tetap ditolak. Dokumentasi proyek (CLAUDE.md) perlu diperbarui untuk menghapus item "Open" ini.

### H. Laporan Pembayaran (PDF)

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| H01 | Buat laporan dengan tanggal, Manager, dan tanda tangan | PDF dibuat, satu baris per bulan | Satu baris `laporan_pembayarans` dibuat, `totalPemasukan` sesuai, file PDF tersimpan di disk privat (`%PDF` valid) | Valid |
| H02 | Tanpa tanda tangan / tanpa Manager | Ditolak | Keduanya ditolak (error pada `tandaTangan` / `idManager`), tidak ada baris dibuat | Valid |
| H03 | Buat ulang laporan untuk bulan yang sama | Baris lama diperbarui, tidak dobel | Tetap 1 baris untuk bulan yang sama; `totalPemasukan` dan `tglLaporan` ikut berubah ke data/tanggal yang baru | Valid |
| H04 | Buka dan unduh PDF | Isi dan total sesuai, kolom nominal rata kanan | Dibuka (`Content-Type: application/pdf`) dan diunduh (`?unduh=1`, header `Content-Disposition`) keduanya berhasil; `totalPemasukan` cocok dengan jumlah pembayaran `Terverifikasi` bulan itu | Valid, sebagian |

Diuji otomatis lewat request HTTP ke `/laporanpembayaran/buat` dan `/laporanpembayaran/{id}/pdf` (`tests/Feature/BlackboxLaporanPembayaranTest.php`, 6 skenario/22 assertion), memakai fixture tanda tangan JPEG yang sudah ada (`tests/Fixtures/tanda-tangan.txt`).

**Catatan H04:** "kolom nominal rata kanan" diperiksa lewat isi berkas `resources/views/pdf/laporan-pembayaran.blade.php` (CSS `.r { text-align: right }` dipasang di header dan sel `jumlah`) — ini pemeriksaan kode sumber, bukan pemeriksaan visual pada PDF yang sudah dirender. Untuk memastikan benar-benar rata kanan secara visual, PDF-nya perlu dibuka manual.

### I. Panel Manager

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| I01 | Dashboard: kartu pemasukan dan grafik 12 bulan | Sesuai pembayaran `Terverifikasi` | `pemasukanBulanIni`/`BulanLalu`/`TahunIni` dan 12 titik `grafik` (bulan ini di urutan pertama, mundur) semua sesuai; pembayaran `Menunggu Verifikasi` tidak ikut terhitung | Valid |
| I02 | Halaman Pembayaran dan Lapangan | Hanya bisa dilihat, tidak ada tombol ubah | Halaman bisa dibuka (200), tapi rute ubah data (`/insertpembayaran`, `/updatelapangan`, khusus guard `admin`) tetap tertutup untuk Manager — diarahkan ke `/login-pengelola` | Valid, sebagian |
| I03 | Tambah Admin dengan username duplikat | Ditolak | Ditolak dengan error pada `username` | Valid |
| I04 | Reset password Admin, lalu login dengan password baru | Berhasil | Password lama langsung tidak berfungsi, password baru berhasil login ke guard `admin` | Valid |
| I05 | Hapus Admin yang masih dipakai di data lain | Ditolak dengan toast error | Ditolak (flash `error`), baris Admin tetap ada | Valid |

Diuji otomatis lewat request HTTP ke `/dashboard-manager`, `/manager/pembayaran`, `/manager/lapangan`, `/manager/admin` (`tests/Feature/BlackboxPanelManagerTest.php`, 5 skenario/45 assertion).

**Catatan I02:** "tidak ada tombol ubah" sendiri adalah soal tampilan (frontend tidak merender tombol itu untuk Manager) — yang diuji di sini adalah jaminan sisi server: meski tombolnya "dipaksa" ada lewat request langsung, rute mutasi datanya tetap tertutup untuk guard `manager`.

**Catatan teknis saat menguji I04 (bukan temuan tentang aplikasi, tapi dicatat untuk pengujian berikutnya):** memanggil `actingAs($manager, 'manager')` di `tests/Feature/BlackboxPanelManagerTest.php` mengubah *guard default* Laravel (`Auth::shouldUse`) untuk sisa test tersebut, sehingga middleware `guest` pada request berikutnya bisa salah menyimpulkan sudah "login". Ini kuirk khusus harness pengujian (satu proses test memakai ulang container aplikasi), bukan perilaku yang terjadi pada request sungguhan di browser — diperbaiki di test dengan `Auth::shouldUse('web')` sebelum melanjutkan.

### J. Profil

| ID | Skenario | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| J01 | Penyewa/Pengelola mengubah nama | Tersimpan, toast sukses | Nama **tersimpan** di database untuk Penyewa dan Pengelola. **Toast sukses tidak muncul** — lihat temuan di bawah | **Tidak valid (sebagian)** |
| J02 | Ganti password dengan password lama salah / konfirmasi tidak sama | Ditolak | Keduanya ditolak untuk Penyewa (`PUT /password`) maupun Pengelola (`PUT /profile-pengelola/password`): error pada `current_password` / `password` | Valid |
| J03 | Username Pengelola duplikat | Ditolak | Ditolak dengan error pada `username` (`unique(...)->ignore(diri sendiri)`) | Valid |

Diuji otomatis lewat request HTTP ke `/profile`, `/profile-pengelola`, `/password`, `/profile-pengelola/password` (`tests/Feature/BlackboxProfilTest.php`, 7 skenario/17 assertion).

**Temuan (J01 — bug, bukan catatan sebatas keterbatasan pengujian):** `ProfileController@update`, `PengelolaProfileController@update`, dan `PengelolaProfileController@updatePassword` semuanya mengembalikan `redirect()->route(...)` / `back()` **tanpa** `->with('success', ...)`. Mekanisme toast di `resources/js/app.tsx` (`tampilkanFlash`) hanya memicu `toast.success()` kalau props `flash.success` terisi dari server. Karena ketiga aksi ini tidak pernah mengisi `flash.success`, **mengubah nama atau mengganti password di halaman Profil tidak menampilkan toast sukses apa pun** — walau datanya benar tersimpan. Pengujian otomatis (`assertNull($response->getSession()->get('success'))`) mengonfirmasi ini pada J01; kemungkinan sama untuk ganti password (J02 yang berhasil, belum diuji eksplisit di sini karena J02 fokus ke kasus gagal, tapi kode-nya identik). Perbaikannya kecil: tambahkan `->with('success', '...')` di tiga method tersebut.

## 3. Jadwal pelaksanaan

1. Siapkan data uji, lalu jalankan modul A–C (akses dulu, karena modul lain bergantung padanya).
2. Jalankan D–E (alur Penyewa dari awal sampai akhir).
3. Jalankan F–H (Admin), lalu I–J.
4. Catat hasil aktual, laporkan yang perlu diperbaiki, lalu uji ulang (retest) kasus yang gagal.

## 4. Laporan hasil pengujian

### 4.1 Hasil pelaksanaan

Seluruh 48 kasus uji di modul A–J (85 skenario teknis, karena satu kasus kadang perlu lebih dari satu skenario untuk menguji kedua sisinya, misalnya "diterima" dan "ditolak") sudah dilaksanakan. Pengujian dilakukan otomatis lewat request HTTP sungguhan ke route aplikasi (bukan membaca atau memanggil kode secara langsung) menggunakan Laravel feature test, di 10 berkas baru pada `tests/Feature/Blackbox*.php` (satu berkas per modul). Setiap berkas dijalankan sendiri saat modulnya selesai, lalu seluruh test suite dijalankan ulang untuk memastikan tidak ada regresi pada bagian aplikasi yang lain.

| Modul | Berkas test | Skenario | Status |
|---|---|---|---|
| A — Autentikasi Penyewa | `BlackboxAutentikasiPenyewaTest.php` | 12 | Valid |
| B — Autentikasi Pengelola | `BlackboxAutentikasiPengelolaTest.php` | 6 | Valid |
| C — Hak akses | `BlackboxHakAksesTest.php` | 8 | Valid |
| D — Booking Penyewa | `BlackboxBookingPenyewaTest.php` | 12 | Valid (1 catatan dokumentasi) |
| E — Pembayaran Penyewa | `BlackboxPembayaranPenyewaTest.php` | 12 | Valid |
| F — Dashboard Admin | `BlackboxDashboardAdminTest.php` | 8 | Valid |
| G — Data master Admin | `BlackboxMasterDataTest.php` | 9 | Valid (1 catatan dokumentasi) |
| H — Laporan Pembayaran | `BlackboxLaporanPembayaranTest.php` | 6 | Valid |
| I — Panel Manager | `BlackboxPanelManagerTest.php` | 5 | Valid |
| J — Profil | `BlackboxProfilTest.php` | 7 | **1 kasus tidak valid (J01)** |

Hasil akhir `php artisan test`: **148 lulus, 8 gagal** (dari 156 total), naik dari kondisi awal **63 lulus, 8 gagal** (71 total) sebelum pengujian ini dimulai — 85 test baru, seluruhnya lulus tanpa menyebabkan regresi pada test yang sudah ada. 8 test yang gagal itu sama persis sejak awal sampai akhir: test Breeze lama (`AuthenticationTest`, `RegistrationTest`, `PasswordResetTest`, `PasswordConfirmationTest`, `ProfileTest`) yang masih memakai `User::factory()`/kolom `name`, tidak tersentuh oleh pengujian ini (sudah tercatat sebagai isu terpisah di CLAUDE.md sebelum pengujian ini mulai).

### 4.2 Masalah yang ditemukan

1. **J01 — toast sukses tidak muncul saat ubah profil (bug, bisa diperbaiki).** `ProfileController@update` (Penyewa), `PengelolaProfileController@update`, dan `PengelolaProfileController@updatePassword` mengembalikan redirect tanpa `->with('success', ...)`. Mekanisme toast di `resources/js/app.tsx` hanya jalan kalau `flash.success` terisi dari server, jadi mengubah nama atau mengganti password tidak pernah menampilkan toast — walau datanya tersimpan benar. Dibuktikan lewat `assertNull($response->getSession()->get('success'))` pada `BlackboxProfilTest`.
2. **G05 — catatan "belum divalidasi" di rencana ini dan di CLAUDE.md sudah usang (temuan dokumentasi, bukan bug kode).** `MasterBookingController::validasiBooking` sudah memvalidasi jam selesai harus setelah jam mulai lewat rule `after:txtjammulai`. Sudah dikoreksi langsung di tabel modul G pada dokumen ini.
3. **D04 — angka batas hari pemesanan di rencana awal tidak presisi (temuan dokumentasi, bukan bug kode).** Rencana menulis "hari ini + 30 hari diterima", padahal kode membatasi sampai hari ini + 29 hari (30 hari terhitung termasuk hari ini). Sudah dikoreksi di tabel modul D.
4. **B — catatan di luar kasus uji:** middleware `guest` pada `/login-pengelola` hanya memeriksa guard `web` secara default, sehingga Admin/Manager yang sudah login masih bisa membuka halaman itu lagi. Bukan risiko keamanan (tidak membuka akses ke data), hanya sedikit tidak rapi dari sisi UX — tidak diperbaiki karena di luar permintaan pengujian ini.

Tidak ditemukan masalah yang melanggar Kriteria lulus di bagian 5 (tidak ada kebocoran data antar peran atau antar pengguna) pada seluruh modul A–J.

### 4.3 Perbaikan yang dilakukan

- **Infrastruktur pengujian (bukan perilaku aplikasi):** menambahkan `database/factories/PenyewaFactory.php` (baru) dan trait `HasFactory` pada `App\Models\Penyewa`, supaya modul A bisa memakai `Penyewa::factory()` seperti model lain. Tidak mengubah perilaku aplikasi untuk pengguna.
- **Dokumen rencana ini:** tabel modul D dan G sudah dikoreksi langsung (lihat 4.2 poin 2–3), karena itu adalah salah tulis di rencana, bukan di kode.
- **J01 (bug nyata di kode aplikasi): belum diperbaiki.** Sesuai poin 4 di atas, pengujian ini berhenti di tahap "melaporkan yang perlu diperbaiki" — perbaikannya (menambahkan `->with('success', '...')` di tiga method terkait) sudah diketahui letaknya dan sederhana, tapi sengaja belum diterapkan tanpa persetujuan eksplisit untuk mengubah kode controller.

### 4.4 Hasil pengujian ulang

- Belum ada siklus retest untuk J01, karena perbaikannya belum diterapkan (lihat 4.3). Begitu diperbaiki, retest-nya adalah menjalankan ulang `test_j01_penyewa_ubah_nama_tersimpan` dan `test_j01_pengelola_ubah_nama_tersimpan` di `BlackboxProfilTest.php` dan mengganti assertion `assertNull(...)` menjadi `assertNotNull(...)`/`assertSame(...)` pada `session('success')`.
- Untuk modul A–I, tidak ada kasus yang gagal sehingga tidak diperlukan retest. Satu kesalahan sempat terjadi saat menyiapkan test I04 (bukan kegagalan pada aplikasi, tapi pada cara test itu ditulis — `actingAs()` yang mengubah guard default Laravel untuk sisa proses test; lihat catatan di modul I), langsung diperbaiki di berkas test-nya dan dites ulang sampai lulus sebelum dilanjutkan ke modul berikutnya.
- Regresi dicek berulang kali: setelah setiap modul ditambahkan, `php artisan test` penuh dijalankan dan jumlah test yang gagal tetap 8 (selalu yang sama) dari awal sampai akhir — memastikan 85 test baru tidak merusak bagian aplikasi yang sudah berjalan.

## 5. Kriteria lulus

Semua kasus di modul A–F lulus, dan tidak ada bug yang membuat pengguna bisa mengakses data peran atau pengguna lain.

## 6. Temuan dari daftar route yang perlu diuji khusus

- **Hapus data memakai GET** (`/deletebooking/{id}` dan lainnya). Data bisa terhapus hanya dengan membuka URL, tanpa dialog konfirmasi. Uji dengan membuka URL itu langsung di browser.
- **Route `/test`** masih aktif. Cek apa isinya, lalu hapus kalau tidak dipakai.
