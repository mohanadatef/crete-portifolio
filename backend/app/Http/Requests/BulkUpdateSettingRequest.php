<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkUpdateSettingRequest extends FormRequest
{
    private const ALLOWED_KEYS = [
        'site_name',
        'site_logo',
        'seo_title',
        'google_tag',
        'google_conversion_id',
        'web_primary_color',
        'web_secondary_color',
        'admin_primary_color',
        'available_languages',
        'recaptcha_site_key',
        'recaptcha_secret_key',
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'mail_from_address',
        'mail_from_name',
        'mail_to_address',
        'client_thank_you_subject',
        'client_thank_you_body',
        'mail_client_enabled',
        'mail_agent_enabled',
        'social_links',
        'company_branches',
        'company_stats',
        'home_hero_title_en',
        'home_hero_title_ar',
        'home_hero_subtitle_en',
        'home_hero_subtitle_ar',
        'home_legacy_title_en',
        'home_legacy_title_ar',
        'home_legacy_desc_en',
        'home_legacy_desc_ar',
        'home_partners',
        'home_construction_updates',
        'home_hero_bg',
        'recaptcha_enabled',
    ];

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            '*' => 'nullable', // Validate dynamic settings keys values
        ];
    }

    /**
     * Handle a passed validation attempt.
     */
    protected function passedValidation(): void
    {
        // Enforce allow-list filtering of keys
        $filtered = array_intersect_key($this->all(), array_flip(self::ALLOWED_KEYS));
        
        // Overwrite the request parameters with only filtered keys
        $this->replace($filtered);
    }
}
