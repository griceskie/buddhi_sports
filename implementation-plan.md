# Implementation Plan — Buddhi Sports

> 2026-11-07: Home penyewa ala Airbnb selesai di PR `feat/home-airbnb` (lihat CLAUDE.md). Sisa terkait: sinkron design system untuk `MenuAkun`, `HeaderBeranda`, `PillLapangan`, `GaleriLapangan` baru, `IslandStatus`, `DateStrip` (tanggal penuh dicoret), `BarBookingMobile`; foto lapangan asli diunggah pengelola.

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
5. ~~Booking saya + Konfirmasi dan bayar (Draft 2)~~ — **selesai 2026-11-05** (PR `feat/confirm-and-pay`). Rancangan: kanvas "Booking saya + Bayar" (`project/BookingSaya-Draft2.dc.html`, `project/Bayar-Draft2.dc.html`, rencana `project/RENCANA-IMPLEMENTASI.md`). Ringkasan di CLAUDE.md. Sisa:
   - "Hubungi pengelola" masih teks tebal, belum tautan: belum ada kontak pengelola (WhatsApp/telepon/email) di aplikasi. Perlu keputusan kontak mana, lalu ganti komponen `HubungiPengelola` (`Components/booking/DialogBukti.tsx`).
   - Design system belum memuat komponen baru (lihat CLAUDE.md); perlu sinkron.

Sebelum dipakai sungguhan:
- Ganti `BANK_NAMA`, `BANK_NO_REKENING`, `BANK_ATAS_NAMA` di `.env` dengan rekening asli (sekarang placeholder `0000000000`).
- Pasang cron `* * * * * php artisan schedule:run` agar `booking:batalkan-kedaluwarsa` berjalan; tanpa cron, pembatalan tetap terjadi saat penyewa membuka halaman booking, tapi tidak otomatis di belakang layar.
- Jalankan `composer install`, `npm install`, `php artisan migrate`, dan `php artisan storage:link` di setiap mesin (migrasi memindahkan bukti bayar ke disk privat dan menambah kolom `alasanTolak`).
- Batas waktu bayar (saat ini 60 menit) diubah di `config/pembayaran.php` (`batas_bayar_menit`); ubah hanya dengan sadar, karena berlaku juga untuk booking yang sudah ada.

## 3. Temuan review sebelum merge (belum diperbaiki)

1. **Test suite gagal (8 dari 163)** — test bawaan Breeze di `tests/Feature/Auth/*` dan `tests/Feature/ProfileTest.php` masih memakai `User::factory()` dan field `name`. Perlu `PenyewaFactory` + update test ke field `namaPenyewa`/`noHp`. Daftar test: lihat [CLAUDE.md](CLAUDE.md).
2. ~~Booking: jam selesai tidak divalidasi > jam mulai~~ — **selesai 2026-10-24**: form Booking Admin memvalidasi jam bulat dalam jam operasional dan `after:txtjammulai`.
3. (Minor) ID relasi (`txtpenyewa`, `txtlapangan`, dst.) divalidasi `integer` saja, bukan `exists:`; ID tidak valid berujung error 500 dari FK, bukan pesan validasi.
4. (Minor) `/logout-pengelola` meng-invalidate seluruh session, jadi Penyewa yang login di browser yang sama ikut logout.

## 4. Profile penyewa (setelah PR `feat/profile-penyewa`, belum diputuskan)

- `DELETE /profile` (`ProfileController@destroy`) masih aktif walau tombol Hapus akun nonaktif. `bookings.idPenyewa` tanpa cascade, jadi menghapus penyewa yang punya booking kemungkinan gagal di database. Nasib riwayat booking (hapus, anonimkan, nonaktifkan akun) menunggu keputusan user.
- Validasi `noHp` masih `string|max:255` di Register dan Profile, sementara `PhoneInput` membatasi 13 digit.
- Pesan validasi framework berbahasa Inggris (`APP_LOCALE=en`) muncul di bawah form berbahasa Indonesia, misalnya "The password is incorrect." di baris Password.
- `@headlessui/react` di `package.json` tidak dipakai lagi sejak `Profile/Partials` dihapus; belum di-uninstall.

## 5. Bahasa dan teks antarmuka (skill `bahasa-indonesia-plain`, belum diputuskan)

Skill ada di `.claude/skills/bahasa-indonesia-plain/SKILL.md` (2026-11-11). Isinya aturan bahasa polos, EYD dan UI copy. Beberapa aturannya bertabrakan dengan teks app sekarang, jadi perlu keputusan user dulu sebelum teks diubah.

