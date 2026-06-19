<?php

namespace App\Modules\User\DTOs;

class UserFilterDTO
{
    public function __construct(
        public readonly ?string $search = null,
        public readonly ?string $role = null,
        public readonly ?string $status = null,
        public readonly int $perPage = 15,
        public readonly int $page = 1
    ) {
    }

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self(
            search: $request->input('search'),
            role: $request->input('role'),
            status: $request->input('status'),
            perPage: (int) $request->input('per_page', 15),
            page: (int) $request->input('page', 1)
        );
    }
}
