<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'nama' => 'Admin',
            'email' => 'admin@example.com',
            'no_telp' => '082110778946',
            'alamat' => 'PATI',
            'role' => 'admin',
            'password' => bcrypt('12345678')
        ]);
    }
}
