<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\Lead;
use Illuminate\Support\Facades\Http;
use App\Models\User;

class LeadSubmissionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_valid_lead_is_stored_and_returns_201()
    {
        // Mock the reCAPTCHA response
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true, 'score' => 0.9], 200)
        ]);

        $response = $this->postJson('/api/v1/public/leads', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '+1234567890',
            'message' => 'Test message',
            'recaptcha_token' => 'valid_token'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leads', ['email' => 'john@example.com']);
    }

    public function test_missing_recaptcha_returns_422()
    {
        $response = $this->postJson('/api/v1/public/leads', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '+1234567890',
            'message' => 'Test message'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['recaptcha_token']);
    }

    public function test_unconfirmed_delete_returns_422()
    {
        $admin = User::factory()->create();
        $lead = Lead::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '1234567890',
            'message' => 'test message'
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/leads/{$lead->id}");
        
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['confirm']);
        $this->assertDatabaseHas('leads', ['id' => $lead->id]);
    }
}
