<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the Graduate School database for tests and developments.
     */
    public function run(): void
    {
        // 1. Generate Demo Users
        $password = Hash::make('password123');

        $users = [
            [
                'name' => 'Demo Student',
                'email' => 'student@uic.edu.ph',
                'role' => 'student',
                'password' => $password,
            ],
            [
                'name' => 'Demo Admin Assistant',
                'email' => 'aa@uic.edu.ph',
                'role' => 'aa',
                'password' => $password,
            ],
            [
                'name' => 'Demo Coordinator',
                'email' => 'coordinator@uic.edu.ph',
                'role' => 'coordinator',
                'password' => $password,
            ],
            [
                'name' => 'Demo Registrar',
                'email' => 'registrar@uic.edu.ph',
                'role' => 'registrar',
                'password' => $password,
            ],
            [
                'name' => 'Demo Dean',
                'email' => 'dean@uic.edu.ph',
                'role' => 'dean',
                'password' => $password,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        // 2. Call existing Defense Request Seeder
        $this->call([
            DefenseRequestSeeder::class,
        ]);
    }
}