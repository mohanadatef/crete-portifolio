<?php

namespace App\Modules\Project\DTOs;

readonly class ProjectFilterDTO
{
    public function __construct(
        public ?int $project_type_id = null,
        public ?string $location = null,
        public ?int $status = null,
        public ?string $search = null,
        public ?float $minPrice = null,
        public ?float $maxPrice = null,
        public ?int $bedrooms = null
    ) {
    }

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self(
            project_type_id: $request->filled('project_type_id') ? (int) $request->input('project_type_id') : null,
            location: $request->filled('location') ? $request->input('location') : null,
            status: $request->filled('status') ? (int) $request->input('status') : null,
            search: $request->filled('search') ? $request->input('search') : null,
            minPrice: $request->filled('min_price') ? (float) $request->input('min_price') : null,
            maxPrice: $request->filled('max_price') ? (float) $request->input('max_price') : null,
            bedrooms: $request->filled('bedrooms') ? (int) $request->input('bedrooms') : null
        );
    }
}
