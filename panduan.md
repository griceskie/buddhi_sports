# Panduan Gaya — Buddhi Sports

Panduan memakai dan mengubah variabel tampilan: warna, font, sudut, ukuran. Semua variabel ada di [resources/css/app.css](resources/css/app.css), kecuali yang disebut lain. Nomor baris bisa bergeser kalau file diedit; cari nama variabelnya kalau tidak pas.

---

## 1. Cara kerja variabel

### Nama kelas = awalan + nama
```
bg  -  primary  /  10
│      │          └── transparansi (opsional): 10 = 10 %
│      └───────────── nama warna, dari --color-primary di @theme
└──────────────────── awalan bawaan Tailwind: bg = background-color
```
Tailwind membuat kelas otomatis dari setiap `--color-NAMA` di blok `@theme`, jadi `bg-primary` tidak ditulis di `app.css`. Kelas hanya ikut ke hasil build kalau dipakai di file `.tsx`.

### Rantai warna (3 lapis)
```
kelas bg-primary
  → --color-primary        @theme, baris 15-55         (penghubung ke Tailwind, jangan diubah)
  → --primary              lapis 2, baris 310-363      (peran: "warna tombol utama")
  → --accessible-blue      lapis 1, baris 171-307      (nilai warna asli: #1e6ef4)
```
- **Lapis 1** berisi nilai warna iOS dari Figma "ada iPhone duo nya" › Colors: `:root` untuk terang (baris 171), `.dark` untuk gelap (baris 242).
- **Lapis 2** berisi token shadcn. Isinya hanya alias ke lapis 1, kecuali `canvas` dan `sidebar-*` yang memakai abu netral shadcn.
- Variabel dibaca ulang setiap kali dipakai, jadi saat kelas `.dark` aktif semua warna berganti sendiri.

### Mengubah warna: pilih lapisnya
| Ingin | Ubah di |
|---|---|
| Ganti nilai warnanya (semua yang memakai warna itu ikut berubah) | Lapis 1: baris terang dan baris gelapnya |
| Ganti warna yang dipakai suatu peran (misalnya tombol utama jadi hijau) | Lapis 2: `--primary: var(--accessible-green);` |
| Ganti satu komponen saja | Kelasnya di file komponen, misalnya varian di `ui/badge.tsx` |

Satu variabel lapis 1 bisa dipakai beberapa token. Contohnya `--labels-primary` dipakai `foreground`, `card-foreground`, `popover-foreground`, `secondary-foreground`, dan `accent-foreground`. Kalau hanya ingin mengubah satu peran, ubah token lapis 2-nya.

---

## 2. Warna

### Latar (`bg-`)
| Kelas | Untuk |
|---|---|
| `bg-canvas` | Latar halaman (abu di belakang kartu) |
| `bg-card` | Kartu, tabel, panel |
| `bg-background` | Input, dialog, sheet, area putih di atas kartu |
| `bg-popover` | Dropdown, popover, daftar pilihan |
| `bg-muted` | Latar abu tipis: skeleton, latar ikon, baris yang di-hover |
| `bg-accent` | Hover atau item aktif di menu |
| `bg-secondary` | Tombol atau badge sekunder (abu solid) |
| `bg-primary` | Tombol utama, item terpilih |
| `bg-success` | Status berhasil (hijau) |
| `bg-destructive` | Hapus, error, ditolak (merah) |
| `bg-sidebar`, `bg-sidebar-accent` | Hanya di sidebar Admin/Manager |

### Teks (`text-`)
| Kelas | Untuk |
|---|---|
| `text-foreground` | Teks utama |
| `text-muted-foreground` | Keterangan, label kecil, placeholder |
| `text-primary` | Link, teks yang perlu menonjol |
| `text-destructive` | Pesan error |
| `text-success` | Teks status berhasil |

**Aturan pasangan:** teks di atas latar berwarna memakai nama latar yang sama ditambah `-foreground`. Dengan pasangan ini kontras teks tetap aman di mode terang maupun gelap.

