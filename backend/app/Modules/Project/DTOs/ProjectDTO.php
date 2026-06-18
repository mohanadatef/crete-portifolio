<?php

namespace App\Modules\Project\DTOs;

readonly class ProjectDTO
{
    public function __construct(
        public array $data,
        public ?array $images = null
    ) {
    }

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self(
            data: $request->except('images'),
            images: $request->file('images')
        );
    }
}
