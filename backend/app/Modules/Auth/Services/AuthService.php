<?php

namespace App\Modules\Auth\Services;

use App\Modules\Auth\DTOs\LoginDTO;
use Illuminate\Support\Facades\Auth;
use Exception;

class AuthService
{
    /**
     * Handle user login.
     *
     * @param LoginDTO $dto
     * @return array
     * @throws Exception
     */
    public function login(LoginDTO $dto): array
    {
        if (!Auth::attempt(['email' => $dto->email, 'password' => $dto->password])) {
            throw new Exception('Invalid credentials', 401);
        }

        $user = Auth::user();
        $user->load('roles.permissions');
        $token = $user->createToken('admin_token')->plainTextToken;

        return [
            'user' => new \App\Modules\User\Resources\UserResource($user),
            'token' => $token
        ];
    }

    /**
     * Handle user logout.
     *
     * @param \App\Models\User $user
     * @return void
     */
    public function logout($user): void
    {
        $user->currentAccessToken()->delete();
    }
}
