<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin ASMAW',
                'email' => 'admin@asmaw.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_banned' => false,
            ],
            [
                'name' => 'Staff One',
                'email' => 'staff@asmaw.com',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'is_banned' => false,
            ],
            [
                'name' => 'Shipper Express',
                'email' => 'shipper@asmaw.com',
                'password' => Hash::make('password'),
                'role' => 'shipper',
                'is_banned' => false,
            ],
            [
                'name' => 'Tuan Khach Hang',
                'email' => 'customer@gmail.com',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'is_banned' => false,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
