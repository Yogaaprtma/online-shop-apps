<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users',
            'no_telp' => 'required|string',
            'alamat' => 'required|string|max:255',
            'password' => 'required|min:8',
            'role' => 'sometimes|in:admin,user'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'nama' => $request->nama,
            'email' => $request->email,
            'no_telp' => $request->no_telp,
            'alamat' => $request->alamat,
            'role' => $request->input('role', 'user'),
            'password' => bcrypt($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Register Berhasil',
            'token' => $token,
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login Berhasil',
            'token' => $token,
            'user' => $user
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'message' => 'Pengguna Berhasil Diambil',
            'data' => $request->user(),
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nama'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email,' . $user->id,
            'no_telp'   => 'required|string|unique:users,no_telp,' . $user->id,
            'alamat'    => 'required|string|max:500',
            'password'  => 'nullable|string|min:6|confirmed'
        ]);

        // Jangan izinkan role diubah via payload
        unset($validated['role']);

        // Password opsional
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile berhasil diperbarui',
            'data' => $user->fresh()
        ], 200);
    }

    public function listUsers()
    {
        $users = User::orderBy('nama', 'asc')->get();
        return response()->json([
            'message' => 'Daftar pengguna berhasil diambil',
            'data' => $users
        ], 200);
    }

    public function storeUserByAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users',
            'no_telp' => 'required|string',
            'alamat' => 'required|string|max:255',
            'password' => 'required|min:8',
            'role' => 'sometimes|in:admin,user'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'nama' => $request->nama,
            'email' => $request->email,
            'no_telp' => $request->no_telp,
            'alamat' => $request->alamat,
            'role' => $request->input('role', 'user'),
            'password' => bcrypt($request->password),
        ]);

        return response()->json([
            'message' => 'Pengguna berhasil ditambahkan oleh Admin',
            'data' => $user
        ], 201);
    }

    public function showUser($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail pengguna berhasil diambil',
            'data' => $user
        ], 200);
    }

    public function updateUserByAdmin(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id, // Kecualikan user yang sedang diedit
            'no_telp' => 'required|string',
            'alamat' => 'required|string|max:255',
            'password' => 'sometimes|min:8', // Ubah menjadi sometimes agar opsional
            'role' => 'sometimes|in:admin,user'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $dataToUpdate = $request->only(['nama', 'email', 'no_telp', 'alamat', 'role']);

        if ($request->filled('password')) {
            $dataToUpdate['password'] = bcrypt($request->password);
        }

        $user->update($dataToUpdate);

        return response()->json([
            'message' => 'Data pengguna berhasil diperbarui oleh Admin',
            'data' => $user->fresh()
        ], 200);
    }

    public function destroyUser($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Pengguna tidak ditemukan'], 404);
        }

        if (Auth::id() == $user->id) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Anda sendiri.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Pengguna berhasil dihapus'], 200);
    }

    public function countUsers()
    {
        $totalUsers = User::count();
        return response()->json([
            'message' => 'Jumlah Pengguna Berhasil Diambil',
            'data' => $totalUsers
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logout Berhasil']);
    }
}