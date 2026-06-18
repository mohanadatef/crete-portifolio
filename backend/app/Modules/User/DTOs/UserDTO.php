<?php

namespace App\Modules\User\DTOs;

use Illuminate\Http\Request;

class UserDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $password,
        public readonly array $roles = []
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            $request->input('name'),
            $request->input('email'),
            $request->input('password'),
            $request->input('roles', [])
        );
    }

    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'email' => $this->email,
        ];

        if ($this->password) {
            $data['password'] = bcrypt($this->password);
        }

        return $data;
    }
}
