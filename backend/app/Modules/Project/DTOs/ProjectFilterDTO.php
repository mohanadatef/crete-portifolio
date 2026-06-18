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
            project_type_id: $request->input('project_type_id') !== null ? (int) $request->input('project_type_id') : null,
            location: $request->input('location'),
            status: $request->has('status') ? (int) $request->input('status') : null,
            search: $request->input('search'),
            minPrice: $request->has('min_price') ? (float) $request->input('min_price') : null,
            maxPrice: $request->has('max_price') ? (float) $request->input('max_price') : null,
            bedrooms: $request->has('bedrooms') ? (int) $request->input('bedrooms') : null
        );
    }
}
