<?php

namespace App\Modules\ProjectType\DTOs;

class ProjectTypeDTO
{
    public function __construct(
        public readonly array $data
    ) {
    }

    public static function fromRequest(array $requestData): self
    {
        if (isset($requestData['is_active'])) {
            $requestData['is_active'] = filter_var($requestData['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        return new self([
            'name_ar' => $requestData['name_ar'] ?? null,
            'name_en' => $requestData['name_en'] ?? null,
            'slug' => $requestData['slug'] ?? null,
            'is_active' => $requestData['is_active'] ?? true,
        ]);
    }
}
