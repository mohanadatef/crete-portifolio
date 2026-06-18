<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Modules\User\Models\User;
use App\Modules\Lead\Models\Lead;

class LeadFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_lead_registration_returns_201()
    {
        \Illuminate\Support\Facades\Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => \Illuminate\Support\Facades\Http::response(['success' => true, 'score' => 0.9], 200)
        ]);

        $response = $this->postJson('/api/v1/public/leads', [
            'name' => 'Lead Test',
            'email' => 'lead@test.com',
            'phone' => '01000000000',
            'privacy_consent' => true,
            'recaptcha_token' => 'valid_token'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leads', [
            'email' => 'lead@test.com'
        ]);
    }

    public function test_lead_deletion_without_confirm_returns_422()
    {
        $user = User::create([
            'name' => 'Admin Test',
            'email' => 'admintest' . rand(1, 1000) . '@admin.com',
            'password' => bcrypt('password')
        ]);
        $lead = Lead::create([
            'name' => 'Lead Test',
            'email' => 'leadtest' . rand(1, 1000) . '@test.com',
            'phone' => '123456789'
        ]);

        $response = $this->actingAs($user)->deleteJson("/api/v1/admin/leads/{$lead->id}");
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['confirm']);
    }
}
