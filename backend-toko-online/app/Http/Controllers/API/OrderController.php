<?php

namespace App\Http\Controllers\API;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $cartItems = $user->cartItems()->with('product')->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'message' => 'Keranjang Kosong'
            ], 400);
        }

        $request->validate([
            'payment_method' => 'required|in:bank_transfer,cod,e_wallet'
        ]);

        DB::beginTransaction();

        try {
            $total = $cartItems->sum(fn($item) => $item->product->price * $item->quantity);

            $status = $request->payment_method === 'cod' ? 'paid' : 'pending';

            $order = Order::create([
                'user_id' => $user->id,
                'total' => $total,
                'status' => 'pending',
                'payment_method' => $request->payment_method,
            ]);

            foreach ($cartItems as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product->id,
                    'quantity' => $item->quantity,
                    'price' => $item->product->price,
                ]);
            }

            $user->cartItems()->delete();

            DB::commit();
            return response()->json([
                'message' => 'Checkout Berhasil', 
                'order' => $order->load('items.product')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Checkout gagal'], 500);
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
            return response()->json([
                'message' => 'Bukti Pembayaran Sudah Diunggah.'
            ], 400);
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

        if (!$order->payment_proof) {
            return response()->json([
                'message' => 'Belum Ada Bukti Pembayaran'
            ], 400);
        }

        $order->update([
            'status' => 'paid',
            'payment_date' => now()
        ]);

        return response()->json([
            'message' => 'Pembayaran Telah Dikonfirmasi',
            'order' => $order
        ]);
    }
}   