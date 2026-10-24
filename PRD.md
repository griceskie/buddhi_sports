# **Project Requirements Document (PRD) Template**

## **1. Project Overview**
   - **Project Name:** Sistem Penyewaan Lapangan Bulutangkis dan Basket
   - **Project ID:** BUDDHI-SPORTS007
   - **Date:** 18 October 2026
   - **Version:** 1.0
   - **Prepared By:** Rener Aljustyo
   - **Approved By:** Rener Aljustyo

### **1.1 Purpose of the Project**
   - Universitas Buddhi Dharma berencana membangun hall bulutangkis dan basket yang dapat disewa oleh mahasiswa maupun masyarakat umum.
   - Tujuan utama sistem ini adalah menyediakan platform digital agar calon penyewa dapat registrasi, memilih lapangan yang masih kosong, melakukan booking, membayar, dan mengupload bukti pembayaran secara online, tanpa perlu datang langsung untuk mengecek ketersediaan lapangan.
   - Sistem juga menghasilkan laporan pembayaran bagi Manajer Lapangan sebagai dasar pengawasan pemasukan.

### **1.2 Project Background**
   - Universitas Buddhi Dharma memiliki fasilitas olahraga berupa 3 hall bulutangkis dan 1 lapangan basket yang akan dibuka untuk disewa oleh mahasiswa maupun masyarakat umum.
   - Selama ini belum ada sistem yang mengatur ketersediaan dan booking lapangan, sehingga berpotensi terjadi tabrakan jadwal (double booking) jika dikelola secara manual.
   - Dibutuhkan sistem yang mencatat status lapangan secara real-time, memastikan satu lapangan hanya bisa dibooking oleh satu penyewa pada slot waktu yang sama, serta mencatat pembayaran untuk keperluan pelaporan ke Manajer Lapangan.

### **1.3 Scope of the Project**
   - **In-Scope:**
     - Registrasi akun penyewa (mahasiswa atau masyarakat umum).
     - Login penyewa yang sudah terdaftar.
     - Pengelolaan data master lapangan (3 hall bulutangkis, 1 lapangan basket) oleh Admin, termasuk tarif per jam dan status ketersediaan.
     - Booking lapangan oleh penyewa: pemilihan lapangan, tanggal, dan jam, dengan validasi agar lapangan yang sedang terbooking pada slot waktu tertentu tidak dapat dibooking penyewa lain.
     - Pembayaran biaya sewa oleh penyewa, termasuk upload bukti pembayaran.
     - Verifikasi pembayaran oleh Admin.
     - Pembuatan laporan pembayaran (rekap pemasukan per periode) oleh Admin untuk diserahkan kepada Manajer Lapangan.
     - Pengelolaan data master Admin dan Manajer Lapangan.
   - **Out-of-Scope:**
     - Pembayaran otomatis melalui payment gateway (pembayaran dilakukan manual lalu bukti bayarnya diupload dan diverifikasi oleh Admin).
     - Notifikasi real-time (email/SMS/WhatsApp) ke penyewa.
     - Aplikasi mobile native (sistem berbasis web).
     - Pengelolaan keuangan di luar pemasukan sewa lapangan (misalnya gaji staf, biaya perawatan lapangan).

---

## **2. Stakeholders**
   - **Primary Stakeholders:**
     - **Penyewa** (mahasiswa atau masyarakat umum): melakukan registrasi, booking, dan pembayaran sewa lapangan.
     - **Admin Lapangan:** mengelola data lapangan, memverifikasi pembayaran, dan membuat laporan pembayaran.
     - **Manajer Lapangan:** menerima dan meninjau laporan pembayaran sebagai dasar pengawasan pemasukan.
   - **Secondary Stakeholders:**
     - Universitas Buddhi Dharma, sebagai pemilik fasilitas dan pihak yang menerima manfaat operasional dari sistem ini.
   - **Stakeholder Communication Plan:**
     - Progres pengembangan dilaporkan kepada Manajer Lapangan dan pihak universitas secara berkala sesuai kebutuhan proyek.

