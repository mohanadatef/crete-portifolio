<?php

namespace App\Modules\User\Services;

use App\Modules\User\Models\User;
use App\Modules\User\DTOs\UserDTO;
use Illuminate\Pagination\LengthAwarePaginator;
use Exception;

use App\Modules\User\DTOs\UserFilterDTO;
use Illuminate\Database\Eloquent\Builder;

class UserService
{
    public function getAllUsers(UserFilterDTO $filter): LengthAwarePaginator
    {
        $query = User::with('roles')->latest();

        if ($filter->search) {
            $query->where(function (Builder $q) use ($filter) {
                $q->where('name', 'like', '%' . $filter->search . '%')
                  ->orWhere('email', 'like', '%' . $filter->search . '%');
            });
        }

        if ($filter->role) {
            $query->whereHas('roles', function (Builder $q) use ($filter) {
                $q->where('name', $filter->role);
            });
        }

        return $query->paginate($filter->perPage, ['*'], 'page', $filter->page);
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
