<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\CartController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Midtrans Notification Endpoint (tanpa autentikasi)
Route::post('/midtrans/notification', [OrderController::class, 'handleMidtransNotification']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/users/count', [AuthController::class, 'countUsers']);
    Route::post('/midtrans/verify', [OrderController::class, 'verify']);

    // Public (User & Admin)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    
    Route::middleware('role:admin')->group(function () {
        // Kelola User
        Route::get('/admin/users', [AuthController::class, 'listUsers']);
        Route::post('/admin/users', [AuthController::class, 'storeUserByAdmin']);   
        Route::get('/admin/users/{id}', [AuthController::class, 'showUser']);     
        Route::put('/admin/users/{id}', [AuthController::class, 'updateUserByAdmin']);  
        Route::delete('/admin/users/{id}', [AuthController::class, 'destroyUser']); 

        // CRUD Product
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);

        // Order List
        Route::get('/admin/orders', [OrderController::class, 'index']);
        Route::get('/admin/orders/{id}', [OrderController::class, 'show']);
        Route::post('/admin/orders/{id}/confirm', [OrderController::class, 'confirmPayment']);
        Route::post('/admin/orders/{id}/status', [OrderController::class, 'updateStatus']);

        // Report
        Route::get('/admin/reports/sales/download/{format}', [ReportController::class, 'downloadSalesReport']);
    });

    Route::middleware('role:user')->group(function () {
        // Cart
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart', [CartController::class, 'add']);
        Route::delete('/cart/{id}', [CartController::class, 'remove']);

        // Checkout
        Route::post('/checkout', [OrderController::class, 'checkout']);
        Route::get('/orders', [OrderController::class, 'userOrders']);
        Route::get('/orders/{id}', [OrderController::class, 'userOrderDetail']);
        
        Route::post('/orders/{id}/pay', [OrderController::class, 'pay']);
    });
});