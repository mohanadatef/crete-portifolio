<?php

namespace App\Modules\User\Services;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Modules\User\DTOs\RoleDTO;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RoleService
{
    public function getAllRoles(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Role::with('permissions')->withCount('users');
        
        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        $perPage = $filters['per_page'] ?? 10;
        
        return $query->paginate($perPage);
    }

    public function getAllPermissions(): Collection
    {
        return Permission::all();
    }

    public function getRoleById(int $id): Role
    {
        return Role::with('permissions')->findOrFail($id);
    }

    public function createRole(RoleDTO $dto): Role
    {
        $role = Role::create(['name' => $dto->name, 'guard_name' => 'sanctum']);

        if (!empty($dto->permissions)) {
            $role->syncPermissions($dto->permissions);
        }

        return $role->load('permissions');
    }

    public function updateRole(int $id, RoleDTO $dto): Role
    {
        $role = $this->getRoleById($id);
        
        $role->update(['name' => $dto->name]);

        if (isset($dto->permissions)) {
            $role->syncPermissions($dto->permissions);
        }

        return $role->load('permissions');
    }

    public function deleteRole(int $id): bool
    {
        $role = $this->getRoleById($id);
        
        if ($role->name === 'Super Admin') {
            throw new \Exception("You cannot delete the Super Admin role.");
        }

        if ($role->users()->count() > 0) {
            throw new \Exception("Cannot delete this role because it has users assigned to it.");
        }

        return $role->delete();
    }
}
