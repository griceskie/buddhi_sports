<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>{{ $nama }}</title>
<style>
    @page { margin: 32px 36px; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 2px; }
    .muted { color: #6c6c70; }
    .meta { width: 100%; margin: 14px 0 16px; border-collapse: collapse; }
    .meta td { padding: 2px 0; vertical-align: top; }
    .meta td.label { width: 120px; color: #6c6c70; }
    table.data { width: 100%; border-collapse: collapse; }
    table.data th { text-align: left; font-weight: bold; background: #f5f5f5; border-bottom: 1px solid #c6c6c8; padding: 6px 5px; }
    table.data td { border-bottom: 1px solid #e5e5ea; padding: 5px; }
    /* lebih spesifik dari "table.data th" agar judul Jumlah ikut rata kanan, sejajar dengan angkanya */
    table.data .nw { white-space: nowrap; }
    table.data .r { text-align: right; white-space: nowrap; width: 90px; }
    .total td { font-weight: bold; border-top: 1px solid #111; border-bottom: none; }
    .kosong { padding: 16px 5px; text-align: center; color: #6c6c70; }
    .ttd { margin-top: 32px; width: 220px; float: right; text-align: center; }
    .ttd img { width: 200px; height: auto; border-bottom: 1px solid #111; }
</style>
</head>
<body>
    <h1>{{ $nama }}</h1>
    <div class="muted">Buddhi Sports · Universitas Buddhi Dharma</div>

    <table class="meta">
        <tr><td class="label">Periode</td><td>{{ $periode }}</td></tr>
        <tr><td class="label">Tanggal laporan</td><td>{{ $tanggalLaporan }}</td></tr>
        <tr><td class="label">Disusun oleh</td><td>{{ $admin }} (Admin)</td></tr>
        <tr><td class="label">Ditujukan kepada</td><td>{{ $manager }} (Manager)</td></tr>
    </table>

    <table class="data">
        <thead>
            <tr>
                <th>No</th>
                <th class="nw">Kode</th>
                <th>Penyewa</th>
                <th>Lapangan</th>
                <th>Jadwal main</th>
                <th>Tgl bayar</th>
                <th class="r">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($pembayaran as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td class="nw">{{ $p['kode'] }}</td>
                    <td>{{ $p['penyewa'] }}</td>
                    <td>{{ $p['lapangan'] }}</td>
                    <td>{{ $p['jadwal'] }}</td>
                    <td>{{ $p['tglBayar'] }}</td>
                    <td class="r">{{ $p['jumlah'] }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="kosong">Tidak ada pembayaran terverifikasi pada periode ini.</td></tr>
            @endforelse
            <tr class="total">
                <td colspan="6">Total pemasukan ({{ count($pembayaran) }} pembayaran terverifikasi)</td>
                <td class="r">{{ $total }}</td>
            </tr>
        </tbody>
    </table>

    <div class="ttd">
        <div class="muted">{{ $tanggalLaporan }}</div>
        <img src="{{ $tandaTangan }}" alt="Tanda tangan">
        <div>{{ $admin }}</div>
        <div class="muted">Admin Buddhi Sports</div>
    </div>
</body>
</html>
