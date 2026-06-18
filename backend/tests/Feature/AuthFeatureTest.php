<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_repeated_wrong_login_returns_429()
    {
        // Hit the login endpoint 6 times with wrong credentials
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/admin/login', [
                'email' => 'wrong@admin.com',
                'password' => 'wrong'
            ]);
        }

        $response = $this->postJson('/api/v1/admin/login', [
            'email' => 'wrong@admin.com',
            'password' => 'wrong'
        ]);

        $response->assertStatus(429);
    }
}
