<?php

namespace App\Modules\User\Services;

use App\Modules\User\Models\User;
use App\Modules\User\DTOs\UserDTO;
use Illuminate\Pagination\LengthAwarePaginator;
use Exception;

class UserService
{
    public function getAllUsers(int $perPage = 15): LengthAwarePaginator
    {
        return User::with('roles')->latest()->paginate($perPage);
    }

    public function getUserById(int $id): User
    {
        return User::with('roles')->findOrFail($id);
    }

    public function createUser(UserDTO $dto): User
    {
        $user = User::create($dto->toArray());

        if (!empty($dto->roles)) {
            $user->syncRoles($dto->roles);
        }

        return $user->load('roles');
    }

    public function updateUser(int $id, UserDTO $dto): User
    {
        $user = $this->getUserById($id);
        
        $user->update($dto->toArray());

        if (isset($dto->roles)) {
            $user->syncRoles($dto->roles);
        }

        return $user->load('roles');
    }

    public function deleteUser(int $id): bool
    {
        $user = $this->getUserById($id);
        
        if ($user->id === auth()->id()) {
            throw new Exception("You cannot delete yourself.");
        }

        return $user->delete();
    }
}
