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
- Colours: iOS palette (Light/Dark) in `resources/css/app.css`, exposed as Tailwind colours (`bg-backgrounds-grouped-primary`, `text-labels-secondary`, ...) and aliased to shadcn tokens (`bg-background`, `text-muted-foreground`, `border`, `text-destructive`, `bg-success`). Use tokens in new code, not raw `gray-*`/`indigo-*`.
- Components: shadcn-style on Base UI in `resources/js/Components/ui/` (button, input, select, card, table, badge, alert, dialog, alert-dialog, dropdown-menu, tabs, currency-input, ...) plus `format.ts` (`formatRupiah`, `BULAN`, ...). The Breeze components (`TextInput`, `PrimaryButton`, `Dropdown`, `Modal`, ...) were removed; don't reintroduce them.
- App-level helpers in `resources/js/Components/`: `FormSelect` (string-valued Select for forms, `''` = nothing chosen), `DeleteButton` (Hapus + AlertDialog confirm, used in TampilData), `FlashMessage` (`Alert`), `Wordmark`, `InputError`.
- Layouts in `resources/js/Layouts/`: `AdminLayout` (admin nav; `navItems={[]}` for Manager), `PenyewaLayout` (Penyewa: Home + Booking tabs, name menu with red Log Out), `GuestLayout` (optional `title`/`description`). Pages put content directly inside; the layouts provide the container.
- Page patterns: TampilData = `Card` > `Table` with status badges and `TableEmpty`; Form pages = `Card` > `CardContent` > `form.space-y-4` with `Label` + control + `InputError`, full-width submit `Button`.
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
- Master-data controllers follow the `Master{Model}Controller` naming and method pattern already used (`tampilData`, `tampilFormTambah`, `tampilFormEdit`, `insertData`, `updateData`, `deleteData{Model}`).

# Progress (2026-10-19)
Details and open items: [implementation-plan.md](implementation-plan.md).
- Done: CRUD for all 7 models (`Master*Controller` + 21 TSX pages in `resources/js/Pages/Master/`, wrapped in `AdminLayout`).
- Done: design system applied to all layouts and pages (Auth, Profile, Home, Booking, Admin/Manager dashboards, 21 Master pages).
- Done: Penyewa nav is Home (route `dashboard`) + Booking (route `booking`, empty placeholder page); Penyewa logout redirects to `/login`.
- Done: multi-role auth — guard `web` = `Penyewa` (`/login`, `/register`), guards `admin`/`manager` via `/login-pengelola` (two tabs). Admin/Manager dashboards are placeholders.
- In progress: SMTP via Mailtrap sandbox for Penyewa password reset (`.env` still `MAIL_MAILER=log`; credentials must come from the user, never invented).
- Done: Admin/Manager profile (`/profile-pengelola`, `PengelolaProfileController`, route group `auth:admin,manager`): edit nama/username + change password. `AdminLayout` shows a name dropdown (Profile, Log Out) from the shared `pengelola` prop; nav items default by role.
- Done: unique validation for `admins.username`, `managers.username`, `penyewas.email` in master controllers (validation only, no DB constraint).
- Done (2026-10-20): Penyewa booking backend for the Home draft. `BookingPenyewaController` (`/dashboard` props: `lapangan`, `terisi` for 30 days, `belumDibayar`, `aturan`; `POST /booking` → `booking.store`). Rules live in `App\Support\JadwalBooking`: open 08:00–22:00, whole hours, up to 30 days ahead, no max duration, total computed server-side, row lock on the lapangan. Only `Dipesan`/`Dibayar`/`Dikonfirmasi` hold a slot; a `Dipesan` booking without a pembayaran row is released after 2 hours and `booking:batalkan-kedaluwarsa` (scheduled every minute; `schedule:work` added to `composer dev`) sets it to `Dibatalkan`. `bookings.created_at` added (null for admin-entered bookings, which never expire). App timezone is `Asia/Jakarta`. `LapanganSeeder` seeds the 4 courts. Admin booking form uses the same overlap check and ignores `txttotal`.
- Open: Home page UI (`Dashboard.tsx`) still shows the placeholder; it now receives the props above.
- Open: Lapangan `status` (`Kosong`/`Terbooking`) is kept as stored by decision and does not block booking.
- Open (deferred by user): booking status values `Dipesan`/`Dibayar`/`Dibatalkan` don't match the design system's `BookingStatusBadge` (`dipesan`/`dikonfirmasi`/`selesai`/`dibatalkan`); `Dibayar` renders as a neutral outline badge. Lapangan `Kosong`/`Terbooking` are mapped by `CourtStatusBadge`.

# Failing tests (8 of 25, `php artisan test`)
Cause: Breeze tests still create accounts with `User::factory()` and field `name`, but guard `web` now uses `Penyewa` (`namaPenyewa`, `noHp`). Fix needs a `PenyewaFactory` and updated test fields.
- `Tests\Feature\Auth\AuthenticationTest` › users can authenticate using the login screen
- `Tests\Feature\Auth\PasswordConfirmationTest` › password can be confirmed
- `Tests\Feature\Auth\PasswordResetTest` › reset password link can be requested
- `Tests\Feature\Auth\PasswordResetTest` › reset password screen can be rendered
- `Tests\Feature\Auth\PasswordResetTest` › password can be reset with valid token
- `Tests\Feature\Auth\RegistrationTest` › new users can register
- `Tests\Feature\ProfileTest` › profile information can be updated
- `Tests\Feature\ProfileTest` › email verification status is unchanged when the email address is unchanged