Keputusan yang ditunggu:
- [ ] Format jam: titik ("08.00", EYD) atau titik dua ("08:00", dipakai sekarang di `BookingTimeline`, `SlotPicker`, tabel booking). Data di kode tetap "HH:MM".
- [ ] Rentang jam dan tanggal singkat ("18:00–20:00", "Jum, 30 Okt") boleh tetap di tabel dan komponen padat? Skill meminta "hingga"/"sampai" dan tanggal lengkap untuk teks biasa.
- [ ] Sapaan: app memakai "Anda" (19 tempat, tidak ada "kamu"); contoh di skill memakai "kamu". Tetapkan "Anda" untuk penyewa dan pengelola, atau beda per sisi.
- [ ] Kata serapan: "Login" atau "Masuk", "Log Out" atau "Keluar", "Profile" atau "Profil", "booking" atau "pemesanan", "Dashboard" tetap?
- [ ] Teks Login/Register penyewa berbahasa Inggris ("Welcome back👋, mate!", keputusan 2026-10-31) dan `APP_LOCALE=en`: tetap, atau ikut skill ke Bahasa Indonesia? Terkait juga pesan validasi Inggris di form Indonesia (bagian 4).

Setelah diputuskan:
- [ ] Rapikan skill: contoh tombol "Simpan Dokumen" jadi "Simpan dokumen" (sentence case), placeholder "cth. nama@email.com" jadi "Contoh: nama@email.com" (skill melarang singkatan), salah ketik "30% lebih murah. dari Rp100.000…".
- [ ] Tambahkan bagian khusus Buddhi Sports ke skill (format jam, sapaan, daftar kata serapan yang tetap dipakai, pengecualian tabel).
- [ ] Ubah judul menu ke sentence case, misalnya "Laporan Pembayaran" jadi "Laporan pembayaran" (`Components/AdminSidebar.tsx`), lalu sinkronkan design system.
- [ ] Tinjau pesan error, empty state dan dialog konfirmasi dengan aturan skill, terutama bukti bayar ditolak, batal booking dan booking kedaluwarsa (tidak menyalahkan penyewa, sebut langkah berikutnya).
- [ ] Sesuaikan test yang memeriksa teks yang berubah.

## 6. Redesign panel pengelola (rancangan beku 2026-11-12)

Sumber rancangan: kanvas **"Redesign Dashboard Admin"** (artboard `Admin-Dashboard-v2` dan tujuh halaman `Admin-*`) dan design system **"Design System Administrator"** (token, 10 komponen, README). Salinan token siap pakai ada di berkas `tokens.admin.css` dari design system itu. Rancangan sudah disetujui user; yang belum ada di aplikasi adalah penerapannya.

### Cakupan: hanya panel Admin (ditegaskan user 2026-11-13)

Implementasi mengubah **tampilan dan fungsi panel Admin** (`auth:admin`) **dan halaman login pengelola** (`/login-pengelola`, ditambahkan user 2026-11-13: "semua yang didesain di artifact, termasuk login"). Yang **tidak disentuh**: panel Manager, sisi penyewa (termasuk `/login` dan `GuestLayout`), dan halaman yang sudah tidak terjangkau (`Master/Admin`, `Master/Manager`).

- `AdminSidebarLayout`, `AdminSidebar` dan `HandleInertiaRequests` dipakai bersama Manager. Setiap perubahan di sana dipagari `pengelola.role === 'admin'` (di sisi PHP untuk prop baru, di sisi TSX untuk tampilan), sehingga Manager tetap persis seperti sekarang: header lama, tema terang, tanpa notifikasi baru.
- Token tema gelap hanya aktif di dalam pembungkus panel Admin, jadi Manager tidak ikut berubah walau memakai layout yang sama.
- Fitur Manager (catatan revisi laporan, notifikasi laporan) keluar dari rencana ini.
- Login pengelola dipakai Admin dan Manager (tab peran). Tampilan barunya tetap berlaku untuk keduanya karena itu satu halaman; yang berubah hanya halaman login, bukan panel Manager setelah masuk.

### Keputusan desain yang mengikat

Jangan diubah tanpa user; kalau implementasi memaksa berubah, tanya dulu.

