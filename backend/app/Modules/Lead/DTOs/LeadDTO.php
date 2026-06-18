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
        return new self(
            data: $request->except('recaptcha_token'),
            recaptchaToken: $request->input('recaptcha_token')
        );
    }
}
