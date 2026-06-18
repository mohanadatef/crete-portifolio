<?php

namespace App\Modules\Auth\DTOs;

readonly class LoginDTO
{
    public function __construct(
        public string $email,
        public string $password
    ) {
    }

    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self(
            email: $request->input('email'),
            password: $request->input('password')
        );
    }
}
