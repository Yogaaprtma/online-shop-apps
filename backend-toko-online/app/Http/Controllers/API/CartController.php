<?php

namespace App\Http\Controllers\API;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $items = $request->user()->cartItems()->with('product')->get();

        return response()->json([
            'message' => 'Isi Keranjang Berhasil Diambil',
            'data' => $items
        ], 200);
    }

    public function add(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::findOrFail($request->product_id);
        $newQuantity = $request->quantity;

        // Cek apakah kuantitas yang diminta melebihi stok yang tersedia
        if ($product->stock < $newQuantity) {
            return response()->json([
                'message' => 'Stok tidak mencukupi. Stok tersedia: ' . $product->stock, // Pesan lebih informatif
            ], 400);
        }

        $cart = Cart::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'product_id' => $request->product_id
            ],
            ['quantity' => $newQuantity] // Kuantitas akan di-set atau di-update ke nilai baru
        );

        return response()->json([
            'message' => 'Item berhasil ditambahkan/diperbarui di keranjang', // Pesan bisa lebih generik
            'data' => $cart->load('product') // Muat relasi produk agar data lengkap di frontend
        ], $cart->wasRecentlyCreated ? 201 : 200); // 201 untuk created, 200 untuk updated
    }

    public function remove(Request $request, $id)
    {
        $cart = Cart::findOrFail($id);

        if ($cart->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $cart->delete();

        return response()->json([
            'message' => 'Item Berhasil Dihapus Dari Keranjang'
        ], 200);
    }
}