- KPI dashboard **hanya "hari ini"**: Sesi hari ini, Keterisian hari ini, Booking masuk hari ini, Terverifikasi hari ini. Tanpa perbandingan minggu/bulan lalu dan tanpa lencana naik-turun. Setiap angka wajib punya satu baris keterangan yang menyebut asalnya.
- **Perlu tindakan FIFO**: bukti bayar yang paling lama dikirim ada di atas, bukan yang jam mainnya paling dekat atau yang nominalnya paling besar.
- **Nominal tidak tampil di daftar Perlu tindakan**. Pencocokan uang terjadi di drawer verifikasi, dan drawer **tidak menyimpulkan selisih**: hanya menampilkan Total booking dan Jumlah dibayar berdampingan, karena sistem tidak tahu nominal yang benar-benar ditransfer.
- **Jadwal**: satu jam selebar 100px (total 1.400px untuk 08:00–22:00), kartu selebar halaman, isinya digeser. Cara geser: seret jalur, seret thumb penggeser, klik trek, usap mendatar trackpad, tombol satu jam, panah keyboard. Baris dengan booking bertumpuk jadi dua lajur dan tingginya 112px (dari 84px).
- **Header pengelola** berisi tiga kontrol, urutannya tetap: notifikasi, mode gelap, menu akun.
- **Mode gelap hanya untuk panel pengelola.** Sisi penyewa tetap tanpa mode gelap (keputusan 2026-11-07).
- Design system pengelola **terpisah** dari design system penyewa. Kalau sebuah pola dipakai di kedua sisi, salin polanya, jangan token-nya.

### Urutan kerja (dari atas ke bawah)

Satu tahap = satu branch dari `main` = satu PR, ditinjau dan di-merge user sebelum tahap berikutnya. Urutannya mengikuti ketergantungan: tema dulu, lalu login dan header yang memakainya, lalu log (supaya aksi berikutnya langsung mencatat), baru dashboard.

| Tahap | Isi | Branch | Bergantung pada |
|---|---|---|---|
| 0 | Persiapan dan garis dasar | (tanpa kode) | - |
| 1 | Token dan tema | `feat/admin-tema` | 0 |
| 2 | Login pengelola | `feat/admin-login` | 1 |
| 3 | Header pengelola | `feat/admin-header` | 1 |
| 4 | Log aktivitas | `feat/admin-log-aktivitas` | 3 (menu akun) |
| 5 | Dashboard v2 | `feat/admin-dashboard-v2` | 3, 4 |
| 6 | Halaman Admin lain | `feat/admin-halaman-gelap` | 1 |
| 7 | Tes dan verifikasi akhir | `test/admin-redesign` | 1-6 |
| 8 | Sinkron dokumen | `docs/sinkron-redesign` | 1-7 |

Aturan di semua tahap: perubahan bedah (setiap baris terlacak ke tahap ini), komponen `ui/` dipakai dulu sebelum membuat baru, teks antarmuka berbahasa Indonesia lugas (skill `bahasa-indonesia-plain`), tidak mem-commit `.env`, tidak push ke `main`, dan setelah tiap tahap `php artisan test` hanya boleh gagal pada 8 tes Breeze yang sudah diketahui (bagian 3).

### Tahap 0 — Persiapan dan garis dasar

1. Sesuaikan artboard login di kanvas: panel pratinjau memakai kalimat dan ikon, tanpa angka (keputusan 2026-11-13). Hanya perlu disetujui user; kodenya belum disentuh. → verifikasi: user melihat artboard yang sudah diubah.
2. Ambil tangkapan layar garis dasar di 1280 dan 1440: login penyewa, login pengelola, Home penyewa, dashboard dan satu halaman master Admin, dashboard dan satu halaman Manager. Dipakai untuk membuktikan bahwa penyewa dan Manager tidak berubah. → verifikasi: berkas tersimpan di folder kerja, bukan di repo.
3. Jalankan `php artisan test` dan catat hasilnya (8 gagal yang diketahui). → verifikasi: angka awal tercatat.

### Tahap 1 — Token dan tema (branch `feat/admin-tema`)

1. Tambah `resources/css/admin.css` dari `tokens.admin.css` design system, tapi penanda temanya **kelas `.dark`**, bukan `[data-theme="dark"]`, supaya sejalan dengan `@custom-variant dark` di `app.css`. → verifikasi: `npm run build` sukses dan tampilan belum berubah (berkas belum diimpor).
2. Impor dari `app.css` dan daftarkan token ke Tailwind lewat `@theme inline` khusus pengelola. Jangan menimpa token penyewa: periksa setiap nama yang sudah dipakai `app.css` (`--background`, `--card`, `--border`, `--primary`, `--canvas`, `--tabel-header`). Kalau bentrok, beri awalan atau batasi cakupannya ke pembungkus panel pengelola. → verifikasi: satu halaman admin memakai `bg-card`, `text-muted-foreground`, `border` dan warnanya benar di terang dan gelap; halaman penyewa dibandingkan sebelum/sesudah, tidak berubah.
3. Pengalih tema: pilihan disimpan di cookie `tema_pengelola` (per perangkat, mengikuti pola `sidebar_state`). Kunjungan pertama tanpa cookie mengikuti pengaturan sistem (`prefers-color-scheme`). Kirim lewat prop shared, hanya untuk Admin dan rute login pengelola; pasang kelas `.dark` di elemen akar `AdminSidebarLayout`. → verifikasi: pilih gelap, muat ulang, tetap gelap; buka halaman penyewa di tab sama, tetap terang; Manager tidak mendapat prop tema.

