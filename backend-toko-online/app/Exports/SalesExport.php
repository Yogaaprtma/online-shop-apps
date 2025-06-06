<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Illuminate\Support\Collection;
use Illuminate\Support\Str; // Impor Str

class SalesExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $orders;

    public function __construct(Collection $orders)
    {
        $this->orders = $orders;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        return $this->orders;
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID Pesanan',
            'Nama Pelanggan',
            'Email Pelanggan',
            'Tanggal Pesanan',
            'Tanggal Pembayaran',
            'Metode Pembayaran',
            'Status',
            'Produk Dipesan (Qty)',
            'Total Harga Produk',
            'Total Keseluruhan Pesanan',
        ];
    }

    /**
     * @param mixed $order
     * @return array
     */
    public function map($order): array
    {
        $itemsString = '';
        $itemsTotal = 0;
        foreach ($order->items as $item) {
            $productName = $item->product ? $item->product->name_product : 'Produk Dihapus';
            $itemsString .= $productName . ' (' . $item->quantity . 'x); ';
            $itemsTotal += $item->price * $item->quantity; // Ganti total dengan quantity
        }
        $itemsString = rtrim($itemsString, '; ');

        return [
            $order->id,
            $order->user ? $order->user->nama : 'N/A',
            $order->user ? $order->user->email : 'N/A',
            \Carbon\Carbon::parse($order->created_at)->translatedFormat('d M Y H:i'),
            $order->payment_date ? \Carbon\Carbon::parse($order->payment_date)->translatedFormat('d M Y H:i') : 'N/A',
            str_replace('_', ' ', Str::title($order->payment_method)),
            str_replace('_', ' ', Str::title($order->status)),
            $itemsString,
            $itemsTotal,
            $order->total,
        ];
    }
}