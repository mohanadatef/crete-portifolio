<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Modules\User\Services\RoleService;
use App\Modules\User\DTOs\RoleDTO;
use App\Modules\User\Resources\RoleResource;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;

class RoleController extends Controller
{
    public function __construct(private readonly RoleService $roleService)
    {
        $this->middleware('permission:view-roles')->only(['index', 'show']);
        $this->middleware('permission:create-roles')->only(['store']);
        $this->middleware('permission:edit-roles')->only(['update']);
        $this->middleware('permission:delete-roles')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $roles = $this->roleService->getAllRoles($request->all());

        return $this->successResponse(
            RoleResource::collection($roles)->response()->getData(true),
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

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $dto = RoleDTO::fromRequest($request);
        $role = $this->roleService->createRole($dto);

        return $this->successResponse(
            new RoleResource($role),
            'Role created successfully',
            201
        );
    }

    public function update(UpdateRoleRequest $request, int $id): JsonResponse
    {
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
