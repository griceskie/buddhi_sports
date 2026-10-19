import { format } from "date-fns"
import { id } from "date-fns/locale"

/** Rupiah the way the repo writes it: `Rp${n.toLocaleString('id-ID')}` → "Rp50.000". */
function formatRupiah(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "Rp0"
  return `Rp${Math.round(value).toLocaleString("id-ID")}`
}

/** "2026-10-24" or a Date → "Sabtu, 24 Oktober 2026". */
function formatTanggal(value: Date | string, pattern = "EEEE, d MMMM yyyy") {
  const d = typeof value === "string" ? new Date(value + (value.length === 10 ? "T00:00:00" : "")) : value
  return format(d, pattern, { locale: id })
}

/** "08:00" → 480 */
function toMinutes(time: string) {
  const [h, m] = time.slice(0, 5).split(":").map(Number)
  return h * 60 + (m || 0)
}

/** Hours between two "HH:MM" times (jamMulai, jamSelesai); 0 when end ≤ start. */
function durationHours(start: string, end: string) {
  return Math.max(0, (toMinutes(end) - toMinutes(start)) / 60)
}

/** totalBayar = tarifPerJam × duration, as the PRD asks the system to compute. */
function bookingTotal(start: string, end: string, tarifPerJam: number) {
  return Math.round(durationHours(start, end) * tarifPerJam)
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export { formatRupiah, formatTanggal, toMinutes, durationHours, bookingTotal, BULAN }
