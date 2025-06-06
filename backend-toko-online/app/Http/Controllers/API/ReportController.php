<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesExport;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    public function downloadSalesReport(Request $request, $format)
    {
        $request->validate([
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : now()->subMonth()->startOfDay();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : now()->endOfDay();

        $paidOrders = Order::where('status', 'paid')
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->with('user', 'items.product')
            ->orderBy('payment_date', 'desc')
            ->get();

        if ($paidOrders->isEmpty()) {
            return response()->json(['message' => 'Tidak ada data penjualan untuk periode yang dipilih.'], 404);
        }

        $reportSubtitle = 'Periode Laporan: ' . $startDate->translatedFormat('d M Y') . ' - ' . $endDate->translatedFormat('d M Y');

        $data = [
            'orders' => $paidOrders,
            'reportTitle' => 'Laporan Penjualan',
            'reportSubtitle' => $reportSubtitle,
            'reportDate' => now()->translatedFormat('d F Y H:i'),
        ];

        $filenameBase = 'laporan-penjualan-' . $startDate->format('Ymd') . '-' . $endDate->format('Ymd');

        if (strtolower($format) === 'pdf') {
            try {
                $pdf = Pdf::loadView('reports.sales_pdf', $data);
                return $pdf->download($filenameBase . '.pdf');
            } catch (\Exception $e) {
                return response()->json(['message' => 'Gagal membuat laporan PDF: ' . $e->getMessage()], 500);
            }
        } elseif (in_array(strtolower($format), ['xlsx', 'excel'])) {
            try {
                return Excel::download(new SalesExport($paidOrders), $filenameBase . '.xlsx');
            } catch (\Exception $e) {
                return response()->json(['message' => 'Gagal membuat laporan Excel: ' . $e->getMessage()], 500);
            }
        } else {
            return response()->json(['message' => 'Format tidak didukung: ' . $format], 400);
        }
    }
}