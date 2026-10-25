# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Project

Buddhi Sports is a Laravel 12 + Inertia.js (React/TSX) app for renting badminton and basketball courts (see [PRD.md](PRD.md)). UI uses the Buddhi Sports design system with Tailwind v4:
- Colours: iOS palette (Light/Dark) in `resources/css/app.css`, exposed as Tailwind colours (`bg-backgrounds-grouped-primary`, `text-labels-secondary`, ...) and aliased to shadcn tokens (`bg-background`, `text-muted-foreground`, `border`, `text-destructive`, `bg-success`). Use tokens in new code, not raw `gray-*`/`indigo-*`. Page background is `bg-canvas` (shadcn neutral gray `oklch(0.97 0 0)`; in `.dark` it falls back to the iOS grouped black), not the bluish iOS `bg-backgrounds-grouped-primary`.
- Components: shadcn-style on Base UI in `resources/js/Components/ui/` (button, input, select, card, table, badge, alert, dialog, alert-dialog, dropdown-menu, tabs, currency-input, ...) plus `format.ts` (`formatRupiah`, `BULAN`, ...). The Breeze components (`TextInput`, `PrimaryButton`, `Dropdown`, `Modal`, ...) were removed; don't reintroduce them.
- App-level helpers in `resources/js/Components/`: `FormSelect` (string-valued Select for forms, `''` = nothing chosen), `FormCombobox` (searchable `FormSelect` on `ui/combobox`; used for Penyewa, Lapangan, Admin and Status in the Booking sheet; `clearable` defaults to false), `DeleteButton` (Hapus + AlertDialog confirm, used in TampilData), `Wordmark`, `InputError`. Flash `success`/`error` from the server show as toasts at the bottom (`ui/toast.tsx`, Base UI Toast; `<Toaster />` and the flash listener live in `app.tsx`); call `toast.success()`/`toast.error()` for client-side notices. `FlashMessage` was removed; don't put flash banners on pages.
- Layouts in `resources/js/Layouts/`: `AdminSidebarLayout` (collapsible sidebar; used by every Admin and Manager page: dashboards, master-data TampilData pages, Profile; menu follows the role; optional `header` prop = page title), `AdminLayout` (old top nav; only the unreachable `Master/Admin` and `Master/Manager` pages still use it, plus `navLinkClass` for `PenyewaLayout`), `PenyewaLayout` (Penyewa: logo links Home; name menu with Booking saya, Profile, then a separator and Log Out), `GuestLayout` (optional `title`/`description`). Pages put content directly inside; the layouts provide the container.
- Page patterns: TampilData = `Card` > `Table` with status badges and `TableEmpty`; Form pages = `Card` > `CardContent` > `form.space-y-4` with `Label` + control + `InputError`, full-width submit `Button`.
- Corner smoothing: `resources/css/app.css` (end of `@layer base`) applies `corner-shape: squircle` to every element inside `@supports (corner-shape: squircle)` and raises `--radius` to 0.75rem there; `.rounded-full` stays `round`. Browsers without support ignore the block and keep normal `border-radius`.
- `dark:` utilities follow the `.dark` class (`@custom-variant dark` in `app.css`), not the OS setting, matching the colour tokens. Do not remove it: without it outline buttons turn grey on machines in OS dark mode.
- React 18: components that need a `ref` must use `React.forwardRef` (as `ui/input` and `ui/textarea` do).
- [panduan.md](panduan.md) (Indonesian) explains the colour layers (iOS values -> shadcn aliases -> Tailwind classes), which class to use for bg/text/border, and the non-colour variables (font, radius, squircle, sidebar widths). Keep it in sync when `app.css` tokens change.

Models use custom primary keys (e.g. `idPenyewa`, `idLapangan`) and `$timestamps = false`. See [implementation-plan.md](implementation-plan.md) for the master-data CRUD pattern in progress (controllers use `DB::table(...)` query builder, not Eloquent, to match an existing template style — follow that pattern for new master-data controllers unless told otherwise).

# Commands
- Dev server (Vite): `npm run dev`
- Build: `npm run build`
- Type check: `npx tsc --noEmit`
- After pulling, run `npm install` if `package.json` changed (the design-system PR added `date-fns`, `react-day-picker`, `recharts`, `react-is`).
- PHP dev server + queue + Vite together: `composer dev`
- Laravel dev server only: `php artisan serve`
- Run tests: `php artisan test` (or `vendor/bin/phpunit`)
- Lint/format PHP: `vendor/bin/pint`
- Syntax check a PHP file: `php -l path/to/file.php`
- List routes: `php artisan route:list`

