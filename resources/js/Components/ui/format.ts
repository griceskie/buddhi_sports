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

/** Jam dengan titik (EYD): "16:20:00", "16:20", 16 atau Date → "16.20". */
function formatJam(value: string | number | Date) {
  if (value instanceof Date) return `${String(value.getHours()).padStart(2, "0")}.${String(value.getMinutes()).padStart(2, "0")}`
  if (typeof value === "number") return `${String(Math.floor(value)).padStart(2, "0")}.${String(Math.round((value % 1) * 60)).padStart(2, "0")}`
  const [h, m = "00"] = value.slice(0, 5).split(":")
  return `${h.padStart(2, "0")}.${m}`
}

/** "08:00", "10:00" (atau angka jam) → "08.00–10.00". */
function rentangJam(mulai: string | number, selesai: string | number) {
  return `${formatJam(mulai)}–${formatJam(selesai)}`
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export { formatRupiah, formatTanggal, formatJam, rentangJam, toMinutes, durationHours, bookingTotal, BULAN }