### Tahap 2 — Login pengelola (branch `feat/admin-login`)

Rancangan: artboard **"Admin — Login pengelola (gaya panel Admin)"** dan versi HP (`Admin-Login.dc.html`). Draft B tetap di kanvas sebagai arsip.

1. `Layouts/PengelolaGuestLayout.tsx`: dua kolom (form kiri, panel pratinjau `bg-muted` kanan, panel disembunyikan di bawah 900px), header berisi logo + "Panel pengelola" + tombol mode terang/gelap. `GuestLayout` penyewa dan `AuthScene` **tidak diubah**. → verifikasi: `/login` penyewa sebelum/sesudah identik.
2. `Pages/Auth/LoginPengelola.tsx` pindah ke layout baru: tab peran sebagai `Tabs` shadcn (`bg-muted`, tab aktif `bg-background`, tanpa ikon 3D), field Username dan Password (`PasswordInput` yang ada), tombol "Login sebagai Admin/Manager". Logika `useForm`, rute `login.pengelola` dan validasi server tidak berubah; galat lewat `InputError`. → verifikasi: login Admin dan Manager berhasil, salah password menampilkan galat, ganti tab tidak mengosongkan username.
3. Pengalih tema membaca dan menulis cookie yang sama dengan Tahap 1, jadi pilihan di login terbawa ke dashboard. → verifikasi: pilih gelap di login, masuk, dashboard tetap gelap.
4. **Status panel pratinjau (dinamis, tanpa angka).** Rute `GET /login-pengelola/status` mengembalikan hanya tiga tingkat per peran: `tidak ada`, `ada`, `banyak`. Admin: dari pembayaran `Menunggu Verifikasi`; Manager: dari laporan yang belum diperiksa. Ambang tingkat ditaruh di `config`. Tanpa jumlah, nama atau nominal. Cache 5 menit, batas laju per IP (`throttle`). Panel menampilkan kalimat, misalnya "Ada pembayaran yang menunggu Anda". → verifikasi: tes feature memeriksa isi respons tidak memuat angka atau nama, dan batas laju bekerja.
5. Cek 1440, 1024 dan 390 tanpa geser mendatar; tes feature halaman login memuat tab peran dan tema dari cookie; tes login yang ada tetap hijau.

### Tahap 3 — Header pengelola (branch `feat/admin-header`)

1. Migrasi `admins.notifDibacaPada` (timestamp, nullable) untuk status notifikasi dibaca per akun.
2. `Components/pengelola/HeaderPengelola.tsx`: judul halaman, lalu notifikasi, mode gelap, menu akun. Dipakai dari `AdminSidebarLayout` hanya saat `pengelola.role === 'admin'`; Manager tetap memakai header lama. Prop `header` yang ada tetap jadi judul.
3. Menu akun: Profil pengelola (`/profile-pengelola`), Log aktivitas (ditambahkan di Tahap 4), sakelar Mode gelap, Keluar. Tombol akun di footer sidebar yang dobel dengan header dirapikan; judul menu menjadi sentence case ("Laporan pembayaran") di `AdminSidebar.tsx`.
4. Notifikasi: `pengelola.notifikasi` di `HandleInertiaRequests` (maksimal 5 baris, hanya Admin), gabungan urut terbaru dari: `pembayarans` `Menunggu Verifikasi` (urut `dikirimPada` menurun), `bookings` dengan `dibatalkanPenyewa` hari ini, dan laporan yang sudah diperiksa Manager (`diperiksaPada`). Baris bukti bayar membuka drawer verifikasi di tempat; baris lain menautkan ke halamannya.
5. Titik merah menyala selama ada bukti yang belum dibaca; "Tandai sudah dibaca" mengisi `notifDibacaPada`. → verifikasi: tes feature untuk isi dan urutan prop, dan Manager tidak mendapat prop ini; cek browser di dua halaman berbeda; status dibaca bertahan setelah login ulang di browser lain.

### Tahap 4 — Log aktivitas (branch `feat/admin-log-aktivitas`)

