<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $reportTitle }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; margin: 0; padding: 0; font-size: 9px; color: #333; }
        @page { margin: 80px 30px 50px 30px; } /* top, right, bottom, left */
        header { position: fixed; top: -50px; left: 0px; right: 0px; height: 40px; text-align: left; line-height: 20px; border-bottom: 1px solid #dee2e6; }
        header .store-name { font-size: 14px; font-weight: bold; color: #2c3e50; }
        header .report-title-header { font-size: 11px; color: #555; }
        footer { position: fixed; bottom: -30px; left: 0px; right: 0px; height: 25px; text-align: center; font-size: 8px; color: #777; border-top: 1px solid #eee;}
        footer .page-number:after { content: counter(page) " dari " counter(pages); }
        
        h1.main-title { text-align: center; margin-bottom: 5px; font-size: 15px; text-transform: uppercase; color: #2c3e50;}
        .report-meta-info { text-align: center; font-size: 10px; margin-bottom: 20px; color: #555; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #e0e0e0; padding: 7px; text-align: left; vertical-align: top; }
        thead th { background-color: #f2f7fc; font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #334155; }
        tbody tr:nth-child(even) { background-color: #f9f9f9; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .nowrap { white-space: nowrap; }
        
        .items-list { padding-left: 0; list-style: none; margin: 0; }
        .items-list li { font-size: 8.5px; }

        .grand-total-row td { font-weight: bold; background-color: #e8f0f7; font-size: 10px;}
        .no-data { text-align: center; padding: 20px; font-style: italic; color: #777; }
    </style>
</head>
<body>
    <header>
        <div class="store-name">Toko Online Anda</div>
        <div class="report-title-header">{{ $reportTitle }}</div>
    </header>
    <footer>
        Laporan ini dicetak pada: {{ $reportDate }} - Halaman <span class="page-number"></span>
    </footer>
    <main>
        <h1 class="main-title">{{ $reportTitle }}</h1>
        <div class="report-meta-info">{{ $reportSubtitle }}</div>

        <table>
            <thead>
                <tr>
                    <th style="width:5%;">ID</th>
                    <th style="width:20%;">Pelanggan</th>
                    <th style="width:15%;" class="text-center">Tgl. Bayar</th>
                    <th style="width:15%;">Metode Bayar</th>
                    <th style="width:30%;">Item Dipesan</th>
                    <th style="width:15%;" class="text-right">Total Pesanan</th>
                </tr>
            </thead>
            <tbody>
                @php 
                    $grandTotal = 0;
                    $totalItemsSold = 0;
                @endphp
                @forelse ($orders as $order)
                    <tr>
                        <td class="text-center">#{{ $order->id }}</td>
                        <td>
                            {{ $order->user ? $order->user->nama : 'N/A' }}<br>
                            <small style="color:#666;">{{ $order->user ? $order->user->email : '' }}</small>
                        </td>
                        <td class="text-center nowrap">{{ $order->payment_date ? \Carbon\Carbon::parse($order->payment_date)->translatedFormat('d M y, H:i') : 'N/A' }}</td>
                        <td>{{ $order->payment_method ? str_replace('_', ' ', Str::title($order->payment_method)) : 'N/A' }}</td>
                        <td>
                            <ul class="items-list">
                            @if($order->items && count($order->items) > 0)
                                @foreach($order->items as $item)
                                    <li>{{ $item->product ? $item->product->name_product : 'Produk Dihapus' }} ({{ $item->quantity }}x) - @ Rp {{ number_format($item->price, 0, ',', '.') }}</li>
                                    @php $totalItemsSold += $item->quantity; @endphp
                                @endforeach
                            @else
                                <li>Tidak ada item.</li>
                            @endif
                            </ul>
                        </td>
                        <td class="text-right nowrap">Rp {{ number_format($order->total, 0, ',', '.') }}</td>
                    </tr>
                    @php $grandTotal += $order->total; @endphp
                @empty
                    <tr>
                        <td colspan="6" class="no-data">Tidak ada data penjualan pada periode ini.</td>
                    </tr>
                @endforelse
                
                @if(count($orders) > 0)
                <tr class="grand-total-row">
                    <td colspan="4" class="text-right"><strong>TOTAL KESELURUHAN</strong></td>
                    <td class="text-center"><strong>{{ $totalItemsSold }} unit</strong></td>
                    <td class="text-right"><strong>Rp {{ number_format($grandTotal, 0, ',', '.') }}</strong></td>
                </tr>
                @endif
            </tbody>
        </table>
        <div style="text-align: right; font-size: 9px; margin-top: 5px;">
            Total Pesanan Lunas: {{ count($orders) }}
        </div>
    </main>
</body>
</html>