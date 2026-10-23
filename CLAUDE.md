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
- App-level helpers in `resources/js/Components/`: `FormSelect` (string-valued Select for forms, `''` = nothing chosen), `DeleteButton` (Hapus + AlertDialog confirm, used in TampilData), `FlashMessage` (`Alert`), `Wordmark`, `InputError`.
- Layouts in `resources/js/Layouts/`: `AdminLayout` (admin top nav for the master pages; `navItems={[]}` for Manager), `AdminSidebarLayout` (collapsible sidebar, used by the Admin dashboard), `PenyewaLayout` (Penyewa: logo links Home; name menu with Booking saya, Profile, red Log Out), `GuestLayout` (optional `title`/`description`). Pages put content directly inside; the layouts provide the container.
- Page patterns: TampilData = `Card` > `Table` with status badges and `TableEmpty`; Form pages = `Card` > `CardContent` > `form.space-y-4` with `Label` + control + `InputError`, full-width submit `Button`.
- `dark:` utilities follow the `.dark` class (`@custom-variant dark` in `app.css`), not the OS setting, matching the colour tokens. Do not remove it: without it outline buttons turn grey on machines in OS dark mode.
- React 18: components that need a `ref` must use `React.forwardRef` (as `ui/input` and `ui/textarea` do).

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

