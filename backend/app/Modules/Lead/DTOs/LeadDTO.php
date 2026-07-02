<?php

namespace App\Modules\Lead\DTOs;

readonly class LeadDTO
{
    public function __construct(
        public array $data,
        public ?string $recaptchaToken = null
    ) {
    }

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        $blockedFields = ['status', 'assigned_to', 'landing_page_id', 'id', 'created_at', 'updated_at'];
        $cleanData = array_diff_key($request->all(), array_flip(array_merge($blockedFields, ['recaptcha_token'])));

        return new self(
            data: $cleanData,
            recaptchaToken: $request->input('recaptcha_token')
        );
    }
}
