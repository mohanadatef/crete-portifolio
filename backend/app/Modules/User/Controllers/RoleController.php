<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Modules\User\Services\RoleService;
use App\Modules\User\DTOs\RoleDTO;
use App\Modules\User\Resources\RoleResource;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function __construct(private readonly RoleService $roleService)
    {
    }

    public function index(): JsonResponse
    {
        $roles = $this->roleService->getAllRoles();

        return $this->successResponse(
            RoleResource::collection($roles),
            'Roles retrieved successfully'
        );
    }

    public function permissions(): JsonResponse
    {
        $permissions = $this->roleService->getAllPermissions();

        return $this->successResponse(
            $permissions->pluck('name'),
            'Permissions retrieved successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $role = $this->roleService->getRoleById($id);

        return $this->successResponse(
            new RoleResource($role),
            'Role retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        $dto = RoleDTO::fromRequest($request);
        $role = $this->roleService->createRole($dto);

        return $this->successResponse(
            new RoleResource($role),
            'Role created successfully',
            201
        );
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name'
        ]);

        $dto = RoleDTO::fromRequest($request);
        $role = $this->roleService->updateRole($id, $dto);

        return $this->successResponse(
            new RoleResource($role),
            'Role updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->roleService->deleteRole($id);
            return $this->successResponse(null, 'Role deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