---

## **3. Objectives and Goals**
   - **Key Project Objectives:**
     - Menyediakan sistem booking lapangan online yang mencegah tabrakan jadwal (double booking).
     - Mempermudah proses pembayaran sewa lapangan beserta pencatatan bukti pembayarannya.
     - Menyediakan laporan pembayaran yang akurat dan mudah diakses oleh Manajer Lapangan.
   - **Success Criteria:**
     - Penyewa dapat melakukan registrasi, booking, dan pembayaran tanpa terjadi tabrakan jadwal pada lapangan yang sama.
     - Setiap transaksi pembayaran tercatat dan dapat direkap menjadi laporan pembayaran per periode (bulan/tahun).
     - Admin dapat mengelola data lapangan, booking, dan pembayaran tanpa proses manual di luar sistem.

---

## **4. Functional Requirements**
   - **Functional Requirements Overview:**
     - **Registrasi & Login Penyewa**
       - Penyewa baru melakukan registrasi (nama, no HP, email, password) sebelum dapat melakukan booking.
       - Penyewa yang sudah terdaftar login menggunakan akun yang dimiliki untuk melakukan booking.
       - Setelah login, Penyewa melihat menu Home dan Booking; setelah logout, Penyewa diarahkan kembali ke halaman login.
     - **Pengelolaan Data Lapangan**
       - Admin mengelola data 3 hall bulutangkis dan 1 lapangan basket, termasuk nama, jenis, tarif per jam, dan status.
       - Tarif sewa: lapangan bulutangkis Rp 50.000,-/jam, lapangan basket Rp 100.000,-/jam.
     - **Booking Lapangan**
       - Penyewa memilih lapangan, tanggal, dan jam (jam mulai dan jam selesai) yang ingin dibooking.
       - Sistem memvalidasi bahwa lapangan yang dipilih belum terbooking pada tanggal dan jam yang sama; jika sudah terbooking, penyewa tidak dapat membooking lapangan tersebut dan diarahkan memilih lapangan lain yang masih kosong.
       - Sistem menghitung total biaya sewa berdasarkan tarif lapangan dan durasi booking.
     - **Pembayaran**
       - Setelah booking berhasil, penyewa melakukan pembayaran sesuai total biaya sewa.
       - Penyewa mengupload bukti pembayaran (foto/scan transfer) melalui sistem.
       - Admin memverifikasi status pembayaran (misalnya: menunggu verifikasi, terverifikasi, ditolak).
       - Jika Admin menolak bukti, Admin wajib menulis alasan penolakan; alasan ditampilkan ke penyewa (Booking saya, halaman Bayar) agar bisa mengunggah ulang bukti yang benar.
       - Bukti pembayaran disimpan privat dan hanya dapat dibuka oleh penyewa pemilik booking, Admin, dan Manajer.
       - Booking yang belum mengunggah bukti dibatalkan otomatis setelah batas waktu bayar (saat ini 1 jam, diatur di config/pembayaran.php).
     - **Laporan Pembayaran**
       - Admin membuat laporan pembayaran berdasarkan data pembayaran yang telah terverifikasi, direkap per bulan/tahun.
       - Laporan pembayaran dapat dilihat oleh Manajer Lapangan.
     - **Dashboard Manajer Lapangan** (bagian wajib selesai 24 Oktober 2026)
       - Wewenang Manajer (diputuskan 24 Oktober 2026):
         - Melihat data Pembayaran (termasuk bukti bayar) dan data Lapangan, tanpa tambah/edit/hapus dan tanpa verifikasi.
         - Melihat, menambah, dan menghapus akun Admin, serta mereset password Admin. Tidak ada edit data Admin lainnya.
         - Menghapus Admin yang masih tercatat di pembayaran atau laporan ditolak sistem; tombol Hapus tetap ada dengan konfirmasi dan pesan penolakan.
         - Melihat dan mengunduh PDF laporan pembayaran.
         - Akun Manajer tidak dikelola lewat aplikasi untuk saat ini (ditambah lewat database/seeder).
       - Sidebar Manajer: Dashboard; Pemantauan: Pembayaran, Lapangan; Laporan: Laporan Pembayaran; Pengguna: Admin. Sama dengan sidebar Admin (bisa diciutkan, menu nama dengan Profile dan Log Out).
       - Belum diputuskan: Manajer "memverifikasi" (menandai sudah diperiksa) laporan bulan berjalan; jika ya, badge di menu Laporan Pembayaran menandai laporan yang belum diperiksa.
       - Wajib:
         - Daftar laporan pembayaran (nama laporan, periode, total pemasukan, tanggal laporan, pembuat) dengan tombol Buka PDF.
         - Kartu laporan terbaru dan status bulan berjalan (sudah dibuat atau belum dibuat Admin).
         - Kartu ringkasan: pemasukan bulan ini (hanya pembayaran terverifikasi) dibanding bulan lalu, total pemasukan tahun ini, jumlah booking terkonfirmasi bulan ini.
         - Grafik pemasukan per bulan selama 12 bulan terakhir.
       - Berguna untuk pengawasan (tahap berikutnya): pemasukan per lapangan, tingkat keterisian per lapangan/jam.
       - Opsional: jumlah pembayaran yang masih menunggu verifikasi (angka saja), pemilih periode untuk semua angka.
       - Tata letak: sidebar yang sama dengan Admin; header "Halo, {nama}", tiga kartu ringkasan, grafik 12 bulan di samping kartu laporan terbaru, lalu tabel laporan.
     - **Pengelolaan Data Master**
       - Admin mengelola data Penyewa, Lapangan, Booking, Pembayaran, dan Laporan Pembayaran.
       - Admin tidak dapat mengelola data Admin dan Manajer Lapangan, agar seorang Admin tidak bisa menghapus Admin lain. Akun Admin dikelola Manajer Lapangan (lihat Dashboard Manajer Lapangan).

