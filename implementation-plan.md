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

### Tahap A — Token dan tema (branch `feat/admin-tema`)

1. Tambah `resources/css/admin.css` dari `tokens.admin.css` design system, tapi penanda temanya **kelas `.dark`**, bukan `[data-theme="dark"]`, supaya sejalan dengan `@custom-variant dark` di `app.css`. → verifikasi: `npm run build` sukses dan tampilan belum berubah (berkas belum diimpor).
2. Impor dari `app.css` dan daftarkan token ke Tailwind lewat `@theme inline` khusus pengelola. Jangan menimpa token penyewa: periksa setiap nama yang sudah dipakai `app.css` (`--background`, `--card`, `--border`, `--primary`, `--canvas`, `--tabel-header`). Kalau bentrok, beri awalan atau batasi cakupannya ke pembungkus panel pengelola. → verifikasi: satu halaman admin memakai `bg-card`, `text-muted-foreground`, `border` dan warnanya benar di terang dan gelap; halaman penyewa dibandingkan sebelum/sesudah, tidak berubah.
3. Pengalih tema: simpan pilihan di cookie `tema_pengelola` mengikuti pola `sidebar_state`, kirim lewat prop shared, pasang kelas `.dark` di elemen akar `AdminSidebarLayout`. → verifikasi: pilih gelap, muat ulang, tetap gelap; buka halaman penyewa di tab sama, tetap terang.

### Tahap A2 — Login pengelola (branch `feat/admin-login`, dikerjakan sebelum header)

Rancangan: artboard **"Admin — Login pengelola (gaya panel Admin)"** dan versi HP di kanvas (berkas `Admin-Login.dc.html`). Draft B lama dipertahankan sebagai arsip, tidak dipakai.

1. Buat `Layouts/PengelolaGuestLayout.tsx`: dua kolom (form di kiri, panel pratinjau `bg-muted` di kanan, panel disembunyikan di bawah 900px), header berisi logo + "Panel pengelola" + tombol mode terang/gelap. `GuestLayout` penyewa dan `AuthScene` **tidak diubah**. → verifikasi: `/login` penyewa sebelum/sesudah identik.
2. Ubah `Pages/Auth/LoginPengelola.tsx` ke layout baru: tab peran sebagai `Tabs` shadcn (`bg-muted`, tab aktif `bg-background`, tanpa ikon 3D), field Username dan Password (`PasswordInput` yang sudah ada), tombol "Login sebagai Admin/Manager". Logika `useForm`, rute `login.pengelola` dan validasi server tidak berubah. Pesan galat lewat `InputError` di bawah field. → verifikasi: login Admin dan Manager berhasil, salah password menampilkan galat, tab tidak mengosongkan username.
3. Pengalih tema membaca dan menulis cookie `tema_pengelola` yang sama dengan panel (tahap A), jadi pilihan di login terbawa ke dashboard. Prop tema dikirim untuk rute login pengelola juga. → verifikasi: pilih gelap di login, masuk, dashboard tetap gelap; `/login` penyewa tetap terang.
4. Panel pratinjau: isi mengikuti peran terpilih (judul, dua kartu hitungan, satu kartu tugas). Lihat keputusan tentang sumber datanya di bawah. → verifikasi: ganti tab mengganti isi panel; cek 1440, 1024 dan 390 tanpa geser mendatar.
5. Tes feature: halaman login memuat tab peran dan `tema` dari cookie; tes login yang sudah ada tetap hijau.

### Tahap B — Header pengelola (branch `feat/admin-header`)

1. `Components/pengelola/HeaderPengelola.tsx`: judul halaman, lalu notifikasi, mode gelap, menu akun. Dipakai dari `AdminSidebarLayout` hanya saat `pengelola.role === 'admin'`, jadi semua halaman Admin ikut sekaligus dan Manager tetap memakai header lama. Prop `header` yang sudah ada tetap jadi judul.
2. Menu akun: Profil pengelola (`/profile-pengelola`, sudah ada), Log aktivitas (halamannya dibangun di Tahap H), sakelar Mode gelap, Keluar.
3. Notifikasi: tambah `pengelola.notifikasi` di `HandleInertiaRequests` (maksimal 5 baris), isinya gabungan tiga sumber, urut terbaru:
   - `pembayarans` berstatus `Menunggu Verifikasi`, urut `dikirimPada` menurun;
   - `bookings` dengan `dibatalkanPenyewa` hari ini;
   - laporan yang sudah diperiksa Manager (`diperiksaPada`), sebagai kabar saja, tanpa kolom baru.
   Baris bukti bayar membuka drawer verifikasi di tempat; baris lain menautkan ke halamannya. → verifikasi: tes feature yang memeriksa isi dan urutan prop; cek browser di dua halaman berbeda.
