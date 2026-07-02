<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Modules\Page\Models\LandingPage;
use App\Modules\Lead\Models\Lead;
use Illuminate\Support\Facades\Http;

class LandingPageSubmissionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_landing_page_form_submission_succeeds_with_valid_data()
    {
        // Mock reCAPTCHA
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true, 'score' => 0.9], 200)
        ]);

        // Create a landing page with a form schema
        $landingPage = LandingPage::create([
            'slug' => 'test-landing-page',
            'title_ar' => 'صفحة هبوط تجريبية',
            'title_en' => 'Test Landing Page',
            'status' => true,
            'form_schema' => [
                [
                    'name' => 'full_name',
                    'type' => 'text',
                    'label_en' => 'Name',
                    'label_ar' => 'الاسم',
                    'required' => true
                ],
                [
                    'name' => 'email_address',
                    'type' => 'email',
                    'label_en' => 'Email',
                    'label_ar' => 'البريد الإلكتروني',
                    'required' => true
                ]
            ]
        ]);

        $response = $this->postJson("/api/v1/public/landing-pages/{$landingPage->slug}/submit", [
            'full_name' => 'Jane Doe',
            'email_address' => 'jane@example.com',
            'recaptcha_token' => 'valid_token',
            'privacy_consent' => true
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leads', [
            'landing_page_id' => $landingPage->id,
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'privacy_consent' => true
        ]);
    }

    public function test_landing_page_form_submission_fails_without_consent()
    {
        // Mock reCAPTCHA
        Http::fake([
            'https://www.google.com/recaptcha/api/siteverify' => Http::response(['success' => true, 'score' => 0.9], 200)
        ]);

        $landingPage = LandingPage::create([
            'slug' => 'test-landing-page-no-consent',
            'title_ar' => 'صفحة هبوط تجريبية',
            'title_en' => 'Test Landing Page',
            'status' => true,
            'form_schema' => [
                [
                    'name' => 'full_name',
                    'type' => 'text',
                    'label_en' => 'Name',
                    'label_ar' => 'الاسم',
                    'required' => true
                ]
            ]
        ]);

        $response = $this->postJson("/api/v1/public/landing-pages/{$landingPage->slug}/submit", [
            'full_name' => 'Jane Doe',
            'recaptcha_token' => 'valid_token'
            // Missing privacy_consent
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['privacy_consent']);
    }
}