---

## **5. Non-Functional Requirements**
   - **Performance Requirements:**
     - Proses pengecekan ketersediaan lapangan dan booking harus merespons dengan cepat agar tidak terjadi jeda yang memungkinkan dua penyewa membooking slot yang sama secara bersamaan.
   - **Security Requirements:**
     - Password akun Penyewa, Admin, dan Manajer disimpan dalam bentuk terenkripsi (hashed), tidak dalam bentuk teks biasa.
     - Hanya pengguna yang sudah login (Penyewa) yang dapat melakukan booking dan pembayaran.
     - Hanya Admin yang dapat mengubah data master lapangan dan memverifikasi pembayaran.
   - **Usability Requirements:**
     - Antarmuka booking dan pembayaran harus mudah dipahami oleh pengguna umum (mahasiswa maupun masyarakat), tanpa memerlukan pelatihan khusus.
     - Seluruh halaman (Penyewa, Admin, Manajer) memakai satu design system Buddhi Sports: palet warna iOS (terang/gelap) dan komponen shadcn/ui yang sama, sehingga tampilan form, tabel, status, dan dialog konsisten.
     - Tindakan yang tidak bisa dibatalkan (menghapus data, menghapus akun) selalu meminta konfirmasi lewat dialog.
   - **Availability Requirements:**
     - Sistem harus dapat diakses selama jam operasional penyewaan lapangan berlangsung.
   - **Compliance Requirements:**
     - Mengikuti kebijakan internal Universitas Buddhi Dharma terkait penggunaan fasilitas dan data pengguna.

---

