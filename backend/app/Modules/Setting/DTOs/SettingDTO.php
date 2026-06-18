<?php

namespace App\Modules\Setting\DTOs;

readonly class SettingDTO
{
    public function __construct(public array $data) {}

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self($request->all());
    }
}
