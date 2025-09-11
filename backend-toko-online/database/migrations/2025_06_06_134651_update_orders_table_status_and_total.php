<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', [
                'pending', 
                'waiting_confirmation', 
                'paid', 
                'processing', 
                'shipped', 
                'completed', 
                'cancelled',
                'failed'
            ])->default('pending')->change();
            $table->decimal('total', 20, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'waiting_confirmation', 'paid', 'failed'])->default('pending')->change();
            $table->integer('total')->default(1)->change();
        });
    }
};