| Latar | Teks di atasnya |
|---|---|
| `bg-primary` | `text-primary-foreground` |
| `bg-secondary` | `text-secondary-foreground` |
| `bg-success` | `text-success-foreground` |
| `bg-destructive` | `text-destructive-foreground` |
| `bg-card` | `text-card-foreground` |
| `bg-popover` | `text-popover-foreground` |
| `bg-accent` | `text-accent-foreground` |
| `bg-muted` | `text-muted-foreground` |
| `bg-sidebar` | `text-sidebar-foreground` |

### Garis (`border-`, `divide-`)
| Kelas | Untuk |
|---|---|
| `border` | Garis tepi biasa. Warnanya sudah `border-border` secara bawaan, dari aturan `*` di `@layer base` |
| `border-input` | Garis input, select, combobox |
| `border-destructive` | Input yang error |
| `border-primary` | Kartu atau item yang dipilih |
| `divide-border` | Garis pemisah antar baris |
| `border-sidebar-border` | Garis di dalam sidebar |

### Fokus (`ring-`, `outline-`)
| Kelas | Untuk |
|---|---|
| `focus-visible:ring-3 focus-visible:ring-ring/50` | Cincin fokus keyboard |
| `ring-destructive/20` | Cincin pada field yang error |

### Grafik (`fill-`, `stroke-`, `bg-`)
`chart-1` biru, `chart-2` hijau, `chart-3` oranye, `chart-4` indigo, `chart-5` teal. Contoh: `fill-chart-1`, `stroke-chart-2`, `bg-chart-3` untuk titik legenda.

### Warna iOS langsung
Pakai hanya kalau token di atas tidak cukup. Daftar lengkapnya ada di `@theme inline`, baris 58-127.

| Kelompok | Contoh | Untuk |
|---|---|---|
| `accessible-*` (blue, green, red, orange, teal, gray) | `bg-accessible-orange`, `text-accessible-teal` | Teks atau latar berwarna yang berisi tulisan. Kontras ≥ 4.5:1 |
| `accents-*` | `bg-accents-orange`, `text-accents-purple` | Hiasan tanpa tulisan: titik, ikon besar, garis. Lebih terang, jadi teks di atasnya sulit dibaca |
| `labels-*` | `text-labels-tertiary` | Tingkat abu teks gaya iOS |
| `fills-*` | `bg-fills-tertiary` | Latar abu transparan gaya iOS |
| `separators-*` | `border-separators-non-opaque` | Garis pemisah gaya iOS |
| `grays-*` | `bg-grays-white` | Putih atau hitam yang tetap sama di kedua mode |
| `miscellaneous-*` | `bg-miscellaneous-segmented-control-selected` | Warna kontrol iOS tertentu |

Belum ada token untuk oranye/peringatan. Status "Menunggu" memakai `accessible-orange`.

### Transparansi
Tambahkan `/angka` di belakang nama: `bg-primary/10`, `bg-destructive/20`, `text-foreground/60`.

### Menambah token warna baru (contoh: `warning`)
1. Lapis 2 (`:root`, dekat `--success`):
   ```css
   --warning: var(--accessible-orange);
   --warning-foreground: var(--grays-white);
   ```
2. `@theme` (dekat `--color-success`):
   ```css
   --color-warning: var(--warning);
   --color-warning-foreground: var(--warning-foreground);
   ```
3. Kelas `bg-warning`, `text-warning`, `border-warning`, dan `text-warning-foreground` langsung bisa dipakai.

### Jangan dipakai
- Kelas warna bawaan Tailwind seperti `bg-gray-100`, `text-indigo-600`, `bg-white`, `text-black`. Kelas ini tidak ikut berubah di mode gelap. `gray`, `indigo`, `red`, dan `green` masih disetel ke nilai iOS terang di blok "Breeze bridge" (baris 129-165), tapi itu hanya untuk halaman Welcome bawaan Laravel.
- Kode warna langsung seperti `bg-[#1e6ef4]`.
- `dark:` untuk warna (misalnya `bg-white dark:bg-black`), karena token sudah berganti sendiri. `dark:` hanya untuk penyesuaian khusus.

---

## 3. Font

| Variabel | Lokasi | Nilai | Kelas |
|---|---|---|---|
| `--font-sans` | `@theme`, baris 51 | `'Geist Variable', ui-sans-serif, system-ui, sans-serif` | `font-sans`, sudah dipasang di `html` |