Rancangan halamannya sudah ada di kanvas (`Admin-Aktivitas`). Repo belum punya apa pun untuk riwayat, dan tabel yang ada hanya menyimpan keadaan terakhir, jadi tabel baru dibutuhkan. Aturan: tidak ada jalur ubah atau hapus untuk peran mana pun; Admin dan Manager hanya membaca.

1. Migrasi `create_log_aktivitas_table`: `id`, `waktu` (waktu server), `idAdmin` dan `namaAdmin` sebagai salinan, `aksi`, `jenisObjek`, `kodeObjek`, `ringkasan`, `hashSebelumnya`, `hash`; **tanpa foreign key** supaya menghapus data tidak mengubah riwayat. Di MySQL migrasi yang sama membuat trigger `BEFORE UPDATE` dan `BEFORE DELETE` yang menolak dengan `SIGNAL`; di SQLite (tes) trigger dilewati. Idealnya aplikasi memakai user database dengan hak `INSERT` dan `SELECT` saja pada tabel ini. → verifikasi: `UPDATE` dan `DELETE` langsung di MySQL ditolak.
2. `app/Support/LogAktivitas.php`: `catat()` mengunci baris terakhir, menghitung `hash = sha256(hashSebelumnya + isi baris)`, lalu `insert`. Satu-satunya jalan menulis, dipanggil di dalam transaksi aksinya.
3. Pasang `catat()` di: terima dan tolak bukti (`AdminDashboardController`), tambah/ubah/hapus di lima `Master*Controller`, `LaporanPembayaranController@buat`. Kesalahan dikoreksi dengan baris baru ("koreksi atas #id"), bukan mengubah baris lama. → verifikasi: aksi yang di-rollback tidak meninggalkan baris log.
4. `LogAktivitasController`: `tampilData` (baca saja, filter aksi dan tanggal, halaman) dan `periksa` (menelusuri rantai). Rute di grup `auth:admin`; tanpa method simpan, ubah atau hapus. Memakai `DB::table`.
5. `Pages/Admin/LogAktivitas/TampilData.tsx` sesuai kanvas, tombol "Periksa keaslian log", menu "Log aktivitas" di grup Laporan pada `AdminSidebar.tsx`, dan tautan di menu akun header.
6. `log:periksa` di `routes/console.php`, dijadwalkan harian; menyimpan titik terakhir yang lolos supaya pemeriksaan berikutnya hanya menelusuri baris baru.
7. **Jangkar di luar sistem**: hash terakhir bulan itu dicetak di PDF Laporan Pembayaran (`resources/views/pdf/laporan-pembayaran.blade.php`). Isi PDF selebihnya **tidak berubah** (tabel pembayaran terverifikasi, total, tanda tangan; grafik ditunda, keputusan user 2026-11-13). Opsional: hash harian dikirim ke email Manager.
8. Tes `tests/Feature/LogAktivitasTest.php`: aksi tercatat dalam transaksi yang sama, rollback tidak meninggalkan log, rantai valid dan rantai rusak terdeteksi, `UPDATE`/`DELETE` ditolak (dilewati di SQLite), Manager tidak punya jalur tulis. Tes memakai database uji terpisah karena tabel tidak bisa dibersihkan lewat aplikasi.

Batas jaminan: pemilik server dengan akses penuh bisa melepas trigger dan menghitung ulang rantai; jangkar di PDF yang sudah ditandatangani (butir 7) yang membuat hal itu ketahuan.

### Tahap 5 — Dashboard v2 (branch `feat/admin-dashboard-v2`)

`Pages/Dashboard/Admin.tsx` **diganti langsung** oleh v2. Kerjakan berurutan, satu bagian satu commit, masing-masing diverifikasi sebelum lanjut.