## **6. Assumptions**
   - Pembayaran dilakukan secara transfer manual oleh penyewa, lalu bukti pembayaran diupload ke sistem untuk diverifikasi Admin (bukan melalui payment gateway otomatis).
   - Jumlah lapangan tetap, yaitu 3 hall bulutangkis dan 1 lapangan basket, selama periode pengembangan sistem ini.
   - Tarif sewa (Rp 50.000,-/jam untuk bulutangkis dan Rp 100.000,-/jam untuk basket) ditetapkan oleh pihak universitas dan dapat berubah sewaktu-waktu melalui data master lapangan.
   - Satu lapangan hanya dapat digunakan oleh satu penyewa dalam satu slot tanggal dan jam yang sama.

---

## **7. Constraints**
   - Jumlah lapangan terbatas (3 hall bulutangkis, 1 lapangan basket), sehingga ketersediaan slot booking terbatas, terutama pada jam-jam ramai.
   - Verifikasi pembayaran masih bergantung pada proses manual oleh Admin (mengecek bukti pembayaran yang diupload), bukan otomatis.

---

## **8. Dependencies**
   - Sistem bergantung pada input data lapangan (nama, jenis, tarif, status) yang dikelola oleh Admin sebagai data master sebelum booking dapat dilakukan.
   - Laporan pembayaran bergantung pada data pembayaran yang sudah diverifikasi oleh Admin.
   - Tidak ada dependensi terhadap layanan pihak ketiga (payment gateway, SMS gateway, dll.) pada versi ini.

---

## **9. Risks**
   - **Risk Identification:**
     - Dua penyewa membooking lapangan yang sama pada slot waktu yang sama secara bersamaan (race condition) jika validasi ketersediaan tidak ditangani dengan benar.
     - Penyewa mengupload bukti pembayaran palsu atau tidak sesuai dengan total biaya sewa.
     - Keterlambatan Admin dalam memverifikasi pembayaran dapat menghambat proses booking berikutnya.
   - **Risk Mitigation Plan:**
     - Menerapkan validasi pada level sistem (database/aplikasi) agar satu slot lapangan tidak dapat dibooking lebih dari satu kali.
     - Admin memverifikasi kesesuaian jumlah pembayaran dan bukti pembayaran sebelum status pembayaran disetujui.
     - Menetapkan prosedur agar verifikasi pembayaran dilakukan secara berkala oleh Admin.

---

## **10. Deliverables**
   - Modul registrasi dan login Penyewa.
   - Modul pengelolaan data master (Lapangan, Admin, Manajer).
   - Modul booking lapangan dengan validasi ketersediaan.
   - Modul pembayaran dan upload bukti pembayaran.
   - Modul laporan pembayaran untuk Manajer Lapangan.

---

## **11. Timeline**
   - Timeline rinci menyusul sesuai kesepakatan dengan pihak universitas; versi ini mencatat ruang lingkup fungsional sebagai dasar perencanaan jadwal pengembangan.

---

## **12. Budget**
   - **Estimated Budget:** Menyusul (belum ditentukan pada versi dokumen ini)
   - **Cost Breakdown:** Menyusul
   - **Budget Constraints:** Menyusul

---

## **13. Approval & Sign-off**
   - **Approval Signatures:**
     - Rener Aljustyo — Prepared By / Approved By
   - **Approval Date:** 18 October 2026

---

### **Appendices**
   - **Glossary of Terms:**
     - **Penyewa:** Mahasiswa atau masyarakat umum yang menyewa lapangan.
     - **Admin:** Pengelola data lapangan, booking, dan pembayaran.
     - **Manajer Lapangan:** Penerima laporan pembayaran, mengawasi pemasukan dari penyewaan lapangan.
     - **Hall:** Sebutan untuk lapangan bulutangkis indoor.
     - **Booking:** Proses pemesanan lapangan pada tanggal dan jam tertentu.
   - **References:**
     - Brief proyek yang diberikan oleh Universitas Buddhi Dharma (lisan/internal), 18 Oktober 2026.
