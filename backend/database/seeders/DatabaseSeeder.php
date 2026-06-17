<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
        ]);

        \App\Models\Setting::create([
            'key' => 'seo_title',
            'value' => 'CRETE Developments | Premium Real Estate'
        ]);

        \App\Models\Setting::create([
            'key' => 'google_tag',
            'value' => "<!-- Google Tag Manager default script -->\n<script>console.log('Google Tag Script Injected Dynamicially!');</script>"
        ]);
    }
}