4. Titik merah menyala selama masih ada bukti yang belum dibaca, dan "Tandai sudah dibaca" mematikannya. Status dibaca disimpan per akun di `admins.notifDibacaPada` (tahap E).

### Tahap C — Dashboard v2 (branch `feat/admin-dashboard-v2`)

Kerjakan berurutan, satu bagian satu commit, masing-masing diverifikasi sebelum lanjut.

1. **Sapaan dan ringkasan.** Satu kalimat di bawah sapaan: tanggal, jumlah sesi hari ini, dan berapa bukti yang harus dicek sebelum sesi terdekat. → verifikasi: kalimatnya benar saat tidak ada sesi dan saat semua bukti sudah dicek.
2. **StatRow.** Empat angka hari ini dalam satu kartu. Keterisian = jam terisi dibagi (jumlah lapangan × 14 jam). Hanya booking `Dikonfirmasi` yang dihitung terisi; `Dipesan` tanpa bukti tidak menahan jam. → verifikasi: tes feature yang membandingkan angka dengan data seeder.
3. **Jadwal.** Perluas `ui/booking-timeline.tsx` atau buat `Components/admin/JadwalGeser.tsx` sesuai rancangan (kolom 100px, penggeser, lajur bertumpuk). Pertahankan perilaku yang sudah ada: server mengirim rentang tanggal −7 sampai +30 hari dan penggantian hari terjadi di browser. → verifikasi: cek browser 1440 dan 1280, blok tidak terpotong, semua cara geser bekerja, blok "Tinjau bukti" tetap membuka drawer.
4. **Perlu tindakan.** Antrean FIFO (`ORDER BY dikirimPada, idPembayaran`) plus bagian Tugas lain yang hanya muncul kalau ada. Keadaan kosong: "Semua beres". → verifikasi: tes feature untuk urutan; cek keadaan kosong dengan database bersih.
5. **Booking terbaru.** Tab Semua/Dipesan/Dikonfirmasi/Dibatalkan dengan hitungan, kolom Pembayaran, satu tombol kontekstual per baris, menu titik tiga. → verifikasi: tiap tab memuat baris yang benar.
6. **Drawer verifikasi.** Tambah pager "n dari N" dan tombol "Terima & berikutnya" yang membuka bukti berikutnya dalam urutan antrean. Tombol Terima dinonaktifkan (bukan disembunyikan) saat jamnya bentrok dengan booking yang sudah dikonfirmasi, dengan sebab yang tertulis. → verifikasi: tes feature untuk penolakan karena bentrok; cek browser untuk alur terima berurutan.

### Tahap D — Halaman lain

Header ikut otomatis dari layout. Yang perlu diperiksa satu per satu di mode gelap, hanya halaman Admin: tabel master, badge status, kartu ringkasan pembayaran, kalender `DateInput`, sheet form, dan PDF laporan (PDF tetap terang, tidak ikut tema). Halaman Manager tidak diperiksa selain memastikan tampilannya tidak berubah. → verifikasi: buka halaman Admin di terang dan gelap, catat yang warnanya salah.

### Tahap E — Perubahan database yang dibutuhkan

Sudah diputuskan. Kolom revisi laporan dibatalkan karena itu fungsi Manager.

- Tandai notifikasi dibaca: `admins.notifDibacaPada` (timestamp, nullable), supaya status bertahan antar perangkat.

### Tahap H — Log aktivitas (branch `feat/admin-log-aktivitas`)

Rancangan halamannya sudah ada di kanvas (`Admin-Aktivitas`). Repo belum punya apa pun untuk riwayat, dan tabel yang ada hanya menyimpan keadaan terakhir, jadi tabel baru dibutuhkan.

Aturan: tidak ada jalur ubah atau hapus untuk peran mana pun; Admin dan Manager hanya membaca.

