<?php

namespace App\Modules\Page\DTOs;

readonly class LandingPageDTO
{
    public function __construct(public array $data) {}

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self($request->all());
    }
}
