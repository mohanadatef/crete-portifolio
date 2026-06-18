<?php

namespace App\Modules\User\Services;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Modules\User\DTOs\RoleDTO;
use Illuminate\Database\Eloquent\Collection;

class RoleService
{
    public function getAllRoles(): Collection
    {
        return Role::with('permissions')->get();
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

        return $role->delete();
    }
}