1. **Sapaan dan ringkasan.** Satu kalimat di bawah sapaan: tanggal, jumlah sesi hari ini, dan berapa bukti yang harus dicek sebelum sesi terdekat. → verifikasi: kalimatnya benar saat tidak ada sesi dan saat semua bukti sudah dicek.
2. **StatRow.** Empat angka hari ini dalam satu kartu. Keterisian = jam terisi dibagi (jumlah lapangan × 14 jam). Hanya booking `Dikonfirmasi` yang dihitung terisi; `Dipesan` tanpa bukti tidak menahan jam. → verifikasi: tes feature yang membandingkan angka dengan data seeder.
3. **Jadwal.** Perluas `ui/booking-timeline.tsx` atau buat `Components/admin/JadwalGeser.tsx` (kolom 100px, penggeser, lajur bertumpuk). Pertahankan perilaku yang ada: server mengirim rentang −7 sampai +30 hari dan penggantian hari terjadi di browser. → verifikasi: cek browser 1440 dan 1280, blok tidak terpotong, semua cara geser bekerja, blok "Tinjau bukti" tetap membuka drawer.
4. **Perlu tindakan.** Antrean FIFO (`ORDER BY dikirimPada, idPembayaran`) plus bagian Tugas lain yang hanya muncul kalau ada. Keadaan kosong: "Semua beres". → verifikasi: tes feature untuk urutan; cek keadaan kosong dengan database bersih.
5. **Booking terbaru.** Tab Semua/Dipesan/Dikonfirmasi/Dibatalkan dengan hitungan, kolom Pembayaran, satu tombol kontekstual per baris, menu titik tiga. → verifikasi: tiap tab memuat baris yang benar.
6. **Drawer verifikasi.** Pager "n dari N" dan tombol "Terima & berikutnya". Tombol Terima dinonaktifkan (bukan disembunyikan) saat jamnya bentrok dengan booking yang sudah dikonfirmasi, dengan sebab tertulis. Terima dan tolak memanggil `LogAktivitas::catat()` (Tahap 4). → verifikasi: tes feature untuk penolakan karena bentrok; cek browser untuk alur terima berurutan.

### Tahap 6 — Halaman Admin lain (branch `feat/admin-halaman-gelap`)

Header dan tema ikut otomatis dari layout. Periksa satu per satu di mode gelap, hanya halaman Admin: tabel master, badge status, kartu ringkasan pembayaran, kalender `DateInput`, sheet form, dan Profile pengelola. PDF laporan tetap terang, tidak ikut tema. Halaman Manager tidak diperiksa selain memastikan tampilannya tidak berubah. → verifikasi: buka halaman Admin di terang dan gelap, catat dan perbaiki warna yang salah.

### Tahap 7 — Tes dan verifikasi akhir (branch `test/admin-redesign`)

- `php artisan test` hijau untuk tes yang sudah ada, kecuali 8 tes Breeze yang memang masih merah (bagian 3).
- Tes baru yang belum tercakup di tahap sebelumnya: prop notifikasi, angka KPI, urutan FIFO, cookie tema, dan Manager tidak ikut berubah (tanpa prop notifikasi dan tema).
- Cek browser pada 1280 dan 1440, terang dan gelap, sidebar terbuka dan menciut, dengan akun Admin; halaman login pengelola juga pada 390. Dengan akun Manager hanya cek regresi: header, warna dan menu sama dengan garis dasar Tahap 0. `/login` dan Home penyewa sama dengan garis dasar.

### Tahap 8 — Sinkron dokumen (branch `docs/sinkron-redesign`)

Perbarui `CLAUDE.md` (ringkasan progres), `panduan.md` (lapisan warna baru untuk panel Admin), dan design system "Design System Administrator" kalau ada komponen yang berubah saat implementasi (termasuk komponen login dan log).

### Keputusan user (2026-11-13, semua disetujui)

- **Log aktivitas**: dibangun (Tahap 4). Hanya bisa ditambah, tidak bisa diubah atau dihapus siapa pun, termasuk Manager.
- **Status notifikasi dibaca**: per akun di database (`admins.notifDibacaPada`, Tahap 3).
- **Mode gelap**: per perangkat lewat cookie `tema_pengelola`; kunjungan pertama mengikuti pengaturan sistem.
- **Dashboard lama**: diganti langsung oleh v2.
- **Panel pratinjau login**: dinamis tapi tanpa angka (Tahap 2, butir 4).
- **Draft B**: tetap di kanvas sebagai arsip, tidak dipakai.
- **PDF laporan**: tetap seperti sekarang; grafik dan isi tambahan ditunda. Satu-satunya tambahan adalah hash log (Tahap 4, butir 7).

## 6b. Redesign panel Manager dan lanjutan Admin (rencana 2026-11-14)

Rencana lengkap: `project/RENCANA-IMPLEMENTASI.md` di kanvas "Redesign Dashboard Admin" (artboard `Manager-*`, `Admin-Profil`, `Manager-Profil`). Ringkasnya, satu tahap = satu branch dari `main` = satu PR:

