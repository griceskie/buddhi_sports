/**
 * Kelas untuk `DialogContent` yang di HP menjadi bottom sheet (naik dari bawah, sudut atas membulat)
 * dan di layar lebih besar tetap dialog di tengah. Dipakai pop-up pembayaran, Ubah jadwal, dan Lihat bukti.
 */
export const kelasPopup = [
    'max-h-[calc(100vh-4rem)] gap-0 overflow-y-auto overscroll-contain rounded-[20px] p-0 shadow-xl',
    'transition-[opacity,scale,translate] duration-300',
    'max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[92vh] max-sm:max-w-none',
    'max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-b-0',
    'max-sm:data-[ending-style]:translate-y-full max-sm:data-[starting-style]:translate-y-full',
    'max-sm:data-[ending-style]:scale-100 max-sm:data-[starting-style]:scale-100',
    'max-sm:data-[ending-style]:opacity-100 max-sm:data-[starting-style]:opacity-100',
    'motion-reduce:transition-none',
].join(' ');