Font Geist dimuat dari paket `@fontsource-variable/geist` (baris 4). Untuk mengganti font:
1. Pasang paketnya, misalnya `npm install @fontsource-variable/inter`.
2. Ganti import di baris 4.
3. Ganti nama font di `--font-sans`.

Ukuran teks memakai skala bawaan Tailwind (`text-xs` 12px, `text-sm` 14px, `text-base` 16px, `text-lg` 18px, `text-xl` 20px). Field form memakai `text-base` (16px) supaya Safari di iPhone tidak memperbesar halaman saat field disentuh.

### Skala tipografi

Selain skala bawaan, `app.css` punya blok `@theme` kedua (komentar "Skala tipografi") dengan 11 gaya dari kartu Typography di Design System. Satu kelas sudah membawa ukuran, tinggi baris, jarak huruf, dan (untuk judul) ketebalan. Ukuran bawaan Tailwind tidak ditimpa, karena komponen shadcn memakainya.

| Kelas | Ukuran / tinggi baris / jarak huruf | Tebal |
|---|---|---|
| `text-large-title` | 48px / 110% / -0.8px | 600 |
| `text-title-1` | 40px / 115% / -0.4px | 600 |
| `text-title-2` | 36px / 120% / -0.4px | 600 |
| `text-title-3` | 32px / 125% / -0.3px | 600 |
| `text-headline` | 28px / 130% / 0.2px | 600 |
| `text-body` | 24px / 133% / -0.1px | - |
| `text-callout` | 20px / 140% | - |
| `text-subheadline` | 16px / 150% | - |
| `text-footnote` | 14px / 150% | - |
| `text-caption-1` | 12px / 145% / 0.1px | - |
| `text-caption-2` | 10px / 130% / 0.5px | - |

Perhatikan: `text-body` itu 24px, bukan teks paragraf. Teks UI biasa = `text-footnote` (14px). Sejauh ini skala ini baru dipakai di Home penyewa.

Kalau menambah gaya baru, daftarkan juga namanya di [resources/js/lib/cn.ts](resources/js/lib/cn.ts). Fungsi `cn` (paket `cn`, pengganti tailwind-merge) menganggap `text-<nama>` yang tidak dikenal sebagai warna, sehingga `cn('text-footnote', 'text-muted-foreground')` membuang ukurannya. `vite.config.js` mengarahkan import `cn` ke file itu.

---

## 4. Sudut membulat (radius)

| Variabel | Lokasi | Nilai | Kelas |
|---|---|---|---|
| `--radius` | lapis 2, baris 348 | `0.625rem` (10px) | dasar untuk tiga variabel di bawah |
| `--radius-lg` | `@theme`, baris 52 | `= --radius` | `rounded-lg` (tombol, input, kartu) |
| `--radius-md` | `@theme`, baris 53 | `--radius − 2px` | `rounded-md` (badge, item menu) |
| `--radius-sm` | `@theme`, baris 54 | `--radius − 4px` | `rounded-sm` |

Cukup ubah `--radius`, karena ketiga ukuran lain ikut berubah. `rounded-xl`, `rounded-2xl`, dan `rounded-full` memakai nilai tetap bawaan Tailwind dan tidak ikut `--radius`.

### Squircle (sudut halus ala iOS)
Blok `@supports (corner-shape: squircle)` di akhir `@layer base` (baris 381) hanya berlaku di browser yang mendukung `corner-shape`. Browser lain mengabaikannya.

| Variabel | Nilai | Arti |
|---|---|---|
| `--corner-smoothing` | `1.5` | `1` bulat biasa, `1.5` sedikit halus, `2` squircle mirip iOS, `3` ke atas makin kotak |
| `--radius` | `0.75rem` | Menimpa `0.625rem` di browser yang mendukung, karena squircle terlihat lebih kecil |

Elemen `.rounded-full` (titik status, avatar, toggle) tetap lingkaran. Kalau ingin mengubah besar sudut, ubah `--radius` di **kedua** tempat: baris 348 dan blok squircle.

---

## 5. Jarak (spacing)