1. Migrasi `create_log_aktivitas_table`: `id`, `waktu` (waktu server), `idAdmin` dan `namaAdmin` sebagai salinan, `aksi`, `jenisObjek`, `kodeObjek`, `ringkasan`, `hashSebelumnya`, `hash`; **tanpa foreign key** supaya menghapus data tidak mengubah riwayat. Di MySQL migrasi yang sama membuat trigger `BEFORE UPDATE` dan `BEFORE DELETE` yang menolak dengan `SIGNAL`; di SQLite (tes) trigger dilewati. Idealnya aplikasi memakai user database dengan hak `INSERT` dan `SELECT` saja pada tabel ini. → verifikasi: `UPDATE` dan `DELETE` langsung di MySQL ditolak.
2. `app/Support/LogAktivitas.php`: `catat()` mengunci baris terakhir, menghitung `hash = sha256(hashSebelumnya + isi baris)`, lalu `insert`. Satu-satunya jalan menulis. Dipanggil di dalam transaksi aksinya.
3. Pasang `catat()` di: terima dan tolak bukti (`AdminDashboardController`), tambah/ubah/hapus di lima `Master*Controller`, `LaporanPembayaranController@buat`. Kesalahan dikoreksi dengan baris baru ("koreksi atas #id"), bukan mengubah baris lama. → verifikasi: aksi yang dibatalkan (rollback) tidak meninggalkan baris log.
4. `LogAktivitasController`: `tampilData` (baca saja, filter aksi dan tanggal, halaman) dan `periksa` (menelusuri rantai, menampilkan hasil). Rute di grup `auth:admin`; tanpa method simpan, ubah, atau hapus. Memakai `DB::table`.
5. `Pages/Admin/LogAktivitas/TampilData.tsx` sesuai kanvas, tombol "Periksa keaslian log", dan menu "Log aktivitas" di grup Laporan pada `AdminSidebar.tsx`.
6. `log:periksa` di `routes/console.php`, dijadwalkan harian; menyimpan titik terakhir yang lolos supaya pemeriksaan berikutnya hanya menelusuri baris baru.
7. **Jangkar di luar sistem**: hash terakhir bulan itu dicetak di PDF Laporan Pembayaran (`resources/views/pdf/laporan-pembayaran.blade.php`), yang dikunci setelah diperiksa Manager. Opsional: hash harian dikirim ke email Manager.
8. Tes `tests/Feature/LogAktivitasTest.php`: aksi tercatat dalam transaksi yang sama, rollback tidak meninggalkan log, rantai valid dan rantai rusak terdeteksi, `UPDATE`/`DELETE` ditolak (dilewati di SQLite), Manager tidak punya jalur tulis.

Catatan: tabel ini tidak bisa dibersihkan lewat aplikasi, jadi tes memakai database uji terpisah. Batas jaminan: pemilik server dengan akses penuh bisa melepas trigger dan menghitung ulang rantai; jangkar di PDF yang sudah ditandatangani (butir 7) yang membuat hal itu ketahuan.

### Tahap F — Tes dan verifikasi akhir

- `php artisan test` hijau untuk tes yang sudah ada, kecuali 8 tes Breeze yang memang masih merah (bagian 3).
- Tes baru: prop notifikasi, angka KPI, urutan FIFO, dan cookie tema.
- Cek browser pada 1280 dan 1440, terang dan gelap, sidebar terbuka dan menciut, dengan akun Admin; halaman login pengelola juga pada 390. Dengan akun Manager hanya cek regresi: header, warna dan menu sama seperti sebelum perubahan.
- Tes baru: prop `notifikasi` dan cookie tema tidak muncul untuk Manager.

### Tahap G — Sinkron dokumen

Perbarui `CLAUDE.md` (ringkasan progres), `panduan.md` (lapisan warna baru untuk panel Admin), dan design system "Design System Administrator" kalau ada komponen yang berubah saat implementasi.

### Keputusan user (2026-11-13, semua disetujui)

- **Log aktivitas**: dibangun (Tahap H). Hanya bisa ditambah, tidak bisa diubah atau dihapus siapa pun, termasuk Manager.
- **Status notifikasi dibaca**: per akun di database (`admins.notifDibacaPada`, migrasi di Tahap E).
- **Mode gelap**: per perangkat lewat cookie `tema_pengelola`; kunjungan pertama mengikuti pengaturan sistem (OS).
- **Dashboard lama**: `Pages/Dashboard/Admin.tsx` diganti langsung oleh v2.
- **Panel pratinjau login**: dinamis tapi **tanpa angka**. Endpoint publik hanya mengembalikan tiga tingkat per peran (tidak ada / ada / banyak) dan kalimatnya tanpa jumlah, misalnya "Ada pembayaran yang menunggu Anda". Tanpa nama atau nominal; cache beberapa menit dan batas laju per IP. Artboard kanvas masih memakai angka dan perlu disesuaikan sebelum Tahap A2.
- **Draft B**: tetap di kanvas sebagai arsip, tidak dipakai.

## 7. Verifikasi akhir

- Cek manual tiap halaman master: tambah → muncul di list → edit → delete (termasuk kasus delete gagal karena FK).
- `php artisan test` hijau semua.
