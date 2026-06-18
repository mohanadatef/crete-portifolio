<?php

namespace App\Modules\User\DTOs;

use Illuminate\Http\Request;

class RoleDTO
{
    public function __construct(
        public readonly string $name,
        public readonly array $permissions = []
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            $request->input('name'),
            $request->input('permissions', [])
        );
    }
}
