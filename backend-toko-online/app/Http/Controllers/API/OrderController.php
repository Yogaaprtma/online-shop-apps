<?php

namespace App\Http\Controllers\API;

use Midtrans\Snap;
use App\Models\Cart;
use Midtrans\Config;
use App\Models\Order;
use App\Models\Product;
use App\Models\OrderItem;
use Midtrans\Transaction;
use Midtrans\Notification;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with('user', 'items.product')->orderBy('id', 'asc')->get();

        return response()->json([
            'message' => 'Daftar Semua Pesanan Berhasil Diambil',
            'data' => $orders
        ], 200);
    }

    public function show($id)
    {
        $order = Order::with('user', 'items.product')->findOrFail($id);

        return response()->json([
            'message' => 'Detail Pesanan Berhasil Diambil',
            'data' => $order
        ], 200);
    }

    public function checkout(Request $request)
    {
        $user = $request->user();

        // ambil keranjang
        $cartItems = Cart::where('user_id', $user->id)->with('product')->get();
        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Keranjang kosong'], 400);
        }

        // validasi stok + hitung total
        $total = 0;
        foreach ($cartItems as $item) {
            if (!$item->product || $item->product->stock < $item->quantity) {
                return response()->json([
                    'message' => 'Stok tidak mencukupi untuk produk: ' . ($item->product->name_product ?? 'Produk tidak ditemukan')
                ], 400);
            }
            $total += $item->quantity * $item->product->price;
        }

        // buat Order
        $order = Order::create([
            'user_id' => $user->id,
            'order_code' => 'ORD-' . Str::upper(Str::random(10)),
            'total' => $total,
            'status' => 'pending',
        ]);

        foreach ($cartItems as $ci) {
            $order->items()->create([
                'product_id' => $ci->product_id,
                'quantity' => $ci->quantity,
                'price' => $ci->product->price,
            ]);
        }

        // Konfigurasi Midtrans
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized = (bool) config('midtrans.is_sanitized');
        Config::$is3ds = (bool) config('midtrans.is_3ds');

        // Build payload Snap
        $payload = [
            'transaction_details' => [
                'order_id' => $order->order_code, 
                'gross_amount' => (int) round($total),
            ],
            'customer_details' => [
                'first_name' => $user->nama, 
                'email' => $user->email,
                'phone' => $user->no_telp,
            ],
            'item_details' => $order->items->map(function ($it) {
                return [
                    'id' => (string) $it->product_id,
                    'price' => (int) round($it->price),
                    'quantity' => (int) $it->quantity,
                    'name' => (string) (optional($it->product)->name_product ?? 'Produk'),
                ];
            })->toArray(),
        ];

        try {
            $snapToken = Snap::getSnapToken($payload);
            $order->update(['snap_token' => $snapToken]);

            // Kosongkan keranjang setelah sukses create transaksi
            Cart::where('user_id', $user->id)->delete();

            return response()->json([
                'message' => 'Checkout berhasil',
                'order_id' => $order->id,
                'order_code' => $order->order_code,
                'snap_token' => $snapToken,
            ], 200);
        } catch (\Exception $e) {
            // rollback order jika gagal minta snap
            $order->items()->delete();
            $order->delete();
            Log::error('Midtrans Snap Error: '.$e->getMessage());
            return response()->json(['message' => 'Gagal membuat transaksi: ' . $e->getMessage()], 500);
        }
    }

    public function userOrders(Request $request)
    {
        $orders = $request->user()->orders()->with('items.product')->get();

        return response()->json([
            'message' => 'Daftar Pesanan Berhasil Diambil',
            'data' => $orders
        ]);
    }

    public function userOrderDetail(Request $request, $id)
    {
        $order = Order::with('items.product')->findOrFail($id);

        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'message' => 'Detail Pesanan Berhasil Diambil',
            'data' => $order
        ]);
    }

    public function pay(Request $request, $id)
    {
        $order = Order::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();

        if ($order->payment_proof) {
            return response()->json(['message' => 'Bukti Pembayaran Sudah Diunggah.'], 400);
        }

        $request->validate([
            'payment_proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048'
        ]);

        $path = $request->file('payment_proof')->store('payment_proofs', 'public');

        $order->update([
            'payment_proof' => $path,
            'status' => 'waiting_confirmation',
            'payment_date' => now()
        ]);

        return response()->json([
            'message' => 'Bukti Pembayaran Berhasil Diunggah',
            'order' => $order
        ]);
    }

    public function confirmPayment($id)
    {
        $order = Order::findOrFail($id);

        if ($order->payment_method !== 'cod' && !$order->payment_proof && !$order->midtrans_transaction_id) {
            return response()->json([
                'message' => 'Belum Ada Bukti Pembayaran atau Transaksi Midtrans'
            ], 400);
        }

        $order->update([
            'status' => 'paid',
            'payment_date' => now()
        ]);

        return response()->json([
            'message' => 'Pembayaran Telah Dikonfirmasi',
            'order' => $order
        ], 200);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:processing,shipped,completed,cancelled'
        ]);

        $order = Order::findOrFail($id);    

        if ($order->status !== 'paid' && $order->status !== 'processing' && $order->status !== 'shipped') {
            return response()->json([
                'message' => 'Pesanan harus dalam status paid, processing, atau shipped untuk diubah.'
            ], 400);
        }   

        if ($request->status === 'cancelled' && $order->status === 'completed') {
            return response()->json([
                'message' => 'Pesanan yang sudah selesai tidak dapat dibatalkan.'
            ], 400);
        }

        $order->update([
            'status' => $request->status
        ]);

        // Jika pesanan dibatalkan, kembalikan stok produk
        if ($request->status === 'cancelled') {
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('stock', $item->quantity);
                }
            }
        }

        return response()->json([
            'message' => 'Status Pesanan Berhasil Diupdate',
            'order' => $order
        ], 200);
    }

    public function handleMidtransNotification(Request $request)
    {
        try {
            // Pastikan config di-set
            Config::$serverKey    = config('midtrans.server_key');
            Config::$isProduction = (bool) config('midtrans.is_production');
            Config::$isSanitized  = (bool) config('midtrans.is_sanitized');
            Config::$is3ds        = (bool) config('midtrans.is_3ds');

            $notification = new Notification();

            $orderCode = $notification->order_id;
            $order = Order::where('order_code', $orderCode)->with('items')->firstOrFail();

            $transactionStatus = $notification->transaction_status; // capture/settlement/pending/deny/expire/cancel
            $fraudStatus       = $notification->fraud_status;
            $paymentType       = $notification->payment_type;       // bank_transfer, gopay, credit_card, dll.
            $mappedMethod      = $paymentType === 'bank_transfer' ? 'bank_transfer' : 'e_wallet';

            // Helper lambda untuk decrement stok sekali saja
            $decrementStockIfNotPaid = function () use ($order) {
                // Hindari double-decrement jika notifikasi datang lagi
                if ($order->status !== 'paid') {
                    foreach ($order->items as $item) {
                        if ($product = Product::find($item->product_id)) {
                            // Kurangi stok ketika order benar-benar dibayar
                            $product->decrement('stock', $item->quantity);
                        }
                    }
                }
            };

            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $decrementStockIfNotPaid();
                    $order->update([
                        'status'                   => 'paid',
                        'payment_date'             => now(),
                        'midtrans_transaction_id'  => $notification->transaction_id,
                        'payment_type'             => $paymentType,
                        'payment_method'           => $mappedMethod,
                    ]);
                }
            } elseif ($transactionStatus === 'settlement') {
                $decrementStockIfNotPaid();
                $order->update([
                    'status'                   => 'paid',
                    'payment_date'             => now(),
                    'midtrans_transaction_id'  => $notification->transaction_id,
                    'payment_type'             => $paymentType,
                    'payment_method'           => $mappedMethod,
                ]);
            } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                $order->update([
                    'status'                   => 'failed',
                    'midtrans_transaction_id'  => $notification->transaction_id,
                    'payment_type'             => $paymentType,
                    'payment_method'           => $mappedMethod,
                ]);
            } elseif ($transactionStatus === 'pending') {
                $order->update([
                    'status'                   => 'pending',
                    'midtrans_transaction_id'  => $notification->transaction_id,
                    'payment_type'             => $paymentType,
                    'payment_method'           => $mappedMethod,
                ]);
            }

            return response()->json(['message' => 'Notifikasi Midtrans diterima'], 200);
        } catch (\Exception $e) {
            Log::error('Midtrans Notification Error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal memproses notifikasi'], 500);
        }
    }

    private function mapPaymentMethodFromPaymentType(?string $paymentType): ?string
    {
        if (!$paymentType) return null;

        switch ($paymentType) {
            // bank transfers & virtual account
            case 'bank_transfer':
            case 'echannel':
            case 'permata':
            case 'bca_va':
            case 'bni_va':
            case 'bri_va':
                return 'bank_transfer';

            // e-wallets & qris (kelompok non-bank transfer)
            case 'gopay':
            case 'shopeepay':
            case 'qris':
            case 'credit_card':
            default:
                return 'e_wallet';
        }
    }

    public function verify(Request $request)
    {
        $request->validate([
            'order_code' => 'required|string|exists:orders,order_code',
        ]);

        // Set config Midtrans
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized  = (bool) config('midtrans.is_sanitized');
        Config::$is3ds        = (bool) config('midtrans.is_3ds');

        $order = Order::where('order_code', $request->order_code)->with('items')->firstOrFail();

        // Ambil status dari Midtrans
        $status = Transaction::status($order->order_code);

        $transactionStatus = $status->transaction_status ?? null; // capture/settlement/pending/deny/expire/cancel
        $fraudStatus       = $status->fraud_status ?? null;
        $paymentType       = $status->payment_type ?? null;       // credit_card, bank_transfer, gopay, qris, ...
        $trxId             = $status->transaction_id ?? null;

        // Decrement stok sekali saja saat status pertama kali jadi "paid"
        $decrementStockIfNotPaid = function () use ($order) {
            if ($order->status !== 'paid') {
                foreach ($order->items as $item) {
                    if ($product = Product::find($item->product_id)) {
                        $product->decrement('stock', $item->quantity);
                    }
                }
            }
        };

        if ($transactionStatus === 'capture') {
            if ($fraudStatus === 'accept') {
                $decrementStockIfNotPaid();
                $order->update([
                    'status'                   => 'paid',
                    'payment_date'             => now(),
                    'midtrans_transaction_id'  => $trxId,
                    'payment_type'             => $paymentType,
                    'payment_method'           => $this->mapPaymentMethodFromPaymentType($paymentType),
                ]);
            } else {
                $order->update([
                    'status'                   => 'waiting_confirmation',
                    'midtrans_transaction_id'  => $trxId,
                    'payment_type'             => $paymentType,
                    'payment_method'           => $this->mapPaymentMethodFromPaymentType($paymentType),
                ]);
            }
        } elseif ($transactionStatus === 'settlement') {
            $decrementStockIfNotPaid();
            $order->update([
                'status'                   => 'paid',
                'payment_date'             => now(),
                'midtrans_transaction_id'  => $trxId,
                'payment_type'             => $paymentType,
                'payment_method'           => $this->mapPaymentMethodFromPaymentType($paymentType),
            ]);
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $order->update([
                'status'                   => 'failed',
                'midtrans_transaction_id'  => $trxId,
                'payment_type'             => $paymentType,
                'payment_method'           => $this->mapPaymentMethodFromPaymentType($paymentType),
            ]);
        } elseif ($transactionStatus === 'pending') {
            $order->update([
                'status'                   => 'pending',
                'midtrans_transaction_id'  => $trxId,
                'payment_type'             => $paymentType,
                'payment_method'           => $this->mapPaymentMethodFromPaymentType($paymentType),
            ]);
        }

        return response()->json([
            'message' => 'Order verified',
            'order'   => $order->fresh(['user', 'items.product']),
        ], 200);
    }
}   