Jarak memakai `--spacing` bawaan Tailwind (`0.25rem` = 4px). `p-4` = 16px, `gap-2` = 8px, `h-10` = 40px. Nilai ini tidak diubah di project ini.

| Ukuran yang dipakai | Kelas |
|---|---|
| Input, select, combobox | `h-10` (40px), teks `text-base` |
| Tombol default | `h-8` (32px); `size="lg"` = `h-9` |
| Jarak antar-field di form | `form.space-y-4` |

---

## 6. Variabel di komponen

Variabel ini ditulis di file komponen, bukan di `app.css`.

| Variabel / konstanta | File | Nilai | Untuk |
|---|---|---|---|
| `SIDEBAR_WIDTH` → `--sidebar-width` | `ui/sidebar.tsx`, baris 17 | `16rem` | Lebar sidebar terbuka |
| `SIDEBAR_WIDTH_MOBILE` | `ui/sidebar.tsx`, baris 18 | `18rem` | Lebar sidebar di HP (sheet) |
| `SIDEBAR_WIDTH_ICON` → `--sidebar-width-icon` | `ui/sidebar.tsx`, baris 19 | `3rem` | Lebar sidebar saat diciutkan |
| `SIDEBAR_KEYBOARD_SHORTCUT` | `ui/sidebar.tsx`, baris 20 | `b` | Ctrl/Cmd+B untuk membuka/menutup |
| `SIDEBAR_COOKIE_NAME`, `_MAX_AGE` | `ui/sidebar.tsx`, baris 15-16 | `sidebar_state`, 7 hari | Menyimpan keadaan sidebar |
| `--cell-size` | `ui/calendar.tsx`, baris 21 | `--spacing(8)` = 32px | Ukuran kotak tanggal di kalender |

**Jangan diubah:** variabel yang diisi otomatis oleh Base UI saat popup dibuka, yaitu `--transform-origin`, `--anchor-width`, `--available-height`, dan `--toast-swipe-movement-x/y`. Komponen hanya membacanya.

---

## 7. Pengaturan lain di `app.css`

| Baris | Isi | Fungsi |
|---|---|---|
| 1-4 | `@import` | Tailwind, animasi (`tw-animate-css`), utilitas shadcn (`data-active:`, `data-horizontal:`), font Geist |
| 7 | `@custom-variant dark` | `dark:` mengikuti kelas `.dark`, bukan pengaturan gelap/terang Windows. **Jangan dihapus**: tanpa ini tombol outline jadi abu di komputer yang memakai mode gelap |
| 9-13 | `@source` | Folder yang dipindai Tailwind untuk mencari kelas. Tambahkan di sini kalau ada folder baru di luar `resources/js` dan `resources/views` |
| 365-367 | `*` | Warna garis dan outline bawaan semua elemen |
| 369-371 | `body` | Latar dan warna teks bawaan |
| 373-376 | `html` | Font, dan `scrollbar-gutter: stable` supaya halaman tidak bergeser saat scrollbar muncul atau hilang |

---

## 8. Ringkasan: mau mengubah apa, di mana

| Mau mengubah | Variabel | Lokasi |
|---|---|---|
| Warna tombol utama dan link | `--accessible-blue` | lapis 1 (`:root`) |
| Latar halaman | `--canvas` | lapis 2 (`:root` dan `.dark`) |
| Warna kartu | `--backgrounds-grouped-secondary` | lapis 1 (terang dan gelap) |
| Warna garis | `--separators-opaque` | lapis 1 (terang dan gelap) |
| Hijau / merah status | `--accessible-green` / `--accessible-red` (terang), `--accents-green` / `--accents-red` (gelap) | lapis 1 |
| Warna grafik | `--chart-1` … `--chart-5` | lapis 2 |
| Warna sidebar | `--sidebar-*` | lapis 2 (`:root` dan `.dark`) |
| Font | `--font-sans` + import baris 4 | `@theme` |
| Besar sudut | `--radius` | lapis 2 **dan** blok squircle |
| Kehalusan sudut | `--corner-smoothing` | blok squircle |
| Lebar sidebar | `SIDEBAR_WIDTH`, `SIDEBAR_WIDTH_ICON` | `ui/sidebar.tsx` |