# Progress (2026-10-23)
Details and open items: [implementation-plan.md](implementation-plan.md).
- Done: CRUD for all 7 models (`Master*Controller` + 21 TSX pages in `resources/js/Pages/Master/`, wrapped in `AdminLayout`).
- Done: design system applied to all layouts and pages (Auth, Profile, Home, Booking, Admin/Manager dashboards, 21 Master pages).
- Done: Penyewa Home is route `dashboard`, Booking saya is route `booking` (in the name menu); Penyewa logout redirects to `/login`.
- Done: multi-role auth — guard `web` = `Penyewa` (`/login`, `/register`), guards `admin`/`manager` via `/login-pengelola` (two tabs). Admin/Manager dashboards are placeholders.
- In progress: SMTP via Mailtrap sandbox for Penyewa password reset (`.env` still `MAIL_MAILER=log`; credentials must come from the user, never invented).
- Done: Admin/Manager profile (`/profile-pengelola`, `PengelolaProfileController`, route group `auth:admin,manager`): edit nama/username + change password. `AdminLayout` shows a name dropdown (Profile, Log Out) from the shared `pengelola` prop; nav items default by role.
- Done: unique validation for `admins.username`, `managers.username`, `penyewas.email` in master controllers (validation only, no DB constraint).
- Done (2026-10-20): Penyewa Home (`/dashboard`, `Pages/Dashboard.tsx`) built from the HTML draft: 30-day date strip + two-month calendar popover, court cards with hour chips, booking summary + mobile bar. Parts in `Components/booking/` (`jadwal.ts` pure logic, `DateStrip` (calendar button is `ui/date-picker`, extended with optional `label`/`align`/`calendarProps`/`footer`), `CourtSlotCard` = `ui/court-card` (big price column via its `aside` prop, which hides the small rate line) + `ui/slot-picker` (free slots `bg-canvas` grey on the white card, booked = dashed and empty) (given an optional `isPast` prop for hours already started), `RingkasanBooking`). Reuse `ui/` components before hand-building; check `ui/` first. Route passes real `lapangan` from DB; page also accepts optional `terisi` (booked hours) which nothing sends yet. "Booking sekarang" does not save yet (shows a note). The booking backend PR (`origin/backend/booking-penyewa`) was rejected for now; its seeder names (`Lapangan Bulu Tangkis 1`...) differ from the real DB names, so running it would duplicate the 4 courts.
- Done (2026-10-21): `ui/sidebar.tsx` (shadcn Sidebar API on Base UI; also `ui/separator`, `ui/skeleton`, `hooks/use-mobile.ts`, `--color-sidebar-*` in `app.css`, `side` prop on `DropdownMenuContent`). `Components/AdminSidebar.tsx` (collapses to icons with tooltips, Ctrl/Cmd+B, state kept in the `sidebar_state` cookie, sheet on phones) is used on `Pages/Dashboard/Admin.tsx` as a trial; all other admin pages and the Manager dashboard still use the `AdminLayout` top bar. React 18 gotcha: any component passed as a Base UI `render` target (e.g. `SidebarMenuButton` inside `DropdownMenuTrigger`) must be `forwardRef`, otherwise the popup never anchors and stays invisible at the top-left.
- Done (2026-10-23): Penyewa booking flow with backend (`BookingPenyewaController`, rules in `app/Support/Pemesanan.php`). Home saves via `POST /booking` (whole hours 08:00–22:00, up to 30 days, no past hours, row lock + overlap check) and redirects to `Pages/Booking/Bayar.tsx` (`/booking/{id}/bayar`: transfer details from `config/pembayaran.php` / `.env` `BANK_*`, then proof upload). `Pages/Booking.tsx` (`/booking`): `Empty` when no bookings, otherwise list with Aktif/Riwayat tabs and an upload dialog. Upload (`POST /booking/{id}/bukti`, jpg/png/pdf max 2 MB, `public` disk under `bukti/`) creates a `pembayarans` row `Menunggu Verifikasi`. Decisions: only `Dikonfirmasi`/`Dibayar` hold a slot (pending bookings do not block others); a `Dipesan` booking without proof is set to `Dibatalkan` 120 min after `bookings.created_at` (new nullable column; admin-entered rows stay null and never expire) by `booking:batalkan-kedaluwarsa` (scheduled every minute) and also at the start of each Penyewa booking page. App timezone is `Asia/Jakarta`. `public/storage` link is required (`php artisan storage:link`). `BANK_*` in `.env` are placeholders: replace with the real account. Tests: `tests/Feature/BookingPenyewaTest.php` (11); PHP here has no GD, so use `UploadedFile::fake()->create(name, kb, 'image/jpeg')`, not `->image()`.
- Done (2026-10-23): Admin dashboard (`AdminDashboardController`, `Pages/Dashboard/Admin.tsx` in `Layouts/AdminSidebarLayout.tsx`): stats, today's per-court timeline (`Components/admin/JadwalHariIni.tsx`), verification queue with `ui/proof-review`, latest bookings. `POST /verifikasi/{idPembayaran}/terima` (payment `Terverifikasi`, booking `Dikonfirmasi`, refused if it overlaps a confirmed booking) and `/tolak` (payment `Ditolak`, booking stays `Dipesan`; the renter can re-upload, which replaces the file on the same `pembayarans` row). A booking with any payment row never auto-expires. Shared prop `pengelola.menungguVerifikasi` feeds the sidebar badge. Sidebar uses shadcn neutral `--sidebar-*` values (no iOS blue) and has a collapse button in its footer (desktop) plus a header trigger on phones. Admin Booking form now offers `Dikonfirmasi`. Other admin pages still use the `AdminLayout` top bar. Tests: `tests/Feature/AdminDashboardTest.php` (6).
- Done (2026-10-23): Admin cannot manage Admin or Manager accounts (routes removed from `auth:admin`, menus removed; `MasterAdminController`/`MasterManagerController` and their pages are now unreachable). Admin sidebar groups: Dashboard / Penyewaan (Penyewa, Lapangan, Booking, Pembayaran) / Laporan (Laporan Pembayaran); collapse is an icon (`SidebarTrigger`) beside the logo. Dashboard timeline uses the reusable `ui/booking-timeline.tsx` (hour columns as CSS grid so lines are even; overlapping bookings stack in lanes) and shows only confirmed and awaiting-verification bookings. Payment report: `/tampilpembayaran?periode=YYYY-MM` shows a month summary and a "Buat laporan" dialog (date, Manager, `ui/signature-pad` JPEG signature) that posts to `LaporanPembayaranController@buat`; barryvdh/laravel-dompdf renders `resources/views/pdf/laporan-pembayaran.blade.php` to the private `local` disk (`laporan/laporan-pembayaran-YYYY-MM.pdf`, font subsetting on) and upserts one `laporan_pembayarans` row per month with `namaLaporan`/`filePdf` (new columns). PDF opens via `/laporanpembayaran/{id}/pdf` for Admin and Manager only. Signature must be JPEG: PHP here has no GD, which dompdf needs for PNG. Tests: `tests/Feature/LaporanPembayaranTest.php` (8), fixture `tests/Fixtures/tanda-tangan.txt`.
- Done (2026-10-23): Lapangan status is now only `Tersedia` / `Perbaikan` (label "Dalam perbaikan"); validated with `in:`, migration `2026_10_23_200000_ubah_status_lapangan_ke_tersedia` converted `Kosong`/`Terbooking` to `Tersedia`. Pembayaran page widgets: Total pemasukan + one Status pembayaran widget (Terverifikasi / Menunggu / Ditolak with counts, amounts and a stacked bar); `ringkasan` is `{terverifikasi, menunggu, ditolak}` each `{jumlah, total}`. Admin dashboard card is "Jadwal" with prev/next day, a date picker and a "Hari ini" reset: `/dashboard-admin?tanggal=YYYY-MM-DD` changes only `jadwal`/`tanggalJadwal` (invalid dates fall back to today); stats stay on today.
- Done (2026-10-23): Admin master-data Tambah/Edit (Penyewa, Lapangan, Booking, Pembayaran, Laporan Pembayaran) open in a side sheet on the TampilData page instead of separate pages: `Components/FormSheet.tsx` (`useFormSheet` state, `FormSheet` wrapper, `SheetForm` header/fields/Batal-Simpan footer); each page has its own `Form{Model}` component keyed by `sheet.versi`. The `FormTambah`/`FormEdit` pages, their `tampilFormTambah`/`tampilFormEdit` methods and `/form*`, `/edit*` routes were removed; `tampilData` now also sends the select options. Conflict errors (booking overlap, duplicate pembayaran) return as field errors via `back()->withErrors`; pembayaran saves go `back()` to keep `?periode`. Edit Pembayaran shows the proof with `ProofPreview` (exported from `ui/proof-review`). Dashboard "Tambah booking" links to `/tampilbooking?tambah`, which opens the sheet. Status pembayaran widget shows counts only. Tests: `tests/Feature/MasterDataSheetTest.php` (4).
- Next (2026-10-24): 4) Manager dashboard, scope agreed in [PRD.md](PRD.md) section 4 "Dashboard Manajer Lapangan" (read-only: report list with PDF, latest-report card, income cards, 12-month chart), steps in `implementation-plan.md` section 2. Undecided: who manages Admin/Manager accounts (proposal: Manager); optionally move the admin master pages to `AdminSidebarLayout`. In production add the cron `* * * * * php artisan schedule:run`. `BLOKIR_JAM_LEWAT` in `Components/booking/jadwal.ts` is `true`; the server rejects past hours too.
- Open: booking end time not validated after start time.
- Open (deferred by user): booking status values `Dipesan`/`Dibayar`/`Dibatalkan` don't match the design system's `BookingStatusBadge` (`dipesan`/`dikonfirmasi`/`selesai`/`dibatalkan`); `Dibayar` renders as a neutral outline badge.

# Failing tests (8 of 54, `php artisan test`)
Cause: Breeze tests still create accounts with `User::factory()` and field `name`, but guard `web` now uses `Penyewa` (`namaPenyewa`, `noHp`). Fix needs a `PenyewaFactory` and updated test fields.
- `Tests\Feature\Auth\AuthenticationTest` › users can authenticate using the login screen
- `Tests\Feature\Auth\PasswordConfirmationTest` › password can be confirmed
- `Tests\Feature\Auth\PasswordResetTest` › reset password link can be requested
- `Tests\Feature\Auth\PasswordResetTest` › reset password screen can be rendered
- `Tests\Feature\Auth\PasswordResetTest` › password can be reset with valid token
- `Tests\Feature\Auth\RegistrationTest` › new users can register
- `Tests\Feature\ProfileTest` › profile information can be updated
- `Tests\Feature\ProfileTest` › email verification status is unchanged when the email address is unchanged
