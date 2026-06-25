<?php

namespace App\Modules\User\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Modules\User\Services\UserService;
use App\Modules\User\DTOs\UserDTO;
use App\Modules\User\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use App\Modules\User\DTOs\UserFilterDTO;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService)
    {
        $this->middleware('permission:view-users')->only(['index', 'show']);
        $this->middleware('permission:create-users')->only(['store']);
        $this->middleware('permission:edit-users')->only(['update']);
        $this->middleware('permission:delete-users')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $filter = UserFilterDTO::fromRequest($request);
        $users = $this->userService->getAllUsers($filter);

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

    public function store(StoreUserRequest $request): JsonResponse
    {
        $dto = UserDTO::fromRequest($request);
        $user = $this->userService->createUser($dto);

        return $this->successResponse(
            new UserResource($user),
            'User created successfully',
            201
        );
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $dto = UserDTO::fromRequest($request);
        
        try {
            $user = $this->userService->updateUser($id, $dto);
    
            return $this->successResponse(
                new UserResource($user),
                'User updated successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
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