| Tahap | Isi | Branch | Status |
|---|---|---|---|
| 1 | Admin disamakan dengan kanvas (teks abu minimal 14px, tooltip di semua badge status, Jumlah rata kanan), format jam titik di pengelola dan penyewa, alasan wajib saat Admin membatalkan booking | `feat/admin-sinkron-kanvas-2` | selesai (PR #41) |
| 2 | Kerangka panel Manager: tema, header, sidebar, menu akun, notifikasi | `feat/manager-kerangka` | PR dibuka |
| 3 | Log aktivitas: kolom `peran`, tindakan Manager tercatat, satu log untuk semua pengelola (Admin bawaan filter Admin) | `feat/manager-log` | PR dibuka |
| 4 | Pemantauan | `feat/manager-pemantauan` | belum |
| 5 | Analisis bisnis (Pendapatan, Penyewa, Pola booking, Kinerja Admin) | `feat/manager-analisis` | belum |
| 6 | Halaman data Manager | `feat/manager-halaman-data` | belum |
| 7 | Profile Admin dan Manager | `feat/pengelola-profil` | belum |
| 8 | Sinkron dokumen dan design system | `docs/sinkron-manager` | belum |

Keputusan user 2026-11-14: perhitungan di PHP, React hanya menampilkan; jam ditulis dengan titik (16.20) di semua halaman, termasuk penyewa; satu kolom log `peran`; mode Rentang = tiga pilihan cepat + "Pilih tanggal sendiri"; pesan galat Profile pengelola bahasa Indonesia; celah bagian 8 dikerjakan sesudah semua tahap Manager.

Catatan Tahap 1: jam tampil lewat `formatJam` / `rentangJam` (`ui/format.ts`) atau `jamTeks` (`booking/jadwal.ts`); nilai yang dikirim ke server tetap `HH:MM` (`jam()`), dan hitungan mundur bayar tetap `mm:ss`. Baris log lama tidak diubah (masih titik dua). Alasan batal Admin (`txtalasanbatal`, maks 255, kolom `catatan` log) diminta hanya saat status berubah menjadi `Dibatalkan`.

## 7. Verifikasi akhir

- Cek manual tiap halaman master: tambah → muncul di list → edit → delete (termasuk kasus delete gagal karena FK).
- `php artisan test` hijau semua.

## 8. Celah panel Admin (audit 2026-11-13)

Audit setelah PR #35–#39. Bukan daftar tugas yang sudah diputuskan: semua butir berstatus **belum diputuskan** dan keputusannya di tangan user. "Terbukti" = dicoba dengan tes sementara (sudah dihapus); "Dari kode" = disimpulkan dari membaca kode, belum dicoba.

### Tinggi

| # | Celah | Bukti | Usulan perbaikan |
|---|-------|-------|------------------|
| 8.1 | `POST /login-pengelola` tidak dibatasi percobaan. Sandi dev masih `Admin123` / `Manager123`. Login penyewa sudah punya throttle, pengelola belum. | Terbukti: 12 percobaan salah berturut-turut semuanya 302 (tidak ada 429). | Tambah `throttle` (misalnya 5/menit per username + IP) pada rute login pengelola; catat login gagal ke log aktivitas. |
| 8.2 | Form Tambah/Edit Pembayaran bisa langsung menyimpan status `Terverifikasi`. Booking tetap `Dipesan` (tidak menahan jam), tidak ada cek bentrok jam, dan jumlah bayar tidak dibandingkan dengan `totalBayar` booking. Pembayaran final (aturan A) tetapi booking-nya tidak ikut berubah. | Terbukti: pembayaran `Terverifikasi` dari form, booking tetap `Dipesan`. | Satu jalur untuk memverifikasi: status `Terverifikasi` hanya lewat `verifikasi.terima`; form hanya boleh `Menunggu Verifikasi` / `Ditolak`. Atau, kalau form tetap boleh, samakan efeknya (booking → `Dikonfirmasi` + cek bentrok). |

### Sedang

| # | Celah | Bukti | Usulan perbaikan |
|---|-------|-------|------------------|
| 8.3 | `LaporanPembayaranController@buat` tidak memeriksa apa pun di server: bulan depan / bulan berjalan / bulan kosong, pembayaran yang masih menunggu, dan `tglLaporan` bebas (bisa dimundurkan sehingga laporan tidak tampak terlambat). Bulan berjalan yang dilaporkan ikut terkunci oleh `KunciLaporan`. | Terbukti: laporan bulan depan dan tanggal laporan sembarang diterima. | Server menolak bulan ≥ bulan berjalan, bulan tanpa data, dan bulan yang masih punya bukti menunggu (sama dengan keadaan `depan` / `berjalan` / `kosong` / `tertahan` di UI). `tglLaporan` diisi server (hari ini), bukan dari input. |
| 8.4 | Form master Laporan (Tambah/Edit) membiarkan Admin mengetik `totalPemasukan`, bulan, dan tahun sendiri. Angka di baris bisa berbeda dari PDF, bulan bisa ganda (tidak ada unique constraint). | Terbukti: total dan periode bisa diisi bebas. | Hitung `totalPemasukan` di server; kunci bulan/tahun saat edit; unique `(bulan, tahun)` (validasi + indeks). Atau hapus Tambah/Edit manual dan hanya pakai "Buat laporan". |
| 8.5 | Menghapus laporan yang sudah diserahkan tapi belum diperiksa Manager membuka kunci pembayaran bulan itu (kunci B bisa dilewati). | Terbukti dengan tes: setelah hapus, `KunciLaporan::terkunci()` false. | Tolak hapus laporan yang punya `filePdf` kecuali sedang dalam permintaan revisi; atau hanya Manager yang boleh membatalkan. |
| 8.6 | Semua hapus master adalah rute GET (`/deletepembayaran/{id}`, dst.). Satu tautan atau `<img src>` di halaman lain bisa menghapus data saat Admin sedang login (mirip CSRF). | Dari kode (`routes/web.php`). | Ubah ke `DELETE` dengan token CSRF; `DeleteButton` sudah mendukung `method="delete"`. |
| 8.7 | Booking dari form Admin tidak memakai kunci baris (`kunciLapangan`) seperti sisi penyewa, jadi dua simpan bersamaan bisa menghasilkan booking ganda di jam yang sama. Admin juga bisa memesan lapangan berstatus `Perbaikan`. | Dari kode (`MasterBookingController`). | Pakai transaksi + `kunciLapangan` + cek bentrok yang sama dengan `Pemesanan`; tolak lapangan `Perbaikan`. |
| 8.8 | Edit dengan ID yang tidak ada tetap menulis satu baris ke log aktivitas ("hantu"); ID relasi hanya `integer`, tanpa `exists:`, sehingga kesalahan FK berakhir 500 (sudah tercatat di bagian 3). | Terbukti untuk log hantu. | Cari barisnya dulu (404 kalau tidak ada); `exists:` untuk semua ID relasi. |

### Rendah

| # | Celah | Usulan |
|---|-------|--------|
| 8.9 | Field bukti di form Pembayaran (`txtbukti`) berupa teks bebas yang dibaca dari disk privat oleh `BuktiBayarController`; Admin (atau data lama) bisa mengarahkannya ke `laporan/*.pdf` sehingga penyewa pemilik booking bisa membukanya. (Dari kode, belum dicoba.) | Validasi awalan `bukti/` dan tolak `..`; atau jangan boleh diedit dari form. |
| 8.10 | Yang belum masuk log: login dan login gagal, ubah profil, ubah sandi. Ubah sandi tidak mengeluarkan sesi lain. | Catat ke `log_aktivitas`; `Auth::logoutOtherDevices()` / invalidasi sesi lain. |
| 8.11 | Form memakai Select (Bulu Tangkis / Basket), tetapi server hanya memvalidasi `string|max:255`, jadi permintaan langsung bisa mengisi jenis lain padahal ikon dan tampilan penyewa bergantung pada dua nilai. | `in:Bulu Tangkis,Basket` di server. |
| 8.12 | Admin bisa mengubah email dan sandi penyewa (tercatat di log, sandi tidak ditulis). | Pertimbangkan: hanya reset lewat tautan, bukan ketik sandi. |
| 8.13 | Booking `Dikonfirmasi` dari form Admin tanpa pembayaran memberi okupansi tanpa pemasukan di analitik laporan. | Beri tanda di tabel Booking, atau wajibkan pembayaran. |
| 8.14 | "Periksa keaslian log" menghitung seluruh rantai secara sinkron; lambat saat log besar. | Periksa bertahap (dari titik terakhir yang lolos) dan jalankan lewat antrean. |
| 8.15 | PDF laporan ditimpa tanpa arsip, dan file ditulis sebelum transaksi DB selesai (gagal di tengah → file dan baris tidak cocok). | Simpan dengan nama berversi; tulis file setelah commit atau bersihkan saat gagal. |
| 8.16 | Prop `dataadmin` / `datamanager` di Pembayaran dan Laporan masih mengirim hash sandi (backlog lama). | `select` kolom yang perlu saja. |
| 8.17 | Konfigurasi: `.env.example` memakai `APP_DEBUG=true` / `APP_ENV=local`, `SESSION_SECURE_COOKIE` belum diatur, sandi dev ada di PRD. | Ubah sebelum aplikasi dipublikasikan (sandi dev sengaja dibiarkan sampai itu, keputusan user 2026-10-25). |

### Urutan yang disarankan (usulan, bukan keputusan)

1. 8.1 dan 8.2 (satu PR keamanan/integritas kecil).
2. 8.3 – 8.5 (laporan dan kunci periode; saling terkait dengan aturan A dan B).
3. 8.6 – 8.8 (pengerasan master data).
4. Sisanya sebelum aplikasi dipublikasikan.
