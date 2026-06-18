<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Modules\User\Services\UserService;
use App\Modules\User\DTOs\UserDTO;
use App\Modules\User\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        $users = $this->userService->getAllUsers($perPage);

        return $this->successResponse(
            UserResource::collection($users)->response()->getData(true),
            'Users retrieved successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUserById($id);

        return $this->successResponse(
            new UserResource($user),
            'User retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'roles' => 'nullable|array',
            'roles.*' => 'string|exists:roles,name'
        ]);

        $dto = UserDTO::fromRequest($request);
        $user = $this->userService->createUser($dto);

        return $this->successResponse(
            new UserResource($user),
            'User created successfully',
            201
        );
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:6',
            'roles' => 'nullable|array',
            'roles.*' => 'string|exists:roles,name'
        ]);

        $dto = UserDTO::fromRequest($request);
        $user = $this->userService->updateUser($id, $dto);

        return $this->successResponse(
            new UserResource($user),
            'User updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->userService->deleteUser($id);
            return $this->successResponse(null, 'User deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