# Code Style
- PHP: 4-space indentation, PSR-4 autoloading under `App\`.
- TSX: match existing files in `resources/js/Pages/` and `resources/js/Components/`.
- Routes live in `routes/web.php`: Penyewa routes under `Route::middleware('auth')` (guard `web`), master-data routes under `Route::middleware('auth:admin')`, Manager routes under `auth:manager`.
- Controllers return `Inertia::render('Page/Path', [...])`, not Blade views.
- Master-data controllers follow the `Master{Model}Controller` naming and method pattern already used (`tampilData`, `insertData`, `updateData`, `deleteData{Model}`); Tambah/Edit forms are sheets on the TampilData page (`Components/FormSheet.tsx`), not separate pages. The Admin/Manager master controllers (unreachable) still have the old `tampilForm*` methods.

# Progress (2026-10-24, last update of this working session)
Details and open items: [implementation-plan.md](implementation-plan.md). Dev accounts (Admin `Admin1`/`Admin123`, Manager `Manager1`/`Manager123`) are listed in [PRD.md](PRD.md), Appendices.
- Done: CRUD for all 7 models (`Master*Controller` + TSX pages in `resources/js/Pages/Master/`). Active admin pages are the five TampilData pages (Penyewa, Lapangan, Booking, Pembayaran, Laporan Pembayaran) with sheet forms in `AdminSidebarLayout`; `Master/Admin` and `Master/Manager` are unreachable leftovers on `AdminLayout`).
- Done: design system applied to all layouts and pages (Auth, Profile, Home, Booking, Admin/Manager dashboards, 21 Master pages).
- Done: Penyewa Home is route `dashboard`, Booking saya is route `booking` (in the name menu); Penyewa logout redirects to `/login`.
- Done: multi-role auth — guard `web` = `Penyewa` (`/login`, `/register`), guards `admin`/`manager` via `/login-pengelola` (two tabs).
- In progress: SMTP via Mailtrap sandbox for Penyewa password reset (`.env` still `MAIL_MAILER=log`; credentials must come from the user, never invented).
- Done: Admin/Manager profile (`/profile-pengelola`, `PengelolaProfileController`, route group `auth:admin,manager`): edit nama/username + change password. `AdminLayout` shows a name dropdown (Profile, Log Out) from the shared `pengelola` prop; nav items default by role.
- Done: unique validation for `admins.username`, `managers.username`, `penyewas.email` in master controllers (validation only, no DB constraint).
- Done (2026-10-20): Penyewa Home (`/dashboard`, `Pages/Dashboard.tsx`) built from the HTML draft: 30-day date strip + two-month calendar popover, court cards with hour chips, booking summary + mobile bar. Parts in `Components/booking/` (`jadwal.ts` pure logic, `DateStrip` (calendar button is `ui/date-picker`, extended with optional `label`/`align`/`calendarProps`/`footer`), `CourtSlotCard` = `ui/court-card` (big price column via its `aside` prop, which hides the small rate line) + `ui/slot-picker` (free slots `bg-canvas` grey on the white card, booked = dashed and empty) (given an optional `isPast` prop for hours already started), `RingkasanBooking`). Reuse `ui/` components before hand-building; check `ui/` first. Route passes real `lapangan` from DB; page also accepts optional `terisi` (booked hours) which nothing sends yet. "Booking sekarang" does not save yet (shows a note). The booking backend PR (`origin/backend/booking-penyewa`) was rejected for now; its seeder names (`Lapangan Bulu Tangkis 1`...) differ from the real DB names, so running it would duplicate the 4 courts.
- Done (2026-10-21): `ui/sidebar.tsx` (shadcn Sidebar API on Base UI; also `ui/separator`, `ui/skeleton`, `hooks/use-mobile.ts`, `--color-sidebar-*` in `app.css`, `side` prop on `DropdownMenuContent`). `Components/AdminSidebar.tsx` (collapses to icons with tooltips, Ctrl/Cmd+B, state kept in the `sidebar_state` cookie, sheet on phones) is now used by every Admin and Manager page (see the 2026-10-24 entries). React 18 gotcha: any component passed as a Base UI `render` target (e.g. `SidebarMenuButton` inside `DropdownMenuTrigger`) must be `forwardRef`, otherwise the popup never anchors and stays invisible at the top-left.
- Done (2026-10-23): Penyewa booking flow with backend (`BookingPenyewaController`, rules in `app/Support/Pemesanan.php`). Home saves via `POST /booking` (whole hours 08:00–22:00, up to 30 days, no past hours, row lock + overlap check) and redirects to `Pages/Booking/Bayar.tsx` (`/booking/{id}/bayar`: transfer details from `config/pembayaran.php` / `.env` `BANK_*`, then proof upload). `Pages/Booking.tsx` (`/booking`): `Empty` when no bookings, otherwise list with Aktif/Riwayat tabs and an upload dialog. Upload (`POST /booking/{id}/bukti`, jpg/png/pdf max 2 MB, private `local` disk under `bukti/` since 2026-10-24) creates a `pembayarans` row `Menunggu Verifikasi`. Decisions: only `Dikonfirmasi`/`Dibayar` hold a slot (pending bookings do not block others); a `Dipesan` booking without proof is set to `Dibatalkan` `batas_bayar_menit` (config, now 60) min after `bookings.created_at` (new nullable column; admin-entered rows stay null and never expire) by `booking:batalkan-kedaluwarsa` (scheduled every minute) and also at the start of each Penyewa booking page. App timezone is `Asia/Jakarta`. `public/storage` link is required (`php artisan storage:link`). `BANK_*` in `.env` are placeholders: replace with the real account. Tests: `tests/Feature/BookingPenyewaTest.php` (11); PHP here has no GD, so use `UploadedFile::fake()->create(name, kb, 'image/jpeg')`, not `->image()`.
- Done (2026-10-23): Admin dashboard (`AdminDashboardController`, `Pages/Dashboard/Admin.tsx` in `Layouts/AdminSidebarLayout.tsx`): stats, today's per-court timeline (`Components/admin/JadwalHariIni.tsx`), verification queue with `ui/proof-review`, latest bookings. `POST /verifikasi/{idPembayaran}/terima` (payment `Terverifikasi`, booking `Dikonfirmasi`, refused if it overlaps a confirmed booking) and `/tolak` (payment `Ditolak`, booking stays `Dipesan`; the renter can re-upload, which replaces the file on the same `pembayarans` row). A booking with any payment row never auto-expires. Shared prop `pengelola.menungguVerifikasi` feeds the sidebar badge. Sidebar uses shadcn neutral `--sidebar-*` values (no iOS blue) and has a collapse button in its footer (desktop) plus a header trigger on phones. Admin Booking form now offers `Dikonfirmasi`. Tests: `tests/Feature/AdminDashboardTest.php` (6).
- Done (2026-10-23): Admin cannot manage Admin or Manager accounts (routes removed from `auth:admin`, menus removed; `MasterAdminController`/`MasterManagerController` and their pages are now unreachable). Admin sidebar groups: Dashboard / Penyewaan (Penyewa, Lapangan, Booking, Pembayaran) / Laporan (Laporan Pembayaran); collapse is an icon (`SidebarTrigger`) beside the logo. Dashboard timeline uses the reusable `ui/booking-timeline.tsx` (hour columns as CSS grid so lines are even; overlapping bookings stack in lanes) and shows only confirmed and awaiting-verification bookings. Payment report: `/tampilpembayaran?periode=YYYY-MM` shows a month summary and a "Buat laporan" dialog (date, Manager, `ui/signature-pad` JPEG signature) that posts to `LaporanPembayaranController@buat`; barryvdh/laravel-dompdf renders `resources/views/pdf/laporan-pembayaran.blade.php` to the private `local` disk (`laporan/laporan-pembayaran-YYYY-MM.pdf`, font subsetting on) and upserts one `laporan_pembayarans` row per month with `namaLaporan`/`filePdf` (new columns). PDF opens via `/laporanpembayaran/{id}/pdf` for Admin and Manager only. Signature must be JPEG: PHP here has no GD, which dompdf needs for PNG. Tests: `tests/Feature/LaporanPembayaranTest.php` (8), fixture `tests/Fixtures/tanda-tangan.txt`.
- Done (2026-10-23): Lapangan status is now only `Tersedia` / `Perbaikan` (label "Dalam perbaikan"); validated with `in:`, migration `2026_10_23_200000_ubah_status_lapangan_ke_tersedia` converted `Kosong`/`Terbooking` to `Tersedia`. Pembayaran page widgets: Total pemasukan + one Status pembayaran widget (Terverifikasi / Menunggu / Ditolak with counts, amounts and a stacked bar); `ringkasan` is `{terverifikasi, menunggu, ditolak}` each `{jumlah, total}`. Admin dashboard card is "Jadwal" with prev/next day, a date picker and a "Hari ini" reset: `/dashboard-admin?tanggal=YYYY-MM-DD` changes only `jadwal`/`tanggalJadwal` (invalid dates fall back to today); stats stay on today.
- Done (2026-10-23): Admin master-data Tambah/Edit (Penyewa, Lapangan, Booking, Pembayaran, Laporan Pembayaran) open in a side sheet on the TampilData page instead of separate pages: `Components/FormSheet.tsx` (`useFormSheet` state, `FormSheet` wrapper, `SheetForm` header/fields/Batal-Simpan footer); each page has its own `Form{Model}` component keyed by `sheet.versi`. The `FormTambah`/`FormEdit` pages, their `tampilFormTambah`/`tampilFormEdit` methods and `/form*`, `/edit*` routes were removed; `tampilData` now also sends the select options. Conflict errors (booking overlap, duplicate pembayaran) return as field errors via `back()->withErrors`; pembayaran saves go `back()` to keep `?periode`. Edit Pembayaran shows the proof with `ProofPreview` (exported from `ui/proof-review`). Dashboard "Tambah booking" links to `/tampilbooking?tambah`, which opens the sheet. Status pembayaran widget shows counts only. Tests: `tests/Feature/MasterDataSheetTest.php` (4).
- Done (2026-10-24): Admin dashboard "Jadwal" switches days in the browser: the server sends bookings for `jadwalDari`..`jadwalSampai` (selected date -7 to +30 days, each item has `tanggal`) and the page filters locally; only a date outside that range triggers a partial reload. Reason: every request takes ~500 ms on this machine (no OPcache, `php artisan serve` on Windows), local switch is ~30 ms. Stat cards order: Booking hari ini, Menunggu verifikasi, Terisi hari ini, Pendapatan bulan ini. Manager account in the dev DB: Jarwo / `Manager1` / `Manager123`.
- Done (2026-10-24): payment proofs are private. Uploads go to the `local` disk (`storage/app/private/bukti/`); `pembayarans.buktiBayar` keeps the relative path. They are served only by `GET /pembayaran/{idPembayaran}/bukti` (`BuktiBayarController`, route `pembayaran.bukti`, middleware `auth:web,admin,manager`): Admin, Manager, or the renter who owns the booking, otherwise 403. Migration `2026_10_24_000000_pindahkan_bukti_bayar_ke_disk_privat` moved the existing files. The URL has no extension, so pass `pdf` to `ProofPreview` (`buktiPdf` in props). Tests: `tests/Feature/BuktiBayarTest.php` (3).
- Done (2026-10-24): Manager panel (`ManagerController`, route group `auth:manager`) in `AdminSidebarLayout`; `AdminSidebar` picks its menu by `pengelola.role` (Manager: Dashboard / Pemantauan: Pembayaran, Lapangan / Laporan: Laporan Pembayaran / Pengguna: Admin). Pages: `Pages/Dashboard/Manager.tsx` (income this month vs last, this year, confirmed bookings this month, `IncomeChart` of 12 months from verified payments, "Laporan bulan ini" card, latest 5 reports), `Pages/Manager/Pembayaran.tsx` (read-only, period picker, proof sheet), `Manager/Lapangan.tsx` (read-only), `Manager/LaporanPembayaran.tsx` (open or download PDF; `laporan.pdf` takes `?unduh=1`), `Manager/Admin.tsx` (list, add, reset password, delete with confirm; delete is refused with a flash error while the Admin is referenced by a foreign key). Shared: `Components/RingkasanPembayaran.tsx` (Total pemasukan + Status pembayaran, also used by the Admin Pembayaran page; period/summary helpers `MasterPembayaranController::awalPeriode/ringkasan`), `Components/manager/TabelLaporan.tsx`. `DeleteButton` accepts `method="delete"`. Tests: `tests/Feature/ManagerTest.php` (6).
- Done (2026-10-24): account dropdowns (`PenyewaLayout`, `AdminLayout`, `AdminSidebar`) follow the shadcn structure: `DropdownMenuGroup` (label + items), `DropdownMenuSeparator`, then a group with Log Out, which is not red. PDF report: amount column header and values both right-aligned (`table.data .r`), booking code never wraps. Manager income chart lists the current month first (leftmost) and goes back 11 months. Rejecting a proof requires a reason: `pembayarans.alasanTolak` (migration `2026_10_24_100000`), `POST /verifikasi/{id}/tolak` validates `alasan`, `ProofReview` asks for it in a second step; the admin edit form requires `txtalasan` when status is Ditolak; accepting or re-uploading clears it; renters see it on `/booking` and the Bayar page. `/booking` cards drop the "BK-xxxx · Rp × jam" line for a "Detail booking" link that opens a dialog with `ui/booking-summary`.
- Done (2026-10-24): app language is Indonesian: `APP_LOCALE=id` (also the default in `config/app.php`), with `lang/id/{validation,auth,passwords,pagination}.php`. Form field names shown in messages (`txtlapangan` -> "lapangan", `noHp` -> "nomor HP") are mapped in `validation.php` `attributes`: add new form fields there, otherwise the message shows the raw field name. Controllers should not hand-write English messages. Sheet (`ui/sheet.tsx`) refined: header has a bottom border, close is a 28px ghost icon button (`aria-label="Tutup"`), full width on phones (max-w-md from `sm:`), blurred backdrop; `SheetForm` body has `py-4`. `ui/select.tsx` sets `z-50` on the `Positioner` so Select lists show above sheets and dialogs. `FormCombobox` (`ui/combobox`) is used for the Penyewa, Lapangan, Admin and Status fields in the Booking sheet (Penyewa shows "Nama · email"; Admin is required, see below). The checkmark of the selected combobox item sits on the right (`ui/combobox.tsx` `ComboboxItem`: `ps-2 pe-8`, indicator `right-2`). Master page props must not include password hashes: select only needed columns (done for Booking; `dataadmin`/`datamanager` in Pembayaran and Laporan Pembayaran still send full rows).
- Done (2026-10-24): all Admin/Manager pages now use `AdminSidebarLayout`: the Penyewa, Lapangan, Booking, Pembayaran, Laporan Pembayaran TampilData pages and `Pengelola/Profile` moved from the top-nav `AdminLayout`, so the sidebar stays on every page and the tab links next to "Buddhi Sports" are gone.
- Done (2026-10-24): Booking sheet (admin) date and hours. `ui/date-input.tsx` (`DateInput`) is a typed date field: "8 6" or "86" -> 08/06/<this year> with the year selected so typing replaces it; "15082026" -> 15/08/2026; blur completes partial input; impossible dates get `aria-invalid`; value stays `YYYY-MM-DD`; the calendar button sits at the right edge and the calendar has a "Hari ini" footer like the Penyewa date picker. Gotcha: its text is synced from `value` during render, not in an effect, because closing the popover blurs the field and an effect-delayed sync let the blur clear the picked value. Jam Mulai / Jam Selesai are `FormSelect` dropdowns of whole hours (mulai 08:00-21:00, selesai after mulai up to 22:00); choosing mulai sets selesai to mulai+1 when selesai is empty or not after it; the selesai Select is keyed by mulai because Base UI Select loses the value when value and items change together. Server (`MasterBookingController::validasiBooking`, shared by insert/update): Admin required (`exists:admins`), hours must be in those lists, `txtjamselesai` `after:txtjammulai`; the Tambah sheet preselects the logged-in Admin (`idAdminLogin` prop). Combobox height now matches Input/Select (h-10, text-base). Pembayaran and Laporan sheets still use native `type="date"`.
- Done (2026-10-24): Booking table (admin) shows penyewa and lapangan names instead of IDs (looked up from the `datapenyewa`/`datalapangan` props) and dates as "Jum, 23 Okt 2026". Corner smoothing added (see Project section): edit `--corner-smoothing` and `--radius` in the `@supports (corner-shape: squircle)` block of `app.css`.
- Done (2026-10-25): `ui/attachment.tsx` (shadcn `base-nova` source, import path fixed); `FileUpload` uses it for the chosen-file row. `ui/tabs.tsx` is now the shadcn `base-nova` version (neutral `bg-muted`, no iOS segmented-control colours; decided by the user). Penyewa Home (Bulu Tangkis/Basket) and Booking saya (Aktif/Riwayat) use `Tabs` instead of `ToggleGroup`; `ui/toggle-group.tsx` was deleted (re-add with `npx shadcn@latest add toggle-group` if a real toggle is needed). `html { scrollbar-gutter: stable }` stops the page shifting when the scrollbar appears. Gotcha for `npx shadcn add`: `components.json` aliases are lowercase `@/components/...` while the folder is `Components`, and the CLI offers to overwrite customised files such as `button.tsx`; copying the registry source by hand is safer. The design-system artifact still shows the old Tabs and ToggleGroup.
- Done (2026-10-25): booking status is only `Dipesan` / `Dikonfirmasi` / `Dibatalkan` (`Pemesanan::STATUS`, validated with `Rule::in` in the Admin form; `STATUS_MENAHAN_JAM` = `Dikonfirmasi` only); migration `2026_10_25_000000` turns old `Dibayar` rows into `Dikonfirmasi`. `BookingStatusBadge` still knows `selesai` (unused). Admin Booking sheet fills Total Bayar from `tarifPerJam` x hours whenever lapangan or jam changes (`bookingTotal`); Admin can still edit it, and opening Edit keeps the stored total. Pembayaran table shows booking code (`BK-0012`) + renter name and dates as "Sel, 15 Jan 2030"; its sheet lists bookings as "BK-xxxx · nama · tanggal" (server joins `penyewas`/`lapangans`; `databooking` carries `kode`). Laporan Pembayaran table formats dates; its Pembayaran option reads "BK-xxxx · nama · Rp". Both sheets use `DateInput`.
- Done (2026-10-25): Manager checks reports. `laporan_pembayarans.diperiksaPada` (migration `2026_10_25_100000`), `POST /manager/laporan/{id}/diperiksa` (`manager.laporan.diperiksa`, refused without a PDF), "Tandai diperiksa" with AlertDialog in `Components/manager/TabelLaporan.tsx`, Status column (Admin and Manager tables). Decided by the user: a checked report is locked, so Admin cannot re-create it (`LaporanPembayaranController@buat`), edit or delete it (master controller; Edit/Hapus hidden, "Buat ulang laporan" hidden with a note). Shared prop `pengelola.laporanBelumDiperiksa` (reports with a PDF and no `diperiksaPada`) feeds the Manager sidebar badge on Laporan Pembayaran; `AdminSidebar` maps badges per href. Tests: 3 new in `LaporanPembayaranTest` (guard gotcha: after `actingAs($manager, 'manager')` the manager guard stays logged in for the rest of the test, so check "as Admin" first). Browser check of all master pages (add, edit, delete, FK-refused delete) passed with test rows only (scratchpad `e2e/master.mjs` + `db.php` snapshot/compare).
- Next: `dataadmin`/`datamanager` props in Pembayaran and Laporan still send full rows incl. password hashes (backlog); the unreachable `Master/Admin`, `Master/Manager` pages and `AdminLayout` could be deleted (`PenyewaLayout` imports `navLinkClass` from `AdminLayout`, move it first). Admin can still edit pembayaran in a month whose report is locked, so the locked PDF can drift from the data (not decided). Admin `isLapanganTerbooking` in `MasterBookingController` counts every status, including `Dibatalkan`, so a cancelled booking blocks the slot in the Admin form (Penyewa side uses `STATUS_MENAHAN_JAM`). Payment deadline: `batas_bayar_menit` (now 60 min, set by the user on 2026-10-24) in `config/pembayaran.php` drives auto-cancel and the countdown. After pulling: `composer install`, `npm install`, `php artisan migrate`. In production add the cron `* * * * * php artisan schedule:run`. `BLOKIR_JAM_LEWAT` in `Components/booking/jadwal.ts` is `true`; the server rejects past hours too.

# Failing tests (8 of 70, `php artisan test`)
Cause: Breeze tests still create accounts with `User::factory()` and field `name`, but guard `web` now uses `Penyewa` (`namaPenyewa`, `noHp`). Fix needs a `PenyewaFactory` and updated test fields.
- `Tests\Feature\Auth\AuthenticationTest` › users can authenticate using the login screen
- `Tests\Feature\Auth\PasswordConfirmationTest` › password can be confirmed
- `Tests\Feature\Auth\PasswordResetTest` › reset password link can be requested
- `Tests\Feature\Auth\PasswordResetTest` › reset password screen can be rendered
- `Tests\Feature\Auth\PasswordResetTest` › password can be reset with valid token
- `Tests\Feature\Auth\RegistrationTest` › new users can register
- `Tests\Feature\ProfileTest` › profile information can be updated
- `Tests\Feature\ProfileTest` › email verification status is unchanged when the email address is unchanged
