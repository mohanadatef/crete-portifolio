<?php

namespace App\Modules\Blog\DTOs;

readonly class BlogCategoryDTO
{
    public function __construct(public array $data) {}

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self($request->all());
    }
}
