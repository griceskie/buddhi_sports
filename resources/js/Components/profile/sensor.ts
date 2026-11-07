/** Data akun disamarkan di bagian tengahnya, bagian yang unik (keputusan user 2026-11-06). */

/** "081234567890" -> "0812 **** 7890". Nomor pendek (< 8 digit) tampil apa adanya. */
export function sensorHp(noHp: string) {
    const d = noHp.replace(/\D/g, '');
    return d.length >= 8 ? `${d.slice(0, 4)} **** ${d.slice(-4)}` : d;
}

/** "rener@example.com" -> "r***r@example.com": huruf pertama dan terakhir bagian lokal, minimal 3 bintang. */
export function sensorEmail(email: string) {
    const at = email.indexOf('@');
    if (at <= 2) return email;
    const lokal = email.slice(0, at);
    return lokal[0] + '*'.repeat(Math.max(3, lokal.length - 2)) + lokal[lokal.length - 1] + email.slice(at);
}
