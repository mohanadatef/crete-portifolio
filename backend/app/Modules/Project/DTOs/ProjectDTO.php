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
        $data = $request->except('images');

        if (isset($data['project_type_id'])) {
            $data['project_type_id'] = (int) $data['project_type_id'];
        }

        return new self(
            data: $data,
            images: $request->file('images')
        );
    }
}
