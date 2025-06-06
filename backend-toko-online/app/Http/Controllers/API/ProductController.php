<?php

namespace App\Http\Controllers\API;

use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::all();

        return response()->json([
            'message' => 'Produk Berhasil Diambil',
            'data' => $products
        ], 200);
    }

    public function show($id)
    {
        $product = Product::findOrFail($id);

        return response()->json([
            'message' => 'Produk Berhasil Diambil',
            'data' => $product
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_product' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $product = Product::create([
            'name_product' => $request->name_product,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'image' => $imagePath,
        ]);

        return response()->json([
            'message' => 'Produk Berhasil Ditambahkan',
            'data' => $product
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name_product' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        $product = Product::findOrFail($id);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $fileName = time() . '_' . $file->getClientOriginalName();
        
            // Simpan gambar baru
            $file->storeAs('products', $fileName, 'public');
        
            // Hapus gambar lama jika ada
            if ($product->image && file_exists(public_path('storage/' . $product->image))) {
                unlink(public_path('storage/' . $product->image));
            }
        
            // Update path gambar di database
            $product->image = 'products/' . $fileName;
            $product->save();
        }        
    
        $product->update([
            'name_product' => $request->name_product,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
        ]);
    
        return response()->json([
            'message' => 'Product Berhasil Diperbarui',
            'data' => $product
        ], 200);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        $product->delete();

        return response()->json([
            'message' => 'Produk Berhasil Dihapus'
        ], 200);
    }
}